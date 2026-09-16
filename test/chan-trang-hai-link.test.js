// Hai link thường trực ở chân trang (Story 4.1) — phần kiểm được bằng cách quét văn bản.
//
// Vì sao ba cam kết này đáng một tệp riêng chứ không nằm nhờ trong `bo-cuc-bon-tang.test.js`:
// ca ở đó hỏi "chân trang có ĐÚNG HÌNH DẠNG này không" (Story 2.1), còn ở đây hỏi một câu
// khác hẳn — "hai link có BAO GIỜ biến mất không". Chúng là lối thoát duy nhất khỏi kịch bản
// `Clear browsing data`, và đúng lúc rủi ro cao nhất — máy mới, app rỗng tuyệt đối, dòng nhắc
// chưa có gì để nói — cũng là lúc dễ nhất để ai đó "dọn cho gọn" bằng một điều kiện hiển thị.
//
// Giới hạn đã biết của cách kiểm này: nó quét NGUỒN TĨNH, nên nó chứng minh được "không ai
// viết chỗ nào giấu hai link đi", chứ không chứng minh được "trình duyệt thật vẽ chúng ra".
// Phần sau thuộc về `npm run thu-bo-cuc` — bộ thu đó ĐÃ khóa hai `button.chan-link` trong thứ
// tự tab thật và đã kiểm chúng sống sót ở các bề rộng. Cái nó CHƯA đo là khoảng `gap` ma của
// chỗ đứng dòng nhắc lúc rỗng; điều đó chỉ thành đo được khi Story 4.4 có chữ để so hai cảnh.

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThichCss, boChuThichHtml, boChuThichJs } from './helpers/quet-nguon.js';
import { noiChanTrang } from '../app/view/chan-trang.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const html = boChuThichHtml(readFileSync(join(repoRoot, 'index.html'), 'utf8'));
const css = boChuThichCss(readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8'));

/**
 * Phần bên trong `<footer class="tang tang-chan">`, đã bỏ chú thích. Cắt hỏng thì trả `''`
 * chứ không ném: một `expect` ném ở tầng module làm cả TỆP đỏ thành lỗi thu thập không tên,
 * trong khi cửa chặn ngay dưới đây nói đúng một câu dễ đọc về chuyện gì đã hỏng.
 */
const chanTrang = (() => {
  const mo = html.search(/<footer[^>]*\btang-chan\b/);
  if (mo < 0) return '';
  const dong = html.indexOf('</footer>', mo);
  return dong < 0 ? '' : html.slice(mo, dong);
})();

/** Ba vật chứa duy nhất bọc hai link — ẩn một trong số chúng là ẩn cả hai link. */
const TO_BOC = ['.tang-chan', '.chan', 'footer', 'body'];

/** Những cách làm một phần tử biến mất mà vẫn trông như một lần "dọn cho gọn". */
const CACH_AN = [
  /display\s*:\s*none/,
  /visibility\s*:\s*hidden/,
  /content-visibility\s*:\s*hidden/,
  /opacity\s*:\s*0(?![.\d%])/,
  /font-size\s*:\s*0(?![.\d])/,
  /clip-path\s*:/,
  /transform\s*:\s*scale\(\s*0\s*\)/,
  /(?:width|height)\s*:\s*0(?![.\d])/,
];

/**
 * Một selector thành mẫu khớp CHÍNH nó. `(?![\w-])` chứ không `\b`: `\b` coi `-` là ranh giới
 * từ, nên `\.chan\b` khớp luôn `.chan-nhac` — và khi đó luật `:empty` hợp lệ của chỗ đứng bị
 * đọc thành một lần ẩn hai link. Chỉ dấu `.` cần thoát; `footer`/`body` là chữ thuần.
 */
function thanhMau(chon) {
  return `${chon.replace(/^\./, '\\.')}(?![\\w-])`;
}

/** Mọi khối CSS có selector khớp `mau`, trả về `[selector, thân]`. */
function cacKhoiChamToi(mau) {
  return [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)]
    .map(([, chon, than]) => [chon.trim(), than])
    .filter(([chon]) => mau.test(chon));
}

describe('cửa chặn của chính bộ quét', () => {
  it('cắt được phần chân trang ra khỏi index.html', () => {
    expect(chanTrang).not.toBe('');
    expect(chanTrang).toMatch(/\bchan\b/);
  });
});

