// Story 4.3 — action `napSaoLuu`, tức chỗ bốn thứ nối lại: cổng `fileIO` đưa một chuỗi về,
// lõi kiểm nó (pha 1), kho nhận kết quả gộp trong MỘT giao dịch (pha 2), rồi kho cấu hình ghi
// lại mốc.
//
// Câu hỏi trung tâm của mọi ca dưới đây chỉ có một: "khi nào `replaceAll` ĐƯỢC gọi, và nó được
// gọi với đúng cái gì". Nó xoá sạch kho trước khi ghi, nên mọi lần gọi sai là một phép xoá
// thật — và một lần gọi thừa ở nhánh từ chối là toàn bộ kho của Nam.
//
// Phần hợp đồng file (sáu điều kiện từ chối, phép gộp theo `id`) đã được phủ ở tầng lõi trong
// `core-backup.test.js` bằng hàm thuần. Ở đây chỉ hỏi phần NỐI: mã lỗi nào ra dải băng nào,
// kho bị chạm hay không, và hai con số đi tới đâu.

import { describe, expect, it } from 'vitest';
import { taoStore } from '../app/core/state.js';
import { SCHEMA_VERSION, dungFileSaoLuu } from '../app/core/backup.js';
import { LOAI_BANG } from '../app/core/banner.js';
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

const MOC_XUAT = '2026-09-15T14:05:00+07:00';

/** Hai ghi chú đang có trong kho, đủ năm trường của AD-13. */
function khoBanDau() {
  return [
    {
      id: 'id-1',
      createdAt: '2026-09-14T22:00:00+07:00',
      localDate: '2026-09-14',
      text: 'một',
      textFolded: 'mot',
    },
    {
      id: 'id-2',
      createdAt: '2026-09-15T09:12:00+07:00',
      localDate: '2026-09-15',
      text: 'hai',
      textFolded: 'hai',
    },
  ];
}

/** Một file ba ghi chú, trong đó `id-2` TRÙNG với bản đang có nhưng mang chữ khác. */
function fileBaGhiChu(exportedAt = MOC_XUAT) {
  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    exportedAt,
    notes: [
      { id: 'id-2', createdAt: '2026-01-01T00:00:00+07:00', text: 'BẢN TRONG FILE' },
      { id: 'id-3', createdAt: '2026-09-16T08:00:00+07:00', text: 'ba' },
      { id: 'id-4', createdAt: '2026-09-16T09:00:00+07:00', text: 'bốn' },
    ],
  });
}

/**
 * Store thật + bốn cổng ghi nhật ký được, cùng khuôn `dungSan` của `core-state-xuat.test.js`.
 *
 * @param {object} [tuyChon] `notes` ban đầu trong kho; `noiDung` là văn bản file (hoặc `null`
 *   để giả cảnh Nam bấm Huỷ); `nemKhiChon` để cổng file NÉM đồng bộ; `tuChoiDoc`/`tuChoiGhi`
 *   là mã lỗi mà `readAll`/`replaceAll` từ chối; `mocDangCo` là `lastBackupAt` đang có;
 *   `nemKhiGhiMoc` để kho cấu hình từ chối ghi mốc; `nemKhiPhat` để kênh liên tab ném.
 * @returns {object} Bộ đồ nghề, trong đó `datFile(text)` đổi nội dung file cho lần bấm SAU —
 *   nếu không thì "nạp lần hai với một file khác" không phải một ca test được, và nó là đúng
 *   ca mà cả `bannerSo` lẫn cờ chống bấm-hai-lần sống hay chết trong đó.
 */
