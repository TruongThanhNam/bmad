// Story 4.2 — hợp đồng NỘI DUNG của file sao lưu, kiểm ở tầng lõi bằng một chuỗi.
//
// Vì sao phủ được cả I/O Matrix mà không cần trình duyệt: `app/core/backup.js` không biết Blob
// lẫn thẻ `<a download>` — nó nhận một mảng bản ghi cùng một mốc và trả về một chuỗi. Phần còn
// lại (file rơi xuống đâu) là `app/adapters/file-io.js`, và nó cố ý không có test tự động.
//
// Mọi ca dưới đây so NGUYÊN VĂN hoặc so trên object đã phân tích lại, không so "có chứa": hai
// chiều của UJ-3 đọc cùng một hợp đồng, nên một trường mọc thêm phải làm một ca đỏ chứ không
// trôi qua trong im lặng tới lúc Story 4.3 phân tích phải nó.

import { describe, expect, it } from 'vitest';
import {
  SCHEMA_VERSION,
  cauNhacSaoLuu,
  docFileSaoLuu,
  dungFileSaoLuu,
  gopTheoId,
  mocXuatSaoLuu,
  tenFileSaoLuu,
} from '../app/core/backup.js';
import { MA_LOI } from '../app/core/errors.js';
import { BACKUP_NUDGE_DAYS, MAX_NOTE_CHARS } from '../app/core/limits.js';

/** Ba bản ghi ĐỦ NĂM TRƯỜNG của AD-13 — đúng thứ chảy vào từ `noiBo.notes`. */
function banGhiDay() {
  return [
    {
      id: 'id-3',
      createdAt: '2026-09-15T14:05:00+07:00',
      localDate: '2026-09-15',
      text: 'ba',
      textFolded: 'ba',
    },
    {
      id: 'id-2',
      createdAt: '2026-09-15T09:12:00+07:00',
      localDate: '2026-09-15',
      text: 'hai',
      textFolded: 'hai',
    },
    {
      id: 'id-1',
      createdAt: '2026-09-14T22:00:00+07:00',
      localDate: '2026-09-14',
      text: 'một',
      textFolded: 'mot',
    },
  ];
}

const MOC_XUAT = '2026-09-15T14:05:00+07:00';

describe('tenFileSaoLuu — ngày TẠI CHỖ của mốc xuất', () => {
  it('dựng đúng `ghi-chu-hang-ngay-YYYY-MM-DD.json`', () => {
    expect(tenFileSaoLuu(MOC_XUAT)).toBe('ghi-chu-hang-ngay-2026-09-15.json');
  });

  it('cắt theo giờ tại chỗ, KHÔNG theo UTC — chứng minh bằng một offset ÂM', () => {
    // 23:30 ở `-05:00` là 04:30 hôm SAU theo UTC. Tên file phải mang ngày Nam đang sống, không
    // phải ngày của một múi giờ không ai ở — đúng thứ AD-4 sinh ra để chặn.
    expect(tenFileSaoLuu('2026-09-15T23:30:00-05:00')).toBe('ghi-chu-hang-ngay-2026-09-15.json');
    // Và chiều ngược lại: 00:30 ở `+07:00` là 17:30 hôm TRƯỚC theo UTC.
    expect(tenFileSaoLuu('2026-09-15T00:30:00+07:00')).toBe('ghi-chu-hang-ngay-2026-09-15.json');
  });

  it('mốc rác thì NÉM — cùng cửa kiểm với mọi khóa dẫn xuất của `core/time.js`', () => {
    expect(() => tenFileSaoLuu('2026-09-15')).toThrow(TypeError);
    expect(() => tenFileSaoLuu(undefined)).toThrow(TypeError);
  });
});

