// Deferred spec-5-1: `ghiNgayKhiAn` xả chữ còn chờ hẹn `AUTOSAVE_MS` khi tab ẩn/đóng.
// Nỗ lực tối đa (IndexedDB không bảo đảm xong khi trang đóng), nên ở đây chỉ ghim phần lõi
// kiểm được: đúng chữ, đúng chỗ, không ghi rỗng/vượt trần, không hồi sinh, tôn trọng chỉ đọc.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fold } from '../app/core/fold.js';
import { AUTOSAVE_MS, MAX_NOTE_CHARS } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';

afterEach(() => {
  vi.useRealTimers();
});

function ban(id, text) {
  return { id, createdAt: '2026-09-14T09:00:00+07:00', localDate: '2026-09-14', text, textFolded: fold(text) };
}

function dungTab(ghiChu) {
  const dia = new Map(ghiChu.map((m) => [m.id, m]));
  const nhap = [];
  const goiPut = [];
  const thuc = {
    noteStore: {
      readAll: () => Promise.resolve([...dia.values()]),
      put: (banGhi) => {
        goiPut.push(banGhi.text);
        dia.set(banGhi.id, banGhi);
        return Promise.resolve();
      },
      remove: (id) => {
        dia.delete(id);
        return Promise.resolve();
      },
      claimDraft: ({ tabId }) => Promise.resolve({ tabId, text: '' }),
      putDraft: (d) => {
        nhap.push(d.text);
        return Promise.resolve();
      },
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
  return { store: taoStore(ports), dia, nhap, goiPut };
}

async function khoiDong(ghiChu) {
  vi.useFakeTimers();
  const t = dungTab(ghiChu);
  await t.store.khoiDong();
  await t.store.khoiDongBanNhap();
  return t;
}

describe('spec-5-1 deferred — ghiNgayKhiAn', () => {
  it('chữ đang sửa xuống kho NGAY, trước hẹn; state đổi sau khi ghi', async () => {
    const t = await khoiDong([ban('a', 'phở')]);
    t.store.vaoCheDoSua('a');
    t.store.tuLuuNoiDung('a', 'phở bò');
    expect(t.dia.get('a').text).toBe('phở');

    await t.store.ghiNgayKhiAn();

    expect(t.dia.get('a').text).toBe('phở bò');
    expect(t.store.state.notes[0].text).toBe('phở bò');
    // Hẹn nổ sau đó không ghi thêm gì khác (chữ đã rời chuDangCho, và nếu ghi lại thì cùng chữ).
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);
    expect(t.dia.get('a').text).toBe('phở bò');
  });

  it('xả cả mẩu đã rời chế độ sửa nhưng còn chờ hẹn', async () => {
    const t = await khoiDong([ban('a', 'phở'), ban('b', 'bún')]);
    t.store.vaoCheDoSua('a');
    t.store.tuLuuNoiDung('a', 'phở bò');
    t.store.vaoCheDoSua('b');
    t.store.tuLuuNoiDung('b', 'bún chả');

    await t.store.ghiNgayKhiAn();

    expect(t.dia.get('a').text).toBe('phở bò');
    expect(t.dia.get('b').text).toBe('bún chả');
  });

  it('không có gì chờ thì không chạm cổng', async () => {
    const t = await khoiDong([ban('a', 'phở')]);
    await t.store.ghiNgayKhiAn();
    expect(t.goiPut).toEqual([]);
    expect(t.nhap).toEqual([]);
  });

  it('chữ rỗng và chữ vượt trần KHÔNG xuống kho', async () => {
    const t = await khoiDong([ban('a', 'phở'), ban('b', 'bún')]);
    t.store.vaoCheDoSua('a');
    t.store.tuLuuNoiDung('a', '   ');
    t.store.vaoCheDoSua('b');
    t.store.tuLuuNoiDung('b', 'x'.repeat(MAX_NOTE_CHARS + 1));

    await t.store.ghiNgayKhiAn();

    expect(t.goiPut).toEqual([]);
  });

  it('mẩu đã bị xóa không hồi sinh', async () => {
    const t = await khoiDong([ban('a', 'phở')]);
    t.store.vaoCheDoSua('a');
    t.store.tuLuuNoiDung('a', 'phở bò');
    await t.store.xoaGhiChu('a');

    await t.store.ghiNgayKhiAn();

    expect(t.dia.has('a')).toBe(false);
  });

  it('bản nháp chưa xuống kho được xả ngay, và chỉ một lần', async () => {
    const t = await khoiDong([]);
    t.store.datBanNhap('nháp dở');
    expect(t.nhap).toEqual([]);

    await t.store.ghiNgayKhiAn();
    expect(t.nhap).toEqual(['nháp dở']);

    await t.store.ghiNgayKhiAn();
    expect(t.nhap).toEqual(['nháp dở']);
  });

  it('bản nháp vượt trần không xuống kho', async () => {
    const t = await khoiDong([]);
    t.store.datBanNhap('x'.repeat(MAX_NOTE_CHARS + 1));
    await t.store.ghiNgayKhiAn();
    expect(t.nhap).toEqual([]);
  });
});
