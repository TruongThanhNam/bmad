// Cây trợ năng của lưới (deferred spec-2-4 / spec-5-1) — phần nghiệm thu được mà không cần
// trình duyệt: câu chữ thuần, thuộc tính role/nhãn trên mẩu, và vùng thông báo chỉ nói khi
// `thongBao` được gọi. Cây trợ năng THẬT (role list/listitem, tên tính toán, vùng live có chữ
// sau chốt) do `npm run thu-bo-cuc` đo trên Chrome.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHON_THONG_BAO, cauThongBao, noiLuoi } from '../app/view/luoi.js';
import { nhanMau, veMau } from '../app/view/mau-giay.js';
import { boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const MAU_A = { id: 'a1', createdAt: '2026-09-14T09:05:00+07:00', text: 'phở', textFolded: 'pho' };

function phanTuGia() {
  return {
    textContent: '',
    className: '',
    con: [],
    thuocTinh: {},
    style: {},
    append(...moi) {
      this.con.push(...moi);
    },
    setAttribute(ten, giaTri) {
      this.thuocTinh[ten] = giaTri;
    },
    getAttribute(ten) {
      return this.thuocTinh[ten] ?? null;
    },
    addEventListener() {},
  };
}

const taiLieuGia = {
  createElement: () => phanTuGia(),
  createTextNode: (chu) => ({ nodeType: 3, textContent: chu }),
};

describe('cauThongBao / nhanMau — câu chữ thuần', () => {
  it('câu chốt là "Đã thêm ghi chú lúc HH:mm." và không lặp nội dung ghi chú', () => {
    expect(cauThongBao(MAU_A)).toBe('Đã thêm ghi chú lúc 09:05.');
    expect(cauThongBao(MAU_A)).not.toContain('phở');
  });

  it('nhãn mẩu: HH:mm ở khung nhìn mặc định, dd/MM/yyyy HH:mm khi đang có điều kiện', () => {
    expect(nhanMau(MAU_A, false)).toBe('ghi chú lúc 09:05');
    expect(nhanMau(MAU_A, true)).toBe('ghi chú lúc 14/09/2026 09:05');
  });

  it('createdAt hỏng thì ném, không nói một giờ rỗng', () => {
    expect(() => cauThongBao({ createdAt: 'hỏng' })).toThrow(TypeError);
    expect(() => nhanMau({ createdAt: 'hỏng' }, false)).toThrow(TypeError);
  });
});

describe('veMau — role, nhãn và mô tả', () => {
  const ve = (sua = null) =>
    veMau(MAU_A, taiLieuGia, false, () => {}, sua, undefined, undefined, undefined);

  it('mẩu chữ chết là listitem, có nhãn ngắn và aria-describedby trỏ đúng id của thân', () => {
    const mau = ve();
    expect(mau.getAttribute('role')).toBe('listitem');
    expect(mau.getAttribute('aria-label')).toBe('ghi chú lúc 09:05');
    const than = mau.con[1];
    expect(than.getAttribute('id')).toBe('mau-than-a1');
    expect(mau.getAttribute('aria-describedby')).toBe('mau-than-a1');
    expect(mau.getAttribute('tabindex')).toBe('0');
  });

  it('mẩu đang sửa vẫn là listitem nhưng không nhãn/mô tả — ô sửa mang nhãn riêng', () => {
    const mau = ve({ text: 'phở', go: () => {}, roi: () => {} });
    expect(mau.getAttribute('role')).toBe('listitem');
    expect(mau.getAttribute('aria-label')).toBeNull();
    expect(mau.getAttribute('aria-describedby')).toBeNull();
    expect(mau.con[1].getAttribute('aria-label')).toBe('nội dung ghi chú');
  });
});

describe('noiLuoi.thongBao — vùng live riêng', () => {
  function dungLuoi(coVung = true) {
    const vung = { con: [], replaceChildren(...moi) { this.con = moi; }, soLanThay: 0 };
    vung.replaceChildren = (...moi) => {
      vung.con = moi;
      vung.soLanThay += 1;
    };
    const luoi = { ownerDocument: taiLieuGia, replaceChildren() {}, querySelector: () => null };
    const goc = {
      querySelector: (s) => (s === '.luoi' ? luoi : s === CHON_THONG_BAO && coVung ? vung : null),
    };
    const store = {
      state: { editing: { id: null }, notes: [], dieuKien: { keyword: null, date: null }, expandedIds: [] },
    };
    return { vung, luoi: noiLuoi(store, goc) };
  }

  it('ban đầu và sau ve() thì im lặng — chỉ thongBao mới ghi vào vùng', () => {
    const { vung, luoi } = dungLuoi();
    luoi.ve();
    expect(vung.soLanThay).toBe(0);
    luoi.thongBao(MAU_A);
    expect(vung.con.map((n) => n.textContent)).toEqual(['Đã thêm ghi chú lúc 09:05.']);
  });

  it('hai lần chốt cùng phút vẫn là hai lần thay node (để trình đọc đọc lại)', () => {
    const { vung, luoi } = dungLuoi();
    luoi.thongBao(MAU_A);
    const truoc = vung.con[0];
    luoi.thongBao(MAU_A);
    expect(vung.soLanThay).toBe(2);
    expect(vung.con[0]).not.toBe(truoc);
  });

  it('không có vùng hay không có mẩu thì không ném và không ghi', () => {
    const khongVung = dungLuoi(false);
    expect(() => khongVung.luoi.thongBao(MAU_A)).not.toThrow();
    const { vung, luoi } = dungLuoi();
    luoi.thongBao(undefined);
    expect(vung.soLanThay).toBe(0);
  });
});

describe('index.html / main.js — chỗ nối tĩnh', () => {
  const html = readFileSync(`${repoRoot}index.html`, 'utf8');
  const main = readFileSync(`${repoRoot}app/main.js`, 'utf8');

  it('.luoi mang role="list" và rỗng; vùng thông báo tĩnh, status + polite, nằm NGOÀI .dai-bang', () => {
    expect(html).toMatch(/<div class="luoi" role="list"><\/div>/);
    expect(html).toMatch(
      /<div class="luoi-thong-bao" role="status" aria-live="polite"><\/div>/,
    );
  });

  it('main.js gọi thongBao đúng một lần, gác bằng cờ chốt thành công, và không từ ve()', () => {
    expect([...main.matchAll(/luoi\.thongBao\(/g)]).toHaveLength(1);
    expect(main).toMatch(/if \(daXoaDieuKien\) luoi\.thongBao\(/);
    const luoiJs = readFileSync(`${repoRoot}app/view/luoi.js`, 'utf8');
    expect(boChuThichJs(luoiJs)).not.toMatch(/banner|dai-bang/);
  });
});
