// Story 7.2 — lệch phiên bản và chế độ chỉ đọc, chạy trên CỔNG GIẢ (không BroadcastChannel giả).
//
// Mỗi ca mang tên một hàng của I/O Matrix trong spec 7.2. Store thật; mọi lời gọi cổng được ghi
// vào `nhatKy` để đếm các cổng GHI — ở chế độ chỉ đọc số đó phải bằng 0.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_VERSION } from '../app/core/backup.js';
import { fold } from '../app/core/fold.js';
import { MA_LOI, loiUngDung } from '../app/core/errors.js';
import { APP_VERSION, AUTOSAVE_MS } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';

afterEach(() => {
  vi.useRealTimers();
});

const CONG_GHI = Object.freeze([
  'noteStore.commitDraft',
  'noteStore.put',
  'noteStore.remove',
  'noteStore.replaceAll',
  'noteStore.putDraft',
  'noteStore.claimDraft',
  'sessionStore.write',
  'sessionStore.writeTabIdentity',
  'fileIO.exportFile',
  'fileIO.readChosenFile',
  'channel.publish',
]);

function ban(id, text, gio = '09:00:00') {
  const createdAt = `2026-09-14T${gio}+07:00`;
  return { id, createdAt, localDate: '2026-09-14', text, textFolded: fold(text) };
}

/**
 * Một tab trên kho giả. `putHoan` giữ `put` treo tới khi ca test tự nhả (phép ghi đang bay).
 */
function dungTab({ ghiChu = [ban('x', 'phở')], putHoan = false } = {}) {
  const kho = { notes: new Map(ghiChu.map((m) => [m.id, m])), tuChoiDoc: null };
  const nhatKy = [];
  const choPut = [];
  const thuc = {
    noteStore: {
      readAll: () =>
        kho.tuChoiDoc !== null
          ? Promise.reject(loiUngDung(kho.tuChoiDoc))
          : Promise.resolve([...kho.notes.values()]),
      commitDraft: ({ note }) => {
        kho.notes.set(note.id, note);
        return Promise.resolve();
      },
      put: (banGhi) => {
        kho.notes.set(banGhi.id, banGhi);
        if (!putHoan) return Promise.resolve();
        return new Promise((giai) => choPut.push(giai));
      },
      remove: (id) => {
        kho.notes.delete(id);
        return Promise.resolve();
      },
      replaceAll: () => Promise.resolve(),
      claimDraft: ({ tabId }) => Promise.resolve({ tabId, text: '' }),
      putDraft: () => Promise.resolve(),
    },
    sessionStore: {
      read: () => null,
      write: () => {},
      tabIdentity: () => 'tab-minh',
      writeTabIdentity: () => {},
    },
    channel: { publish: () => {}, subscribe: () => () => {} },
    fileIO: {
      exportFile: () => Promise.resolve(),
      readChosenFile: () => kho.chonFile ?? Promise.resolve(null),
    },
  };
  const ports = {};
  for (const tenCong of Object.keys(PORT_METHODS)) {
    ports[tenCong] = {};
    for (const ten of PORT_METHODS[tenCong]) {
      ports[tenCong][ten] = (...doiSo) => {
        nhatKy.push(`${tenCong}.${ten}`);
        const ham = thuc[tenCong]?.[ten];
        if (ham === undefined) throw new Error(`cổng giả thiếu ${tenCong}.${ten}`);
        return ham(...doiSo);
      };
    }
  }
  const store = taoStore(ports);
  return {
    store,
    kho,
    nhatKy,
    ghi: () => nhatKy.filter((ten) => CONG_GHI.includes(ten)),
    nhaPut: () => {
      for (const giai of choPut.splice(0)) giai();
    },
  };
}

function tin(type, appVersion = '0.0.0', from = 'tab-khac') {
  return { v: 1, type, from, appVersion };
}

async function vaoChiDoc(t) {
  await t.store.nhanBanTin(tin('session-changed'));
  expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
  t.nhatKy.length = 0;
}

async function khoiDongDu(t) {
  await t.store.khoiDong();
  await t.store.khoiDongBanNhap();
}

describe('Story 7.2 — phát hiện lệch phiên bản', () => {
  it('Tin lệch: dải băng VERSION_SKEW, dongDaiBang không tắt nó', async () => {
    const t = dungTab();
    await khoiDongDu(t);
    await t.store.nhanBanTin(tin('session-changed'));
    expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
    t.store.dongDaiBang();
    expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
  });

  it('Tin cùng bản: như 7.1, không chỉ đọc', async () => {
    vi.useFakeTimers();
    const t = dungTab();
    await khoiDongDu(t);
    await t.store.nhanBanTin(tin('notes-changed', APP_VERSION));
    expect(t.store.state.banner).toBeNull();
    t.store.datBanNhap('mới');
    await t.store.chotGhiChu();
    expect(t.ghi()).toContain('noteStore.commitDraft');
  });

  it('Tin lệch sai hình dạng / của chính mình: bỏ qua, không chỉ đọc', async () => {
    const t = dungTab();
    await khoiDongDu(t);
    await t.store.nhanBanTin({ v: 1, type: 'notes-changed', from: 'tab-khac' });
    await t.store.nhanBanTin({ ...tin('notes-changed'), them: 1 });
    await t.store.nhanBanTin(tin('notes-changed', '0.0.0', 'tab-minh'));
    expect(t.store.state.banner).toBeNull();
  });
});

