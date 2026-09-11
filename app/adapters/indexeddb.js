// Hiện thực cổng `noteStore` bằng IndexedDB (AD-2, AD-9, AD-13).
//
// Đây là một trong hai file duy nhất dưới `app/` được chạm kho bền của trình duyệt, và nó
// không biết gì về state hay view: nó nhận bản ghi, đưa xuống đĩa, và trả về một lời hứa.
// Lỗi đi ngược lên action rồi mới ra dải băng (AD-8) — adapter KHÔNG gọi vào view, KHÔNG
// `console.*`, KHÔNG nuốt lỗi.
//
// MỞ KHO LƯỜI, không mở lúc import. `test/trang-tinh.test.js` import động `app/main.js` ở
// Node để nghiệm thu rằng nó là một ES module nạp được thật, và `main.js` dựng tập cổng ngay
// ở top-level. Mở kho lúc dựng factory thì lệnh import đó ném `indexedDB is not defined` và
// một test không liên quan gì tới kho dữ liệu bỗng đỏ. Nên factory chỉ ghi nhớ một lời hứa,
// và lời hứa đó chỉ được tạo ở lần gọi phương thức ĐẦU TIÊN.
//
// Lời hứa mở kho bị từ chối thì được QUÊN đi, để lần gọi sau thử lại. Nhớ mãi một lần hỏng
// biến một trục trặc nhất thời (một tab khác đang giữ phiên bản cũ) thành hỏng vĩnh viễn cho
// tới khi tải lại trang.
//
// Hai trường dẫn xuất được TÍNH LẠI ở mọi lần ghi, không bao giờ nhận từ bên ngoài (AD-13):
// một bản ghi chỉ có đúng năm trường, và `localDate`/`textFolded` luôn là hàm của
// `createdAt`/`text` chứ không phải hai giá trị người gọi tiện tay đưa vào.
//
// Store `drafts` được tạo ngay ở phiên bản 1 dù Story 1.6 không dùng nó: quy tắc khởi động
// bản nháp thuộc Story 1.7, nhưng nếu schema không chừa sẵn chỗ thì story đó phải bump phiên
// bản kho — tức một đường nâng cấp thật, cho một object store rỗng.

import { MA_LOI, loiUngDung } from '../core/errors.js';
import { fold } from '../core/fold.js';
import { quyetDinhBanNhap } from '../core/draft.js';
import { localDate } from '../core/time.js';

/** Tên kho, tên store và tên index — tiền tố `ghichu` là ràng buộc của AD-9. */
const TEN_KHO = 'ghichu';
const PHIEN_BAN_KHO = 1;
const STORE_NOTES = 'notes';
const STORE_DRAFTS = 'drafts';
const KHOA_NOTES = 'id';
const KHOA_DRAFTS = 'tabId';
const INDEX_NGAY = 'localDate';

/** Tên lỗi mà trình duyệt dùng cho "hết dung lượng" — cửa duy nhất vào mã `QUOTA` (AD-10). */
const TEN_LOI_HET_CHO = 'QuotaExceededError';

/**
 * Mã AD-18 cho một lỗi thô của kho: hết chỗ thì `QUOTA`, mọi hỏng hóc khác thì `DB`.
 *
 * Không có nhánh thứ ba: một lỗi không đoán được tên vẫn phải ra một mã thuộc tập đóng, vì
 * `errors.js` ném khi gặp mã lạ và người dùng sẽ thấy một trang vỡ thay vì một dải băng.
 */
function maCuaLoi(loi) {
  return loi != null && loi.name === TEN_LOI_HET_CHO ? MA_LOI.QUOTA : MA_LOI.DB;
}

/** Bản ghi đúng năm trường của AD-13, với hai trường dẫn xuất tính lại tại chỗ. */
function banGhiChuan(note) {
  const createdAt = note.createdAt;
  const text = note.text;
  return {
    id: note.id,
    createdAt,
    localDate: localDate({ createdAt }),
    text,
    textFolded: fold(text),
  };
}

/** Bản nháp đúng ba trường của AD-3 tầng B, không hơn. */
function banNhapChuan(draft) {
  return { tabId: draft.tabId, text: draft.text, heartbeat: draft.heartbeat };
}

/** Tiền tố khóa sống của một tab — cùng tiền tố `ghichu` của AD-9. */
const TIEN_TO_KHOA = 'ghichu.tab.';

