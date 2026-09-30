// Deferred spec-2-3: chốt trong lúc `claimDraft` chưa trả lời — có để lại "bản nháp ma" không?
// Cổng giả mô phỏng đúng hợp đồng adapter: `claimDraft` giành bản ghi `drafts` của tab (giữ chữ
// cũ nếu có) rồi trả chữ đó; `commitDraft` với `draft: null` chỉ ghi `notes`.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fold } from '../app/core/fold.js';
import { AUTOSAVE_MS } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';

afterEach(() => {
  vi.useRealTimers();
});

/** Kho dùng chung giữa hai "kiếp" của tab, để thử tải lại trên cùng một kho. */
function dungKho(drafts = []) {
  return {
    notes: new Map(),
    drafts: new Map(drafts.map((d) => [d.tabId, d])),
  };
}

function dungTab(kho, { treoClaim }) {
  let nha;
  const thuc = {
    noteStore: {
      readAll: () => Promise.resolve([...kho.notes.values()]),
      put: (b) => {
        kho.notes.set(b.id, b);
        return Promise.resolve();
      },
      remove: (id) => {
        kho.notes.delete(id);
        return Promise.resolve();
      },
      claimDraft: ({ tabId }) => {
        const giao = () => {
          const cu = kho.drafts.get(tabId);
          return { tabId, text: cu === undefined ? '' : cu.text };
        };
        if (!treoClaim) return Promise.resolve(giao());
        return new Promise((xong) => {
          nha = () => xong(giao());
        });
      },
      putDraft: (d) => {
        kho.drafts.set(d.tabId, d);
        return Promise.resolve();
      },
      commitDraft: ({ note, draft }) => {
        kho.notes.set(note.id, { ...note });
        if (draft !== null) kho.drafts.set(draft.tabId, draft);
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
  return { store: taoStore(ports), nha: () => nha() };
}

describe('deferred spec-2-3 — chốt khi claimDraft chưa trả lời', () => {
  it('kho trống: chốt rồi nhả claim, `drafts` không giữ chữ vừa chốt, tải lại ô trống', async () => {
    vi.useFakeTimers();
    const kho = dungKho();
    const t = dungTab(kho, { treoClaim: true });
    await t.store.khoiDong();
    const khoiDongNhap = t.store.khoiDongBanNhap();

    t.store.datBanNhap('phở bò');
    expect(await t.store.chotGhiChu()).toBe(true);
    t.nha();
    await khoiDongNhap;
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 3);
    await t.store.ghiNgayKhiAn();

    expect([...kho.notes.values()].map((n) => n.text)).toEqual(['phở bò']);
    expect([...kho.drafts.values()].map((d) => d.text).filter((x) => x === 'phở bò')).toEqual([]);
    expect(t.store.state.draft.text).toBe('');

    const lai = dungTab(kho, { treoClaim: false });
    await lai.store.khoiDong();
    await lai.store.khoiDongBanNhap();
    expect(lai.store.state.draft.text).toBe('');
    expect(lai.store.state.notes).toHaveLength(1);
  });

  it('kho còn bản nháp kiếp trước: chữ vừa chốt không bao giờ xuống `drafts`, tải lại không hồi sinh', async () => {
    vi.useFakeTimers();
    const kho = dungKho([{ tabId: 'tab-minh', text: 'chữ kiếp trước', heartbeat: 'x' }]);
    const t = dungTab(kho, { treoClaim: true });
    await t.store.khoiDong();
    const khoiDongNhap = t.store.khoiDongBanNhap();

    t.store.datBanNhap('phở bò');
    await t.store.chotGhiChu();
    t.nha();
    await khoiDongNhap;
    // Ngay sau khi nhả claim, trước mọi hẹn: bản ghi là chữ kiếp trước, không phải chữ vừa chốt.
    expect(kho.drafts.get('tab-minh').text).toBe('chữ kiếp trước');
    expect(t.store.state.draft.text).toBe('');

    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 3);
    await t.store.ghiNgayKhiAn();
    // Kết quả đo: sau đó `seq` đã đổi nên bản nháp bị ghi rỗng (chữ kiếp trước bị đè bởi chữ
    // Nam vừa gõ rồi chốt) — không nơi nào giữ lại 'phở bò'.
    expect(kho.drafts.get('tab-minh').text).toBe('');

    const lai = dungTab(kho, { treoClaim: false });
    await lai.store.khoiDong();
    await lai.store.khoiDongBanNhap();
    expect(lai.store.state.draft.text).toBe('');
    expect(lai.store.state.notes).toHaveLength(1);
  });
});