describe('Story 7.2 — chế độ chỉ đọc từ chối mọi action ghi', () => {
  it('Chốt khi chỉ đọc: cổng không gọi, chữ còn nguyên, điều kiện giữ nguyên, không phát', async () => {
    const t = dungTab();
    await khoiDongDu(t);
    t.store.datDieuKien({ keyword: 'phở' });
    await vaoChiDoc(t);
    t.store.datBanNhap('chữ của Nam');
    await expect(t.store.chotGhiChu()).resolves.toBe(false);
    expect(t.store.state.draft.text).toBe('chữ của Nam');
    expect(t.store.state.dieuKien.keyword).toBe('phở');
    expect(t.store.state.notes).toHaveLength(1);
    expect(t.ghi()).toEqual([]);
  });

  it('Gõ ô soạn / ô sửa: chữ vào RAM, sau AUTOSAVE_MS không putDraft/put', async () => {
    vi.useFakeTimers();
    const t = dungTab();
    await khoiDongDu(t);
    await vaoChiDoc(t);
    t.store.datBanNhap('nháp');
    t.store.vaoCheDoSua('x');
    const hen = t.store.tuLuuNoiDung('x', 'phở bò');
    expect(t.store.state.draft.text).toBe('nháp');
    expect(t.store.state.editing.text).toBe('phở bò');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);
    await hen;
    expect(t.ghi()).toEqual([]);
    // Chữ không mất: rời rồi mở lại vẫn thấy chữ vừa gõ.
    await t.store.roiCheDoSua();
    t.store.vaoCheDoSua('x');
    expect(t.store.state.editing.text).toBe('phở bò');
  });

  it('Hẹn treo lúc vào chỉ đọc: hẹn nổ không chạm cổng', async () => {
    vi.useFakeTimers();
    const t = dungTab();
    await khoiDongDu(t);
    t.store.datBanNhap('nháp');
    t.store.vaoCheDoSua('x');
    const hen = t.store.tuLuuNoiDung('x', 'phở bò');
    await vaoChiDoc(t);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);
    await hen;
    expect(t.ghi()).toEqual([]);
  });

  it('Ghi đang bay thành công sau khi vào chỉ đọc: dải băng vẫn VERSION_SKEW', async () => {
    vi.useFakeTimers();
    const t = dungTab({ putHoan: true });
    await khoiDongDu(t);
    t.store.vaoCheDoSua('x');
    const hen = t.store.tuLuuNoiDung('x', 'phở bò');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    await t.store.nhanBanTin(tin('session-changed'));
    t.nhatKy.length = 0;
    t.nhaPut();
    await hen;
    expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
    expect(t.nhatKy).not.toContain('channel.publish');
    expect(t.store.state.notes[0].text).toBe('phở bò');
  });

  it('Xóa / theme / xuất / nạp / nhịp tim / khởi động bản nháp / rời sửa rỗng: cổng không gọi, không phát, không lời hứa nào bị từ chối', async () => {
    const t = dungTab();
    await khoiDongDu(t);
    await vaoChiDoc(t);
    const themTruoc = t.store.state.theme;
    const themKhac = themTruoc === 'dark' ? 'light' : 'dark';
    await expect(t.store.xoaGhiChu('x')).resolves.toBeUndefined();
    await expect(t.store.datTheme(themKhac)).resolves.toBeUndefined();
    await expect(t.store.xuatSaoLuu()).resolves.toBeUndefined();
    await expect(t.store.napSaoLuu()).resolves.toBeUndefined();
    await expect(t.store.nhipTimBanNhap()).resolves.toBeUndefined();
    await expect(t.store.khoiDongBanNhap()).resolves.toBeUndefined();
    t.store.vaoCheDoSua('x');
    t.store.tuLuuNoiDung('x', '');
    await expect(t.store.roiCheDoSua()).resolves.toBeUndefined();
    expect(t.ghi()).toEqual([]);
    expect(t.store.state.notes).toHaveLength(1);
    expect(t.store.state.theme).toBe(themTruoc);
    expect(t.store.state.lastBackupAt).toBeNull();
  });

  it('Nạp đang chờ hộp chọn file lúc vào chỉ đọc: chọn xong không replaceAll, không ghi mốc', async () => {
    const t = dungTab();
    let traFile;
    t.kho.chonFile = new Promise((giai) => {
      traFile = giai;
    });
    await khoiDongDu(t);
    const nap = t.store.napSaoLuu();
    await vaoChiDoc(t);
    const exportedAt = '2026-09-14T10:00:00+07:00';
    traFile({ text: JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt, notes: [ban('y', 'bún')] }) });
    await expect(nap).resolves.toBeUndefined();
    expect(t.ghi()).toEqual([]);
    expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
    expect(t.store.state.lastBackupAt).toBeNull();
  });

  it('Tin notes-changed lệch: vào chỉ đọc VÀ lưới hiện mẩu mới', async () => {
    const t = dungTab();
    await khoiDongDu(t);
    t.kho.notes.set('y', ban('y', 'bún', '10:00:00'));
    await t.store.nhanBanTin(tin('notes-changed'));
    expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
    expect(t.store.state.notes.map((m) => m.id).sort()).toEqual(['x', 'y']);
  });

  it('Lỗi kho sau đó: readAll từ chối, dải băng vẫn VERSION_SKEW', async () => {
    const t = dungTab();
    await khoiDongDu(t);
    await vaoChiDoc(t);
    t.kho.tuChoiDoc = MA_LOI.DB;
    await t.store.nhanBanTin(tin('notes-changed', APP_VERSION));
    expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
  });
});
