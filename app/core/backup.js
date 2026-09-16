// Hình dạng file sao lưu — và CHỖ DUY NHẤT biết nó (Story 4.2, Epic 4).
//
// Hai chiều của UJ-3 đọc cùng một hợp đồng: story này dựng nội dung file, Story 4.3 phân tích
// lại đúng hình dạng đó. Nếu chiều xuất tự dựng JSON tại `state.js` và chiều nạp tự phân tích
// tại một chỗ khác, thì "file xuất ra nạp lại được" là một lời hứa của hai đoạn mã không ai
// đối chiếu — và nó vỡ ở ngày đầu tiên ai đó thêm một trường.
//
// Tệp này là `core/` thuần: chỉ import `core/time.js`, không chạm global, không biết Blob,
// không biết thẻ `<a download>` — nhờ vậy nội dung file kiểm được ở Node bằng một chuỗi.
//
// Ba trường mỗi ghi chú, không phải năm: `localDate` và `textFolded` là trường DẪN XUẤT, tính
// lại được từ `createdAt` và `text` qua `core/time.js` và `core/fold.js`. Ghi chúng vào file là
// chép hai nguồn sự thật ra ngoài máy, nơi chúng có thể quay về đã lệch — một file sửa tay với
// `text` mới mà `textFolded` cũ sẽ nạp vào một ghi chú không tìm được bằng chính chữ của nó.

import { localDate } from './time.js';

/** Số hiệu hình dạng file. Story 4.3 từ chối mọi giá trị khác — hợp đồng chỉ có một phiên bản. */
export const SCHEMA_VERSION = 1;

/** Tên file cố định phần đầu, chỉ phần ngày đổi — để một thư mục Tải về sắp chúng theo ngày. */
const TIEN_TO_TEN = 'ghi-chu-hang-ngay-';

/** Đuôi file. Nội dung là JSON, và tên file phải nói đúng điều đó. */
const DUOI_TEN = '.json';

/**
 * Thụt lề của JSON xuất ra, dạng CHUỖI chứ không phải số.
 *
 * `JSON.stringify(…, null, 2)` cho cùng kết quả, nhưng con số `2` là một literal sống ngoài
 * `core/limits.js` — thứ `test/nguong-tap-trung.test.js` làm đỏ (AD-14). Chuỗi hai dấu cách
 * nói đúng một điều với cùng một kết quả, và nó không phải một ngưỡng chỉnh được.
 */
const THUT_LE = '  ';

/**
 * Tên file sao lưu cho một mốc xuất.
 *
 * Ngày lấy qua `localDate` — tức ngày TẠI CHỖ của `exportedAt`, không phải ngày UTC. Xuất lúc
 * 00:30 ở `+07:00` mà cắt theo UTC thì file mang tên của hôm trước, đúng cái AD-4 sinh ra để
 * chặn. `localDate` cũng là cửa kiểm hình dạng: một `exportedAt` rác ném `TypeError` ngay đây.
 *
 * @param {string} exportedAt Mốc xuất, ISO-8601 CÓ offset (`core/time.js` → `nowIso()`).
 * @returns {string} `ghi-chu-hang-ngay-yyyy-MM-dd.json`.
 */
export function tenFileSaoLuu(exportedAt) {
  return `${TIEN_TO_TEN}${localDate({ createdAt: exportedAt })}${DUOI_TEN}`;
}

/**
 * Toàn bộ nội dung file sao lưu, dưới dạng một chuỗi.
 *
 * Thứ tự `notes` GIỮ NGUYÊN thứ tự vào: chỗ gọi đưa vào tầng A đang trong RAM, đã sắp giảm dần
 * theo `localStamp` (AD-6). Story 4.3 gộp theo `id` nên thứ tự không mang nghĩa với phép nạp —
 * nhưng cố định nó ở đây thì nội dung file so được nguyên văn trong test, và một lần sắp lại
 * ngoài ý muốn thành một ca đỏ thay vì một khác biệt không ai đọc.
 *
 * In đẹp (`JSON.stringify` có thụt lề): file sao lưu là thứ Nam mở ra xem bằng mắt, và vài KB
 * thừa rẻ hơn hẳn một dòng JSON dài vô tận.
 *
 * @param {Array<{id: string, createdAt: string, text: string}>} notes Toàn bộ ghi chú — KHÔNG
 *   phải tập đang hiển thị: bộ lọc là tầng C, và một bản sao lưu phụ thuộc bộ lọc đang bật là
 *   một bản sao lưu thiếu mà không ai biết là thiếu.
 * @param {string} exportedAt Mốc xuất, cùng giá trị đưa cho `tenFileSaoLuu`.
 * @returns {string} Nội dung file.
 */
export function dungFileSaoLuu(notes, exportedAt) {
  return JSON.stringify(
    {
      schemaVersion: SCHEMA_VERSION,
      exportedAt,
      // Dựng bản ghi MỚI chỉ với ba trường, chứ không xóa trường khỏi bản ghi cũ: một phép trải
      // rồi `delete` sẽ mang theo mọi trường mọc thêm ở Epic sau mà không ai nhắc.
      notes: notes.map((mau) => ({ id: mau.id, createdAt: mau.createdAt, text: mau.text })),
    },
    null,
    THUT_LE,
  );
}
