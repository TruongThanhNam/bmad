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

import { MA_LOI, loiUngDung } from './errors.js';
import { fold } from './fold.js';
import { MAX_NOTE_CHARS } from './limits.js';
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

/** Ba trường BẮT BUỘC của một ghi chú trong file — đúng ba trường mà `dungFileSaoLuu` viết ra.
 *  Trường dẫn xuất không nằm ở đây vì chúng không nằm trong file (AD-11, AD-13). */
const TRUONG_BAT_BUOC = Object.freeze(['id', 'createdAt', 'text']);

/** Object THUẦN — một mảng hay `null` không phải một tài liệu sao lưu. */
function laObjectThuan(giaTri) {
  return typeof giaTri === 'object' && giaTri !== null && !Array.isArray(giaTri);
}

/** Từ chối cả file với mã `BAD_FILE`. Một hàm có tên thay vì mười lời gọi chép tay: mọi điều
 *  kiện "file hỏng" phải ra CÙNG một mã, và một chỗ viết ra là một chỗ không thể trôi. */
function fileHong() {
  return loiUngDung(MA_LOI.BAD_FILE);
}

/**
 * Dựng lại MỘT bản ghi đủ năm trường từ một phần tử `notes` của file, hoặc ném.
 *
 * `localDate` và `textFolded` tính LẠI từ `createdAt` và `text` (AD-11, AD-13) — file không
 * chứa chúng, và kể cả khi một file sửa tay có chứa thì chúng vẫn bị bỏ: một `textFolded` cũ
 * đi cùng một `text` mới là một ghi chú không tìm được bằng chính chữ của nó.
 *
 * `localDate` cũng LÀ cửa kiểm định dạng `createdAt`: `core/time.js` ném `TypeError` với mọi
 * thứ không phải ISO-8601 có offset và với mọi ngày không có thật. Viết một regex thứ hai ở
 * đây là dựng một định nghĩa thứ hai của "một mốc hợp lệ trông như thế nào".
 *
 * `text` rỗng hay chỉ khoảng trắng là HỢP LỆ (quyết định đã chốt của spec): trường có mặt và
 * đúng kiểu thì không phải "thiếu trường bắt buộc", và từ chối 467 ghi chú thật vì một dòng
 * rỗng là cái giá sai.
 */
function banGhiTuFile(mau) {
  if (!laObjectThuan(mau)) throw fileHong();
  for (const truong of TRUONG_BAT_BUOC) {
    if (typeof mau[truong] !== 'string') throw fileHong();
  }
  if (mau.id === '') throw fileHong();
  // Trần kiểm ở cửa thứ BA (AD-14) — và trước phép tính lại, vì một ghi chú quá trần không
  // được tốn một lần `fold` trên vài chục nghìn ký tự chỉ để rồi bị vứt.
  if (mau.text.length > MAX_NOTE_CHARS) throw loiUngDung(MA_LOI.TOO_LONG);
  let ngay;
  try {
    ngay = localDate(mau);
  } catch {
    // `TypeError` của `core/time.js` là lỗi LẬP TRÌNH ở mọi cửa khác, nhưng ở đây nó là một
    // file do người khác sửa tay — tức chuyện của người dùng, và đường ra của nó là dải băng.
    throw fileHong();
  }
  return {
    id: mau.id,
    createdAt: mau.createdAt,
    localDate: ngay,
    text: mau.text,
    textFolded: fold(mau.text),
  };
}

/**
 * PHA 1 của phép nạp: đọc và kiểm TOÀN BỘ file, rồi trả danh sách bản ghi đủ năm trường.
 *
 * Hàm này không chạm kho và không biết kho tồn tại. Nó chỉ có hai đường ra: một mảng đã dựng
 * xong hoàn toàn, hoặc một `Error` mang mã của AD-18. Nhờ vậy "một ghi chú sai ở cuối file
 * chặn cả file" là hệ quả của kiểu trả về, không phải của một thứ tự lời gọi ở `state.js`.
 *
 * Sáu điều kiện từ chối, và KHÔNG có điều kiện thứ bảy về kích thước (quyết định đã chốt):
 * JSON hỏng · thiếu trường bắt buộc · `id` trùng nhau trong file · `createdAt` sai dạng ·
 * `text` vượt trần → `TOO_LONG`; `schemaVersion` khác `SCHEMA_VERSION` → `BAD_VERSION`.
 *
 * `schemaVersion` kiểm TRƯỚC `notes`: một file của phiên bản sau có thể mang một hình dạng
 * `notes` mà bộ kiểm này không hiểu, và "file hỏng" là câu sai cho một file hoàn toàn đúng
 * của một phiên bản khác.
 *
 * @param {string} text Toàn bộ nội dung file, dạng văn bản.
 * @returns {Array<{id: string, createdAt: string, localDate: string, text: string,
 *   textFolded: string}>} Bản ghi đã dựng lại, theo đúng thứ tự trong file.
 */
