// Story 7.1 — đồng bộ ghi chú giữa các tab, chạy trên CỔNG GIẢ (không BroadcastChannel giả).
//
// Mỗi ca mang tên một hàng của I/O Matrix trong spec 7.1. Store thật; kho ghi chú là một mảng
// dùng chung giữa HAI store (hai "tab"), và kênh là một hàm nối tay: tin tab A phát được đưa
// vào `nhanBanTin` của tab B — đúng việc `main.js` làm với `subscribe`.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { LOAI_BANG } from '../app/core/banner.js';
import { fold } from '../app/core/fold.js';
import { MA_LOI, loiUngDung } from '../app/core/errors.js';
import { APP_VERSION, AUTOSAVE_MS } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';

afterEach(() => {
  vi.useRealTimers();
});

function portsDay() {
  const ports = {};
  for (const tenCong of Object.keys(PORT_METHODS)) {
    const cong = {};
    for (const tenPhuongThuc of PORT_METHODS[tenCong]) {
      cong[tenPhuongThuc] = () => {
        throw new Error(`không ca test nào được gọi ${tenCong}.${tenPhuongThuc}`);
      };
    }
    ports[tenCong] = cong;
  }
  return ports;
}

function ban(id, text, gio = '09:00:00') {
  const createdAt = `2026-09-14T${gio}+07:00`;
  return { id, createdAt, localDate: '2026-09-14', text, textFolded: fold(text) };
}

/** Kho dùng chung của hai tab: ghi chú, cấu hình, và nhật ký `readAll`. */
function dungKho(ghiChu = []) {
  return {
    notes: new Map(ghiChu.map((mau) => [mau.id, mau])),
    cauHinh: new Map(),
    soLanDoc: 0,
    tuChoiDoc: null,
  };
}

/**
 * Một "tab": store thật trên kho dùng chung. `daPhat` ghi mọi tin tab này phát.
 * `hoanDoc` giữ `readAll` treo cho tới khi ca test tự nhả (để dồn tin trong lúc bay).
 */
function dungTab(kho, tabId, { hoanDoc = false, anhLucGoi = false } = {}) {
  const daPhat = [];
  const choDoc = [];
  const ports = portsDay();
  ports.noteStore = {
    ...ports.noteStore,
    readAll() {
      kho.soLanDoc += 1;
      if (kho.tuChoiDoc !== null) return Promise.reject(loiUngDung(kho.tuChoiDoc));
      const anh = [...kho.notes.values()];
      if (!hoanDoc) return Promise.resolve(anh);
      // `anhLucGoi`: ảnh chụp lấy LÚC GỌI, như giao dịch đọc mở trước một giao dịch ghi.
      return new Promise((giai) => choDoc.push(() => giai(anhLucGoi ? anh : [...kho.notes.values()])));
    },
    commitDraft({ note }) {
      kho.notes.set(note.id, note);
      return Promise.resolve();
    },
    put(banGhi) {
      kho.notes.set(banGhi.id, banGhi);
      return Promise.resolve();
    },
    remove(id) {
      kho.notes.delete(id);
      return Promise.resolve();
    },
    replaceAll(danhSach) {
      kho.notes = new Map(danhSach.map((mau) => [mau.id, mau]));
      return Promise.resolve();
    },
    claimDraft: ({ tabId: id }) => Promise.resolve({ tabId: id, text: '' }),
    putDraft: () => Promise.resolve(),
  };
  ports.sessionStore = {
    ...ports.sessionStore,
    read: (khoa) => kho.cauHinh.get(khoa) ?? null,
    write: (khoa, giaTri) => {
      kho.cauHinh.set(khoa, giaTri);
    },
    tabIdentity: () => tabId,
  };
  ports.channel = { publish: (tin) => daPhat.push(tin), subscribe: () => () => {} };
  const store = taoStore(ports);
  return {
    store,
    daPhat,
    nhaDoc: () => {
      for (const giai of choDoc.splice(0)) giai();
    },
  };
}

