// Bốn tầng cố định trên nền bàn (Story 2.1) — phần kiểm được bằng cách quét văn bản.
//
// Chia việc có ý thức: những gì chỉ trình duyệt thật mới trả lời được (số cột ở từng bề
// rộng, tầng nào thật sự cuộn) nằm ở `npm run thu-bo-cuc`, không ở đây. Còn ở đây là những
// bất biến mà một người sửa CSS lúc nửa đêm có thể phá trong im lặng: thứ tự bốn tầng, lưới
// khai báo bằng token chứ không bằng số, và trên hết — KHÔNG một breakpoint nào. "Không
// breakpoint" mà không có test thì chỉ là một lời hứa trong chú thích.
//
// `test/token-style.test.js` đã cưỡng chế luật màu/px/at-rule/lồng khối trên mọi file `.css`;
// tệp này KHÔNG chép lại các luật đó, chỉ thêm phần riêng của bố cục.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThichCss, boChuThichHtml } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const html = boChuThichHtml(readFileSync(join(repoRoot, 'index.html'), 'utf8'));
const css = boChuThichCss(readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8'));

/** Vị trí xuất hiện đầu tiên của một mẫu, hoặc `-1`. */
function viTri(nguon, mau) {
  return nguon.search(mau);
}

describe('Bốn tầng có mặt, đúng thứ tự đọc', () => {
  const tang = [
    ['tầng 1 — ô soạn thảo', /class="[^"]*\btang-soan\b/],
    ['tầng 2 — khay tìm kiếm + lọc ngày', /class="[^"]*\btang-khay\b/],
    ['tầng 3 — lưới ghi chú', /class="[^"]*\btang-luoi\b/],
    ['tầng 4 — chân trang', /class="[^"]*\btang-chan\b/],
  ];

  for (const [ten, mau] of tang) {
    it(`${ten} có mặt trong index.html`, () => {
      expect(viTri(html, mau)).toBeGreaterThan(-1);
    });
  }

  it('thứ tự DOM đúng thứ tự đọc: soạn → khay → lưới → chân', () => {
    const viTriTang = tang.map(([, mau]) => viTri(html, mau));
    expect(viTriTang).toEqual([...viTriTang].sort((a, b) => a - b));
  });

  it('ba tầng đầu nằm trong <main>, chân trang là <footer> — ngữ nghĩa, không phải <div>', () => {
    const than = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
    expect(than).not.toBeNull();
    for (const lop of ['tang-soan', 'tang-khay', 'tang-luoi']) {
      expect(than[1]).toContain(lop);
    }
    const chan = /<footer\b([^>]*)>([\s\S]*?)<\/footer>/i.exec(html);
    expect(chan).not.toBeNull();
    expect(chan[1]).toContain('tang-chan');
    // Chân trang ở NGOÀI `<main>`: nó không phải nội dung chính, và nó không được cuộn
    // cùng lưới.
    expect(than[1]).not.toContain('tang-chan');
  });

  it('CSS không đảo lại thứ tự đó — không `order`, không `*-reverse`', () => {
    // Dòng "CSS không tải được" của I/O Matrix chỉ đúng nếu thứ tự DOM LÀ thứ tự đọc trong cả
    // hai trạng thái. Một `order: 2` hay một `flex-direction: column-reverse` làm trang có CSS
    // và trang không CSS đọc ra hai thứ tự khác nhau — và bàn phím đi một đường, mắt đi đường
    // khác ngay cả khi CSS tải bình thường.
    expect(css).not.toMatch(/(?<![-\w])order\s*:/);
    expect(css).not.toMatch(/-reverse\b/);
  });

  it('lưới rỗng thật — không nội dung mẫu nào bên trong (trạng thái rỗng là Story 2.6)', () => {
    const luoi = /<div class="luoi"\s*>([\s\S]*?)<\/div>/i.exec(html);
    expect(luoi).not.toBeNull();
    expect(luoi[1].trim()).toBe('');
  });
});

