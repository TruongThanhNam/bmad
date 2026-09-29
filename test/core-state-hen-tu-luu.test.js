// Deferred spec-1-6: `tuLuuNoiDung` và `xoaGhiChu` thoả thuận về một hẹn tự lưu đang treo.
// Chạy trên CỔNG GIẢ. Kho giả áp phép ghi NGAY lúc được gọi (đúng thứ tự giao dịch của
// IndexedDB: put gọi trước thì hiệu lực trước remove gọi sau), còn lời hứa trả về thì do ca
// test nhả, để dựng được cảnh một `put` đang bay.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fold } from '../app/core/fold.js';
import { AUTOSAVE_MS } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';

afterEach(() => {
  vi.useRealTimers();
});

function ban(id, text, gio = '09:00:00') {
  const createdAt = `2026-09-14T${gio}+07:00`;
  return { id, createdAt, localDate: '2026-09-14', text, textFolded: fold(text) };
}

function dungTab(ghiChu, { putHoan = false } = {}) {
  const dia = new Map(ghiChu.map((m) => [m.id, m]));
  const choPut = [];
  const thuc = {
    noteStore: {
      readAll: () => Promise.resolve([...dia.values()]),
      put: (banGhi) => {
        dia.set(banGhi.id, banGhi);
        if (!putHoan) return Promise.resolve();
        return new Promise((giai) => choPut.push(giai));
      },
      remove: (id) => {
        dia.delete(id);
        return Promise.resolve();
      },
      claimDraft: ({ tabId }) => Promise.resolve({ tabId, text: '' }),
      putDraft: () => Promise.resolve(),
    },
    sessionStore: {
      read: () => null,
      write: () => {},
      remove: () => {},
      tabIdentity: () => 'tab-minh',
      writeTabIdentity: () => {},
    },
    channel: { publish: () => {}, subscribe: () => () => {} },
    quota: { persist: () => Promise.resolve(false) },
  };
  const ports = {};
  for (const tenCong of Object.keys(PORT_METHODS)) {
    ports[tenCong] = {};
    for (const ten of PORT_METHODS[tenCong]) {
      ports[tenCong][ten] = (...doiSo) => {
        const ham = thuc[tenCong]?.[ten];
        if (ham === undefined) throw new Error(`cổng giả thiếu ${tenCong}.${ten}`);
        return ham(...doiSo);
      };
    }
  }
  return {
    store: taoStore(ports),
    dia,
    nhaPut: () => {
      for (const giai of choPut.splice(0)) giai();
    },
  };
}

describe('spec-1-6 deferred — hẹn tự lưu đang treo', () => {
  it('A: sửa mẩu A có chữ chờ ghi rồi vào sửa mẩu B — chữ của A vẫn xuống kho', async () => {
    vi.useFakeTimers();
    const t = dungTab([ban('a', 'phở', '09:00:00'), ban('b', 'bún', '08:00:00')]);
    await t.store.khoiDong();

    t.store.vaoCheDoSua('a');
    t.store.tuLuuNoiDung('a', 'phở bò');
    // Hẹn của A chưa nổ: chuyển sang B trước hạn.
    t.store.vaoCheDoSua('b');
    expect(t.store.state.editing.id).toBe('b');
    expect(t.dia.get('a').text).toBe('phở');

    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);

    expect(t.dia.get('a').text).toBe('phở bò');
    expect(t.store.state.notes.find((m) => m.id === 'a').text).toBe('phở bò');
    // Mở lại A thấy đúng chữ mới nhất, và B không bị chạm.
    expect(t.dia.get('b').text).toBe('bún');
    t.store.vaoCheDoSua('a');
    expect(t.store.state.editing.text).toBe('phở bò');
  });

  it('B: xóa mẩu trong lúc put đang bay — bản ghi không sống lại', async () => {
    vi.useFakeTimers();
    const t = dungTab([ban('a', 'phở')], { putHoan: true });
    await t.store.khoiDong();

    t.store.vaoCheDoSua('a');
    t.store.tuLuuNoiDung('a', 'phở bò');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS); // put đã được gọi, chưa chốt
    expect(t.dia.get('a').text).toBe('phở bò');

    const xoa = t.store.xoaGhiChu('a');
    t.nhaPut();
    await xoa;
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);

    expect(t.dia.has('a')).toBe(false);
    expect(t.store.state.notes.some((m) => m.id === 'a')).toBe(false);
    expect(t.store.state.editing.seq.a).toBeUndefined();
  });

  it('B2: xóa khi hẹn còn treo (put chưa được gọi) — hẹn nổ ra bị bỏ, không hồi sinh', async () => {
    vi.useFakeTimers();
    const t = dungTab([ban('a', 'phở')]);
    await t.store.khoiDong();

    t.store.vaoCheDoSua('a');
    t.store.tuLuuNoiDung('a', 'phở bò');
    await t.store.xoaGhiChu('a');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);

    expect(t.dia.has('a')).toBe(false);
    expect(t.store.state.notes.some((m) => m.id === 'a')).toBe(false);
  });
});
