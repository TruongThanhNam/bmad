// Bỏ dấu tiếng Việt — và CHỈ ở đây (AD-5).
//
// Đầu ghi (`textFolded` ở Story 1.6) và đầu tìm (Epic 6) phải bỏ dấu y hệt nhau. Nếu mỗi nơi
// tự chế một cách, gõ `phan quyen` không ra `Phân quyền`, và triệu chứng duy nhất là dùng thật
// mới thấy. Nên chỉ có một hàm, ở đúng file này; `test/fold-tap-trung.test.js` quét cả cây
// `app/` và làm đỏ mọi nơi khác dám tự bỏ dấu.
//
// THỨ TỰ BẮT BUỘC: map `đ→d` / `Đ→D` TRƯỚC, rồi phân rã chuẩn (dạng NFD), rồi bỏ dấu kết hợp,
// rồi hạ chữ thường. Lý do: `đ` (U+0111) là ký tự độc lập, KHÔNG có phân rã chuẩn — phân rã
// rồi bỏ dấu vẫn để nguyên `đ`, và `fold('Đường')` ra `'đuong'` chứ không phải `'duong'`.
// Đảo thứ tự là sai, và có test ghim điều đó.
//
// BẤT BIẾN VỊ TRÍ (ràng buộc cứng): `fold(text).length === text.length`, và ký tự thứ `i` của
// kết quả ứng đúng ký tự thứ `i` của đầu vào. Epic 6 tô nền chỗ khớp BÊN TRONG chữ có dấu, nên
// vị trí tìm được trên chuỗi đã bỏ dấu phải dùng thẳng được trên chuỗi gốc; lệch một ký tự thì
// phần tô trượt dần mà không test nào ở Epic 6 bắt được.
//
// Hệ quả của bất biến đó: hàm chạy TỪNG CODE POINT một, không `normalize`/`toLowerCase` một
// lượt trên cả chuỗi. Ca nào mà bỏ dấu hoặc hạ chữ thường làm ĐỔI ĐỘ DÀI thì lùi về giữ nguyên
// ký tự gốc (người dùng chốt). Đánh đổi: vài ca hiếm không được bỏ dấu nên tìm kiếm bỏ sót —
// đầu vào đã ở dạng NFD (dấu kết hợp đứng rời) và `İ` (U+0130), vốn hạ thường ra HAI ký tự.
//
// File này là `core/` thuần: không import gì, không chạm global trình duyệt, chạy được ở Node.
//
// Đầu vào không phải chuỗi thì ném `TypeError` ngay tại chỗ — đây là lỗi LẬP TRÌNH, không phải
// câu hiện cho người dùng, nên story này không đụng tới `errors.js`.

/** Dấu kết hợp (Unicode Mark) — phần thừa ra sau khi phân rã chuẩn. */
const MAU_DAU_KET_HOP = /\p{M}/gu;

/** `đ`/`Đ` không có phân rã chuẩn, nên phải map tay TRƯỚC mọi bước khác. */
const MAP_D = new Map([
  ['đ', 'd'],
  ['Đ', 'D'],
]);

function moTa(giaTri) {
  return typeof giaTri === 'string' ? JSON.stringify(giaTri) : String(giaTri);
}

/**
 * Bỏ dấu một code point. Trả về chính nó nếu phép bỏ dấu làm đổi độ dài (UTF-16),
 * vì bất biến vị trí mạnh hơn việc bỏ dấu được thêm một ca hiếm.
 */
function boDauMotKyTu(kyTu) {
  const daMap = MAP_D.get(kyTu) ?? kyTu;
  // Chốt chặn `İ`: hạ chữ thường nó ra `i` + dấu chấm kết hợp, tức DÀI THÊM.
  if (daMap.toLowerCase().length !== daMap.length) return kyTu;
  const ketQua = daMap.normalize('NFD').replace(MAU_DAU_KET_HOP, '').toLowerCase();
  // Dấu kết hợp đứng rời (đầu vào đã ở dạng NFD) biến mất hẳn → độ dài tụt → giữ nguyên.
  return ketQua.length === kyTu.length ? ketQua : kyTu;
}

/**
 * Bỏ dấu tiếng Việt và hạ chữ thường, GIỮ NGUYÊN vị trí từng ký tự.
 *
 * @param {string} text
 * @returns {string} cùng độ dài UTF-16 với `text`
 */
export function fold(text) {
  if (typeof text !== 'string') {
    throw new TypeError(`fold(text) cần một chuỗi, nhận được ${moTa(text)}`);
  }
  let ketQua = '';
  // Lặp theo code point (không theo đơn vị UTF-16) để cặp thay thế của emoji không bị xẻ đôi.
  for (const kyTu of text) {
    ketQua += boDauMotKyTu(kyTu);
  }
  return ketQua;
}