function dungSan(tuyChon = {}) {
  const {
    notes = khoBanDau(),
    noiDung = fileBaGhiChu(),
    nemKhiChon = false,
    tuChoiDoc = null,
    tuChoiGhi = null,
    mocDangCo = null,
    nemKhiGhiMoc = null,
    nemKhiPhat = false,
  } = tuyChon;
  let vanBanFile = noiDung;
  /** Kho trong RAM — `replaceAll` ghi THẬT vào đây, vì "hoặc tất cả hoặc không gì" chỉ kiểm
   *  được khi có một cái kho để nhìn vào sau đó. */
  let trongKho = notes;
  const nhatKy = [];
  const daGhiKho = [];
  const daPhat = [];
  const ports = portsDay();
  ports.noteStore = {
    ...ports.noteStore,
    readAll() {
      nhatKy.push('readAll');
      if (tuChoiDoc !== null) return Promise.reject(loiUngDung(tuChoiDoc));
      return Promise.resolve([...trongKho]);
    },
    replaceAll(danhSach) {
      nhatKy.push('replaceAll');
      // Từ chối thì kho CUỘN NGƯỢC: không một bản ghi nào của `danhSach` lọt vào.
      if (tuChoiGhi !== null) return Promise.reject(loiUngDung(tuChoiGhi));
      trongKho = [...danhSach];
      return Promise.resolve();
    },
  };
  ports.sessionStore = {
    ...ports.sessionStore,
    read(khoa) {
      nhatKy.push(`read:${khoa}`);
      return mocDangCo;
    },
    write(khoa, giaTri) {
      if (nemKhiGhiMoc !== null) throw loiUngDung(nemKhiGhiMoc);
      daGhiKho.push([khoa, giaTri]);
    },
    tabIdentity: () => 'tab-nay',
  };
  ports.channel = {
    publish(tin) {
      if (nemKhiPhat) throw new Error('kênh liên tab đã đóng');
      daPhat.push(tin);
    },
    subscribe() {},
  };
  ports.fileIO = {
    ...ports.fileIO,
    readChosenFile() {
      nhatKy.push('readChosenFile');
      if (nemKhiChon) throw loiUngDung(MA_LOI.DB);
      return Promise.resolve(
        vanBanFile === null
          ? null
          : { name: 'ghi-chu-hang-ngay-2026-09-15.json', text: vanBanFile },
      );
    },
  };
  const store = taoStore(ports);
  return {
    store,
    nhatKy,
    daGhiKho,
    daPhat,
    trongKho: () => trongKho,
    datFile: (text) => {
      vanBanFile = text;
    },
    san: store.khoiDong(),
  };
}

/** Số lần `replaceAll` đã bị gọi — con số quan trọng nhất của cả tệp này. */
function soLanGhi(bo) {
  return bo.nhatKy.filter((muc) => muc === 'replaceAll').length;
}

