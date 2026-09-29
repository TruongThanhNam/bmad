// Hai phép khẳng định về chân trang mà HAI tệp test cùng cần, viết ĐÚNG MỘT LẦN.
//
// `chan-trang-hai-link.test.js` (hai link không bao giờ ẩn) và `bo-cuc-bon-tang.test.js` (hình
// dạng tĩnh của tầng 4) cùng khẳng định "nút `chan-link` mang nhãn X có trong HTML" và "nút
// theme được đẩy sang phải bằng `margin-inline-start: auto`". Trước đây mỗi tệp chép một bản,
// nên lần đàm phán lại ở Story 4.2/4.3 phải tìm ra cả hai chỗ. Ý nghĩa hai phép kiểm giữ
// nguyên; chỉ chỗ viết regex là một.

/** Mẫu khớp `<button class="… chan-link …">nhãn</button>`. `nhan` là chữ thuần, không cần thoát. */
export function mauNutChanLink(nhan) {
  return new RegExp(`<button[^>]*class="[^"]*\\bchan-link\\b[^"]*"[^>]*>\\s*${nhan}\\s*</button>`);
}

/** Mẫu khớp luật `.nut-theme { … margin-inline-start: auto … }` trong CSS. */
export const MAU_LE_NUT_THEME = /\.nut-theme\s*\{[^}]*margin-inline-start\s*:\s*auto/;
