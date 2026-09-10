// Chữ ký cổng "hạn mức lưu trữ" — đã dùng bao nhiêu, được dùng tối đa bao nhiêu (AD-10).
//
// Lõi cần con số này để cảnh báo TRƯỚC khi phép ghi thất bại, chứ không phải sau. So sánh
// với ngưỡng thì thuộc lõi (`core/limits.js` giữ ngưỡng); ước lượng thì thuộc thế giới.
//
// Con số là ƯỚC LƯỢNG, không phải sự thật: hiện thực nào cũng có quyền trả về số làm tròn
// thô, và có quyền không biết. Vì vậy lõi phải xử lý được `null` thay vì tin mù vào một
// phép chia.
//
// Tệp này là `ports/` thuần: không import gì, không chạm global.

/**
 * Ước lượng dung lượng của kho dữ liệu ứng dụng.
 *
 * @typedef {object} QuotaEstimate
 * @property {number | null} used Số byte đã dùng, hoặc `null` khi không biết.
 * @property {number | null} limit Trần số byte được dùng, hoặc `null` khi không biết.
 */

/**
 * Hỏi dung lượng đã dùng và trần hiện tại.
 *
 * @callback QuotaEstimateCall
 * @returns {Promise<QuotaEstimate>} Ước lượng hiện tại; không ném khi chỉ là "không biết".
 */

/**
 * @typedef {object} QuotaPort
 * @property {QuotaEstimateCall} estimate
 */

/** Tên các phương thức mà một hiện thực của cổng này bắt buộc phải có. */
export const QUOTA_METHODS = Object.freeze(['estimate']);
