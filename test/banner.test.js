// Dải băng thông báo (Story 3.1) — bảng bảy nguồn, phép gác ưu tiên, và lượt vẽ.
//
// Bốn nhóm, và mỗi nhóm canh một thứ vỡ trong IM LẶNG:
//
//   (1) BẢNG. Bốn trong bảy nguồn chưa có người phát ở story này, nên không một ca hành vi nào
//       chạm tới chúng — bảng vì thế phải được nghiệm thu TRÊN CHÍNH NÓ: đủ bảy hàng, đúng thứ
//       tự AD-17, đúng cờ đóng-được, không hàng thứ tám.
//   (2) PHÉP GÁC, hàm thuần: mọi cặp ưu tiên, không chỉ cặp mà AC nêu tên.
//   (3) PHÉP GÁC ở tầng GHI: nó là bất biến của `datLai`, nên nó phải đúng khi đi qua một
//       action thật. Một `thayDuoc` đúng mà `state.js` quên gọi vẫn xanh ở nhóm (2).
//   (4) LƯỢT VẼ, trên một DOM giả theo khuôn `luoi.test.js` — không jsdom, vì `noiBanner`
//       nhận gốc DOM qua tham số.
//
// Cộng cửa chặn tầng view của riêng file này, y như mỗi view trước đã mang cửa chặn của nó.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BANG_UU_TIEN,
  LOAI_BANG,
  MICROCOPY_BANG,
  dongDuoc,
  microcopyBanner,
  thayDuoc,
} from '../app/core/banner.js';
import { MA_LOI, microcopyLoi } from '../app/core/errors.js';
import { MAX_NOTE_CHARS } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';
import { noiBanner } from '../app/view/banner.js';
import { boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

// ---------------------------------------------------------------------------
// Gốc DOM tối giản — cùng khuôn `luoi.test.js`
// ---------------------------------------------------------------------------

function phanTuGia() {
  return {
    textContent: '',
    className: '',
    type: '',
    con: [],
    thuocTinh: {},
    boNghe: {},
    setAttribute(ten, giaTri) {
      this.thuocTinh[ten] = giaTri;
    },
    addEventListener(ten, ham) {
      this.boNghe[ten] = ham;
    },
  };
}

/** Phần tử chủ giả: đúng những gì `noiBanner` chạm tới, cộng `textContent` mà nó KHÔNG dùng —
 *  để một câu gắn thẳng vào phần tử chủ không đi qua suite này mà xanh. */
function bangGia() {
  const bang = {
    con: [],
    textContent: '',
    soLanThayCon: 0,
    ownerDocument: { createElement: () => phanTuGia() },
    replaceChildren(...moi) {
      bang.con = moi;
      bang.soLanThayCon += 1;
    },
    /** Tổng chữ của CẢ phần tử, con cháu tính hết. */
    tongChu() {
      const di = (phanTu) => (phanTu.textContent ?? '') + (phanTu.con ?? []).map(di).join('');
      return di(bang);
    },
    lop(lop) {
      return bang.con.find((c) => c.className === lop) ?? null;
    },
  };
  return bang;
}

function gocGia(bang, chon = '.dai-bang') {
  return {
    querySelector(s) {
      return s === chon ? bang : null;
    },
  };
}

// ---------------------------------------------------------------------------
// Store THẬT, kho giả
// ---------------------------------------------------------------------------

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

/** Store thật với `state.banner` đã ở một giá trị cho trước.
 *
 *  Đặt qua một action THẬT (`khoiDong` với một kho từ chối) chứ không gán thẳng vào state:
 *  `store.state` là bản sao đóng băng, và một phép gán ở đây sẽ ném — đó chính là bằng chứng
 *  "một đường đổi state" mà `core-state.test.js` ghim. */
function storeVoiBanner(loai) {
  const ports = portsDay();
  const loi = new Error('kho hỏng');
  loi.code = loai;
  ports.noteStore = { ...ports.noteStore, readAll: () => Promise.reject(loi) };
  const store = taoStore(ports);
  return store.khoiDong().then(() => store);
}

// ---------------------------------------------------------------------------
// (1) Bảng bảy nguồn — nghiệm thu trên CHÍNH bảng
// ---------------------------------------------------------------------------

/** Thứ tự AD-17, viết ra một lần ở đây để nó đối chiếu được từng dòng với bảng của architecture:
 *  `VERSION_SKEW` → `QUOTA` → `DB` → nạp file thất bại → vượt trần khi gõ → nạp file thành công
 *  → cảnh báo trước ngưỡng. */
const THU_TU_AD_17 = [
  { loai: ['VERSION_SKEW'], dongDuoc: false },
  { loai: ['QUOTA'], dongDuoc: false },
  { loai: ['DB'], dongDuoc: false },
  { loai: ['BAD_FILE', 'BAD_VERSION'], dongDuoc: true },
  { loai: ['TOO_LONG'], dongDuoc: true },
  { loai: ['NAP_FILE_XONG'], dongDuoc: true },
  { loai: ['DUNG_LUONG_SAP_HET'], dongDuoc: true },
];

describe('core/banner.js — bảng bảy nguồn của AD-17', () => {
  it('đúng BẢY hàng, đúng thứ tự AD-17, đúng cờ đóng-được — không hàng thứ tám', () => {
    // Ghim cả hình dạng chứ không chỉ số lượng: một hàng chèn vào giữa vẫn giữ đúng bảy nếu
    // ai đó xóa một hàng khác, và đó là đúng cách một nguồn biến mất mà không ai thấy.
    expect(BANG_UU_TIEN.map((hang) => ({ loai: [...hang.loai], dongDuoc: hang.dongDuoc }))).toEqual(
      THU_TU_AD_17,
    );
  });

  it('ưu tiên là VỊ TRÍ mảng: không hàng nào mang một con số ưu tiên', () => {
    // `nguong-tap-trung` đã cấm mọi số literal dưới `app/`, nên một `uuTien: 2` là đỏ ở đó.
    // Ở đây chặn nửa còn lại: một trường ưu tiên mang `0`/`1` (hai số được miễn trừ) vẫn lọt.
    for (const hang of BANG_UU_TIEN) {
      expect(Object.keys(hang).sort()).toEqual(['dongDuoc', 'loai']);
    }
  });

  it('bảng phủ ĐÚNG tập LOAI_BANG: sáu mã lỗi cộng hai sentinel, mỗi giá trị đúng một hàng', () => {
    const trongBang = BANG_UU_TIEN.flatMap((hang) => [...hang.loai]);
    expect([...trongBang].sort()).toEqual([...new Set(trongBang)].sort());
    expect([...trongBang].sort()).toEqual([...Object.values(LOAI_BANG)].sort());
    // Sáu mã của AD-18 có mặt nguyên vẹn — `LOAI_BANG` là tập đó CỘNG hai sentinel, không
    // phải một tập khác trùng một phần.
    for (const ma of Object.values(MA_LOI)) expect(trongBang).toContain(ma);
    expect(Object.values(LOAI_BANG)).toHaveLength(
      Object.values(MA_LOI).length + Object.keys(MICROCOPY_BANG).length,
    );
  });

  it('bảng và LOAI_BANG đông lạnh — một story sau không gán lén một hàng thứ tám', () => {
    expect(Object.isFrozen(BANG_UU_TIEN)).toBe(true);
    expect(Object.isFrozen(LOAI_BANG)).toBe(true);
    for (const hang of BANG_UU_TIEN) {
      expect(Object.isFrozen(hang)).toBe(true);
      expect(Object.isFrozen(hang.loai)).toBe(true);
    }
  });

  it('dongDuoc: ba hàng đầu KHÔNG đóng được, bốn hàng sau đóng được; loại lạ thì ném', () => {
    for (const hang of THU_TU_AD_17) {
      for (const loai of hang.loai) expect(dongDuoc(loai)).toBe(hang.dongDuoc);
    }
    expect(() => dongDuoc('KHONG_CO')).toThrow(TypeError);
  });
});

describe('core/banner.js — chữ luôn đến từ ánh xạ có sẵn', () => {
  it('sáu mã lỗi tra đúng MICROCOPY của core/errors.js, không một câu viết lại nào', () => {
    for (const ma of Object.values(MA_LOI)) {
      expect(microcopyBanner(ma)).toBe(microcopyLoi(ma));
    }
  });

  it('hàng 7 chở nguyên văn của planning; hàng 6 chưa có chữ (Epic 4 gắn tham số)', () => {
    expect(microcopyBanner(LOAI_BANG.DUNG_LUONG_SAP_HET)).toBe(
      'Dung lượng sắp hết. Xuất sao lưu trước khi nó hết.',
    );
    expect(microcopyBanner(LOAI_BANG.NAP_FILE_XONG)).toBeNull();
  });

  it('loại ngoài bảng thì NÉM — không một câu mặc định nào trước mặt người dùng', () => {
    expect(() => microcopyBanner('KHONG_CO')).toThrow(TypeError);
  });
});

// ---------------------------------------------------------------------------
// (2) Phép gác, hàm thuần — MỌI cặp ưu tiên
// ---------------------------------------------------------------------------

/** Một loại đại diện cho mỗi hàng, theo thứ tự ưu tiên giảm dần. */
const DAI_DIEN = BANG_UU_TIEN.map((hang) => hang.loai[0]);

describe('core/banner.js — thayDuoc, mọi cặp ưu tiên', () => {
  it('ưu tiên cao hơn hoặc BẰNG thì thay được; thấp hơn thì không', () => {
    const lech = [];
    for (const [i, dangHien] of DAI_DIEN.entries()) {
      for (const [j, moi] of DAI_DIEN.entries()) {
        const mong = j <= i;
        if (thayDuoc(dangHien, moi) !== mong) lech.push(`${dangHien} ← ${moi}`);
      }
    }
    expect(lech).toEqual([]);
  });

  it('hai mã cùng một hàng thay được nhau — chúng CÙNG mức ưu tiên', () => {
    expect(thayDuoc(LOAI_BANG.BAD_FILE, LOAI_BANG.BAD_VERSION)).toBe(true);
    expect(thayDuoc(LOAI_BANG.BAD_VERSION, LOAI_BANG.BAD_FILE)).toBe(true);
  });

  it('hai ca của AC, nêu thẳng tên: ưu tiên 7 không thay được ưu tiên 2, chiều kia thì thay', () => {
    expect(thayDuoc(LOAI_BANG.QUOTA, LOAI_BANG.DUNG_LUONG_SAP_HET)).toBe(false);
    expect(thayDuoc(LOAI_BANG.TOO_LONG, LOAI_BANG.QUOTA)).toBe(true);
  });

  it('xóa chủ đích LUÔN đi qua, kể cả khi đang hiện hàng không đóng được (AD-8)', () => {
    for (const loai of DAI_DIEN) expect(thayDuoc(loai, null)).toBe(true);
  });

  it('không có gì đang hiện thì mọi loại vào được', () => {
    for (const loai of DAI_DIEN) expect(thayDuoc(null, loai)).toBe(true);
  });

  it('loại lạ thì ném, không bị xử thành "ưu tiên thấp nhất" trong im lặng', () => {
    expect(() => thayDuoc(null, 'KHONG_CO')).toThrow(TypeError);
    expect(() => thayDuoc('KHONG_CO', LOAI_BANG.DB)).toThrow(TypeError);
  });
});

// ---------------------------------------------------------------------------
// (3) Phép gác ở tầng GHI — bất biến của `datLai`
// ---------------------------------------------------------------------------

describe('core/state.js — phép gác sống ở ĐƯỜNG GHI', () => {
  it('ưu tiên thấp đến sau không đè được ưu tiên cao đang hiện, qua một action thật', async () => {
    const store = await storeVoiBanner(MA_LOI.QUOTA);
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
    // `datBanNhap` quá trần đặt `TOO_LONG` (ưu tiên 5) — nó KHÔNG được đè `QUOTA` (ưu tiên 2).
    // Nhưng nhánh `draft` của cùng lời gọi đó vẫn phải vào state: chữ vừa gõ không bao giờ bị
    // cắt hay bỏ vì một thông báo bị từ chối.
    const dai = 'x'.repeat(MAX_NOTE_CHARS + 1);
    store.datBanNhap(dai);
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
    expect(store.state.draft.text).toBe(dai);
  });

  it('ưu tiên cao đến sau thì THAY ưu tiên thấp đang hiện — trên CÙNG một store', async () => {
    // MỘT store, hai lần hỏng liên tiếp: store thứ hai bắt đầu với `banner` rỗng, nên nhánh
    // CHẤP NHẬN của `thayDuoc` không bao giờ chạy ở đó.
    const ports = portsDay();
    let loi = { code: MA_LOI.TOO_LONG };
    ports.noteStore = { ...ports.noteStore, readAll: () => Promise.reject(loi) };
    const store = taoStore(ports);
    await store.khoiDong();
    expect(store.state.banner).toBe(MA_LOI.TOO_LONG);

    // Một `Error` KHÔNG mang mã thuộc tập đóng: nó phải ra `DB` (ưu tiên 3), và `DB` thay được
    // `TOO_LONG` (ưu tiên 5). Hai nửa của AC trong một ca.
    loi = new Error('InvalidStateError');
    await store.khoiDong();
    expect(store.state.banner).toBe(MA_LOI.DB);
  });
});

// ---------------------------------------------------------------------------
// (4) Lượt vẽ — mọi hàng của I/O Matrix
// ---------------------------------------------------------------------------

describe('noiBanner — lượt vẽ', () => {
  it('không có thông báo: vùng dải băng KHÔNG một ký tự nào, và lượt vẽ vẫn chạy', () => {
    const bang = bangGia();
    const store = taoStore(portsDay());
    noiBanner(store, gocGia(bang)).ve();

    expect(bang.con).toEqual([]);
    // Tính từ CHÍNH phần tử chủ: một câu gắn thẳng vào nó chỉ đọc được ở đây.
    expect(bang.tongChu()).toBe('');
    // Một `if (rỗng) return;` sớm để lại nội dung của lượt trước nằm nguyên trên trang.
    expect(bang.soLanThayCon).toBe(1);
  });

  it('loại KHÔNG đổi thì không chạm DOM — vùng aria-live không đọc lại ở mỗi thao tác', async () => {
    // `veTatCa` chạy sau MỖI lần chốt, xóa, mở rộng. Một `replaceChildren` vô điều kiện làm
    // trình đọc màn hình đọc lại một dải băng bền (`DB`/`QUOTA`) ở mọi thao tác đó — tiếng ồn
    // đúng vào lúc người dùng đang cố làm việc khác.
    const bang = bangGia();
    const store = await storeVoiBanner(MA_LOI.DB);
    const v = noiBanner(store, gocGia(bang));
    v.ve();
    expect(bang.soLanThayCon).toBe(1);

    v.ve();
    v.ve();
    expect(bang.soLanThayCon).toBe(1);
    // Và nội dung vẫn còn nguyên đó — "không vẽ lại" không được là "vẽ mất".
    expect(bang.tongChu()).toBe(microcopyLoi(MA_LOI.DB));
  });

  it('ba hàng đầu: hiện microcopy, KHÔNG có nút ✕', async () => {
    for (const loai of [LOAI_BANG.VERSION_SKEW, LOAI_BANG.QUOTA, LOAI_BANG.DB]) {
      const bang = bangGia();
      const store = await storeVoiBanner(loai);
      noiBanner(store, gocGia(bang)).ve();

      expect(bang.con).toHaveLength(1);
      expect(bang.lop('dai-bang-chu').textContent).toBe(microcopyLoi(loai));
      expect(bang.lop('dai-bang-dong')).toBeNull();
      // Không bao giờ là chuỗi tiếng Anh của trình duyệt.
      expect(bang.tongChu()).not.toContain('kho hỏng');
    }
  });

  it('vượt trần khi gõ: hiện microcopy TOO_LONG, CÓ nút ✕ mang nhãn chữ', async () => {
    const bang = bangGia();
    const store = await storeVoiBanner(MA_LOI.TOO_LONG);
    noiBanner(store, gocGia(bang)).ve();

    expect(bang.lop('dai-bang-chu').textContent).toBe(microcopyLoi(MA_LOI.TOO_LONG));
    const nut = bang.lop('dai-bang-dong');
    expect(nut).not.toBeNull();
    expect(nut.textContent).toBe('✕');
    expect(nut.thuocTinh['aria-label']).toBe('đóng thông báo');
    expect(nut.type).toBe('button');
  });

  it('bấm ✕: banner về rỗng, vùng dải băng rỗng lại, và móc vẽ lại được gọi', async () => {
    const bang = bangGia();
    const store = await storeVoiBanner(MA_LOI.TOO_LONG);
    let soLanVe = 0;
    const v = noiBanner(store, gocGia(bang), () => {
      soLanVe += 1;
      v.ve();
    });
    v.ve();

    bang.lop('dai-bang-dong').boNghe.click();

    expect(store.state.banner).toBeNull();
    expect(soLanVe).toBe(1);
    expect(bang.con).toEqual([]);
    expect(bang.tongChu()).toBe('');
  });

  it('hàng không đóng được: action đóng KHÔNG làm gì, kể cả khi bị gọi thẳng', async () => {
    const store = await storeVoiBanner(MA_LOI.QUOTA);
    store.dongDaiBang();
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
  });

  it('banner rỗng: action đóng cũng không ném', () => {
    const store = taoStore(portsDay());
    expect(() => store.dongDaiBang()).not.toThrow();
    expect(store.state.banner).toBeNull();
  });

  it('hàng có mặt nhưng chưa có chữ (nạp file thành công): vẽ RỖNG, không dải băng trắng', () => {
    // Không đi qua `state.js` được — Epic 4 mới có người phát. Store giả tối thiểu là đủ: câu
    // hỏi ở đây thuần là "view làm gì với một hàng chưa có chữ".
    const bang = bangGia();
    const store = { state: { banner: LOAI_BANG.NAP_FILE_XONG } };
    noiBanner(store, gocGia(bang)).ve();

    expect(bang.con).toEqual([]);
    expect(bang.tongChu()).toBe('');
  });

  it('vẽ lại toàn phần: đổi loại thì nội dung cũ đi hẳn, không cộng dồn', async () => {
    const bang = bangGia();
    let loai = LOAI_BANG.TOO_LONG;
    const store = { state: { get banner() { return loai; } } };
    const v = noiBanner(store, gocGia(bang));
    v.ve();
    expect(bang.con).toHaveLength(2);

    loai = LOAI_BANG.DB;
    v.ve();
    expect(bang.con).toHaveLength(1);
    expect(bang.tongChu()).toBe(microcopyLoi(MA_LOI.DB));
    expect(bang.soLanThayCon).toBe(2);
  });

  it('không có .dai-bang trong DOM thì không ném, và ve() vẫn gọi được', () => {
    const v = noiBanner(taoStore(portsDay()), gocGia(bangGia(), '#khong-co'));
    expect(() => v.ve()).not.toThrow();
  });

  it('gốc DOM vắng mặt hẳn: noiBanner(store, null) trả { ve() {} }', () => {
    const v = noiBanner(taoStore(portsDay()), null);
    expect(() => v.ve()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Cửa chặn tầng view — mỗi view mới mang cửa chặn của chính nó
// ---------------------------------------------------------------------------

describe('app/view/banner.js — luật của tầng view, cưỡng chế được', () => {
  const nguon = boChuThichJs(readFileSync(join(repoRoot, 'app', 'view', 'banner.js'), 'utf8'));

  it('chạm store ở đúng hai chỗ: đọc state, và gọi MỘT action của lõi', () => {
    const goiStore = [...nguon.matchAll(/store\s*\.\s*([\w$]+)/g)].map((k) => k[1]);
    expect([...new Set(goiStore)].sort()).toEqual(['dongDaiBang', 'state']);
    expect(nguon).not.toMatch(/subscribe|onChange|theoDoi/i);
  });

  it('đọc ĐÚNG MỘT giá trị state, và đó là `banner`', () => {
    const doc = [...nguon.matchAll(/store\s*\.\s*state\s*\.\s*([\w$]+)/g)].map((k) => k[1]);
    expect([...new Set(doc)]).toEqual(['banner']);
  });

  it('không import app/adapters/, không tự gọi cổng, không tự soạn câu chữ lỗi', () => {
    expect(nguon).not.toMatch(/adapters\//);
    expect(nguon).not.toMatch(/\bports\b/);
    // Câu chữ đi qua `microcopyBanner`; một `loi.message` in ra đây là chuỗi tiếng Anh của
    // trình duyệt lọt ra trước mặt người dùng (AD-18).
    expect(nguon).toMatch(/microcopyBanner\s*\(/);
    expect(nguon).not.toMatch(/\.\s*message\b/);
  });

  it('không dựng DOM bằng chuỗi', () => {
    expect(nguon).not.toMatch(/innerHTML|insertAdjacentHTML|outerHTML/);
  });

  it('không số literal nào — và cờ đóng-được đọc từ bảng, không chép lại', () => {
    const so = [...nguon.matchAll(/(?<![\w$.])\d[\d_]*(?:\.\d+)?/g)]
      .map((k) => k[0])
      .filter((s) => s !== '0' && s !== '1');
    expect(so).toEqual([]);
    expect(nguon).toMatch(/dongDuoc\s*\(/);
  });

  it('nó là nơi DUY NHẤT dưới app/ chạm DOM của dải băng', () => {
    // AC nói "grep toàn `app/` thì chỉ `view/banner.js` xuất hiện". Quét theo class và theo
    // selector: một `document.querySelector('.dai-bang')` ở một module khác là đúng thứ AD-17
    // sinh ra để chặn.
    const viPham = [];
    for (const ten of ['core/banner.js', 'core/state.js', 'main.js', 'view/luoi.js',
      'view/mau-giay.js', 'view/o-soan.js', 'view/tieu-de.js']) {
      const ma = readFileSync(join(repoRoot, 'app', ...ten.split('/')), 'utf8');
      if (/dai-bang/.test(boChuThichJs(ma))) viPham.push(ten);
    }
    expect(viPham).toEqual([]);
  });

  it('app/main.js nối dải băng vào CÙNG lượt vẽ chung, và ✕ gọi lại lượt vẽ đó', () => {
    // Cả hai nửa vỡ trong im lặng: không đưa `ve` vào lượt vẽ chung thì mọi lỗi kho chết im
    // lặng y như trước story này; không treo móc vào nút `✕` thì state đổi mà chữ vẫn nằm đó.
    const main = boChuThichJs(readFileSync(join(repoRoot, 'app', 'main.js'), 'utf8'));
    const treo = /khoiDong\s*\(\s*\)\s*\.\s*then\s*\(\s*([\w$]+)\s*\)/.exec(main);
    expect(treo).not.toBeNull();
    const than = new RegExp(`\\b${treo[1]}\\s*=\\s*\\(\\s*\\)\\s*=>\\s*\\{([^}]*)\\}`).exec(main);
    expect(than).not.toBeNull();
    expect([...than[1].matchAll(/([\w$]+)\s*\.\s*ve\s*\(\s*\)/g)].map((k) => k[1])).toContain(
      'banner',
    );
    const noi = /noiBanner\s*\(\s*store\s*,\s*document\s*,\s*([\w$]+)\s*\)/.exec(main);
    expect(noi).not.toBeNull();
    const moc = new RegExp(`\\b${noi[1]}\\s*=\\s*\\(\\s*\\)\\s*=>\\s*\\{([^}]*)\\}`).exec(main);
    expect(moc).not.toBeNull();
    expect(moc[1]).toMatch(new RegExp(`\\b${treo[1]}\\s*\\(`));
  });

  it('app/main.js trả FOCUS về ô soạn thảo sau khi đóng — bàn phím không mất chỗ đứng', () => {
    // Nút `✕` tự gỡ mình khỏi DOM ở đúng lượt vẽ nó gây ra, và focus rơi về `<body>`: `Tab`
    // tiếp theo bắt đầu lại từ đầu trang. Sản phẩm cố ý không có phím tắt nào, nên bàn phím là
    // đường duy nhất và nó không được đứt.
    //
    // Và phép trả focus phải ở `main.js`, KHÔNG ở `view/banner.js`: hai view không biết nhau.
    const main = boChuThichJs(readFileSync(join(repoRoot, 'app', 'main.js'), 'utf8'));
    const noi = /noiBanner\s*\(\s*store\s*,\s*document\s*,\s*([\w$]+)\s*\)/.exec(main);
    const moc = new RegExp(`\\b${noi[1]}\\s*=\\s*\\(\\s*\\)\\s*=>\\s*\\{([^}]*)\\}`).exec(main);
    expect(moc[1]).toMatch(/\.\s*focus\s*\(\s*\)/);
    // Và nó nhắm đúng ô soạn thảo — cùng `id` mà `index.html` mang.
    expect(main).toMatch(/'o-soan'/);
    const html = readFileSync(join(repoRoot, 'index.html'), 'utf8');
    expect(html).toMatch(/id="o-soan"/);
    const nguonView = boChuThichJs(
      readFileSync(join(repoRoot, 'app', 'view', 'banner.js'), 'utf8'),
    );
    expect(nguonView).not.toMatch(/o-soan|focus/);
  });

  it('index.html mang phần tử chủ RỖNG, con đầu của <body>, ngoài <main>, không class tang', () => {
    const html = readFileSync(join(repoRoot, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    const the = /<div class="dai-bang"([^>]*)>([\s\S]*?)<\/div>/.exec(html);
    expect(the).not.toBeNull();
    // Rỗng THẬT, không một khoảng trắng: `.dai-bang:empty` là thứ làm nó không chiếm chiều cao.
    expect(the[2]).toBe('');
    expect(the[1]).not.toMatch(/\btang\b/);
    const than = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html);
    expect(than[1].search(/<div class="dai-bang"/)).toBeLessThan(than[1].search(/<main\b/));
    const trongMain = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
    expect(trongMain[1]).not.toContain('dai-bang');
  });

  it('style.css: một hình dạng, đẩy nội dung xuống, rỗng thì không chiếm chiều cao', () => {
    const css = readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8');
    const khoi = /\.dai-bang\s*\{([^}]*)\}/.exec(css);
    expect(khoi).not.toBeNull();
    // `flex: none` cộng vị trí con đầu của `body` LÀ phép "đẩy xuống chứ không phủ lên": một
    // `position: fixed`/`absolute` ở đây là phủ lên, đúng thứ UX-DR-17 cấm.
    expect(khoi[1]).toMatch(/flex\s*:\s*none\b/);
    expect(khoi[1]).not.toMatch(/position\s*:\s*(fixed|absolute|sticky)/);
    expect(khoi[1]).toMatch(/background\s*:\s*var\(--chip-bg\)/);
    expect(khoi[1]).toMatch(/border-block-end\s*:\s*1px solid var\(--rule\)/);
    // KHÔNG bóng, và không biến thể theo loại: một `.dai-bang-DB` hay một `--danger` ở đây là
    // bảy nguồn biến thành bảy thành phần giao diện.
    expect(khoi[1]).not.toMatch(/box-shadow/);
    expect(css).not.toMatch(/\.dai-bang[\w-]*\s*\{[^}]*var\(--danger\)/);
    // Rỗng thì cao 0 — nhưng phần tử VẪN render: `display: none` / `visibility: hidden` rút
    // vùng `aria-live` khỏi cây trợ năng, và thông báo ĐẦU TIÊN chèn vào sẽ không được đọc lên.
    const rong = /\.dai-bang:empty\s*\{([^}]*)\}/.exec(css);
    expect(rong).not.toBeNull();
    expect(rong[1]).toMatch(/block-size\s*:\s*0\b/);
    expect(rong[1]).toMatch(/padding-block\s*:\s*0\b/);
    expect(rong[1]).toMatch(/border-block-end\s*:\s*0\b/);
    expect(rong[1]).toMatch(/overflow\s*:\s*hidden\b/);
    expect(rong[1]).not.toMatch(/display\s*:\s*none|visibility\s*:\s*hidden/);

    const nut = /\.dai-bang-dong\s*\{([^}]*)\}/.exec(css)[1];
    expect(nut).toMatch(/color\s*:\s*var\(--ink-2\)/);
    // Vùng bấm thật, bằng token — và con trỏ nói rằng nó bấm được.
    expect(nut).toMatch(/cursor\s*:\s*pointer/);
    expect(nut).toMatch(/padding\s*:\s*var\(--space-\d\) var\(--space-\d\)/);
  });

  it('bốn nguồn chưa tới KHÔNG có code phát ở đâu dưới app/', () => {
    // Chúng chỉ tồn tại trong bảng: `core/banner.js` khai, và không module nào ĐẶT chúng.
    const viPham = [];
    for (const ten of ['core/state.js', 'main.js', 'view/banner.js', 'view/luoi.js',
      'view/mau-giay.js', 'view/o-soan.js', 'view/tieu-de.js']) {
      const ma = boChuThichJs(readFileSync(join(repoRoot, 'app', ...ten.split('/')), 'utf8'));
      for (const loai of ['BAD_FILE', 'BAD_VERSION', 'VERSION_SKEW', 'DUNG_LUONG_SAP_HET',
        'NAP_FILE_XONG']) {
        if (ma.includes(loai)) viPham.push(`${ten} — ${loai}`);
      }
    }
    expect(viPham).toEqual([]);
  });
});
