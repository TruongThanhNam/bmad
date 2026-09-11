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
 * Bản nháp đang gõ dở của MỘT tab, như kho bền nhìn thấy nó.
 *
 * `heartbeat` là mốc gần nhất mà tab chủ còn báo rằng nó đang sống. Một bản nháp im lặng quá
 * lâu là bản BỎ RƠI, và chỉ bản bỏ rơi mới được tab khác nhận.
 *
 * @typedef {object} DraftRecord
 * @property {string} tabId Danh tính tab chủ của bản nháp — cũng là khóa của bản ghi.
 * @property {string} text Chữ đang gõ dở, nguyên trạng.
 * @property {string} heartbeat Mốc sống gần nhất, ISO-8601 có offset (AD-4).
 */

/**
 * Giành lấy bản nháp của tab này, trong **một** giao dịch nguyên tử duy nhất (AD-3).
 *
 * Bốn bước chạy liền nhau, không tách rời: trước hết chốt danh tính — nếu một tab khác **thật
 * sự đang sống** với đúng danh tính này (tab bị nhân đôi) thì sinh danh tính mới và trả nó ra;
 * rồi nếu có bản nháp mang danh tính đã chốt thì dùng nó, **bất kể** mốc sống của nó mới hay
 * cũ, vì đó chỉ có thể là bản của chính tab này ở lần tải trang trước; nếu không có bản nào
 * của mình thì nhận **nhiều nhất một** bản bỏ rơi, bản im lặng lâu nhất, ghi lại dưới danh
 * tính của mình và xóa bản cũ; cuối cùng dọn mọi bản rỗng.
 *
 * "Đang sống" phải là một điều quan sát được, không phải một phép suy đoán từ mốc sống: mốc
 * sống không phân biệt được một tab khác với chính tab này vừa tải lại, và nhầm hai thứ đó
 * làm mỗi lần mở lại app bỏ rơi đúng bản nháp mà FR-3 hứa sẽ trả lại.
 *
 * Nguyên tử là điều kiện của FR-20: hai tab khởi động cùng lúc không thể cùng nhận một bản.
 *
 * @callback NoteStoreClaimDraft
 * @param {{ tabId: string, now: string, staleMs: number }} yeuCau Danh tính hiện tại của tab,
 *   mốc hiện tại (ISO-8601 có offset), và ngưỡng im lặng để coi một bản là bỏ rơi.
 * @returns {Promise<{ tabId: string, text: string }>} Danh tính sau cùng của tab (khác đầu vào
 *   nghĩa là tab bị nhân đôi và chỗ gọi phải ghi lại danh tính mới) cùng chữ nhận được.
 */

/**
 * Ghi bản nháp của tab này, thêm mới hoặc thay bản cùng danh tính.
 *
 * @callback NoteStorePutDraft
 * @param {DraftRecord} draft Bản nháp cần đưa vào kho, kèm mốc sống mới nhất.
 * @returns {Promise<void>} Hoàn tất khi chữ đã nằm bền; ném lỗi mang mã của AD-18 nếu không.
 */

/**
 * @typedef {object} NoteStorePort
 * @property {NoteStoreReadAll} readAll
 * @property {NoteStorePut} put
 * @property {NoteStoreRemove} remove
 * @property {NoteStoreReplaceAll} replaceAll
 * @property {NoteStoreClaimDraft} claimDraft
 * @property {NoteStorePutDraft} putDraft
 */

/** Tên các phương thức mà một hiện thực của cổng này bắt buộc phải có. */
export const NOTE_STORE_METHODS = Object.freeze([
  'readAll',
  'put',
  'remove',
  'replaceAll',
  'claimDraft',
  'putDraft',
]);
