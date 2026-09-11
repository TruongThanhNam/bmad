// Ô soạn thảo nối vào store (Story 2.2) — phần nghiệm thu được mà không cần trình duyệt.
//
// Chia việc có ý thức, cùng quy ước với `bo-cuc-bon-tang.test.js`: những gì chỉ một layout
// engine trả lời được (min-height 92px thật, ô cao thêm mà trang vẫn không mọc thanh cuộn,
// bóng lõm thấy được ở cả hai theme, focus ring hiện ra) nằm ở `npm run thu-bo-cuc`. Ở đây là
// hai thứ khác, và cả hai đều là thứ vỡ trong im lặng:
//
//   (1) HÀNH VI nối store — "đúng một phép ghi sau AUTOSAVE_MS", "chữ đang gõ thắng kết quả
//       giành được", "quá trần thì không gọi cổng và không cắt một ký tự nào". Ba dòng đó của
//       I/O Matrix không nhìn thấy được bằng mắt, và chúng là lý do tồn tại của story.
//   (2) Phần VĂN BẢN: `autofocus` có mặt, microcopy đúng nguyên văn, `maxlength` KHÔNG có mặt,
//       và hai luật CSS của composer đi qua token. Một `maxlength="20000"` do người sau thêm
//       vào "cho chắc" là cắt chữ trong im lặng — đúng thứ AD-14/AD-17 cấm tuyệt đối, và
//       không ca hành vi nào bắt được nó.
//
// KHÔNG dùng jsdom, và đó là lựa chọn: `noiOSoan(store, goc)` nhận gốc DOM qua tham số, nên
// một gốc tối giản vài chục dòng ở đây đủ cho mọi ca — và nó không thêm một dependency nào
// vào một dự án cố ý không có dependency runtime nào.

