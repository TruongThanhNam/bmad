// Story 8.2 — cảnh báo trước ngưỡng dung lượng, chạy trên CỔNG GIẢ (không adapter thật).
//
// Mỗi ca mang tên một dòng I/O Matrix của spec 8.2. Store thật; mọi lời gọi cổng vào `nhatKy`,
// nên "estimate KHÔNG được gọi" là một phép đếm chứ không phải một lời hứa. `estimate` trả lời
// bằng một lời hứa ca test tự nhả khi cần (`henUoc`).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_VERSION } from '../app/core/backup.js';
import { LOAI_BANG } from '../app/core/banner.js';
import { MA_LOI, loiUngDung } from '../app/core/errors.js';
import { fold } from '../app/core/fold.js';
import {
  AUTOSAVE_MS,
  MAX_NOTE_CHARS,
  QUOTA_WARN_FREE_BYTES,
  QUOTA_WARN_RATIO,
} from '../app/core/limits.js';
import { ACTION_GHI, taoStore, vuotNguongDungLuong } from '../app/core/state.js';
import { PORT_METHODS } from '../app/ports/index.js';
import { noiLuongXoa } from '../app/main.js';
import { boChuThichJs } from './helpers/quet-nguon.js';

afterEach(() => {
  vi.useRealTimers();
});

const MB = 1024 * 1024;
const GB = 1024 * MB;
const HANG_7 = LOAI_BANG.DUNG_LUONG_SAP_HET;

/** Ba ước lượng mẫu. `VUOT` chỉ vượt vế tỉ lệ (còn 20 GB trống) để ca "Vế tỉ lệ" cô lập đúng vế đó. */
const VUOT = Object.freeze({ used: 80 * GB, limit: 100 * GB });
const DUOI = Object.freeze({ used: 51 * MB, limit: 102 * MB });
const VUOT_BYTE = Object.freeze({ used: 10 * GB - 49 * MB, limit: 10 * GB });

function ban(id, text, gio = '09:00:00') {
  const createdAt = `2026-09-14T${gio}+07:00`;
  return { id, createdAt, localDate: '2026-09-14', text, textFolded: fold(text) };
}

function fileSaoLuu(notes) {
  return {
    text: JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-09-14T10:00:00+07:00',
      notes,
    }),
  };
}

/**
 * Một tab trên kho giả. `t.thuc` sửa được từ ca test để đổi hành vi một cổng; `t.uoc` là hàm
 * sinh câu trả lời của `estimate` (mặc định: dưới ngưỡng).
 */
