// Focus ring và thứ tự tab (Story 3.2) — ba bất biến của sàn a11y, chốt bằng máy.
//
// Sản phẩm cố ý chỉ có bốn phím (`Ctrl+Enter`, `Enter`, `Esc`, `Tab`/`Shift+Tab`), nên thứ tự
// Tab và vòng sáng focus là BẢN ĐỒ DI CHUYỂN DUY NHẤT của người không dùng chuột. Ba tính chất
// dưới đây hôm nay ĐANG đúng — không `tabindex` dương ở đâu cả, không listener bàn phím cấp
// `document`/`window`, mọi điều khiển đều có một luật `:focus-visible` phủ nó. Giá trị của tệp
// này không nằm ở việc sửa chúng mà ở việc làm chúng KHÔNG LÙI ĐƯỢC, đúng lúc bốn epic sau sắp
// đổ thêm điều khiển vào trang.
//
// Bốn cửa:
//
// (a) Không `tabindex` DƯƠNG ở bất kỳ đâu (`index.html` và mọi `.js`/`.html` dưới `app/`) — chỉ
//     `0` và `-1`. Một `tabindex="1"` nắn thứ tự bàn phím đi một đường khác hẳn thứ tự mắt đọc,
//     và nó làm điều đó cho CẢ TRANG chứ không riêng phần tử mang nó.
// (b) Không listener bàn phím cấp `document`/`window`, và không mã nào ngoài `o-soan.js` nhắc
//     tới `'/'`, `'k'`, `'K'`, `ctrlKey` hay `metaKey`. Đây là cách "chỉ bốn phím" trở thành
//     một điều kiểm được thay vì một lời hứa trong chú thích.
// (c) Mọi phần tử tương tác trong `index.html`, cộng mọi phần tử focusable do `app/view/` dựng,
//     đều có một selector `:focus-visible` phủ nó trong `app/style.css`.
// (d) Các quyết định của story được ghim thành bất biến CÓ CHÚ THÍCH, không im lặng bỏ qua.
//     Hai quyết định gốc của Story 3.2 — `.mau-xoa` còn `tabindex="-1"` cho tới Epic 5, và chỉ
//     mẩu BỊ CẮT mới mang `tabindex` — đều đã được ĐÀM PHÁN LẠI có ghi chép (5.1 rồi 5.3), và
//     ca của chúng ghim vế mới cùng lý do đổi. Story 5.3 thêm phần giam tiêu điểm của hộp thoại.
//
// Cái KHÔNG có ở đây, có chủ ý: ca "không một `.css` nào dưới `app/` tắt focus ring" đã sống ở
// `test/token-style.test.js` (hằng `TAT_FOCUS_RING`), và nó quét bản THÔ nên kể cả một mẫu đã
// bị comment cũng đỏ. Nhân bản nó ở đây là dựng hai chỗ để nới lỏng thay vì một. Thay vào đó
// một ca ở cuối tệp canh rằng nó vẫn còn ở đó.
//
// Cái KHÔNG THỂ có ở đây: "Tab thật sự đi đâu" và "vòng sáng có hiện ra không". `phanTuGia()`
// của `banner.test.js`/`luoi.test.js` không có `focus()`, `tabIndex`, `matches()` và không tính
// layout, nên mọi câu hỏi đó nằm ở `npm run thu-bo-cuc` (trình duyệt thật, CDP). Nhầm tầng ở
// đây là cách viết ra một suite xanh mà không chứng minh gì.

import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThich, boChuThichCss, boChuThichHtml } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');
const FILE_TOKEN = 'app/style.css';
const FILE_HTML = 'index.html';

/** File DUY NHẤT được phép nhắc tới `ctrlKey` — nó giữ tổ hợp chốt `Ctrl+Enter`. */
const FILE_CHOT = 'app/view/o-soan.js';

/** Ba file DUY NHẤT được phép gắn một bộ nghe bàn phím, và cả ba gắn vào PHẦN TỬ của mình.
 *
 *  `hop-thoai.js` gia nhập ở Story 5.3: hộp thoại xác nhận phải nghe `Esc` (hủy) và `Tab` (giam
 *  tiêu điểm giữa đúng hai nút). Nó gắn bộ nghe lên chính HỘP, không lên tài liệu — nên khi
 *  không có hộp thì không có ai nghe, và `Esc` không có tác dụng gì ở phần còn lại của sản
 *  phẩm. Tập vẫn ghim ĐÚNG ba tệp, không nới thành "có chứa". */
const FILE_NGHE_PHIM = [FILE_CHOT, 'app/view/mau-giay.js', 'app/view/hop-thoai.js'];

function duongDanTuongDoi(duongDanTuyetDoi) {
  return relative(repoRoot, duongDanTuyetDoi).split('\\').join('/');
}

function soDong(sach, viTri) {
  return sach.slice(0, viTri).split('\n').length;
}

/** Mọi `.js`/`.html` dưới một thư mục, đệ quy. */
function danhSachNguon(thuMuc) {
  const ketQua = [];
  if (!existsSync(thuMuc)) return ketQua;
  for (const muc of readdirSync(thuMuc, { withFileTypes: true })) {
    const duongDan = join(thuMuc, muc.name);
    if (muc.isDirectory()) ketQua.push(...danhSachNguon(duongDan));
    else if (muc.name.endsWith('.js') || muc.name.endsWith('.html')) ketQua.push(duongDan);
  }
  return ketQua;
}

/** Mọi file mà cửa (a) và (b) quét: `index.html` cộng cả cây `app/`. */
function cacFileNguon() {
  return [join(repoRoot, FILE_HTML), ...danhSachNguon(appDir)].map((duongDan) => ({
    ten: duongDanTuongDoi(duongDan),
    ma: readFileSync(duongDan, 'utf8'),
  }));
}

// ---------------------------------------------------------------------------
// Cửa (a) — không `tabindex` dương
// ---------------------------------------------------------------------------

/**
 * Bảng `const TEN = 'giá trị';` của một tệp JS.
 *
 * Cần thiết chứ không phải cầu kỳ: `app/view/mau-giay.js` cố ý KHÔNG viết một số literal nào
 * (AD-14), nên nó đặt `tabindex` bằng `setAttribute(THUOC_TINH_TAB, TAB_KHONG)`. Một bộ quét
 * chỉ tìm `tabindex="…"` sẽ không thấy gì ở đúng cái file duy nhất trong dự án đặt `tabindex`.
 */
