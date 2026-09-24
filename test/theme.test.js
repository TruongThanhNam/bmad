// Story 3.3 — nút theme, và ngưỡng tương phản biến từ LỜI HỨA thành PHÉP ĐO.
//
// Hai nửa, và chúng canh hai thứ khác nhau:
//
//   (1) BẢNG MÀU. `token-style.test.js` đã ghim 24 hex khớp `DESIGN.md`, nhưng "khớp mockup" và
//       "đạt 4.5:1" là hai câu khác nhau — và chỉ câu thứ hai là thứ AD-20 mục 4 hứa. Bốn cửa
//       dưới đây tính tỉ lệ TỪ CHÍNH hai khối token trong `app/style.css`, không từ một bảng
//       hex chép lại: một bảng chép tay là chỗ hai nguồn sự thật bắt đầu trôi khỏi nhau, đúng
//       lúc không ai nhìn. Đổi một hex làm tụt một cặp xuống dưới ngưỡng là một ca ĐỎ nêu đúng
//       tên cặp token.
//   (2) HÀNH VI CỦA NÚT, trên một DOM giả và cổng giả theo khuôn `banner.test.js` — `noiNutTheme`
//       nhận tài liệu qua tham số, nên không cần jsdom.
//
// Cái mà file này KHÔNG trả lời được, và vì thế `npm run thu-bo-cuc` phải trả lời: một cặp
// chữ/nền chỉ có THẬT khi một phần tử `--ink-2` cuối cùng nằm trên `--paper` chứ không trên
// `--chip-bg`. Chỗ đứng là chuyện của cây DOM, và chỉ trình duyệt thật biết nó.

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MA_LOI, loiUngDung } from '../app/core/errors.js';
import { APP_VERSION } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';
import { noiNutTheme } from '../app/view/nut-theme.js';
import { boChuThichCss, boChuThichJs } from './helpers/quet-nguon.js';
import { kenhRgb, tuongPhan, tuongPhanLamTron } from './helpers/tuong-phan.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');
const styleCss = boChuThichCss(readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8'));

/** Ngưỡng của AD-20 mục 4 / UX-DR-30 — chữ thường, không có bậc miễn trừ nào cho "chữ to". */
const NGUONG = 4.5;

// ---------------------------------------------------------------------------
// Đọc hai khối token TỪ CHÍNH `app/style.css`
// ---------------------------------------------------------------------------

function cacKhoi(css) {
  return [...css.matchAll(/([^{}]*)\{([^{}]*)\}/g)].map((khop) => ({
    selector: khop[1].trim(),
    than: khop[2],
  }));
}

function khaiBaoCua(selector) {
  const khoi = cacKhoi(styleCss).find((k) => k.selector === selector);
  if (khoi === undefined) throw new Error(`không tìm thấy khối ${selector} trong app/style.css`);
  const bang = new Map();
  for (const dong of khoi.than.split(';')) {
    const khop = /^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(dong);
    if (khop) bang.set(khop[1], khop[2]);
  }
  return bang;
}

const TOKEN_LIGHT = khaiBaoCua(':root');
const TOKEN_DARK_GHI_DE = khaiBaoCua(':root[data-theme="dark"]');

/**
 * Bảng màu THỰC TẾ của một theme: bản light là `:root`, bản dark là `:root` đã bị khối dark ghi
 * đè. Dựng bằng phép chồng chứ không bằng hai bảng rời, đúng cách trình duyệt phân giải — một
 * token dark thiếu dòng ghi đè vì thế được đo bằng giá trị light của nó, và nếu giá trị đó
 * không đạt trên nền dark thì ca dưới đây đỏ. Đó chính là câu hỏi cần hỏi.
 */
const BANG_MAU = Object.freeze({
  light: TOKEN_LIGHT,
  dark: new Map([...TOKEN_LIGHT, ...TOKEN_DARK_GHI_DE]),
});

function mau(theme, ten) {
  const giaTri = BANG_MAU[theme].get(ten);
  if (giaTri === undefined) throw new Error(`token ${ten} không có trong bảng ${theme}`);
  return giaTri;
}

// ---------------------------------------------------------------------------
// Cặp chữ/nền THỰC SỰ được dùng
// ---------------------------------------------------------------------------

/** `app/style.css` TRỪ hai khối token — phần duy nhất có luật thật. */
function phanLuatThat() {
  let conLai = styleCss;
  for (const selector of [':root', ':root[data-theme="dark"]']) {
    const khoi = [...conLai.matchAll(/([^{}]*)\{([^{}]*)\}/g)].find(
      (k) => k[1].trim() === selector,
    );
    if (khoi !== undefined) conLai = conLai.replace(khoi[0], '\n');
  }
  return conLai;
}

/** Mọi luật `selector { … }` mang một khai báo `color: var(--…)`, trong phần luật thật. */
function cacLuatCoMauChu() {
  const ra = [];
  for (const khop of phanLuatThat().matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const mauChu = /(?:^|[;\s])color\s*:\s*var\(\s*(--[\w-]+)\s*\)/.exec(khop[2]);
    if (mauChu !== null) ra.push({ selector: khop[1].trim(), token: mauChu[1] });
  }
  return ra;
}

/**
 * CHỖ ĐỨNG của mỗi luật có màu chữ: token nền mà chữ đó thật sự nằm trên.
 *
 * Bảng này là thứ DUY NHẤT phải viết tay ở đây, và nó không thể suy ra từ file CSS: nền của một
 * phần tử đến từ tổ tiên gần nhất có nền đục, tức từ cây DOM chứ không từ bảng kiểu. Nhưng nó
 * không phải một nguồn sự thật thứ hai về MÀU — mọi hex vẫn đọc từ hai khối token — và nó được
 * canh bằng hai ca: mọi luật có `color` phải có mặt ở đây (không thì đỏ), và `npm run thu-bo-cuc`
 * đo lại đúng những cặp này trên trình duyệt thật.
 */
const NEN_CUA = Object.freeze({
  // `body` là nền bàn; `.o-luoi` (mẩu giấy) không khai `color` nên nó thừa hưởng từ đây, và cặp
  // `--ink` trên `--paper` được ghim ở dòng `.mau-than` bên dưới.
  body: '--bg',
  '.dai-bang-chu': '--chip-bg',
  '.dai-bang-dong': '--chip-bg',
  '.o-soan': '--surface',
  '.o-soan-nhac': '--bg',
  '.khay-nhan': '--chip-bg',
  '.o-nhap': '--surface',
  // Ô ngày không mang nền riêng; nền của nó là khung bọc `.o-ngay-boc`, và chữ của nó cũng
  // thừa hưởng màu từ đó.
  '.o-ngay-boc': '--surface',
  // Ô sửa tại chỗ (Story 5.1) mang nền `--surface` của chính nó, y như `.o-soan` — nó là chỗ
  // đang gõ, và chỗ đang gõ sáng hơn nền giấy quanh nó.
  '.mau-sua': '--surface',
  '.mau-gio': '--paper',
  '.mau-xoa': '--paper',
  '.mau-gap': '--paper',
  // Phần khớp từ khóa (Story 6.1): `<mark>` mang nền `--hl` của chính nó.
  '.mau-khop': '--hl',
  // Dòng "không khớp" đứng thẳng trên nền bàn, như dòng nhắc dưới ô soạn thảo.
  '.luoi-khong-khop': '--bg',
  // Chữ lỗi ô ngày (Story 6.2) đứng dưới khay, thẳng trên nền bàn — không trên `--chip-bg`.
  '.o-ngay-loi-chu': '--bg',
  // Hàng chip (Story 6.3): chip mang nền `--chip-bg` của chính nó; số kết quả và `về hôm nay`
  // đứng thẳng trên nền bàn, dưới khay.
  '.chip': '--chip-bg',
  '.hang-chip-dem': '--bg',
  '.ve-hom-nay': '--bg',
  // Hộp thoại xác nhận xóa (Story 5.3): cả ba chỗ có chữ nằm trên nền `--surface` của chính
  // hộp, không trên màn phủ — màn phủ ở DƯỚI hộp, và không một chữ nào đứng trên nó.
  '.hop-thoai-tieu-de': '--surface',
  '.hop-thoai-than': '--surface',
  '.hop-thoai-chon': '--surface',
  // Cặp `--danger` trên `--surface`: đây là cặp phải đạt ngưỡng ở CẢ HAI bảng màu, và nó khác
  // hẳn cặp `--danger` trên `--chip-bg` đang có biên 0.05 (dải băng) — hộp thoại không dùng
  // `--chip-bg`, nên nó không thừa hưởng khoản nợ đó.
  '.hop-thoai-xoa': '--surface',
  '.chan-link': '--bg',
  '.chan-cham': '--bg',
  '.chan-nhac': '--bg',
  '.nut-theme': '--bg',
});

/** Cặp chữ/nền được thừa hưởng, không luật nào khai ra — nhưng vẫn là chữ trên màn hình. */
const CAP_THUA_HUONG = Object.freeze([
  // Thân mẩu giấy: màu đến từ `body` (`--ink`), nền đến từ `.o-luoi` (`--paper`).
  { vi: 'thân mẩu giấy', token: '--ink', nen: '--paper' },
]);

// ---------------------------------------------------------------------------
// (1a) Mọi cặp chữ/nền thật sự được dùng đạt ngưỡng, ở CẢ HAI bảng màu
// ---------------------------------------------------------------------------

describe('tương phản — đo từ chính hai khối token, không từ một bảng chép lại', () => {
  it('có đọc được hai bảng màu, và bản dark ghi đè đúng 13 token màu', () => {
    // Cửa chặn của chính bộ đo: nếu phép cắt khối hỏng thì mọi ca dưới đây xanh vì rỗng.
    //
    // 13 chứ không 12 từ Story 5.3: `--overlay` (màn phủ của hộp thoại xác nhận) là một token
    // MÀU dù giá trị của nó là `rgba()` — một `rgba()` trong một luật CSS là đúng cái AD-20 mục
    // 4 cấm, nên nó không có chỗ nào khác để sống. Nó KHÔNG vào bảng tương phản bên dưới, và đó
    // là đúng: không một chữ nào đứng trên nó, nó là nền của một lớp phủ.
    expect(TOKEN_LIGHT.size).toBeGreaterThan(13);
    expect([...TOKEN_DARK_GHI_DE.keys()].filter((t) => !t.startsWith('--shadow'))).toHaveLength(13);
  });

  it('mọi luật có `color: var(--…)` đều được khai chỗ đứng — không luật nào lọt khỏi phép đo', () => {
    const luat = cacLuatCoMauChu();
    expect(luat.length).toBeGreaterThan(0);
    const thieu = luat
      .filter(({ selector }) => !Object.prototype.hasOwnProperty.call(NEN_CUA, selector))
      .map(({ selector, token }) => `${selector} — đặt ${token} nhưng không có trong NEN_CUA`);
    expect(thieu).toEqual([]);
  });

  it('mọi cặp chữ/nền đang dùng đạt ≥ 4.5:1 ở CẢ light và dark', () => {
    const cap = [
      ...cacLuatCoMauChu().map(({ selector, token }) => ({
        vi: selector,
        token,
        nen: NEN_CUA[selector],
      })),
      ...CAP_THUA_HUONG,
    ];
    const loang = [];
    for (const theme of ['light', 'dark']) {
      for (const { vi, token, nen } of cap) {
        // So trên giá trị THÔ, không trên giá trị đã làm tròn: `4.496` làm tròn thành `4.5` và
        // lọt qua — tức bộ đo có một dải mù đúng ngay tại ngưỡng của chính nó. Số làm tròn chỉ
        // dùng để NÓI, không để quyết định.
        const tho = tuongPhan(mau(theme, token), mau(theme, nen));
        if (tho < NGUONG) {
          const ty = tuongPhanLamTron(mau(theme, token), mau(theme, nen));
          loang.push(`${theme}: ${token} trên ${nen} (${vi}) = ${ty}:1`);
        }
      }
    }
    expect(loang).toEqual([]);
  });

  it('bản Node và bản trình duyệt của công thức WCAG cho ra ĐÚNG cùng một con số', () => {
    // Hai bản tồn tại vì bản kia phải đi qua CDP dưới dạng CHUỖI và không import được, nên
    // "không được lệch một dòng nào" là một lời hứa — cho tới ca này. Đọc `HAM_TEN` ra khỏi
    // `tools/thu-bo-cuc.mjs`, chạy nó, rồi đối chiếu trên chính các cặp token của sản phẩm.
    const nguon = readFileSync(join(repoRoot, 'tools', 'thu-bo-cuc.mjs'), 'utf8');
    const khop = /const HAM_TEN = `([\s\S]*?)\n`;/.exec(nguon);
    expect(khop).not.toBeNull();
    // `ten`/`vong`/`nenThat` trong đoạn đó chạm `document`, nhưng chúng là các hàm mũi tên gán
    // vào `const` — chúng chỉ nổ khi BỊ GỌI, và ca này chỉ gọi `tuongPhan`. `document` vẫn phải
    // tồn tại cho phép gán ở thân đoạn, nên dựng một chỗ giữ chỗ tối giản.
    // Gỡ một lớp `\` — trong `.mjs` đoạn đó là thân một template literal, nên `\\d` ở nguồn là
    // `\d` lúc chạy thật. Đọc nguyên văn mà không gỡ thì `[\\d.]` thành một lớp ký tự khớp dấu
    // gạch chéo, và mọi con số biến thành `NaN`.
    const thanThat = khop[1].replace(/\\\\/g, '\\');
    const layTuongPhanTrinhDuyet = new Function(
      'document',
      'getComputedStyle',
      `${thanThat}\nreturn tuongPhan;`,
    );
    const hexSangRgb = (hex) => `rgb(${kenhRgb(hex).join(', ')})`;
    const tuongPhanKia = layTuongPhanTrinhDuyet({ body: null }, () => ({}));
    const capThu = [
      ['--ink', '--bg'],
      ['--ink-2', '--chip-bg'],
      ['--danger', '--chip-bg'],
      ['--ink-decor', '--paper'],
      ['--focus', '--surface'],
    ];
    for (const theme of ['light', 'dark']) {
      for (const [chu, nen] of capThu) {
        const a = mau(theme, chu);
        const b = mau(theme, nen);
        expect(tuongPhanKia(hexSangRgb(a), hexSangRgb(b))).toBeCloseTo(tuongPhan(a, b), 10);
      }
    }
  });

  it('phép đo THẬT SỰ đỏ được: một hex tụt xuống thì cặp mang tên nó bị nêu ra', () => {
    // Phép đột biến chạy trên một bản SAO của bảng, không trên file: ca trên chỉ có giá trị nếu
    // nó biết đỏ, và không có ca này thì một bộ đo luôn xanh trông y hệt một bộ đo đúng.
    const gia = new Map(BANG_MAU.light);
    gia.set('--ink-2', gia.get('--ink-decor'));
    expect(tuongPhan(gia.get('--ink-2'), gia.get('--bg'))).toBeLessThan(NGUONG);
  });
});

// ---------------------------------------------------------------------------
// (1b) Khoản nợ đã ghi sổ: 4.55:1, và cái chuông gắn vào nó
// ---------------------------------------------------------------------------

describe('cặp --danger trên --chip-bg bản dark — biên còn 0.05', () => {
  it('ra ĐÚNG 4.55:1 (làm tròn 2 chữ số)', () => {
    // Ghim con số chứ không chỉ ghim "≥ 4.5": biên 0.05 là thứ mắt không thấy, nên ca này đỏ
    // NGAY khi ai đó chỉnh một trong hai hex — trước khi cặp kia kịp tụt xuống dưới ngưỡng.
    expect(tuongPhanLamTron(mau('dark', '--danger'), mau('dark', '--chip-bg'))).toBe(4.55);
  });

  it('cảnh báo "tính lại trước khi commit" có trong CẢ style.css lẫn README', () => {
    const thoCss = readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8');
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
    for (const van of [thoCss, readme]) {
      expect(van).toMatch(/4\.55/);
      expect(van).toMatch(/chip-bg/);
      expect(van).toMatch(/trước khi commit/i);
    }
  });
});

// ---------------------------------------------------------------------------
// (1c) `--ink-decor` không bao giờ là chữ · (1d) vai `foot` không bao giờ mờ hơn `--ink-2`
// ---------------------------------------------------------------------------

function cacFileCss(thuMuc = appDir) {
  const ra = [];
  for (const muc of readdirSync(thuMuc, { withFileTypes: true })) {
    const duongDan = join(thuMuc, muc.name);
    if (muc.isDirectory()) ra.push(...cacFileCss(duongDan));
    else if (muc.name.endsWith('.css')) {
      ra.push({
        ten: relative(repoRoot, duongDan).split('\\').join('/'),
        css: boChuThichCss(readFileSync(duongDan, 'utf8')),
      });
    }
  }
  return ra;
}

describe('AD-20 mục 4 — luật dùng token, không chỉ luật khai token', () => {
  it('--ink-decor KHÔNG BAO GIỜ là giá trị của `color`, ở bất kỳ file .css nào dưới app/', () => {
    // Nó là màu của NÉT trang trí (gạch chân chấm chấm của `.mau-xoa`), và trên mọi nền của sản
    // phẩm nó chỉ đạt 1.8–3.4:1. Quét theo tên token chứ không theo tỉ lệ: một ngày nào đó hex
    // của nó đổi, và lệnh cấm này không được phụ thuộc vào con số hôm nay.
    const viPham = [];
    for (const { ten, css } of cacFileCss()) {
      for (const khop of css.matchAll(/(?:^|[;{\s])color\s*:\s*([^;}]+)/g)) {
        if (/--ink-decor\b/.test(khop[1])) viPham.push(`${ten} — color: ${khop[1].trim()}`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('mọi luật đặt `font: var(--font-foot)` đều dùng --ink-2 hoặc đậm hơn', () => {
    // Vai `foot` là chữ NHỎ NHẤT của sản phẩm (11.5px), nên nó là chỗ một màu mờ gây hại nhất.
    // Không khai `color` thì hợp lệ: nó thừa hưởng, và mọi chỗ thừa hưởng trong sản phẩm đều là
    // `--ink` — đậm hơn `--ink-2`. Tập cho phép ghim ĐÚNG hai token, không nới thành "không
    // phải --ink-decor": một `--rule` hay một `--focus` làm màu chữ cũng phải đỏ ở đây.
    const CHO_PHEP = ['--ink', '--ink-2'];
    const viPham = [];
    for (const { ten, css } of cacFileCss()) {
      for (const khop of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
        if (!/font\s*:\s*var\(\s*--font-foot\s*\)/.test(khop[2])) continue;
        const mauChu = /(?:^|[;\s])color\s*:\s*([^;}]+)/.exec(khop[2]);
        if (mauChu === null) continue;
        const token = /var\(\s*(--[\w-]+)\s*\)/.exec(mauChu[1]);
        if (token === null || !CHO_PHEP.includes(token[1])) {
          viPham.push(`${ten} — ${khop[1].trim()} dùng vai foot với color: ${mauChu[1].trim()}`);
        }
      }
    }
    expect(viPham).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// (2) Hành vi của nút — DOM giả, cổng giả
// ---------------------------------------------------------------------------

function nutGia() {
  return {
    textContent: '',
    boNghe: {},
    addEventListener(ten, ham) {
      this.boNghe[ten] = ham;
    },
  };
}

function tailieuGia(nut) {
  return {
    documentElement: {
      thuocTinh: {},
      setAttribute(ten, giaTri) {
        this.thuocTinh[ten] = giaTri;
      },
    },
    querySelector(chon) {
      return chon === '.nut-theme' ? nut : null;
    },
  };
}

function portsDay() {
  const ports = {};
  for (const tenCong of Object.keys(PORT_METHODS)) {
    const cong = {};
    for (const tenPhuongThuc of PORT_METHODS[tenCong]) {
      cong[tenPhuongThuc] = () => {
        throw new Error(`không ca test nào được gọi ${tenCong}.${tenPhuongThuc}`);
      };
    }
    ports[tenCong] = cong;
  }
  return ports;
}

/** Store thật + DOM giả + hai cổng ghi nhật ký được — cùng khuôn `banner.test.js`. */
function dungSan(tuyChon = {}) {
  const { nemKhiGhi = null, themeBanDau = 'light' } = tuyChon;
  const daGhiKho = [];
  const daPhat = [];
  const ports = portsDay();
  ports.sessionStore = {
    ...ports.sessionStore,
    write(key, value) {
      if (nemKhiGhi !== null) throw loiUngDung(nemKhiGhi);
      daGhiKho.push([key, value]);
    },
    tabIdentity: () => 'tab-cu',
  };
  ports.channel = { publish: (tin) => daPhat.push(tin), subscribe() {} };
  ports.noteStore = { ...ports.noteStore, readAll: () => Promise.resolve([]) };
  const store = taoStore(ports);
  const nut = nutGia();
  const doc = tailieuGia(nut);
  let soLanVeLai = 0;
  const view = noiNutTheme(store, doc, () => {
    soLanVeLai += 1;
  });
  return {
    store,
    nut,
    doc,
    view,
    daGhiKho,
    daPhat,
    veLai: () => soLanVeLai,
    san: store.khoiDong(themeBanDau),
  };
}

/** Mã nguồn của view, đã bỏ chú thích — mọi cửa quét dưới đây hỏi về MÃ, không về lời giải thích. */
function maNguonView() {
  return boChuThichJs(readFileSync(join(repoRoot, 'app', 'view', 'nut-theme.js'), 'utf8'));
}

/** Một cú bấm chuột, và đợi cả chuỗi lời hứa của action chạy xong. */
async function bam(bo) {
  bo.nut.boNghe.click();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('app/view/nut-theme.js — nhãn chữ, phép lật hai chiều, và đường xuống kho', () => {
  it('nhãn là CHỮ và nói nơi SẼ TỚI: `nền tối` khi đang sáng, `nền sáng` khi đang tối', async () => {
    const bo = dungSan();
    await bo.san;
    bo.view.ve();
    expect(bo.nut.textContent).toBe('nền tối');
    await bam(bo);
    bo.view.ve();
    expect(bo.nut.textContent).toBe('nền sáng');
  });

  it('nhớ lại lần sau: theme vào qua khoiDong, nhãn đọc đúng chiều ngay lượt vẽ đầu', async () => {
    const bo = dungSan({ themeBanDau: 'dark' });
    await bo.san;
    bo.view.ve();
    expect(bo.store.state.theme).toBe('dark');
    expect(bo.nut.textContent).toBe('nền sáng');
    // Và KHÔNG một phép ghi nào: "chưa từng chọn" phải giữ nghĩa của nó cho tới lần bấm đầu.
    expect(bo.daGhiKho).toEqual([]);
  });

  it('data-theme chỉ đặt trên <html>, không trên nút và không ở đâu khác', async () => {
    const bo = dungSan();
    await bo.san;
    bo.view.ve();
    expect(bo.nut.textContent).toBe('nền tối');
    expect(bo.doc.documentElement.thuocTinh['data-theme']).toBe('light');
    await bam(bo);
    bo.view.ve();
    expect(bo.doc.documentElement.thuocTinh['data-theme']).toBe('dark');
    const ma = maNguonView();
    // `documentElement` là chủ DUY NHẤT của thuộc tính: hai nơi ghi là hai bảng màu cùng lúc.
    expect([...ma.matchAll(/setAttribute\s*\(/g)]).toHaveLength(1);
    expect(ma).toMatch(/documentElement/);
  });

  it('bấm lật hai chiều: data-theme, state và khóa `theme` đi cùng nhau', async () => {
    const bo = dungSan();
    await bo.san;
    bo.view.ve();
    await bam(bo);
    expect(bo.store.state.theme).toBe('dark');
    await bam(bo);
    expect(bo.store.state.theme).toBe('light');
    expect(bo.daGhiKho).toEqual([
      ['theme', 'dark'],
      ['theme', 'light'],
    ]);
  });

  it('mỗi cú bấm phát ĐÚNG MỘT bản tin session-changed, đúng bốn trường', async () => {
    const bo = dungSan();
    await bo.san;
    await bam(bo);
    expect(bo.daPhat).toEqual([
      { v: 1, type: 'session-changed', from: 'tab-cu', appVersion: APP_VERSION },
    ]);
  });

  it('bấm xong thì gọi lại lượt vẽ chung — nhãn không đứng yên ở chiều cũ', async () => {
    const bo = dungSan();
    await bo.san;
    await bam(bo);
    expect(bo.veLai()).toBe(1);
  });

  it('kho từ chối → theme KHÔNG đổi, nhãn giữ nguyên, dải băng mang đúng mã lỗi', async () => {
    for (const ma of [MA_LOI.QUOTA, MA_LOI.DB]) {
      const bo = dungSan({ nemKhiGhi: ma });
      await bo.san;
      bo.view.ve();
      await bam(bo);
      bo.view.ve();
      expect(bo.store.state.theme).toBe('light');
      expect(bo.nut.textContent).toBe('nền tối');
      expect(bo.store.state.banner).toBe(ma);
      expect(bo.daPhat).toEqual([]);
    }
  });

  it('không có nút (hay không có tài liệu) thì `ve` vẫn gọi được và không ném', () => {
    const store = taoStore(portsDay());
    for (const doc of [null, { querySelector: () => null }]) {
      expect(() => noiNutTheme(store, doc).ve()).not.toThrow();
    }
  });

  it('view KHÔNG giữ state riêng và KHÔNG chạm kho: chỉ đọc store, chỉ gọi action', () => {
    // Quét bản đã BỎ CHÚ THÍCH: chính chú thích của file nói về `localStorage` và `adapters/`
    // để giải thích lệnh cấm, và một chú thích không phải mã (khuôn `test/helpers/quet-nguon.js`).
    const ma = maNguonView();
    expect(ma).not.toMatch(/localStorage|sessionStorage|adapters\//);
    // Đúng MỘT action của lõi, và không một phép ghi state nào.
    const chamStore = new Set([...ma.matchAll(/store\s*\.\s*([\w$]+)/g)].map((k) => k[1]));
    expect([...chamStore].sort()).toEqual(['datTheme', 'state']);
  });

  it('không phím tắt nào cho theme — sản phẩm có đúng bốn phím (UX-DR-26)', () => {
    expect(maNguonView()).not.toMatch(/keydown|keyup|keypress/);
  });

  it('không icon mặt trời/mặt trăng: nhãn là hai chuỗi chữ và không gì khác (UX-DR-20)', () => {
    const ma = maNguonView();
    expect(ma).toMatch(/'nền tối'/);
    expect(ma).toMatch(/'nền sáng'/);
    expect(ma).not.toMatch(/svg|☀|☾|🌙|🌞/i);
    // Nhãn là CHỮ, nên nó đi qua `textContent`, không qua `innerHTML`.
    expect(ma).not.toMatch(/innerHTML/);
  });
});

// ---------------------------------------------------------------------------
// (3) Adapter kênh — dựng được ở một môi trường KHÔNG có BroadcastChannel
// ---------------------------------------------------------------------------

describe('app/adapters/broadcast.js — kênh mở LƯỜI, vắng mặt thì im lặng', () => {
  it('dựng được ở Node (không có BroadcastChannel), và hai phương thức không ném', async () => {
    const { taoBroadcast } = await import('../app/adapters/broadcast.js');
    const cong = taoBroadcast();
    expect(typeof cong.publish).toBe('function');
    expect(typeof cong.subscribe).toBe('function');
    expect(() => cong.publish({ v: 1, type: 'session-changed', from: 'x', appVersion: '0' })).not.toThrow();
    expect(() => cong.subscribe(() => {})).not.toThrow();
  });

  it('kênh NÉM lúc mở hay lúc phát thì vẫn im lặng — không lỗi nào nổi lên', async () => {
    // Một origin bị cô lập có `BroadcastChannel` trên global nhưng từ chối mở; một kênh đã đóng
    // ném ở `postMessage`. Cả hai phải chết tại chỗ: chúng đi lên `datTheme` qua `phatPhienDoi`,
    // và `view/nut-theme.js` cố ý không có `.catch` — một lời hứa bị từ chối ở đó là nhãn nút
    // đứng yên ở chiều cũ sau một lần đổi theme ĐÃ THÀNH CÔNG.
    const cu = globalThis.BroadcastChannel;
    const { taoBroadcast } = await import('../app/adapters/broadcast.js');
    const tin = { v: 1, type: 'session-changed', from: 'x', appVersion: APP_VERSION };
    try {
      globalThis.BroadcastChannel = class {
        constructor() {
          throw new Error('origin bị cô lập');
        }
      };
      const nemLucMo = taoBroadcast();
      expect(() => nemLucMo.publish(tin)).not.toThrow();
      expect(() => nemLucMo.subscribe(() => {})).not.toThrow();

      globalThis.BroadcastChannel = class {
        postMessage() {
          throw new Error('kênh đã đóng');
        }
        addEventListener() {}
      };
      const nemLucPhat = taoBroadcast();
      expect(() => nemLucPhat.publish(tin)).not.toThrow();
    } finally {
      if (cu === undefined) delete globalThis.BroadcastChannel;
      else globalThis.BroadcastChannel = cu;
    }
  });

  it('có BroadcastChannel thì phát thật, và tên kênh mang tiền tố `ghichu.` (AD-9)', async () => {
    const daGui = [];
    const tenKenh = [];
    const cu = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = class {
      constructor(ten) {
        tenKenh.push(ten);
      }
      postMessage(tin) {
        daGui.push(tin);
      }
      addEventListener() {}
    };
    try {
      // ESM giữ module trong bộ nhớ đệm, nên lệnh import này KHÔNG chạy lại thân module — và
      // đó là điều đúng để nói ra: bằng chứng của phép mở LƯỜI không nằm ở lần import, nó nằm ở
      // `expect(tenKenh).toEqual([])` ngay dưới đây. Dựng factory xong mà chưa gọi phương thức
      // nào thì chưa một kênh nào được mở — đó là thứ khiến `app/main.js` nạp được ở Node.
      const { taoBroadcast } = await import('../app/adapters/broadcast.js');
      const cong = taoBroadcast();
      expect(tenKenh).toEqual([]);
      cong.publish({ v: 1, type: 'session-changed', from: 'tab-cu', appVersion: APP_VERSION });
      expect(tenKenh).toEqual(['ghichu.tab-sync']);
      expect(daGui).toHaveLength(1);
    } finally {
      if (cu === undefined) delete globalThis.BroadcastChannel;
      else globalThis.BroadcastChannel = cu;
    }
  });
});