import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MA_LOI } from '../app/core/errors.js';
import { AUTOSAVE_MS, MAX_NOTE_CHARS } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';
import { noiOSoan } from '../app/view/o-soan.js';
import { boChuThichCss, boChuThichHtml, boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const indexHtmlThoc = readFileSync(join(repoRoot, 'index.html'), 'utf8');
const indexHtml = boChuThichHtml(indexHtmlThoc);
const css = boChuThichCss(readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8'));

// ---------------------------------------------------------------------------
// Gốc DOM tối giản
// ---------------------------------------------------------------------------

/** Chiều cao một dòng của ô giả — chỉ cần một con số ổn định để `scrollHeight` có nghĩa. */
const CAO_DONG = 20;
/** Bề dày hai đường viền, để nghiệm thu rằng view CỘNG `offsetHeight - clientHeight`. */
const VIEN = 2;

/**
 * Một `<textarea>` giả vừa đủ cho `noiOSoan`: `value`, bộ nghe `input`, `style.blockSize`,
 * ba số đo chiều cao, và `setSelectionRange`.
 *
 * `scrollHeight` được TÍNH từ nội dung, và chỉ khi `blockSize` là `auto`: một ô đang bị ghim
 * chiều cao thì `scrollHeight` bằng đúng chiều cao đó. Đấy chính là cái bẫy mà view phải
 * tránh — thiếu bước đặt `auto` thì ô không bao giờ co lại — nên ô giả phải mô phỏng nó thật,
 * chứ không trả về một con số tử tế bất chấp.
 */
function oGia() {
  const boNghe = new Map();
  const boNgheCuaSo = new Map();
  const o = {
    value: '',
    // Cửa sổ lấy qua CHÍNH phần tử, nên gốc giả cung cấp được nó mà không cần một global nào.
    ownerDocument: {
      defaultView: {
        addEventListener(ten, ham) {
          boNgheCuaSo.set(ten, ham);
        },
      },
    },
    style: { blockSize: '' },
    chonTu: null,
    chonDen: null,
    soLanChon: 0,
    addEventListener(ten, ham) {
      boNghe.set(ten, ham);
    },
    setSelectionRange(tu, den) {
      o.chonTu = tu;
      o.chonDen = den;
      o.soLanChon += 1;
    },
    get scrollHeight() {
      if (o.style.blockSize !== 'auto') return Number.parseFloat(o.style.blockSize);
      // `soDongNgat` mô phỏng phép NGẮT DÒNG của một ô hẹp hơn: cùng một chuỗi, nhiều dòng hơn.
      return (o.soDongNgat ?? o.value.split('\n').length) * CAO_DONG;
    },
    get clientHeight() {
      return o.style.blockSize === 'auto' ? CAO_DONG : Number.parseFloat(o.style.blockSize) - VIEN;
    },
    get offsetHeight() {
      return o.clientHeight + VIEN;
    },
    /** Gõ một phím / dán một khối: đặt `value` rồi phát `input`, như trình duyệt làm. */
    go(chu) {
      o.value = chu;
      boNghe.get('input')();
    },
    coBoNgheInput() {
      return boNghe.has('input');
    },
    coBoNgheResize() {
      return boNgheCuaSo.has('resize');
    },
    /** Cửa sổ hẹp lại: cùng chữ ngắt thành nhiều dòng hơn. */
    doiBeRong(soDongMoi) {
      o.soDongNgat = soDongMoi;
      boNgheCuaSo.get('resize')();
    },
    soDongNgat: null,
  };
  return o;
}

/** Gốc DOM tối giản: đúng một phép tra theo selector. */
function gocGia(o, chon = '#o-soan') {
  return {
    querySelector(s) {
      return s === chon ? o : null;
    },
  };
}

// ---------------------------------------------------------------------------
// Cổng giả — store THẬT, không phải một store giả
// ---------------------------------------------------------------------------
//
// Dùng store thật là điều kiện, không phải sở thích: debounce, số đếm `seq` và luật "quá trần
// thì không gọi cổng" đều sống trong `state.js`. Một store giả ở đây sẽ nghiệm thu rằng view
// gọi đúng tên action — và đúng thứ cần nghiệm thu (một phép ghi, không phải mười) thì không.

/** Năm cổng đủ hình dạng, mọi phương thức ném khi BỊ GỌI. */
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

/**
 * Store thật, nối vào một kho giả ghi lại nhật ký và cho phép GIỮ LẠI lời hứa `claimDraft`.
 *
 * `giuClaim: true` là cách duy nhất dựng được dòng "gõ trong lúc claimDraft chưa trả lời":
 * lời hứa chỉ chốt khi ca test gọi `traClaim(...)`, nên thứ tự hai sự kiện là do test định,
 * không do bộ lập lịch của Node.
 */
function storeGia(tuyChon = {}) {
  const { chuTrongKho = '', giuClaim = false } = tuyChon;
  const nhatKy = [];
  let chotClaim = null;
  const ports = portsDay();
  ports.sessionStore = {
    ...ports.sessionStore,
    tabIdentity: () => 'tab-nay',
    writeTabIdentity: () => {},
  };
  ports.noteStore = {
    ...ports.noteStore,
    claimDraft(yeuCau) {
      nhatKy.push(`claimDraft:${yeuCau.tabId}`);
      const ketQua = { tabId: yeuCau.tabId, text: chuTrongKho };
      if (!giuClaim) return Promise.resolve(ketQua);
      return new Promise((chot) => {
        chotClaim = () => chot(ketQua);
      });
    },
    putDraft(draft) {
      nhatKy.push(`putDraft:${JSON.stringify(draft.text)}`);
      return Promise.resolve();
    },
  };
  return {
    store: taoStore(ports),
    nhatKy,
    traClaim: () => chotClaim(),
  };
}

/** Nhật ký chỉ gồm các phép GHI bản nháp — `claimDraft` không phải một phép ghi. */
function pheoGhi(nhatKy) {
  return nhatKy.filter((d) => d.startsWith('putDraft:'));
}

// ---------------------------------------------------------------------------
// Hành vi
// ---------------------------------------------------------------------------

describe('noiOSoan — mỗi phím gõ đi qua đúng một action', () => {
  it('gắn bộ nghe input, và ô rỗng lúc tải đã được đo một lần', () => {
    const o = oGia();
    const { store } = storeGia();
    noiOSoan(store, gocGia(o));
    expect(o.coBoNgheInput()).toBe(true);
    // Chiều cao inline đã có mặt trước phím đầu tiên — nếu không thì ô giật một nhịp ở đúng
    // ký tự đầu, từ chiều cao mặc định của trình duyệt xuống sàn của token.
    expect(o.style.blockSize).toBe(`${CAO_DONG + VIEN}px`);
  });

  it('không có ô trong DOM thì không ném, và dongBoTuState vẫn gọi được', () => {
    // `app/main.js` treo `dongBoTuState` vào một lời hứa không bao giờ bị từ chối; một view
    // ném ở đây sẽ thành một lời hứa bị từ chối mà không ai bắt.
    const { store } = storeGia();
    const oSoan = noiOSoan(store, gocGia(oGia(), '#khong-co'));
    expect(() => oSoan.dongBoTuState()).not.toThrow();
  });

  it('đo lại chiều cao khi cửa sổ đổi bề rộng — chữ ngắt dòng lại thì không bị kẹp mất', () => {
    const o = oGia();
    const { store } = storeGia();
    noiOSoan(store, gocGia(o));
    expect(o.coBoNgheResize()).toBe(true);

    o.go('một câu dài');
    expect(o.style.blockSize).toBe(`${CAO_DONG + VIEN}px`);
    // Cửa sổ hẹp lại: đúng chuỗi đó giờ chiếm ba dòng. Không đo lại thì hai dòng mọc thêm nằm
    // dưới đáy ô và `overflow-y` phải cuộn tới chúng — hoặc tệ hơn, chúng bị kẹp mất.
    o.doiBeRong(3);
    expect(o.style.blockSize).toBe(`${3 * CAO_DONG + VIEN}px`);
  });

  it('mỗi phím đổi state NGAY — gõ được là điều kiện, không phải một tối ưu', () => {
    const o = oGia();
    const { store } = storeGia();
    noiOSoan(store, gocGia(o));
    o.go('p');
    o.go('ph');
    o.go('phở');
    expect(store.state.draft.text).toBe('phở');
  });

  it('gõ một chuỗi rồi dừng tay: ĐÚNG MỘT phép ghi sau AUTOSAVE_MS, không một phép cho mỗi phím', async () => {
    vi.useFakeTimers();
    try {
      const o = oGia();
      const { store, nhatKy } = storeGia();
      noiOSoan(store, gocGia(o));
      await store.khoiDongBanNhap();

      for (const chu of ['p', 'ph', 'phở', 'phở ', 'phở bò']) {
        o.go(chu);
        await vi.advanceTimersByTimeAsync(1);
      }
      // Trước khi hẹn cuối nổ: chưa một phép ghi nào.
      expect(pheoGhi(nhatKy)).toEqual([]);
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
      expect(pheoGhi(nhatKy)).toEqual(['putDraft:"phở bò"']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('xóa hết chữ: bản nháp RỖNG được ghi xuống, và ô co lại (không chỉ cao lên được)', async () => {
    vi.useFakeTimers();
    try {
      const o = oGia();
      const { store, nhatKy } = storeGia();
      noiOSoan(store, gocGia(o));
      await store.khoiDongBanNhap();

      o.go('một\nhai\nba');
      const caoKhiDai = Number.parseFloat(o.style.blockSize);
      expect(caoKhiDai).toBe(3 * CAO_DONG + VIEN);

      o.go('');
      // Nửa vỡ nếu view đọc `scrollHeight` mà không đặt `block-size: auto` trước. Ghim ĐÚNG
      // sàn của ô giả, không chỉ "nhỏ hơn lúc dài": một hàm co về một con số sai vẫn nhỏ hơn.
      // Sàn THẬT (92px) là chuyện của CSS — `--composer-min-h` — và `npm run thu-bo-cuc` ghim nó.
      expect(o.style.blockSize).toBe(`${CAO_DONG + VIEN}px`);
      expect(CAO_DONG + VIEN).toBeLessThan(caoKhiDai);
      expect(store.state.draft.text).toBe('');

      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
      expect(pheoGhi(nhatKy)).toEqual(['putDraft:""']);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('dongBoTuState — bản nháp giành được, và cuộc đua với chữ đang gõ', () => {
  it('kho có chữ nhiều dòng: ô hiện lại NGUYÊN TRẠNG, con trỏ ở cuối', async () => {
    const o = oGia();
    const chu = 'phở bò\n\nthêm hành\n';
    const { store } = storeGia({ chuTrongKho: chu });
    const oSoan = noiOSoan(store, gocGia(o));
    await store.khoiDongBanNhap();
    oSoan.dongBoTuState();

    expect(o.value).toBe(chu);
    expect([o.chonTu, o.chonDen]).toEqual([chu.length, chu.length]);
    // Ô đã cao theo chữ vừa nhận, không chờ phím đầu tiên mới đo lại.
    expect(o.style.blockSize).toBe(`${chu.split('\n').length * CAO_DONG + VIEN}px`);
  });

  it('kho rỗng: ô vẫn trống và không một chữ nào hiện ra', async () => {
    const o = oGia();
    const { store } = storeGia();
    const oSoan = noiOSoan(store, gocGia(o));
    await store.khoiDongBanNhap();
    oSoan.dongBoTuState();
    expect(o.value).toBe('');
  });

  it('gõ TRONG LÚC claimDraft chưa trả lời: chữ đang gõ THẮNG, ô không bị đè', async () => {
    const o = oGia();
    const { store, traClaim } = storeGia({ chuTrongKho: 'chữ cũ trong kho', giuClaim: true });
    const oSoan = noiOSoan(store, gocGia(o));

    const loiHua = store.khoiDongBanNhap().then(oSoan.dongBoTuState);
    // Nam gõ trước khi kho trả lời — `draft.seq` nhảy.
    o.go('chữ Nam đang gõ');
    traClaim();
    await loiHua;

    expect(store.state.draft.text).toBe('chữ Nam đang gõ');
    expect(o.value).toBe('chữ Nam đang gõ');
  });

  it('state khớp ô thì KHÔNG đặt lại value — con trỏ không bị đẩy về cuối giữa lúc gõ', async () => {
    const o = oGia();
    const { store } = storeGia({ chuTrongKho: 'phở bò' });
    const oSoan = noiOSoan(store, gocGia(o));
    await store.khoiDongBanNhap();
    oSoan.dongBoTuState();
    expect(o.soLanChon).toBe(1);
    // Lần thứ hai không đổi gì: không một phép đặt con trỏ nào nữa.
    oSoan.dongBoTuState();
    expect(o.soLanChon).toBe(1);
  });
});

describe('Quá trần ký tự: chữ vẫn nguyên, cổng không bị gọi (AD-14, AD-17)', () => {
  it('dán chữ dài hơn MAX_NOTE_CHARS: không một ký tự nào bị cắt, không phép ghi nào', async () => {
    vi.useFakeTimers();
    try {
      const o = oGia();
      const { store, nhatKy } = storeGia();
      noiOSoan(store, gocGia(o));
      await store.khoiDongBanNhap();

      const qua = 'a'.repeat(MAX_NOTE_CHARS + 1);
      o.go(qua);
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);

      // Chữ nằm nguyên ở CẢ HAI chỗ: trong state và trong ô.
      expect(store.state.draft.text).toHaveLength(MAX_NOTE_CHARS + 1);
      expect(o.value).toHaveLength(MAX_NOTE_CHARS + 1);
      // Cổng không bị gọi — trần chặn ở tầng action, không bằng cách cắt chữ.
      expect(pheoGhi(nhatKy)).toEqual([]);
      // Dải băng dừng ở state: story này chưa có chỗ nói (suy giảm có ý thức).
      expect(store.state.banner).toBe(MA_LOI.TOO_LONG);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// Phần văn bản — cái không đo được bằng hành vi
// ---------------------------------------------------------------------------

describe('index.html — con trỏ sẵn, microcopy ghim, và KHÔNG maxlength', () => {
  const theO = /<textarea\b[^>]*>/i.exec(indexHtml);

  it('có đúng một <textarea>, mang autofocus và một id để view tìm', () => {
    expect(theO).not.toBeNull();
    expect(indexHtml.match(/<textarea\b/gi)).toHaveLength(1);
    // `autofocus` là thuộc tính HTML, không phải một lời gọi JS: dòng "CSS hoặc JS không tải
    // được" của I/O Matrix đòi con trỏ vẫn nằm sẵn trong ô.
    expect(theO[0]).toMatch(/\bautofocus\b/);
    expect(theO[0]).toMatch(/\bid\s*=\s*"o-soan"/);
  });

  it('KHÔNG maxlength ở bất cứ đâu — cắt chữ trong im lặng bị cấm tuyệt đối', () => {
    // Quét bản THÔ, kể cả chú thích: một `maxlength` đã bị comment vẫn là mẫu người sau copy.
    expect(indexHtmlThoc).not.toMatch(/\bmaxlength\b\s*=/i);
  });

  it('KHÔNG rows — chiều cao đến từ token, không từ một con số đếm dòng', () => {
    expect(theO[0]).not.toMatch(/\brows\s*=/i);
  });

  it('placeholder trống hoàn toàn: con trỏ nháy là tín hiệu duy nhất', () => {
    expect(theO[0]).not.toMatch(/\bplaceholder\s*=/i);
  });

  it('đúng một dòng nhắc, NGUYÊN VĂN microcopy của EXPERIENCE.md', () => {
    expect(indexHtml).toMatch(
      /<p class="o-soan-nhac" id="o-soan-nhac"\s*>\s*Ctrl\+Enter để chốt\s*<\/p>/,
    );
  });

  it('dòng nhắc được NỐI vào ô bằng aria-describedby', () => {
    // Placeholder để trống là một quyết định có chủ ý, nên dòng nhắc là chỉ dẫn DUY NHẤT của
    // sản phẩm. Không nối thì trình đọc màn hình đọc ô lên mà không bao giờ đọc nó — và cái
    // giá của placeholder trống không được trả bằng một người dùng không thấy chỉ dẫn nào.
    expect(theO[0]).toMatch(/\baria-describedby\s*=\s*"o-soan-nhac"/);
    expect(indexHtml).toMatch(/\bid="o-soan-nhac"/);
  });

  it('không nút "Lưu", không chữ "đã lưu", không dấu hiệu "chưa chốt", không đếm ký tự', () => {
    // AC nói "tìm thì không có" — nên nó là một phép tìm, trên bản thô.
    for (const mau of [/\bLưu\b/, /đã lưu/i, /chưa chốt/i, /ký tự/i, /\d+\s*\/\s*\d+/]) {
      expect(indexHtmlThoc.replace(/<!--[\s\S]*?-->/g, '')).not.toMatch(mau);
    }
  });
});

describe('app/style.css — vật liệu của composer đi qua token', () => {
  const khoi = /\.o-soan\s*\{([^}]*)\}/.exec(css);

  it('min-height và bóng lõm đều là var(--…), không một con số hay màu trần nào', () => {
    expect(khoi).not.toBeNull();
    expect(khoi[1]).toMatch(/min-block-size\s*:\s*var\(--composer-min-h\)/);
    expect(khoi[1]).toMatch(/box-shadow\s*:\s*var\(--shadow-inset\)/);
  });

  it('padding đúng DESIGN.md: --space-3 --space-4, không phải cặp 8/12 của mẩu giấy', () => {
    expect(khoi[1]).toMatch(/padding\s*:\s*var\(--space-3\)\s+var\(--space-4\)/);
  });

  it('ô tự cao có TRẦN, và chạm trần thì chính ô cuộn', () => {
    expect(khoi[1]).toMatch(/resize\s*:\s*none/);
    // Không trần thì một bản nháp vài chục dòng ép lưới về 0 và đẩy chân trang ra khỏi khung
    // nhìn VĨNH VIỄN (`.tang` là `flex: none`, `body` là `overflow: hidden`).
    expect(khoi[1]).toMatch(/max-block-size\s*:\s*var\(--composer-max-h\)/);
    // Và đã có trần thì `hidden` là sai: chữ cùng con trỏ dưới đáy ô sẽ không ai tới được.
    expect(khoi[1]).toMatch(/overflow-y\s*:\s*auto/);
  });

  it('focus có viền --focus cộng ring, và không một chỗ nào tắt focus ring', () => {
    const focus = /\.o-soan:focus-visible\s*\{([^}]*)\}/.exec(css);
    expect(focus).not.toBeNull();
    expect(focus[1]).toMatch(/border-color\s*:\s*var\(--focus\)/);
    expect(focus[1]).toMatch(/color-mix\([^)]*var\(--focus\)/);
    expect(css).not.toMatch(/outline(-style|-width)?\s*:\s*(none|0)\b/i);
  });

  it('dòng nhắc dùng --font-foot và --ink-2, đúng DESIGN.md', () => {
    const nhac = /\.o-soan-nhac\s*\{([^}]*)\}/.exec(css);
    expect(nhac).not.toBeNull();
    expect(nhac[1]).toMatch(/font\s*:\s*var\(--font-foot\)/);
    expect(nhac[1]).toMatch(/color\s*:\s*var\(--ink-2\)/);
  });
});

describe('app/view/o-soan.js — luật của tầng view, cưỡng chế được', () => {
  // Bỏ chú thích trước khi quét, cùng lý do với mọi bộ quét khác trong `test/`: chính chú
  // thích của tệp đó nói ra những điều bị cấm ("không bao giờ import `app/adapters/`", "không
  // được dựng một hàng subscribe"), và một chú thích không phải mã.
  const nguon = boChuThichJs(readFileSync(join(repoRoot, 'app', 'view', 'o-soan.js'), 'utf8'));

  it('không import app/adapters/, không new Date, không tự gọi cổng', () => {
    expect(nguon).not.toMatch(/adapters\//);
    expect(nguon).not.toMatch(/new\s+Date\b/);
    expect(nguon).not.toMatch(/\bports\b/);
  });

  it('app/main.js nối view TRƯỚC khi giành bản nháp, và treo dongBoTuState vào lời hứa đó', () => {
    // Cả hai nửa của phần nối này vỡ trong IM LẶNG: bỏ `.then(...)` thì bản nháp nhận lại được
    // không bao giờ ra tới ô, và nối view SAU `khoiDongBanNhap()` thì mọi ký tự gõ trong lúc
    // kho còn đang trả lời rơi xuống đất. Không ca nào khác — kể cả `thu-bo-cuc` và `thu-tay`
    // — nhìn thấy hai cái sai đó, vì cả hai đo một trang đã tải xong từ lâu.
    const main = boChuThichJs(readFileSync(join(repoRoot, 'app', 'main.js'), 'utf8'));
    const viTriView = main.search(/noiOSoan\s*\(/);
    const viTriGianh = main.search(/store\s*\.\s*khoiDongBanNhap\s*\(/);
    expect(viTriView).toBeGreaterThan(-1);
    expect(viTriGianh).toBeGreaterThan(-1);
    expect(viTriView).toBeLessThan(viTriGianh);
    expect(main).toMatch(/khoiDongBanNhap\s*\(\s*\)\s*\.\s*then\s*\(\s*[\w$]+\s*\.\s*dongBoTuState/);
  });

  it('đổi state đi qua đúng MỘT action, và không có cơ chế subscribe nào', () => {
    const goiStore = [...nguon.matchAll(/store\s*\.\s*([\w$]+)/g)].map((k) => k[1]);
    expect([...new Set(goiStore)].sort()).toEqual(['datBanNhap', 'state']);
    expect(nguon).not.toMatch(/subscribe|onChange|theoDoi/i);
  });
});
