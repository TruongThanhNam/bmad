// Hai bất biến của Story 1.8 được chốt ở đây, không bằng chú thích:
//
//   (1) "không màu viết thẳng" — AD-20 mục 4 nói tương phản được bảo đảm *bằng cách dựng được*.
//       Bảng giá trị ghim ngay trong file test này là cách duy nhất bắt được một hex bị gõ sai:
//       một `#FBF3DF` thay cho `#FBF3DE` vẫn là CSS hợp lệ, vẫn ra một màu trông giống, và
//       không test nào khác trong repo phân biệt được hai giá trị đó. Cùng lý do, 22 token
//       không-màu cũng bị ghim: `--space-4: 1px` hay `--container-max: 104px` là CSS hợp lệ.
//   (2) "không nháy lúc tải" — không có trình duyệt trong `npm test`, nên lần vẽ đầu tiên
//       không kiểm trực tiếp được. Thay vào đó kiểm bốn tính chất VĂN BẢN mà cộng lại thì
//       *kéo theo* "thuộc tính có mặt trước lần vẽ đầu": script đồng bộ (không `type="module"`),
//       nội tuyến (không `src`), nằm trong `<head>`, và đứng trước `<link rel="stylesheet">`.
//       Bản thân lần vẽ đầu nằm ở danh sách thử tay của README.
//
// Thân script theme còn được chạy THẬT ở đây với kho/`matchMedia`/`documentElement` giả, phủ
// hết I/O Matrix. `app/adapters/` không có test tự động, nhưng script này không ở `adapters/`:
// nó là mã thuần vài dòng, nên nó phải có test thật thay vì chỉ một mục thử tay.
//
// Bảng giá trị ghim phải đối chiếu được với nguồn có thẩm quyền của nó:
// `_bmad-output/planning-artifacts/ux-designs/ux-Sticky Notes-2026-09-09/DESIGN.md`
// (frontmatter `colors:` · `typography:` · `spacing:` · `rounded:`).

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThichCss, boChuThichHtml } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');
const FILE_TOKEN = 'app/style.css';
const styleCssThoc = readFileSync(join(repoRoot, FILE_TOKEN), 'utf8');
const styleCss = boChuThichCss(styleCssThoc);

// Bỏ chú thích HTML trước khi khớp: chính chú thích của script theme có nhắc
// `<link rel="stylesheet">` và `type="module"` để giải thích ràng buộc, và một chú thích không
// phải mã. Để nó lọt vào phép so vị trí là biến ca "thứ tự trong <head>" thành ca đỏ giả.
const indexHtml = boChuThichHtml(readFileSync(join(repoRoot, 'index.html'), 'utf8'));

// ---------------------------------------------------------------------------
// Bảng giá trị GHIM — sao y `DESIGN.md`. Ba hex cố ý lệch khỏi mockup (`ink-2` light,
// `focus` light, `danger` dark) nằm đúng ở đây, nguyên văn. Đổi một dòng nào trong bảng này là
// tự nhận đã tính lại bảng tương phản của `DESIGN.md`.
// ---------------------------------------------------------------------------

const MAU_LIGHT = Object.freeze({
  '--bg': '#EFEAE0',
  '--paper': '#FBF3DE',
  '--paper-tape': '#F3E8C9',
  '--surface': '#FFFDF7',
  '--ink': '#2E2820',
  '--ink-2': '#6E6350',
  '--ink-decor': '#A79A83',
  '--rule': '#DCD3C2',
  '--focus': '#8A6A22',
  '--danger': '#97392C',
  '--chip-bg': '#E4DAC2',
  '--hl': '#F2DD8F',
});

const MAU_DARK = Object.freeze({
  '--bg': '#171613',
  '--paper': '#26241E',
  '--paper-tape': '#2E2B23',
  '--surface': '#1E1C18',
  '--ink': '#E9E2D2',
  '--ink-2': '#A79A83',
  '--ink-decor': '#746A59',
  '--rule': '#302D26',
  '--focus': '#D3B269',
  '--danger': '#D4816F',
  '--chip-bg': '#332F26',
  '--hl': '#4E4322',
});

