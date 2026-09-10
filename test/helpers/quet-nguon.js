// Helper dùng chung cho các bộ quét cây thư mục trong `test/`.
//
// Vì sao phải bỏ chú thích trước khi khớp: một `// import x from '../adapters/y.js'`
// đã bị comment, hay một chú thích nhắc tới `https://…`, không phải vi phạm nào cả.
// Để chúng làm suite đỏ là dạy người ta nới lỏng chính cái check này.

/**
 * Bỏ chú thích JS (`//…` và `/*…*\/`) mà không đụng tới nội dung chuỗi —
 * đi từng ký tự và theo dõi trạng thái chuỗi, nên `'https://…'` bên trong một
 * chuỗi thật vẫn còn nguyên để bị bắt.
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
      i += 2;
      while (i < ma.length && !(ma[i] === '*' && ma[i + 1] === '/')) i += 1;
      i += 2;
      continue;
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