describe('napSaoLuu — nạp bình thường: gộp theo `id`, và hai con số thật', () => {
  it('kho còn bốn bản ghi, và `notes` trong state khớp đúng kho', async () => {
    const bo = dungSan();
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.trongKho().map((mau) => mau.id).sort()).toEqual(['id-1', 'id-2', 'id-3', 'id-4']);
    expect(bo.store.state.notes.map((mau) => mau.id).sort()).toEqual([
      'id-1',
      'id-2',
      'id-3',
      'id-4',
    ]);
    // Và `notes` giữ bất biến sắp giảm dần theo `localStamp` (AD-6) — bản ghi trong file mang
    // mốc CŨ hơn mọi bản đang có, nên nó phải rơi xuống cuối chứ không chèn lên đầu.
    expect(bo.store.state.notes.map((mau) => mau.id)).toEqual(['id-4', 'id-3', 'id-2', 'id-1']);
  });

  it('dải băng mang hàng 6 với hai con số của `gopTheoId`, không do view đếm lại', async () => {
    const bo = dungSan();
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.store.state.banner).toBe(LOAI_BANG.NAP_FILE_XONG);
    expect(bo.store.state.bannerSo).toEqual({ added: 2, skipped: 1 });
  });

  it('bản đang có KHÔNG đổi một chữ, kể cả khi file nói khác', async () => {
    const bo = dungSan();
    await bo.san;
    await bo.store.napSaoLuu();
    const hai = bo.store.state.notes.find((mau) => mau.id === 'id-2');
    expect(hai.text).toBe('hai');
    expect(hai.createdAt).toBe('2026-09-15T09:12:00+07:00');
  });

  it('bản ghi mới vào kho đủ NĂM trường, `createdAt` gốc giữ nguyên tuyệt đối', async () => {
    const bo = dungSan();
    await bo.san;
    await bo.store.napSaoLuu();
    const ba = bo.trongKho().find((mau) => mau.id === 'id-3');
    expect(ba).toEqual({
      id: 'id-3',
      createdAt: '2026-09-16T08:00:00+07:00',
      localDate: '2026-09-16',
      text: 'ba',
      textFolded: 'ba',
    });
  });

  it('ĐÚNG MỘT lời gọi ghi, và nó đi SAU một lần đọc kho', async () => {
    const bo = dungSan();
    await bo.san;
    bo.nhatKy.length = 0;
    await bo.store.napSaoLuu();
    expect(bo.nhatKy.filter((m) => m === 'readAll' || m === 'replaceAll')).toEqual([
      'readAll',
      'replaceAll',
    ]);
  });

  it('nguồn để gộp là KHO, không phải RAM — ghi chú tab khác vừa thêm không bị xoá', async () => {
    // `replaceAll` xoá sạch trước khi ghi, nên một tập dựng từ `noiBo.notes` cũ hơn kho là một
    // phép XOÁ THẬT. Ở đây kho có thêm `id-9` mà RAM chưa từng thấy.
    const bo = dungSan();
    await bo.san;
    bo.trongKho().push({
      id: 'id-9',
      createdAt: '2026-09-16T10:00:00+07:00',
      localDate: '2026-09-16',
      text: 'tab khác',
      textFolded: 'tab khac',
    });
    await bo.store.napSaoLuu();
    expect(bo.trongKho().map((mau) => mau.id)).toContain('id-9');
    expect(bo.store.state.notes.map((mau) => mau.id)).toContain('id-9');
  });

  it('`dieuKien` đang bật KHÔNG bị xoá — khác hẳn `chotGhiChu`, và đã chốt', async () => {
    // `EXPERIENCE.md:251` tả đúng cảnh lưới vẫn rỗng sau khi nạp và Nam tự gõ lại ngày.
    const bo = dungSan();
    await bo.san;
    bo.store.datDieuKien({ keyword: 'phở', date: '2020-01-01' });
    await bo.store.napSaoLuu();
    expect(bo.store.state.dieuKien).toEqual({ keyword: 'phở', date: '2020-01-01' });
  });

  it('file 0 ghi chú: dải băng nói `0` và `0`, kho không đổi nội dung', async () => {
    const bo = dungSan({
      noiDung: JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt: MOC_XUAT, notes: [] }),
    });
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.store.state.bannerSo).toEqual({ added: 0, skipped: 0 });
    expect(bo.trongKho().map((mau) => mau.id).sort()).toEqual(['id-1', 'id-2']);
  });

  it('nạp HAI LẦN liên tiếp cùng file: lần hai ra `0` thêm và `3` bỏ qua', async () => {
    const bo = dungSan();
    await bo.san;
    await bo.store.napSaoLuu();
    await bo.store.napSaoLuu();
    expect(bo.store.state.bannerSo).toEqual({ added: 0, skipped: 3 });
    // Và `bannerSo` là một object MỚI, nên memo của `view/banner.js` vẽ lại thật.
    expect(bo.store.state.banner).toBe(LOAI_BANG.NAP_FILE_XONG);
    expect(bo.trongKho()).toHaveLength(4);
  });

  it('VÒNG TRÒN qua cả hai chiều: file do chính app xuất thì nạp lại đủ, giờ gốc nguyên', async () => {
    const goc = khoBanDau();
    const bo = dungSan({ notes: [], noiDung: dungFileSaoLuu(goc, MOC_XUAT) });
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.trongKho()).toHaveLength(2);
    expect(bo.trongKho().find((mau) => mau.id === 'id-1')).toEqual(goc[0]);
    expect(bo.store.state.bannerSo).toEqual({ added: 2, skipped: 0 });
  });
});

