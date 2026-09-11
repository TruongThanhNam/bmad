// Khối state duy nhất của ứng dụng, và mọi đường đổi nó (AD-1).
//
// Chỉ có MỘT khối dữ liệu, và nó chỉ đổi bên trong một action của chính tệp này. View đọc
// state rồi vẽ; adapter trả dữ liệu về cho action. Cả hai không bao giờ ghi vào state. Nếu
// hai vùng cùng sửa một dữ liệu theo hai cách thì bảng trạng thái của FR-14 sẽ không bao giờ
// khớp lại được, và không có triệu chứng nào ngoài "đôi khi nó sai".
//
// Vì sao là factory `taoStore(ports)` chứ không phải một giá trị singleton cấp module:
// "đúng một khối state" là ràng buộc về runtime của ứng dụng, không phải về cách module xuất
// giá trị. Một singleton khiến mỗi ca test kế thừa state của ca trước, nên test sẽ phải tự
// dựng một cơ chế reset — chính là một đường đổi state THỨ HAI, đúng thứ AD-1 cấm. Factory
// giữ được cả hai: test tạo store riêng cho mỗi ca, `app/main.js` gọi đúng một lần.
//
// State đọc ra là một bản sao ĐÓNG BĂNG SÂU, không phải khối nội bộ. Trả thẳng khối nội bộ
// ra thì `store.state.notes.push(x)` từ view là hợp lệ về cú pháp, và nó lách qua mọi action.
// Bản sao đóng băng biến cái lách đó thành một lỗi ném ngay tại dòng viết sai.
//
// Nhưng dựng lại bản sao đó bằng cách đi hết cây state sau MỖI action là một cái bẫy hiệu
// năng: `datDieuKien` là đường chạy theo TỪNG PHÍM gõ vào ô tìm kiếm, còn `notes` giữ toàn
// bộ ghi chú trong RAM (AD-6). Sao chép cả `notes` mỗi phím là chi phí tỉ lệ với số ghi chú
// cho một việc không đụng tới ghi chú nào — trần 200 ms của NFR-2 sẽ gãy đúng lúc kho đã
// nhiều. Nên hai nửa đi cùng nhau:
//
// - action KHÔNG sửa tại chỗ; nó thay CẢ NHÁNH đã đổi bằng một object mới (`datLai`).
// - `banSaoDongBang` ghi nhớ kết quả theo THAM CHIẾU nguồn, nên nhánh không đổi được dùng
//   lại nguyên bản sao đóng băng cũ.
//
// Hai nửa này phụ thuộc lẫn nhau: sửa tại chỗ mà vẫn ghi nhớ theo tham chiếu thì bản sao trả
// ra sẽ là bản CŨ. Đó là lý do `noiBo` không bao giờ được gán vào một trường lồng bên trong.
//
// Hình dạng state được khai báo ĐỦ ngay từ bây giờ dù phần lớn chưa dùng: có một lúc duy
// nhất ai đó đối chiếu toàn bộ với bảng ba tầng của AD-3, và đó là lúc này. Để state mọc dần
// theo từng story thì không bao giờ có lúc đó nữa.
//
// State KHÔNG có trường nào mang nghĩa "một phép ghi đang chạy" hay "đã xong" (AD-16): view
// không có gì để vẽ ra thì không có chỉ báo nào lọt vào vì nó nghe có vẻ hữu ích. Thao tác
// thành công thì im lặng; dải băng chỉ dành cho chuyện xấu, cộng đúng một ngoại lệ là kết
// quả nạp file (AD-17).
//
// LUỒNG GHI CHUẨN sống ở đây, và đúng một lần (AD-8). Hai luồng, phân biệt được bằng thứ tự:
//
// - Thao tác đổi SỰ TỒN TẠI (thêm, xóa, và ở story sau là nạp file): ghi xuống kho TRƯỚC, đổi
//   state SAU. Cổng từ chối thì state giữ nguyên và mẩu giấy không xuất hiện.
// - TỰ LƯU nội dung đang gõ: state đổi NGAY theo từng phím (nếu không thì không gõ được),
//   phép ghi đi sau với debounce `AUTOSAVE_MS` và một số đếm `seq` gác. Ghi hỏng thì KHÔNG
//   hoàn tác chữ đã gõ — dải băng là thứ nói rằng chữ chưa an toàn.
//
// Cả hai đi qua đúng hai helper nội bộ dùng chung, và đó là điểm của story này: Epic 2 và
// Epic 5 nối giao diện vào bốn action dưới đây chứ không dựng lại luồng của mình. Hai bản
// luồng ghi thì nửa cứng của FR-19 ("không bao giờ giả vờ đã lưu") chỉ đúng ở một nửa.
//
// Ba trong bốn action chưa có giao diện nào gọi, và đó là đánh đổi đã chốt: thứ tự "ghi trước,
// state sau" chỉ phân biệt được bằng một action CHẠY THẬT khi cổng từ chối, nên một helper
// nội bộ không export sẽ biến AC đó thành lời hứa.
//
// Tệp này là `core/` thuần: chỉ import `../ports/index.js` và các module `core/` khác, không
// chạm global trình duyệt. `crypto.randomUUID` thì có — nó không phải global của DOM, nó có ở
// cả Node, và AD-13 chốt nó là nguồn duy nhất của `id`.