describe('dungFileSaoLuu — đúng ba trường mỗi ghi chú, không một trường dẫn xuất nào', () => {
  it('hình dạng ngoài cùng đúng ba khóa và `schemaVersion` bằng 1', () => {
    const doc = JSON.parse(dungFileSaoLuu(banGhiDay(), MOC_XUAT));
    expect(Object.keys(doc).sort()).toEqual(['exportedAt', 'notes', 'schemaVersion']);
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(1);
    expect(doc.exportedAt).toBe(MOC_XUAT);
  });

  it('mỗi phần tử `notes` có ĐÚNG `id`, `createdAt`, `text` — `localDate`/`textFolded` vắng mặt', () => {
    const doc = JSON.parse(dungFileSaoLuu(banGhiDay(), MOC_XUAT));
    for (const mau of doc.notes) {
      expect(Object.keys(mau).sort()).toEqual(['createdAt', 'id', 'text']);
    }
    // Và không sót ở tầng CHUỖI: một trường dẫn xuất lọt ra dưới bất cứ dạng nào cũng đỏ.
    const chuoi = dungFileSaoLuu(banGhiDay(), MOC_XUAT);
    expect(chuoi).not.toMatch(/localDate/);
    expect(chuoi).not.toMatch(/textFolded/);
  });

  it('giữ NGUYÊN thứ tự vào — tầng A đã sắp giảm dần, file không sắp lại', () => {
    const doc = JSON.parse(dungFileSaoLuu(banGhiDay(), MOC_XUAT));
    expect(doc.notes.map((mau) => mau.id)).toEqual(['id-3', 'id-2', 'id-1']);
  });

  it('kho rỗng vẫn ra một file hợp lệ với `notes: []`', () => {
    const doc = JSON.parse(dungFileSaoLuu([], MOC_XUAT));
    expect(doc).toEqual({ schemaVersion: SCHEMA_VERSION, exportedAt: MOC_XUAT, notes: [] });
  });

  it('không đụng mảng nguồn lẫn các bản ghi trong đó', () => {
    const nguon = banGhiDay();
    const truoc = JSON.parse(JSON.stringify(nguon));
    dungFileSaoLuu(nguon, MOC_XUAT);
    expect(nguon).toEqual(truoc);
  });

  it('in đẹp: xuống dòng và thụt lề hai dấu cách — file là thứ Nam mở ra xem', () => {
    const chuoi = dungFileSaoLuu(banGhiDay(), MOC_XUAT);
    expect(chuoi).toMatch(/\n {2}"exportedAt"/);
    expect(chuoi).toMatch(/\n {2}"notes": \[/);
  });

  it('nguyên văn, cho một kho một mẩu — hợp đồng mà Story 4.3 đọc lại', () => {
    const mot = [
      {
        id: 'abc',
        createdAt: '2026-09-15T09:12:00+07:00',
        localDate: '2026-09-15',
        text: 'phở',
        textFolded: 'pho',
      },
    ];
    expect(dungFileSaoLuu(mot, MOC_XUAT)).toBe(
      [
        '{',
        '  "schemaVersion": 1,',
        '  "exportedAt": "2026-09-15T14:05:00+07:00",',
        '  "notes": [',
        '    {',
        '      "id": "abc",',
        '      "createdAt": "2026-09-15T09:12:00+07:00",',
        '      "text": "phở"',
        '    }',
        '  ]',
        '}',
      ].join('\n'),
    );
  });
});

// ————————————————————————————————————————————————————————————————————————————————————————
// Story 4.3 — chiều NẠP của cùng hợp đồng file đó: pha 1 (kiểm) và phép gộp theo `id`.
//
// Cả hai là hàm THUẦN, nên toàn bộ phần logic dễ sai nhất của ứng dụng kiểm được ở Node bằng
// một chuỗi — không kho, không trình duyệt, không một lời hứa nào.

/** Một file sao lưu hợp lệ, dựng từ đối tượng rồi in ra chuỗi. */
function fileVoi(phan = {}) {
  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    exportedAt: MOC_XUAT,
    notes: [{ id: 'a', createdAt: '2026-09-15T09:12:00+07:00', text: 'phở' }],
    ...phan,
  });
}

/** Mã lỗi của một lời gọi đã ném, hoặc `null` nếu nó không ném. */
function maKhiNem(chay) {
  try {
    chay();
  } catch (loi) {
    return loi.code;
  }
  return null;
}

