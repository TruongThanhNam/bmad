// Story 8.1 — xin lưu trữ bền, và nói to hơn khi bị từ chối. Chạy trên CỔNG GIẢ: mỗi ca mang
// tên một hàng của I/O Matrix trong spec 8.1. `adapters/quota.js` không có test tự động theo
// luật — nó được kiểm bằng checklist README.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cauNhacSaoLuu } from '../app/core/backup.js';
import { MA_LOI } from '../app/core/errors.js';
import { APP_VERSION } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';
import { boChuThichJs } from './helpers/quet-nguon.js';

/**
 * Một tab trên kho cấu hình giả. `persist` là hàm ca test tự đưa vào; `kho` là Map khóa → chuỗi.
 * `docNem` / `ghiNem` / `xoaNem` làm phép tương ứng của `sessionStore` ném cho khóa `persistDenied`.
 */
function dungTab({ persist = () => Promise.resolve(true), kho = {} } = {}) {
  const map = new Map(Object.entries(kho));
  const loi = { docNem: false, ghiNem: false, xoaNem: false };
  const nhatKy = [];
  const thuc = {
    noteStore: { readAll: () => Promise.resolve([]) },
    sessionStore: {
      read: (k) => {
        if (k === 'persistDenied' && loi.docNem) throw new Error('đọc hỏng');
        return map.get(k) ?? null;
      },
      write: (k, v) => {
        if (k === 'persistDenied' && loi.ghiNem) throw new Error('ghi hỏng');
        map.set(k, v);
      },
      remove: (k) => {
        if (k === 'persistDenied' && loi.xoaNem) throw new Error('xóa hỏng');
        map.delete(k);
      },
      tabIdentity: () => 'tab-minh',
    },
    channel: { publish: () => {} },
    quota: { persist: (...a) => persist(...a) },
  };
  const ports = {};
  for (const tenCong of Object.keys(PORT_METHODS)) {
    ports[tenCong] = {};
    for (const ten of PORT_METHODS[tenCong]) {
      ports[tenCong][ten] = (...doiSo) => {
        nhatKy.push({ ten: `${tenCong}.${ten}`, doiSo });
        const ham = thuc[tenCong]?.[ten];
        if (ham === undefined) throw new Error(`cổng giả thiếu ${tenCong}.${ten}`);
        return ham(...doiSo);
      };
    }
  }
  const store = taoStore(ports);
  const goi = (ten) => nhatKy.filter((x) => x.ten === ten);
  return {
    store,
    map,
    loi,
    nhatKy,
    ghiCo: () => goi('sessionStore.write').filter((x) => x.doiSo[0] === 'persistDenied'),
    xoaCo: () => goi('sessionStore.remove'),
    phat: () => goi('channel.publish'),
    xoaNhatKy: () => {
      nhatKy.length = 0;
    },
  };
}