// `--font-ui` và `--font-foot` mang `/1.55` mà `DESIGN.md` không nói: `font` shorthand không có
// cách viết "giữ nguyên line-height mặc định", nên bỏ trống là nhận `normal` của trình duyệt —
// một giá trị khác hẳn và khác nhau giữa các phông. Ghi thành lựa chọn có ý thức, ghim ở đây.
const FONT = Object.freeze({
  '--font-note': '400 14.5px/1.55 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
  '--font-composer': '400 15px/1.55 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
  '--font-time': '600 11.5px Consolas, "Cascadia Mono", monospace',
  '--font-ui': '400 13px/1.55 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
  '--font-foot': '400 11.5px/1.55 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
  '--tracking-time': '0.04em',
});

const SPACING = Object.freeze({
  '--space-1': '4px',
  '--space-2': '8px',
  '--space-3': '12px',
  '--space-4': '16px',
  '--space-5': '20px',
  '--space-6': '28px',
  '--space-7': '40px',
  '--note-padding-y': '8px',
  '--note-padding-x': '12px',
  '--grid-gap': '8px',
  '--page-gutter': '16px',
  '--note-min-col': '260px',
  '--container-max': '1040px',
  '--composer-min-h': '92px',
  '--composer-max-h': '320px',
});

// Bóng là token, và buộc phải vậy: giá trị có `rgba()`, nên viết nó thẳng vào một luật CSS là
// đúng cái vi phạm "không màu viết thẳng" mà `AD-20 mục 4` cấm. Nguồn có thẩm quyền:
// `DESIGN.md` frontmatter `components.composer.shadowInset`, cộng mục *Elevation & Depth*
// ("Dark — bóng đổi sang rgba(0,0,0,…)") cho bản dark.
//
// Nó cũng là token KHÔNG-MÀU DUY NHẤT đổi theo theme, và đó là một ngoại lệ có ý thức chứ
// không phải một chỗ lọt: bóng đen trên nền đen không đọc được, nên bản dark cần một giá trị
// khác. Ca "khối dark ghi đè đúng tập tên" bên dưới vì thế ghim `TOKEN_DOI_THEO_THEME` —
// 12 màu CỘNG đúng một token bóng — chứ không nới ra thành "có chứa".
const BONG = Object.freeze({
  '--shadow-inset': 'inset 0 1px 2px rgba(60, 48, 28, 0.07)',
});

const BONG_DARK = Object.freeze({
  '--shadow-inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.35)',
});

const BO_GOC = Object.freeze({
  '--radius-paper': '3px',
  '--radius-input': '6px',
  '--radius-tray': '8px',
  '--radius-full': '9999px',
});

/** Đúng những token mà `:root` được phép khai báo — không thừa một cái nào. */
const TOKEN_CUA_ROOT = Object.freeze([
  ...Object.keys(MAU_LIGHT),
  ...Object.keys(FONT),
  ...Object.keys(SPACING),
  ...Object.keys(BO_GOC),
  ...Object.keys(BONG),
]);

/** Đúng những token mà khối dark được phép ghi đè: 12 màu cộng token bóng. */
const TOKEN_DOI_THEO_THEME = Object.freeze([...Object.keys(MAU_DARK), ...Object.keys(BONG_DARK)]);

/** Khai báo KHÔNG phải custom property duy nhất được phép trong hai khối token.
 *  `color-scheme` phải nằm trong chúng: nó là thứ đổi màu thanh cuộn/con trỏ/ô nhập gốc theo
 *  theme, nên nó thuộc đúng chỗ đang định nghĩa theme. */
const NGOAI_LE_KHONG_PHAI_TOKEN = 'color-scheme';

// ---------------------------------------------------------------------------
// Cắt hai khối khai báo token theo selector — CHỈ trong `app/style.css`.
//
// Cạm bẫy mà cách cắt này tránh: nếu ca "không màu viết thẳng" bỏ qua cả `style.css` thì nó
// không kiểm gì; nếu nó quét cả khối `:root` thì chính 24 token trở thành vi phạm. Và nếu nó
// cắt `:root` khỏi MỌI file, thì một `app/view/x.css` với `:root { --brand: #FF00FF }` lại lọt.
// Nên: cắt đúng hai khối, đúng một file, và cấm mọi file `.css` khác khai báo `:root`.
// ---------------------------------------------------------------------------