/** Chuyển mọi tin tab `tu` đã phát (từ vị trí `tuViTri`) sang tab `den`, rồi đợi xong. */
async function chuyenTin(tu, den, tuViTri = 0) {
  for (const tin of tu.daPhat.slice(tuViTri)) await den.store.nhanBanTin(tin);
}

function tin(type, from = 'tab-a') {
  return { v: 1, type, from, appVersion: APP_VERSION };
}

describe('Story 7.1 — phát tin sau mọi lần ghi `notes` thành công', () => {
  it('chốt, sửa, xóa (nạp: xem core-state-nap.test.js): mỗi phép phát ĐÚNG MỘT `notes-changed`, bốn trường, sau khi ghi', async () => {
    vi.useFakeTimers();
    const kho = dungKho([ban('x', 'phở')]);
    const a = dungTab(kho, 'tab-a');
    await a.store.khoiDong();
    await a.store.khoiDongBanNhap();

    a.store.datBanNhap('mới');
    await a.store.chotGhiChu();
    expect(a.daPhat).toEqual([tin('notes-changed')]);

    a.store.vaoCheDoSua('x');
    const hen = a.store.tuLuuNoiDung('x', 'phở bò');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    await hen;
    expect(a.daPhat).toHaveLength(2);
    expect(kho.notes.get('x').text).toBe('phở bò');

    await a.store.xoaGhiChu('x');
    expect(a.daPhat).toHaveLength(3);
    expect(a.daPhat.every((t) => t.type === 'notes-changed')).toBe(true);
    expect(Object.keys(a.daPhat[0]).sort()).toEqual(['appVersion', 'from', 'type', 'v']);
  });

  it('ghi hỏng thì KHÔNG phát', async () => {
    // `remove` từ chối.
    const ports = portsDay();
    ports.noteStore = {
      ...ports.noteStore,
      readAll: () => Promise.resolve([ban('x', 'phở')]),
      remove: () => Promise.reject(loiUngDung(MA_LOI.QUOTA)),
    };
    const daPhat = [];
    ports.sessionStore = { ...ports.sessionStore, tabIdentity: () => 'tab-a' };
    ports.channel = { publish: (t) => daPhat.push(t), subscribe: () => () => {} };
    const hong = taoStore(ports);
    await hong.khoiDong();
    await hong.xoaGhiChu('x');
    expect(hong.state.banner).toBe(MA_LOI.QUOTA);
    expect(daPhat).toEqual([]);
    expect(hong.state.notes).toHaveLength(1);
  });

  it('kênh NÉM khi phát: action vẫn không bị từ chối', async () => {
    const ports = portsDay();
    ports.noteStore = {
      ...ports.noteStore,
      readAll: () => Promise.resolve([ban('x', 'phở')]),
      remove: () => Promise.resolve(),
    };
    ports.sessionStore = { ...ports.sessionStore, tabIdentity: () => 'tab-a' };
    ports.channel = {
      publish: () => {
        throw new Error('kênh đã đóng');
      },
      subscribe: () => () => {},
    };
    const s = taoStore(ports);
    await s.khoiDong();
    await expect(s.xoaGhiChu('x')).resolves.toBeUndefined();
    expect(s.state.notes).toEqual([]);
    expect(s.state.banner).toBeNull();
  });
});

describe('Story 7.1 — bản nháp không bao giờ phát tin', () => {
  it('mọi action ghi bản nháp: cổng kênh không nhận tin nào', async () => {
    vi.useFakeTimers();
    const kho = dungKho();
    const a = dungTab(kho, 'tab-a');
    await a.store.khoiDong();
    await a.store.khoiDongBanNhap();
    a.store.datBanNhap('đang gõ');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    await a.store.nhipTimBanNhap();
    // Chốt rỗng cũng đặt lại một hẹn ghi bản nháp.
    a.store.datBanNhap('   ');
    await a.store.chotGhiChu();
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(a.daPhat).toEqual([]);
  });
});

