// Bộ truy vấn — biến `(notes, dieuKien, mốc hiện tại)` thành danh sách hiển thị (AD-15).
//
// Khung nhìn mặc định là VẮNG MẶT của điều kiện, không phải một điều kiện tên "hôm nay": khối
// `{ keyword: null, date: null }` không mang ngày nào, nên "hôm nay" được SUY RA ngay tại đây
// từ mốc thời gian mà chỗ gọi truyền xuống. Không cờ `today`, không giá trị mặc định nào trong
// state — thêm một trong hai thứ đó là dựng nửa điều kiện thứ ba mà AD-15 cấm.
//
// Hàm THUẦN, và ba nửa của chữ "thuần" đều có lý do riêng:
// - Không đọc đồng hồ: mốc hiện tại đi vào qua THAM SỐ (`nowIso()` của `core/time.js` do
//   `app/main.js` truyền xuống), nên ca test dựng được "qua nửa đêm" mà không cần một đồng hồ
//   giả, và `app/core/**` giữ được luật "chỉ `time.js` chạm `Date`".
// - Không chạm DOM: cùng một phép lọc phải kiểm được ở tầng lõi, không cần trình duyệt.
// - Không async: `notes` đã nằm sẵn trong RAM và đã sắp sẵn (AD-6), nên đây là một phép quét
//   mảng đồng bộ. Không cổng mới, không phương thức kho mới.
//
// Và bộ truy vấn LỌC, KHÔNG SẮP LẠI: thứ tự giảm dần theo `localStamp` là bất biến do
// `sapGiamDan` trong `state.js` đặt. Sắp lại ở đây là dựng đường thứ hai cho cùng một luật
// thứ tự, và hai đường sẽ lệch.

import { fold } from './fold.js';
import { localDate } from './time.js';

/**
 * Danh sách ghi chú khớp khối điều kiện, giữ nguyên thứ tự đầu vào.
 *
 * @param {Array<object>} notes Toàn bộ ghi chú trong RAM, đã sắp giảm dần theo `localStamp`.
 * @param {{ keyword: string | null, date: string | null }} dieuKien Khối điều kiện của state.
 * @param {string} mocHienTai Mốc hiện tại dạng ISO-8601 có offset — CHUỖI, không phải hàm và
 *   không phải một mốc thời gian. `localDate` chỉ cắt mười ký tự đầu, nên
 *   `localDate({ createdAt: mocHienTai })` là đúng phép mà một bản ghi đi qua, không phải mẹo.
 * @returns {Array<object>} Các bản ghi khớp, theo đúng thứ tự chúng đứng trong `notes`.
 */
export function locGhiChu(notes, dieuKien, mocHienTai) {
  // CẢ HAI nửa `null` → hôm nay. Đây là toàn bộ chỗ mà chữ "hôm nay" tồn tại trong sản phẩm.
  // Có một nửa bất kỳ thì "hôm nay" KHÔNG tham gia: từ khóa một mình tìm trên MỌI ngày (AD-15).
  const macDinh = dieuKien.keyword === null && dieuKien.date === null;
  const ngay = macDinh ? localDate({ createdAt: mocHienTai }) : dieuKien.date;
  // Điều kiện chữ gấp MỘT LẦN ở đây, không gấp trong vòng lặp: `textFolded` của bản ghi đã
  // gấp sẵn lúc tạo, nên so hai chuỗi đã gấp là đủ — và không dòng nào ở đây tự bỏ dấu.
  const chuGap = dieuKien.keyword === null ? null : fold(dieuKien.keyword);
  return notes.filter((note) => {
    if (ngay !== null && localDate(note) !== ngay) return false;
    // Hai điều kiện là phép GIAO: có chữ thì lọc thêm, không thay cho phép lọc ngày.
    return chuGap === null || note.textFolded.includes(chuGap);
  });
}

/**
 * Các khoảng khớp của từ khóa trong một chuỗi ĐÃ GẤP — mọi lần xuất hiện, không chồng nhau.
 *
 * Tính trên `textFolded` rồi dùng thẳng trên `text`: `fold` giữ nguyên độ dài (AD-5), nên vị
 * trí thứ `i` của chuỗi gấp là vị trí thứ `i` của chuỗi gốc.
 *
 * @param {string} textFolded Nội dung đã gấp của bản ghi.
 * @param {string | null} keyword Từ khóa CHƯA gấp, đúng như state mang nó.
 * @returns {Array<[number, number]>} Các cặp `[đầu, cuối)` tăng dần; rỗng khi không có từ khóa.
 */
export function khoangKhop(textFolded, keyword) {
  if (keyword === null || keyword === '') return [];
  const chuGap = fold(keyword);
  const ra = [];
  let tu = textFolded.indexOf(chuGap);
  while (tu !== -1) {
    ra.push([tu, tu + chuGap.length]);
    tu = textFolded.indexOf(chuGap, tu + chuGap.length);
  }
  return ra;
}