describe('napSaoLuu — pha 1 từ chối thì kho KHÔNG bị chạm một lần nào', () => {
  const caTuChoi = {
    'JSON hỏng': ['{ không phải json', MA_LOI.BAD_FILE],
    'thiếu notes': [
      JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt: MOC_XUAT }),
      MA_LOI.BAD_FILE,
    ],
    'id trùng trong file': [
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        exportedAt: MOC_XUAT,
        notes: [
          { id: 'x', createdAt: MOC_XUAT, text: 'a' },
          { id: 'x', createdAt: MOC_XUAT, text: 'b' },
        ],
      }),
      MA_LOI.BAD_FILE,
    ],
    'createdAt rác': [
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        exportedAt: MOC_XUAT,
        notes: [{ id: 'x', createdAt: 'hôm qua', text: 'a' }],
      }),
      MA_LOI.BAD_FILE,
    ],
    'schemaVersion: 2': [
      JSON.stringify({ schemaVersion: 2, exportedAt: MOC_XUAT, notes: [] }),
      MA_LOI.BAD_VERSION,
    ],
    'một ghi chú vượt trần': [
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        exportedAt: MOC_XUAT,
        notes: [
          { id: 'x', createdAt: MOC_XUAT, text: 'ngắn' },
          { id: 'y', createdAt: MOC_XUAT, text: 'a'.repeat(20001) },
        ],
      }),
      MA_LOI.TOO_LONG,
    ],
  };

  for (const [ten, [noiDung, ma]] of Object.entries(caTuChoi)) {
    it(`${ten} → dải băng ${ma}, \`replaceAll\` không được gọi lần nào`, async () => {
      const bo = dungSan({ noiDung });
      await bo.san;
      const truoc = bo.store.state.notes;
      await expect(bo.store.napSaoLuu()).resolves.toBeUndefined();
      expect(bo.store.state.banner).toBe(ma);
      expect(soLanGhi(bo)).toBe(0);
      // Kho không đổi, và `notes` giữ nguyên THAM CHIẾU cũ — không một lượt dựng lại nào.
      expect(bo.trongKho().map((mau) => mau.id).sort()).toEqual(['id-1', 'id-2']);
      expect(bo.store.state.notes).toBe(truoc);
      // Và `readAll` cũng không bị gọi lần thứ hai: pha 1 chặn TRƯỚC khi chạm kho.
      expect(bo.nhatKy.filter((m) => m === 'readAll')).toHaveLength(1);
    });
  }

  it('`bannerSo` KHÔNG sống sót qua một lần nạp hỏng sau một lần nạp thành công', async () => {
    // Hai con số của lần trước đứng cạnh câu chữ "file hỏng" là một dải băng nói dối — và đây
    // là ĐÚNG đường đó, chạy thật: nạp thành công, rồi nạp lại với một file hỏng.
    const bo = dungSan();
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.store.state.bannerSo).toEqual({ added: 2, skipped: 1 });

    bo.datFile('{ không phải json');
    await bo.store.napSaoLuu();
    expect(bo.store.state.banner).toBe(MA_LOI.BAD_FILE);
    expect(bo.store.state.bannerSo).toBeNull();
    // Và kho giữ nguyên kết quả của lần nạp thành công trước đó.
    expect(bo.trongKho()).toHaveLength(4);
  });
});

describe('napSaoLuu — Nam bấm Huỷ ở hộp chọn file: im lặng TUYỆT ĐỐI', () => {
  it('không dải băng, không chạm kho, không một trường state nào đổi', async () => {
    const bo = dungSan({ noiDung: null });
    await bo.san;
    const truoc = bo.store.state;
    await expect(bo.store.napSaoLuu()).resolves.toBeUndefined();
    expect(bo.store.state.banner).toBeNull();
    expect(soLanGhi(bo)).toBe(0);
    // So bằng THAM CHIẾU: `datLai` dựng lại ảnh, nên một lần đổi state dù không đổi giá trị
    // nào cũng cho một object khác — và đó chính là thứ cần bắt.
    expect(bo.store.state).toBe(truoc);
  });
});

