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
 * Sáu mã lỗi của AD-18 cộng BỐN sentinel KHÔNG-PHẢI-LỖI-CỦA-AD-18 (hàng 6 và hàng 7 của bảng
 * AD-17, cộng `TOO_LONG_TU_FILE` chia sẻ hàng 4 và `TOO_LONG_KHI_SUA` chia sẻ hàng 5). Mười giá
 * trị cho BẢY hàng: hàng 4 ("nạp file thất bại") chở BA mã cùng nghĩa với người dùng —
 * `BAD_FILE` · `BAD_VERSION` (đã chung câu từ trước) cộng `TOO_LONG_TU_FILE` (Story 4.3/4.4
 * review — epic-4-context.md đòi ưu tiên 4 cho ca này, ngang với lỗi nạp file, cao hơn hẳn
 * `TOO_LONG` của bàn phím ở hàng 5) — và hàng 5 chở HAI (Story 5.1). Story 7.1 thêm sentinel
 * thứ năm `MAU_SUA_BI_XOA` vào hàng 5 (nay chở BA): mười một giá trị, vẫn BẢY hàng.
 *
 * `TOO_LONG_TU_FILE` là sentinel RIÊNG của bảng này, KHÔNG một mã của `core/errors.js`'s
 * `MA_LOI` (tập đó vẫn đóng, đúng sáu giá trị — AD-18 không nới): một ghi chú vượt trần được
 * PHÁT HIỆN trong lúc đọc file nạp vẫn ném với `MA_LOI.TOO_LONG` y hệt ca bàn phím (một mã cho
 * một điều kiện lỗi ở tầng dữ liệu); tầng ACTION (`state.js` → `napSaoLuu`) mới là chỗ biết
 * NGUỒN của cái ném đó, và nó chọn sentinel này thay vì `TOO_LONG` trần khi nguồn là file — cùng
 * khuôn với cách `NAP_FILE_XONG`/`DUNG_LUONG_SAP_HET` đã là sentinel riêng của bảng, không phải
 * mã lỗi. `banner` vẫn là một CHUỖI thuần, không một chỗ nào trong 14 lần đặt `banner` ở
 * `state.js` phải đổi hình dạng — chỉ đúng một chỗ (nhánh bắt lỗi đọc file của `napSaoLuu`)
 * chọn sentinel này thay vì gọi thẳng `maBanner(loi)`.
 */
export const LOAI_BANG = Object.freeze({
  ...MA_LOI,
  /** Hàng 6 — ngoại lệ DUY NHẤT của AD-16: một thao tác thành công được phép nói một câu. */
  NAP_FILE_XONG: 'NAP_FILE_XONG',
  /** Hàng 7 — cảnh báo TRƯỚC khi kho chật (AD-10), khác hẳn `QUOTA` là "đã hỏng rồi". */
  DUNG_LUONG_SAP_HET: 'DUNG_LUONG_SAP_HET',
  /** Hàng 4 — `TOO_LONG` phát hiện lúc ĐỌC FILE NẠP, không phải lúc gõ. Xem docstring ở trên. */
  TOO_LONG_TU_FILE: 'TOO_LONG_TU_FILE',
  /**
   * Hàng 5 — `TOO_LONG` phát sinh trong CHẾ ĐỘ SỬA một mẩu đã chốt (Story 5.1).
   *
   * Cùng tiền lệ `TOO_LONG_TU_FILE`, chỉ khác chỗ nó rơi trong bảng: nó là một sentinel RIÊNG
   * của bảng này, KHÔNG một mã của `MA_LOI` (tập đó vẫn đóng, đúng sáu giá trị), và nó ở lại
   * đúng hàng 5 cạnh `TOO_LONG` vì với người dùng đây là cùng một chuyện — chỉ câu chữ khác.
   *
   * Vì sao cần câu riêng: câu của `TOO_LONG` kết bằng mệnh đề "Chốt bằng Ctrl+Enter rồi gõ tiếp
   * vào ghi chú mới." Mệnh đề đó chỉ đúng ở Ô SOẠN THẢO. Trong ô sửa của một mẩu ĐÃ chốt thì
   * `Ctrl+Enter` không làm gì cả, nên nó là một chỉ dẫn dẫn tới không đâu.
   */
  TOO_LONG_KHI_SUA: 'TOO_LONG_KHI_SUA',
  /**
   * Hàng 5 — mẩu đang sửa (hay còn chữ chờ ghi) vừa bị tab khác XÓA (Story 7.1).
   *
   * Sentinel riêng của bảng, không phải mã của `MA_LOI` (tập đó vẫn đóng): không phép ghi nào
   * hỏng — chỉ có chữ của Nam sắp không còn chỗ về. Quyết định OQ1: xóa thắng, không hồi sinh.
   * Hàng 5 vì nó cùng loại chuyện với vượt trần: chữ đang gõ không xuống được kho, và đóng được.
   */
  MAU_SUA_BI_XOA: 'MAU_SUA_BI_XOA',
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
    loai: Object.freeze([LOAI_BANG.BAD_FILE, LOAI_BANG.BAD_VERSION, LOAI_BANG.TOO_LONG_TU_FILE]),
    dongDuoc: true,
  }),
  // Hàng 5 chở HAI loại từ Story 5.1: `TOO_LONG` (ô soạn thảo) và `TOO_LONG_KHI_SUA` (ô sửa của
  // một mẩu đã chốt). Cùng ưu tiên vì với người dùng đây là cùng một chuyện — chỉ câu chữ khác.
  // Story 7.1 thêm loại thứ ba `MAU_SUA_BI_XOA`: chữ đang gõ không còn chỗ về trong kho.
  Object.freeze({
    loai: Object.freeze([
      LOAI_BANG.TOO_LONG,
      LOAI_BANG.TOO_LONG_KHI_SUA,
      LOAI_BANG.MAU_SUA_BI_XOA,
    ]),
    dongDuoc: true,
  }),
  Object.freeze({ loai: Object.freeze([LOAI_BANG.NAP_FILE_XONG]), dongDuoc: true }),
  Object.freeze({ loai: Object.freeze([LOAI_BANG.DUNG_LUONG_SAP_HET]), dongDuoc: true }),
]);

