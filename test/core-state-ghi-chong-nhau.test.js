// Deferred spec-3-1: một phép ghi BẮT ĐẦU trước một phép ghi hỏng, nhưng xong SAU nó, không được
// tắt dải băng lỗi mà phép ghi hỏng vừa bật. Các phép ghi chồng nhau được — `dangChot` chỉ chặn
// chốt-với-chốt, còn tự lưu mẩu, xóa và chốt không gác nhau — nên thứ tự resolve phải được ghim.
// Cổng giả: mỗi lời gọi `put`/`remove` trả một lời hứa do ca test nhả hay từ chối.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fold } from '../app/core/fold.js';
import { AUTOSAVE_MS } from '../app/core/limits.js';
import { MA_LOI } from '../app/core/errors.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';

afterEach(() => {
  vi.useRealTimers();
});

function ban(id, text, gio) {
  const createdAt = `2026-09-14T${gio}+07:00`;
  return { id, createdAt, localDate: '2026-09-14', text, textFolded: fold(text) };
}

function loiMa(code) {
  return Object.assign(new Error(code), { code });
}

function dungTab(ghiChu) {
  const choPut = [];
  const choXoa = [];
  const thuc = {
    noteStore: {
      readAll: () => Promise.resolve(ghiChu),
      put: () => new Promise((giai, tu) => choPut.push({ giai, tu })),
      remove: () => new Promise((giai, tu) => choXoa.push({ giai, tu })),
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
  return { store: taoStore(ports), choPut, choXoa };
}

const nhaTatCa = () => new Promise((xong) => setTimeout(xong, 0));

describe('spec-3-1 deferred — phép ghi cũ xong sau phép ghi mới hỏng', () => {
  for (const ma of [MA_LOI.QUOTA, MA_LOI.DB]) {
    it(`tự lưu A treo, xóa B hỏng ${ma}, nhả A thành công → dải băng ${ma} còn`, async () => {
      vi.useFakeTimers();
      const t = dungTab([ban('a', 'phở', '09:00:00'), ban('b', 'bún', '08:00:00')]);
      await t.store.khoiDong();

      t.store.tuLuuNoiDung('a', 'phở bò');
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
      expect(t.choPut).toHaveLength(1); // ghi A đang bay

      const xoa = t.store.xoaGhiChu('b');
      expect(t.choXoa).toHaveLength(1);
      t.choXoa[0].tu(loiMa(ma));
      await xoa;
      expect(t.store.state.banner).toBe(ma);

      t.choPut[0].giai(); // A xong SAU B hỏng
      await vi.advanceTimersByTimeAsync(0);
      expect(t.store.state.banner).toBe(ma);
    });
  }

  it('phép ghi BẮT ĐẦU sau lần hỏng vẫn tắt dải băng (AD-8 không bị nới)', async () => {
    vi.useFakeTimers();
    const t = dungTab([ban('a', 'phở', '09:00:00'), ban('b', 'bún', '08:00:00')]);
    await t.store.khoiDong();

    const xoa = t.store.xoaGhiChu('b');
    t.choXoa[0].tu(loiMa(MA_LOI.QUOTA));
    await xoa;
    expect(t.store.state.banner).toBe(MA_LOI.QUOTA);

    const xoaA = t.store.xoaGhiChu('a');
    t.choXoa[1].giai();
    await xoaA;
    expect(t.store.state.banner).toBe(null);
  });
});