describe('napSaoLuu — cổng từ chối: dải băng đúng mã, dữ liệu không nửa vời', () => {
  it('`readChosenFile` NÉM đồng bộ → dải băng, không ghi gì', async () => {
    const bo = dungSan({ nemKhiChon: true });
    await bo.san;
    await expect(bo.store.napSaoLuu()).resolves.toBeUndefined();
    expect(bo.store.state.banner).toBe(MA_LOI.DB);
    expect(soLanGhi(bo)).toBe(0);
  });

  it('`readAll` hỏng → dải băng `DB`, và KHÔNG ghi gì', async () => {
    // Gộp trên một tập rỗng tưởng tượng là xoá sạch kho bằng đúng nội dung file.
    const bo = dungSan({ tuChoiDoc: MA_LOI.DB });
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.store.state.banner).toBe(MA_LOI.DB);
    expect(soLanGhi(bo)).toBe(0);
  });

  it('`replaceAll` từ chối `QUOTA` → dải băng `QUOTA`, `notes` giữ nguyên tham chiếu', async () => {
    const bo = dungSan({ tuChoiGhi: MA_LOI.QUOTA });
    await bo.san;
    const truoc = bo.store.state.notes;
    await bo.store.napSaoLuu();
    expect(bo.store.state.banner).toBe(MA_LOI.QUOTA);
    expect(bo.store.state.bannerSo).toBeNull();
    expect(bo.store.state.notes).toBe(truoc);
    expect(bo.trongKho().map((mau) => mau.id).sort()).toEqual(['id-1', 'id-2']);
  });

  it('`replaceAll` từ chối `DB` đi cùng một đường', async () => {
    const bo = dungSan({ tuChoiGhi: MA_LOI.DB });
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.store.state.banner).toBe(MA_LOI.DB);
    expect(bo.store.state.notes).toHaveLength(2);
  });

  it('không bao giờ ghi mốc khi phép ghi kho đã hỏng', async () => {
    const bo = dungSan({ tuChoiGhi: MA_LOI.QUOTA });
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.daGhiKho).toEqual([]);
    expect(bo.daPhat).toEqual([]);
  });

  it('một `QUOTA` đang hiện được TẮT bởi một lần nạp thành công sau đó (AD-8)', async () => {
    // Nửa dễ quên nhất của đường này: hàng 6 có ưu tiên THẤP hơn `QUOTA`, nên nếu dải băng
    // thành công được nhét thẳng vào `ghiTruocDatSau` thì phép gác ưu tiên từ chối nó và
    // `QUOTA` ở lại vĩnh viễn — sau một phép ghi vừa thành công.
    const bo = dungSan();
    await bo.san;
    bo.store.datBanNhap('a'.repeat(20001));
    expect(bo.store.state.banner).toBe(MA_LOI.TOO_LONG);
    await bo.store.napSaoLuu();
    expect(bo.store.state.banner).toBe(LOAI_BANG.NAP_FILE_XONG);
    expect(bo.store.state.bannerSo).toEqual({ added: 2, skipped: 1 });
  });
});

