// Story 7.2 — lệch phiên bản và chế độ chỉ đọc, chạy trên CỔNG GIẢ (không BroadcastChannel giả).
//
// Mỗi ca mang tên một hàng của I/O Matrix trong spec 7.2. Store thật; mọi lời gọi cổng được ghi
// vào `nhatKy` để đếm các cổng GHI — ở chế độ chỉ đọc số đó phải bằng 0.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_VERSION } from '../app/core/backup.js';
import { fold } from '../app/core/fold.js';
import { MA_LOI, loiUngDung } from '../app/core/errors.js';
import { APP_VERSION, AUTOSAVE_MS } from '../app/core/limits.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ACTION_GHI, taoStore } from '../app/core/state.js';
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
  // Story 8.0: ghép với PORT_METHODS lộ ra phép ghi này bị sót; Story 8.1 dùng nó để xóa cờ.
  'sessionStore.remove',
  // Story 8.1: xin quyền là tác dụng phụ — không phải phép đọc.
  'quota.persist',
]);

/** Các phương thức cổng chỉ đọc — cùng `CONG_GHI` phủ đúng toàn bộ `PORT_METHODS`. */
const CONG_DOC = Object.freeze([
  'noteStore.readAll',
  'sessionStore.read',
  'sessionStore.tabIdentity',
  'channel.subscribe',
  'quota.estimate',
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
      remove: () => {},
      tabIdentity: () => 'tab-minh',
      writeTabIdentity: () => {},
    },
    channel: { publish: () => {}, subscribe: () => () => {} },
    fileIO: {
      exportFile: () => Promise.resolve(),
      readChosenFile: () => kho.chonFile ?? Promise.resolve(null),
    },
    quota: { persist: () => Promise.resolve(false) },
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

// Story 8.0 (retro E7 #27) — ép gác chỉ đọc thay cho trí nhớ. Hai ca bù nhau: (b) quét mã nguồn
// bắt action ghi "quên đăng ký" vào `ACTION_GHI`, (a) gọi thật bắt action "đăng ký mà quên gác".
describe('Story 8.0 — ACTION_GHI là tập action ghi, mỗi cái gác chỉ đọc', () => {
  /** Một ca gọi cho mỗi action ghi; phần dựng trước (vào sửa, gõ nháp) không chạm cổng ghi. */
  const GOI = Object.freeze({
    datTheme: (t) => t.store.datTheme(t.store.state.theme === 'dark' ? 'light' : 'dark'),
    xuatSaoLuu: (t) => t.store.xuatSaoLuu(),
    napSaoLuu: (t) => t.store.napSaoLuu(),
    chotGhiChu: (t) => {
      t.store.datBanNhap('chữ mới');
      return t.store.chotGhiChu();
    },
    xoaGhiChu: (t) => t.store.xoaGhiChu('x'),
    tuLuuNoiDung: (t) => {
      t.store.vaoCheDoSua('x');
      return t.store.tuLuuNoiDung('x', 'phở bò');
    },
    roiCheDoSua: (t) => {
      t.store.vaoCheDoSua('x');
      t.store.tuLuuNoiDung('x', '');
      return t.store.roiCheDoSua();
    },
    khoiDongBanNhap: (t) => t.store.khoiDongBanNhap(),
    datBanNhap: (t) => t.store.datBanNhap('nháp'),
    nhipTimBanNhap: (t) => t.store.nhipTimBanNhap(),
    xinLuuTruBen: (t) => t.store.xinLuuTruBen(),
  });

  it('CONG_GHI và CONG_DOC rời nhau và phủ đúng mọi phương thức trong PORT_METHODS', () => {
    const moi = Object.entries(PORT_METHODS).flatMap(([cong, ds]) => ds.map((p) => `${cong}.${p}`));
    expect(CONG_GHI.filter((x) => CONG_DOC.includes(x))).toEqual([]);
    expect([...CONG_GHI, ...CONG_DOC].sort()).toEqual([...moi].sort());
  });

  it('Mỗi tên trong ACTION_GHI có đúng một ca gọi, không ca thừa', () => {
    expect(Object.keys(GOI).sort()).toEqual([...ACTION_GHI].sort());
  });

  it.each([...ACTION_GHI])('Chỉ đọc: %s không chạm cổng ghi, không ném, không reject', async (ten) => {
    vi.useFakeTimers();
    const t = dungTab();
    await khoiDongDu(t);
    await vaoChiDoc(t);
    const ketQua = GOI[ten](t);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);
    // Lời hứa bị từ chối làm `await` ném và ca đỏ.
    await ketQua;
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);
    expect(t.ghi()).toEqual([]);
  });

  it('Quét taoStore: tập action export chạm cổng ghi (bắc cầu) bằng đúng ACTION_GHI', () => {
    const nguon = readFileSync(fileURLToPath(new URL('../app/core/state.js', import.meta.url)), 'utf8');
    const dau = nguon.indexOf('export function taoStore(');
    const cuoi = nguon.indexOf('  return Object.freeze({', dau);
    expect(dau).toBeGreaterThan(-1);
    expect(cuoi).toBeGreaterThan(dau);
    // Bỏ comment trước: JSDoc của hàm sau nằm ở đuôi khúc của hàm trước, nhắc tên là tạo cạnh giả.
    const than = nguon
      .slice(dau, cuoi)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|\s)\/\/.*$/gm, '$1');
    const khuc = new Map();
    const mauHam = /^ {2}(?:(?:async )?function (\w+)\(|const (\w+) = (?:async )?\()/gm;
    const moc = [...than.matchAll(mauHam)];
    moc.forEach((m, i) => {
      khuc.set(m[1] ?? m[2], than.slice(m.index + m[0].length, i + 1 < moc.length ? moc[i + 1].index : undefined));
    });
    const tenHam = [...khuc.keys()];
    const chamThang = new Set();
    const canh = new Map();
    for (const [ten, doan] of khuc) {
      for (const [, cong, phuongThuc] of doan.matchAll(/ports\.(\w+)\s*\.(\w+)\s*\(/g)) {
        if (CONG_GHI.includes(`${cong}.${phuongThuc}`)) chamThang.add(ten);
      }
      canh.set(
        ten,
        tenHam.filter((khac) => khac !== ten && new RegExp(`\\b${khac}\\b`).test(doan)),
      );
    }
    function chamGhi(ten, daQua = new Set()) {
      if (chamThang.has(ten)) return true;
      if (daQua.has(ten)) return false;
      daQua.add(ten);
      return canh.get(ten).some((k) => chamGhi(k, daQua));
    }
    const khoiExport = nguon.slice(cuoi, nguon.indexOf('});', cuoi));
    const tenExport = [...khoiExport.matchAll(/^ {4}(\w+),?$/gm)].map((m) => m[1]);
    expect(tenExport.length).toBeGreaterThan(10);
    for (const ten of tenExport) expect(khuc.has(ten), `không tìm thấy hàm ${ten}`).toBe(true);
    const chamThat = tenExport.filter((ten) => chamGhi(ten)).sort();
    expect(chamThat).toEqual([...new Set(ACTION_GHI)].sort());
  });
});