function dungTab({ ghiChu = [ban('x', 'phở'), ban('y', 'bún', '08:00:00')] } = {}) {
  const kho = new Map(ghiChu.map((m) => [m.id, m]));
  const nhatKy = [];
  const t = { nhatKy, kho, uoc: () => Promise.resolve(DUOI) };
  t.thuc = {
    noteStore: {
      readAll: () => Promise.resolve([...kho.values()]),
      commitDraft: ({ note }) => {
        kho.set(note.id, note);
        return Promise.resolve();
      },
      put: (banGhi) => {
        kho.set(banGhi.id, banGhi);
        return Promise.resolve();
      },
      remove: (id) => {
        kho.delete(id);
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
      readChosenFile: () => Promise.resolve(null),
    },
    quota: {
      persist: () => Promise.resolve(true),
      estimate: () => t.uoc(),
    },
  };
  const ports = {};
  for (const tenCong of Object.keys(PORT_METHODS)) {
    ports[tenCong] = {};
    for (const ten of PORT_METHODS[tenCong]) {
      ports[tenCong][ten] = (...doiSo) => {
        nhatKy.push(`${tenCong}.${ten}`);
        return t.thuc[tenCong][ten](...doiSo);
      };
    }
  }
  t.store = taoStore(ports);
  t.soLanUoc = () => nhatKy.filter((ten) => ten === 'quota.estimate').length;
  /** Cho `estimate` lần kế treo; trả hàm nhả nó bằng một giá trị. */
  t.henUoc = () => {
    let nha;
    t.uoc = () =>
      new Promise((giai) => {
        nha = giai;
      });
    return (giaTri) => nha(giaTri);
  };
  return t;
}

async function khoiDong(t) {
  await t.store.khoiDong();
}

async function chot(t, text = 'ghi chú mới') {
  t.store.datBanNhap(text);
  return t.store.chotGhiChu();
}

/** Đưa hàng 7 lên: chốt một ghi chú rồi kiểm với ước lượng vượt. */
async function hienHang7(t) {
  await chot(t, 'đầy');
  t.uoc = () => Promise.resolve(VUOT);
  await t.store.kiemDungLuong();
  expect(t.store.state.banner).toBe(HANG_7);
}

function tin(type, appVersion = '0.0.0') {
  return { v: 1, type, from: 'tab-khac', appVersion };
}

describe('vuotNguongDungLuong — hàm thuần, ba câu trả lời', () => {
  it.each([
    ['vế tỉ lệ (còn nhiều byte trống)', { used: 80 * GB, limit: 100 * GB }, true],
    ['vế byte trống (tỉ lệ thấp)', { used: 10 * GB - 49 * MB, limit: 10 * GB }, true],
    ['dưới cả hai', { used: 51 * MB, limit: 102 * MB }, false],
    ['biên tỉ lệ đúng 0.80 → cảnh báo', { used: 8 * GB, limit: 10 * GB }, true],
    ['biên trống đúng 50 MB → không', { used: 50 * MB, limit: 50 * MB + QUOTA_WARN_FREE_BYTES }, false],
    ['trống 50 MB trừ một byte → cảnh báo', { used: 50 * MB + 1, limit: 50 * MB + QUOTA_WARN_FREE_BYTES }, true],
    ['used > limit hữu hạn → cảnh báo', { used: 200 * GB, limit: 100 * GB }, true],
    ['used 0 trên kho lớn → không', { used: 0, limit: 100 * GB }, false],
  ])('%s', (_ten, uoc, ky) => {
    expect(vuotNguongDungLuong(uoc)).toBe(ky);
  });

  it('tỉ lệ biên dùng đúng hằng QUOTA_WARN_RATIO', () => {
    const limit = 100 * GB;
    expect(vuotNguongDungLuong({ used: limit * QUOTA_WARN_RATIO, limit })).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['số trần', 5],
    ['mảng', [1, 2]],
    ['thiếu trường', {}],
    ['thiếu limit', { used: 1 }],
    ['used null', { used: null, limit: 100 }],
    ['limit null', { used: 1, limit: null }],
    ['NaN', { used: Number.NaN, limit: 100 }],
    ['Infinity', { used: 1, limit: Number.POSITIVE_INFINITY }],
    ['used âm', { used: -1, limit: 100 * GB }],
    ['limit 0', { used: 0, limit: 0 }],
    ['limit âm', { used: 0, limit: -5 }],
    ['chuỗi số', { used: '80', limit: '100' }],
  ])('số dị (%s) → null, không cảnh báo', (_ten, uoc) => {
    expect(vuotNguongDungLuong(uoc)).toBeNull();
  });
});

describe('Story 8.2 — kiemDungLuong theo I/O Matrix', () => {
  it('kiemDungLuong không vào ACTION_GHI', () => {
    expect(ACTION_GHI).not.toContain('kiemDungLuong');
  });

  it('Vế tỉ lệ: chốt OK, used 80 GB / limit 100 GB → hàng 7', async () => {
    const t = dungTab();
    await khoiDong(t);
    await chot(t);
    t.uoc = () => Promise.resolve(VUOT);
    await t.store.kiemDungLuong();
    expect(t.store.state.banner).toBe(HANG_7);
    expect(t.soLanUoc()).toBe(1);
  });

  it('Vế byte trống: sửa OK, limit 10 GB, trống 49 MB → hàng 7', async () => {
    vi.useFakeTimers();
    const t = dungTab();
    await khoiDong(t);
    t.store.vaoCheDoSua('x');
    const hen = t.store.tuLuuNoiDung('x', 'phở bò');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    await hen;
    t.uoc = () => Promise.resolve(VUOT_BYTE);
    await t.store.kiemDungLuong();
    expect(t.store.state.banner).toBe(HANG_7);
  });

  it('Dưới cả hai: hàng 7 đang hiện → null', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    await chot(t);
    t.uoc = () => Promise.resolve(DUOI);
    await t.store.kiemDungLuong();
    expect(t.store.state.banner).toBeNull();
  });

  it('Dưới cả hai: hàng khác đang hiện thì không chạm', async () => {
    const t = dungTab();
    await khoiDong(t);
    await chot(t);
    t.store.datBanNhap('a'.repeat(MAX_NOTE_CHARS + 1));
    expect(t.store.state.banner).toBe(MA_LOI.TOO_LONG);
    t.uoc = () => Promise.resolve(DUOI);
    await t.store.kiemDungLuong();
    expect(t.store.state.banner).toBe(MA_LOI.TOO_LONG);
  });

  it('Số dị: estimate trả null / thiếu trường → không cảnh báo', async () => {
    const t = dungTab();
    await khoiDong(t);
    for (const uoc of [null, { used: null, limit: null }, {}, { used: 1, limit: 0 }]) {
      await chot(t);
      t.uoc = () => Promise.resolve(uoc);
      await t.store.kiemDungLuong();
      expect(t.store.state.banner).toBeNull();
    }
  });

  it('Cổng hỏng: estimate ném đồng bộ → banner không đổi, lời hứa resolve', async () => {
    const t = dungTab();
    await khoiDong(t);
    await chot(t);
    t.uoc = () => {
      throw new Error('hỏng');
    };
    await expect(t.store.kiemDungLuong()).resolves.toBeUndefined();
    expect(t.store.state.banner).toBeNull();
  });

  it('Cổng hỏng: estimate reject → banner không đổi, lời hứa resolve', async () => {
    const t = dungTab();
    await khoiDong(t);
    await chot(t);
    t.uoc = () => Promise.reject(new Error('hỏng'));
    await expect(t.store.kiemDungLuong()).resolves.toBeUndefined();
    expect(t.store.state.banner).toBeNull();
  });

  it('estimate trả object có getter ném → không reject, banner không đổi', async () => {
    const t = dungTab();
    await khoiDong(t);
    await chot(t);
    t.uoc = () =>
      Promise.resolve({
        get used() {
          throw new Error('getter');
        },
        limit: 100,
      });
    await expect(t.store.kiemDungLuong()).resolves.toBeUndefined();
    expect(t.store.state.banner).toBeNull();
  });

  describe('Không ghi gì: estimate KHÔNG được gọi', () => {
    it('chưa có phép ghi nào (kể cả lúc khởi động)', async () => {
      const t = dungTab();
      await khoiDong(t);
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
    });

    it('chốt rỗng', async () => {
      const t = dungTab();
      await khoiDong(t);
      await chot(t, '   ');
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
    });

    it('chốt quá trần', async () => {
      const t = dungTab();
      await khoiDong(t);
      await chot(t, 'a'.repeat(MAX_NOTE_CHARS + 1));
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
    });

    it('commitDraft reject QUOTA → banner QUOTA, không kiểm', async () => {
      const t = dungTab();
      await khoiDong(t);
      t.thuc.noteStore.commitDraft = () => Promise.reject(loiUngDung(MA_LOI.QUOTA));
      await chot(t);
      expect(t.store.state.banner).toBe(MA_LOI.QUOTA);
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
      expect(t.store.state.banner).toBe(MA_LOI.QUOTA);
    });

    it('put reject QUOTA → banner QUOTA, không kiểm', async () => {
      vi.useFakeTimers();
      const t = dungTab();
      await khoiDong(t);
      t.thuc.noteStore.put = () => Promise.reject(loiUngDung(MA_LOI.QUOTA));
      t.store.vaoCheDoSua('x');
      const hen = t.store.tuLuuNoiDung('x', 'phở bò');
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
      await hen;
      expect(t.store.state.banner).toBe(MA_LOI.QUOTA);
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
    });

    it('put bị bỏ (seq cũ, chữ rỗng sau đó)', async () => {
      vi.useFakeTimers();
      const t = dungTab();
      await khoiDong(t);
      t.store.vaoCheDoSua('x');
      const hen1 = t.store.tuLuuNoiDung('x', 'phở bò');
      const hen2 = t.store.tuLuuNoiDung('x', '');
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
      await hen1;
      await hen2;
      expect(t.nhatKy).not.toContain('noteStore.put');
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
    });

    it('nạp: bấm Hủy', async () => {
      const t = dungTab();
      await khoiDong(t);
      await t.store.napSaoLuu();
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
    });

    it('nạp: file hỏng', async () => {
      const t = dungTab();
      await khoiDong(t);
      t.thuc.fileIO.readChosenFile = () => Promise.resolve({ text: 'rác' });
      await t.store.napSaoLuu();
      expect(t.store.state.banner).not.toBeNull();
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
    });

    it('nạp: readAll reject', async () => {
      const t = dungTab();
      await khoiDong(t);
      t.thuc.fileIO.readChosenFile = () => Promise.resolve(fileSaoLuu([ban('z', 'cơm')]));
      t.thuc.noteStore.readAll = () => Promise.reject(loiUngDung(MA_LOI.DB));
      await t.store.napSaoLuu();
      expect(t.store.state.banner).toBe(MA_LOI.DB);
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
    });

    it('nạp: replaceAll reject QUOTA → banner QUOTA, không kiểm', async () => {
      const t = dungTab();
      await khoiDong(t);
      t.thuc.fileIO.readChosenFile = () => Promise.resolve(fileSaoLuu([ban('z', 'cơm')]));
      t.thuc.noteStore.replaceAll = () => Promise.reject(loiUngDung(MA_LOI.QUOTA));
      await t.store.napSaoLuu();
      expect(t.store.state.banner).toBe(MA_LOI.QUOTA);
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
    });

    it('xóa hỏng: remove reject → không kiểm, banner theo AD-8', async () => {
      const t = dungTab();
      await khoiDong(t);
      t.thuc.noteStore.remove = () => Promise.reject(loiUngDung(MA_LOI.DB));
      await t.store.xoaGhiChu('x');
      expect(t.store.state.banner).toBe(MA_LOI.DB);
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(0);
    });

    it('kiểm lần hai không có phép ghi mới giữa chừng', async () => {
      const t = dungTab();
      await khoiDong(t);
      await chot(t);
      await t.store.kiemDungLuong();
      await t.store.kiemDungLuong();
      expect(t.soLanUoc()).toBe(1);
    });
  });

  it('Hai lần ghi OK trước một lần kiểm → estimate gọi đúng một lần', async () => {
    const t = dungTab();
    await khoiDong(t);
    await chot(t, 'một');
    await chot(t, 'hai');
    await t.store.kiemDungLuong();
    await t.store.kiemDungLuong();
    expect(t.soLanUoc()).toBe(1);
  });

  it('Chốt không chờ: estimate treo, chotGhiChu vẫn resolve, ô soạn trống, chốt lần hai được', async () => {
    const t = dungTab();
    await khoiDong(t);
    t.henUoc();
    await expect(chot(t, 'một')).resolves.toBe(true);
    expect(t.store.state.draft.text).toBe('');
    const dangKiem = t.store.kiemDungLuong();
    let xong = false;
    dangKiem.then(() => {
      xong = true;
    });
    await expect(chot(t, 'hai')).resolves.toBe(true);
    expect(t.store.state.draft.text).toBe('');
    expect(t.store.state.notes.map((m) => m.text)).toEqual(
      expect.arrayContaining(['một', 'hai']),
    );
    expect(xong).toBe(false);
  });

  it('Sau nạp: estimate VẪN gọi; hàng 7 bị gác, hàng 6 ở lại', async () => {
    const t = dungTab();
    await khoiDong(t);
    t.thuc.fileIO.readChosenFile = () => Promise.resolve(fileSaoLuu([ban('z', 'cơm')]));
    await t.store.napSaoLuu();
    expect(t.store.state.banner).toBe(LOAI_BANG.NAP_FILE_XONG);
    t.uoc = () => Promise.resolve(VUOT);
    await t.store.kiemDungLuong();
    expect(t.soLanUoc()).toBe(1);
    expect(t.store.state.banner).toBe(LOAI_BANG.NAP_FILE_XONG);
    expect(t.store.state.bannerSo).toEqual({ added: 1, skipped: 0 });
  });

  it('Chỉ đọc trước kiemDungLuong: không gọi estimate', async () => {
    const t = dungTab();
    await khoiDong(t);
    await chot(t);
    await t.store.nhanBanTin(tin('session-changed'));
    expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
    t.uoc = () => Promise.resolve(VUOT);
    await expect(t.store.kiemDungLuong()).resolves.toBeUndefined();
    expect(t.soLanUoc()).toBe(0);
    expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
  });

  it('Chỉ đọc trước khi estimate về: không đổi banner', async () => {
    const t = dungTab();
    await khoiDong(t);
    await chot(t);
    const nha = t.henUoc();
    const dangKiem = t.store.kiemDungLuong();
    await t.store.nhanBanTin(tin('session-changed'));
    nha(VUOT);
    await dangKiem;
    expect(t.store.state.banner).toBe(MA_LOI.VERSION_SKEW);
  });

  it('Đóng rồi ghi tiếp: không hiện lại, estimate KHÔNG được gọi', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    t.store.dongDaiBang();
    expect(t.store.state.banner).toBeNull();
    const truoc = t.soLanUoc();
    await chot(t);
    await t.store.kiemDungLuong();
    expect(t.soLanUoc()).toBe(truoc);
    expect(t.store.state.banner).toBeNull();
  });

  it('Đóng giữa lúc estimate bay: không hiện lại', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    await chot(t);
    const nha = t.henUoc();
    const dangKiem = t.store.kiemDungLuong();
    t.store.dongDaiBang();
    nha(VUOT);
    await dangKiem;
    expect(t.store.state.banner).toBeNull();
  });

  it('Đóng hàng khác: cờ đóng KHÔNG bật; lần kiểm sau vẫn cảnh báo', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    // Hàng 5 (cao hơn) thay hàng 7.
    t.store.datBanNhap('a'.repeat(MAX_NOTE_CHARS + 1));
    expect(t.store.state.banner).toBe(MA_LOI.TOO_LONG);
    t.store.dongDaiBang();
    expect(t.store.state.banner).toBeNull();
    await chot(t, 'ngắn');
    t.uoc = () => Promise.resolve(VUOT);
    await t.store.kiemDungLuong();
    expect(t.store.state.banner).toBe(HANG_7);
  });

  it('Vượt khi hàng 2–5 đang hiện: bị gác; hàng đó tắt sau thì hàng 7 không tự hiện', async () => {
    const t = dungTab();
    await khoiDong(t);
    await chot(t);
    t.store.datBanNhap('a'.repeat(MAX_NOTE_CHARS + 1));
    t.uoc = () => Promise.resolve(VUOT);
    await t.store.kiemDungLuong();
    expect(t.store.state.banner).toBe(MA_LOI.TOO_LONG);
    t.store.dongDaiBang();
    expect(t.store.state.banner).toBeNull();
    // Đợi lần ghi-rồi-kiểm kế.
    await chot(t, 'ngắn');
    expect(t.store.state.banner).toBeNull();
    await t.store.kiemDungLuong();
    expect(t.store.state.banner).toBe(HANG_7);
  });

  it('Kết quả cũ: lần 1 (vượt) về SAU lần 2 (dưới) → bị bỏ, banner theo lần 2', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    await chot(t, 'một');
    const nha1 = t.henUoc();
    const kiem1 = t.store.kiemDungLuong();
    await chot(t, 'hai');
    const nha2 = t.henUoc();
    const kiem2 = t.store.kiemDungLuong();
    nha2(DUOI);
    await kiem2;
    expect(t.store.state.banner).toBeNull();
    nha1(VUOT);
    await kiem1;
    expect(t.store.state.banner).toBeNull();
  });

  it('Không tắt khi ghi (Q3): ghi bản nháp / xóa / theme / sửa / chốt OK → hàng 7 VẪN hiện', async () => {
    vi.useFakeTimers();
    const t = dungTab();
    await khoiDong(t);
    await t.store.khoiDongBanNhap();
    await hienHang7(t);
    t.store.datBanNhap('nháp');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(t.nhatKy).toContain('noteStore.putDraft');
    expect(t.store.state.banner).toBe(HANG_7);
    await t.store.xoaGhiChu('y');
    expect(t.store.state.banner).toBe(HANG_7);
    await t.store.datTheme('dark');
    expect(t.store.state.banner).toBe(HANG_7);
    t.store.vaoCheDoSua('x');
    const hen = t.store.tuLuuNoiDung('x', 'phở bò');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    await hen;
    expect(t.nhatKy).toContain('noteStore.put');
    expect(t.store.state.banner).toBe(HANG_7);
    await chot(t, 'nữa');
    expect(t.store.state.banner).toBe(HANG_7);
  });

  it('Ghi OK vẫn tắt dải băng lỗi như cũ (AD-8): QUOTA rồi chốt OK → null', async () => {
    const t = dungTab();
    await khoiDong(t);
    t.thuc.noteStore.commitDraft = () => Promise.reject(loiUngDung(MA_LOI.QUOTA));
    await chot(t);
    expect(t.store.state.banner).toBe(MA_LOI.QUOTA);
    t.thuc.noteStore.commitDraft = () => Promise.resolve();
    await t.store.chotGhiChu();
    expect(t.store.state.banner).toBeNull();
  });

  it('Kiểm lỗi (Q3): hàng 7 hiện, estimate ném / null → hàng 7 VẪN hiện', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    await chot(t);
    t.uoc = () => {
      throw new Error('hỏng');
    };
    await t.store.kiemDungLuong();
    expect(t.store.state.banner).toBe(HANG_7);
    await chot(t);
    t.uoc = () => Promise.resolve(null);
    await t.store.kiemDungLuong();
    expect(t.store.state.banner).toBe(HANG_7);
    await chot(t);
    t.uoc = () => Promise.resolve({ used: null, limit: null });
    await t.store.kiemDungLuong();
    expect(t.store.state.banner).toBe(HANG_7);
  });

  it('Tải lại sau khi đóng: store mới, lần chốt đầu vượt → hiện lại', async () => {
    const t1 = dungTab();
    await khoiDong(t1);
    await hienHang7(t1);
    t1.store.dongDaiBang();
    const t2 = dungTab();
    await khoiDong(t2);
    await chot(t2);
    t2.uoc = () => Promise.resolve(VUOT);
    await t2.store.kiemDungLuong();
    expect(t2.store.state.banner).toBe(HANG_7);
  });

  it('Xóa giải phóng chỗ (Q6): xóa OK, estimate dưới ngưỡng → null', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    await t.store.xoaGhiChu('x');
    t.uoc = () => Promise.resolve(DUOI);
    await t.store.kiemDungLuong();
    expect(t.soLanUoc()).toBe(2);
    expect(t.store.state.banner).toBeNull();
  });

  it('Xóa vẫn vượt (Q6): hàng 7 vẫn hiện', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    await t.store.xoaGhiChu('x');
    t.uoc = () => Promise.resolve(VUOT);
    await t.store.kiemDungLuong();
    expect(t.soLanUoc()).toBe(2);
    expect(t.store.state.banner).toBe(HANG_7);
  });

  it('Xóa vẫn vượt sau khi đóng: không hiện lại', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    t.store.dongDaiBang();
    await t.store.xoaGhiChu('x');
    await t.store.kiemDungLuong();
    expect(t.soLanUoc()).toBe(1);
    expect(t.store.state.banner).toBeNull();
  });

  it('Xuất sao lưu: hàng 7 VẪN hiện, và xuất không kích kiểm', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    await t.store.xuatSaoLuu();
    expect(t.nhatKy).toContain('fileIO.exportFile');
    expect(t.store.state.banner).toBe(HANG_7);
    await t.store.kiemDungLuong();
    expect(t.soLanUoc()).toBe(1);
  });

  it('Ghi hỏng thật khi hàng 7 hiện: QUOTA (hàng 2) thay nó, không đóng được', async () => {
    const t = dungTab();
    await khoiDong(t);
    await hienHang7(t);
    t.thuc.noteStore.commitDraft = () => Promise.reject(loiUngDung(MA_LOI.QUOTA));
    await chot(t);
    expect(t.store.state.banner).toBe(MA_LOI.QUOTA);
    t.store.dongDaiBang();
    expect(t.store.state.banner).toBe(MA_LOI.QUOTA);
  });
});