/**
 * Câu của hàng 5 khi trần bị vượt trong CHẾ ĐỘ SỬA: đúng câu của `TOO_LONG`, CẮT ở hết câu đầu.
 *
 * CẮT chứ không chép tay, cùng lý do `TOO_LONG_TU_FILE` tra lại câu của `BAD_FILE`: vế đầu
 * ("Ghi chú này đã đạt 20.000 ký tự — không nhận thêm.") phải đứng sau cả hai loại, và một bản
 * chép tay là chỗ hai câu bắt đầu trôi khỏi nhau.
 *
 * Neo vào `'. '` — dấu chấm CỘNG khoảng trắng — chứ không vào dấu chấm trần: `20.000` cũng có
 * một dấu chấm, và cắt ở đó cho ra "Ghi chú này đã đạt 20." `test/banner.test.js` ghim nguyên
 * văn kết quả, nên phép cắt không thể lặng lẽ trả về một câu khác.
 *
 * Không tìm thấy dấu kết câu thì trả NGUYÊN câu: đó là một đường lui xấu (nó mang lại đúng mệnh
 * đề `Ctrl+Enter` mà hàm này tồn tại để bỏ), và nó được viết ra như vậy có chủ ý — mọi lựa chọn
 * khác ở đây là một chuỗi rỗng hay một câu bịa, tức một dải băng không nói gì trước mặt người
 * dùng. Ca ghim nguyên văn là thứ giữ nhánh này không bao giờ chạy.
 */
const HET_CAU = '. ';

function cauTranKhiSua() {
  const cau = MICROCOPY[MA_LOI.TOO_LONG];
  const cat = cau.indexOf(HET_CAU);
  return cat < 0 ? cau : cau.slice(0, cat + 1);
}

/**
 * Câu chữ của BỐN hàng KHÔNG-PHẢI-MÃ-CỦA-`MICROCOPY`.
 *
 * `microcopyLoi` NÉM với một giá trị ngoài `MICROCOPY` (`errors.js:47`), và đó là luật đúng —
 * không được nới. Nên bốn sentinel có bảng riêng ở đây, và `microcopyBanner` phân nhánh theo
 * bảng thay vì gọi thẳng `microcopyLoi` cho mọi hàng.
 *
 * `TOO_LONG_TU_FILE` dùng LẠI nguyên văn của `BAD_FILE` (`MICROCOPY[MA_LOI.BAD_FILE]`), không
 * chép tay: cùng một câu "Không nạp được file này..." phải đứng sau cả ba mã của hàng 4, và tra
 * qua bảng có sẵn là cách một bản chép tay không thể trôi khỏi bản kia.
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
  // Câu của `BAD_FILE`/`BAD_VERSION`, tra lại chứ không chép — xem docstring ở trên.
  [LOAI_BANG.TOO_LONG_TU_FILE]: MICROCOPY[MA_LOI.BAD_FILE],
  // Câu của `TOO_LONG`, CẮT ở hết câu đầu — xem `cauTranKhiSua` ngay trên.
  [LOAI_BANG.TOO_LONG_KHI_SUA]: cauTranKhiSua(),
  // Nguyên văn quyết định OQ1 của spec 7.1 (namtt, 2026-09-25) — từng ký tự.
  [LOAI_BANG.MAU_SUA_BI_XOA]:
    'Ghi chú này vừa bị xóa ở tab khác. Chép chữ ra trước khi rời ô sửa nếu còn cần.',
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
 * Phân nhánh theo BẢNG, không gọi thẳng `microcopyLoi` cho mọi hàng: ba sentinel không nằm
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