import { MA_LOI } from './errors.js';
import { fold } from './fold.js';
import { AUTOSAVE_MS, MAX_NOTE_CHARS } from './limits.js';
import { localDate, localStamp, nowIso } from './time.js';
import { kiemTraPorts } from '../ports/index.js';

/** Khóa ngày của khối điều kiện: `yyyy-MM-dd` và không gì khác (AD-4). Chỉ kiểm HÌNH DẠNG —
 *  một ngày không có thật vẫn không lọc ra ghi chú nào, và đó là kết quả đúng. */
const MAU_NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Đúng hai nửa, không có nửa thứ ba (AD-15). */
const KHOA_DIEU_KIEN = Object.freeze(['keyword', 'date']);

// Chép tại chỗ từ `core/time.js` có chủ ý: gom thành helper dùng chung là thêm một phụ thuộc
// giữa hai module lõi chỉ để tiết kiệm hai dòng.
function moTa(giaTri) {
  return typeof giaTri === 'string' ? JSON.stringify(giaTri) : String(giaTri);
}

function laObjectThuong(giaTri) {
  return typeof giaTri === 'object' && giaTri !== null && !Array.isArray(giaTri);
}

/** Object THUẦN — dựng bằng `{}`, không phải một thực thể của lớp nào. */
function laObjectThuan(giaTri) {
  if (!laObjectThuong(giaTri)) return false;
  const to = Object.getPrototypeOf(giaTri);
  return to === Object.prototype || to === null;
}

/**
 * Mã dải băng cho một lỗi từ cổng.
 *
 * Lỗi không mang mã thuộc tập đóng AD-18 vẫn phải ra một mã thật: `DB` là mã của "kho hỏng,
 * không biết hỏng thế nào", và nó đúng hơn mọi lựa chọn khác ở đây. Để `undefined` chảy vào
 * `banner` thì view sẽ đi tra microcopy của một mã không tồn tại và `errors.js` ném.
 *
 * Xét theo GIÁ TRỊ của bảng, không theo khóa: `loi.code` mang giá trị (`'QUOTA'`), và một
 * phép tra theo khóa tình cờ cũng đúng vì bảng ánh xạ tên sang chính nó — nhưng nó sẽ im lặng
 * sai ở ngày đầu tiên có một mã mà tên và giá trị khác nhau.
 */
function maBanner(loi) {
  const ma = loi == null ? undefined : loi.code;
  return Object.values(MA_LOI).includes(ma) ? ma : MA_LOI.DB;
}

/** Sắp giảm dần theo `localStamp` — bất biến của `notes` trong RAM (AD-4, AD-6). */
function sapGiamDan(danhSach) {
  const theoKhoa = new Map(danhSach.map((mau) => [mau, localStamp(mau)]));
  return [...danhSach].sort((x, y) => theoKhoa.get(y).localeCompare(theoKhoa.get(x)));
}

