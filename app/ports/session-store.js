// Chữ ký cổng "kho cấu hình bền, dùng chung" cộng danh tính của tab đang chạy (AD-2, AD-3).
//
// Kho này KHÔNG bao giờ giữ ghi chú — nó giữ đúng ba khóa cấu hình liệt kê dưới đây, và
// không có khóa thứ tư. Danh tính tab thì ngược lại: nó chỉ sống trong một phiên duyệt của
// một tab, và nó là thứ làm bản nháp riêng tab (AD-3 tầng B) phân biệt được chủ của nó.
//
// Hai việc khác phạm vi sống nhưng cùng một cổng, có chủ ý: cả hai đều là "cấu hình nhỏ,
// đọc lúc khởi động", và tách thành hai cổng chỉ để chúng đi cùng một adapter là thêm một
// chữ ký mà không thêm một ràng buộc nào.
//
// ĐỒNG BỘ hay BẤT ĐỒNG BỘ, và lỗi đi ra bằng đường nào — quy tắc cho cả năm cổng:
//
// - `sessionStore` là cổng DUY NHẤT đồng bộ. Cấu hình phải đọc được TRƯỚC lần vẽ đầu tiên
//   (giao diện sáng/tối không được nháy), và danh tính tab phải có trước mọi phép ghi bản
//   nháp; một lời hứa chưa hoàn tất ở hai chỗ đó là một khung hình sai. Nó cũng nhỏ theo
//   thiết kế: ba khóa, mỗi khóa một chuỗi ngắn.
// - `noteStore`, `fileIO`, `quota` là bất đồng bộ; `channel` đồng bộ nhưng không báo lỗi.
// - Lỗi có mã của AD-18 đi ra theo đúng bề mặt của cổng: cổng đồng bộ thì NÉM, cổng bất
//   đồng bộ thì trả về một lời hứa BỊ TỪ CHỐI — không bao giờ vừa ném vừa từ chối.
//
// Ghi rõ ở đây vì nếu không thì cùng một lớp hỏng (hết dung lượng) sẽ được viết hai đường xử
// lý khác nhau ở Story 1.6, và một trong hai đường sẽ không có ai đi qua.
//
// Tệp này là `ports/` thuần: không import gì, không chạm global.

/**
 * Ba khóa cấu hình được phép tồn tại, không có khóa thứ tư (AD-3 tầng B′).
 *
 * - `theme` — giao diện sáng hay tối người dùng đã chọn.
 * - `lastBackupAt` — mốc lần xuất sao lưu gần nhất, để dòng nhắc ở chân trang biết đếm.
 * - `persistDenied` — cờ ghi rằng trình duyệt đã từ chối giữ dữ liệu lâu dài, nên dữ liệu
 *   mong manh hơn và dòng nhắc phải sớm hơn.
 *
 * @typedef {'theme' | 'lastBackupAt' | 'persistDenied'} SessionKey
 */

/**
 * Đọc một khóa cấu hình.
 *
 * @callback SessionStoreRead
 * @param {SessionKey} key Khóa cần đọc.
 * @returns {string | null} Giá trị đã ghi, hoặc `null` khi khóa chưa từng được ghi.
 */

/**
 * Ghi một khóa cấu hình.
 *
 * @callback SessionStoreWrite
 * @param {SessionKey} key Khóa cần ghi.
 * @param {string} value Giá trị mới, đã ở dạng chuỗi.
 * @returns {void} Ném lỗi mang mã của AD-18 khi kho từ chối.
 */

/**
 * Xóa một khóa cấu hình, đưa nó về trạng thái chưa từng được ghi.
 *
 * @callback SessionStoreRemove
 * @param {SessionKey} key Khóa cần xóa.
 * @returns {void}
 */

/**
 * Danh tính của tab đang chạy — bền trong suốt một phiên duyệt của tab đó, và **không** dùng
 * chung với tab khác, kể cả tab được nhân đôi từ nó.
 *
 * @callback SessionStoreTabIdentity
 * @returns {string} Định danh tab, sinh mới nếu phiên này chưa có.
 */

/**
 * Ghi đè danh tính của tab đang chạy.
 *
 * Cần đúng một chỗ: kho ghi chú phát hiện rằng một tab khác đang sống với cùng danh tính (tab
 * bị nhân đôi) và sinh danh tính mới. Kho đó không được chạm phạm vi phiên, nên action là chỗ
 * nối hai cổng lại.
 *
 * @callback SessionStoreWriteTabIdentity
 * @param {string} id Danh tính mới của tab này.
 * @returns {void} Ném lỗi mang mã của AD-18 khi kho từ chối.
 */

/**
 * @typedef {object} SessionStorePort
 * @property {SessionStoreRead} read
 * @property {SessionStoreWrite} write
 * @property {SessionStoreRemove} remove
 * @property {SessionStoreTabIdentity} tabIdentity
 * @property {SessionStoreWriteTabIdentity} writeTabIdentity
 */

/** Tên các phương thức mà một hiện thực của cổng này bắt buộc phải có. */
export const SESSION_STORE_METHODS = Object.freeze([
  'read',
  'write',
  'remove',
  'tabIdentity',
  'writeTabIdentity',
]);
