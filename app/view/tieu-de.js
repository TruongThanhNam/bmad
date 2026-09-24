// Tiêu đề tab — con số duy nhất sản phẩm này chiếu ra ngoài cửa sổ của chính nó (Story 2.6).
//
// Ba luật của tầng view, y hệt `o-soan.js`, `luoi.js` và `mau-giay.js`, và cưỡng chế bằng test
// chứ không bằng chú thích:
//
// - View CHỈ ĐỌC state. Ở đây là đúng MỘT phép đọc (`store.state.notes`) và không một phép ghi
//   nào. Con số là một HÀM của state (AD-19), không phải một hiệu ứng lề mà `state.js` hay
//   `o-soan.js` phát ra sau lưng lượt vẽ — nếu nó là hiệu ứng lề thì nó sẽ trôi khỏi state ở
//   đúng nhánh mà không ai nghĩ tới.
// - View không giữ state riêng. Không bộ nhớ con số đã đặt, không so với lượt trước — mỗi lượt
//   `ve()` tính lại từ đầu, nên không có gì để lệch.
// - View không bao giờ import `app/adapters/`, và không chạm `document` toàn cục: tài liệu đi
//   vào qua THAM SỐ, cùng lý do `luoi.js` nhận gốc DOM qua tham số.
//
// Và file này KHÔNG biết tới `luoi.js`, cũng như `luoi.js` không biết tới nó. Chúng chỉ trùng
// nhau ở chỗ cùng được `app/main.js` gọi trong một lượt vẽ — đó là chỗ duy nhất biết cả hai.
//
// "Hôm nay" hỏi lại ở MỖI lượt vẽ (`mocHienTai()` chạy trong `ve`, không một lần lúc nối), cùng
// lý do và cùng cái giá đã nhận ở `luoi.js`: một tab mở qua 00:00 thì lượt vẽ đầu của ngày mới
// đếm theo ngày mới.

import { locGhiChu } from '../core/query.js';
import { nowIso } from '../core/time.js';

/** Tên sản phẩm, đuôi cố định của tiêu đề.
 *
 *  Chuỗi này bị viết LẦN THỨ HAI ở đây — `index.html` đã mang nó ở dạng tĩnh — và trùng lặp đó
 *  có chủ ý, đúng khuôn `'ghichu.theme'` mà AD-19 cho phép: bản tĩnh để tab có tên đúng TRƯỚC
 *  khi module nào chạy, bản này để dựng lại tiêu đề có số. Một ca test đọc cả hai file và ghim
 *  rằng chúng không trôi khỏi nhau. */
const TEN_TRANG = 'Ghi chú hàng ngày';

/** Dấu ngăn giữa con số và tên trang — nguyên văn `4 - Ghi chú hàng ngày` của UX-DR-21. */
const NGAN = ' - ';

/**
 * Khối điều kiện RỖNG, dựng tại chỗ và KHÔNG đọc từ `store.state.dieuKien`.
 *
 * Đây là toàn bộ điểm của AD-19: con số là số ghi chú của hôm nay, **không** phải số mẩu đang
 * hiển thị, nên nó không được đi theo điều kiện Nam đang bật ở Epic 6. Đọc state rồi "tạm bỏ
 * qua" là để lại đúng một chỗ cho người sau nối nhầm lại.
 *
 * Và vì `date === null` nghĩa là hôm nay (AD-15), khối này đi qua `locGhiChu` chính là phép lọc
 * hôm nay — không có hàm đếm thứ hai nào được viết ra, nên không có đường thứ hai nào để lệch.
 */
const DIEU_KIEN_RONG = Object.freeze({ keyword: null, date: null });

/**
 * Tiêu đề tab ứng với một con số.
 *
 * @param {number} so Số ghi chú của hôm nay.
 * @returns {string} `4 - Ghi chú hàng ngày`, hoặc đúng `Ghi chú hàng ngày` khi chưa có cái nào.
 *   Ca rỗng bỏ hẳn tiền tố là quyết định của người dùng: trạng thái rỗng không nói gì, kể cả
 *   trên thanh tab — và một con `0` mỗi sáng đọc như một badge "bạn chưa làm gì". Nó cũng trùng
 *   đúng chuỗi tĩnh của `index.html`, nên không khung hình nào nháy một con số rồi mất.
 */
export function tieuDe(so) {
  if (so === 0) return TEN_TRANG;
  return `${so}${NGAN}${TEN_TRANG}`;
}

/**
 * Nối tiêu đề tab vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {Document} [doc] Tài liệu mang tiêu đề — mặc định `document`. Test truyền một tài liệu
 *   tối giản vào đây, nên tệp này không tự chạm một global nào.
 * @param {() => string} [mocHienTai] Nguồn mốc hiện tại, mặc định `nowIso` của `core/time.js`.
 *   Là HÀM chứ không phải một chuỗi: nó phải được hỏi lại ở mỗi lượt vẽ.
 * @returns {{ ve: () => void }} `ve` đặt lại tiêu đề từ state.
 */
export function noiTieuDe(store, doc = document, mocHienTai = nowIso) {
  // Không có tài liệu thì không có tiêu đề để đặt — và cũng không có gì để ném. `ve` vẫn phải
  // gọi được, vì `app/main.js` treo nó vào một lời hứa không bao giờ bị từ chối. Cùng khuôn
  // `noiLuoi` và `noiOSoan`.
  if (doc === null || doc === undefined) return { ve() {} };

  /** Đặt lại tiêu đề từ state. Một phép đọc, một phép đếm, một phép gán — không nhánh nào khác. */
  function ve() {
    const homNay = locGhiChu(store.state.notes, DIEU_KIEN_RONG, mocHienTai());
    doc.title = tieuDe(homNay.total);
  }

  return { ve };
}