describe('noiLuongXoa — tham số sauKhiXoa (Story 8.2 Q6)', () => {
  it('chạy SAU lượt vẽ thứ hai của `xoa`, và mặc định không làm gì', async () => {
    const t = dungTab();
    await khoiDong(t);
    const goc = { activeElement: null, querySelector: () => null, getElementById: () => null };
    const nhat = [];
    const luong = noiLuongXoa(
      t.store,
      goc,
      () => nhat.push('ve'),
      undefined,
      () => nhat.push('kiem'),
    );
    await luong.xoa('x');
    expect(nhat).toEqual(['ve', 've', 'kiem']);
    const macDinh = noiLuongXoa(t.store, goc, () => {});
    await expect(macDinh.xoa('y')).resolves.toBeUndefined();
  });
});

describe('app/main.js — nối lần kiểm dung lượng (quét mã nguồn)', () => {
  const main = boChuThichJs(
    readFileSync(fileURLToPath(new URL('../app/main.js', import.meta.url)), 'utf8'),
  );
  const dem = (mau) => [...main.matchAll(mau)].length;

  it('kiemDungLuong( đúng một lần, kiemRoiVe( đúng bốn lần', () => {
    expect(dem(/\bkiemDungLuong\s*\(/g)).toBe(1);
    expect(dem(/\bkiemRoiVe\s*\(/g)).toBe(4);
    // Không dạng `.then(kiemRoiVe)` — nó truyền kết quả vào và lọt khỏi phép đếm.
    expect(main).not.toMatch(/\.then\s*\(\s*kiemRoiVe\s*\)/);
  });

  it('kiemRoiVe: kiểm rồi vẽ giữ tiêu điểm bằng neo undefined trần (Story 8.4)', () => {
    // Phép thử "tiêu điểm trong dải băng" nằm TRONG `veGiuTieuDiem` — ca chạy thật ở
    // `test/giu-tieu-diem.test.js`; ở đây chỉ ghim rằng `kiemRoiVe` không còn nhánh riêng.
    expect(main).toMatch(
      /\bkiemRoiVe\s*=\s*\(\s*\)\s*=>\s*store\s*\.\s*kiemDungLuong\s*\(\s*\)\s*\.\s*then\s*\(\s*\(\s*\)\s*=>\s*veGiuTieuDiem\s*\(\s*document\s*,\s*veTatCa\s*\)\s*\)/,
    );
    expect(main).not.toMatch(/tieuDiemTrongDaiBang/);
  });

  it('bốn điểm nối, mỗi cái SAU lượt vẽ sẵn có', () => {
    // Tự lưu sửa: chuỗi cũ giữ nguyên, lần kiểm treo sau.
    expect(main).toMatch(
      /tuLuuNoiDung\s*\([^)]*\)\s*\.\s*then\s*\(\s*\(\s*\)\s*=>\s*veGiuTieuDiem\s*\(\s*document\s*,\s*veTatCa\s*\)\s*\)\s*\.\s*then\s*\(\s*\(\s*\)\s*=>\s*kiemRoiVe\s*\(\s*\)\s*\)/,
    );
    // Chốt: cuối thân `veSauChot`.
    const sauChot = /\bveSauChot\s*=\s*\(\s*[\w$]+\s*\)\s*=>\s*\{([^}]*)\}/.exec(main);
    expect(sauChot).not.toBeNull();
    expect(sauChot[1]).toMatch(/veTatCa\s*\(\s*\)\s*;\s*kiemRoiVe\s*\(\s*\)\s*;?\s*$/);
    // Nạp.
    expect(main).toMatch(
      /\bnapRoiVe\s*=\s*\(\s*\)\s*=>\s*\{\s*(?:\/\/[^\n]*\s*)*veGiuTieuDiem\s*\(\s*document\s*,\s*veTatCa\s*\)\s*;\s*kiemRoiVe\s*\(\s*\)\s*;?\s*\}/,
    );
    // Xóa qua hộp thoại: tham số thứ năm của `noiLuongXoa`.
    expect(main).toMatch(/luotRoiSua\s*,\s*\(\s*\)\s*=>\s*kiemRoiVe\s*\(\s*\)\s*,?\s*\)/);
  });

  it('không kiểm ở đường rời sửa, và không kiểm lúc khởi động', () => {
    const roi = /\broiSuaRoiVe\s*=\s*\(\s*id\s*\)\s*=>\s*\{([\s\S]*?)\n  \}/.exec(main);
    expect(roi).not.toBeNull();
    expect(roi[1]).not.toMatch(/kiem/);
    expect(main).not.toMatch(/khoiDong\s*\([^)]*\)\s*\.\s*then\s*\([^)]*kiem/);
  });
});
