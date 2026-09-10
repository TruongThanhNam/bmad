// Chữ ký cổng "đưa một file ra / nhận một file người dùng chọn" (AD-2).
//
// Lõi dựng và kiểm nội dung file sao lưu; cổng này chỉ lo phần lõi không được biết: hộp
// thoại chọn file, việc file rơi xuống đâu trên máy. Nhờ tách vậy, phép gộp file nạp — thứ
// logic dễ sai nhất của ứng dụng — test được ở Node bằng một chuỗi văn bản.
//
// Cổng này KHÔNG có phép ghi ngầm nào: người dùng phải chủ động chọn ở cả hai chiều.
//
// Tệp này là `ports/` thuần: không import gì, không chạm global.

/**
 * Một file người dùng vừa chọn, đã đọc thành văn bản.
 *
 * @typedef {object} ChosenFile
 * @property {string} name Tên file như người dùng thấy — chỉ để nêu trong thông báo.
 * @property {string} text Toàn bộ nội dung file dưới dạng văn bản.
 */

/**
 * Đưa một file ra cho người dùng giữ.
 *
 * @callback FileIoExportFile
 * @param {string} name Tên file gợi ý.
 * @param {string} text Toàn bộ nội dung file, do lõi dựng sẵn.
 * @returns {Promise<void>} Hoàn tất khi file đã được trao đi.
 */

/**
 * Mời người dùng chọn một file và đọc nó thành văn bản.
 *
 * @callback FileIoReadChosenFile
 * @returns {Promise<ChosenFile | null>} File đã đọc, hoặc `null` khi người dùng bỏ ngang —
 *   bỏ ngang là chuyện bình thường, không phải lỗi, nên nó không ném.
 */

/**
 * @typedef {object} FileIoPort
 * @property {FileIoExportFile} exportFile
 * @property {FileIoReadChosenFile} readChosenFile
 */

/** Tên các phương thức mà một hiện thực của cổng này bắt buộc phải có. */
export const FILE_IO_METHODS = Object.freeze(['exportFile', 'readChosenFile']);