/**
 * Thử giữ khóa sống của một danh tính tab, và giữ nó cho tới khi tab chết.
 *
 * Đây là thứ thay cho phép suy đoán bằng nhịp tim ở bước 1 của AD-3. Nhịp tim không phân biệt
 * được "một tab khác đang sống" với "chính tôi vừa tải lại": kho phạm vi phiên sống sót qua
 * một lần tải lại, nên tab mới đọc ra đúng danh tính cũ và thấy một bản ghi mà CHÍNH NÓ vừa
 * viết vài giây trước. Khóa thì không đoán: trình duyệt nhả nó khi tài liệu giữ nó biến mất,
 * nên "khóa đang bị giữ" là bằng chứng thật rằng một tài liệu khác còn sống.
 *
 * Lời hứa trong thân khóa KHÔNG BAO GIỜ hoàn tất, có chủ ý — đó là cách giữ khóa suốt đời tab.
 * Không có nhánh dự phòng khi API khóa vắng mặt: AD-12 đã chốt app chỉ chạy ở HTTPS hoặc
 * `localhost`, cùng lý do `crypto.randomUUID` ở đây cũng không có nhánh dự phòng.
 *
 * @param {string} tabId Danh tính cần giữ.
 * @returns {Promise<boolean>} `true` nếu giữ được, `false` nếu một tài liệu khác đang giữ.
 */
function giuKhoaTab(tabId) {
  return new Promise((traLoi) => {
    navigator.locks
      .request(`${TIEN_TO_KHOA}${tabId}`, { ifAvailable: true }, (khoa) => {
        traLoi(khoa !== null);
        return khoa === null ? undefined : new Promise(() => {});
      })
      // Không có khóa thì không chứng minh được ai đang sống. Coi như danh tính đã có chủ:
      // sinh một danh tính mới là lựa chọn an toàn, vì nó không bao giờ lấy mất của ai.
      .catch(() => traLoi(false));
  });
}

/**
 * Áp dụng bản kế hoạch của AD-3 lên store đang mở — mọi phép ghi/xóa phát ra ĐỒNG BỘ tại đây.
 *
 * Phát ra ngay trong callback đã đọc danh sách là toàn bộ lý do quy tắc này nguyên tử: một
 * giao dịch tự đóng khi vòng lặp sự kiện nhả ra mà không còn yêu cầu treo.
 */
function apDungKeHoach(store, keHoach) {
  for (const khoa of keHoach.xoa) {
    store.delete(khoa);
  }
  if (keHoach.ghi !== null) store.put(banNhapChuan(keHoach.ghi));
  return keHoach.text;
}

/**
 * BƯỚC 1 của AD-3 — chốt danh tính của tab này bằng khóa sống, không bằng nhịp tim.
 *
 * Giữ được khóa của danh tính đang có nghĩa là không tài liệu nào khác đang cầm nó, kể cả khi
 * kho còn một bản ghi mang nhịp tim mới tinh: bản ghi đó là của chính tab này ở lần tải trang
 * trước. Không giữ được nghĩa là một tab khác thật sự đang sống với cùng danh tính — Nam vừa
 * nhân đôi tab, và kho phạm vi phiên được sao chép theo — nên sinh danh tính mới và giữ khóa
 * của nó. Khóa mới vừa sinh thì không bao giờ có ai tranh, nên không cần kiểm kết quả.
 */
function danhTinhDaChot(tabId) {
  return giuKhoaTab(tabId).then((laCuaMinh) => {
    if (laCuaMinh) return tabId;
    const moi = crypto.randomUUID();
    return giuKhoaTab(moi).then(() => moi);
  });
}

/**
 * Dựng một hiện thực của cổng `noteStore`.
 *
 * @returns {{ readAll: Function, put: Function, remove: Function, replaceAll: Function,
 *   claimDraft: Function, putDraft: Function }}
 *   Cổng kho ghi chú bền; mọi phương thức bất đồng bộ và TỪ CHỐI lời hứa khi hỏng.
 */
