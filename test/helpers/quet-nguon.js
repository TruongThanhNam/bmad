// Helper dùng chung cho các bộ quét cây thư mục trong `test/`.
//
// Vì sao phải bỏ chú thích trước khi khớp: một `// import x from '../adapters/y.js'`
// đã bị comment, hay một chú thích nhắc tới `https://…`, không phải vi phạm nào cả.
// Để chúng làm suite đỏ là dạy người ta nới lỏng chính cái check này.

/** Từ khóa mà một dấu `/` ngay sau nó là mở đầu regex, không phải phép chia. */
const TU_KHOA_TRUOC_REGEX = new Set([
  'return',
  'typeof',
  'case',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'do',
  'else',
  'yield',
  'await',
  'throw',
]);

/**
 * `/` ở vị trí này mở một regex literal hay là phép chia? Quyết định bằng token
 * ngay trước nó (`truoc` là phần mã đã đi qua). Đoán sai theo hướng "phép chia"
 * làm bộ quét đọc `return /^\d{4}$/` thành một số `4` không có thật.
 */
export function laViTriRegex(truoc) {
  const cat = truoc.replace(/\s+$/, '');
  if (cat === '') return true;
  if (/[=(,:[!&|?{};+\-*%~^<>]$/.test(cat)) return true;
  const tuKhoa = /[A-Za-z$_][\w$]*$/.exec(cat);
  return tuKhoa ? TU_KHOA_TRUOC_REGEX.has(tuKhoa[0]) : false;
}

/**
 * Vị trí ngay sau regex literal bắt đầu tại `i`, hoặc `-1` nếu nó không đóng
 * trên cùng dòng (tức `/` đó không phải regex).
 */
export function cuoiRegexLiteral(ma, i) {
  let j = i + 1;
  let trongLopKyTu = false;
  while (j < ma.length) {
    const c = ma[j];
    if (c === '\\') {
      j += 2;
      continue;
    }
    if (c === '\n') return -1;
    if (trongLopKyTu) {
      if (c === ']') trongLopKyTu = false;
    } else if (c === '[') {
      trongLopKyTu = true;
    } else if (c === '/') {
      j += 1;
      while (j < ma.length && /[a-z]/i.test(ma[j])) j += 1;
      return j;
    }
    j += 1;
  }
  return -1;
}

/**
 * Bỏ chú thích JS (`//…` và `/*…*\/`) mà không đụng tới nội dung chuỗi —
 * đi từng ký tự và theo dõi trạng thái chuỗi, nên `'https://…'` bên trong một
 * chuỗi thật vẫn còn nguyên để bị bắt.
 *
 * Cũng đi qua regex literal nguyên khối: một `/['"]/` mà bị đọc từng ký tự sẽ
 * đẩy bộ quét vào trạng thái "đang trong chuỗi" và mọi chú thích sau đó thoát hết.
 * Chú thích khối được thay bằng đúng số xuống dòng nó chiếm, để số dòng báo lỗi
 * ở các test quét không trôi.
 */
export function boChuThichJs(ma) {
  let ketQua = '';
  let i = 0;
  let dauChuoi = null;
  while (i < ma.length) {
    const c = ma[i];
    const d = ma[i + 1];
    if (dauChuoi) {
      ketQua += c;
      if (c === '\\') {
        ketQua += d ?? '';
        i += 2;
        continue;
      }
      if (c === dauChuoi) dauChuoi = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      dauChuoi = c;
      ketQua += c;
      i += 1;
      continue;
    }
    if (c === '/' && d === '/') {
      while (i < ma.length && ma[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && d === '*') {
      const batDau = i;
      i += 2;
      while (i < ma.length && !(ma[i] === '*' && ma[i + 1] === '/')) i += 1;
      i += 2;
      // Giữ nguyên số xuống dòng để số dòng phía sau không trôi.
      const soDong = ma.slice(batDau, i).split('\n').length - 1;
      ketQua += '\n'.repeat(soDong);
      continue;
    }
    if (c === '/') {
      const cuoi = laViTriRegex(ketQua) ? cuoiRegexLiteral(ma, i) : -1;
      if (cuoi > 0) {
        ketQua += ma.slice(i, cuoi);
        i = cuoi;
        continue;
      }
    }
    ketQua += c;
    i += 1;
  }
  return ketQua;
}

/** CSS chỉ có chú thích khối; `//` trong CSS là ký tự thật (vd `url(//host)`). */
export function boChuThichCss(ma) {
  return ma.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** HTML chỉ có `<!-- … -->`. */
export function boChuThichHtml(ma) {
  return ma.replace(/<!--[\s\S]*?-->/g, '');
}

/** Chọn bộ bỏ chú thích theo phần mở rộng của file. */
export function boChuThich(duongDan, ma) {
  if (duongDan.endsWith('.css')) return boChuThichCss(ma);
  if (duongDan.endsWith('.html')) return boChuThichHtml(ma);
  return boChuThichJs(ma);
}
