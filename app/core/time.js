// Khóa thời gian dẫn xuất — và CHỈ ở đây (AD-4).
//
// `createdAt` là ISO-8601 CÓ offset. So chuỗi trực tiếp trên nó cho thứ tự SAI khi hai ghi chú
// sinh ở hai múi giờ khác nhau (`…16:40:12+07:00` đứng sau `…16:40:12+02:00` theo so chuỗi, dù
// giờ tại chỗ bằng nhau và giờ tuyệt đối thì ngược lại). Và dựng một mốc thời gian từ nó làm
// ghi chú trượt sang ngày khác lúc nạp sao lưu trên máy đặt múi giờ khác.
//
// Nên hai khóa dẫn xuất — `localStamp` (khóa sắp xếp) và `localDate` (khóa lọc ngày) — sinh ở
// đúng module này, để `query.js` (Epic 6) và `backup.js` (Epic 4) không thể cắt chuỗi lệch nhau.
//
// `daysBetween` là chỗ DUY NHẤT trong toàn bộ mã được phép dựng một mốc thời gian, và nó dựng ở
// UTC giữa trưa. `test/date-tap-trung.test.js` cưỡng chế điều đó bằng cách quét cả cây `app/`.
// Story sau cần "hôm nay" thì thêm hàm VÀO ĐÂY, không tự chế tại chỗ.
//
// File này là `core/` thuần: chỉ import `./limits.js`, không chạm global trình duyệt.
//
// Đầu vào sai dạng thì ném ngay tại chỗ bằng `TypeError` — không `null`, không `''`, không `NaN`.
// Một khóa `undefined` chảy vào index IndexedDB ở Story 1.6 sẽ hỏng im lặng tới tận Epic 6;
// ném ngay biến hỏng dữ liệu thành hỏng test. Đây là lỗi LẬP TRÌNH, không phải câu hiện cho
// người dùng, nên story này không đụng tới `errors.js`.

import {
  LOCAL_DATE_CHARS,
  LOCAL_STAMP_CHARS,
  MS_PER_DAY,
  UTC_NOON_HOUR,
} from './limits.js';

/** ISO-8601 có offset bắt buộc: `Z` hoặc `±HH:mm`. Phần giây lẻ là tùy chọn.
 *  Giờ/phút/giây ghim đúng dải thật (00–23, 00–59) — `T25:99:99` là rác, không phải thời điểm.
 *  Phần ngày chỉ được kiểm hình dạng ở đây; tính có thật kiểm bằng `ngayCoThat`. */
const MAU_CREATED_AT =
  /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

/** Khóa ngày: `yyyy-MM-dd` và không gì khác. `dd/MM/yyyy` là chuyện của Epic 6. */
const MAU_NGAY = /^(\d{4})-(\d{2})-(\d{2})$/;

function moTa(giaTri) {
  return typeof giaTri === 'string' ? JSON.stringify(giaTri) : String(giaTri);
}

/** Lấy `createdAt` của một bản ghi và cưỡng chế đúng dạng, hoặc ném. */
function createdAtHopLe(note) {
  const createdAt = note == null ? undefined : note.createdAt;
  if (typeof createdAt !== 'string' || !MAU_CREATED_AT.test(createdAt)) {
    throw new TypeError(
      `createdAt phải là ISO-8601 có offset (vd '2026-09-03T16:40:12+07:00'), nhận được ${moTa(createdAt)}`,
    );
  }
  // Hình dạng đúng vẫn có thể là ngày không tồn tại (`2026-02-30T…`). Dùng CHUNG phép kiểm
  // lịch với `daysBetween`, nếu không hai cửa vào cùng module lại nói hai điều khác nhau.
  if (ngayCoThat(createdAt.slice(0, LOCAL_DATE_CHARS)) === null) {
    throw new TypeError(`createdAt mang ngày không có thật: ${moTa(createdAt)}`);
  }
  return createdAt;
}

/**
 * Mốc UTC giữa trưa của chuỗi `yyyy-MM-dd`, hoặc `null` nếu sai dạng / ngày không tồn tại.
 *
 * Phải kiểm ngày có thật: `Date.UTC(2026, 1, 30, …)` cuộn thành 2 tháng 3 mà không báo gì, và
 * `daysBetween` sẽ trả một con số trông hợp lý nhưng sai.
 */
function ngayCoThat(ngay) {
  const khop = typeof ngay === 'string' ? MAU_NGAY.exec(ngay) : null;
  if (!khop) return null;
  const [, nam, thang, ngayTrongThang] = khop;
  const soNam = Number(nam);
  const soThang = Number(thang);
  const soNgay = Number(ngayTrongThang);
  const moc = new Date(Date.UTC(soNam, soThang - 1, soNgay, UTC_NOON_HOUR));
  const dungLich =
    moc.getUTCFullYear() === soNam &&
    moc.getUTCMonth() === soThang - 1 &&
    moc.getUTCDate() === soNgay;
  return dungLich ? moc : null;
}

/**
 * Khóa sắp xếp: 19 ký tự đầu của `createdAt`, tức giờ TẠI CHỖ đã cắt offset.
 * So chuỗi trên khóa này cho đúng thứ tự người dùng cảm nhận, ở mọi múi giờ.
 */
export function localStamp(note) {
  return createdAtHopLe(note).slice(0, LOCAL_STAMP_CHARS);
}

/** Khóa lọc ngày: `yyyy-MM-dd` theo giờ tại chỗ lúc tạo (AD-13 đánh index trên trường này). */
export function localDate(note) {
  return createdAtHopLe(note).slice(0, LOCAL_DATE_CHARS);
}

/** Như `ngayCoThat` nhưng ném thay vì trả `null` — cửa vào của `daysBetween`. */
function mocGiuaTrua(ngay) {
  const moc = ngayCoThat(ngay);
  if (moc === null) {
    throw new TypeError(`Ngày phải là ngày có thật dạng 'yyyy-MM-dd', nhận được ${moTa(ngay)}`);
  }
  return moc;
}

/**
 * Số ngày từ `a` tới `b`, cả hai là `yyyy-MM-dd`. Giữ dấu: `b` trước `a` thì âm.
 *
 * Neo ở 12:00 UTC chứ không phải nửa đêm: ở múi giờ có đổi giờ mùa hè, hiệu hai mốc nửa đêm ra
 * 23 hoặc 25 giờ, chia cho một ngày rồi làm tròn có thể lệch một ngày. Giữa trưa cách mọi ranh
 * giới ngày nửa ngày, nên một lần dịch ±1 giờ không bao giờ đẩy mốc qua ranh giới đó.
 */
export function daysBetween(a, b) {
  const tu = mocGiuaTrua(a);
  const den = mocGiuaTrua(b);
  return Math.round((den.getTime() - tu.getTime()) / MS_PER_DAY);
}