export function taoNoteStore() {
  /** Lời hứa mở kho, tạo ở lần gọi đầu tiên rồi dùng lại. `null` = chưa mở lần nào. */
  let loiHuaMoKho = null;

  function taoStoreTrongKho(kho) {
    if (!kho.objectStoreNames.contains(STORE_NOTES)) {
      const store = kho.createObjectStore(STORE_NOTES, { keyPath: KHOA_NOTES });
      // Index phục vụ lọc theo ngày của FR-13. Tạo ở đây chứ không ở story dùng nó, vì thêm
      // một index sau là một lần bump phiên bản kho.
      store.createIndex(INDEX_NGAY, INDEX_NGAY, { unique: false });
    }
    if (!kho.objectStoreNames.contains(STORE_DRAFTS)) {
      kho.createObjectStore(STORE_DRAFTS, { keyPath: KHOA_DRAFTS });
    }
  }

  function moKho() {
    if (loiHuaMoKho === null) {
      loiHuaMoKho = new Promise((xong, hong) => {
        let yeuCau;
        try {
          yeuCau = indexedDB.open(TEN_KHO, PHIEN_BAN_KHO);
        } catch (loi) {
          hong(loiUngDung(maCuaLoi(loi)));
          return;
        }
        let daTuChoi = false;
        yeuCau.onupgradeneeded = () => taoStoreTrongKho(yeuCau.result);
        yeuCau.onsuccess = () => {
          const kho = yeuCau.result;
          if (daTuChoi) {
            // `onblocked` đã từ chối rồi mà kết nối vẫn mở được sau đó: không ai còn cầm nó,
            // nên nó là một kết nối mồ côi — và một kết nối mồ côi chính là thứ sẽ CHẶN lần
            // nâng cấp sau. Đóng lại thay vì để nó sống tới lúc tải lại trang.
            kho.close();
            return;
          }
          // Một tab khác muốn nâng cấp kho: nhả kết nối ra ngay, nếu không tab kia bị chặn.
          // Quên luôn lời hứa, để lần gọi sau mở lại ở phiên bản mới.
          kho.onversionchange = () => {
            kho.close();
            loiHuaMoKho = null;
          };
          xong(kho);
        };
        yeuCau.onerror = () => {
          daTuChoi = true;
          hong(loiUngDung(maCuaLoi(yeuCau.error)));
        };
        // Một tab khác còn giữ kho ở phiên bản cũ: không mở được BÂY GIỜ, nhưng lần sau thì
        // có thể — nên nó là `DB`, và lời hứa hỏng bị quên đi ngay dưới đây.
        yeuCau.onblocked = () => {
          daTuChoi = true;
          hong(loiUngDung(MA_LOI.DB));
        };
      });
      loiHuaMoKho.catch(() => {
        loiHuaMoKho = null;
      });
    }
    return loiHuaMoKho;
  }

  /**
   * Chạy `thanTac(store)` trong một giao dịch, và chỉ báo THÀNH CÔNG khi giao dịch đã chốt.
   *
   * Chốt ở `oncomplete` chứ không ở `onsuccess` của từng yêu cầu là điều làm FR-19 đúng: một
   * yêu cầu thành công trong một giao dịch sau đó bị cuộn ngược thì chữ KHÔNG nằm trên đĩa,
   * và báo thành công lúc đó chính là "giả vờ đã lưu".
   */
  function trongGiaoDich(tenStore, cheDo, thanTac) {
    return moKho().then(
      (kho) =>
        new Promise((xong, hong) => {
          let giaoDich;
          try {
            giaoDich = kho.transaction([tenStore], cheDo);
          } catch (loi) {
            hong(loiUngDung(maCuaLoi(loi)));
            return;
          }
          let ketQuaGiaoDich;
          // Lỗi của YÊU CẦU trước, lỗi của giao dịch sau. Khi một yêu cầu hỏng, lỗi nổi bọt
          // lên giao dịch NHƯNG giao dịch chưa hủy, nên `giaoDich.error` còn `null` — đọc mỗi
          // chỗ đó thì một `QuotaExceededError` thật tụt xuống thành `DB`, và người dùng nhận
          // câu "không mở được kho" thay vì câu bảo họ xuất sao lưu. Đây đúng là đường FR-19.
          const loiCuaSuKien = (suKien) =>
            (suKien != null && suKien.target != null ? suKien.target.error : null) ??
            giaoDich.error;
          giaoDich.oncomplete = () => xong(ketQuaGiaoDich);
          giaoDich.onerror = (suKien) => hong(loiUngDung(maCuaLoi(loiCuaSuKien(suKien))));
          giaoDich.onabort = (suKien) => hong(loiUngDung(maCuaLoi(loiCuaSuKien(suKien))));
          try {
            const yeuCau = thanTac(giaoDich.objectStore(tenStore));
            if (yeuCau != null) {
              yeuCau.onsuccess = () => {
                ketQuaGiaoDich = yeuCau.result;
              };
              // Không nuốt lỗi ở đây — chỉ để `yeuCau.error` sẵn sàng cho `loiCuaSuKien`; lỗi
              // vẫn nổi bọt lên giao dịch, và giao dịch mới là chỗ từ chối lời hứa.
              yeuCau.onerror = () => {};
            }
          } catch (loi) {
            // Ném đồng bộ giữa chừng: hủy giao dịch để không để lại một nửa trên đĩa. `abort`
            // sẽ kích `onabort` ở trên, nhưng từ chối ngay tại đây để mã lỗi là mã của cái
            // hỏng THẬT chứ không phải `giaoDich.error` rỗng.
            try {
              giaoDich.abort();
            } catch {
              // Giao dịch đã tự kết thúc rồi — không còn gì để hủy.
            }
            hong(loiUngDung(maCuaLoi(loi)));
          }
        }),
    );
  }

  return {
    readAll() {
      return trongGiaoDich(STORE_NOTES, 'readonly', (store) => store.getAll()).then(
        (danhSach) => danhSach ?? [],
      );
    },

    put(note) {
      return trongGiaoDich(STORE_NOTES, 'readwrite', (store) =>
        store.put(banGhiChuan(note)),
      ).then(() => undefined);
    },

    remove(id) {
      return trongGiaoDich(STORE_NOTES, 'readwrite', (store) => store.delete(id)).then(
        () => undefined,
      );
    },

    /**
     * Bốn bước khởi động bản nháp của AD-3: bước 1 chốt danh tính bằng khóa sống, ba bước còn
     * lại chạy TRỌN VẸN trong một giao dịch `readwrite`.
     *
     * Bước 1 nằm NGOÀI giao dịch vì nó phải vậy — xin khóa là bất đồng bộ, và một `await` chen
     * vào giữa sẽ giết giao dịch. Nó không cần nguyên tử: khóa tự nó đã là phép loại trừ lẫn
     * nhau, và hai tab không bao giờ chốt cùng một danh tính. Cái CẦN nguyên tử là phép nhận
     * bản bỏ rơi ở bước 3, và phép đó vẫn nằm trọn trong giao dịch dưới đây.
     *
     * Một `getAll()` rồi quyết định ĐỒNG BỘ ngay trong `onsuccess`, và mọi phép ghi/xóa phát ra
     * từ chính handler đó: một giao dịch tự đóng khi vòng lặp sự kiện nhả ra mà không còn yêu
     * cầu treo, nên chuỗi `await` nối nhau sẽ giết giao dịch giữa chừng và tính nguyên tử —
     * thứ duy nhất chặn hai tab cùng nhận một bản nháp — biến mất trong im lặng.
     */
    claimDraft({ tabId, now, staleMs }) {
      return danhTinhDaChot(tabId).then((danhTinh) => {
        let ketQua = { tabId: danhTinh, text: '' };
        return trongGiaoDich(STORE_DRAFTS, 'readwrite', (store) => {
          const yeuCau = store.getAll();
          yeuCau.onsuccess = () => {
            ketQua = {
              tabId: danhTinh,
              text: apDungKeHoach(
                store,
                quyetDinhBanNhap(yeuCau.result ?? [], danhTinh, now, staleMs),
              ),
            };
          };
          // Không trả yêu cầu ra ngoài: kết quả của phương thức này chốt ở `oncomplete`, và
          // `ketQua` đã được điền xong trước lúc đó.
          return null;
        }).then(() => ketQua);
      });
    },

    putDraft(draft) {
      return trongGiaoDich(STORE_DRAFTS, 'readwrite', (store) =>
        store.put(banNhapChuan(draft)),
      ).then(() => undefined);
    },

    replaceAll(notes) {
      // Xóa sạch rồi ghi lại trong MỘT giao dịch: hỏng giữa chừng thì IndexedDB cuộn ngược và
      // kho giữ nguyên trạng thái cũ (AD-11). Không trả yêu cầu nào ra ngoài — kết quả của
      // phương thức này là "đã chốt", không phải một giá trị.
      return trongGiaoDich(STORE_NOTES, 'readwrite', (store) => {
        store.clear();
        for (const note of notes) {
          store.put(banGhiChuan(note));
        }
        return null;
      }).then(() => undefined);
    },
  };
}