describe('Story 8.1 — xinLuuTruBen theo I/O Matrix', () => {
  it('Được cấp: gọi remove (vô hại), không phát tin, state false', async () => {
    const t = dungTab({ persist: () => Promise.resolve(true) });
    await t.store.khoiDong();
    t.xoaNhatKy();
    await t.store.xinLuuTruBen();
    expect(t.xoaCo()).toHaveLength(1);
    expect(t.xoaCo()[0].doiSo).toEqual(['persistDenied']);
    expect(t.phat()).toEqual([]);
    expect(t.store.state.persistDenied).toBe(false);
  });

  it('Bị từ chối: ghi cờ "1", state true, phát session-changed', async () => {
    const t = dungTab({ persist: () => Promise.resolve(false) });
    await t.store.khoiDong();
    t.xoaNhatKy();
    await t.store.xinLuuTruBen();
    expect(t.map.get('persistDenied')).toBe('1');
    expect(t.store.state.persistDenied).toBe(true);
    expect(t.phat()).toHaveLength(1);
    expect(t.phat()[0].doiSo[0].type).toBe('session-changed');
    expect(t.store.state.banner).toBeNull();
  });

  it('Bị từ chối, ghi ném: nuốt, state VẪN true (Q3A), không phát tin', async () => {
    const t = dungTab({ persist: () => Promise.resolve(false) });
    await t.store.khoiDong();
    t.loi.ghiNem = true;
    t.xoaNhatKy();
    await expect(t.store.xinLuuTruBen()).resolves.toBeUndefined();
    expect(t.store.state.persistDenied).toBe(true);
    expect(t.phat()).toEqual([]);
    expect(t.store.state.banner).toBeNull();
  });

  it('Treo không resolve: state giữ giá trị của khoiDong, không reject', async () => {
    const t = dungTab({ persist: () => new Promise(() => {}), kho: { persistDenied: '1' } });
    await t.store.khoiDong();
    let xong = false;
    t.store.xinLuuTruBen().then(
      () => {
        xong = true;
      },
      () => {
        throw new Error('không được reject');
      },
    );
    await new Promise((giai) => setTimeout(giai, 10));
    expect(xong).toBe(false);
    expect(t.store.state.persistDenied).toBe(true);
    expect(t.ghiCo()).toEqual([]);
    expect(t.xoaCo()).toEqual([]);
  });

  it('Resolve sau khi vào chỉ đọc: không write/remove, không phát, state không đổi', async () => {
    for (const ketQua of [true, false]) {
      let tra;
      const t = dungTab({
        persist: () =>
          new Promise((giai) => {
            tra = giai;
          }),
        kho: ketQua ? { persistDenied: '1' } : {},
      });
      await t.store.khoiDong();
      const truoc = t.store.state.persistDenied;
      const xin = t.store.xinLuuTruBen();
      await t.store.nhanBanTin({ v: 1, type: 'session-changed', from: 'tab-khac', appVersion: '0.0.0' });
      expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
      t.xoaNhatKy();
      tra(ketQua);
      await expect(xin).resolves.toBeUndefined();
      expect(t.ghiCo()).toEqual([]);
      expect(t.xoaCo()).toEqual([]);
      expect(t.phat()).toEqual([]);
      expect(t.store.state.persistDenied).toBe(truoc);
    }
  });

  it('napLaiPhien đọc cờ ném: cờ GIỮ giá trị đang có; theme/mốc vẫn cập nhật', async () => {
    const t = dungTab({ kho: { persistDenied: '1' } });
    await t.store.khoiDong('light');
    expect(t.store.state.persistDenied).toBe(true);
    t.map.set('theme', 'dark');
    t.map.set('lastBackupAt', '2026-09-20T09:00:00+05:30');
    t.map.delete('persistDenied');
    t.loi.docNem = true;
    await t.store.nhanBanTin({ v: 1, type: 'session-changed', from: 'tab-khac', appVersion: APP_VERSION });
    expect(t.store.state.theme).toBe('dark');
    expect(t.store.state.lastBackupAt).toBe('2026-09-20T09:00:00+05:30');
    expect(t.store.state.persistDenied).toBe(true);
  });

  it('napLaiPhien đọc lại cờ khi đọc được', async () => {
    const t = dungTab();
    await t.store.khoiDong();
    t.map.set('persistDenied', '1');
    await t.store.nhanBanTin({ v: 1, type: 'session-changed', from: 'tab-khac', appVersion: APP_VERSION });
    expect(t.store.state.persistDenied).toBe(true);
    t.map.delete('persistDenied');
    await t.store.nhanBanTin({ v: 1, type: 'session-changed', from: 'tab-khac', appVersion: APP_VERSION });
    expect(t.store.state.persistDenied).toBe(false);
  });

  it('Cờ rác: đọc là false; persist() → false thì ghi đè "1"', async () => {
    const t = dungTab({ persist: () => Promise.resolve(false), kho: { persistDenied: 'x' } });
    await t.store.khoiDong();
    expect(t.store.state.persistDenied).toBe(false);
    await t.store.xinLuuTruBen();
    expect(t.map.get('persistDenied')).toBe('1');
    expect(t.store.state.persistDenied).toBe(true);
  });

  it('Đọc ném lúc khởi động rồi được cấp: vẫn gọi remove, không phát tin; remove ném thì nuốt', async () => {
    for (const xoaNem of [false, true]) {
      const t = dungTab({ persist: () => Promise.resolve(true), kho: { persistDenied: '1' } });
      t.loi.docNem = true;
      await t.store.khoiDong();
      expect(t.store.state.persistDenied).toBe(false);
      t.loi.xoaNem = xoaNem;
      t.xoaNhatKy();
      await expect(t.store.xinLuuTruBen()).resolves.toBeUndefined();
      expect(t.xoaCo()).toHaveLength(1);
      expect(t.phat()).toEqual([]);
      expect(t.store.state.persistDenied).toBe(false);
    }
  });

  it('Được cấp sau khi từng bị từ chối: remove, state false, phát tin; dòng nhắc về ngưỡng 7', async () => {
    const t = dungTab({ persist: () => Promise.resolve(true), kho: { persistDenied: '1' } });
    await t.store.khoiDong();
    expect(t.store.state.persistDenied).toBe(true);
    t.xoaNhatKy();
    await t.store.xinLuuTruBen();
    expect(t.map.has('persistDenied')).toBe(false);
    expect(t.store.state.persistDenied).toBe(false);
    expect(t.phat()).toHaveLength(1);
    expect(
      cauNhacSaoLuu('2026-09-15T12:00:00+05:30', '2026-09-20T12:00:00+05:30', t.store.state.persistDenied),
    ).toBeNull();
  });

  it('Được cấp sau khi từng bị từ chối, remove ném: nuốt, state VẪN false (Q3A), không phát', async () => {
    const t = dungTab({ persist: () => Promise.resolve(true), kho: { persistDenied: '1' } });
    await t.store.khoiDong();
    t.loi.xoaNem = true;
    t.xoaNhatKy();
    await expect(t.store.xinLuuTruBen()).resolves.toBeUndefined();
    expect(t.store.state.persistDenied).toBe(false);
    expect(t.phat()).toEqual([]);
  });

  it('Từ chối lần nữa: cờ đã có, không ghi lại, không phát', async () => {
    const t = dungTab({ persist: () => Promise.resolve(false), kho: { persistDenied: '1' } });
    await t.store.khoiDong();
    t.xoaNhatKy();
    await t.store.xinLuuTruBen();
    expect(t.ghiCo()).toEqual([]);
    expect(t.phat()).toEqual([]);
    expect(t.store.state.persistDenied).toBe(true);
  });

  it('API vắng (null): no-op', async () => {
    const t = dungTab({ persist: () => Promise.resolve(null), kho: { persistDenied: '1' } });
    await t.store.khoiDong();
    t.xoaNhatKy();
    await t.store.xinLuuTruBen();
    expect(t.nhatKy.map((x) => x.ten)).toEqual(['quota.persist']);
    expect(t.store.state.persistDenied).toBe(true);
  });

  it('Cổng ném / reject: no-op, không dải băng, lời hứa resolve', async () => {
    const cacCong = [
      () => {
        throw new Error('ném');
      },
      () => Promise.reject(new Error('từ chối')),
    ];
    for (const persist of cacCong) {
      const t = dungTab({ persist });
      await t.store.khoiDong();
      t.xoaNhatKy();
      await expect(t.store.xinLuuTruBen()).resolves.toBeUndefined();
      expect(t.nhatKy.map((x) => x.ten)).toEqual(['quota.persist']);
      expect(t.store.state.banner).toBeNull();
      expect(t.store.state.persistDenied).toBe(false);
    }
  });

  it('Khởi động: kho có cờ thì khoiDong đặt persistDenied true ĐỒNG BỘ', () => {
    const t = dungTab({ kho: { persistDenied: '1' } });
    t.store.khoiDong();
    expect(t.store.state.persistDenied).toBe(true);
  });

  it('Khởi động: đọc cờ ném thì false, và mốc sao lưu vẫn đọc được', () => {
    const t = dungTab({ kho: { persistDenied: '1', lastBackupAt: '2026-09-20T09:00:00+05:30' } });
    t.loi.docNem = true;
    t.store.khoiDong();
    expect(t.store.state.persistDenied).toBe(false);
    expect(t.store.state.lastBackupAt).toBe('2026-09-20T09:00:00+05:30');
  });
});