describe('docFileSaoLuu — pha 1 kiểm TOÀN BỘ file trước khi ai chạm kho', () => {
  it('dựng lại đủ NĂM trường, tính lại `localDate` và `textFolded` từ file ba trường', () => {
    expect(docFileSaoLuu(fileVoi())).toEqual([
      {
        id: 'a',
        createdAt: '2026-09-15T09:12:00+07:00',
        localDate: '2026-09-15',
        text: 'phở',
        textFolded: 'pho',
      },
    ]);
  });

  it('`localDate` là ngày TẠI CHỖ — chứng minh bằng một offset ÂM', () => {
    // 23:30 ở `-05:00` là 04:30 hôm SAU theo UTC. Nạp trên một máy đặt múi giờ khác không được
    // đẩy ghi chú sang ngày khác — đó chính là thứ AD-4 sinh ra để chặn.
    const ra = docFileSaoLuu(
      fileVoi({ notes: [{ id: 'a', createdAt: '2026-09-15T23:30:00-05:00', text: 'x' }] }),
    );
    expect(ra[0].localDate).toBe('2026-09-15');
  });

  it('KHÔNG đọc trường dẫn xuất từ file — một `textFolded` sửa tay bị bỏ hẳn', () => {
    // Một file sửa tay với `text` mới mà `textFolded` cũ nạp vào một ghi chú không tìm được
    // bằng chính chữ của nó (AD-11, AD-13).
    const ra = docFileSaoLuu(
      fileVoi({
        notes: [
          {
            id: 'a',
            createdAt: '2026-09-15T09:12:00+07:00',
            text: 'bún chả',
            textFolded: 'RÁC',
            localDate: '1999-01-01',
          },
        ],
      }),
    );
    expect(ra[0].textFolded).toBe('bun cha');
    expect(ra[0].localDate).toBe('2026-09-15');
    expect(Object.keys(ra[0]).sort()).toEqual([
      'createdAt',
      'id',
      'localDate',
      'text',
      'textFolded',
    ]);
  });

  it('`notes: []` là một file hợp lệ, và nó trả về mảng rỗng', () => {
    expect(docFileSaoLuu(fileVoi({ notes: [] }))).toEqual([]);
  });

  it('`text` rỗng hay chỉ khoảng trắng là HỢP LỆ — quyết định đã chốt của spec', () => {
    // Trường có mặt và đúng kiểu thì không phải "thiếu trường bắt buộc". Từ chối cả file vì
    // một dòng rỗng là cái giá sai; Epic 5.2 sẽ tự dọn.
    const ra = docFileSaoLuu(
      fileVoi({
        notes: [
          { id: 'a', createdAt: '2026-09-15T09:12:00+07:00', text: '' },
          { id: 'b', createdAt: '2026-09-15T09:13:00+07:00', text: '   ' },
        ],
      }),
    );
    expect(ra.map((mau) => mau.text)).toEqual(['', '   ']);
  });

  it('`schemaVersion` khác → `BAD_VERSION`, và đó là mã RIÊNG, không phải `BAD_FILE`', () => {
    expect(maKhiNem(() => docFileSaoLuu(fileVoi({ schemaVersion: 2 })))).toBe(MA_LOI.BAD_VERSION);
    expect(maKhiNem(() => docFileSaoLuu(fileVoi({ schemaVersion: '1' })))).toBe(
      MA_LOI.BAD_VERSION,
    );
  });

  it('mỗi điều kiện "file hỏng" ra đúng `BAD_FILE`', () => {
    const hong = {
      'JSON hỏng': '{ đây không phải json',
      'gốc là mảng': '[]',
      'gốc là chuỗi': '"xin chào"',
      'thiếu notes': JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt: MOC_XUAT }),
      'notes không phải mảng': fileVoi({ notes: {} }),
      'phần tử không phải object': fileVoi({ notes: ['a'] }),
      'thiếu id': fileVoi({ notes: [{ createdAt: '2026-09-15T09:12:00+07:00', text: 'x' }] }),
      'id rỗng': fileVoi({ notes: [{ id: '', createdAt: '2026-09-15T09:12:00+07:00', text: 'x' }] }),
      'id không phải chuỗi': fileVoi({
        notes: [{ id: 7, createdAt: '2026-09-15T09:12:00+07:00', text: 'x' }],
      }),
      'thiếu text': fileVoi({ notes: [{ id: 'a', createdAt: '2026-09-15T09:12:00+07:00' }] }),
      'text không phải chuỗi': fileVoi({
        notes: [{ id: 'a', createdAt: '2026-09-15T09:12:00+07:00', text: null }],
      }),
      'thiếu createdAt': fileVoi({ notes: [{ id: 'a', text: 'x' }] }),
      'createdAt không có offset': fileVoi({
        notes: [{ id: 'a', createdAt: '2026-09-15T09:12:00', text: 'x' }],
      }),
      'createdAt chỉ có ngày': fileVoi({ notes: [{ id: 'a', createdAt: '2026-09-15', text: 'x' }] }),
      'createdAt là ngày không có thật': fileVoi({
        notes: [{ id: 'a', createdAt: '2026-02-30T09:12:00+07:00', text: 'x' }],
      }),
      'id trùng nhau trong CHÍNH file': fileVoi({
        notes: [
          { id: 'a', createdAt: '2026-09-15T09:12:00+07:00', text: 'x' },
          { id: 'a', createdAt: '2026-09-15T09:13:00+07:00', text: 'y' },
        ],
      }),
    };
    const sai = [];
    for (const [ten, noiDung] of Object.entries(hong)) {
      const ma = maKhiNem(() => docFileSaoLuu(noiDung));
      if (ma !== MA_LOI.BAD_FILE) sai.push(`${ten} → ${String(ma)}`);
    }
    expect(sai).toEqual([]);
  });

  it('`text` vượt `MAX_NOTE_CHARS` → `TOO_LONG`, và đúng trần thì KHÔNG', () => {
    const vua = 'a'.repeat(MAX_NOTE_CHARS);
    expect(
      docFileSaoLuu(fileVoi({ notes: [{ id: 'a', createdAt: MOC_XUAT, text: vua }] })),
    ).toHaveLength(1);
    expect(
      maKhiNem(() =>
        docFileSaoLuu(fileVoi({ notes: [{ id: 'a', createdAt: MOC_XUAT, text: `${vua}a` }] })),
      ),
    ).toBe(MA_LOI.TOO_LONG);
  });

  it('một ghi chú sai ở phần tử CUỐI vẫn từ chối CẢ file', () => {
    // Đây là toàn bộ điểm của "hai pha": pha 1 không trả về một nửa nào, nên `state.js` không
    // có cách nào ghi 467 ghi chú đúng rồi dừng ở cái thứ 468.
    const nhieu = [];
    for (let i = 0; i < 20; i += 1) {
      nhieu.push({ id: `id-${i}`, createdAt: '2026-09-15T09:12:00+07:00', text: `ghi ${i}` });
    }
    nhieu.push({ id: 'cuoi', createdAt: 'RÁC', text: 'x' });
    expect(maKhiNem(() => docFileSaoLuu(fileVoi({ notes: nhieu })))).toBe(MA_LOI.BAD_FILE);
    // Và cùng danh sách đó, bỏ phần tử cuối, thì nạp trọn vẹn.
    nhieu.pop();
    expect(docFileSaoLuu(fileVoi({ notes: nhieu }))).toHaveLength(20);
  });

  it('không thêm trần kích thước nào — một file rất nhiều ghi chú vẫn nạp', () => {
    // Quyết định đã chốt #1: pha 1 có đúng sáu điều kiện từ chối, không có điều kiện thứ bảy.
    const nhieu = [];
    for (let i = 0; i < 2000; i += 1) {
      nhieu.push({ id: `id-${i}`, createdAt: '2026-09-15T09:12:00+07:00', text: `ghi ${i}` });
    }
    expect(docFileSaoLuu(fileVoi({ notes: nhieu }))).toHaveLength(2000);
  });

  it('VÒNG TRÒN: thứ `dungFileSaoLuu` viết ra thì `docFileSaoLuu` đọc lại đúng nguyên', () => {
    // Nửa cứng của UJ-3: "file xuất ra nạp lại được" phải là một ca đỏ khi nó gãy, không phải
    // một lời hứa của hai đoạn mã không ai đối chiếu.
    const goc = banGhiDay();
    expect(docFileSaoLuu(dungFileSaoLuu(goc, MOC_XUAT))).toEqual(goc);
  });
});