const SELECTOR_LIGHT = ':root';
const SELECTOR_DARK = ':root[data-theme="dark"]';

/** Mọi khối `selector {…}` của một file CSS. */
function cacKhoi(css) {
  return [...css.matchAll(/([^{}]*)\{([^{}]*)\}/g)].map((khop) => ({
    selector: khop[1].trim(),
    than: khop[2],
    nguyenKhoi: khop[0],
  }));
}

function timKhoi(css, selector) {
  return cacKhoi(css).find((khoi) => khoi.selector === selector) ?? null;
}

/** Map tên token → giá trị, từ thân một khối khai báo. */
function cacKhaiBao(than) {
  const bang = new Map();
  for (const dong of than.split(';')) {
    const khop = /^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(dong);
    if (khop) bang.set(khop[1], khop[2]);
  }
  return bang;
}

/** Tên mọi thuộc tính KHÔNG phải custom property trong thân một khối. */
function khaiBaoKhongPhaiToken(than) {
  const ten = [];
  for (const dong of than.split(';')) {
    const cat = dong.trim();
    if (cat === '' || cat.startsWith('--')) continue;
    const khop = /^([\w-]+)\s*:/.exec(cat);
    ten.push(khop ? khop[1] : cat);
  }
  return ten;
}

/** `app/style.css` TRỪ hai khối khai báo token. Chỉ dùng cho đúng file đó. */
function phanNgoaiKhoiToken(css) {
  let conLai = css;
  for (const selector of [SELECTOR_LIGHT, SELECTOR_DARK]) {
    const khoi = timKhoi(conLai, selector);
    if (khoi !== null) conLai = conLai.replace(khoi.nguyenKhoi, '\n');
  }
  return conLai;
}

const khoiLight = timKhoi(styleCss, SELECTOR_LIGHT);
const khoiDark = timKhoi(styleCss, SELECTOR_DARK);
const khaiBaoLight = cacKhaiBao(khoiLight?.than ?? '');
const khaiBaoDark = cacKhaiBao(khoiDark?.than ?? '');

function lechSoVoiBang(khaiBao, bang, tenKhoi) {
  const lech = [];
  for (const [ten, mong] of Object.entries(bang)) {
    const thucTe = khaiBao.get(ten);
    if (thucTe === undefined) lech.push(`${ten} — thiếu trong ${tenKhoi}`);
    else if (thucTe.toLowerCase() !== mong.toLowerCase()) {
      lech.push(`${ten} — DESIGN.md nói ${mong}, style.css viết ${thucTe}`);
    }
  }
  return lech;
}

function danhSachFileCss(thuMuc) {
  const ketQua = [];
  for (const muc of readdirSync(thuMuc, { withFileTypes: true })) {
    const duongDan = join(thuMuc, muc.name);
    if (muc.isDirectory()) ketQua.push(...danhSachFileCss(duongDan));
    else if (muc.name.endsWith('.css')) ketQua.push(duongDan);
  }
  return ketQua;
}

function duongDanTuongDoi(duongDanTuyetDoi) {
  return relative(repoRoot, duongDanTuyetDoi).split('\\').join('/');
}

/** Mọi file `.css` dưới `app/`, kèm nội dung đã bỏ chú thích. */
function cacFileCss() {
  return danhSachFileCss(appDir).map((duongDan) => ({
    ten: duongDanTuongDoi(duongDan),
    css: boChuThichCss(readFileSync(duongDan, 'utf8')),
    thoc: readFileSync(duongDan, 'utf8'),
  }));
}

