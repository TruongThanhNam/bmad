// AD-20 mục 5 và 6 — ba lời hứa còn đang nằm trong chú thích, nay thành ba lệnh cấm grep được.
//
// Trạng thái hôm nay: `app/style.css` KHÔNG có một chuyển động nào và KHÔNG có một `:hover`
// nào, còn `--danger` thì khai ở cả hai bảng token mà chưa áp vào selector nào. Không một ca
// nào giữ nó ở đó — một `transition: all .3s` hay một `.x:hover { display: block }` vào được
// mà suite vẫn xanh. Bốn nhóm dưới đây là những người canh còn thiếu.
//
// QĐ-1 — TĨNH TUYỆT ĐỐI, KHÔNG DỰNG KHỐI `@media`. AC nguyên văn viết "mọi transition nằm
// trong một khối `prefers-reduced-motion: no-preference`". Khối đó CHƯA TỒN TẠI và story này
// cố ý không dựng nó: khi không có chuyển động nào, "không transition nào ở đâu cả" KÉO THEO
// "mọi transition đều nằm trong khối ấy" — nên lệnh cấm dưới đây là vế MẠNH HƠN của AC, không
// phải vế thay thế. Đổi lại, lệnh cấm at-rule ở `test/token-style.test.js` — thứ duy nhất ngăn
// bộ quét CSS MỘT TẦNG mù trong im lặng — không phải nới, và năm bản `cacKhoi` không phải viết
// lại. Ngày nào thật sự cần chuyển động, hóa đơn đó được trả CÙNG LÚC với việc nâng bộ quét.
//
// Mỗi nhóm cấm đi kèm một phép chạy trên CHUỖI GIẢ có vi phạm ("tự-đột-biến"): một regex gõ
// sai cho ra `viPham = []`, trông hệt như một repo sạch. Đây là bài học đã trả giá ở Story 3.3
// (`NaN < 4.5` là `false`, cửa ngưỡng xanh im lặng).

import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThich, boChuThichCss, boChuThichHtml, boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');
const fileHtml = join(repoRoot, 'index.html');

function danhSachFile(thuMuc, duoi) {
  const ketQua = [];
  if (!existsSync(thuMuc)) return ketQua;
  for (const muc of readdirSync(thuMuc, { withFileTypes: true })) {
    const duongDan = join(thuMuc, muc.name);
    if (muc.isDirectory()) ketQua.push(...danhSachFile(duongDan, duoi));
    else if (duoi.some((d) => muc.name.endsWith(d))) ketQua.push(duongDan);
  }
  return ketQua;
}

function duongDanTuongDoi(duongDanTuyetDoi) {
  return relative(repoRoot, duongDanTuyetDoi).split('\\').join('/');
}

function soDong(sach, viTri) {
  return sach.slice(0, viTri).split('\n').length;
}

/** Chạy một bộ mẫu trên mã ĐÃ bỏ chú thích; `dongLech` cộng thêm cho các vùng con của HTML. */
function quet(sach, cacMau, dongLech = 0) {
  const tim = [];
  for (const { ten, mau } of cacMau) {
    for (const khop of sach.matchAll(mau)) {
      // Đếm dòng từ ký tự THẬT đầu tiên của khớp: vài mẫu dưới đây nuốt cả khoảng trắng dẫn
      // đầu (kể cả xuống dòng), và báo số dòng của khoảng trắng là chỉ sai chỗ cho người sửa.
      const boQuaTrang = khop[0].length - khop[0].trimStart().length;
      tim.push({
        dong: soDong(sach, khop.index + boQuaTrang) + dongLech,
        ten,
        doan: khop[0].trim().replace(/\s+/g, ' '),
      });
    }
  }
  return tim.sort((a, b) => a.dong - b.dong);
}

// ── (a) Chuyển động ─────────────────────────────────────────────────────────────────────