describe('Story 8.1 — cauNhacSaoLuu hạ ngưỡng khi bị từ chối', () => {
  const BAY_GIO = '2026-09-20T12:00:00+05:30';
  const cach = (n) => `2026-09-${String(20 - n).padStart(2, '0')}T12:00:00+05:30`;

  it.each([
    [3, false, null],
    [4, false, null],
    [5, false, null],
    [8, false, 'Lần sao lưu gần nhất cách đây 8 ngày.'],
    [3, true, null],
    [4, true, 'Lần sao lưu gần nhất cách đây 4 ngày.'],
    [5, true, 'Lần sao lưu gần nhất cách đây 5 ngày.'],
    [8, true, 'Lần sao lưu gần nhất cách đây 8 ngày.'],
  ])('%i ngày, cờ %s → %s', (n, co, mongDoi) => {
    expect(cauNhacSaoLuu(cach(n), BAY_GIO, co)).toBe(mongDoi);
  });

  it('Chưa từng sao lưu: cờ có vẫn im lặng (Q2B)', () => {
    expect(cauNhacSaoLuu(null, BAY_GIO, true)).toBeNull();
  });
});

describe('Story 8.1 — main.js gọi xinLuuTruBen đúng một lần, sau khoiDong, giữ tiêu điểm', () => {
  const nguon = boChuThichJs(
    readFileSync(fileURLToPath(new URL('../app/main.js', import.meta.url)), 'utf8'),
  );

  it('xuất hiện đúng một lần, SAU khoiDong(, và treo veGiuTieuDiem', () => {
    const lan = [...nguon.matchAll(/xinLuuTruBen\(/g)];
    expect(lan).toHaveLength(1);
    expect(lan[0].index).toBeGreaterThan(nguon.indexOf('store.khoiDong('));
    expect(nguon).toMatch(/store\.xinLuuTruBen\(\)\.then\(\(\) => veGiuTieuDiem\(document, veTatCa\)\)/);
  });

  it('adapter quota đứng SAU ...congTam()', () => {
    const dau = nguon.indexOf('...congTam()');
    expect(dau).toBeGreaterThan(-1);
    expect(nguon.indexOf('quota: taoQuota()')).toBeGreaterThan(dau);
  });
});