export function bangHangSo(sach) {
  const bang = new Map();
  for (const khop of sach.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*(['"`])([^'"`\n]*)\2\s*;/g)) {
    bang.set(khop[1], khop[3]);
  }
  return bang;
}

/** Giá trị của một biểu thức đơn giản: chuỗi literal, số literal, hoặc một hằng trong bảng. */
export function giaTriCuaBieuThuc(bieuThuc, bang) {
  const cat = bieuThuc.trim();
  const chuoi = /^(['"`])([\s\S]*)\1$/.exec(cat);
  if (chuoi !== null) return chuoi[2];
  if (/^-?\d+$/.test(cat)) return cat;
  return bang.has(cat) ? bang.get(cat) : null;
}

/**
 * Mọi lời gọi `ten(...)` trong một đoạn mã, kèm danh sách đối số ở dạng văn bản.
 *
 * Cắt đối số bằng cách ĐẾM NGOẶC chứ không bằng một regex `[^,()]+`: `setAttribute('tabindex',
 * String(n))` có ngoặc bên trong, và một regex cấm ngoặc thì không khớp — tức một phép đặt
 * `tabindex` tính lúc chạy đi qua cửa (a) trong im lặng, đúng thứ cửa đó nói nó bắt được.
 */
export function cacLoiGoi(sach, ten) {
  const ra = [];
  // Lookbehind chặn `[\w$]` NHƯNG KHÔNG chặn `.`: mọi lời gọi thật đều là `el.setAttribute(…)`,
  // nên chặn cả dấu chấm là tự loại đúng thứ mình đi tìm. Chỉ cần không khớp `fooSetAttribute(`.
  const mau = new RegExp(String.raw`(?<![\w$])${ten}\s*\(`, 'g');
  for (const khop of sach.matchAll(mau)) {
    let sau = 1;
    let i = khop.index + khop[0].length;
    let batDau = i;
    const doiSo = [];
    for (; i < sach.length && sau > 0; i += 1) {
      const c = sach[i];
      if (c === '(' || c === '[' || c === '{') sau += 1;
      else if (c === ')' || c === ']' || c === '}') sau -= 1;
      else if (c === ',' && sau === 1) {
        doiSo.push(sach.slice(batDau, i));
        batDau = i + 1;
      }
    }
    if (sau !== 0) continue;
    doiSo.push(sach.slice(batDau, i - 1));
    ra.push({ viTri: khop.index, doiSo: doiSo.map((d) => d.trim()).filter((d, k) => d !== '' || k > 0) });
  }
  return ra;
}

/** Giá trị `tabindex` HTML mở ngoặc kép, nháy đơn, hay để trần.
 *  Chặn `.` và ký tự từ ngay trước tên: `el.tabIndex = 2` là đường DOM, và nó có bộ quét riêng —
 *  để cả hai cùng khớp thì một vi phạm bị báo hai lần ở cùng một dòng. */
const TABINDEX_HTML = /(?<![.\w-])tabindex\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"'`;]+))/gi;

/**
 * Mọi chỗ đặt `tabindex` trong một tệp, kèm giá trị đã giải được.
 *
 * Quét cả ba đường đặt: thuộc tính HTML (kể cả khi nó nằm trong một template literal của JS),
 * `setAttribute('tabindex', …)`, và thuộc tính `.tabIndex = …`.
 */
export function datTabindexTrongFile(duongDan, maNguon) {
  const sach = boChuThich(duongDan, maNguon);
  const bang = bangHangSo(sach);
  const tim = [];

  for (const khop of sach.matchAll(TABINDEX_HTML)) {
    const giaTri = khop[1] ?? khop[2] ?? khop[3] ?? '';
    tim.push({ dong: soDong(sach, khop.index), giaTri: giaTri.trim(), cach: 'thuộc tính' });
  }

  if (!duongDan.endsWith('.html')) {
    for (const { viTri, doiSo } of cacLoiGoi(sach, 'setAttribute')) {
      if (doiSo.length !== 2) continue;
      const ten = giaTriCuaBieuThuc(doiSo[0], bang);
      if (ten === null || ten.toLowerCase() !== 'tabindex') continue;
      tim.push({
        dong: soDong(sach, viTri),
        giaTri: giaTriCuaBieuThuc(doiSo[1], bang),
        cach: 'setAttribute',
      });
    }
    // Hai cách viết cùng một phép gán: `.tabIndex = …` và `['tabIndex'] = …`. Cách thứ hai lách
    // qua mọi bộ quét neo vào dấu chấm, đúng như `state-tap-trung.test.js` đã học ở cửa (a).
    const GAN_DOM = /(?:\.\s*tabIndex|\[\s*(?:'tabIndex'|"tabIndex"|`tabIndex`)\s*\])\s*=\s*([^;\n]+)/gi;
    for (const khop of sach.matchAll(GAN_DOM)) {
      tim.push({
        dong: soDong(sach, khop.index),
        giaTri: giaTriCuaBieuThuc(khop[1], bang),
        cach: 'thuộc tính DOM',
      });
    }
  }

  return tim.sort((a, b) => a.dong - b.dong);
}

/**
 * Vi phạm của cửa (a): mọi `tabindex` không phải `0` hay `-1`.
 *
 * Một giá trị KHÔNG GIẢI ĐƯỢC cũng là vi phạm, và đó là lựa chọn có ý thức: một `tabindex` tính
 * lúc chạy không ai duyệt được bằng mắt, nên nó phải hỏng ồn ào ở đây thay vì thành một thứ tự
 * Tab không ai đoán nổi. Hai chỗ duy nhất của dự án hôm nay đều giải được.
 */
export function tabindexViPhamTrongFile(duongDan, maNguon) {
  const viPham = [];
  for (const { dong, giaTri, cach } of datTabindexTrongFile(duongDan, maNguon)) {
    if (giaTri === '0' || giaTri === '-1') continue;
    if (giaTri === null) {
      viPham.push({ dong, ly: `${cach}: tabindex không giải được bằng cách đọc nguồn` });
      continue;
    }
    viPham.push({ dong, ly: `${cach}: tabindex="${giaTri}" — chỉ 0 và -1 được phép` });
  }
  return viPham;
}

// ---------------------------------------------------------------------------
// Cửa (b) — không phím tắt, không listener bàn phím cấp document/window
// ---------------------------------------------------------------------------

/** Một `x.addEventListener('key…', …)`, giữ lại phần biểu thức đứng trước dấu chấm. */
const NGHE_PHIM = /([\w$.?[\]'"`]*?)\s*\??\.\s*addEventListener\s*\(\s*(['"`])(key[a-z]*)\2/gi;

/** Cách viết "phần tử gốc của tài liệu / cửa sổ" — nghe bàn phím ở đây là nghe CẢ TRANG. */
const GOC_TOAN_CUC = /(^|\.)(document|ownerDocument|window|defaultView|globalThis|self|body)$/;

/**
 * Bảng alias trỏ về một gốc toàn cục: `const d = document;`, `const w = window;`.
 *
 * Không có nó thì đúng một dòng `const d = document; d.addEventListener('keydown', f)` đi qua
 * sạch cả ba ca của cửa (b) — bộ quét neo vào cách VIẾT, nên đặt tên khác cho `document` là ra
 * khỏi tầm với. Cùng loại lỗ mà `state-tap-trung.test.js` ghi lại ở mục "LỖ ĐÃ BIẾT"; ở đây nó
 * đóng được bằng một tầng thay thế, nên nó được đóng.
 */
function goiAlias(sach, noiGan) {
  let ra = noiGan.trim().replace(/\?$/, '');
  for (const khop of sach.matchAll(
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*(document|window|globalThis|self)\s*;/g,
  )) {
    if (ra === khop[1] || ra.startsWith(`${khop[1]}.`)) {
      ra = ra.replace(khop[1], khop[2]);
      break;
    }
  }
  return ra;
}

/** Mọi bộ nghe bàn phím trong một tệp, kèm chỗ nó gắn vào. */
export function ngheBanPhimTrongFile(duongDan, maNguon) {
  const sach = boChuThich(duongDan, maNguon);
  const tim = [];
  const them = (viTri, su, noiGanTho) => {
    const noiGan = goiAlias(sach, noiGanTho);
    tim.push({ dong: soDong(sach, viTri), su, noiGan, toanCuc: GOC_TOAN_CUC.test(noiGan) });
  };
  for (const khop of sach.matchAll(NGHE_PHIM)) them(khop.index, khop[3], khop[1]);
  // `onkeydown = …` là cùng một bộ nghe, viết bằng thuộc tính.
  for (const khop of sach.matchAll(/([\w$.?[\]'"`]*?)\s*\??\.\s*(onkey[a-z]*)\s*=/gi)) {
    them(khop.index, khop[2], khop[1]);
  }
  return tim.sort((a, b) => a.dong - b.dong);
}

/**
 * Từ vựng của một phím tắt mà sản phẩm KHÔNG có.
 *
 * `'/'` và `'k'`/`'K'` là hai phím tắt "tìm kiếm" mà mọi ứng dụng web đều mọc ra, và
 * `ctrlKey`/`metaKey` là cách một tổ hợp thứ năm được thêm vào. Khớp trên LITERAL nguyên vẹn
 * chứ không trên chuỗi con: một `'../core/limits.js'` đầy dấu `/` không phải phím tắt nào cả.
 */
// `'KeyK'`/`'Slash'` là cùng hai phím đó viết qua `e.code` thay vì `e.key` — bắt chúng ở dạng
// LITERAL cũng là cách bắt `e.code`, mà không đỏ oan vào `loi.code` của `app/core/errors.js`.
const LITERAL_PHIM_TAT = /(['"`])(\/|k|K|KeyK|Slash)\1/g;
/** `keyCode` là cách viết cũ của cùng một phép so phím; `altKey` là một tổ hợp thứ năm. */
const TU_KHOA_TO_HOP = /\b(ctrlKey|metaKey|altKey|keyCode)\b/g;

export function tuVungPhimTatTrongFile(duongDan, maNguon) {
  const sach = boChuThich(duongDan, maNguon);
  const tim = [];
  for (const mau of [LITERAL_PHIM_TAT, TU_KHOA_TO_HOP]) {
    for (const khop of sach.matchAll(mau)) {
      tim.push({ dong: soDong(sach, khop.index), doan: khop[0] });
    }
  }
  return tim.sort((a, b) => a.dong - b.dong);
}

// ---------------------------------------------------------------------------
// Cửa (c) — mọi điều khiển đều được một luật `:focus-visible` phủ
// ---------------------------------------------------------------------------

const styleCss = boChuThichCss(readFileSync(join(repoRoot, FILE_TOKEN), 'utf8'));
const indexHtml = boChuThichHtml(readFileSync(join(repoRoot, FILE_HTML), 'utf8'));

/**
 * Class VÀ thẻ mà `app/style.css` vẽ một vòng sáng cho, đọc từ chính các selector
 * `:focus-visible`.
 *
 * Thu class từ MỌI selector ghép (`.a.b:focus-visible`, `button.x:focus-visible`) chứ không chỉ
 * từ selector đơn: bỏ sót chúng là bỏ sót đúng những luật mà một story sau sẽ viết. Selector có
 * tổ hợp (dấu cách, `>`, `+`, `~`) thì KHÔNG được thu — nó chỉ phủ phần tử ở một vị trí cụ thể
 * trong cây, nên đọc nó thành "class này luôn có ring" là nói quá.
 *
 * Lỗ đã biết và đã nhận: một `.a.b:focus-visible` đòi phần tử mang CẢ HAI class, còn bảng này
 * ghi nhận từng class một. Nói quá về phía "đã có ring" ở đây đổi lấy một bộ quét không cần
 * hiểu specificity; hai phép đo thật trong `tools/thu-bo-cuc.mjs` là chỗ bắt phần còn lại.
 */
export function lopCoFocusRing(css) {
  const lop = new Set();
  const the = new Set();
  for (const khoi of css.matchAll(/([^{}]*)\{[^{}]*\}/g)) {
    for (const selector of khoi[1].split(',')) {
      const cat = selector.trim();
      if (!cat.endsWith(':focus-visible')) continue;
      const goc = cat.slice(0, -':focus-visible'.length);
      // Một tổ hợp nào đó ở giữa nghĩa là luật chỉ phủ một VỊ TRÍ, không phủ một class.
      if (goc === '' || /[\s>+~]/.test(goc)) continue;
      const tenThe = /^([a-z][\w-]*)/i.exec(goc);
      if (tenThe !== null) the.add(tenThe[1].toLowerCase());
      for (const k of goc.matchAll(/\.([\w-]+)/g)) lop.add(k[1]);
    }
  }
  return { lop, the };
}

/** Có được một vòng sáng phủ không — theo class, hoặc theo một luật viết thẳng trên thẻ. */
function coRingChoPhanTu(bang, phanTu) {
  return bang.the.has(phanTu.the) || phanTu.lop.some((l) => bang.lop.has(l));
}

/** Thẻ HTML vốn đã nằm trong thứ tự Tab mà không cần `tabindex` nào. */
const THE_TUONG_TAC = new Set(['textarea', 'input', 'button', 'select']);

/**
 * Mọi điều khiển tĩnh của một tài liệu, kèm danh sách class của nó.
 *
 * Ba đường một phần tử vào được thứ tự Tab, và cả ba phải được đếm: một thẻ tương tác sẵn, một
 * `<a>` CÓ `href` (không có `href` thì nó không phải điểm dừng nào cả), và bất cứ thẻ nào mang
 * `tabindex` không âm — kể cả một `<div>`, đúng như `app/view/mau-giay.js` làm với mẩu bị cắt.
 */
export function dieuKhienTrongHtml(html) {
  const ra = [];
  for (const khop of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
    const the = khop[1].toLowerCase();
    const thuocTinh = khop[2];
    const tab = /\btabindex\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"'`]+))/i.exec(thuocTinh);
    const giaTriTab = tab === null ? null : (tab[1] ?? tab[2] ?? tab[3] ?? '').trim();
    const laDiemDung =
      THE_TUONG_TAC.has(the) ||
      (the === 'a' && /\bhref\s*=/i.test(thuocTinh)) ||
      (giaTriTab !== null && !giaTriTab.startsWith('-'));
    if (!laDiemDung) continue;
    const lop = /\bclass\s*=\s*"([^"]*)"/i.exec(thuocTinh);
    ra.push({
      dong: soDong(html, khop.index),
      the,
      lop: lop === null ? [] : lop[1].trim().split(/\s+/).filter(Boolean),
    });
  }
  return ra;
}

/** Thẻ mà chính trình duyệt đưa vào thứ tự Tab — dùng để nhận ra một phần tử do view dựng. */
const THE_FOCUSABLE = new Set([...THE_TUONG_TAC, 'a']);

/**
 * Mọi phần tử FOCUSABLE mà một tệp view dựng lúc chạy, suy ra từ chính mã nguồn.
 *
 * Bắt buộc phải suy ra chứ không liệt kê: điều khiển do view dựng KHÔNG có mặt trong
 * `index.html`, nên một `<button class="mau-ghim">` thêm vào ở story sau sẽ không vòng sáng nào
 * phủ mà mọi ca vẫn xanh — đúng thứ cửa (c) nói nó ngăn.
 *
 * Cách suy: nối `const x = …createElement(T)` với `x.className = L`, rồi cộng thêm những biến
 * nhận một `tabindex` không âm. `app/view/` cố ý không viết literal nào (AD-14), nên cả `T` lẫn
 * `L` đều là hằng — `bangHangSo`/`giaTriCuaBieuThuc` đã có sẵn để giải chúng.
 *
 * Giới hạn đã nhận: `className` gán bằng một biểu thức không giải được (ternary, template) thì
 * không thu được class nào. Hai chỗ như vậy hôm nay đều là `<div>` không focusable.
 */
export function focusableDoViewDung(maNguon) {
  const sach = boChuThich('x.js', maNguon);
  const bang = bangHangSo(sach);
  const the = new Map();
  const lop = new Map();
  const focusable = new Set();

  for (const khop of sach.matchAll(
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*[\w$.]*createElement\s*\(\s*([^)]*?)\s*\)/g,
  )) {
    const ten = giaTriCuaBieuThuc(khop[2], bang);
    if (ten === null) continue;
    the.set(khop[1], ten.toLowerCase());
    if (THE_FOCUSABLE.has(ten.toLowerCase())) focusable.add(khop[1]);
  }
  for (const khop of sach.matchAll(/([A-Za-z_$][\w$]*)\s*\.\s*className\s*=\s*([^;\n]+)/g)) {
    const giaTri = giaTriCuaBieuThuc(khop[2], bang);
    if (giaTri !== null) lop.set(khop[1], giaTri.trim().split(/\s+/).filter(Boolean));
  }
  // Chủ nhân của mỗi `setAttribute('tabindex', …)` — đọc theo biến đứng ngay trước lời gọi.
  //
  // `-1` KHÔNG gỡ phần tử khỏi danh sách, và đó là chủ ý: một `<button tabindex="-1">` vẫn nhận
  // được tiêu điểm bằng lệnh, và Epic 5 sẽ gỡ chính cái `-1` đó khi nối hành vi xóa. Vòng sáng
  // phải có sẵn từ trước chứ không phải một việc phải nhớ làm thêm vào ngày nút có hành vi.
  for (const { viTri } of cacLoiGoi(sach, 'setAttribute')) {
    const truoc = /([A-Za-z_$][\w$]*)\s*\??\.\s*$/.exec(sach.slice(0, viTri));
    if (truoc === null) continue;
    const goi = cacLoiGoi(sach.slice(viTri), 'setAttribute')[0];
    if (goi === undefined || goi.doiSo.length !== 2) continue;
    const ten = giaTriCuaBieuThuc(goi.doiSo[0], bang);
    if (ten !== null && ten.toLowerCase() === 'tabindex') focusable.add(truoc[1]);
  }

  const ra = [];
  for (const bien of focusable) {
    for (const l of lop.get(bien) ?? []) ra.push({ lop: l, the: the.get(bien) ?? null, bien });
  }
  return ra;
}

/**
 * Bảng NGOẠI LỆ có chú thích — không phải nguồn của sự thật.
 *
 * Nguồn của sự thật là `focusableDoViewDung()` ở trên, quét cả `app/view/`. Bảng này tồn tại để
 * canh chính bộ quét đó: nếu một ngày nó ngừng thấy ba điều khiển ĐÃ BIẾT này (một lần đổi cách
 * viết `createElement`, một lần refactor sang một hàm dựng chung), ca bên dưới đỏ — thay vì bộ
 * quét lặng lẽ trả về rỗng và cửa (c) thành một ca luôn xanh.
 */
const FOCUS_DO_VIEW_DUNG = [
  { lop: 'dai-bang-dong', file: 'app/view/banner.js', vi: 'nút ✕ của dải băng' },
  { lop: 'o-luoi', file: 'app/view/mau-giay.js', vi: 'mẩu giấy (tabindex="0" — Story 5.1: MỌI mẩu)' },
  { lop: 'mau-xoa', file: 'app/view/mau-giay.js', vi: 'nút xóa (Story 5.3: đã vào thứ tự Tab)' },
  { lop: 'mau-sua', file: 'app/view/mau-giay.js', vi: 'ô sửa tại chỗ (<textarea>, Story 5.1)' },
  { lop: 'hop-thoai-chon', file: 'app/view/hop-thoai.js', vi: 'lựa chọn `hủy` (Story 5.3)' },
  { lop: 'hop-thoai-xoa', file: 'app/view/hop-thoai.js', vi: 'lựa chọn `xóa` (Story 5.3)' },
];

// ---------------------------------------------------------------------------
// Bốn cửa
// ---------------------------------------------------------------------------

describe('(a) không `tabindex` dương ở bất kỳ đâu — thứ tự Tab bám đúng thứ tự DOM', () => {
  const file = cacFileNguon();

  it('có file để quét, và index.html cùng mau-giay.js nằm trong đó', () => {
    const ten = file.map((f) => f.ten);
    expect(ten).toContain(FILE_HTML);
    expect(ten).toContain('app/view/mau-giay.js');
  });

  it('chỉ thấy 0 và -1, không một giá trị dương nào', () => {
    const viPham = [];
    for (const { ten, ma } of file) {
      for (const { dong, ly } of tabindexViPhamTrongFile(ten, ma)) {
        viPham.push(`${ten}:${dong} — ${ly}`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('index.html không đặt một `tabindex` nào — thứ tự tĩnh là thứ tự DOM, không hơn', () => {
    // Không phải thừa so với ca trên: `tabindex="0"` hợp lệ về mặt luật, nhưng trong một tài
    // liệu tĩnh mà mọi điều khiển đã là `<button>`/`<input>` thì nó chỉ là tiếng ồn — và nó là
    // bước đầu tiên của một người sắp gõ `tabindex="1"`.
    const ma = readFileSync(join(repoRoot, FILE_HTML), 'utf8');
    expect(datTabindexTrongFile(FILE_HTML, ma)).toEqual([]);
  });
});

describe('(b) chỉ bốn phím — không listener bàn phím cấp document/window', () => {
  // CÙNG corpus với cửa (a), nghĩa là có `index.html`. Bỏ nó ra là bỏ đúng tệp duy nhất của dự
  // án đã mang một `<script>` nội tuyến (script theme, AD-19) — nơi một `keydown` cấp tài liệu
  // sẽ nằm nếu ai đó thêm, và cũng là nơi ít bị đọc lại nhất vì nó không phải một module.
  const file = cacFileNguon();

  it('không một bộ nghe bàn phím nào gắn vào document hay window', () => {
    const viPham = [];
    for (const { ten, ma } of file) {
      for (const { dong, su, noiGan, toanCuc } of ngheBanPhimTrongFile(ten, ma)) {
        if (toanCuc) viPham.push(`${ten}:${dong} — \`${noiGan}\` nghe \`${su}\` cho CẢ TRANG`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('đúng ba tệp gắn bộ nghe bàn phím, và không tệp nào khác', () => {
    const co = [];
    for (const { ten, ma } of file) {
      if (ngheBanPhimTrongFile(ten, ma).length > 0) co.push(ten);
    }
    expect(co.sort()).toEqual([...FILE_NGHE_PHIM].sort());
  });

  it('không tệp nào ngoài o-soan.js nhắc `/`, `k`, `K`, `ctrlKey` hay `metaKey`', () => {
    const viPham = [];
    for (const { ten, ma } of file) {
      if (ten === FILE_CHOT) continue;
      for (const { dong, doan } of tuVungPhimTatTrongFile(ten, ma)) {
        viPham.push(`${ten}:${dong} — \`${doan}\` (sản phẩm có đúng bốn phím, không thêm)`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('o-soan.js chỉ dùng `altKey`+`ctrlKey`, và không nhắc `/` hay `k` — Ctrl+Enter là tổ hợp duy nhất', () => {
    // `altKey` có mặt ở đây để BỊ BỎ QUA (`Alt+Enter` không chốt), không để dựng một tổ hợp thứ
    // năm — đó là lý do nó được liệt kê nguyên văn chứ không được miễn trừ chung: thêm bất kỳ từ
    // nào vào danh sách này là một thay đổi nhìn thấy được, phải đọc lại chỗ dùng mới sửa được ca.
    const ma = readFileSync(join(repoRoot, FILE_CHOT), 'utf8');
    const doan = tuVungPhimTatTrongFile(FILE_CHOT, ma).map((v) => v.doan);
    expect(doan).toEqual(['altKey', 'ctrlKey']);
  });
});

describe('(c) mọi điều khiển đều có một vòng sáng lấy màu từ --focus', () => {
  const coRing = lopCoFocusRing(styleCss);

  it('style.css có khai báo `:focus-visible`, và mọi luật đó dùng var(--focus)', () => {
    expect(coRing.lop.size).toBeGreaterThan(0);
    for (const khoi of styleCss.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (!khoi[1].includes(':focus-visible')) continue;
      expect(khoi[2]).toMatch(/var\(--focus\)/);
    }
  });

  it('mọi điều khiển tĩnh của index.html được một selector `:focus-visible` phủ', () => {
    const dieuKhien = dieuKhienTrongHtml(indexHtml);
    expect(dieuKhien.length).toBeGreaterThan(0);
    const viPham = dieuKhien
      .filter((d) => !coRingChoPhanTu(coRing, d))
      .map((d) => `${FILE_HTML}:${d.dong} — <${d.the} class="${d.lop.join(' ')}"> không có ring`);
    expect(viPham).toEqual([]);
  });

  it('mọi phần tử focusable do app/view/ dựng — SUY RA từ mã nguồn, không từ một bảng', () => {
    // Đây là ca mà một `<button class="mau-ghim">` thêm vào ở story sau phải làm đỏ. Một bảng
    // viết tay không làm được điều đó: nó chỉ biết những gì đã có tên trong nó, nên nó xanh mãi
    // cho tới ngày ai đó nhớ ra phải cập nhật — tức đúng lúc nó vô dụng nhất.
    const viPham = [];
    let thay = 0;
    for (const duongDan of danhSachNguon(join(appDir, 'view'))) {
      const ten = duongDanTuongDoi(duongDan);
      for (const pt of focusableDoViewDung(readFileSync(duongDan, 'utf8'))) {
        thay += 1;
        if (!coRingChoPhanTu(coRing, { the: pt.the ?? '', lop: [pt.lop] })) {
          viPham.push(`${ten} — \`.${pt.lop}\` (<${pt.the ?? '?'}>) không có luật :focus-visible`);
        }
      }
    }
    expect(viPham).toEqual([]);
    // Bộ quét trả rỗng cũng là một ca luôn xanh, nên nó phải tự chứng minh mình còn thấy gì đó.
    expect(thay).toBeGreaterThanOrEqual(FOCUS_DO_VIEW_DUNG.length);
  });

  it('bộ quét view vẫn thấy đủ các điều khiển ĐÃ BIẾT — bảng ngoại lệ canh chính bộ quét', () => {
    const thay = new Set();
    for (const duongDan of danhSachNguon(join(appDir, 'view'))) {
      for (const pt of focusableDoViewDung(readFileSync(duongDan, 'utf8'))) thay.add(pt.lop);
    }
    const viPham = FOCUS_DO_VIEW_DUNG.filter((x) => !thay.has(x.lop)).map(
      (x) => `${x.file} — bộ quét không còn thấy \`.${x.lop}\` (${x.vi})`,
    );
    expect(viPham).toEqual([]);
  });

  it('vòng sáng dùng `:focus-visible` chứ không `:focus`/`:focus-within` — ring là bản đồ BÀN PHÍM', () => {
    // `:focus` bật cả khi click, và một vòng nhảy ra sau mỗi cú chuột là nhiễu thị giác.
    // `:focus-within` còn rộng hơn: nó sáng cả một vùng chứa vì một phần tử con nhận tiêu điểm.
    //
    // Lookahead phải là `[\w]` chứ KHÔNG phải `[\w-]`: chặn cả dấu gạch nối thì chính
    // `:focus-visible` cũng không khớp, và bộ lọc sau đó thành mã chết — một ca không bao giờ
    // đỏ được vì nó không bao giờ tìm thấy gì để lọc.
    const xau = [...styleCss.matchAll(/:focus(-[\w-]+)?(?![\w-])/g)]
      .filter((k) => k[1] !== '-visible')
      .map((k) => k[0]);
    expect(xau).toEqual([]);
  });
});

describe('(d) hai quyết định của story, ghim thành bất biến chứ không bỏ qua trong im lặng', () => {
  const maMau = readFileSync(join(repoRoot, 'app', 'view', 'mau-giay.js'), 'utf8');

  it('QĐ-1 đã ĐỔI CHIỀU ở Story 5.3: `.mau-xoa` KHÔNG còn `tabindex="-1"`', () => {
    // Nguyên văn QĐ-1 của Story 3.2: "`.mau-xoa` còn `tabindex="-1"` cho tới Epic 5", vì nút
    // xóa lúc đó chưa có hành vi nào và một điểm dừng bàn phím dẫn tới một nút không làm gì là
    // đúng thứ "điều khiển ma" mà sàn a11y dựng ra để tránh. Chính chú thích của nó đã hẹn
    // ngày này: "Epic 5 gỡ `-1` khi nối hành vi thật, và ca này đỏ ngay lúc đó".
    //
    // Nay nút MỞ HỘP THOẠI XÁC NHẬN, và đó là đường xóa DUY NHẤT của sản phẩm — một hành vi chỉ
    // bấm được bằng chuột là một hành vi không tồn tại với bàn phím. Nên vế đổi chiều hẳn: KHÔNG
    // còn một `-1` nào trong tệp, và thứ tự Tab của mỗi mẩu là THÂN rồi NÚT XÓA, đúng thứ tự DOM.
    const dat = datTabindexTrongFile('app/view/mau-giay.js', maMau);
    expect(dat.filter((d) => d.giaTri === '-1')).toEqual([]);
    expect(maMau).toMatch(/LOP_XOA\s*=\s*'mau-xoa'/);
    // Và nút đó CÓ hành vi: nó phát móc `khiXoa` của chính mẩu, không chỉ chặn nổi bọt.
    expect(maMau).toMatch(/khiXoa\s*\?\.\s*\(\s*note\.id\s*\)/);
  });

  it('thứ tự Tab trong một mẩu là THÂN rồi NÚT XÓA — đúng thứ tự DOM, không `tabindex` nào nắn', () => {
    // Cả hai vế vỡ trong im lặng. Nếu nút xóa được `append` TRƯỚC thân mẩu thì bàn phím đi qua
    // "xóa" trước khi đi qua nội dung nó sắp xóa; nếu một `tabindex` dương mọc ra thì thứ tự
    // Tab của CẢ TRANG bị nắn lại (cửa (a) ở trên bắt vế đó).
    //
    // Đọc theo thứ tự `append` trong nguồn: `mau.append(dau, than)` đặt ĐẦU MẨU (chứa nút xóa)
    // trước thân. Đó KHÔNG phải một mâu thuẫn — `.mau-xoa` là một `<button>` nên nó tự là điểm
    // dừng, còn cả MẨU mang `tabindex="0"` và mẩu là tổ tiên của cả hai. `Tab` vào mẩu trước
    // (thân của nó là nội dung), rồi tới nút bên trong. Vế ghim được ở tầng văn bản: nút xóa
    // nằm TRONG mẩu, và mẩu có `tabindex`.
    expect(maMau).toMatch(/mau\.append\s*\(\s*dau\s*,\s*than\s*\)/);
    expect(maMau).toMatch(/dau\.append\s*\(\s*gio\s*,\s*xoa\s*\)/);
    const dat = datTabindexTrongFile('app/view/mau-giay.js', maMau);
    expect(dat.map((d) => d.giaTri)).toEqual(['0']);
  });

  it('hộp thoại giam tiêu điểm giữa ĐÚNG hai nút, và `Esc` chỉ sống trên chính hộp', () => {
    // Ba nửa, và cả ba vỡ trong im lặng: một `Tab` không bị chặn đưa tiêu điểm ra NỀN (nơi một
    // cú `Enter` bấm vào một điều khiển người dùng không nhìn thấy); một bộ nghe `Esc` gắn cấp
    // tài liệu làm `Esc` có nghĩa ở khắp nơi (cửa (b) ở trên bắt vế đó, ca này ghim vế còn lại:
    // nó gắn trên `hop`); và một `focus()` gọi TRƯỚC khi hộp vào DOM thì không làm gì cả.
    const ma = readFileSync(join(appDir, 'view', 'hop-thoai.js'), 'utf8');
    const nghe = ngheBanPhimTrongFile('app/view/hop-thoai.js', ma);
    expect(nghe.map((v) => `${v.noiGan}:${v.su}`)).toEqual(['hop:keydown']);
    expect(nghe[0].toanCuc).toBe(false);
    expect(ma).toMatch(/preventDefault/);
    // `focus()` đặt SAU `replaceChildren` — thứ tự đó là điều kiện, không phải thẩm mỹ.
    expect(ma.search(/replaceChildren\s*\(\s*nen\s*\)/)).toBeLessThan(
      ma.search(/huy\.focus\s*\?\.\s*\(\s*\)/),
    );
  });

  it('QĐ-2 đã RENEGOTIATE ở Story 5.1: MỌI mẩu mang `tabindex`, trừ mẩu đang sửa', () => {
    // Nguyên văn QĐ-2 của Story 3.2: "chỉ mẩu BỊ CẮT mang `tabindex` — mẩu ngắn không có hành
    // vi nào". Nó ghim đúng trạng thái lúc đó, không ghim một bất biến: mẩu ngắn THẬT SỰ không
    // có hành vi nào cho tới Story 5.1. Nay click một mẩu ngắn vào chế độ sửa, nên nó CÓ một
    // hành vi — và một hành vi chỉ mở được bằng chuột là một hành vi không tồn tại với bàn
    // phím. Vế không đổi một chữ: đúng HAI chỗ đặt `tabindex` trong tệp, `-1` cho nút xóa và
    // `0` cho mẩu, nên không có đường nào cho một giá trị thứ ba.
    // Story 5.3 gỡ `-1` của nút xóa (QĐ-1 đổi chiều, ca ngay trên), nên nay đúng MỘT chỗ đặt
    // `tabindex` trong tệp — và vẫn không có đường nào cho một giá trị thứ ba.
    const dat = datTabindexTrongFile('app/view/mau-giay.js', maMau);
    expect(dat.map((d) => d.giaTri).sort()).toEqual(['0']);
    // Phép đặt `TAB_CO` nay nằm trong nhánh `!dangSua`, KHÔNG trong `duDaiDeCat`: mẩu ĐANG sửa
    // là ngoại lệ duy nhất, vì ô sửa là một `<textarea>` và nó tự là điểm dừng — để `tabindex`
    // trên mẩu bọc thì `Tab` đi qua hai điểm dừng cho một thứ, và để bộ nghe `keydown` ở đó thì
    // `Enter` cùng phím cách bị ăn mất ngay trong ô đang gõ.
    const nhanh = /if\s*\(!dangSua\)\s*\{([\s\S]*?)\n  \}/.exec(maMau);
    expect(nhanh).not.toBeNull();
    expect(nhanh[1]).toContain('TAB_CO');
    expect(nhanh[1]).toContain('keydown');
    // Và nhánh `duDaiDeCat` chỉ còn dòng gấp — không còn `tabindex` lẫn bộ nghe nào.
    const catBot = /if\s*\(duDaiDeCat\)\s*\{([\s\S]*?)\n  \}/.exec(maMau);
    expect(catBot).not.toBeNull();
    expect(catBot[1]).not.toContain('TAB_CO');
  });

  it('ca `outline` bị tắt vẫn sống ở token-style.test.js — dẫn chiếu, không nhân bản', () => {
    // Nhân bản nó ở đây là dựng hai chỗ để nới lỏng thay vì một. Nhưng một dẫn chiếu không ai
    // canh thì im lặng thành sai vào ngày ca kia bị xóa, nên ca này canh chính nó.
    const ma = readFileSync(join(repoRoot, 'test', 'token-style.test.js'), 'utf8');
    expect(ma).toContain('TAT_FOCUS_RING');
    expect(ma).toMatch(/const TAT_FOCUS_RING = \/\\boutline/);
    expect(ma).toContain('mục 1: không file .css nào dưới app/ tắt focus ring');
  });
});

// ---------------------------------------------------------------------------
// Bộ quét tự nó đúng — dương tính lẫn âm tính.
//
// Mỗi ca ở trên chỉ đáng tin bằng đúng phép ĐỘT BIẾN chứng minh nó đỏ được: một ca ghim thứ tự
// Tab mà không đỏ khi thêm `tabindex="1"` là một ca vô dụng.
// ---------------------------------------------------------------------------

describe('bộ quét tự nó đúng — dương tính lẫn âm tính', () => {
  it('(a) dương tính: `tabindex` dương bị bắt ở cả ba đường đặt', () => {
    expect(tabindexViPhamTrongFile('index.html', '<button tabindex="1">x</button>')).toEqual([
      { dong: 1, ly: 'thuộc tính: tabindex="1" — chỉ 0 và -1 được phép' },
    ]);
    expect(
      tabindexViPhamTrongFile('a.js', "el.setAttribute('tabindex', '3');").map((v) => v.dong),
    ).toEqual([1]);
    expect(tabindexViPhamTrongFile('a.js', '\nel.tabIndex = 2;').map((v) => v.dong)).toEqual([2]);
    // Đúng đường mà `mau-giay.js` đi: hằng, không số literal. Đổi `TAB_CO` thành `'1'` là đỏ.
    const quaHang = "const T = 'tabindex';\nconst V = '1';\nel.setAttribute(T, V);";
    expect(tabindexViPhamTrongFile('a.js', quaHang).map((v) => v.dong)).toEqual([3]);
    // Không giải được cũng là vi phạm: một thứ tự Tab tính lúc chạy không ai duyệt được.
    expect(tabindexViPhamTrongFile('a.js', 'el.tabIndex = n + 1;')).toHaveLength(1);
  });

  it('(a) âm tính: `0`, `-1` và một chú thích nhắc lệnh cấm đều không đỏ', () => {
    expect(tabindexViPhamTrongFile('index.html', '<div tabindex="0"></div>')).toEqual([]);
    expect(tabindexViPhamTrongFile('a.js', "el.setAttribute('tabindex', '-1');")).toEqual([]);
    expect(tabindexViPhamTrongFile('a.js', "// đừng viết el.setAttribute('tabindex', '1')")).toEqual(
      [],
    );
    expect(tabindexViPhamTrongFile('index.html', '<!-- không tabindex="1" ở đây -->')).toEqual([]);
    // Một tên chỉ TRÙNG tiền tố không phải `tabindex`.
    expect(tabindexViPhamTrongFile('a.js', 'el.tabIndexHint = 5;')).toEqual([]);
  });

  it('(a) đọc đúng số dòng, để báo lỗi chỉ được đúng chỗ', () => {
    expect(datTabindexTrongFile('index.html', '\n\n<a tabindex="0"></a>')[0].dong).toBe(3);
  });

  it('(a) đối số có NGOẶC vẫn bị đọc — `String(n)` không lách được cửa (a)', () => {
    // Đây là lỗ mà một regex `[^,()]+?` để lại: không khớp → bỏ qua trong im lặng, tức ngược hẳn
    // với ý đồ đã ghi "không giải được = vi phạm".
    const ma = "el.setAttribute('tabindex', String(n));";
    expect(tabindexViPhamTrongFile('a.js', ma)).toHaveLength(1);
    // Truy cập bằng ngoặc vuông là đường thứ hai đi vòng qua mọi bộ quét neo vào dấu chấm.
    expect(tabindexViPhamTrongFile('a.js', "el['tabIndex'] = 1;")).toHaveLength(1);
    expect(tabindexViPhamTrongFile('a.js', "el['tabIndex'] = -1;")).toEqual([]);
  });

  it('(b) dương tính: listener bàn phím cấp document/window bị bắt', () => {
    const co = (ma) => ngheBanPhimTrongFile('a.js', ma);
    expect(co("document.addEventListener('keydown', f);")[0].toanCuc).toBe(true);
    expect(co("window.addEventListener('keyup', f);")[0].toanCuc).toBe(true);
    expect(co("o.ownerDocument.addEventListener('keypress', f);")[0].toanCuc).toBe(true);
    expect(co('document.onkeydown = f;')[0].toanCuc).toBe(true);
    // Optional chaining và alias là hai cách viết cùng một thứ — cả hai phải bị bắt.
    expect(co("document?.addEventListener('keydown', f);")[0].toanCuc).toBe(true);
    expect(co("const d = document;\nd.addEventListener('keydown', f);")[0].toanCuc).toBe(true);
  });

  it('(b) âm tính: nghe bàn phím trên MỘT phần tử, và nghe `resize` trên cửa sổ, đều hợp lệ', () => {
    const co = (ma) => ngheBanPhimTrongFile('a.js', ma);
    expect(co("o.addEventListener('keydown', f);")[0].toanCuc).toBe(false);
    expect(co("mau.addEventListener('keydown', f);")[0].toanCuc).toBe(false);
    // `o-soan.js` nghe `resize` ở cấp cửa sổ, và đó KHÔNG phải một bộ nghe bàn phím.
    expect(co("cuaSo.addEventListener('resize', f);")).toEqual([]);
    expect(co("// document.addEventListener('keydown', f)")).toEqual([]);
  });

  it('(b) dương tính lẫn âm tính cho từ vựng phím tắt', () => {
    const tu = (ma) => tuVungPhimTatTrongFile('a.js', ma).map((v) => v.doan);
    expect(tu("if (e.key === '/') mo();")).toEqual(["'/'"]);
    expect(tu("if (e.key === 'k' && e.metaKey) mo();")).toEqual(["'k'", 'metaKey']);
    expect(tu('if (e.ctrlKey) chot();')).toEqual(['ctrlKey']);
    // Một tổ hợp thứ năm viết qua `e.code` và `altKey` — đường vòng rõ nhất quanh `e.key`.
    expect(tu("if (e.altKey && e.code === 'KeyK') mo();").sort()).toEqual(["'KeyK'", 'altKey']);
    expect(tu('if (e.keyCode === 191) mo();')).toEqual(['keyCode']);
    // Âm tính CÓ CHỦ Ý: đường dẫn import đầy dấu `/` không phải một phím tắt nào cả — đây là lý
    // do bộ quét khớp trên LITERAL nguyên vẹn chứ không trên chuỗi con.
    expect(tu("import { x } from '../core/limits.js';")).toEqual([]);
    expect(tu("const s = 'dd/MM/yyyy';")).toEqual([]);
    expect(tu("// một phím tắt '/' là thứ story này cấm")).toEqual([]);
  });

  it('(c) dương tính lẫn âm tính cho phép đọc selector `:focus-visible`', () => {
    expect([...lopCoFocusRing('.a:focus-visible, .b:focus-visible { outline: 1px }').lop].sort()).toEqual(
      ['a', 'b'],
    );
    // Selector GHÉP phải thu được — bỏ sót chúng là báo đỏ oan một điều khiển đã có ring.
    expect([...lopCoFocusRing('.a.b:focus-visible { outline: 1px }').lop].sort()).toEqual(['a', 'b']);
    expect([...lopCoFocusRing('button:focus-visible { outline: 1px }').the]).toEqual(['button']);
    // `:focus` trần và tổ hợp con không phải một vòng sáng bàn phím của chính phần tử đó.
    expect([...lopCoFocusRing('.a:focus { outline: 1px }').lop]).toEqual([]);
    expect([...lopCoFocusRing('.a .b:focus-visible { outline: 1px }').lop]).toEqual([]);
  });

  it('(c) dương tính: một điều khiển KHÔNG được phủ thì bị bắt', () => {
    const coRing = lopCoFocusRing('.co:focus-visible { outline: 1px }');
    const dieuKhien = dieuKhienTrongHtml('<button class="khong">x</button>');
    expect(dieuKhien).toHaveLength(1);
    expect(coRingChoPhanTu(coRing, dieuKhien[0])).toBe(false);
    expect(coRingChoPhanTu(coRing, dieuKhienTrongHtml('<input class="co a">')[0])).toBe(true);
  });

  it('(c) đếm đủ ba đường vào thứ tự Tab, và bỏ qua thẻ không phải điểm dừng', () => {
    const html =
      '<textarea class="a"></textarea><input class="b"><button class="c">x</button>' +
      '<a href="/x" class="e">l</a><a class="f">k</a><div tabindex="0" class="g"></div>' +
      '<div tabindex="-1" class="h"></div><div class="d"></div>';
    // `<a>` KHÔNG có `href` và `tabindex="-1"` đều không phải điểm dừng — chúng phải bị bỏ qua.
    expect(dieuKhienTrongHtml(html).map((d) => d.lop.join(''))).toEqual(['a', 'b', 'c', 'e', 'g']);
  });

  it('(c) bộ quét view suy ra được class từ hằng, đúng cách app/view/ viết', () => {
    // Không một literal nào ở phía `createElement`/`className` — đúng khuôn AD-14 của `mau-giay.js`.
    const ma = [
      "const THE = 'button';",
      "const LOP = 'mau-ghim';",
      'const nut = ownerDocument.createElement(THE);',
      'nut.className = LOP;',
    ].join('\n');
    expect(focusableDoViewDung(ma)).toEqual([{ lop: 'mau-ghim', the: 'button', bien: 'nut' }]);
    // Một `<div>` chỉ thành điểm dừng khi nó nhận `tabindex` — và lúc đó phải bị đếm.
    const div = [
      "const THE = 'div';",
      "const LOP = 'o-luoi';",
      "const T = 'tabindex';",
      "const V = '0';",
      'const mau = ownerDocument.createElement(THE);',
      'mau.className = LOP;',
      'mau.setAttribute(T, V);',
    ].join('\n');
    expect(focusableDoViewDung(div).map((x) => x.lop)).toEqual(['o-luoi']);
    // Một `<div>` thường thì không.
    expect(focusableDoViewDung("const THE = 'div';\nconst x = d.createElement(THE);\nx.className = 'a';")).toEqual([]);
  });
});