/** Trong CSS: khai báo chuyển động dưới mọi cách viết, gồm cả dạng rút gọn và `-property`. */
const MAU_CHUYEN_DONG_CSS = [
  { ten: 'transition', mau: /\btransition(-[a-z-]+)?\s*:[^;}]*/g },
  { ten: 'animation', mau: /\banimation(-[a-z-]+)?\s*:[^;}]*/g },
  { ten: '@keyframes', mau: /@(-[a-z]+-)?keyframes\b/g },
  { ten: 'scroll-behavior: smooth', mau: /\bscroll-behavior\s*:\s*smooth/g },
  { ten: 'view-transition', mau: /\bview-transition-name\s*:[^;}]*|@view-transition\b/g },
  // QĐ-1 nói thẳng rằng KHÔNG có khối `prefers-reduced-motion` nào, kể cả một khối RỖNG "để
  // sẵn" — `style.css:281` và README đều hứa điều đó, nên nó phải có một mẫu đứng sau, không
  // chỉ có một câu văn. Ai cần khối ấy thì nâng bộ quét một tầng của `token-style.test.js`
  // trước, rồi nới cả hai chỗ cùng lúc.
  { ten: 'prefers-reduced-motion', mau: /prefers-reduced-motion/g },
  { ten: '@starting-style', mau: /@starting-style\b/g },
];

