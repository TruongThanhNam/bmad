// Story 4.2 — action `xuatSaoLuu`, tức chỗ ba thứ nối lại: lõi dựng file, cổng `fileIO` trao
// nó đi, kho cấu hình ghi lại mốc.
//
// Mọi ca ở đây hỏi cùng một câu dưới hai chiều: "cái gì ra khỏi máy" và "cái gì KHÔNG hiện lên
// màn hình". Nửa sau quan trọng ngang nửa đầu — xuất sao lưu là thao tác duy nhất của sản phẩm
// đã hứa im lặng tuyệt đối ở CẢ HAI nhánh (AD-16, và quyết định đã chốt của spec: cổng từ chối
// thì không dải băng, không mã lỗi mới, `core/errors.js` không phải nới thêm gì).

import { describe, expect, it } from 'vitest';
import { taoStore } from '../app/core/state.js';
import { MA_LOI, loiUngDung } from '../app/core/errors.js';
import { APP_VERSION } from '../app/core/limits.js';
import { PORT_METHODS } from '../app/ports/index.js';

/** Tập cổng đủ mọi phương thức — mọi phương thức chưa được thay thì NÉM khi bị gọi. */
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

/** Ba ghi chú, cố tình KHÔNG theo thứ tự — `khoiDong` sắp lại giảm dần theo `localStamp`. */
function baGhiChu() {
  return [
    { id: 'id-2', createdAt: '2026-09-15T09:12:00+07:00', localDate: '2026-09-15', text: 'hai', textFolded: 'hai' },
    { id: 'id-3', createdAt: '2026-09-15T14:05:00+07:00', localDate: '2026-09-15', text: 'ba', textFolded: 'ba' },
    { id: 'id-1', createdAt: '2026-09-14T22:00:00+07:00', localDate: '2026-09-14', text: 'một', textFolded: 'mot' },
  ];
}

/**
 * Store thật + ba cổng ghi nhật ký được, cùng khuôn `theme.test.js`.
 *
 * @param {object} [tuyChon] `notes` ban đầu; `tuChoiXuat` để cổng file trả lời hỏng; `nemKhiXuat`
 *   để nó ném ĐỒNG BỘ; `nemKhiGhiMoc` để kho cấu hình từ chối ghi `lastBackupAt`.
 */
function dungSan(tuyChon = {}) {
  const {
    notes = baGhiChu(),
    tuChoiXuat = false,
    nemKhiXuat = false,
    nemKhiGhiMoc = null,
  } = tuyChon;
  const daXuat = [];
  const daGhiKho = [];
  const daPhat = [];
  const ports = portsDay();
  ports.noteStore = {
    ...ports.noteStore,
    readAll: () => Promise.resolve(notes),
    // Bản nháp của tab này không bao giờ xuống kho trong các ca dưới đây (chưa `khoiDongBanNhap`
    // nên chưa có chủ), nhưng một phương thức im lặng ở đây là cách một lời gọi lạc không bị bắt.
  };
  ports.sessionStore = {
    ...ports.sessionStore,
    write(key, value) {
      if (nemKhiGhiMoc !== null) throw loiUngDung(nemKhiGhiMoc);
      daGhiKho.push([key, value]);
    },
    tabIdentity: () => 'tab-nay',
  };
  ports.channel = { publish: (tin) => daPhat.push(tin), subscribe() {} };
  ports.fileIO = {
    ...ports.fileIO,
    exportFile(name, text) {
      daXuat.push([name, text]);
      if (nemKhiXuat) throw loiUngDung(MA_LOI.DB);
      return tuChoiXuat ? Promise.reject(loiUngDung(MA_LOI.DB)) : Promise.resolve();
    },
  };
  const store = taoStore(ports);
  return { store, daXuat, daGhiKho, daPhat, san: store.khoiDong() };
}

/** File vừa được trao đi, đã phân tích lại. */
function fileCuoi(bo) {
  return JSON.parse(bo.daXuat[bo.daXuat.length - 1][1]);
}

