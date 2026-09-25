// Lưới ghi chú — mắt nhìn thấy thứ vừa được chốt xuống.
//
// Ba luật của tầng view, y hệt `o-soan.js` và cưỡng chế bằng test chứ không bằng chú thích:
//
// - View CHỈ ĐỌC state (`notes`, `dieuKien`, `expandedIds`, `editing`) và không một phép ghi
//   nào — phép đổi state duy nhất nó gọi là `store.batTatMoRong`. Phép LỌC không sống ở đây: nó
//   là `locGhiChu` của `core/query.js`, nên nó kiểm được mà không cần DOM lẫn đồng hồ.
// - View không giữ state riêng. Không danh sách đã vẽ, không tập `expandedIds`, không bộ nhớ đệm —
//   mỗi lượt `ve()` dựng lại toàn bộ danh sách con từ state, nên không có gì để lệch.
// - View không bao giờ import `app/adapters/`. Nó nhận `store` qua THAM SỐ.
//
// Không có cơ chế subscribe trong dự án này, và story này KHÔNG dựng một cái: `ve` được nối
// tay ở `app/main.js` vào đúng hai chỗ — kho nạp xong, và sau mỗi lần chốt.
//
// "Hôm nay" tính lại ở MỖI lượt vẽ (`mocHienTai()` chạy trong `ve`, không một lần lúc nối):
// chốt mốc lúc tải trang thì một ghi chú chốt sau nửa đêm sẽ không hiện ra — tức phá đúng lời
// hứa "mẩu giấy nhô lên là bằng chứng duy nhất". Cái giá đã nhận: tab mở qua 00:00 thì lượt vẽ
// đầu tiên của ngày mới quét sạch mẩu hôm qua khỏi lưới. Dữ liệu vẫn nguyên trong kho — chúng
// chỉ ra khỏi KHUNG NHÌN, và không có hẹn giờ nửa đêm nào được dựng cho một ca hiếm như vậy.
//
// Hình dạng đầy đủ của mẩu giấy — giờ tạo, cắt bớt, mở rộng, nút xóa — sống ở `mau-giay.js`
// (Story 2.5), không ở đây. Chia việc như vậy để tệp này giữ đúng MỘT trách nhiệm: chọn hiển
// thị cái gì, theo thứ tự nào. "Hiển thị ra sao" là câu hỏi khác, và nó kiểm được từng mẩu một
// mà không cần cả lưới.

import { COLLAPSED_LINES, MAX_RESULTS } from '../core/limits.js';
import { locGhiChu } from '../core/query.js';
import { nowIso } from '../core/time.js';
// Tên thuộc tính và mệnh đề chọn của ô sửa đi VÀO từ `mau-giay.js` — nơi chúng được ĐẶT — chứ
// không khai lại ở đây: hai bản chép tay là hai chỗ có thể trôi khỏi nhau, và khi chúng trôi
// thì phép gác không-vẽ-lại bên dưới lặng lẽ tắt, tức triệu chứng "gõ ngược" quay lại.
import { CHON_SUA, THUOC_TINH_SUA, caoTheoNoiDungSua, soDong, veMau } from './mau-giay.js';

/** Lưới trong DOM. Phần tử rỗng nguyên ở dạng tĩnh; mọi ô do lượt vẽ sinh ra lúc chạy.
 *  EXPORT để `app/main.js` dùng lại thay vì khai lần thứ hai. */
export const CHON_LUOI = '.luoi';

/** Dòng duy nhất lưới được nói (Story 6.1): CHỈ khi đang có điều kiện VÀ không mẩu nào khớp.
 *  Khung nhìn mặc định rỗng vẫn không một chữ (Story 2.6, AD-16). */
const THE_KHONG_KHOP = 'p';
const LOP_KHONG_KHOP = 'luoi-khong-khop';
const CHU_KHONG_KHOP = 'Không có ghi chú nào khớp.';

/** Dòng "còn nhiều hơn" (Story 6.4): chỉ khi số khớp thật vượt trần. Chỉ là chữ — không nút,
 *  không phân trang, không `aria-live`, không focus được. */
const THE_THEM = 'p';
const LOP_THEM = 'luoi-them';
const CHU_THEM = `Hiện ${MAX_RESULTS} ghi chú đầu, còn nhiều hơn. Thêm bộ lọc ngày hoặc gõ thêm chữ để thu hẹp.`;