/**
 * Bản ghi ghi chú MỚI — đúng năm trường của AD-13, object THUẦN.
 *
 * Hai trường dẫn xuất tính tại đây, không nhận từ bên ngoài: `localDate` từ `createdAt` qua
 * `core/time.js`, `textFolded` từ `text` qua `core/fold.js`. `createdAt` là CHUỖI, không bao
 * giờ là một mốc thời gian — `banSaoDongBang` ném với thứ không phải object thuần.
 */
function banGhiMoi(text) {
  const createdAt = nowIso();
  return {
    id: crypto.randomUUID(),
    createdAt,
    localDate: localDate({ createdAt }),
    text,
    textFolded: fold(text),
  };
}

/** Bản ghi sau một lần sửa nội dung: `id` và `createdAt` bất biến, hai trường dẫn xuất tính lại. */
function banGhiSua(cu, text) {
  return {
    id: cu.id,
    createdAt: cu.createdAt,
    localDate: localDate(cu),
    text,
    textFolded: fold(text),
  };
}

/**
 * Hình dạng đầy đủ của khối state, mọi trường ở giá trị rỗng.
 *
 * Ba tầng phạm vi của AD-3, tất cả cùng sống trong RAM ở đây:
 * - tầng A (bền, dùng chung): `notes`.
 * - tầng B (bền, riêng tab): `draft`.
 * - tầng C (phù du): `dieuKien`, `expandedId`, `editing`, `banner`, `readOnly`.
 *
 * `seq` là số đếm chống hẹn tự lưu sống lâu hơn thứ nó định ghi (AD-8): hẹn nào nổ ra mà
 * `seq` của nó không còn là `seq` hiện tại thì bị bỏ. Một số đếm cho bản nháp, một cho mẩu
 * đang sửa, vì chúng là hai mục tiêu tự lưu độc lập.
 */
function stateRong() {
  return {
    // Tầng A — toàn bộ ghi chú, sắp giảm dần theo khóa sắp xếp (AD-6).
    notes: [],
    // Tầng B — bản nháp của riêng tab này; không bao giờ đồng bộ sang tab khác (AD-7).
    draft: { text: '', seq: 0 },
    // Tầng C — điều kiện đang bật. `{null, null}` là VẮNG MẶT điều kiện (AD-15).
    dieuKien: { keyword: null, date: null },
    // Tầng C — mẩu đang mở rộng, và mẩu đang sửa cùng nội dung đang gõ của nó.
    expandedId: null,
    editing: { id: null, text: '', seq: 0 },
    // Tầng C — dải băng: một giá trị, một chủ (AD-17).
    banner: null,
    // Tầng C — tab đã thấy mã lệch phiên bản thì mọi action có ghi bị từ chối (AD-21).
    readOnly: false,
  };
}

/**
 * Bản sao đóng băng đã dựng cho một object nguồn, tra theo THAM CHIẾU của nguồn đó.
 *
 * `WeakMap` chứ không phải `Map`: khóa là object state, và một nhánh bị action thay ra phải
 * được thu hồi cùng lúc chứ không sống mãi trong một bảng tra.
 */
const banSaoDaDung = new WeakMap();

/**
 * Bản sao đóng băng sâu của một giá trị state.
 *
 * Đóng băng nông là không đủ: `store.state.dieuKien.keyword = 'x'` vẫn chạy được, và nó đổi
 * đúng cái nó không được đổi. Sao chép trước khi đóng băng cũng là cố ý — đóng băng thẳng
 * khối nội bộ sẽ làm chính các action không ghi vào nó được nữa.
 *
 * Ghi nhớ theo tham chiếu nguồn: một nhánh mà action không thay thì lần này trả lại đúng bản
 * sao lần trước, nên chi phí một action tỉ lệ với phần THỰC SỰ đổi, không với cỡ cả state.
 *
 * `Date` / `Map` / thực thể của một lớp thì NÉM, không đi qua: chúng không sao chép được
 * bằng phép đi cây này, nên chúng sẽ lọt ra ngoài dưới dạng tham chiếu KHÔNG đóng băng — tức
 * một lỗ đúng bằng cái mà cả hàm này sinh ra để bịt. Ném ở đây biến "một trường state kiểu
 * lạ" thành đỏ ngay ca test đầu tiên, thay vì thành một chỗ ghi thẳng vào state ở Epic sau.
 */