/** Trong JS: ba đường đẩy chuyển động vào từ phía mã, không qua stylesheet. */
const MAU_CHUYEN_DONG_JS = [
  { ten: '.style.transition', mau: /\.\s*style\s*\.\s*(transition|animation)[\w]*\s*=/g },
  { ten: "setProperty('transition')", mau: /setProperty\s*\(\s*['"`]\s*(transition|animation)/g },
  // `cssText =` và `setAttribute('style', …)` là hai cửa CÙNG một dạng: đẩy một chuỗi CSS
  // nguyên khối vào từ phía mã, nơi ba mẫu trên không nhìn tới. Cấm cả chuỗi mang `transition`
  // lẫn chuỗi mang `animation` — cùng lý lẽ "vế mạnh hơn không tốn gì" của `pointerdown`.
  {
    ten: "cssText / setAttribute('style')",
    mau: /\b(?:cssText\s*=|setAttribute\s*\(\s*['"`]style['"`]\s*,)[^\n]*?\b(?:transition|animation)\b/g,
  },
  { ten: '.animate(', mau: /\.\s*animate\s*\(/g },
  { ten: 'requestAnimationFrame', mau: /\brequestAnimationFrame\b/g },
  { ten: 'scrollIntoView({ behavior: smooth })', mau: /behavior\s*:\s*['"`]smooth['"`]/g },
];

function chuyenDongTrongCss(ma) {
  return quet(boChuThichCss(ma), MAU_CHUYEN_DONG_CSS);
}

function chuyenDongTrongJs(ma) {
  return quet(boChuThichJs(ma), MAU_CHUYEN_DONG_JS);
}

/**
 * Tách HTML thành các vùng NỘI TUYẾN rồi quét từng vùng bằng đúng bộ mẫu của ngôn ngữ vùng đó
 * — quét cả tệp bằng bộ mẫu CSS sẽ đọc một thuộc tính HTML tên `animation` thành một khai báo
 * CSS. Số dòng báo ra luôn là số dòng TRONG TỆP, không phải trong vùng.
 */
function vungNoiTuyen(ma, boCss, boJs) {
  const sach = boChuThichHtml(ma);
  const tim = [];
  const vung = [
    { mau: /<style\b[^>]*>([\s\S]*?)<\/style>/gi, bo: boCss, sach: boChuThichCss },
    { mau: /\bstyle\s*=\s*"([^"]*)"/gi, bo: boCss, sach: boChuThichCss },
    { mau: /\bstyle\s*=\s*'([^']*)'/gi, bo: boCss, sach: boChuThichCss },
    { mau: /<script\b[^>]*>([\s\S]*?)<\/script>/gi, bo: boJs, sach: boChuThichJs },
  ];
  for (const { mau, bo, sach: boChuThichVung } of vung) {
    if (bo.length === 0) continue;
    for (const khop of sach.matchAll(mau)) {
      const lech = soDong(sach, khop.index + khop[0].indexOf(khop[1])) - 1;
      // Bỏ chú thích của CHÍNH ngôn ngữ vùng đó: `boChuThichHtml` chỉ gỡ `<!-- … -->`, nên một
      // `/* transition: … */` trong khối `<style>` hay một `// requestAnimationFrame` trong
      // khối `<script>` vẫn đọc thành vi phạm. Cả hai bộ giữ nguyên số dòng, nên `lech` đúng.
      tim.push(...quet(boChuThichVung(khop[1]), bo, lech));
    }
  }
  return tim.sort((a, b) => a.dong - b.dong);
}

/**
 * Trong HTML chuyển động chỉ vào được qua ba cửa: khối `<style>`, thuộc tính `style="…"`, và
 * khối `<script>` nội tuyến. Quét từng vùng bằng đúng bộ mẫu của ngôn ngữ vùng đó — quét cả
 * tệp bằng bộ mẫu CSS sẽ đọc một thuộc tính HTML tên `animation` thành một khai báo CSS.
 */
function chuyenDongTrongHtml(ma) {
  return vungNoiTuyen(ma, MAU_CHUYEN_DONG_CSS, MAU_CHUYEN_DONG_JS);
}

// ── (b) Không hover-only ────────────────────────────────────────────────────────────────

/**
 * Bắt cả mệnh đề chọn quanh `:hover` để câu báo lỗi nêu ĐÚNG selector, không chỉ hai chữ
 * `:hover`. `[^{};]` chặn hai đầu: không vượt qua ranh giới khối, không nuốt cả một khai báo.
 */
const MAU_HOVER = [{ ten: ':hover', mau: /[^{};]*:hover[^{};]*/g }];

function hoverTrongCss(ma) {
  return quet(boChuThichCss(ma), MAU_HOVER);
}

/**
 * `index.html` cũng trong tầm, bằng đúng phép tách vùng của nhóm (a): một khối `<style>` ở đó
 * dựng được một điều khiển hover-only y hệt, và để nó ngoài tầm là để cả lệnh cấm ngoài tầm.
 */
function hoverTrongHtml(ma) {
  return vungNoiTuyen(ma, MAU_HOVER, []);
}

// ── (c) Màu không phải tín hiệu duy nhất ────────────────────────────────────────────────

/**
 * Selector được phép dùng `var(--danger)`, mỗi mục KÈM chỗ đứng của CHỮ đi cùng.
 *
 * Danh sách RỖNG cho tới Story 5.3, và mục đầu tiên đi vào đúng như ca này đã báo trước: người
 * thêm màu lỗi phải dừng lại một nhịp, khai selector vào đây, và viết ra chữ nào đi cùng nó.
 * Một điều khiển đỏ không có chữ là một điều khiển mà người không phân biệt được màu đọc thành
 * một điều khiển bình thường — và ở đây nó là nút XÓA VĨNH VIỄN.
 *
 * Epic 6 thêm viền lỗi ô ngày sẽ đi qua đúng cửa này.
 */
const DUNG_DANGER = [
  {
    chon: '.hop-thoai-xoa',
    chu:
      'chính nhãn `xóa` của nút nói ra việc nó làm, và dòng `Không có thùng rác và không hoàn ' +
      'tác được.` ở `.hop-thoai-than` ngay trên nói ra hậu quả',
  },
  // Story 6.2: viền lỗi ô ngày. `app/view/khay-tim.js` bật class và bỏ `hidden` của chữ lỗi
  // trong CÙNG một hàm (`hienLoi`) — không có đường nào bật viền mà không bật chữ.
  { chon: '.o-ngay-loi', chu: 'thông báo lỗi ở `.o-ngay-loi-chu`, ngay dưới khay tìm' },
];

/** Hai bảng token — nơi `--danger` được KHAI, không phải nơi nó được DÙNG làm tín hiệu. */
const KHOI_TOKEN = [':root', ':root[data-theme="dark"]'];

/**
 * Bộ quét MỘT TẦNG, cùng giả định với `token-style.test.js` và `bo-cuc-bon-tang.test.js`: CSS
 * của sản phẩm không có khối lồng, và chính lệnh cấm at-rule ở `token-style` giữ nó như vậy.
 */
function dungDangerTrongCss(ma, danhSach = DUNG_DANGER) {
  const sach = boChuThichCss(ma);
  const tim = [];
  for (const khop of sach.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const chon = khop[1].trim().replace(/\s+/g, ' ');
    if (!/var\(\s*--danger\s*\)/.test(khop[2])) continue;
    if (KHOI_TOKEN.includes(chon)) continue;
    // Danh sách là THAM SỐ (mặc định `DUNG_DANGER`) để nhánh "đã khai thì đi qua" được chạy
    // thật ở ca tự-đột-biến: hôm nay danh sách rỗng, nên nhánh này chưa từng có ai đi vào —
    // và mục Epic 6 ĐẦU TIÊN có thể lặng lẽ không khớp chính selector của nó.
    if (danhSach.some((m) => m.chon === chon)) continue;
    // Cùng lý do với `quet`: mệnh đề chọn bắt đầu SAU khoảng trắng nối từ khối trước.
    const boQuaTrang = khop[1].length - khop[1].trimStart().length;
    tim.push({ dong: soDong(sach, khop.index + boQuaTrang), chon });
  }
  return tim;
}

// ── (d) Tương tác bị cấm ────────────────────────────────────────────────────────────────

/**
 * Kéo-thả, menu chuột phải, long-press và quan sát giao cắt: bốn lối vào mà bàn phím không đi
 * được và trình đọc màn hình không nói ra được. `pointerdown` bị cấm TRẦN chứ không chỉ khi đi
 * kèm một cái hẹn giờ — hôm nay không chỗ nào dùng nó, nên vế mạnh hơn không tốn gì, và một bộ
 * quét phải đoán "có hẹn giờ gần đó không" là một bộ quét sẽ đỏ oan rồi bị nới ra.
 */
// Tiền tố `on` là TÙY CHỌN ở mọi tên sự kiện, và đó không phải sự tỉ mỉ thừa: `\b` KHÔNG nổ
// giữa `n` và `c` của `oncontextmenu`, nên một mẫu `\bcontextmenu\b` bỏ lọt trọn vẹn cửa dễ
// nhất — một thuộc tính nội tuyến `oncontextmenu="…"` trong `index.html`.
const MAU_TUONG_TAC = [
  { ten: 'draggable', mau: /\bdraggable\b/g },
  { ten: 'drag*', mau: /\b(?:on)?drag(start|over|end|enter|leave|exit)\b/g },
  { ten: 'drop', mau: /\bondrop\b|['"`]drop['"`]/g },
  { ten: 'contextmenu', mau: /\b(?:on)?contextmenu\b/g },
  { ten: 'IntersectionObserver', mau: /\bIntersectionObserver\b/g },
  { ten: 'pointerdown (long-press)', mau: /\b(?:on)?pointerdown\b/g },
];

function tuongTacTrongFile(duongDan, ma) {
  return quet(boChuThich(duongDan, ma), MAU_TUONG_TAC);
}

// ────────────────────────────────────────────────────────────────────────────────────────

const fileCss = danhSachFile(appDir, ['.css']);
const fileJs = danhSachFile(appDir, ['.js']);
const fileMoi = [...danhSachFile(appDir, ['.css', '.js']), fileHtml];

describe('AD-20 mục 5 và 6 — tĩnh tuyệt đối, và màu không bao giờ đứng một mình', () => {
  it('có file để quét: style.css, mã app/ và index.html đều nằm trong tầm', () => {
    // Một bộ quét chạy trên danh sách rỗng xanh y như một repo sạch.
    expect(fileCss.map(duongDanTuongDoi)).toContain('app/style.css');
    expect(fileJs.length).toBeGreaterThan(0);
    expect(existsSync(fileHtml)).toBe(true);
  });

  it('(a) không một chuyển động nào — không ở CSS, không ở JS, không ở index.html', () => {
    const viPham = [];
    for (const duongDan of fileCss) {
      for (const v of chuyenDongTrongCss(readFileSync(duongDan, 'utf8'))) {
        viPham.push(`${duongDanTuongDoi(duongDan)}:${v.dong} — ${v.ten} (\`${v.doan}\`)`);
      }
    }
    for (const duongDan of fileJs) {
      for (const v of chuyenDongTrongJs(readFileSync(duongDan, 'utf8'))) {
        viPham.push(`${duongDanTuongDoi(duongDan)}:${v.dong} — ${v.ten} (\`${v.doan}\`)`);
      }
    }
    for (const v of chuyenDongTrongHtml(readFileSync(fileHtml, 'utf8'))) {
      viPham.push(`index.html:${v.dong} — ${v.ten} (\`${v.doan}\`)`);
    }
    // QĐ-1: khối `prefers-reduced-motion` CHƯA tồn tại, và mặc định tĩnh không phải bước đệm
    // dẫn tới nó — nó là trạng thái cuối. Cần chuyển động thì nâng bộ quét một tầng của
    // `token-style.test.js` TRƯỚC, rồi mới nới ca này.
    expect(viPham).toEqual([]);
  });

  it('(b) không một `:hover` nào trong app/**/*.css hay index.html — không điều khiển hover-only', () => {
    const viPham = [];
    for (const duongDan of fileCss) {
      for (const v of hoverTrongCss(readFileSync(duongDan, 'utf8'))) {
        viPham.push(`${duongDanTuongDoi(duongDan)}:${v.dong} — \`${v.doan}\``);
      }
    }
    for (const v of hoverTrongHtml(readFileSync(fileHtml, 'utf8'))) {
      viPham.push(`index.html:${v.dong} — \`${v.doan}\``);
    }
    // Hai chú thích đã hứa điều này bằng lời (`style.css:252-256` và `:514-516`: nút `✕` và
    // các điều khiển "hiện sẵn, không chờ chuột"); ca này là thứ CƯỠNG CHẾ chúng. Một điều
    // khiển chỉ xuất hiện khi chuột đi ngang qua là một điều khiển không tồn tại với bàn phím.
    expect(viPham).toEqual([]);
  });

  it('(c) mọi selector dùng var(--danger) phải khai vào DUNG_DANGER kèm chỗ đứng của CHỮ', () => {
    const viPham = [];
    for (const duongDan of fileCss) {
      for (const v of dungDangerTrongCss(readFileSync(duongDan, 'utf8'))) {
        viPham.push(
          `${duongDanTuongDoi(duongDan)}:${v.dong} — \`${v.chon}\` dùng var(--danger) mà không ` +
            `khai vào DUNG_DANGER; khai kèm chỗ đứng của CHỮ đi cùng (AD-20 mục 6)`,
        );
      }
    }
    expect(viPham).toEqual([]);
  });

  it('(c) mỗi mục DUNG_DANGER nêu được chỗ đứng của chữ — một mục rỗng là một lỗ', () => {
    // Cái bẫy này đón mục ĐẦU TIÊN (`.hop-thoai-xoa`, Story 5.3) và mọi mục sau: khai một
    // selector vào đây mà bỏ trống `chu` là đổi một lệnh cấm lấy một chữ ký khống. Danh sách
    // phải KHÁC RỖNG — một danh sách rỗng làm ca này xanh mà không chứng minh gì.
    expect(DUNG_DANGER.length).toBeGreaterThan(0);
    const thieu = DUNG_DANGER.filter(
      (m) => typeof m.chon !== 'string' || typeof m.chu !== 'string' || m.chu.trim() === '',
    ).map((m) => JSON.stringify(m));
    expect(thieu).toEqual([]);
  });

  it('(d) không kéo-thả, không menu chuột phải, không long-press, không IntersectionObserver', () => {
    const viPham = [];
    for (const duongDan of fileMoi) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      for (const v of tuongTacTrongFile(tuongDoi, readFileSync(duongDan, 'utf8'))) {
        viPham.push(`${tuongDoi}:${v.dong} — ${v.ten} (\`${v.doan}\`)`);
      }
    }
    expect(viPham).toEqual([]);
  });
});

describe('bộ quét tự nó còn mắt — mỗi nhóm chạy trên một chuỗi giả CÓ vi phạm', () => {
  it('(a) CSS: mọi cách viết chuyển động đều bị bắt, đúng số dòng', () => {
    expect(chuyenDongTrongCss('.a { transition: color 120ms; }')).toEqual([
      { dong: 1, ten: 'transition', doan: 'transition: color 120ms' },
    ]);
    expect(chuyenDongTrongCss('\n.a { transition: all .3s; }').map((v) => v.dong)).toEqual([2]);
    expect(chuyenDongTrongCss('.a { transition-property: opacity; }').map((v) => v.ten)).toEqual([
      'transition',
    ]);
    expect(chuyenDongTrongCss('.a { animation: nhay 1s infinite; }').map((v) => v.ten)).toEqual([
      'animation',
    ]);
    expect(chuyenDongTrongCss('@keyframes nhay { from { opacity: 0 } }').map((v) => v.ten)).toEqual([
      '@keyframes',
    ]);
    expect(chuyenDongTrongCss('html { scroll-behavior: smooth; }').map((v) => v.ten)).toEqual([
      'scroll-behavior: smooth',
    ]);
    expect(chuyenDongTrongCss('@media (prefers-reduced-motion: no-preference) { }').map((v) => v.ten)).toEqual(
      ['prefers-reduced-motion'],
    );
    expect(chuyenDongTrongCss('@starting-style { .a { opacity: 0 } }').map((v) => v.ten)).toEqual([
      '@starting-style',
    ]);
    expect(chuyenDongTrongCss('@view-transition { navigation: auto; }').map((v) => v.ten)).toEqual([
      'view-transition',
    ]);
    // Số dòng phải là số dòng THẬT trong tệp: `style.css` dày chú thích khối nhiều dòng, và
    // một bộ quét gỡ chú thích mà không giữ lại số xuống dòng chỉ sai chỗ cho người đi sửa.
    expect(
      chuyenDongTrongCss('/* một\n * chú thích\n * ba dòng\n */\n.a { transition: color 1s; }').map(
        (v) => v.dong,
      ),
    ).toEqual([5]);
    // Âm tính: chú thích NÓI về lệnh cấm không phải vi phạm — chính tệp `style.css` sẽ nói.
    expect(chuyenDongTrongCss('/* không một transition: nào cả */\n.a { color: red; }')).toEqual([]);
    // Âm tính: một tên token chỉ TRÙNG chữ thì không đỏ oan.
    expect(chuyenDongTrongCss('.a { color: var(--transition-free); }')).toEqual([]);
  });

  it('(a) JS: đẩy chuyển động từ phía mã cũng bị bắt', () => {
    expect(chuyenDongTrongJs('el.style.transition = "all .2s";').map((v) => v.ten)).toEqual([
      '.style.transition',
    ]);
    expect(chuyenDongTrongJs('el.animate([{ opacity: 0 }], 200);').map((v) => v.ten)).toEqual([
      '.animate(',
    ]);
    expect(chuyenDongTrongJs('requestAnimationFrame(ve);').map((v) => v.ten)).toEqual([
      'requestAnimationFrame',
    ]);
    expect(chuyenDongTrongJs("el.scrollIntoView({ behavior: 'smooth' });").map((v) => v.ten)).toEqual(
      ['scrollIntoView({ behavior: smooth })'],
    );
    expect(chuyenDongTrongJs("el.style.setProperty('transition', 'none');").map((v) => v.ten)).toEqual(
      ["setProperty('transition')"],
    );
    expect(chuyenDongTrongJs(`el.style.cssText = 'transition: color 1s';`).map((v) => v.ten)).toEqual([
      "cssText / setAttribute('style')",
    ]);
    expect(
      chuyenDongTrongJs(`el.setAttribute('style', 'animation: nhay 1s');`).map((v) => v.ten),
    ).toEqual(["cssText / setAttribute('style')"]);
    // Âm tính: chú thích nhắc tới lệnh cấm không làm đỏ oan (khuôn `boChuThich*` lo phần này).
    expect(chuyenDongTrongJs('// không gọi requestAnimationFrame ở đây')).toEqual([]);
  });

  it('(a) HTML: `<style>`, `style="…"` và `<script>` nội tuyến đều trong tầm', () => {
    expect(chuyenDongTrongHtml('<style>.a { transition: color 1s }</style>').map((v) => v.ten)).toEqual(
      ['transition'],
    );
    expect(chuyenDongTrongHtml('<div style="animation: x 1s"></div>').map((v) => v.ten)).toEqual([
      'animation',
    ]);
    expect(chuyenDongTrongHtml("<div style='transition: all 1s'></div>").map((v) => v.ten)).toEqual([
      'transition',
    ]);
    expect(chuyenDongTrongHtml('<script>requestAnimationFrame(f)</script>').map((v) => v.ten)).toEqual(
      ['requestAnimationFrame'],
    );
    // Số dòng của vùng con phải là số dòng TRONG TỆP, không phải trong vùng.
    expect(
      chuyenDongTrongHtml('<html>\n<style>\n.a { transition: color 1s }\n</style>').map((v) => v.dong),
    ).toEqual([3]);
    // ...và một chú thích HTML nhiều dòng ở TRÊN vi phạm không được làm trôi số dòng đó: độ
    // lệch cộng dồn đúng bằng số chú thích của tệp, nên `index.html` báo sai cả chục dòng.
    expect(
      chuyenDongTrongHtml('<!-- một\n chú thích\n ba dòng -->\n<style>\n.a { animation: x 1s }\n</style>').map(
        (v) => v.dong,
      ),
    ).toEqual([5]);
    // Âm tính: một thuộc tính HTML chỉ TRÙNG tên không phải một khai báo CSS.
    expect(chuyenDongTrongHtml('<div data-animation="none"></div>')).toEqual([]);
    expect(chuyenDongTrongHtml('<!-- transition: color 1s -->')).toEqual([]);
    // Âm tính: chú thích của CHÍNH ngôn ngữ vùng cũng phải được gỡ — `boChuThichHtml` một mình
    // chỉ gỡ `<!-- … -->`.
    expect(chuyenDongTrongHtml('<style>/* transition: color 1s */</style>')).toEqual([]);
    expect(chuyenDongTrongHtml('<script>// requestAnimationFrame(f)</script>')).toEqual([]);
  });

  it('(b) `:hover` trong khối `<style>` của index.html cũng bị bắt', () => {
    expect(
      hoverTrongHtml('<style>.o-luoi:hover .mau-xoa { opacity: 1 }</style>').map((v) => v.doan),
    ).toEqual(['.o-luoi:hover .mau-xoa']);
    expect(hoverTrongHtml('<!-- .a:hover {} -->')).toEqual([]);
  });

  it('(b) `:hover` bị bắt và câu báo nêu ĐÚNG selector', () => {
    expect(hoverTrongCss('.mau-xoa:hover { opacity: 1 }').map((v) => v.doan)).toEqual([
      '.mau-xoa:hover',
    ]);
    expect(hoverTrongCss('\n.a:hover .b { display: block }').map((v) => v.dong)).toEqual([2]);
    expect(hoverTrongCss('/* nút KHÔNG hover-only, không `:hover` nào */')).toEqual([]);
  });

  it('(c) một selector mới dùng var(--danger) mà chưa khai thì bị bắt; bảng token thì không', () => {
    expect(
      dungDangerTrongCss('.o-chua-khai { border-color: var(--danger); }').map((v) => v.chon),
    ).toEqual(['.o-chua-khai']);
    expect(dungDangerTrongCss('\n\n.x { color: var( --danger ) }').map((v) => v.dong)).toEqual([3]);
    // Âm tính: KHAI `--danger` ở hai bảng token không phải DÙNG nó làm tín hiệu.
    expect(dungDangerTrongCss(':root { --danger: #97392C; }')).toEqual([]);
    expect(dungDangerTrongCss(':root[data-theme="dark"] { --danger: #D4816F; }')).toEqual([]);
    expect(dungDangerTrongCss('.a { color: var(--ink); }')).toEqual([]);
  });

  it('(c) nhánh "đã khai thì đi qua" thật sự chạy — và chỉ đúng selector đã khai', () => {
    // Hôm nay `DUNG_DANGER` rỗng, nên nhánh này chưa từng có ai đi vào ở ca trên. Chạy nó với
    // một danh sách giả là cách duy nhất biết rằng mục Epic 6 ĐẦU TIÊN sẽ khớp chính nó.
    const gia = [{ chon: '.o-ngay-loi', chu: 'chữ lỗi ở `.o-ngay-loi-chu`' }];
    expect(dungDangerTrongCss('.o-ngay-loi { border-color: var(--danger); }', gia)).toEqual([]);
    // Một selector KHÁC không được hưởng ké mục đã khai.
    expect(
      dungDangerTrongCss('.o-ngay-khac { border-color: var(--danger); }', gia).map((v) => v.chon),
    ).toEqual(['.o-ngay-khac']);
  });

  it('(d) sáu từ khóa tương tác bị cấm đều bị bắt, ở cả .js lẫn .html', () => {
    expect(tuongTacTrongFile('a.js', 'el.draggable = true;').map((v) => v.ten)).toEqual(['draggable']);
    expect(tuongTacTrongFile('a.js', "el.addEventListener('dragstart', f);").map((v) => v.ten)).toEqual(
      ['drag*'],
    );
    expect(tuongTacTrongFile('a.js', "el.addEventListener('drop', f);").map((v) => v.ten)).toEqual([
      'drop',
    ]);
    expect(
      tuongTacTrongFile('a.js', "el.addEventListener('contextmenu', f);").map((v) => v.ten),
    ).toEqual(['contextmenu']);
    expect(tuongTacTrongFile('a.js', 'new IntersectionObserver(f);').map((v) => v.ten)).toEqual([
      'IntersectionObserver',
    ]);
    expect(
      tuongTacTrongFile('a.js', "el.addEventListener('pointerdown', f);").map((v) => v.ten),
    ).toEqual(['pointerdown (long-press)']);
    expect(tuongTacTrongFile('b.html', '<li draggable="true"></li>').map((v) => v.ten)).toEqual([
      'draggable',
    ]);
    // Thuộc tính NỘI TUYẾN là cửa dễ nhất, và là cửa mà một mẫu `\b` trần bỏ lọt sạch.
    expect(tuongTacTrongFile('b.html', '<div oncontextmenu="f()"></div>').map((v) => v.ten)).toEqual([
      'contextmenu',
    ]);
    expect(tuongTacTrongFile('b.html', '<div ondragstart="f()"></div>').map((v) => v.ten)).toEqual([
      'drag*',
    ]);
    expect(tuongTacTrongFile('b.html', '<div onpointerdown="f()"></div>').map((v) => v.ten)).toEqual([
      'pointerdown (long-press)',
    ]);
    expect(tuongTacTrongFile('b.html', '<div ondrop="f()"></div>').map((v) => v.ten)).toEqual(['drop']);
    // Âm tính: `backdrop`, `drop-shadow` và một chú thích nói về lệnh cấm không được đỏ oan.
    expect(tuongTacTrongFile('a.css', '.a { filter: drop-shadow(0 1px 0 #000); }')).toEqual([]);
    expect(tuongTacTrongFile('a.css', '.a { backdrop-filter: blur(2px); }')).toEqual([]);
    expect(tuongTacTrongFile('a.js', '// không dùng contextmenu hay draggable ở đây')).toEqual([]);
  });
});