/**
 * Nối lưới vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {object} [goc] Gốc để tìm phần tử — mặc định `document`. Test truyền một gốc DOM tối
 *   giản vào đây, nên tệp này không tự chạm một global nào.
 * @param {() => string} [mocHienTai] Nguồn mốc hiện tại, mặc định `nowIso` của `core/time.js`.
 *   Là HÀM chứ không phải một chuỗi: nó phải được hỏi lại ở mỗi lượt vẽ.
 * @param {{ vao?: (id: string, viTri: number|null) => void, roi?: (id: string) => void,
 *   go?: (id: string, text: string) => void, xoa?: (id: string) => void,
 *   moRong?: (id: string) => void }} [mocSua] Ba móc của chế độ sửa cộng móc `xoa` của Story
 *   5.3 và móc `moRong` của Story 8.0, do `app/main.js` nối vào — chúng gọi action của
 *   lõi VÀ gọi lượt vẽ, hai việc mà một view không được tự làm cả hai. Vắng mặt thì lưới vẫn vẽ
 *   được, chỉ không sửa và không xóa được (đường của test bố cục).
 * @returns {{ ve: () => void }} `ve` dựng lại toàn bộ ô của lưới từ state.
 */
export function noiLuoi(store, goc = document, mocHienTai = nowIso, mocSua = {}) {
  const luoi = goc.querySelector(CHON_LUOI);
  // Không có lưới thì không có gì để vẽ — và cũng không có gì để ném. `ve` vẫn phải gọi được,
  // vì `app/main.js` treo nó vào một lời hứa không bao giờ bị từ chối. Cùng khuôn `noiOSoan`.
  if (luoi === null || luoi === undefined) return { ve() {} };

  /**
   * Vẽ lại lưới từ state.
   *
   * `replaceChildren(...)` trong MỘT lời gọi, không phải một vòng `append`: nó thay cả danh
   * sách con bằng một phép đổi DOM duy nhất, nên không có khung hình nào lưới rỗng giữa chừng.
   *
   * Hình dạng từng mẩu là việc của `veMau`; ở đây chỉ có hai phép ĐỌC state đi vào nó —
   * `notes`/`dieuKien` cho tập hiển thị, `expandedIds` cho cờ mở rộng — và một handler gọi
   * đúng MỘT action của lõi rồi vẽ lại. Không có cơ chế subscribe trong dự án này (và không
   * được dựng một cái), nên lượt vẽ sau khi mở/thu được nối tay ngay tại đây.
   */
  function ve() {
    const dangSua = store.state.editing.id;
    // PHÉP GÁC KHÔNG-VẼ-LẠI, và nó đặt ở ĐÂY vì đây là chỗ duy nhất gọi `replaceChildren`.
    //
    // `veTatCa()` của `main.js` được gọi từ năm nguồn khác (đóng dải băng, lật theme, nạp file,
    // chốt ghi chú, phép ghi tự lưu vừa xong), và mỗi lượt như vậy sẽ thay cả lưới ra giữa lúc
    // đang gõ: `<textarea>` bị thay bằng một phần tử mới và con trỏ về đầu.
    //
    // So theo `id` chứ không theo "có đang sửa gì không", và `id` đó đọc từ chính ô đang có
    // trong DOM. Vế đó là điều kiện: khi đổi mẩu đang sửa (A → B), ô sửa của A VẪN còn trong
    // DOM lúc lượt vẽ của B chạy, nên một phép gác viết rộng tay sẽ chặn đúng lượt vẽ mở ô sửa
    // của B — và Nam phải bấm hai lần.
    //
    // Cái giá đã nhận: một nguồn KHÁC đổi `notes` trong lúc đang sửa (nạp file, và tab khác ở
    // Epic 7) để lại một lưới cũ cho tới lượt vẽ sau. Hóa đơn đó trả cùng lúc với Epic 7.
    if (dangSua !== null) {
      const oSuaCu = luoi.querySelector(CHON_SUA);
      if (oSuaCu !== null && oSuaCu !== undefined) {
        if (oSuaCu.getAttribute(THUOC_TINH_SUA) === dangSua) return;
      }
    }
    const dieuKien = store.state.dieuKien;
    const { items: hienThi, total } = locGhiChu(store.state.notes, dieuKien, mocHienTai());
    // Đang có điều kiện thì kết quả trải qua nhiều ngày: mốc đầy đủ, và phần khớp được tô.
    const coDieuKien = dieuKien.keyword !== null || dieuKien.date !== null;
    const tim = { keyword: dieuKien.keyword, dayDu: coDieuKien };
    const dangMo = store.state.expandedIds;
    const o = hienThi.map((note) => {
      const moRong = dangMo.includes(note.id);
      // HAI NHỊP CLICK, và chúng không bao giờ nhập một: mẩu bị cắt mà chưa mở rộng thì nhịp
      // này CHỈ mở rộng; mọi trường hợp khác (mẩu ngắn, hay mẩu đã mở rộng) thì vào chế độ sửa.
      const khiClick = (viTri) => {
        if (soDong(note.text) > COLLAPSED_LINES && !moRong) {
          // Có móc thì `main.js` mở rộng và vẽ lại giữ tiêu điểm trên thân mẩu này (Story 8.0);
          // đường dưới chỉ còn cho test bố cục, nơi không có `main.js`.
          if (mocSua.moRong !== undefined) {
            mocSua.moRong(note.id);
            return;
          }
          store.batTatMoRong(note.id);
          ve();
          return;
        }
        mocSua.vao?.(note.id, viTri);
      };
      // Dòng gấp giữ nghĩa của CHÍNH NÓ: nhãn `thu lại ▴` phải thu mẩu lại.
      //
      // Nhưng khi mẩu đang sửa thì nó KHÔNG được gọi `batTatMoRong`: `blur` đi trước `click` và
      // nó đã gỡ `id` khỏi `expandedIds` rồi, nên một lần bật lại làm mẩu MỞ RỘNG thay vì thu.
      // Lúc đó việc duy nhất còn lại là rời chế độ sửa — và `main.js` đã bỏ qua một lời rời
      // trùng lặp, nên dòng này an toàn cả khi `blur` đã chạy xong.
      const khiGap = () => {
        if (note.id === dangSua) {
          mocSua.roi?.(note.id);
          return;
        }
        store.batTatMoRong(note.id);
        ve();
      };
      return veMau(
        note,
        luoi.ownerDocument,
        moRong,
        khiClick,
        note.id === dangSua
          ? {
              // Chữ trong ô sửa đến từ `editing.text`, KHÔNG từ `note.text`: `notes` chỉ đổi
              // khi `put` chốt, nên đọc bản ghi là mở ô sửa bằng chữ cũ.
              text: store.state.editing.text,
              go: (text) => mocSua.go?.(note.id, text),
              roi: () => mocSua.roi?.(note.id),
            }
          : null,
        khiGap,
        // Nút `xóa` chỉ MỞ một câu hỏi; phép xóa thật và lượt vẽ theo sau là việc của
        // `app/main.js`. Lưới không biết hộp thoại tồn tại, đúng như nó không biết ô sửa được
        // đặt tiêu điểm ở đâu.
        mocSua.xoa,
        tim,
      );
    });
    if (coDieuKien && total === 0) {
      const khongKhop = luoi.ownerDocument.createElement(THE_KHONG_KHOP);
      khongKhop.className = LOP_KHONG_KHOP;
      khongKhop.textContent = CHU_KHONG_KHOP;
      o.push(khongKhop);
    }
    if (total > MAX_RESULTS) {
      const them = luoi.ownerDocument.createElement(THE_THEM);
      them.className = LOP_THEM;
      them.textContent = CHU_THEM;
      o.push(them);
    }
    // Danh sách rỗng của khung nhìn MẶC ĐỊNH cũng đi qua đúng lời gọi này: lưới sạch trơn,
    // KHÔNG một chữ nào (dòng "không khớp" phía trên chỉ có khi đang có điều kiện). Story
    // 2.6 đã chốt đúng điều đó — trạng thái rỗng KHÔNG có lời nhắn nào, không hình minh họa,
    // không skeleton. Mỗi sáng đều là trạng thái này; nó bình thường, không cần an ủi. Một
    // dòng chữ "chưa có gì" thêm ở đây là thứ `luoi.test.js` ghim là không được tồn tại.
    luoi.replaceChildren(...o);
    // Chiều cao ô sửa đo Ở ĐÂY, SAU `replaceChildren` — không lúc dựng phần tử: `scrollHeight`
    // của một phần tử còn RỜI khỏi DOM là `0`, nên đo sớm là ghim `block-size: 0px` và ô sửa
    // mở ra vô hình cho tới phím đầu tiên.
    if (dangSua !== null) caoTheoNoiDungSua(luoi.querySelector(CHON_SUA));
  }

  return { ve };
}