export function docFileSaoLuu(text) {
  let goc;
  try {
    goc = JSON.parse(text);
  } catch {
    throw fileHong();
  }
  if (!laObjectThuan(goc)) throw fileHong();
  if (goc.schemaVersion !== SCHEMA_VERSION) throw loiUngDung(MA_LOI.BAD_VERSION);
  if (!Array.isArray(goc.notes)) throw fileHong();

  const daThay = new Set();
  const ra = [];
  for (const mau of goc.notes) {
    const banGhi = banGhiTuFile(mau);
    // `id` trùng trong CHÍNH file: không có cách nào đúng để gộp hai bản ghi tự xưng là một.
    if (daThay.has(banGhi.id)) throw fileHong();
    daThay.add(banGhi.id);
    ra.push(banGhi);
  }
  return ra;
}

/**
 * Mốc xuất ghi trong file, hoặc `null` khi file không mang một chuỗi nào ở khóa đó.
 *
 * Tách khỏi `docFileSaoLuu` chứ không nhét thêm vào giá trị trả về của nó: `exportedAt` KHÔNG
 * phải một ghi chú, và nó không đi cùng đường với chúng — nó chỉ có một chỗ đến duy nhất là
 * `lastBackupAt`, và chỉ khi phép gộp đã thành công. Một mảng mang thêm một thuộc tính lạ thì
 * mất thuộc tính đó ở lần `.map` đầu tiên, trong im lặng.
 *
 * KHÔNG kiểm hình dạng mốc ở đây, và không ném: `exportedAt` không nằm trong sáu điều kiện từ
 * chối của pha 1, nên một file mang mốc rác vẫn nạp được. Phép so "mới hơn" ở `state.js` là
 * chỗ hình dạng đó bị hỏi tới, và nó nuốt lỗi — ghi chú đã vào kho rồi.
 *
 * @param {string} text Toàn bộ nội dung file, dạng văn bản.
 * @returns {string|null} Giá trị `exportedAt`, hoặc `null`.
 */
export function mocXuatSaoLuu(text) {
  let goc;
  try {
    goc = JSON.parse(text);
  } catch {
    return null;
  }
  if (!laObjectThuan(goc)) return null;
  return typeof goc.exportedAt === 'string' ? goc.exportedAt : null;
}

/**
 * PHA 2, phần THUẦN: gộp tập đang có với tập đọc từ file, đối chiếu theo `id`.
 *
 * Bản ĐANG CÓ luôn thắng, và đó là toàn bộ luật: `id` đã có thì bỏ qua (không ghi đè một chữ,
 * `createdAt` gốc giữ nguyên tuyệt đối), `id` chưa có thì thêm. Không xóa, không tombstone —
 * một ghi chú đã xóa mà còn trong file sao lưu thì sống lại, và đó là hành vi đã chốt: "không
 * bao giờ mất" đứng trước "không bao giờ sống lại".
 *
 * Hai con số trả về là con số THẬT của phép gộp này, và chúng là nguồn duy nhất cho dải băng —
 * view không bao giờ tự đếm lại, vì hai phép đếm sẽ trôi khỏi nhau đúng ở ca khó nhất.
 *
 * @param {Array<object>} dangCo Tập đang có, đọc từ kho (KHÔNG phải từ RAM — xem `state.js`).
 * @param {Array<object>} tuFile Tập đã dựng lại từ file, kết quả của `docFileSaoLuu`.
 * @returns {{ ketQua: Array<object>, added: number, skipped: number }}
 */
export function gopTheoId(dangCo, tuFile) {
  const theoId = new Map(dangCo.map((mau) => [mau.id, mau]));
  let added = 0;
  let skipped = 0;
  for (const mau of tuFile) {
    if (theoId.has(mau.id)) {
      skipped += 1;
      continue;
    }
    theoId.set(mau.id, mau);
    added += 1;
  }
  return { ketQua: [...theoId.values()], added, skipped };
}