describe('style.css — hai bảng màu ghim theo DESIGN.md', () => {
  it('có đúng hai khối khai báo token: :root và :root[data-theme="dark"]', () => {
    expect(khoiLight).not.toBeNull();
    expect(khoiDark).not.toBeNull();
  });

  it(':root mang 12 token màu bản light với đúng hex của DESIGN.md', () => {
    expect(lechSoVoiBang(khaiBaoLight, MAU_LIGHT, ':root')).toEqual([]);
  });

  it(':root[data-theme="dark"] ghi đè 12 token màu bản dark với đúng hex của DESIGN.md', () => {
    expect(lechSoVoiBang(khaiBaoDark, MAU_DARK, 'khối dark')).toEqual([]);
  });

  it('khối dark ghi đè ĐÚNG 12 màu cộng --shadow-inset, không thừa không thiếu', () => {
    // Thừa một token typography/spacing ở đây nghĩa là một giá trị bố cục đổi theo theme —
    // thứ DESIGN.md không nói, và thứ không ai sẽ nhớ là đã xảy ra. `--shadow-inset` nằm
    // trong tập này vì bóng đen trên nền đen không đọc được, không vì nó "cũng nên đổi".
    expect([...khaiBaoDark.keys()].sort()).toEqual([...TOKEN_DOI_THEO_THEME].sort());
  });

  it('bóng lõm mang đúng giá trị của DESIGN.md ở CẢ HAI theme', () => {
    // Ghim cả hai bên vì hai khối token là chỗ mù duy nhất của bộ quét màu: một `rgba()` gõ
    // sai trong đó vẫn là CSS hợp lệ, vẫn ra một cái bóng trông giống, và không ca nào khác
    // phân biệt được.
    expect(lechSoVoiBang(khaiBaoLight, BONG, ':root')).toEqual([]);
    expect(lechSoVoiBang(khaiBaoDark, BONG_DARK, 'khối dark')).toEqual([]);
  });

  it('cả hai khối khai báo color-scheme, và đúng theo theme của mình', () => {
    // Không có nó thì ở bản dark thanh cuộn, con trỏ nháy, vùng chọn chữ và mọi ô nhập gốc vẫn
    // sáng — kể cả trong khung hình đầu tiên mà mục thử tay 14 đòi tester soi.
    expect(khoiLight.than).toMatch(/color-scheme:\s*light\s*;/);
    expect(khoiDark.than).toMatch(/color-scheme:\s*dark\s*;/);
  });
});

describe('style.css — :root không chứa gì ngoài token', () => {
  it(':root khai báo ĐÚNG tập token mong đợi, không thừa không thiếu', () => {
    // Thiếu ca này thì một `--font-thu-sau` hay một token lạ sống mãi trong `:root` mà không ai
    // biết nó có nghĩa gì, và bảng ghim mất tính "đây là toàn bộ hệ token".
    expect([...khaiBaoLight.keys()].sort()).toEqual([...TOKEN_CUA_ROOT].sort());
  });

  it(':root không mang khai báo thường nào ngoài color-scheme', () => {
    // `background: #123456` nằm trong `:root` thì nó vừa là màu viết thẳng vừa được ca cắt
    // khối token miễn trừ — đúng chỗ mù duy nhất của bộ quét.
    expect(khaiBaoKhongPhaiToken(khoiLight.than)).toEqual([NGOAI_LE_KHONG_PHAI_TOKEN]);
  });

  it('khối dark cũng không mang khai báo thường nào ngoài color-scheme', () => {
    expect(khaiBaoKhongPhaiToken(khoiDark.than)).toEqual([NGOAI_LE_KHONG_PHAI_TOKEN]);
  });
});