describe('xuatSaoLuu — cái gì ra khỏi máy', () => {
  it('gọi cổng ĐÚNG MỘT LẦN, với tên file và nội dung do lõi dựng', async () => {
    const bo = dungSan();
    await bo.san;
    await bo.store.xuatSaoLuu();
    expect(bo.daXuat).toHaveLength(1);
    const [ten, noiDung] = bo.daXuat[0];
    expect(ten).toMatch(/^ghi-chu-hang-ngay-\d{4}-\d{2}-\d{2}\.json$/);
    expect(ten).toBe(`ghi-chu-hang-ngay-${JSON.parse(noiDung).exportedAt.slice(0, 10)}.json`);
  });

  it('file chứa TOÀN BỘ tầng A dù bộ lọc đang cắt xuống còn một kết quả', async () => {
    const bo = dungSan();
    await bo.san;
    bo.store.datDieuKien({ keyword: 'ba', date: '2026-09-15' });
    await bo.store.xuatSaoLuu();
    // Ba ghi chú, theo đúng thứ tự RAM (giảm dần theo khóa sắp xếp).
    expect(fileCuoi(bo).notes.map((mau) => mau.id)).toEqual(['id-3', 'id-2', 'id-1']);
    // Và bộ lọc không bị đụng tới: xuất sao lưu không đổi một trường state nào.
    expect(bo.store.state.dieuKien).toEqual({ keyword: 'ba', date: '2026-09-15' });
  });

  it('bản nháp đang gõ KHÔNG lọt vào file — nó là tầng B, không phải một ghi chú', async () => {
    const bo = dungSan();
    await bo.san;
    bo.store.datBanNhap('chữ đang gõ dở');
    await bo.store.xuatSaoLuu();
    expect(bo.daXuat[0][1]).not.toMatch(/chữ đang gõ dở/);
    expect(fileCuoi(bo).notes).toHaveLength(3);
  });

  it('kho rỗng vẫn xuất, và file vẫn hợp lệ', async () => {
    const bo = dungSan({ notes: [] });
    await bo.san;
    await bo.store.xuatSaoLuu();
    expect(fileCuoi(bo).notes).toEqual([]);
    expect(bo.daGhiKho).toHaveLength(1);
  });

  it('nguồn là RAM, không phải kho: `readAll` KHÔNG bị gọi lần thứ hai', async () => {
    let soLanDoc = 0;
    const ports = portsDay();
    ports.noteStore = {
      ...ports.noteStore,
      readAll: () => {
        soLanDoc += 1;
        return Promise.resolve(baGhiChu());
      },
    };
    ports.sessionStore = { ...ports.sessionStore, write() {}, tabIdentity: () => 'tab-nay' };
    ports.channel = { publish() {}, subscribe() {} };
    ports.fileIO = { ...ports.fileIO, exportFile: () => Promise.resolve() };
    const store = taoStore(ports);
    await store.khoiDong();
    await store.xuatSaoLuu();
    expect(soLanDoc).toBe(1);
  });

  it('bấm hai lần liên tiếp cho hai file, mỗi lần một `exportedAt` riêng của nó', async () => {
    const bo = dungSan();
    await bo.san;
    const hai = Promise.all([bo.store.xuatSaoLuu(), bo.store.xuatSaoLuu()]);
    await hai;
    expect(bo.daXuat).toHaveLength(2);
    expect(bo.daGhiKho).toHaveLength(2);
    // Mỗi lần gọi dựng mốc của RIÊNG nó, và ghi xuống kho đúng mốc trong CHÍNH file của nó —
    // không phải mốc của lần kia, và không phải một lần đọc đồng hồ thứ hai. Hai lần bấm cách
    // nhau vài mili giây có thể cho hai mốc bằng nhau (`nowIso` cắt phần giây lẻ), nên phép so
    // là theo TỪNG CẶP file ↔ mốc đã ghi, không phải "hai mốc khác nhau".
    expect(bo.daXuat.map(([, noiDung]) => JSON.parse(noiDung).exportedAt)).toEqual(
      bo.daGhiKho.map(([, mocDaGhi]) => mocDaGhi),
    );
    expect(bo.daGhiKho.map(([khoa]) => khoa)).toEqual(['lastBackupAt', 'lastBackupAt']);
  });
});

describe('xuatSaoLuu — mốc `lastBackupAt` và cái chuông liên tab', () => {
  it('ghi đúng `exportedAt` trong file, không phải một lần đọc đồng hồ thứ hai', async () => {
    const bo = dungSan();
    await bo.san;
    await bo.store.xuatSaoLuu();
    expect(bo.daGhiKho).toEqual([['lastBackupAt', fileCuoi(bo).exportedAt]]);
  });

  it('phát `session-changed` ĐÚNG MỘT LẦN, đúng hình dạng bản tin', async () => {
    const bo = dungSan();
    await bo.san;
    await bo.store.xuatSaoLuu();
    expect(bo.daPhat).toEqual([
      { v: 1, type: 'session-changed', from: 'tab-nay', appVersion: APP_VERSION },
    ]);
  });

  it('kho cấu hình bị chặn: im lặng, KHÔNG dải băng, và KHÔNG tin nào được phát', async () => {
    // File đã rơi xuống máy rồi — một dải băng lỗi ở đây nói sai về chuyện vừa xảy ra. Và
    // không có gì trong kho đổi, nên không có gì cho tab khác đọc lại.
    const bo = dungSan({ nemKhiGhiMoc: MA_LOI.QUOTA });
    await bo.san;
    await expect(bo.store.xuatSaoLuu()).resolves.toBeUndefined();
    expect(bo.daXuat).toHaveLength(1);
    expect(bo.daPhat).toEqual([]);
    expect(bo.store.state.banner).toBeNull();
  });
});

describe('xuatSaoLuu — cổng từ chối thì im lặng HOÀN TOÀN', () => {
  it('lời hứa của action không bị từ chối, và không có dải băng nào', async () => {
    const bo = dungSan({ tuChoiXuat: true });
    await bo.san;
    await expect(bo.store.xuatSaoLuu()).resolves.toBeUndefined();
    expect(bo.store.state.banner).toBeNull();
  });

  it('không ghi `lastBackupAt` và không phát tin — dòng nhắc 4.4 tự tố rằng chưa có bản nào', async () => {
    const bo = dungSan({ tuChoiXuat: true });
    await bo.san;
    await bo.store.xuatSaoLuu();
    expect(bo.daGhiKho).toEqual([]);
    expect(bo.daPhat).toEqual([]);
  });

  it('cổng NÉM đồng bộ đi cùng một đường với cổng trả lời hỏng', async () => {
    const bo = dungSan({ nemKhiXuat: true });
    await bo.san;
    await expect(bo.store.xuatSaoLuu()).resolves.toBeUndefined();
    expect(bo.daGhiKho).toEqual([]);
    expect(bo.daPhat).toEqual([]);
    expect(bo.store.state.banner).toBeNull();
  });

  it('không đổi một trường state nào ở CẢ HAI nhánh', async () => {
    for (const tuChoiXuat of [false, true]) {
      const bo = dungSan({ tuChoiXuat });
      await bo.san;
      const truoc = bo.store.state;
      await bo.store.xuatSaoLuu();
      // So bằng THAM CHIẾU: `datLai` dựng lại ảnh, nên một lần đổi state dù không đổi giá trị
      // nào cũng cho một object khác — và đó chính là thứ cần bắt.
      expect(bo.store.state).toBe(truoc);
    }
  });
});
