import { describe, expect, it, vi } from 'vitest';
import { daysBetween, localDate, localStamp, msBetweenIso, nowIso } from '../app/core/time.js';

// Độ dài ghim bằng số literal chứ không bằng hằng của `limits.js`: so khóa với chính hằng mà
// mã dùng để cắt thì đổi hằng cũng vẫn xanh. Test không bị `nguong-tap-trung` quét.

describe('core/time.js — localStamp', () => {
  it('cắt offset, giữ đúng giờ tại chỗ', () => {
    expect(localStamp({ createdAt: '2026-09-03T16:40:12+07:00' })).toBe('2026-09-03T16:40:12');
  });

  it('dài đúng 19 ký tự', () => {
    expect(localStamp({ createdAt: '2026-09-03T16:40:12+07:00' })).toHaveLength(19);
  });

  it('giây lẻ và offset Z vẫn ra đúng 19 ký tự', () => {
    expect(localStamp({ createdAt: '2026-09-03T16:40:12.345Z' })).toBe('2026-09-03T16:40:12');
  });
});

describe('core/time.js — nowIso', () => {
  // Hình dạng ghim bằng regex viết lại tại chỗ, không import `MAU_CREATED_AT`: so một chuỗi
  // với chính cái regex mà mã dùng để kiểm nó thì nới regex cũng vẫn xanh.
  const MAU = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

  it('khớp đúng hình dạng ISO-8601 có offset tại chỗ, không giây lẻ, không Z', () => {
    expect(nowIso()).toMatch(MAU);
  });

  it('offset là offset THẬT của múi giờ, đúng dấu và đúng phần phút', () => {
    // `vitest.config.js` ghim suite ở `Asia/Kolkata` = `+05:30`. Múi lệch nửa giờ là chỗ duy
    // nhất phân biệt được `giờ` với `phút`, và dấu dương phân biệt được với dấu âm — trên một
    // máy chạy ở UTC thì cả hai cách viết sai đều ra `+00:00` và không test nào thấy.
    expect(process.env.TZ).toBe('Asia/Kolkata');
    expect(nowIso().slice(-6)).toBe('+05:30');
  });

  it('localStamp và localDate nhận được nó — không ném, và đúng độ dài', () => {
    const note = { createdAt: nowIso() };
    expect(() => localStamp(note)).not.toThrow();
    expect(localStamp(note)).toHaveLength(19);
    expect(localDate(note)).toHaveLength(10);
    // Hai khóa phải là hai tiền tố của cùng một chuỗi — nếu không thì chúng đến từ hai mốc.
    expect(localStamp(note).startsWith(localDate(note))).toBe(true);
  });

  it('daysBetween nhận được khóa ngày dẫn xuất từ nó', () => {
    const homNay = localDate({ createdAt: nowIso() });
    expect(daysBetween(homNay, homNay)).toBe(0);
  });

  it('đọc đồng hồ máy chứ không trả một hằng — mốc giả lập đi vào kết quả', () => {
    // Giờ TẠI CHỖ, không phải UTC: `toISOString()` sẽ cho '2026-09-03T17:40:12.000Z' ở đây.
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-09-03T16:40:12.345+07:00'));
      const mocGiaLap = nowIso();
      expect(mocGiaLap).toMatch(MAU);
      // Không ghim múi giờ của máy chạy test — nhưng mốc tuyệt đối thì phải khớp.
      expect(new Date(mocGiaLap).getTime()).toBe(new Date('2026-09-03T16:40:12+07:00').getTime());
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('core/time.js — localDate', () => {
  it('lấy đúng ngày tại chỗ', () => {
    expect(localDate({ createdAt: '2026-09-03T16:40:12+07:00' })).toBe('2026-09-03');
    expect(localDate({ createdAt: '2026-09-03T16:40:12+07:00' })).toHaveLength(10);
  });

  it('nửa đêm giờ tại chỗ thuộc về ngày tại chỗ, không phải ngày UTC', () => {
    // 00:30 ngày 4 tại +07:00 là 17:30 ngày 3 theo UTC. Khóa lọc phải theo giờ tại chỗ.
    expect(localDate({ createdAt: '2026-09-04T00:30:00+07:00' })).toBe('2026-09-04');
  });

  it('offset ÂM quanh nửa đêm cũng theo giờ tại chỗ — bản đối xứng của case trên', () => {
    // 23:30 ngày 3 tại -05:00 là 04:30 ngày 4 theo UTC. Bất kỳ bản viết lại nào lỡ đi qua UTC
    // sẽ trả '2026-09-04' ở đây, nên đây là case bắt được cái sai đó.
    expect(localDate({ createdAt: '2026-09-03T23:30:00-05:00' })).toBe('2026-09-03');
    expect(localStamp({ createdAt: '2026-09-03T23:30:00-05:00' })).toBe('2026-09-03T23:30:00');
  });

  it('Z và +00:00 là hai cách viết cùng một offset, cho cùng khóa', () => {
    expect(localDate({ createdAt: '2026-09-03T16:40:12Z' })).toBe('2026-09-03');
    expect(localStamp({ createdAt: '2026-09-03T16:40:12+00:00' })).toBe('2026-09-03T16:40:12');
    expect(localStamp({ createdAt: '2026-09-03T16:40:12-00:00' })).toBe('2026-09-03T16:40:12');
  });
});

describe('core/time.js — vì sao AD-4 cấm so chuỗi trực tiếp trên createdAt', () => {
  it('so chuỗi trên createdAt cho thứ tự SAI, localStamp cho đúng', () => {
    // Cùng một khoảnh khắc theo giờ TẠI CHỖ (16:40:12 ngày 3), hai máy khác múi giờ.
    const hanoi = { createdAt: '2026-09-03T16:40:12+07:00' };
    const paris = { createdAt: '2026-09-03T16:40:12+02:00' };

    // So chuỗi thô: hai chuỗi khác nhau, và '+07:00' > '+02:00' nên Hà Nội bị xếp SAU —
    // một thứ tự bịa ra từ offset, không phải từ thời gian người dùng cảm nhận.
    expect(hanoi.createdAt > paris.createdAt).toBe(true);
    expect(hanoi.createdAt === paris.createdAt).toBe(false);

    // Khóa sắp xếp: bằng nhau, đúng như giờ tại chỗ nói.
    expect(localStamp(hanoi)).toBe(localStamp(paris));
  });

  it('sắp giảm dần theo localStamp: hai mẩu hòa nhau giữ nguyên thứ tự vào', () => {
    // `id` chỉ để quan sát được tính ổn định — hai mẩu 16:40 ánh xạ về CÙNG một khóa, nên nếu
    // chỉ so chuỗi kết quả thì không phân biệt được sort ổn định với sort đảo chúng.
    const ghiChu = [
      { id: 'paris', createdAt: '2026-09-03T16:40:12+02:00' },
      { id: 'hanoi', createdAt: '2026-09-03T16:40:12+07:00' },
      { id: 'sang', createdAt: '2026-09-03T09:00:00+07:00' },
    ];
    const khoa = new Map(ghiChu.map((mau) => [mau.id, localStamp(mau)]));
    const theoKhoa = [...ghiChu].sort((x, y) => khoa.get(y.id).localeCompare(khoa.get(x.id)));

    expect(theoKhoa.map((mau) => mau.id)).toEqual(['paris', 'hanoi', 'sang']);
    expect(theoKhoa.map((mau) => khoa.get(mau.id))).toEqual([
      '2026-09-03T16:40:12',
      '2026-09-03T16:40:12',
      '2026-09-03T09:00:00',
    ]);
  });
});

describe('core/time.js — daysBetween', () => {
  it('trừ ngày thường', () => {
    expect(daysBetween('2026-09-03', '2026-09-11')).toBe(8);
  });

  it('đếm đúng qua khoảng ngày có đổi giờ mùa hè ở châu Âu', () => {
    // Trung thực về thứ những assertion này chứng minh: `daysBetween` dựng mốc bằng `Date.UTC`,
    // mà UTC KHÔNG có giờ mùa hè, nên chúng sẽ xanh kể cả khi neo ở nửa đêm. Chúng ghim phép
    // đếm lịch qua đúng khoảng ngày mà giờ địa phương nhảy — nếu ai đó viết lại `daysBetween`
    // bằng giờ địa phương thì đây là chỗ đỏ. Bản thân mốc 12:00 UTC là yêu cầu của AD-4, và nó
    // được ghim bằng giá trị `UTC_NOON_HOUR` trong `core-limits.test.js`, không phải ở đây.
    expect(daysBetween('2026-03-28', '2026-04-02')).toBe(5);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('giữ dấu khi trừ ngược, không lấy trị tuyệt đối', () => {
    expect(daysBetween('2026-09-11', '2026-09-03')).toBe(-8);
  });

  it('cùng một ngày ra 0', () => {
    expect(daysBetween('2026-09-03', '2026-09-03')).toBe(0);
  });

  it('qua năm nhuận và qua giao thừa', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });
});

describe('core/time.js — msBetweenIso', () => {
  it('hai mốc KHÁC OFFSET ra đúng hiệu thật, không phải hiệu của giờ tại chỗ', () => {
    // Runner chạy ở UTC, nên chỉ ca khác offset mới bắt được một hiện thực bỏ qua offset: hai
    // mốc dưới đây có giờ tại chỗ cách nhau 0 phút nhưng cách nhau THẬT 5 tiếng.
    expect(msBetweenIso('2026-09-03T16:40:12+07:00', '2026-09-03T16:40:12+02:00')).toBe(
      5 * 60 * 60 * 1000,
    );
    // Và cùng một thời điểm viết ở hai offset khác nhau thì hiệu bằng 0, dù hai chuỗi khác nhau.
    expect(msBetweenIso('2026-09-03T16:40:12+07:00', '2026-09-03T09:40:12Z')).toBe(0);
  });

  it('cùng offset thì là phép trừ thẳng', () => {
    expect(msBetweenIso('2026-09-03T16:40:12+07:00', '2026-09-03T16:40:42+07:00')).toBe(30 * 1000);
    expect(msBetweenIso('2026-09-03T16:40:12+07:00', '2026-09-03T16:40:12+07:00')).toBe(0);
  });

  it('thứ tự đảo ra số ÂM, không lấy trị tuyệt đối', () => {
    expect(msBetweenIso('2026-09-03T16:40:42+07:00', '2026-09-03T16:40:12+07:00')).toBe(-30 * 1000);
  });

  it('qua ranh giới ngày và qua giây lẻ vẫn đúng', () => {
    expect(msBetweenIso('2026-09-03T23:59:59+07:00', '2026-09-04T00:00:00+07:00')).toBe(1000);
    expect(msBetweenIso('2026-09-03T16:40:12.500Z', '2026-09-03T16:40:13.500Z')).toBe(1000);
  });

  it('đầu vào rác thì NÉM và thông báo nêu hình dạng mong đợi cùng giá trị nhận được', () => {
    expect(() => msBetweenIso('hôm qua', nowIso())).toThrow(TypeError);
    expect(() => msBetweenIso('hôm qua', nowIso())).toThrow(/ISO-8601 có offset/);
    expect(() => msBetweenIso('hôm qua', nowIso())).toThrow(/hôm qua/);
    // Thiếu offset là rác: đúng thứ AD-4 từ chối đoán.
    expect(() => msBetweenIso('2026-09-03T16:40:12', nowIso())).toThrow(TypeError);
    // Ngày đúng hình dạng nhưng không có thật cũng ném, như mọi cửa vào khác của module.
    expect(() => msBetweenIso('2026-02-30T16:40:12+07:00', nowIso())).toThrow(TypeError);
    for (const xau of [null, undefined, 7, {}, new Date()]) {
      expect(() => msBetweenIso(xau, nowIso())).toThrow(TypeError);
      expect(() => msBetweenIso(nowIso(), xau)).toThrow(TypeError);
    }
  });

  it('nêu ĐÚNG tham số nào hỏng', () => {
    expect(() => msBetweenIso('rác', '2026-09-03T16:40:12+07:00')).toThrow(/^a /);
    expect(() => msBetweenIso('2026-09-03T16:40:12+07:00', 'rác')).toThrow(/^b /);
  });
});

describe('core/time.js — đầu vào sai ném ngay tại chỗ', () => {
  it('createdAt thiếu phần giờ', () => {
    expect(() => localStamp({ createdAt: '2026-09-03' })).toThrow(TypeError);
    expect(() => localDate({ createdAt: '2026-09-03' })).toThrow(TypeError);
  });

  it('createdAt thiếu offset', () => {
    expect(() => localStamp({ createdAt: '2026-09-03T16:40:12' })).toThrow(TypeError);
  });

  it('createdAt không phải chuỗi, thiếu, hoặc note rỗng', () => {
    for (const xau of [{ createdAt: 1757000000000 }, { createdAt: null }, {}, null, undefined]) {
      expect(() => localStamp(xau)).toThrow(TypeError);
      expect(() => localDate(xau)).toThrow(TypeError);
    }
  });

  it('thông báo nêu giá trị nhận được', () => {
    expect(() => localStamp({ createdAt: '03/09/2026' })).toThrow(/03\/09\/2026/);
    expect(() => localStamp({})).toThrow(/undefined/);
  });

  it('ngày sai dạng cho daysBetween', () => {
    expect(() => daysBetween('03/09/2026', '2026-09-11')).toThrow(TypeError);
    expect(() => daysBetween('2026-09-11', '03/09/2026')).toThrow(TypeError);
    expect(() => daysBetween('2026-9-3', '2026-09-11')).toThrow(TypeError);
    expect(() => daysBetween('2026-09-03T00:00:00+07:00', '2026-09-11')).toThrow(TypeError);
    expect(() => daysBetween(null, '2026-09-11')).toThrow(TypeError);
  });

  it('ngày không có thật ném thay vì cuộn sang tháng sau trong im lặng', () => {
    expect(() => daysBetween('2026-02-30', '2026-03-01')).toThrow(TypeError);
    expect(() => daysBetween('2026-13-01', '2026-03-01')).toThrow(TypeError);
    expect(() => daysBetween('2026-09-00', '2026-09-11')).toThrow(TypeError);
    expect(() => daysBetween('2026-04-31', '2026-05-01')).toThrow(TypeError);
    // 2026 không nhuận: 29/02 không có thật.
    expect(() => daysBetween('2026-02-29', '2026-03-01')).toThrow(TypeError);
    // 2028 nhuận: 29/02 có thật, không được ném.
    expect(daysBetween('2028-02-29', '2028-03-01')).toBe(1);
  });

  it('quy tắc năm thế kỷ: 2100 không nhuận, 2000 thì có', () => {
    expect(() => daysBetween('2100-02-29', '2100-03-01')).toThrow(TypeError);
    expect(daysBetween('2100-02-28', '2100-03-01')).toBe(1);
    expect(daysBetween('2000-02-29', '2000-03-01')).toBe(1);
    expect(daysBetween('2000-02-28', '2000-03-01')).toBe(2);
  });

  it('createdAt đúng hình dạng nhưng không phải thời điểm có thật vẫn ném', () => {
    // Đây là cái sai nguy hiểm nhất: hình dạng đúng nên regex cho qua, rồi khóa rác chảy vào
    // index IndexedDB ở Story 1.6 và chỉ lộ ra ở tận Epic 6.
    expect(() => localDate({ createdAt: '2026-02-30T16:40:12+07:00' })).toThrow(TypeError);
    expect(() => localStamp({ createdAt: '2026-02-30T16:40:12+07:00' })).toThrow(TypeError);
    expect(() => localStamp({ createdAt: '2026-13-01T16:40:12Z' })).toThrow(TypeError);
    // Giờ/phút/giây ngoài dải thật.
    expect(() => localStamp({ createdAt: '2026-09-03T25:40:12+07:00' })).toThrow(TypeError);
    expect(() => localStamp({ createdAt: '2026-09-03T16:99:12+07:00' })).toThrow(TypeError);
    expect(() => localStamp({ createdAt: '2026-09-03T16:40:99+07:00' })).toThrow(TypeError);
    // Offset ngoài dải thật.
    expect(() => localStamp({ createdAt: '2026-09-03T16:40:12+99:00' })).toThrow(TypeError);
    // Biên hợp lệ vẫn phải qua: 23:59:59 và 29/02 năm nhuận.
    expect(localStamp({ createdAt: '2028-02-29T23:59:59+07:00' })).toBe('2028-02-29T23:59:59');
  });
});