describe('style.css — typography, spacing, bo góc ghim theo DESIGN.md', () => {
  it('5 vai typography cộng letter-spacing của vai time mang đúng giá trị', () => {
    expect(lechSoVoiBang(khaiBaoLight, FONT, ':root')).toEqual([]);
  });

  it('7 bậc thang spacing cộng 8 token bố cục mang đúng giá trị', () => {
    expect(lechSoVoiBang(khaiBaoLight, SPACING, ':root')).toEqual([]);
  });

  it('4 cấp bo góc mang đúng giá trị', () => {
    expect(lechSoVoiBang(khaiBaoLight, BO_GOC, ':root')).toEqual([]);
  });

  it('không webfont: không @import và không url(…) nào trong style.css', () => {
    // `trang-tinh.test.js` đã phủ phần này cho cả cây `app/`; giữ lại đây vì AD-12 là lệnh cấm
    // của riêng file này, và nó phải đỏ ngay cạnh bảng token khi ai đó dán một webfont vào.
    expect(styleCss).not.toMatch(/@import\b/);
    expect(styleCss).not.toMatch(/url\s*\(/i);
  });
});

// Mọi cách viết "tắt focus ring". Ba thuộc tính của họ `outline`, hai giá trị vô hiệu hóa —
// `.x:focus-visible { outline: 0 }` là đúng cùng một vi phạm với `outline: none`.
const TAT_FOCUS_RING = /\boutline(?:-style|-width)?\s*:\s*(?:none|0)\b/i;

describe('AD-20 — sàn a11y cưỡng chế được', () => {
  it('mục 1: không file .css nào dưới app/ tắt focus ring, bằng bất cứ cách viết nào', () => {
    // Quét bản THÔ, không bỏ chú thích: một mẫu đã bị comment vẫn là mẫu người sau sẽ copy.
    const viPham = cacFileCss()
      .map(({ ten, thoc }) => ({ ten, khop: TAT_FOCUS_RING.exec(thoc) }))
      .filter(({ khop }) => khop !== null)
      .map(({ ten, khop }) => `${ten} — tắt focus ring: ${JSON.stringify(khop[0])}`);
    expect(viPham).toEqual([]);
  });

  it('mục 5: chiều rộng vùng chứa dùng max-width của token, không px cứng', () => {
    const conLai = phanNgoaiKhoiToken(styleCss);
    expect(conLai).toMatch(/max-width:\s*var\(--container-max\)/);
    // Neo để `max-width`/`min-width` không bị đếm là vi phạm: `-` là ranh giới từ, nên một
    // `\bwidth:` trần sẽ khớp cả `max-width: 118px` hợp lệ của DESIGN.md.
    expect(conLai).not.toMatch(/(?<![-\w])width:\s*\d+px/);
  });
});

// Mẫu màu viết thẳng. Tập tên màu CSS chỉ cần đủ phổ biến: mục đích là bắt cái phản xạ
// `color: white`, không phải viết một bộ phân tích CSS.
const TEN_MAU_CSS = [
  'aqua',
  'beige',
  'black',
  'blue',
  'brown',
  'coral',
  'crimson',
  'cyan',
  'fuchsia',
  'gold',
  'gray',
  'green',
  'grey',
  'indigo',
  'ivory',
  'khaki',
  'lime',
  'linen',
  'magenta',
  'maroon',
  'navy',
  'olive',
  'orange',
  'orchid',
  'pink',
  'plum',
  'purple',
  'red',
  'salmon',
  'silver',
  'snow',
  'tan',
  'teal',
  'tomato',
  'violet',
  'wheat',
  'white',
  'yellow',
];

const MAU_VIET_THANG = [
  /#[0-9a-f]{3,8}\b/i,
  /\brgba?\s*\(/i,
  /\bhsla?\s*\(/i,
  new RegExp(`:[^;{}]*\\b(?:${TEN_MAU_CSS.join('|')})\\b`, 'i'),
];

describe('AD-20 mục 4 — không một giá trị màu viết thẳng nào ngoài khối token', () => {
  it('mọi file .css dưới app/ chỉ dùng var(--…) cho màu', () => {
    // Hệ quả cố ý: về sau muốn thêm một màu mới thì phải thêm nó VÀO token, không có đường khác.
    const cacFile = cacFileCss();
    expect(cacFile.length).toBeGreaterThan(0);

    const viPham = [];
    for (const { ten, css } of cacFile) {
      // Chỉ `app/style.css` được cắt khối token; mọi file khác bị quét trọn vẹn.
      const conLai = ten === FILE_TOKEN ? phanNgoaiKhoiToken(css) : css;
      for (const mau of MAU_VIET_THANG) {
        const khop = mau.exec(conLai);
        if (khop) viPham.push(`${ten} — màu viết thẳng ${JSON.stringify(khop[0].trim())}`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('không file .css nào ngoài app/style.css khai báo :root — token chỉ có một chỗ', () => {
    const viPham = cacFileCss()
      .filter(({ ten }) => ten !== FILE_TOKEN)
      .filter(({ css }) => /(^|[\s,}])\:root\b/.test(css))
      .map(({ ten }) => `${ten} — khai báo :root ngoài ${FILE_TOKEN}`);
    expect(viPham).toEqual([]);
  });

  it('không file .css nào có at-rule hay lồng ngoặc — giả định của bộ quét phải hỏng ồn ào', () => {
    // `cacKhoi` khớp `selector { … }` một tầng. Một `@media`, một `@supports` hay một khối
    // lồng kiểu CSS nesting sẽ làm mọi khai báo bên trong thoát cả phép cắt khối token lẫn
    // phép quét màu, trong im lặng. Nên cấm hẳn, để ngày ai đó cần chúng thì họ phải sửa bộ
    // quét trước — không phải phát hiện ra sáu tháng sau.
    const viPham = [];
    for (const { ten, css } of cacFileCss()) {
      const atRule = /@[\w-]+[^;{}]*\{/.exec(css);
      if (atRule) viPham.push(`${ten} — at-rule có khối: ${JSON.stringify(atRule[0].trim())}`);
      let sau = 0;
      for (const c of css) {
        if (c === '{') sau += 1;
        else if (c === '}') sau -= 1;
        if (sau > 1) {
          viPham.push(`${ten} — ngoặc lồng sâu hơn một tầng`);
          break;
        }
      }
      if (sau !== 0) viPham.push(`${ten} — ngoặc không khớp`);
    }
    expect(viPham).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// index.html — script theme
// ---------------------------------------------------------------------------

/**
 * Tên khóa THẬT của theme, đọc từ bảng khóa đóng băng của adapter.
 *
 * Script nội tuyến viết lại chuỗi khóa lần thứ hai (trùng lặp có ý thức mà AD-19 cho phép, vì
 * import adapter là nạp bất đồng bộ). Trùng lặp thì phải có người canh: so script với một bản
 * copy thứ ba gõ trong test chỉ chứng minh test khớp chính nó, và một lần đổi tên
 * `BANG_KHOA.theme` sẽ đi qua suite xanh trong khi theme lặng lẽ mất chỗ lưu.
 */
function khoaThemeCuaAdapter() {
  const nguon = readFileSync(join(appDir, 'adapters', 'localstorage.js'), 'utf8');
  const khop = /BANG_KHOA\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/.exec(nguon);
  expect(khop).not.toBeNull();
  const theme = /(^|[\s,{])theme:\s*'([^']+)'/.exec(khop[1]);
  expect(theme).not.toBeNull();
  return theme[2];
}

const KHOA_THEME = khoaThemeCuaAdapter();

function phanHead(html) {
  const khop = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html);
  return khop === null ? '' : khop[1];
}

/** Mọi `<script>…</script>` trong `<head>`, giữ cả thuộc tính và thân. */
function cacScriptTrongHead(html) {
  return [...phanHead(html).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((k) => ({
    thuocTinh: k[1],
    than: k[2],
  }));
}

const scriptTrongHead = cacScriptTrongHead(indexHtml);

describe('index.html — script theme là đồng bộ, nội tuyến, trong <head>, trước <link>', () => {
  it('có đúng một <script> trong <head>', () => {
    expect(scriptTrongHead).toHaveLength(1);
  });

  it('nó KHÔNG mang type="module" và KHÔNG mang src — cả hai đều là nạp bất đồng bộ', () => {
    const { thuocTinh } = scriptTrongHead[0];
    expect(thuocTinh).not.toMatch(/\btype\s*=\s*['"]?module\b/i);
    expect(thuocTinh).not.toMatch(/\bsrc\s*=/i);
  });

  it('nó đọc đúng khóa theme của BANG_KHOA trong adapter, và đặt data-theme', () => {
    const { than } = scriptTrongHead[0];
    expect(KHOA_THEME).toMatch(/^ghichu\./);
    expect(than).toContain(`'${KHOA_THEME}'`);
    expect(than).toContain('data-theme');
  });

  it('nó đứng TRƯỚC <link rel="stylesheet">', () => {
    // Trình duyệt chặn vẽ tới khi CSS trong `<head>` tải xong, nên đặt sau `<link>` trên lý
    // thuyết vẫn kịp — nhưng `style.css` cùng origin, có thể đã nằm trong cache và áp gần như
    // tức thời. Ghim thứ tự ở đây để nó đúng theo định nghĩa, không nhờ vào thời điểm mạng, và
    // để một lần refactor `<head>` về sau không âm thầm đổi lại.
    const viTriScript = indexHtml.search(/<script\b/i);
    const viTriLink = indexHtml.search(/<link\b[^>]*rel\s*=\s*['"]?stylesheet\b/i);
    expect(viTriScript).toBeGreaterThan(-1);
    expect(viTriLink).toBeGreaterThan(-1);
    expect(viTriScript).toBeLessThan(viTriLink);
  });

  it('nó KHÔNG ghi gì xuống localStorage', () => {
    // Ghi giá trị suy ra từ hệ điều hành xuống kho biến "chưa chọn" thành "đã chọn", và nút
    // toggle của Epic 3 mất trạng thái thứ ba.
    expect(scriptTrongHead[0].than).not.toMatch(/setItem/);
  });
});

// Chạy THẲNG thân script với ba biến toàn cục giả. Không sao chép logic sang test — đúng đoạn
// mã trong `index.html` là đoạn được chạy, nên một lần sửa `index.html` không thể lọt qua.
function chayScriptTheme({ kho, mediaKhop, coMatchMedia = true } = {}) {
  const daGoiSetItem = [];
  const daDat = [];
  const setItem = (...thamSo) => daGoiSetItem.push(thamSo);
  const localStorage =
    kho === 'nem'
      ? {
          getItem() {
            const loi = new Error('The operation is insecure.');
            loi.name = 'SecurityError';
            throw loi;
          },
          setItem,
        }
      : {
          getItem: (khoa) => (khoa === KHOA_THEME && kho !== undefined ? kho : null),
          setItem,
        };

  const window = {};
  if (coMatchMedia) {
    window.matchMedia = (truyVan) => ({ media: truyVan, matches: mediaKhop === true });
  }

  const document = {
    documentElement: { setAttribute: (ten, giaTri) => daDat.push([ten, giaTri]) },
  };

  new Function('localStorage', 'window', 'document', scriptTrongHead[0].than)(
    localStorage,
    window,
    document,
  );

  return { daDat, daGoiSetItem };
}

/** Theme mà script đặt lên `<html>` — và khẳng định luôn rằng kho không bị ghi. */
function themeDaDat(thamSo) {
  const { daDat, daGoiSetItem } = chayScriptTheme(thamSo);
  expect(daGoiSetItem).toEqual([]);
  expect(daDat).toHaveLength(1);
  expect(daDat[0][0]).toBe('data-theme');
  return daDat[0][1];
}

describe('index.html — I/O Matrix của script theme, chạy thật', () => {
  it("key 'dark' → data-theme=\"dark\"", () => {
    expect(themeDaDat({ kho: 'dark', mediaKhop: false })).toBe('dark');
  });

  it("key 'light' → data-theme=\"light\"", () => {
    expect(themeDaDat({ kho: 'light', mediaKhop: false })).toBe('light');
  });

  it('chưa từng chọn + hệ nền tối → dark, và kho không bị ghi', () => {
    expect(themeDaDat({ kho: undefined, mediaKhop: true })).toBe('dark');
  });

  it('chưa từng chọn + hệ nền sáng hoặc không rõ → light, và kho không bị ghi', () => {
    expect(themeDaDat({ kho: undefined, mediaKhop: false })).toBe('light');
  });

  it("key 'light' THẮNG hệ nền tối — lựa chọn tường minh luôn thắng", () => {
    expect(themeDaDat({ kho: 'light', mediaKhop: true })).toBe('light');
  });

  it('giá trị rác xử như chưa chọn: rơi về hệ điều hành, không ghi lại vào kho, không ném', () => {
    for (const rac of ['DARK', '', 'xanh', 'Light', 'null']) {
      expect(themeDaDat({ kho: rac, mediaKhop: true })).toBe('dark');
      expect(themeDaDat({ kho: rac, mediaKhop: false })).toBe('light');
    }
  });

  it('localStorage bị chặn (ném SecurityError) → rơi về hệ điều hành, không ném ra ngoài', () => {
    expect(themeDaDat({ kho: 'nem', mediaKhop: true })).toBe('dark');
    expect(themeDaDat({ kho: 'nem', mediaKhop: false })).toBe('light');
  });

  it('matchMedia vắng mặt → rơi về light', () => {
    expect(themeDaDat({ kho: undefined, coMatchMedia: false })).toBe('light');
  });

  it('cả hai cửa hỏng cùng lúc thì trang vẫn đặt được thuộc tính', () => {
    expect(themeDaDat({ kho: 'nem', coMatchMedia: false })).toBe('light');
  });
});
