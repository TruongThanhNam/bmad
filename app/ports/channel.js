// Chữ ký cổng "kênh liên tab" — cách duy nhất hai tab của cùng ứng dụng nói với nhau (AD-7).
//
// Cổng này chỉ mang TIN, không bao giờ mang nội dung: tab nhận được tin thì đọc lại từ kho
// bền chứ không tin vào dữ liệu đi kèm. Nhờ vậy một tin đến muộn không thể dựng lại một
// trạng thái đã cũ đè lên trạng thái mới.
//
// Từ vựng trừu tượng ở đây không phải phép lịch sự: hình dạng bản tin là hợp đồng, còn cơ
// chế truyền là chi tiết của `app/adapters/`.
//
// Tệp này là `ports/` thuần: không import gì, không chạm global.

/**
 * Hình dạng DUY NHẤT của một bản tin liên tab. Đúng bốn trường, đúng hai giá trị `type`.
 *
 * @typedef {object} ChannelMessage
 * @property {number} v Số hiệu hình dạng bản tin; hiện tại luôn là một.
 * @property {'notes-changed' | 'session-changed'} type Việc gì vừa xảy ra. `notes-changed`
 *   phát sau mọi lần ghi thành công vào kho ghi chú; `session-changed` phát khi một khóa
 *   cấu hình đổi. Không có loại tin thứ ba.
 * @property {string} from Danh tính tab đã phát tin — tab nhận bỏ qua tin của chính mình.
 * @property {string} appVersion Phiên bản mã của tab phát. Khác của mình thì tab nhận vào
 *   chế độ chỉ đọc (AD-21).
 */

/**
 * Phát một bản tin tới mọi tab khác của cùng ứng dụng.
 *
 * @callback ChannelPublish
 * @param {ChannelMessage} message Bản tin đúng hình dạng trên.
 * @returns {void}
 */

/**
 * Nghe bản tin từ tab khác.
 *
 * @callback ChannelSubscribe
 * @param {(message: ChannelMessage) => void} listener Hàm được gọi cho mỗi tin đến.
 * @returns {void}
 */

/**
 * @typedef {object} ChannelPort
 * @property {ChannelPublish} publish
 * @property {ChannelSubscribe} subscribe
 */

/** Tên các phương thức mà một hiện thực của cổng này bắt buộc phải có. */
export const CHANNEL_METHODS = Object.freeze(['publish', 'subscribe']);
