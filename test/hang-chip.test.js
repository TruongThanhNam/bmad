// Hàng chip điều kiện (Story 6.3) — tầng 2b: chip mỗi điều kiện, số kết quả, nút `về hôm nay`.
//
// Không jsdom: `noiHangChip(store, goc, mocHienTai, veHomNay)` nhận gốc DOM qua tham số. Mỗi
// hàng của I/O Matrix một ca; "tải lại" và "gõ ô tìm giữ `date`" là của lõi/khay tìm, được ghim
// ở đây bằng state thật cho trọn ma trận.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fold } from '../app/core/fold.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';
import { noiHangChip } from '../app/view/hang-chip.js';
import { noiOSoan } from '../app/view/o-soan.js';
import { boChuThichCss, boChuThichHtml, boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const MOC = '2026-09-24T10:00:00+05:30';

function phanTuGia(the, tai) {
  const pt = {
    tagName: the.toUpperCase(),
    ownerDocument: tai,
    className: '',
    textContent: '',
    hidden: false,
    con: [],
    boNghe: {},
    thuocTinh: {},
    addEventListener(ten, ham) {
      pt.boNghe[ten] = ham;
    },
    replaceChildren(...moi) {
      pt.con = moi;
    },
    setAttribute(k, v) {
      pt.thuocTinh[k] = String(v);
    },
    bam() {
      pt.boNghe.click?.();
    },
  };
  return pt;
}

function dungHang() {
  const tai = { createElement: (t) => phanTuGia(t, tai) };
  const hang = phanTuGia('div', tai);
  hang.hidden = true;
  return { hang, goc: { querySelector: (s) => (s === '.hang-chip' ? hang : null) } };
}

function ghiChu(id, text, createdAt) {
  return { id, text, textFolded: fold(text), createdAt };
}

/** Store giả tối giản: đúng hai trường mà view đọc. */
function storeGia(dieuKien, notes = []) {
  return { state: { dieuKien, notes } };
}

const BON = [
  ghiChu('a', 'Phân quyền cho nhóm A', '2026-09-03T09:00:00+05:30'),
  ghiChu('b', 'phan quyen lần hai', '2026-09-05T09:00:00+05:30'),
  ghiChu('c', 'PHÂN QUYỀN review', '2026-09-10T09:00:00+05:30'),
  ghiChu('d', 'hỏi lại phân quyền', '2026-09-24T09:00:00+05:30'),
  ghiChu('e', 'mua sữa', '2026-09-24T08:00:00+05:30'),
];

const chu = (hang) => hang.con.map((c) => c.textContent);

describe('noiHangChip — I/O Matrix', () => {
  it('63 khớp: chip ghi `63 ghi chú` — đọc total, không bị trần 50 cắt (Story 6.4)', () => {
    const { hang, goc } = dungHang();
    const nhieu = Array.from({ length: 63 }, (_, i) => {
      const gio = `${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`;
      return ghiChu(`p${i}`, `phan ${i}`, `2026-09-03T${gio}:00+05:30`);
    });
    noiHangChip(storeGia({ keyword: 'phan', date: null }, nhieu), goc, () => MOC).ve();
    expect(chu(hang)).toEqual(['phan', '63 ghi chú', 'về hôm nay']);
  });

  it('đúng trần 50 khớp: chip ghi `50 ghi chú` (Story 6.4)', () => {
    const { hang, goc } = dungHang();
    const nhieu = Array.from({ length: 50 }, (_, i) =>
      ghiChu(`p${i}`, `phan ${i}`, `2026-09-03T10:${String(i).padStart(2, '0')}:00+05:30`),
    );
    noiHangChip(storeGia({ keyword: 'phan', date: null }, nhieu), goc, () => MOC).ve();
    expect(chu(hang)).toEqual(['phan', '50 ghi chú', 'về hôm nay']);
  });

  it('mặc định {null,null}: không hàng chip', () => {
    const { hang, goc } = dungHang();
    noiHangChip(storeGia({ keyword: null, date: null }, BON), goc, () => MOC).ve();
    expect(hang.hidden).toBe(true);
    expect(hang.con).toEqual([]);
  });

  it('chỉ từ khóa: chip nguyên văn · `4 ghi chú` · `về hôm nay`', () => {
    const { hang, goc } = dungHang();
    noiHangChip(storeGia({ keyword: 'phan quyen', date: null }, BON), goc, () => MOC).ve();
    expect(hang.hidden).toBe(false);
    expect(chu(hang)).toEqual(['phan quyen', '4 ghi chú', 'về hôm nay']);
    expect(hang.con.map((c) => c.className)).toEqual(['chip', 'hang-chip-dem', 've-hom-nay']);
  });

  it('cả hai: chip từ khóa · chip ngày dd/MM/yyyy (mono) · `1 ghi chú`', () => {
    const { hang, goc } = dungHang();
    noiHangChip(
      storeGia({ keyword: 'phan quyen', date: '2026-09-03' }, BON),
      goc,
      () => MOC,
    ).ve();
    expect(chu(hang)).toEqual(['phan quyen', '03/09/2026', '1 ghi chú', 'về hôm nay']);
    expect(hang.con[1].className).toBe('chip chip-ngay');
  });

  it('chỉ ngày: chip ngày dd/MM/yyyy (mono) · `1 ghi chú` · `về hôm nay`', () => {
    const { hang, goc } = dungHang();
    noiHangChip(storeGia({ keyword: null, date: '2026-09-03' }, BON), goc, () => MOC).ve();
    expect(chu(hang)).toEqual(['03/09/2026', '1 ghi chú', 'về hôm nay']);
    expect(hang.con[0].className).toBe('chip chip-ngay');
  });

  it('không khớp: `0 ghi chú` và nút vẫn còn', () => {
    const { hang, goc } = dungHang();
    noiHangChip(storeGia({ keyword: 'khong co', date: null }, BON), goc, () => MOC).ve();
    expect(chu(hang)).toEqual(['khong co', '0 ghi chú', 'về hôm nay']);
  });

  it('chip là <span> không handler, không tabindex; nút là <button type=button>', () => {
    const { hang, goc } = dungHang();
    noiHangChip(storeGia({ keyword: 'x', date: '2026-09-03' }, BON), goc, () => MOC).ve();
    for (const chip of hang.con.slice(0, 3)) {
      expect(chip.tagName).toBe('SPAN');
      expect(chip.boNghe).toEqual({});
      expect(chip.thuocTinh).toEqual({});
    }
    const nut = hang.con[3];
    expect(nut.tagName).toBe('BUTTON');
    expect(nut.type).toBe('button');
  });

  it('về hôm nay: click phát móc; với main-style móc, state về {null,null} và hàng biến mất', () => {
    const ports = {};
    for (const c of Object.keys(PORT_METHODS)) {
      ports[c] = {};
      for (const m of PORT_METHODS[c]) ports[c][m] = () => Promise.resolve();
    }
    const store = taoStore(ports);
    store.datDieuKien({ keyword: 'phan quyen', date: '2026-09-03' });
    const { hang, goc } = dungHang();
    let soLan = 0;
    const hc = noiHangChip(store, goc, () => MOC, () => {
      soLan += 1;
      store.xoaHetDieuKien();
      hc.ve();
    });
    hc.ve();
    expect(hang.hidden).toBe(false);
    hang.con.at(-1).bam();
    expect(soLan).toBe(1);
    expect(store.state.dieuKien).toEqual({ keyword: null, date: null });
    expect(hang.hidden).toBe(true);
  });

  it('gõ ô tìm khi đang lọc ngày: `date` giữ nguyên; store mới (tải lại) về {null,null}', () => {
    const ports = {};
    for (const c of Object.keys(PORT_METHODS)) {
      ports[c] = {};
      for (const m of PORT_METHODS[c]) ports[c][m] = () => Promise.resolve();
    }
    const store = taoStore(ports);
    store.datDieuKien({ date: '2026-09-03' });
    store.datDieuKien({ keyword: 'ph' });
    expect(store.state.dieuKien.date).toBe('2026-09-03');
    expect(taoStore(ports).state.dieuKien).toEqual({ keyword: null, date: null });
  });

  it('thiếu chỗ gắn: ve() vẫn gọi được', () => {
    expect(() => noiHangChip(storeGia({ keyword: 'x', date: null }), { querySelector: () => null }).ve()).not.toThrow();
  });
});

describe('o-soan.ve — placeholder cảnh báo theo điều kiện', () => {
  function oGia() {
    const thuocTinh = {};
    return {
      thuocTinh,
      value: '',
      style: {},
      offsetHeight: 0,
      clientHeight: 0,
      scrollHeight: 0,
      addEventListener() {},
      getAttribute: (k) => (k in thuocTinh ? thuocTinh[k] : null),
      hasAttribute: (k) => k in thuocTinh,
      setAttribute: (k, v) => {
        thuocTinh[k] = v;
      },
      removeAttribute: (k) => {
        delete thuocTinh[k];
      },
    };
  }

  it('có điều kiện → placeholder cảnh báo; hết điều kiện → gỡ hẳn thuộc tính', () => {
    const o = oGia();
    const store = { state: { dieuKien: { keyword: 'a', date: null } } };
    const view = noiOSoan(store, { querySelector: () => o });
    view.ve();
    expect(o.thuocTinh.placeholder).toBe('gõ vào đây sẽ bỏ mọi điều kiện lọc');
    store.state = { dieuKien: { keyword: null, date: '2026-09-03' } };
    view.ve();
    expect(o.thuocTinh.placeholder).toBe('gõ vào đây sẽ bỏ mọi điều kiện lọc');
    store.state = { dieuKien: { keyword: null, date: null } };
    view.ve();
    expect('placeholder' in o.thuocTinh).toBe(false);
  });

  it('thiếu ô: bản rỗng vẫn có ve()', () => {
    expect(() => noiOSoan({}, { querySelector: () => null }).ve()).not.toThrow();
  });
});

describe('phần văn bản — chỗ gắn, token, và luật tầng view', () => {
  const html = boChuThichHtml(readFileSync(join(repoRoot, 'index.html'), 'utf8'));
  const css = boChuThichCss(readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8'));
  const nguon = boChuThichJs(readFileSync(join(repoRoot, 'app', 'view', 'hang-chip.js'), 'utf8'));

  it('chỗ gắn `.hang-chip` rỗng, hidden, ngay sau #o-ngay-loi trong tầng khay', () => {
    expect(html).toMatch(/id="o-ngay-loi"[^>]*>[^<]*<\/p>\s*<div class="hang-chip" hidden><\/div>\s*<\/div>\s*<\/section>/);
  });

  it('CSS chip lấy từ token condition-chip, về hôm nay đẩy sang phải, gạch chân', () => {
    const chip = /\.chip\s*\{([^}]*)\}/.exec(css)[1];
    expect(chip).toMatch(/background\s*:\s*var\(--chip-bg\)/);
    expect(chip).toMatch(/border\s*:\s*1px solid var\(--rule\)/);
    expect(chip).toMatch(/border-radius\s*:\s*var\(--radius-full\)/);
    expect(chip).toMatch(/color\s*:\s*var\(--ink\)/);
    const ve = /\.ve-hom-nay\s*\{([^}]*)\}/.exec(css)[1];
    expect(ve).toMatch(/margin-inline-start\s*:\s*auto/);
    expect(ve).toMatch(/text-decoration\s*:\s*underline/);
    expect(/\.chip-ngay\s*\{([^}]*)\}/.exec(css)[1]).toMatch(/var\(--font-time\)/);
  });

  it('view không gọi action, không aria-live, không tabindex, không import adapters', () => {
    const goiStore = [...nguon.matchAll(/store\s*\.\s*([\w$]+)/g)].map((k) => k[1]);
    expect([...new Set(goiStore)]).toEqual(['state']);
    expect(nguon).not.toMatch(/aria-live|tabindex|adapters\//i);
  });
});
