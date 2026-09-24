// Khay tìm (Story 6.1) — ô `#o-tim` phát `datDieuKien` mỗi phím, và kéo `value` về theo state.
//
// Không jsdom: `noiKhayTim(store, goc, sauKhiDoi)` nhận gốc DOM qua tham số.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { noiKhayTim } from '../app/view/khay-tim.js';
import { boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function oGia() {
  let value = '';
  const o = {
    boNghe: {},
    soLanGan: 0,
    get value() {
      return value;
    },
    set value(v) {
      value = v;
      o.soLanGan += 1;
    },
    go(chu) {
      value = chu;
      o.boNghe.input?.({ target: o });
    },
    addEventListener(ten, ham) {
      o.boNghe[ten] = ham;
    },
  };
  return o;
}

function gocGia(o, extra = {}) {
  const bang = { 'o-tim': o, ...extra };
  return { getElementById: (id) => bang[id] ?? null };
}

/** Bộ ô ngày giả: ô `#o-ngay`, khung bọc có class, nút lịch, picker gốc, chữ lỗi. */
function boNgayGia() {
  const lop = new Set();
  const nut = { boNghe: {}, addEventListener(t, h) { nut.boNghe[t] = h; }, bam() { nut.boNghe.click?.(); } };
  const chon = {
    value: '',
    soLanMo: 0,
    boNghe: {},
    addEventListener(t, h) { chon.boNghe[t] = h; },
    showPicker() { chon.soLanMo += 1; },
    chonNgay(v) { chon.value = v; chon.boNghe.change?.(); },
  };
  const boc = {
    classList: { toggle: (ten, bat) => (bat ? lop.add(ten) : lop.delete(ten)), has: (t) => lop.has(t) },
    querySelector: (s) => (s === '.nut-lich' ? nut : s === '.o-ngay-chon' ? chon : null),
  };
  const o = oGia();
  o.parentElement = boc;
  o.thuocTinh = {};
  o.setAttribute = (k, v) => { o.thuocTinh[k] = v; };
  o.removeAttribute = (k) => { delete o.thuocTinh[k]; };
  o.focus = () => {};
  o.roi = () => o.boNghe.blur?.();
  const loi = { hidden: true };
  const coLoi = () => {
    const bat = lop.has('o-ngay-loi');
    expect(loi.hidden).toBe(!bat);
    expect(o.thuocTinh['aria-invalid'] === 'true').toBe(bat);
    expect(o.thuocTinh['aria-describedby'] === 'o-ngay-loi').toBe(bat);
    return bat;
  };
  return { o, nut, chon, loi, coLoi, goc: (oTim = oGia()) => gocGia(oTim, { 'o-ngay': o, 'o-ngay-loi': loi }) };
}

/** Store giả tối giản: đúng `state.dieuKien` và `datDieuKien` chuẩn hóa `''` → `null` như lõi. */
function storeGia() {
  const phat = [];
  const store = {
    state: { dieuKien: { keyword: null, date: null } },
    phat,
    datDieuKien(partial) {
      phat.push(partial);
      const cu = store.state.dieuKien;
      const keyword = 'keyword' in partial ? (partial.keyword === '' ? null : partial.keyword) : cu.keyword;
      const date = 'date' in partial ? partial.date : cu.date;
      store.state = { dieuKien: { keyword, date } };
    },
    xoaHetDieuKien() {
      store.state = { dieuKien: { keyword: null, date: null } };
    },
  };
  return store;
}

describe('noiKhayTim', () => {
  it('mỗi phím phát datDieuKien({ keyword }) nguyên văn rồi gọi lượt vẽ — không cần Enter', () => {
    const o = oGia();
    const store = storeGia();
    let soLuotVe = 0;
    noiKhayTim(store, gocGia(o), () => {
      soLuotVe += 1;
    });
    o.go('p');
    o.go('ph');
    o.go(' ph ');
    expect(store.phat).toEqual([{ keyword: 'p' }, { keyword: 'ph' }, { keyword: ' ph ' }]);
    expect(soLuotVe).toBe(3);
  });

  it('xóa hết chữ: phát chuỗi rỗng, lõi chuẩn hóa thành null', () => {
    const o = oGia();
    const store = storeGia();
    noiKhayTim(store, gocGia(o), () => {});
    o.go('ab');
    o.go('');
    expect(store.state.dieuKien.keyword).toBeNull();
  });

  it('ve() không gán value khi đã khớp state — con trỏ không nhảy lúc đang gõ', () => {
    const o = oGia();
    const store = storeGia();
    const v = noiKhayTim(store, gocGia(o), () => v.ve());
    o.go('abc');
    expect(o.soLanGan).toBe(0);
  });

  it('chốt ghi chú xóa điều kiện → ô về rỗng ở lượt vẽ kế', () => {
    const o = oGia();
    const store = storeGia();
    const v = noiKhayTim(store, gocGia(o), () => {});
    o.go('phở');
    store.xoaHetDieuKien();
    v.ve();
    expect(o.value).toBe('');
  });

  it('không có ô thì ve vẫn gọi được', () => {
    const v = noiKhayTim(storeGia(), { getElementById: () => null });
    expect(() => v.ve()).not.toThrow();
  });

  it('luật tầng view: không adapters, không innerHTML, không debounce, không ghi state', () => {
    const ma = boChuThichJs(readFileSync(join(repoRoot, 'app', 'view', 'khay-tim.js'), 'utf8'));
    expect(ma).not.toMatch(/adapters\//);
    expect(ma).not.toMatch(/innerHTML/);
    expect(ma).not.toMatch(/setTimeout|aria-live|keydown/);
    expect(ma).not.toMatch(/store\.state[^;\n]*=(?!=)/);
    // Chỉ được import đúng `core/time.js` — đổi dd/MM/yyyy ↔ yyyy-MM-dd (Story 6.2).
    const imports = [...ma.matchAll(/import\s[^;]*from\s+'([^']+)'/g)].map((k) => k[1]);
    expect(imports).toEqual(['../core/time.js']);
  });
});

describe('noiKhayTim — ô ngày (Story 6.2)', () => {
  it('gõ đủ ngày: phát date yyyy-MM-dd, lỗi tắt', () => {
    const b = boNgayGia();
    const store = storeGia();
    noiKhayTim(store, b.goc(), () => {});
    b.o.go('03/09/2026');
    expect(store.state.dieuKien.date).toBe('2026-09-03');
    expect(store.phat.at(-1)).toEqual({ date: '2026-09-03' });
    expect(b.coLoi()).toBe(false);
  });

  it('gõ dở: không phát, date giữ cũ, lỗi chưa bật — bật khi blur', () => {
    const b = boNgayGia();
    const store = storeGia();
    noiKhayTim(store, b.goc(), () => {});
    b.o.go('03/09/2026');
    const soPhat = store.phat.length;
    b.o.go('03/09/20');
    expect(store.phat.length).toBe(soPhat);
    expect(store.state.dieuKien.date).toBe('2026-09-03');
    expect(b.coLoi()).toBe(false);
    b.o.roi();
    expect(b.coLoi()).toBe(true);
    expect(store.phat.length).toBe(soPhat);
  });

  it('ngày không có thật: không phát, lỗi bật ngay (đủ 10 ký tự)', () => {
    const b = boNgayGia();
    const store = storeGia();
    noiKhayTim(store, b.goc(), () => {});
    b.o.go('31/02/2026');
    expect(store.phat).toEqual([]);
    expect(b.coLoi()).toBe(true);
  });

  it('sai định dạng: 10 ký tự bật ngay, ngắn hơn bật khi blur', () => {
    const b = boNgayGia();
    const store = storeGia();
    noiKhayTim(store, b.goc(), () => {});
    b.o.go('2026-09-03');
    expect(b.coLoi()).toBe(true);
    b.o.go('');
    expect(b.coLoi()).toBe(false);
    b.o.go('3/9/2026');
    expect(b.coLoi()).toBe(false);
    b.o.roi();
    expect(b.coLoi()).toBe(true);
    expect(store.phat.filter((p) => p.date !== null)).toEqual([]);
  });

  it('xóa hết: phát date null, lỗi tắt; blur ô rỗng không bật lỗi', () => {
    const b = boNgayGia();
    const store = storeGia();
    noiKhayTim(store, b.goc(), () => {});
    b.o.go('03/09/2026');
    b.o.go('31/02/2026');
    expect(b.coLoi()).toBe(true);
    b.o.go('');
    expect(store.state.dieuKien.date).toBeNull();
    expect(b.coLoi()).toBe(false);
    b.o.roi();
    expect(b.coLoi()).toBe(false);
  });

  it('giao với từ khóa: gõ ngày không đụng keyword, gõ từ khóa không đụng date', () => {
    const b = boNgayGia();
    const oTim = oGia();
    const store = storeGia();
    noiKhayTim(store, b.goc(oTim), () => {});
    oTim.go('phở');
    b.o.go('03/09/2026');
    expect(store.state.dieuKien).toEqual({ keyword: 'phở', date: '2026-09-03' });
    oTim.go('bún');
    expect(store.state.dieuKien).toEqual({ keyword: 'bún', date: '2026-09-03' });
    expect(store.phat.every((p) => Object.keys(p).length === 1)).toBe(true);
  });

  it('picker: nút lịch mở picker, chọn xong điền ô dd/MM/yyyy và phát', () => {
    const b = boNgayGia();
    const store = storeGia();
    let luotVe = 0;
    noiKhayTim(store, b.goc(), () => { luotVe += 1; });
    b.o.go('31/02/2026');
    b.nut.bam();
    expect(b.chon.soLanMo).toBe(1);
    b.chon.chonNgay('2026-09-03');
    expect(b.o.value).toBe('03/09/2026');
    expect(store.state.dieuKien.date).toBe('2026-09-03');
    expect(b.coLoi()).toBe(false);
    expect(luotVe).toBe(1);
  });

  it('blur ô rỗng khi date đã null: không phát, không vẽ lại', () => {
    const b = boNgayGia();
    const store = storeGia();
    let luotVe = 0;
    noiKhayTim(store, b.goc(), () => { luotVe += 1; });
    b.o.roi();
    expect(store.phat).toEqual([]);
    expect(luotVe).toBe(0);
  });

  it('bấm nút lịch nạp date hiện tại vào picker', () => {
    const b = boNgayGia();
    const store = storeGia();
    noiKhayTim(store, b.goc(), () => {});
    b.o.go('03/09/2026');
    b.nut.bam();
    expect(b.chon.value).toBe('2026-09-03');
  });

  it('xóa trong picker: ô về rỗng, date về null', () => {
    const b = boNgayGia();
    const store = storeGia();
    noiKhayTim(store, b.goc(), () => {});
    b.o.go('03/09/2026');
    b.chon.chonNgay('');
    expect(b.o.value).toBe('');
    expect(store.state.dieuKien.date).toBeNull();
  });

  it('picker trả giá trị không phải yyyy-MM-dd (năm 5 chữ số): không ném, không đổi gì', () => {
    const b = boNgayGia();
    const store = storeGia();
    noiKhayTim(store, b.goc(), () => {});
    b.o.go('03/09/2026');
    expect(() => b.chon.chonNgay('20260-09-03')).not.toThrow();
    expect(b.o.value).toBe('03/09/2026');
    expect(store.state.dieuKien.date).toBe('2026-09-03');
  });

  it('picker không mở được (showPicker ném) thì không vỡ', () => {
    const b = boNgayGia();
    b.chon.showPicker = () => { throw new Error('NotAllowedError'); };
    noiKhayTim(storeGia(), b.goc(), () => {});
    expect(() => b.nut.bam()).not.toThrow();
  });

  it('chốt ghi chú: date đổi từ nơi khác → ô về rỗng ở lượt vẽ kế, lỗi tắt', () => {
    const b = boNgayGia();
    const store = storeGia();
    const v = noiKhayTim(store, b.goc(), () => v.ve());
    b.o.go('03/09/2026');
    b.o.go('03/09/20');
    b.o.roi();
    expect(b.coLoi()).toBe(true);
    store.xoaHetDieuKien();
    v.ve();
    expect(b.o.value).toBe('');
    expect(b.coLoi()).toBe(false);
  });

  it('chốt khi chưa lọc ngày: xoaNhap() đưa chữ gõ dở về rỗng, lỗi tắt', () => {
    const b = boNgayGia();
    const store = storeGia();
    const v = noiKhayTim(store, b.goc(), () => v.ve());
    b.o.go('12/1');
    b.o.roi();
    expect(b.coLoi()).toBe(true);
    expect(store.state.dieuKien.date).toBeNull();
    store.xoaHetDieuKien();
    v.xoaNhap();
    v.ve();
    expect(b.o.value).toBe('');
    expect(b.coLoi()).toBe(false);
  });

  it('không có ô thì xoaNhap vẫn gọi được', () => {
    const v = noiKhayTim(storeGia(), { getElementById: () => null });
    expect(() => v.xoaNhap()).not.toThrow();
  });

  it('ve() không ghi đè chữ đang gõ dở khi date trong state không đổi', () => {
    const b = boNgayGia();
    const store = storeGia();
    const v = noiKhayTim(store, b.goc(), () => v.ve());
    b.o.go('03/09/2026');
    b.o.go('03/0');
    v.ve();
    expect(b.o.value).toBe('03/0');
    expect(b.o.soLanGan).toBe(0);
  });
});