describe('Tầng lưới là vùng cuộn duy nhất', () => {
  it('chỉ `.tang-luoi` khai báo overflow cuộn được; `body` thì hidden', () => {
    const cuonDuoc = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      // Bắt cả `overflow-x`, cả dạng rút gọn hai giá trị (`overflow: hidden auto`) — một
      // vùng cuộn thứ hai lọt vào bằng đúng những cách đó.
      .filter(([, , than]) =>
        /overflow(-x|-y|-block|-inline)?\s*:[^;}]*\b(auto|scroll)\b/.test(than),
      )
      .map(([, chon]) => chon.trim());
    // `.o-soan` là vùng cuộn thứ hai và DUY NHẤT được phép (Story 2.2), vì nó có trần
    // `--composer-max-h`: một ô đã bị kẹp mà không cuộn được là một ô có chữ và con trỏ nằm ở
    // chỗ không ai tới được. Nó chỉ cuộn khi bản nháp dài hơn trần; tầng lưới vẫn là vùng
    // cuộn duy nhất của TRANG.
    expect([...cuonDuoc].sort()).toEqual(['.o-soan', '.tang-luoi']);
    expect(css).toMatch(/body\s*\{[^}]*overflow\s*:\s*hidden/);
  });

  it('`.tang-luoi` có đủ bộ ba flex:1 / min-block-size:0 / overflow-y:auto', () => {
    const khoi = /\.tang-luoi\s*\{([^}]*)\}/.exec(css);
    expect(khoi).not.toBeNull();
    expect(khoi[1]).toMatch(/flex\s*:\s*1\b/);
    // Thiếu `min-block-size: 0` thì flex item không co dưới kích thước nội dung và thanh
    // cuộn nhảy ra ngoài trang — đúng thứ AC cấm.
    expect(khoi[1]).toMatch(/min-(block-size|height)\s*:\s*0\b/);
    expect(khoi[1]).toMatch(/overflow-y\s*:\s*auto\b/);
  });
});

describe('Lưới: auto-fill bằng token, không một mốc nào', () => {
  it('grid-template-columns dùng repeat(auto-fill, minmax(var(--note-min-col), 1fr))', () => {
    expect(css).toMatch(
      /grid-template-columns\s*:\s*repeat\(\s*auto-fill\s*,\s*minmax\(\s*var\(--note-min-col\)\s*,\s*1fr\s*\)\s*\)/,
    );
  });

  it('khe lưới và lề trang đến từ token, không từ số', () => {
    expect(css).toMatch(/\.luoi\s*\{[^}]*\bgap\s*:\s*var\(--grid-gap\)/);
    expect(css).toMatch(/max-width\s*:\s*var\(--container-max\)/);
    expect(css).toMatch(/padding-inline\s*:\s*var\(--page-gutter\)/);
  });

  it('không một breakpoint nào — trần 3 cột là hệ quả số học của token', () => {
    // `@media` đã bị `token-style` cấm; ở đây chặn thêm mọi cách khác để lén một mốc vào.
    // `min-inline-size: 0` (để flex item co được) KHÔNG phải mốc — chỉ một chiều rộng có
    // đơn vị mới là mốc, nên mẫu đòi có đơn vị đi kèm.
    const mocs = [
      /@media\b/,
      /@container\b/,
      /\bmin-width\s*:\s*[\d.]+[a-z%]/i,
      /\bmin-inline-size\s*:\s*[\d.]+[a-z%]/i,
    ];
    for (const mau of mocs) {
      expect(css).not.toMatch(mau);
    }
    expect(html).not.toMatch(/@media\b/);
  });
});