describe('mocXuatSaoLuu — mốc của file, và không bao giờ ném', () => {
  it('trả đúng `exportedAt` của file', () => {
    expect(mocXuatSaoLuu(fileVoi())).toBe(MOC_XUAT);
  });

  it('file không có mốc, mốc sai kiểu, hay JSON hỏng → `null`, KHÔNG ném', () => {
    expect(mocXuatSaoLuu(fileVoi({ exportedAt: undefined }))).toBeNull();
    expect(mocXuatSaoLuu(fileVoi({ exportedAt: 7 }))).toBeNull();
    expect(mocXuatSaoLuu('{ hỏng')).toBeNull();
    expect(mocXuatSaoLuu('[]')).toBeNull();
  });

  it('mốc RÁC vẫn trả về nguyên trạng — pha 1 không kiểm nó, và đó là chủ ý', () => {
    // `exportedAt` không nằm trong sáu điều kiện từ chối, nên một mốc rác không được chặn cả
    // file. Phép so "mới hơn" ở `state.js` là chỗ nó bị hỏi tới, và chỗ đó nuốt lỗi.
    expect(mocXuatSaoLuu(fileVoi({ exportedAt: 'hôm qua' }))).toBe('hôm qua');
  });
});

describe('gopTheoId — bản ĐANG CÓ luôn thắng, và không bao giờ mất gì', () => {
  const dangCo = [
    {
      id: 'a',
      createdAt: '2026-09-14T22:00:00+07:00',
      localDate: '2026-09-14',
      text: 'cũ',
      textFolded: 'cu',
    },
    {
      id: 'b',
      createdAt: '2026-09-15T09:12:00+07:00',
      localDate: '2026-09-15',
      text: 'hai',
      textFolded: 'hai',
    },
  ];

  it('hai con số THẬT, và kho ra đúng bốn bản ghi', () => {
    const tuFile = docFileSaoLuu(
      fileVoi({
        notes: [
          { id: 'a', createdAt: '2026-09-14T22:00:00+07:00', text: 'bản trong file' },
          { id: 'c', createdAt: '2026-09-16T08:00:00+07:00', text: 'ba' },
          { id: 'd', createdAt: '2026-09-16T09:00:00+07:00', text: 'bốn' },
        ],
      }),
    );
    const { ketQua, added, skipped } = gopTheoId(dangCo, tuFile);
    expect({ added, skipped }).toEqual({ added: 2, skipped: 1 });
    expect(ketQua.map((mau) => mau.id).sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('`id` đã có thì bản trong kho KHÔNG đổi một chữ — kể cả khi file nói khác', () => {
    const tuFile = docFileSaoLuu(
      fileVoi({ notes: [{ id: 'a', createdAt: '2026-01-01T00:00:00+07:00', text: 'ĐÈ LÊN' }] }),
    );
    const { ketQua, added, skipped } = gopTheoId(dangCo, tuFile);
    expect({ added, skipped }).toEqual({ added: 0, skipped: 1 });
    // So bằng THAM CHIẾU: bản đang có phải đi qua nguyên vẹn, không phải một bản sao "bằng nhau".
    expect(ketQua.find((mau) => mau.id === 'a')).toBe(dangCo[0]);
  });

  it('không xóa gì: một ghi chú chỉ có trong kho vẫn ở lại sau khi gộp', () => {
    const { ketQua, added, skipped } = gopTheoId(dangCo, []);
    expect({ added, skipped }).toEqual({ added: 0, skipped: 0 });
    expect(ketQua.map((mau) => mau.id)).toEqual(['a', 'b']);
  });

  it('kho rỗng: cả file vào hết, `createdAt` gốc giữ nguyên tuyệt đối', () => {
    const tuFile = docFileSaoLuu(fileVoi());
    const { ketQua, added, skipped } = gopTheoId([], tuFile);
    expect({ added, skipped }).toEqual({ added: 1, skipped: 0 });
    expect(ketQua[0].createdAt).toBe('2026-09-15T09:12:00+07:00');
  });

  it('gộp LẦN HAI cùng một file thì không thêm gì nữa — phép gộp lũy đẳng', () => {
    const tuFile = docFileSaoLuu(fileVoi());
    const lan1 = gopTheoId(dangCo, tuFile);
    const lan2 = gopTheoId(lan1.ketQua, tuFile);
    expect({ added: lan2.added, skipped: lan2.skipped }).toEqual({ added: 0, skipped: 1 });
    expect(lan2.ketQua).toHaveLength(lan1.ketQua.length);
  });

  it('không đụng hai mảng nguồn', () => {
    const tuFile = docFileSaoLuu(fileVoi({ notes: [{ id: 'z', createdAt: MOC_XUAT, text: 'z' }] }));
    const truoc = JSON.parse(JSON.stringify(dangCo));
    gopTheoId(dangCo, tuFile);
    expect(dangCo).toEqual(truoc);
    expect(tuFile).toHaveLength(1);
  });
});

// Story 4.4 — câu nhắc thụ động, kiểm ở tầng lõi bằng hai chuỗi.
//
// `bayGio` đi vào qua THAM SỐ ở mọi ca: một ca đọc đồng hồ máy là một ca đổi màu theo ngày
// chạy nó, và ngưỡng của dòng nhắc thì đo bằng ngày.
describe('cauNhacSaoLuu — chỉ lên tiếng khi đã QUÁ ngưỡng', () => {
  /** "Bây giờ" cố định cho cả khối, cùng offset với các mốc dưới đây. */
  const BAY_GIO = '2026-09-16T10:00:00+07:00';

  it('quá ngưỡng: tám ngày cho đúng nguyên văn một câu, kể cả dấu chấm', () => {
    // Nguyên văn TỪNG KÝ TỰ, và số viết bằng CHỮ SỐ (quyết định đã chốt) — một bảng đọc số
    // tiếng Việt là một mặt công khai mới của `core/` mà dòng chữ này không đáng.
    expect(cauNhacSaoLuu('2026-09-08T10:00:00+07:00', BAY_GIO)).toBe(
      'Lần sao lưu gần nhất cách đây 8 ngày.',
    );
  });

  it('ĐÚNG BẰNG ngưỡng thì im lặng — "quá" là lớn hơn hẳn', () => {
    expect(cauNhacSaoLuu('2026-09-09T10:00:00+07:00', BAY_GIO)).toBeNull();
  });

  it('chưa quá ngưỡng, và cùng ngày, đều im lặng', () => {
    expect(cauNhacSaoLuu('2026-09-14T10:00:00+07:00', BAY_GIO)).toBeNull();
    expect(cauNhacSaoLuu(BAY_GIO, BAY_GIO)).toBeNull();
  });

  it('ngày thứ chín vẫn nói, và nói đúng con số của nó', () => {
    expect(cauNhacSaoLuu('2026-09-07T23:59:00+07:00', BAY_GIO)).toBe(
      'Lần sao lưu gần nhất cách đây 9 ngày.',
    );
  });

  it('chưa từng sao lưu: `null` vào thì `null` ra — KHÔNG có câu "chưa có bản nào"', () => {
    expect(cauNhacSaoLuu(null, BAY_GIO)).toBeNull();
    expect(cauNhacSaoLuu(undefined, BAY_GIO)).toBeNull();
  });

  it('mốc RÁC trong kho không ném ra ngoài — nó chỉ im lặng', () => {
    // `lastBackupAt` là thứ ai cũng gõ tay được trong DevTools, và một `TypeError` ở đây rơi
    // vào giữa một lượt vẽ chung, tức giết cả trang vì một dòng chữ phụ.
    for (const rac of ['hôm qua', '', '2026-13-40T00:00:00+07:00', '2026-09-08', 42, {}]) {
      expect(cauNhacSaoLuu(rac, BAY_GIO)).toBeNull();
    }
  });

  it('`bayGio` rác cũng đi cùng đường đó', () => {
    expect(cauNhacSaoLuu('2026-09-08T10:00:00+07:00', 'không phải mốc')).toBeNull();
  });

  it('mốc ở TƯƠNG LAI cho số ngày âm, nên nó im lặng — không cần một nhánh riêng', () => {
    expect(cauNhacSaoLuu('2026-12-01T10:00:00+07:00', BAY_GIO)).toBeNull();
  });

  it('đo theo NGÀY TẠI CHỖ của mỗi mốc, không theo ngày UTC', () => {
    // Mốc xuất lúc 00:30 ở `+07:00`: cắt theo UTC thì nó rơi về hôm trước và dòng nhắc đếm
    // thừa một ngày — đúng cái AD-4 sinh ra để chặn.
    expect(cauNhacSaoLuu('2026-09-08T00:30:00+07:00', BAY_GIO)).toBe(
      'Lần sao lưu gần nhất cách đây 8 ngày.',
    );
  });

  it('ngưỡng đọc từ `core/limits.js`, không phải một con số chép tay', () => {
    // Ngày thứ `BACKUP_NUDGE_DAYS` im lặng, ngày kế tiếp lên tiếng — hai ca này neo vào chính
    // hằng đó, nên đổi ngưỡng ở `limits.js` không để lại một ca xanh nói sai.
    const ngay = (n) => `2026-09-${String(16 - n).padStart(2, '0')}T10:00:00+07:00`;
    expect(cauNhacSaoLuu(ngay(BACKUP_NUDGE_DAYS), BAY_GIO)).toBeNull();
    expect(cauNhacSaoLuu(ngay(BACKUP_NUDGE_DAYS + 1), BAY_GIO)).toBe(
      `Lần sao lưu gần nhất cách đây ${BACKUP_NUDGE_DAYS + 1} ngày.`,
    );
  });

  it('không có `bayGio` thì đọc đồng hồ máy, và không ném', () => {
    expect(() => cauNhacSaoLuu(null)).not.toThrow();
    expect(cauNhacSaoLuu(null)).toBeNull();
  });
});
