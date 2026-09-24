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

function gocGia(o) {
  return { getElementById: (id) => (id === 'o-tim' ? o : null) };
}

/** Store giả tối giản: đúng `state.dieuKien` và `datDieuKien` chuẩn hóa `''` → `null` như lõi. */
function storeGia() {
  const phat = [];
  const store = {
    state: { dieuKien: { keyword: null, date: null } },
    phat,
    datDieuKien(partial) {
      phat.push(partial);
      const keyword = partial.keyword === '' ? null : partial.keyword;
      store.state = { dieuKien: { ...store.state.dieuKien, keyword } };
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
    expect(ma).not.toMatch(/import\s/);
  });
});