describe('Hình dạng tĩnh của tầng 2 và tầng 4', () => {
  it('khay có nhãn tìm + ô từ khóa và nhãn ngày + ô ngày', () => {
    expect(html).toMatch(/<label[^>]*>\s*tìm\s*<\/label>/);
    expect(html).toMatch(/<label[^>]*>\s*ngày\s*<\/label>/);
    expect(html).toMatch(/<input[^>]*class="[^"]*\bo-tim\b/);
    expect(html).toMatch(/<input[^>]*class="[^"]*\bo-ngay\b/);
    // Nhãn phải thật sự nối với ô: `for` khớp `id`.
    for (const id of ['o-tim', 'o-ngay']) {
      expect(html).toMatch(new RegExp(`for="${id}"`));
      expect(html).toMatch(new RegExp(`id="${id}"`));
    }
  });

  it('icon lịch là SVG nội tuyến 16px, không url(...) và không tự khai màu nào', () => {
    const svg = /<svg\b[\s\S]*?<\/svg>/i.exec(html);
    expect(svg).not.toBeNull();
    expect(svg[0]).toMatch(/viewBox="0 0 16 16"/);
    expect(svg[0]).toMatch(/stroke="currentColor"/);
    expect(svg[0]).not.toMatch(/url\(/);
    expect(svg[0]).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    // Đúng MỘT icon trong toàn sản phẩm.
    expect(html.match(/<svg\b/gi)).toHaveLength(1);
    expect(css).not.toMatch(/url\(/);
  });

  it('chân trang có hai điều khiển dáng link và nút theme nhãn chữ, đẩy sang phải bằng lề', () => {
    // Dáng link nhưng NGỮ NGHĨA NÚT: `<a href="#">` đổi URL và đẩy một mục vào lịch sử ngay
    // khi bấm, trái AC "chúng là hình dạng, chưa có hành vi".
    for (const nhan of ['xuất sao lưu', 'nạp lại']) {
      expect(html).toMatch(
        new RegExp(`<button[^>]*class="[^"]*\\bchan-link\\b[^"]*"[^>]*>\\s*${nhan}\\s*</button>`),
      );
    }
    expect(html).not.toMatch(/<a\b/i);
    expect(html).toMatch(/<button[^>]*class="[^"]*\bnut-theme\b[^"]*"[^>]*>\s*nền tối\s*<\/button>/);
    expect(css).toMatch(/\.nut-theme\s*\{[^}]*margin-inline-start\s*:\s*auto/);
  });

  it('bo góc lấy đúng token của từng cấp vật chứa', () => {
    expect(css).toMatch(/\.khay\s*\{[^}]*border-radius\s*:\s*var\(--radius-tray\)/);
    expect(css).toMatch(/\.o-nhap\s*\{[^}]*border-radius\s*:\s*var\(--radius-input\)/);
    expect(css).toMatch(/\.nut-theme\s*\{[^}]*border-radius\s*:\s*var\(--radius-full\)/);
  });

  it('tầng 2 và tầng 4 chưa có hành vi: không script thứ hai, không handler nội tuyến', () => {
    const theScript = [...html.matchAll(/<script\b[^>]*>/gi)];
    // Đúng hai: script theme nội tuyến trong `<head>` và `app/main.js`.
    expect(theScript).toHaveLength(2);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
  });
});

describe('Bóng: đúng một cái, và nó là token', () => {
  // Story 2.1 chặn MỌI cái bóng vì cả hai cái bóng của DESIGN.md đều cần token mới. Story 2.2
  // mở đúng một cái — bóng lõm ô soạn thảo — nên cửa chặn hẹp lại chứ không biến mất: bóng
  // nhị mẩu giấy vẫn thuộc Story 2.5, và một giá trị bóng viết thẳng vẫn là một màu đi cửa sau.
  it('mọi box-shadow chỉ dùng var(--…), không một giá trị bóng viết thẳng nào', () => {
    const giaTri = [...css.matchAll(/box-shadow\s*:\s*([^;}]*)/g)].map((k) => k[1].trim());
    expect(giaTri.length).toBeGreaterThan(0);
    // Ring focus được phép đứng sau token bóng trong cùng một khai báo, nhưng màu của nó cũng
    // phải đến từ token — `color-mix` trên `var(--focus)`, không một hex nào.
    for (const v of giaTri) {
      expect(v).toMatch(/^var\(--shadow-inset\)/);
      expect(v).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/i);
    }
  });

  it('chỉ .o-soan mang bóng — mẩu giấy và khay thì không (Story 2.5, DESIGN.md)', () => {
    const chon = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, , than]) => /box-shadow\s*:/.test(than))
      .map(([, s]) => s.trim());
    // Sắp cả hai vế: thứ tự hai luật trong file không đổi một điểm ảnh nào, nên nó không được
    // là thứ làm ca này đỏ.
    expect(chon.sort()).toEqual(['.o-soan', '.o-soan:focus-visible'].sort());
  });

  it('không dùng drop-shadow hay text-shadow ở bất cứ đâu', () => {
    expect(css).not.toMatch(/\bfilter\s*:\s*drop-shadow/);
    expect(css).not.toMatch(/\btext-shadow\s*:/);
  });
});
