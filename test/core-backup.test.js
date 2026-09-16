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
import { SCHEMA_VERSION, dungFileSaoLuu, tenFileSaoLuu } from '../app/core/backup.js';

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
