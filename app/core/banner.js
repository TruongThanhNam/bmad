// Bảng bảy nguồn của dải băng, và luật ưu tiên giữa chúng (AD-17).
//
// Vì sao một file RIÊNG và không nhồi vào `errors.js`: tập mã lỗi của AD-18 là từ vựng của
// MỌI tầng và nó phải giữ đúng một việc — "đây là sáu mã, đây là câu chữ của chúng". Thứ tự
// ưu tiên của dải băng là một câu hỏi khác (cái nào được thay cái nào), và nó có hai giá trị
// KHÔNG PHẢI LỖI trong bảng. Trộn hai thứ đó vào một file là cách tập mã đóng lặng lẽ mọc
// thêm hai thành viên không phải mã lỗi.
//
// Vì sao ở `core/` mà không ở `view/banner.js` như chữ của AC: luật "ưu tiên thấp không thay
// được ưu tiên cao đang hiện" chỉ nghiệm thu được nếu nó là bất biến của ĐƯỜNG GHI. View
// không giữ state riêng và không có cơ chế subscribe (`view/luoi.js:12`), nên một view không
// nhớ lượt trước thì không có gì để so. `core/state.js` gác mọi phép đặt `banner` bằng
// `thayDuoc` dưới đây; `view/banner.js` import bảng chỉ để biết hàng nào đóng được. Không có
// cạnh `core → view` nào.
//
// Ưu tiên là VỊ TRÍ TRONG MẢNG, không phải một con số: `test/nguong-tap-trung.test.js` chỉ
// miễn trừ `0` và `1`, nên một hàng mang `uuTien: 2` là đỏ ngay. Mảng có thứ tự còn mạnh hơn
// một con số — không có cách nào khai hai hàng cùng ưu tiên, và "thêm nguồn thứ tám" trở
// thành một thay đổi nhìn thấy được trong đúng một literal.
//
// File này là `core/` thuần: chỉ import `core/errors.js`, không chạm global trình duyệt.

import { MA_LOI, MICROCOPY, microcopyLoi } from './errors.js';

/**
 * Tập giá trị hợp lệ của `state.banner` — một CHUỖI, và chỉ một trong những giá trị dưới đây.
 *
 * Sáu mã lỗi của AD-18 cộng hai sentinel KHÔNG-PHẢI-LỖI (hàng 6 và hàng 7 của bảng AD-17).
 * Tám giá trị cho BẢY hàng, và số lệch đó là đúng: hàng 4 ("nạp file thất bại") chở hai mã
 * cùng nghĩa với người dùng (`BAD_FILE` · `BAD_VERSION` — `errors.js` đã cho chúng chung một
 * câu), còn `TOO_LONG` chiếm ĐÚNG MỘT ô — hàng 5. Phân biệt "ưu tiên 4 khi đến từ file nạp ·
 * 5 khi đến từ bàn phím" của AD-17/AD-18 bị BỎ có chủ đích: hai ca đó không bao giờ cùng tồn
 * tại (nạp file là một thao tác chặn, không ai gõ giữa lúc nó chạy), và giữ nó lại buộc
 * `banner` phải mang một object thay vì một chuỗi — tức 14 chỗ đặt `banner` trong `state.js`
 * và mọi assertion của `test/core-state.test.js` phải viết lại. Cái giá đã cân và chọn.
 */
export const LOAI_BANG = Object.freeze({
  ...MA_LOI,
  /** Hàng 6 — ngoại lệ DUY NHẤT của AD-16: một thao tác thành công được phép nói một câu. */
  NAP_FILE_XONG: 'NAP_FILE_XONG',
  /** Hàng 7 — cảnh báo TRƯỚC khi kho chật (AD-10), khác hẳn `QUOTA` là "đã hỏng rồi". */
  DUNG_LUONG_SAP_HET: 'DUNG_LUONG_SAP_HET',
});

/**
 * Bảng AD-17, xếp ưu tiên GIẢM DẦN. Ưu tiên = vị trí. Không một con số nào viết ra.
 *
 * Cả bảy hàng có mặt NGAY, kể cả bốn nguồn chưa có người phát (`BAD_FILE`/`BAD_VERSION` →
 * Epic 4, `VERSION_SKEW` → Epic 7, cảnh báo dung lượng → Epic 8). AD-17 nói thêm một nguồn là
 * "sửa bảng trước, không phải sau": bảng đủ trước thì mỗi epic sau chỉ còn việc phát, và
 * không epic nào tự chế một chỗ nói thứ hai.
 *
 * Ba hàng đầu KHÔNG đóng được, và đó không phải thẩm mỹ: cả ba nói rằng dữ liệu đang không an
 * toàn, nên chúng chỉ được tắt bởi một phép ghi sau đó THÀNH CÔNG (AD-8) hay một lần tải lại
 * trang — không bởi một cú bấm cho đỡ khó chịu.
 */