function banSaoDongBang(giaTri) {
  if (giaTri === null || typeof giaTri !== 'object') return giaTri;
  const daCo = banSaoDaDung.get(giaTri);
  if (daCo !== undefined) return daCo;

  let ra;
  if (Array.isArray(giaTri)) {
    ra = Object.freeze(giaTri.map(banSaoDongBang));
  } else if (laObjectThuan(giaTri)) {
    const object = {};
    for (const khoa of Object.keys(giaTri)) {
      object[khoa] = banSaoDongBang(giaTri[khoa]);
    }
    ra = Object.freeze(object);
  } else {
    throw new TypeError(
      `state chỉ chứa giá trị nguyên thủy, mảng và object thuần — không sao chép được ${moTa(giaTri)}`,
    );
  }
  banSaoDaDung.set(giaTri, ra);
  return ra;
}

/**
 * Chuẩn hóa nửa từ khóa của khối điều kiện.
 *
 * Chuỗi rỗng thành `null` vì nó là VẮNG MẶT điều kiện, không phải một điều kiện rỗng: xóa
 * hết chữ trong ô tìm kiếm phải trả về khung nhìn mặc định, không phải "tìm chuỗi rỗng".
 */
function keywordHopLe(giaTri) {
  if (giaTri === null) return null;
  if (typeof giaTri !== 'string') {
    throw new TypeError(`keyword phải là chuỗi hoặc null, nhận được ${moTa(giaTri)}`);
  }
  return giaTri === '' ? null : giaTri;
}

/**
 * Chuẩn hóa nửa ngày của khối điều kiện.
 *
 * Chuỗi gõ dở hay sai định dạng thì GIỮ giá trị cũ và không ném: người dùng gõ `2026-9` trên
 * đường tới `2026-09-10`, và mỗi phím trung gian không được làm dòng ghi chú nhảy. Lỗi định
 * dạng là lỗi tại chỗ của view, không phải lỗi của một phép đổi state (AD-15, AD-17).
 *
 * Nhưng SAI KIỂU thì ném: một con số hay một object chảy vào đây là lỗi lập trình, và giữ
 * giá trị cũ trong im lặng sẽ che nó đi.
 */
function ngayHopLe(giaTri, giaTriCu) {
  if (giaTri === null || giaTri === '') return null;
  if (typeof giaTri !== 'string') {
    throw new TypeError(`date phải là chuỗi 'yyyy-MM-dd', '' hoặc null, nhận được ${moTa(giaTri)}`);
  }
  return MAU_NGAY.test(giaTri) ? giaTri : giaTriCu;
}

/**
 * Dựng khối state của ứng dụng cùng toàn bộ action đổi được nó.
 *
 * Kiểm hình dạng cổng TRƯỚC KHI làm bất cứ việc gì khác: một cổng nối sai phải nổ lúc khởi
 * động, nêu đúng tên cổng và phương thức, thay vì nổ giữa một giao dịch đang ghi.
 *
 * @param {object} ports Năm cổng của `app/ports/`, do `app/main.js` nối vào.
 * @returns {{ state: object, datDieuKien: Function, xoaHetDieuKien: Function, khoiDong:
 *   Function, themGhiChu: Function, xoaGhiChu: Function, tuLuuNoiDung: Function }}
 *   Store với `state` chỉ đọc và các action. Story sau thêm action vào ĐÂY, không nơi khác.
 */
