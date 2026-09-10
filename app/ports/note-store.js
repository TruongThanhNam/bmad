// Chữ ký cổng "kho ghi chú bền" — lõi cần thế giới cung cấp gì để giữ ghi chú (AD-2).
//
// Từ vựng ở đây trừu tượng có chủ ý: lõi chỉ biết "một kho ghi chú bền có giao dịch", không
// biết kho đó được dựng bằng công nghệ nào. Đó là điều làm mọi module `core/` test được ở
// Node mà không cần giả lập trình duyệt, và làm việc thay kho bằng thứ khác thành một thay
// đổi cục bộ trong `app/adapters/`.
//
// Tệp này là `ports/` thuần: không import gì, không chạm global.
//
// Danh sách tên phương thức là dữ liệu chạy được, không phải văn bản: `./index.js` gộp năm
// danh sách này thành bảng cho `kiemTraPorts`, nên chữ ký và phép kiểm không thể trôi khỏi
// nhau — thêm một phương thức ở JSDoc mà quên danh sách là thêm một phương thức không ai
// cưỡng chế.

/**
 * Một ghi chú như kho bền nhìn thấy nó. Lõi dựng và đọc hình dạng này; kho chỉ giữ nguyên vẹn.
 *
 * @typedef {object} NoteRecord
 * @property {string} id Định danh bất biến, sinh lúc chốt.
 * @property {string} text Nội dung người dùng gõ, nguyên trạng.
 * @property {string} textFolded Nội dung đã bỏ dấu, dữ liệu dẫn xuất (AD-5).
 * @property {string} createdAt Thời điểm tạo, ISO-8601 có offset (AD-4).
 * @property {string} localDate Khóa lọc ngày dẫn xuất (AD-4).
 */

/**
 * Đọc toàn bộ ghi chú đang có trong kho.
 *
 * @callback NoteStoreReadAll
 * @returns {Promise<NoteRecord[]>} Mọi bản ghi, thứ tự không được tin cậy — lõi tự sắp xếp.
 */

/**
 * Ghi một ghi chú, thêm mới hoặc thay bản ghi cùng định danh.
 *
 * @callback NoteStorePut
 * @param {NoteRecord} note Bản ghi cần đưa vào kho.
 * @returns {Promise<void>} Hoàn tất khi chữ đã nằm bền; ném lỗi mang mã của AD-18 nếu không.
 */

/**
 * Xóa một ghi chú theo định danh.
 *
 * @callback NoteStoreRemove
 * @param {string} id Định danh của ghi chú cần xóa.
 * @returns {Promise<void>} Hoàn tất khi bản ghi đã biến mất khỏi kho.
 */

/**
 * Thay toàn bộ nội dung kho trong **một** giao dịch — hoặc thay hết, hoặc không đổi gì.
 *
 * Đây là phương thức mà phép gộp file sao lưu cần: nửa vời là dữ liệu lai giữa hai lần nạp.
 *
 * @callback NoteStoreReplaceAll
 * @param {NoteRecord[]} notes Tập ghi chú sau khi gộp.
 * @returns {Promise<void>} Hoàn tất khi giao dịch đã chốt; ném thì kho giữ nguyên trạng thái cũ.
 */

/**
 * @typedef {object} NoteStorePort
 * @property {NoteStoreReadAll} readAll
 * @property {NoteStorePut} put
 * @property {NoteStoreRemove} remove
 * @property {NoteStoreReplaceAll} replaceAll
 */

/** Tên các phương thức mà một hiện thực của cổng này bắt buộc phải có. */
export const NOTE_STORE_METHODS = Object.freeze(['readAll', 'put', 'remove', 'replaceAll']);
