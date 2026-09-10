// Mọi ngưỡng số của ứng dụng — và CHỈ ở đây (AD-14).
//
// Đây là file duy nhất dưới `app/` được phép chứa số literal; `test/nguong-tap-trung.test.js`
// quét cả cây và làm đỏ bất kỳ con số nào sống ở nơi khác. Story sau cần một ngưỡng thì
// thêm vào đây rồi import, không tự chế con số tại chỗ.
//
// File này là `core/` thuần: không import gì, không chạm global trình duyệt.

/** Trần độ dài nội dung một ghi chú. Kiểm ở CẢ BA cửa vào: chốt bản nháp · sửa · file nạp (AD-14). */
export const MAX_NOTE_CHARS = 20000;

/** Trần số kết quả trả về cho view. `query.js` (Story 1.3+/Epic 6) cắt `items` còn ngần này,
 *  nhưng `total` vẫn là số khớp thật — view lấy `total` cho hàng chip. */
export const MAX_RESULTS = 50;

/** Số dòng tối đa của một mẩu ghi chú thu gọn trong lưới (Epic 2 dùng để đặt chiều cao trần). */
export const COLLAPSED_LINES = 3;

/** Số ngày kể từ lần xuất sao lưu gần nhất trước khi hiện dòng nhắc ở chân trang (FR-17, Epic 8). */
export const BACKUP_NUDGE_DAYS = 7;

/** Cùng dòng nhắc đó, nhưng khi trình duyệt đã từ chối `persist` — dữ liệu mong manh hơn nên
 *  nhắc sớm hơn (AD-14). Epic 8 chọn giữa hai hằng này theo cờ `persistDenied`. */
export const BACKUP_NUDGE_DAYS_PERSIST_DENIED = 3;

/** Độ trễ debounce của tự lưu nội dung đang gõ, tính bằng mili giây (Story 1.7 / Epic 2). */
export const AUTOSAVE_MS = 400;

/** Nhịp tim của bản nháp: tab đang gõ dở cập nhật mốc này mỗi ngần đây mili giây (Story 1.7). */
export const DRAFT_BEAT_MS = 10000;

/** Bản nháp im lặng quá ngần này mili giây thì bị coi là bỏ rơi và tab khác được nhận (Story 1.7). */
export const DRAFT_STALE_MS = 30000;

/** Tỉ lệ quota đã dùng khiến cảnh báo trước ngưỡng bật (AD-10, Epic 8). */
export const QUOTA_WARN_RATIO = 0.80;

/** Vế thứ hai của cùng cảnh báo đó: còn dưới ngần này byte trống thì cảnh báo, dù tỉ lệ chưa tới.
 *  Viết dạng tích để đọc ra "50 MB" mà không phải đếm chữ số. */
export const QUOTA_WARN_FREE_BYTES = 50 * 1024 * 1024;

/** Phiên bản app, bump TAY ở mọi lần deploy (AD-21, checklist trong README).
 *  AD-21 chỉ so bằng nhau: tab thấy giá trị khác của mình thì vào chế độ chỉ đọc. */
export const APP_VERSION = '0.1.0';