export function taoStore(ports) {
  kiemTraPorts(ports);

  let noiBo = stateRong();
  let anh = banSaoDongBang(noiBo);

  /**
   * Đường DUY NHẤT một action đổi state: thay các nhánh được nêu bằng object mới, rồi dựng
   * lại ảnh. Không action nào được gán vào một trường lồng bên trong `noiBo` — làm thế thì
   * phép ghi nhớ của `banSaoDongBang` sẽ trả lại bản sao cũ.
   *
   * Gọi ở CUỐI action, sau khi mọi phép kiểm đã qua: một action ném ra giữa đường phải để
   * lại state y như trước khi nó được gọi.
   */
  function datLai(nhanhMoi) {
    noiBo = { ...noiBo, ...nhanhMoi };
    anh = banSaoDongBang(noiBo);
  }

  /**
   * Đổi một hoặc cả hai nửa của khối điều kiện. Nửa không được nêu thì giữ nguyên.
   *
   * @param {{ keyword?: string | null, date?: string | null }} partial Nửa cần đổi.
   */
  function datDieuKien(partial) {
    if (!laObjectThuong(partial)) {
      throw new TypeError(
        `datDieuKien nhận một object mang keyword và/hoặc date, nhận được ${moTa(partial)}`,
      );
    }
    // Khóa lạ là lỗi lập trình, và bỏ qua trong im lặng là cách một nửa điều kiện thứ ba mọc
    // ra rồi sống ở đâu đó ngoài khối này — đúng thứ AD-15 sinh ra để chặn.
    for (const khoa of Object.keys(partial)) {
      if (!KHOA_DIEU_KIEN.includes(khoa)) {
        throw new TypeError(
          `datDieuKien chỉ nhận ${KHOA_DIEU_KIEN.join(' và ')}, nhận được khóa ${moTa(khoa)}`,
        );
      }
    }
    // Chuẩn hóa CẢ HAI nửa vào biến cục bộ trước, rồi mới chốt cả hai cùng lúc. Gán từng nửa
    // ngay lúc chuẩn hóa được nó thì `{ keyword: 'pho', date: 7 }` sẽ đổi `keyword` rồi mới
    // ném ở `date` — state còn lại một nửa đã đổi mà không ai chốt, và nửa mồ côi đó xuất
    // hiện trong ảnh của action THÀNH CÔNG kế tiếp. Một action ném là một action không đổi gì.
    const dieuKienCu = noiBo.dieuKien;
    let keyword = dieuKienCu.keyword;
    let date = dieuKienCu.date;
    if (Object.prototype.hasOwnProperty.call(partial, 'keyword')) {
      keyword = keywordHopLe(partial.keyword);
    }
    if (Object.prototype.hasOwnProperty.call(partial, 'date')) {
      date = ngayHopLe(partial.date, dieuKienCu.date);
    }
    datLai({ dieuKien: { keyword, date } });
  }

  /** Đưa khối điều kiện về `{ keyword: null, date: null }` — khung nhìn mặc định (AD-15). */
  function xoaHetDieuKien() {
    datLai({ dieuKien: { keyword: null, date: null } });
  }

  /**
   * HELPER DÙNG CHUNG 1 — luồng "đổi sự tồn tại": ghi xuống kho TRƯỚC, đổi state SAU (AD-8).
   *
   * `dungNhanh` được gọi CHỈ KHI phép ghi đã chốt, và được gọi lúc đó chứ không trước: nó đọc
   * khối nội bộ tại thời điểm ghi xong, nên hai action chạy chồng nhau không ghi đè kết quả
   * của nhau bằng một ảnh chụp cũ.
   *
   * Lỗi KHÔNG ném ra ngoài: một cổng từ chối là chuyện của người dùng, và đường ra của nó là
   * dải băng (AD-17). Ném thêm ra ngoài là bắt mọi chỗ gọi tự xử lý một lần nữa.
   *
   * Ghi thành công thì TẮT dải băng: AD-8 nói dải băng ở lại "cho tới khi một phép ghi sau đó
   * thành công", nên một lần hết dung lượng không được đeo bám mọi thao tác về sau.
   */
  function ghiTruocDatSau(phepGhi, dungNhanh) {
    return phepGhi().then(
      () => {
        datLai({ ...dungNhanh(), banner: null });
      },
      (loi) => {
        datLai({ banner: maBanner(loi) });
      },
    );
  }

  /**
   * HELPER DÙNG CHUNG 2 — luồng "tự lưu": state đã đổi rồi, phép ghi đi sau (AD-8).
   *
   * `seqCuaHen` là số đếm tại lúc hẹn được đặt. Hẹn nào nổ ra mà `editing.seq` đã tăng thì nó
   * đang định ghi một chữ không còn trên màn hình — nó BỊ BỎ, và không chạm cổng.
   *
   * Không hủy hẹn cũ lúc đặt hẹn mới, có chủ ý: `seq` là cơ chế chính thức của AD-8, và nếu
   * `clearTimeout` gánh phần đó thì phép gác `seq` không còn đường nào chạy qua — tức nó trở
   * thành mã không ai kiểm, đúng lúc nó là thứ duy nhất chặn một hẹn sống dai ghi đè chữ mới.
   */
  function henGhiDiSau(seqCuaHen, dungBanGhi) {
    setTimeout(() => {
      if (noiBo.editing.seq !== seqCuaHen) return;
      const banGhi = dungBanGhi();
      // Mục tiêu đã biến mất khỏi kho trong RAM (bị xóa trong lúc chờ) — không hồi sinh nó.
      if (banGhi === null) return;
      ports.noteStore.put(banGhi).then(
        () => {
          // Cùng quy tắc với `ghiTruocDatSau`: một phép ghi thành công tắt dải băng (AD-8).
          datLai({
            notes: noiBo.notes.map((mau) => (mau.id === banGhi.id ? banGhi : mau)),
            banner: null,
          });
        },
        (loi) => {
          datLai({ banner: maBanner(loi) });
        },
      );
    }, AUTOSAVE_MS);
  }

  /**
   * Nạp toàn bộ ghi chú từ kho bền vào RAM, sắp giảm dần theo `localStamp` (AD-6).
   *
   * Sắp xếp ở ĐÂY chứ không tin thứ tự của kho: chữ ký cổng nói rõ thứ tự trả về không đáng
   * tin, và `localStamp` là khóa sắp xếp duy nhất (AD-4).
   *
   * Nạp hỏng thì `notes` giữ `[]` và dải băng mang mã của lỗi — không ném ra ngoài, vì chỗ
   * gọi duy nhất là lúc khởi động và ở đó không có ai bắt.
   */
  function khoiDong() {
    return ports.noteStore.readAll().then(
      (danhSach) => {
        try {
          datLai({ notes: sapGiamDan(danhSach) });
        } catch {
          // Một bản ghi mang `createdAt` rác: kho đọc được nhưng không dùng được. Cùng một
          // đường ra với lỗi kho, vì với người dùng thì đó là cùng một chuyện.
          datLai({ banner: MA_LOI.DB });
        }
      },
      (loi) => {
        datLai({ banner: maBanner(loi) });
      },
    );
  }

  /**
   * Thêm một ghi chú mới: ghi xuống kho trước, rồi đưa nó lên đầu `notes`.
   *
   * Chuỗi rỗng hay chỉ khoảng trắng là "không có gì để thêm", không phải lỗi: không chạm cổng,
   * không đổi state, không dải băng. Quá trần thì dải băng `TOO_LONG` và cổng KHÔNG bị gọi —
   * trần là ràng buộc của lõi, chặn ở cửa vào (AD-14).
   *
   * @param {string} text Nội dung người dùng gõ, nguyên trạng.
   * @returns {Promise<void>} Hoàn tất khi state đã phản ánh kết quả — không bao giờ bị từ chối.
   */
  function themGhiChu(text) {
    if (typeof text !== 'string') {
      throw new TypeError(`themGhiChu nhận text là chuỗi, nhận được ${moTa(text)}`);
    }
    if (text.trim() === '') return Promise.resolve();
    if (text.length > MAX_NOTE_CHARS) {
      datLai({ banner: MA_LOI.TOO_LONG });
      return Promise.resolve();
    }
    const banGhi = banGhiMoi(text);
    return ghiTruocDatSau(
      () => ports.noteStore.put(banGhi),
      // Sắp lại chứ không chỉ chèn lên đầu: mẩu mới thường là mẩu mới nhất, nhưng "thường"
      // không phải bất biến — đồng hồ máy lùi lại, hay một bản ghi nạp từ file sao lưu (Epic
      // 4) mang mốc tương lai, đều để lại một mảng lệch thứ tự mà không ai thấy.
      () => ({ notes: sapGiamDan([banGhi, ...noiBo.notes]) }),
    );
  }

  /**
   * Xóa một ghi chú: rút khỏi kho trước, rồi mới rút khỏi `notes`.
   *
   * `id` không có trong RAM thì không chạm cổng: kho là nguồn sự thật cho phép ghi, nhưng một
   * `id` lạ ở đây là lỗi của chỗ gọi, và một lệnh xóa gửi xuống kho cho một bản ghi không tồn
   * tại thành công trong im lặng — tức nó sẽ trông như đã làm gì.
   *
   * @param {string} id Định danh ghi chú cần xóa.
   * @returns {Promise<void>} Hoàn tất khi state đã phản ánh kết quả — không bao giờ bị từ chối.
   */
  function xoaGhiChu(id) {
    if (typeof id !== 'string') {
      throw new TypeError(`xoaGhiChu nhận id là chuỗi, nhận được ${moTa(id)}`);
    }
    if (!noiBo.notes.some((mau) => mau.id === id)) return Promise.resolve();
    return ghiTruocDatSau(
      () => ports.noteStore.remove(id),
      () => ({ notes: noiBo.notes.filter((mau) => mau.id !== id) }),
    );
  }

  /**
   * Tự lưu nội dung đang sửa của một ghi chú: `editing` đổi NGAY, phép ghi đi sau (AD-8).
   *
   * Trả về đồng bộ — hẹn ghi không đi vào giá trị trả về, vì chỗ gọi là một sự kiện bàn phím
   * và nó không có gì để đợi. Kết quả của phép ghi hiện ra ở state: hoặc `notes` đổi, hoặc
   * dải băng bật lên. Chữ trong `editing.text` thì không bao giờ bị hoàn tác.
   *
   * @param {string} id Định danh ghi chú đang sửa.
   * @param {string} text Nội dung vừa gõ.
   * @returns {void}
   */
  function tuLuuNoiDung(id, text) {
    if (typeof id !== 'string') {
      throw new TypeError(`tuLuuNoiDung nhận id là chuỗi, nhận được ${moTa(id)}`);
    }
    if (typeof text !== 'string') {
      throw new TypeError(`tuLuuNoiDung nhận text là chuỗi, nhận được ${moTa(text)}`);
    }
    // Trần chặn ở MỌI cửa vào, không chỉ ở cửa thêm mới (AD-14): cửa sửa cũng ghi vào cùng
    // một store, nên một cửa không chặn là trần không tồn tại.
    if (text.length > MAX_NOTE_CHARS) {
      datLai({ banner: MA_LOI.TOO_LONG });
      return;
    }
    const seqMoi = noiBo.editing.seq + 1;
    datLai({ editing: { id, text, seq: seqMoi } });
    henGhiDiSau(seqMoi, () => {
      const cu = noiBo.notes.find((mau) => mau.id === id);
      if (cu === undefined) return null;
      return banGhiSua(cu, text);
    });
  }

  // Đóng băng chính store: gán thêm một action từ bên ngoài là dựng đường đổi state thứ hai.
  return Object.freeze({
    get state() {
      return anh;
    },
    datDieuKien,
    xoaHetDieuKien,
    khoiDong,
    themGhiChu,
    xoaGhiChu,
    tuLuuNoiDung,
  });
}