export const BANG_UU_TIEN = Object.freeze([
  Object.freeze({ loai: Object.freeze([LOAI_BANG.VERSION_SKEW]), dongDuoc: false }),
  Object.freeze({ loai: Object.freeze([LOAI_BANG.QUOTA]), dongDuoc: false }),
  Object.freeze({ loai: Object.freeze([LOAI_BANG.DB]), dongDuoc: false }),
  Object.freeze({
    loai: Object.freeze([LOAI_BANG.BAD_FILE, LOAI_BANG.BAD_VERSION]),
    dongDuoc: true,
  }),
  Object.freeze({ loai: Object.freeze([LOAI_BANG.TOO_LONG]), dongDuoc: true }),
  Object.freeze({ loai: Object.freeze([LOAI_BANG.NAP_FILE_XONG]), dongDuoc: true }),
  Object.freeze({ loai: Object.freeze([LOAI_BANG.DUNG_LUONG_SAP_HET]), dongDuoc: true }),
]);

/**
 * Câu chữ của hai hàng KHÔNG-PHẢI-LỖI.
 *
 * `microcopyLoi` NÉM với một giá trị ngoài `MICROCOPY` (`errors.js:47`), và đó là luật đúng —
 * không được nới. Nên hai sentinel có bảng riêng ở đây, và `microcopyBanner` phân nhánh theo
 * bảng thay vì gọi thẳng `microcopyLoi` cho mọi hàng.
 *
 * Hàng 6 là `null`, có chủ đích: nguyên văn của nó là `Đã nạp N ghi chú, bỏ qua M ghi chú đã
 * có.` — nó MANG HAI CON SỐ THẬT, nên một chuỗi loại trần không chở được dữ liệu đó. Story
 * 4.3 đã gắn phần tham số (`cauNapFileXong` bên dưới), nhưng giá trị trong BẢNG vẫn là `null`
 * và phải ở nguyên như vậy: `null` ở đây nghĩa là "hàng có mặt trong bảng, chữ chỉ dựng được
 * khi có hai con số" — và `view/banner.js` vẽ RỖNG khi thiếu chúng, chứ không vẽ một dải băng
 * trắng không ai hiểu.
 */
export const MICROCOPY_BANG = Object.freeze({
  [LOAI_BANG.NAP_FILE_XONG]: null,
  // Nguyên văn `EXPERIENCE.md` (bảng "Dải băng thông báo", dòng 1b) — từng ký tự.
  [LOAI_BANG.DUNG_LUONG_SAP_HET]: 'Dung lượng sắp hết. Xuất sao lưu trước khi nó hết.',
});

/** Vị trí của một loại trong bảng, tức ƯU TIÊN của nó. Loại ngoài bảng → `TypeError`, cùng
 *  lý do `errors.js` ném với một mã lạ: một loại không có trong bảng là lỗi lập trình, và
 *  xử nó thành "ưu tiên thấp nhất" trong im lặng là cách nguồn thứ tám lọt vào. */
function viTri(loai) {
  const i = BANG_UU_TIEN.findIndex((hang) => hang.loai.includes(loai));
  if (i < 0) throw new TypeError(`loại dải băng ngoài bảng AD-17: ${String(loai)}`);
  return i;
}

/**
 * Gác: loại này PHẢI có trong bảng, nếu không thì ném.
 *
 * Có tên riêng thay vì một `viTri(loai);` bị vứt giữa thân hàm: một lời gọi không dùng kết quả
 * trông như mã chết, và một lần dọn dẹp (hay một lint `no-unused-expressions`) sẽ xóa nó —
 * cùng lúc gỡ mất bảo đảm "loại ngoài bảng thì NÉM", trong im lặng.
 */
function phaiTrongBang(loai) {
  viTri(loai);
}

/** Hàng của loại này có nút đóng không. Loại ngoài bảng → `TypeError`. */
export function dongDuoc(loai) {
  return BANG_UU_TIEN[viTri(loai)].dongDuoc;
}

