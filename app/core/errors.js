// Từ vựng lỗi chung của core, adapter và view (AD-18).
//
// Tập mã là ĐÓNG: đúng sáu giá trị. Một tình huống lỗi mới thì thêm mã ở đây VÀ ở bảng ưu tiên
// dải băng của AD-17 cùng lúc — không bao giờ mượn lại một mã sẵn có cho nghĩa khác.
//
// Mọi lỗi băng qua ranh giới đều là `Error` có `.code` thuộc tập này, và câu chữ hiện cho người
// dùng lấy từ `MICROCOPY` — view không bao giờ tự soạn câu từ lỗi thô của trình duyệt.
//
// File này là `core/` thuần: không import gì, không chạm global trình duyệt.

/** Tập mã lỗi đóng. Đóng băng để một story sau không gán lén thêm mã thứ bảy. */
export const MA_LOI = Object.freeze({
  VERSION_SKEW: 'VERSION_SKEW',
  QUOTA: 'QUOTA',
  DB: 'DB',
  BAD_FILE: 'BAD_FILE',
  BAD_VERSION: 'BAD_VERSION',
  TOO_LONG: 'TOO_LONG',
});

/**
 * Ánh xạ mã → nguyên văn microcopy tiếng Việt.
 *
 * Bốn câu có nguồn là bảng "Dải băng thông báo" của EXPERIENCE.md, chép NGUYÊN VĂN từng ký tự
 * (dấu `—`, chữ HOA, dấu chấm cuối). `DB` và `BAD_VERSION` không có dòng trong bảng đó nên câu
 * của chúng được chốt trong spec Story 1.2: `BAD_VERSION` dùng chung câu với `BAD_FILE` (người
 * dùng thấy một câu; hai mã vẫn phân biệt được ở tầng mã).
 */
// Một câu duy nhất cho cả `BAD_FILE` và `BAD_VERSION` — viết một lần để hai bản chép tay
// không thể trôi khỏi nhau. Hai mã vẫn phân biệt được ở tầng mã.
const CAU_NAP_FILE_HONG =
  'Không nạp được file này — sai định dạng hoặc file hỏng. Dữ liệu đang có KHÔNG bị đụng tới. Thử file sao lưu khác.';

export const MICROCOPY = Object.freeze({
  [MA_LOI.VERSION_SKEW]:
    'Đã có bản mới. Tải lại trang — tab này đang ở chế độ chỉ đọc.',
  [MA_LOI.QUOTA]:
    'Không lưu được — trình duyệt hết dung lượng. Xuất sao lưu, rồi xóa bớt ghi chú cũ. Chữ vừa gõ CHƯA được lưu.',
  [MA_LOI.DB]:
    'Không mở được kho dữ liệu của trình duyệt. Tải lại trang. Nếu vẫn hỏng, xuất sao lưu ở một tab khác trước khi thử tiếp.',
  [MA_LOI.BAD_FILE]: CAU_NAP_FILE_HONG,
  [MA_LOI.BAD_VERSION]: CAU_NAP_FILE_HONG,
  [MA_LOI.TOO_LONG]:
    'Ghi chú này đã đạt 20.000 ký tự — không nhận thêm. Chốt bằng Ctrl+Enter rồi gõ tiếp vào ghi chú mới.',
});

function kiemTraMa(code) {
  if (!Object.prototype.hasOwnProperty.call(MICROCOPY, code)) {
    // Ném thay vì trả câu mặc định: một mã lạ là lỗi lập trình, và một câu mặc định
    // biến nó thành câu vô nghĩa trước mặt người dùng — đúng thứ AD-18 sinh ra để chặn.
    throw new TypeError(`Mã lỗi ngoài tập đóng: ${String(code)}`);
  }
}

/** Nguyên văn microcopy của một mã. Mã ngoài tập → `TypeError`. */
export function microcopyLoi(code) {
  kiemTraMa(code);
  return MICROCOPY[code];
}

/** Dựng `Error` mang `code` và message là microcopy tương ứng. Mã ngoài tập → `TypeError`. */
export function loiUngDung(code) {
  kiemTraMa(code);
  const loi = new Error(MICROCOPY[code]);
  loi.code = code;
  return loi;
}