describe('Story 7.1 — I/O Matrix trên hai tab', () => {
  it('Chốt ở A: B hiện mẩu mới mà không F5', async () => {
    const kho = dungKho([ban('x', 'phở')]);
    const a = dungTab(kho, 'tab-a');
    const b = dungTab(kho, 'tab-b');
    await a.store.khoiDong();
    await b.store.khoiDong();
    await a.store.khoiDongBanNhap();
    a.store.datBanNhap('bún chả');
    await a.store.chotGhiChu();
    await chuyenTin(a, b);
    expect(b.store.state.notes.map((m) => m.text)).toEqual(
      a.store.state.notes.map((m) => m.text),
    );
    expect(b.store.state.notes.some((m) => m.text === 'bún chả')).toBe(true);
    // Đồng bộ thành công thì im lặng.
    expect(b.store.state.banner).toBeNull();
  });

  it('Tin của chính mình: bỏ qua, không đọc kho', async () => {
    const kho = dungKho();
    const a = dungTab(kho, 'tab-a');
    await a.store.khoiDong();
    const truoc = kho.soLanDoc;
    await a.store.nhanBanTin(tin('notes-changed', 'tab-a'));
    expect(kho.soLanDoc).toBe(truoc);
  });

  it('Tin rác: bỏ qua im lặng, không đọc kho, không ném', async () => {
    const kho = dungKho();
    const b = dungTab(kho, 'tab-b');
    await b.store.khoiDong();
    const truoc = kho.soLanDoc;
    const rac = [
      { type: 'x' },
      null,
      undefined,
      'notes-changed',
      { v: 1, type: 'notes-changed', from: 'tab-a' },
      { v: 2, type: 'notes-changed', from: 'tab-a', appVersion: APP_VERSION },
      { v: 1, type: 'x', from: 'tab-a', appVersion: APP_VERSION },
      { v: 1, type: 'notes-changed', from: 7, appVersion: APP_VERSION },
      { ...tin('notes-changed'), text: 'nội dung lậu' },
      [],
    ];
    for (const t of rac) await expect(b.store.nhanBanTin(t)).resolves.toBeUndefined();
    expect(kho.soLanDoc).toBe(truoc);
    expect(b.store.state.banner).toBeNull();
  });

  it('B đang gõ ô soạn: A chốt → ô soạn và bản nháp của B nguyên vẹn', async () => {
    const kho = dungKho();
    const a = dungTab(kho, 'tab-a');
    const b = dungTab(kho, 'tab-b');
    await a.store.khoiDong();
    await b.store.khoiDong();
    await a.store.khoiDongBanNhap();
    await b.store.khoiDongBanNhap();
    b.store.datBanNhap('B đang viết dở');
    const draftB = b.store.state.draft;
    a.store.datBanNhap('của A');
    await a.store.chotGhiChu();
    await chuyenTin(a, b);
    expect(b.store.state.draft).toBe(draftB);
    expect(b.store.state.notes).toHaveLength(1);
  });

  it('Sửa ở A: B hiện chữ mới sau khi `put` của A xong', async () => {
    vi.useFakeTimers();
    const kho = dungKho([ban('x', 'phở')]);
    const a = dungTab(kho, 'tab-a');
    const b = dungTab(kho, 'tab-b');
    await a.store.khoiDong();
    await b.store.khoiDong();
    a.store.vaoCheDoSua('x');
    const hen = a.store.tuLuuNoiDung('x', 'phở gà');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    await hen;
    await chuyenTin(a, b);
    expect(b.store.state.notes[0].text).toBe('phở gà');
  });

  it('A sửa X, B xóa X: A hiện dải băng `MAU_SUA_BI_XOA`, ô sửa ở lại, không hồi sinh', async () => {
    vi.useFakeTimers();
    const kho = dungKho([ban('x', 'phở'), ban('y', 'bún', '08:00:00')]);
    const a = dungTab(kho, 'tab-a');
    const b = dungTab(kho, 'tab-b');
    await a.store.khoiDong();
    await b.store.khoiDong();
    a.store.vaoCheDoSua('x');
    a.store.batTatMoRong('x');
    const hen = a.store.tuLuuNoiDung('x', 'phở chữ đang gõ');
    await b.store.xoaGhiChu('x');
    await chuyenTin(b, a);

    expect(a.store.state.banner).toBe(LOAI_BANG.MAU_SUA_BI_XOA);
    expect(a.store.state.notes.map((m) => m.id)).toEqual(['y']);
    // Chữ không mất trong im lặng: ô sửa vẫn mở với đúng chữ đang gõ.
    expect(a.store.state.editing.id).toBe('x');
    expect(a.store.state.editing.text).toBe('phở chữ đang gõ');
    expect(a.store.state.expandedIds).toEqual([]);

    // Hẹn tự lưu nổ: xóa thắng — không `put` nào dựng lại X.
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    await hen;
    expect(kho.notes.has('x')).toBe(false);
    // Gõ thêm cũng không hồi sinh.
    const hen2 = a.store.tuLuuNoiDung('x', 'phở chữ đang gõ thêm');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    await hen2;
    expect(kho.notes.has('x')).toBe(false);

    // Rời ô sửa: mẩu biến mất, không ghi gì xuống kho.
    await a.store.roiCheDoSua();
    expect(a.store.state.editing.id).toBeNull();
    expect(a.store.state.notes.map((m) => m.id)).toEqual(['y']);
    expect(kho.notes.has('x')).toBe(false);
    // Dải băng đóng được.
    a.store.dongDaiBang();
    expect(a.store.state.banner).toBeNull();
  });

  it('dải băng `MAU_SUA_BI_XOA` đã đóng bằng ✕ thì tin `notes-changed` sau KHÔNG bật lại', async () => {
    const kho = dungKho([ban('x', 'phở'), ban('y', 'bún', '08:00:00')]);
    const a = dungTab(kho, 'tab-a');
    await a.store.khoiDong();
    a.store.vaoCheDoSua('x');
    kho.notes.delete('x');
    await a.store.nhanBanTin(tin('notes-changed', 'tab-b'));
    expect(a.store.state.banner).toBe(LOAI_BANG.MAU_SUA_BI_XOA);
    a.store.dongDaiBang();
    kho.notes.delete('y');
    await a.store.nhanBanTin(tin('notes-changed', 'tab-b'));
    expect(a.store.state.editing.id).toBe('x');
    expect(a.store.state.banner).toBeNull();
  });

  it('ghi của chính tab trong lúc đọc lại đang bay: đọc thêm một lượt, ảnh cũ không thắng', async () => {
    const kho = dungKho([ban('x', 'phở'), ban('y', 'bún', '08:00:00')]);
    const a = dungTab(kho, 'tab-a', { hoanDoc: true, anhLucGoi: true });
    const nha = async (hua) => {
      let xong = false;
      hua.then(() => {
        xong = true;
      });
      for (let i = 0; i < 10 && !xong; i += 1) {
        await new Promise((giai) => setTimeout(giai, 0));
        a.nhaDoc();
      }
      return xong;
    };
    expect(await nha(a.store.khoiDong())).toBe(true);
    const truoc = kho.soLanDoc;
    const docLai = a.store.nhanBanTin(tin('notes-changed', 'tab-b'));
    await new Promise((giai) => setTimeout(giai, 0));
    expect(kho.soLanDoc - truoc).toBe(1);
    // Ảnh chụp của lượt đang bay vẫn còn 'x'.
    await a.store.xoaGhiChu('x');
    expect(await nha(docLai)).toBe(true);
    expect(kho.soLanDoc - truoc).toBe(2);
    expect(a.store.state.notes.map((m) => m.id)).toEqual(['y']);
  });

  it('mẩu đã rời ô sửa nhưng còn chữ chờ ghi, bị xóa ở tab khác: cũng dải băng', async () => {
    vi.useFakeTimers();
    const kho = dungKho([ban('x', 'phở')]);
    const a = dungTab(kho, 'tab-a');
    const b = dungTab(kho, 'tab-b');
    await a.store.khoiDong();
    await b.store.khoiDong();
    a.store.vaoCheDoSua('x');
    const hen = a.store.tuLuuNoiDung('x', 'chữ chờ');
    await a.store.roiCheDoSua();
    await b.store.xoaGhiChu('x');
    await chuyenTin(b, a);
    expect(a.store.state.banner).toBe(LOAI_BANG.MAU_SUA_BI_XOA);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    await hen;
    expect(kho.notes.has('x')).toBe(false);
  });

  it('mẩu KHÔNG đang sửa bị xóa ở tab khác: biến mất im lặng, không dải băng', async () => {
    const kho = dungKho([ban('x', 'phở'), ban('y', 'bún', '08:00:00')]);
    const a = dungTab(kho, 'tab-a');
    const b = dungTab(kho, 'tab-b');
    await a.store.khoiDong();
    await b.store.khoiDong();
    a.store.batTatMoRong('y');
    await b.store.xoaGhiChu('y');
    await chuyenTin(b, a);
    expect(a.store.state.notes.map((m) => m.id)).toEqual(['x']);
    expect(a.store.state.expandedIds).toEqual([]);
    expect(a.store.state.banner).toBeNull();
  });

  it('Đổi theme ở A: B đổi theme', async () => {
    const kho = dungKho();
    const a = dungTab(kho, 'tab-a');
    const b = dungTab(kho, 'tab-b');
    await a.store.khoiDong('light');
    await b.store.khoiDong('light');
    await a.store.datTheme('dark');
    await chuyenTin(a, b);
    expect(b.store.state.theme).toBe('dark');
  });

  it('theme lạ trong kho: B giữ theme đang bật', async () => {
    const kho = dungKho();
    kho.cauHinh.set('theme', 'tim');
    const b = dungTab(kho, 'tab-b');
    await b.store.khoiDong('dark');
    await b.store.nhanBanTin(tin('session-changed'));
    expect(b.store.state.theme).toBe('dark');
  });

  it('Xuất hoặc nạp ở A: mốc sao lưu của B đổi', async () => {
    const kho = dungKho();
    const b = dungTab(kho, 'tab-b');
    await b.store.khoiDong();
    expect(b.store.state.lastBackupAt).toBeNull();
    kho.cauHinh.set('lastBackupAt', '2026-09-25T10:00:00+07:00');
    await b.store.nhanBanTin(tin('session-changed'));
    expect(b.store.state.lastBackupAt).toBe('2026-09-25T10:00:00+07:00');
    // `session-changed` không đọc kho ghi chú.
    expect(kho.soLanDoc).toBe(1);
  });

  it('Nạp ở A: B thấy các mẩu vừa nạp', async () => {
    const kho = dungKho([ban('x', 'phở')]);
    const a = dungTab(kho, 'tab-a');
    const b = dungTab(kho, 'tab-b');
    await a.store.khoiDong();
    await b.store.khoiDong();
    kho.notes.set('z', ban('z', 'từ file', '07:00:00'));
    await b.store.nhanBanTin(tin('notes-changed'));
    expect(b.store.state.notes.map((m) => m.id)).toEqual(['x', 'z']);
  });

  it('Ba tin dồn trong lúc đang đọc lại: tối đa hai lượt `readAll`', async () => {
    const kho = dungKho([ban('x', 'phở')]);
    const b = dungTab(kho, 'tab-b', { hoanDoc: true });
    /** Nhả từng lượt `readAll` treo cho tới khi lời hứa chốt. */
    const nhaToiKhi = async (hua) => {
      let xong = false;
      hua.then(() => {
        xong = true;
      });
      for (let i = 0; i < 10 && !xong; i += 1) {
        await new Promise((giai) => setTimeout(giai, 0));
        b.nhaDoc();
      }
      await new Promise((giai) => setTimeout(giai, 0));
      return xong;
    };
    expect(await nhaToiKhi(b.store.khoiDong())).toBe(true);
    const truoc = kho.soLanDoc;
    const p1 = b.store.nhanBanTin(tin('notes-changed'));
    // Để lượt đầu thật sự bay rồi mới dồn thêm hai tin.
    await new Promise((giai) => setTimeout(giai, 0));
    const p2 = b.store.nhanBanTin(tin('notes-changed'));
    const p3 = b.store.nhanBanTin(tin('notes-changed'));
    kho.notes.set('y', ban('y', 'bún', '08:00:00'));
    expect(await nhaToiKhi(Promise.all([p1, p2, p3]))).toBe(true);
    expect(kho.soLanDoc - truoc).toBe(2);
    expect(b.store.state.notes.map((m) => m.id)).toEqual(['x', 'y']);
  });

  it('Đọc lại hỏng: dải băng mã kho, `notes` giữ nguyên', async () => {
    const kho = dungKho([ban('x', 'phở')]);
    const b = dungTab(kho, 'tab-b');
    await b.store.khoiDong();
    const truoc = b.store.state.notes;
    kho.tuChoiDoc = MA_LOI.DB;
    await expect(b.store.nhanBanTin(tin('notes-changed'))).resolves.toBeUndefined();
    expect(b.store.state.banner).toBe(MA_LOI.DB);
    expect(b.store.state.notes).toBe(truoc);
  });

  it('Khóa theo `id`: lượt đọc lại về TRƯỚC nhánh chốt → không hiện đôi', async () => {
    const kho = dungKho();
    let nhaCommit;
    // Tab riêng với `commitDraft` treo: bản ghi đã vào kho nhưng nhánh thành công chưa chạy.
    const ports = portsDay();
    const daPhat = [];
    ports.noteStore = {
      ...ports.noteStore,
      readAll: () => Promise.resolve([...kho.notes.values()]),
      commitDraft({ note }) {
        kho.notes.set(note.id, note);
        return new Promise((giai) => {
          nhaCommit = giai;
        });
      },
      claimDraft: ({ tabId }) => Promise.resolve({ tabId, text: '' }),
    };
    ports.sessionStore = { ...ports.sessionStore, tabIdentity: () => 'tab-c' };
    ports.channel = { publish: (t) => daPhat.push(t), subscribe: () => () => {} };
    const c = taoStore(ports);
    await c.khoiDong();
    await c.khoiDongBanNhap();
    c.datBanNhap('một lần thôi');
    const chot = c.chotGhiChu();
    await Promise.resolve();
    // Tab khác phát tin trong khe: lượt đọc lại mang bản ghi về trước nhánh thành công.
    await c.nhanBanTin(tin('notes-changed', 'tab-a'));
    expect(c.state.notes).toHaveLength(1);
    nhaCommit();
    await chot;
    expect(c.state.notes).toHaveLength(1);
    expect(daPhat.map((t) => t.type)).toEqual(['notes-changed']);
  });
});

describe('Story 7.1 — một kênh duy nhất', () => {
  it('chỉ `app/adapters/broadcast.js` chứa `BroadcastChannel`, với đúng một tên kênh `ghichu`', () => {
    const goc = join(import.meta.dirname, '..', 'app');
    const tep = [];
    const di = (thuMuc) => {
      for (const ten of readdirSync(thuMuc)) {
        const duong = join(thuMuc, ten);
        if (statSync(duong).isDirectory()) di(duong);
        else if (ten.endsWith('.js')) tep.push(duong);
      }
    };
    di(goc);
    const coKenh = tep.filter((duong) =>
      /new\s+BroadcastChannel\s*\(/.test(readFileSync(duong, 'utf8')),
    );
    expect(coKenh.map((d) => d.replaceAll('\\', '/').split('/app/')[1])).toEqual([
      'adapters/broadcast.js',
    ]);
    const nguon = readFileSync(coKenh[0], 'utf8');
    const ten = [...nguon.matchAll(/TEN_KENH\s*=\s*'([^']*)'/g)].map((k) => k[1]);
    expect(ten).toEqual(['ghichu']);
    expect(nguon).not.toMatch(/ghichu\.tab-sync/);
  });
});