/**
 * Thông báo `moi` có được phép thay thông báo `dangHien` không (AD-17).
 *
 * Hàm THUẦN, và nó là chỗ duy nhất luật ưu tiên được viết ra. Ba nhánh:
 *
 * - `moi` rỗng luôn được: đó là phép XÓA CHỦ ĐÍCH. AD-8 đòi `QUOTA` (không đóng được) phải tự
 *   tắt khi một phép ghi sau đó thành công, và phép gác không được chặn đúng cái đường đó.
 * - `dangHien` rỗng luôn nhận: không có gì để giữ.
 * - còn lại: vị trí nhỏ hơn là ưu tiên cao hơn. `<=` chứ không `<` — cùng mức thì cái mới
 *   thay cái cũ, vì hai lần cùng một chuyện thì lần sau là lần đang xảy ra.
 *
 * @param {string|null} dangHien Loại đang hiện, hoặc rỗng.
 * @param {string|null} moi Loại vừa phát sinh, hoặc rỗng để tắt dải băng.
 * @returns {boolean}
 */
export function thayDuoc(dangHien, moi) {
  if (moi === null || moi === undefined) return true;
  // Kiểm `moi` TRƯỚC nhánh "chưa có gì đang hiện": một loại ngoài bảng phải ném ở mọi đường,
  // kể cả đường mà câu trả lời tình cờ là `true`. Nếu không, nguồn thứ tám lọt vào đúng lúc
  // dải băng đang rỗng — tức lúc nó hay lọt vào nhất.
  const viTriMoi = viTri(moi);
  if (dangHien === null || dangHien === undefined) return true;
  return viTriMoi <= viTri(dangHien);
}

/**
 * Câu của hàng 6, dựng từ hai con số THẬT của phép gộp (`core/backup.js` → `gopTheoId`).
 *
 * Nguyên văn `EXPERIENCE.md` (bảng "Dải băng thông báo", dòng 6) — từng ký tự, và hai con số
 * viết bằng CHỮ SỐ. Đây là ngoại lệ duy nhất của quy tắc im-lặng-khi-thành-công (AD-16), nên
 * nó phải nói ra đúng chuyện vừa xảy ra chứ không nói "xong rồi".
 *
 * Thiếu tham số → `null`, không phải một câu có chỗ trống: một dải băng nói "Đã nạp undefined
 * ghi chú" tệ hơn hẳn một dải băng không hiện ra.
 */
function cauNapFileXong(so) {
  if (so === null || so === undefined) return null;
  if (typeof so.added !== 'number' || typeof so.skipped !== 'number') return null;
  return `Đã nạp ${so.added} ghi chú, bỏ qua ${so.skipped} ghi chú đã có.`;
}

/**
 * Nguyên văn microcopy của một loại dải băng — hoặc `null` khi hàng chưa có chữ.
 *
 * Phân nhánh theo BẢNG, không gọi thẳng `microcopyLoi` cho mọi hàng: hai sentinel không nằm
 * trong `MICROCOPY` của `errors.js`, và gọi `microcopyLoi` với chúng là một `TypeError` giữa
 * một lượt vẽ.
 *
 * Xét theo GIÁ TRỊ của `MICROCOPY`, không theo `MA_LOI`: cả hai bảng đều ánh xạ tên sang
 * chính nó hôm nay, nên hai phép tra tình cờ cho cùng kết quả — nhưng `MICROCOPY` là chỗ câu
 * chữ THẬT SỰ sống, và tra nó là phép kiểm đúng cho câu hỏi "hàng này có câu sẵn chưa".
 *
 * `so` là THAM SỐ TUỲ CHỌN, và chỉ hàng 6 đọc tới nó: sáu hàng lỗi cùng hàng 7 mang câu trần,
 * nên đưa thêm tham số cho chúng không đổi một ký tự nào. Nhờ vậy mọi chỗ gọi cũ (`view/
 * banner.js` trước Story 4.3, và mọi ca test của chúng) vẫn đúng nguyên.
 *
 * @param {string} loai Một giá trị của `LOAI_BANG`. Ngoài bảng → `TypeError`.
 * @param {{added: number, skipped: number}} [so] Hai con số của phép gộp — chỉ hàng 6 dùng.
 * @returns {string|null}
 */
export function microcopyBanner(loai, so) {
  phaiTrongBang(loai);
  if (Object.prototype.hasOwnProperty.call(MICROCOPY, loai)) return microcopyLoi(loai);
  if (loai === LOAI_BANG.NAP_FILE_XONG) return cauNapFileXong(so);
  return MICROCOPY_BANG[loai];
}