describe('Hai link không bao giờ ẩn (UX-DR-19)', () => {
  it('cả hai nằm trong DOM TĨNH — không module nào phải chạy thì chúng mới có', () => {
    // Trên máy mới, `app/main.js` có thể chưa kịp chạy, hoặc hỏng. Hai link vẫn phải ở đó.
    for (const nhan of ['xuất sao lưu', 'nạp lại']) {
      expect(chanTrang).toMatch(
        new RegExp(`<button[^>]*class="[^"]*\\bchan-link\\b[^"]*"[^>]*>\\s*${nhan}\\s*</button>`),
      );
    }
  });

  it('không một thuộc tính nào giấu chúng đi ở dạng tĩnh', () => {
    const the = [...chanTrang.matchAll(/<button[^>]*\bchan-link\b[^>]*>/g)].map((k) => k[0]);
    expect(the).toHaveLength(2);
    for (const t of the) {
      expect(t).not.toMatch(/\bhidden\b/);
      expect(t).not.toMatch(/aria-hidden/);
      expect(t).not.toMatch(/\bstyle\s*=/);
      expect(t).not.toMatch(/\bdisabled\b/);
    }
  });

  it('không luật CSS nào tắt hai link — kể cả qua một vật chứa bọc ngoài', () => {
    // Ẩn hai link gần như không bao giờ xảy ra bằng `.chan-link { display: none }`; nó xảy ra
    // bằng `.chan` hay `.tang-chan`. Và không chỉ bằng `display`: `opacity: 0`, `font-size: 0`,
    // `clip-path`, `scale(0)`, `width: 0` đều để lại hai link không đọc được mà vẫn "có".
    const mau = new RegExp(['.chan-link', ...TO_BOC].map(thanhMau).join('|'));
    const viPham = [];
    for (const [chon, than] of cacKhoiChamToi(mau)) {
      for (const cach of CACH_AN) if (cach.test(than)) viPham.push(`${chon} — ${cach.source}`);
    }
    expect(viPham).toEqual([]);
  });

  it('cả hai link có hành vi, và CHỈ `chan-trang.js` cầm tới chúng — không ai sinh/diệt', () => {
    // RENEGOTIATE CÓ GHI CHÉP LẦN HAI (Story 4.3) — vế (b) trước đây đọc "chiều NẠP chưa tồn
    // tại: không view nào cầm tới `#chan-nap`", và chú thích của chính nó đã báo trước rằng
    // 4.3 sẽ phải đàm phán lại. Lý do đổi: 4.3 nối hành vi NẠP, nên "không ai cầm tới" không
    // còn là một bất biến thật — y hệt điều đã xảy ra với vế xuất ở 4.2.
    //
    // Cái bất biến THẬT thì vẫn không đổi một chữ, và ba vế dưới đây giữ đúng nó:
    //
    //   (a) không module nào cầm tới hai link bằng CLASS hay bằng NHÃN — chỉ bằng `id`. Một
    //       `querySelectorAll('.chan-link')[0]` gắn hành vi xuất vào nút nạp ở ngày ai đó đảo
    //       thứ tự, và một bộ chọn theo nhãn gãy ở ngày đổi microcopy.
    //   (b) ĐÚNG MỘT view cầm tới `#chan-nap`, và đó là `chan-trang.js`. Một handler nạp thứ
    //       hai ở một view khác là một cửa thứ hai cho phép gộp dễ sai nhất của ứng dụng.
    //   (c) không view nào ẩn/hiện hai link — không `hidden`, không `display`, không `remove`.
    expect(chanTrang).not.toMatch(/\son[a-z]+\s*=/i);
    const viPham = [];
    for (const ten of readdirSync(join(repoRoot, 'app', 'view')).filter((t) => t.endsWith('.js'))) {
      const ma = boChuThichJs(readFileSync(join(repoRoot, 'app', 'view', ten), 'utf8'));
      const nhan = `app/view/${ten}`;
      if (/chan-link|chan-nhac|xuất sao lưu|nạp lại/.test(ma)) viPham.push(`${nhan} — (a)`);
      if (/chan-nap/.test(ma) && ten !== 'chan-trang.js') viPham.push(`${nhan} — (b)`);
      // (c) hỏi về HAI LINK, không về mọi phép gỡ nút: `view/banner.js` gỡ nút `✕` của chính
      // nó ở mỗi lượt vẽ, và một ca chân trang không được đỏ vì chuyện đó. Nên chỉ những module
      // CÓ cầm tới chân trang mới bị soi — tức `chan-trang.js`, và bất cứ module nào sau này
      // cầm tới nó.
      const camChanTrang = /chan-xuat|chan-nap|chan-link|chan-nhac/.test(ma);
      if (camChanTrang && /\.hidden\b|style\.display|\.remove\(\)|removeChild/.test(ma)) {
        viPham.push(`${nhan} — (c)`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('hai link mang `id`, và `app/view/chan-trang.js` chọn `#chan-xuat` bằng đúng `id` đó', () => {
    expect(chanTrang).toMatch(/<button[^>]*id="chan-xuat"[^>]*>\s*xuất sao lưu\s*<\/button>/);
    expect(chanTrang).toMatch(/<button[^>]*id="chan-nap"[^>]*>\s*nạp lại\s*<\/button>/);
    const ma = boChuThichJs(readFileSync(join(repoRoot, 'app', 'view', 'chan-trang.js'), 'utf8'));
    expect(ma).toMatch(/#chan-xuat/);
    expect(ma).toMatch(/store\.xuatSaoLuu\(\)/);
    // Và chiều nạp, cũng bằng đúng `id` của nó (Story 4.3).
    expect(ma).toMatch(/#chan-nap/);
    expect(ma).toMatch(/store\.napSaoLuu\(\)/);
  });
});

describe('Hành vi của `#chan-xuat`: một cú bấm, một action, không một lượt vẽ nào', () => {
  /** DOM tối giản, cùng khuôn `tailieuGia` của `theme.test.js` — `noiChanTrang` nhận nó qua tham số. */
  function taiLieuGia(coNut = true) {
    const nut = { boNghe: {}, addEventListener(ten, ham) { this.boNghe[ten] = ham; } };
    return {
      nut,
      doc: { querySelector: (chon) => (coNut && chon === '#chan-xuat' ? nut : null) },
    };
  }

  it('bấm gọi `store.xuatSaoLuu()` đúng một lần, và không action nào khác', () => {
    const goi = [];
    const store = {
      xuatSaoLuu: () => {
        goi.push('xuat');
        return Promise.resolve();
      },
      napSaoLuu: () => {
        goi.push('nap');
        return Promise.resolve();
      },
    };
    const { nut, doc } = taiLieuGia();
    const view = noiChanTrang(store, doc);
    nut.boNghe.click();
    expect(goi).toEqual(['xuat']);
    // `ve()` tồn tại và không làm gì: chân trang chưa vẽ từ state nào ở story này, nhưng
    // `veTatCa()` của `app/main.js` gọi `ve` của mọi view.
    expect(() => view.ve()).not.toThrow();
  });

  it('không có link thì `ve` vẫn gọi được — cùng khuôn trả sớm của `noiNutTheme`', () => {
    const { doc } = taiLieuGia(false);
    expect(() => noiChanTrang({}, doc).ve()).not.toThrow();
    expect(() => noiChanTrang({}, null).ve()).not.toThrow();
  });
});

describe('Hành vi của `#chan-nap`: một action, rồi MỘT lượt vẽ lại (Story 4.3)', () => {
  /** Hai nút, mỗi cái sau một `id` riêng — đúng cách `chan-trang.js` tìm chúng. */
  function taiLieuHaiNut() {
    const nut = () => ({
      boNghe: {},
      addEventListener(ten, ham) {
        this.boNghe[ten] = ham;
      },
    });
    const xuat = nut();
    const nap = nut();
    const theo = { '#chan-xuat': xuat, '#chan-nap': nap };
    return { xuat, nap, doc: { querySelector: (chon) => theo[chon] ?? null } };
  }

  it('bấm gọi `store.napSaoLuu()` rồi vẽ lại — khác hẳn nút xuất, và có lý do', async () => {
    // Nạp đổi `notes` VÀ đổi dải băng; xuất không đổi một trường state nào. Đây là khác biệt
    // thật giữa hai link, không phải một chỗ viết thiếu ở một trong hai.
    const goi = [];
    const store = {
      napSaoLuu: () => {
        goi.push('nap');
        return Promise.resolve();
      },
      xuatSaoLuu: () => {
        goi.push('xuat');
        return Promise.resolve();
      },
    };
    const { nap, doc } = taiLieuHaiNut();
    noiChanTrang(store, doc, () => goi.push('ve'));
    nap.boNghe.click();
    // Vẽ lại đi SAU lời hứa: mọi thứ đáng vẽ nằm sau phép đọc file và phép ghi kho.
    expect(goi).toEqual(['nap']);
    await Promise.resolve();
    await Promise.resolve();
    expect(goi).toEqual(['nap', 've']);
  });

  it('bấm nút xuất KHÔNG kéo theo lượt vẽ nào — im lặng tuyệt đối vẫn đứng', async () => {
    const goi = [];
    const store = {
      napSaoLuu: () => Promise.resolve(),
      xuatSaoLuu: () => {
        goi.push('xuat');
        return Promise.resolve();
      },
    };
    const { xuat, doc } = taiLieuHaiNut();
    noiChanTrang(store, doc, () => goi.push('ve'));
    xuat.boNghe.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(goi).toEqual(['xuat']);
  });

  it('không có móc vẽ lại thì vẫn không ném — mặc định là một hàm rỗng', async () => {
    const { nap, doc } = taiLieuHaiNut();
    noiChanTrang({ napSaoLuu: () => Promise.resolve(), xuatSaoLuu() {} }, doc);
    expect(() => nap.boNghe.click()).not.toThrow();
    await Promise.resolve();
  });
});

describe('Điểm nối ở `app/main.js` — nửa vỡ trong im lặng của cả đường xuất', () => {
  // Hai dòng dưới đây bị xóa đi thì MỌI ca trên vẫn xanh và nút xuất chết hẳn: view không được
  // nối vào tài liệu thật, hay cổng `fileIO` rơi về stub `congTam()` ném "chưa nối adapter" —
  // mà `xuatSaoLuu` nuốt đúng cái ném đó trong im lặng. Cùng khuôn quét nguồn với ca
  // `app/main.js nối dải băng vào CÙNG lượt vẽ chung` của `banner.test.js`.
  const main = boChuThichJs(readFileSync(join(repoRoot, 'app', 'main.js'), 'utf8'));

  it('gọi `noiChanTrang(store, …)` với tài liệu thật VÀ móc vẽ lại của chiều nạp', () => {
    // Tham số thứ ba là Story 4.3: nạp đổi `notes` và đổi dải băng, nên lượt vẽ chung phải
    // xuống được tới đây. Bắt luôn thân của móc đó, cùng khuôn quét `dongRoiVe` của
    // `banner.test.js` — treo một hàm rỗng vào đó thì mọi ca trên vẫn xanh và lưới đứng im.
    const noi = /noiChanTrang\s*\(\s*store\s*,\s*document\s*,\s*([\w$]+)\s*\)/.exec(main);
    expect(noi).not.toBeNull();
    expect(main).toMatch(new RegExp(`\\b${noi[1]}\\s*=\\s*\\(\\s*\\)\\s*=>\\s*veTatCa\\s*\\(`));
    expect(main).toMatch(/import\s*\{[^}]*\bnoiChanTrang\b[^}]*\}\s*from\s*'\.\/view\/chan-trang\.js'/);
  });

  it('cổng `fileIO` là ADAPTER THẬT, không còn là stub `congTam()`', async () => {
    // RENEGOTIATE CÓ GHI CHÉP (Story 4.3) — ca này trước đây phân biệt hai bên bằng CHÍNH câu
    // chúng ném: stub nói "chưa nối adapter", adapter nói "chưa làm — Story 4.3". Vế sau chết
    // đúng ở story này, vì `readChosenFile` bây giờ có thân thật. Câu hỏi thì không đổi: cổng
    // `fileIO` của `main.js` có phải adapter thật không.
    //
    // Chỗ phân biệt mới: stub NÉM đồng bộ với mọi phương thức, còn adapter thật thì không —
    // nó trả về một lời hứa, và ở Node nó chỉ hỏng vì `document` vắng mặt, tức một lời hứa bị
    // TỪ CHỐI. Hai hình dạng đó không thể nhầm với nhau.
    const { congTam } = await import('../app/main.js');
    const thatSu = await import('../app/adapters/file-io.js');
    expect(() => congTam().fileIO.readChosenFile()).toThrow(/chưa nối adapter/);
    const daGoi = thatSu.taoFileIo().readChosenFile();
    expect(daGoi).toBeInstanceOf(Promise);
    // Không có `document` ở Node: `throw` đồng bộ trong executor thành một lời hứa bị từ chối,
    // đúng cửa mà nhánh dải băng của `napSaoLuu` đang chờ — không phải một lời hứa treo mãi.
    await expect(daGoi).rejects.toThrow();
    expect(main).toMatch(/fileIO\s*:\s*taoFileIo\s*\(\s*\)/);
    expect(main).toMatch(/import\s*\{[^}]*\btaoFileIo\b[^}]*\}\s*from\s*'\.\/adapters\/file-io\.js'/);
  });
});

describe('Chỗ đứng của dòng nhắc: cùng dòng, và không chiếm chỗ khi rỗng', () => {
  it('tồn tại, rỗng nguyên ở dạng tĩnh, và nằm CÙNG DÒNG với hai link', () => {
    expect(chanTrang).toMatch(/<span class="chan-nhac"><\/span>/);
    // Cùng dòng nghĩa là cùng một flex container `.chan` với hai link, không phải một tầng
    // mới: nó phải nằm giữa `nạp lại` và nút theme, trong cùng khối đó.
    const viNap = chanTrang.indexOf('nạp lại');
    const viNhac = chanTrang.search(/\bchan-nhac\b/);
    const viTheme = chanTrang.search(/\bnut-theme\b/);
    expect(viNap).toBeGreaterThan(-1);
    expect(viNhac).toBeGreaterThan(viNap);
    expect(viTheme).toBeGreaterThan(viNhac);
  });

  it('rỗng thì ra khỏi luồng — không sinh một khoảng `gap` ma nào', () => {
    expect(css).toMatch(/\.chan-nhac:empty\s*\{[^}]*display\s*:\s*none/);
  });

  it('nó là CHỮ, không phải điều khiển: không tabindex, không role, không aria-live', () => {
    const the = /<span[^>]*\bchan-nhac\b[^>]*>/.exec(chanTrang)?.[0] ?? '';
    expect(the).not.toBe('');
    expect(the).not.toMatch(/tabindex/);
    expect(the).not.toMatch(/\brole\s*=/);
    expect(the).not.toMatch(/aria-live/);
    // Cùng bộ kiểm với hai link: chỗ đứng cũng không được mang sẵn thứ gì giấu nó đi — một
    // `hidden` tĩnh ở đây làm Story 4.4 vẽ chữ vào một phần tử không bao giờ hiện.
    expect(the).not.toMatch(/\bhidden\b/);
    expect(the).not.toMatch(/aria-hidden/);
    expect(the).not.toMatch(/\bstyle\s*=/);
  });

  it('`:empty` là luật DUY NHẤT tắt chỗ đứng — không ai tắt nó vô điều kiện', () => {
    // Một `.chan-nhac { display: none }` về sau giết Story 4.4 trong im lặng: dòng nhắc vẫn
    // được ghi vào DOM, vẫn đúng mọi test của 4.4, và vẫn không ai nhìn thấy nó.
    const viPham = cacKhoiChamToi(/\.chan-nhac\b/)
      .filter(([chon]) => !/:empty\b/.test(chon))
      .filter(([, than]) => CACH_AN.some((cach) => cach.test(than)))
      .map(([chon]) => chon);
    expect(viPham).toEqual([]);
  });

  it('dùng đúng `{typography.foot}` và `{colors.ink-2}` như hai link bên cạnh', () => {
    expect(css).toMatch(/\.chan-nhac\s*\{[^}]*color\s*:\s*var\(--ink-2\)/);
    expect(css).toMatch(/\.chan-nhac\s*\{[^}]*font\s*:\s*var\(--font-foot\)/);
  });
});

describe('Hai link đứng độc lập với dòng nhắc, và giữ nguyên thứ tự tab', () => {
  it('nút theme vẫn bị đẩy phải bằng lề, không bằng phần tử đệm', () => {
    // Chỗ đứng mới xen vào giữa `nạp lại` và nút theme, nên cách đẩy phải là thứ dễ vỡ nhất.
    expect(css).toMatch(/\.nut-theme\s*\{[^}]*margin-inline-start\s*:\s*auto/);
  });

  it('thứ tự tab ở chân trang: xuất sao lưu → nạp lại → nút theme', () => {
    const viXuat = chanTrang.indexOf('xuất sao lưu');
    const viNap = chanTrang.indexOf('nạp lại');
    const viTheme = chanTrang.search(/\bnut-theme\b/);
    expect(viXuat).toBeGreaterThan(-1);
    expect(viNap).toBeGreaterThan(viXuat);
    expect(viTheme).toBeGreaterThan(viNap);
    // Thứ tự DOM LÀ thứ tự tab — cửa (a) của `focus-va-tab.test.js` giữ điều đó cho cả trang;
    // ở đây chỉ ghim thêm rằng chân trang không mọc một điểm dừng nào ngoài ba cái này.
    const diemDung = [...chanTrang.matchAll(/<(?:button|a|input|select|textarea|summary)\b/gi)];
    expect(diemDung).toHaveLength(3);
    // Đếm thẻ thôi thì bỏ lọt đúng cái dễ xảy ra nhất: một `tabindex="0"` gắn lên chỗ đứng
    // dòng nhắc, hay một `contenteditable` — cả hai đều là điểm dừng mà không là thẻ nào ở trên.
    expect(chanTrang).not.toMatch(/\btabindex\s*=/i);
    expect(chanTrang).not.toMatch(/\bcontenteditable\b/i);
  });
});