describe('napSaoLuu — mốc `lastBackupAt` chỉ đi TỚI, không bao giờ lùi', () => {
  it('chưa có mốc nào: ghi mốc của file và phát tin ĐÚNG MỘT LẦN', async () => {
    const bo = dungSan();
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.daGhiKho).toEqual([['lastBackupAt', MOC_XUAT]]);
    expect(bo.daPhat).toEqual([
      { v: 1, type: 'session-changed', from: 'tab-nay', appVersion: APP_VERSION },
    ]);
  });

  it('`exportedAt` MỚI HƠN mốc đang có: ghi đè và phát tin', async () => {
    const bo = dungSan({ mocDangCo: '2026-09-01T00:00:00+07:00' });
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.daGhiKho).toEqual([['lastBackupAt', MOC_XUAT]]);
    expect(bo.daPhat).toHaveLength(1);
  });

  it('`exportedAt` CŨ HƠN: mốc không đổi, và KHÔNG tin nào được phát', async () => {
    const bo = dungSan({ mocDangCo: '2026-12-01T00:00:00+07:00' });
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.daGhiKho).toEqual([]);
    expect(bo.daPhat).toEqual([]);
    // Nhưng phép nạp vẫn thành công trọn vẹn — hai chuyện không liên quan tới nhau.
    expect(bo.store.state.banner).toBe(LOAI_BANG.NAP_FILE_XONG);
  });

  it('BẰNG ĐÚNG mốc đang có cũng không ghi — "mới hơn" là chặt, không phải "không cũ hơn"', async () => {
    const bo = dungSan({ mocDangCo: MOC_XUAT });
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.daGhiKho).toEqual([]);
  });

  it('so bằng MỐC TUYỆT ĐỐI, không so chuỗi: hai offset khác nhau vẫn đúng chiều', async () => {
    // `2026-09-15T14:05:00+07:00` là 07:05 UTC; `2026-09-15T09:00:00+02:00` là 07:00 UTC —
    // tức file MỚI HƠN năm phút, dù so chuỗi thì nó đứng SAU. Đây đúng là thứ AD-4 cấm.
    const bo = dungSan({ mocDangCo: '2026-09-15T09:00:00+02:00' });
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.daGhiKho).toEqual([['lastBackupAt', MOC_XUAT]]);
  });

  it('mốc RÁC trong file: nuốt lỗi, không ghi, không phát — và dải băng vẫn là thành công', async () => {
    const bo = dungSan({
      noiDung: JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        exportedAt: 'hôm qua',
        notes: [{ id: 'id-3', createdAt: '2026-09-16T08:00:00+07:00', text: 'ba' }],
      }),
      mocDangCo: MOC_XUAT,
    });
    await bo.san;
    await bo.store.napSaoLuu();
    expect(bo.daGhiKho).toEqual([]);
    expect(bo.daPhat).toEqual([]);
    expect(bo.store.state.banner).toBe(LOAI_BANG.NAP_FILE_XONG);
    expect(bo.trongKho()).toHaveLength(3);
  });

  it('kênh liên tab NÉM: dải băng thành công vẫn đứng nguyên với hai con số của nó', async () => {
    // Cái chuông là việc cuối cùng của một đường đã chạy đúng trọn vẹn. Một `publish` ném mà
    // thoát ra ngoài sẽ rơi vào `.catch` ngoài cùng của `napSaoLuu` và đặt `DB` — mã có ưu
    // tiên CAO HƠN hàng 6, tức nó giết luôn dải băng của một phép nạp vừa vào kho xong.
    const bo = dungSan({ nemKhiPhat: true });
    await bo.san;
    await expect(bo.store.napSaoLuu()).resolves.toBeUndefined();
    expect(bo.store.state.banner).toBe(LOAI_BANG.NAP_FILE_XONG);
    expect(bo.store.state.bannerSo).toEqual({ added: 2, skipped: 1 });
    expect(bo.trongKho()).toHaveLength(4);
    // Mốc thì vẫn ghi được — nó đi TRƯỚC cái chuông, và nó đã thành công.
    expect(bo.daGhiKho).toEqual([['lastBackupAt', MOC_XUAT]]);
  });

  it('ghi mốc HỎNG: dữ liệu đã vào kho rồi → giữ dải băng thành công, không phát tin', async () => {
    const bo = dungSan({ nemKhiGhiMoc: MA_LOI.QUOTA });
    await bo.san;
    await expect(bo.store.napSaoLuu()).resolves.toBeUndefined();
    expect(bo.store.state.banner).toBe(LOAI_BANG.NAP_FILE_XONG);
    expect(bo.store.state.bannerSo).toEqual({ added: 2, skipped: 1 });
    expect(bo.daPhat).toEqual([]);
    expect(bo.trongKho()).toHaveLength(4);
  });
});

describe('napSaoLuu — bấm hai lần liên tiếp', () => {
  it('lần thứ hai trong lúc lần đầu còn bay thì KHÔNG làm gì cả', async () => {
    // Hai lần chạy chồng nhau gộp trên CÙNG một ảnh chụp `readAll`, và lần ghi sau xoá mất
    // kết quả của lần trước — tức mất ghi chú, đúng thứ epic cấm.
    const bo = dungSan();
    await bo.san;
    await Promise.all([bo.store.napSaoLuu(), bo.store.napSaoLuu()]);
    expect(soLanGhi(bo)).toBe(1);
    expect(bo.nhatKy.filter((m) => m === 'readChosenFile')).toHaveLength(1);
  });

  it('cờ gác được nhả lại sau khi xong, kể cả ở nhánh hỏng', async () => {
    const bo = dungSan({ noiDung: '{ hỏng' });
    await bo.san;
    await bo.store.napSaoLuu();
    await bo.store.napSaoLuu();
    expect(bo.nhatKy.filter((m) => m === 'readChosenFile')).toHaveLength(2);
  });
});
