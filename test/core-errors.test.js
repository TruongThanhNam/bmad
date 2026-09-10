import { describe, expect, it } from 'vitest';
import * as errors from '../app/core/errors.js';
import { MA_LOI, MICROCOPY, loiUngDung, microcopyLoi } from '../app/core/errors.js';
import { MAX_NOTE_CHARS } from '../app/core/limits.js';

const XUAT_MONG_DOI = ['MA_LOI', 'MICROCOPY', 'microcopyLoi', 'loiUngDung'];

const SAU_MA = ['VERSION_SKEW', 'QUOTA', 'DB', 'BAD_FILE', 'BAD_VERSION', 'TOO_LONG'];

// Chép tay từ bảng "Dải băng thông báo" của EXPERIENCE.md — so NGUYÊN VĂN từng ký tự.
const NGUYEN_VAN = {
  QUOTA:
    'Không lưu được — trình duyệt hết dung lượng. Xuất sao lưu, rồi xóa bớt ghi chú cũ. Chữ vừa gõ CHƯA được lưu.',
  VERSION_SKEW: 'Đã có bản mới. Tải lại trang — tab này đang ở chế độ chỉ đọc.',
  BAD_FILE:
    'Không nạp được file này — sai định dạng hoặc file hỏng. Dữ liệu đang có KHÔNG bị đụng tới. Thử file sao lưu khác.',
  TOO_LONG:
    'Ghi chú này đã đạt 20.000 ký tự — không nhận thêm. Chốt bằng Ctrl+Enter rồi gõ tiếp vào ghi chú mới.',
};

describe('core/errors.js — tập mã', () => {
  it('xuất ra ĐÚNG bốn tên — một `microcopyOrDefault` lẻn vào là đỏ', () => {
    expect(Object.keys(errors).sort()).toEqual([...XUAT_MONG_DOI].sort());
  });

  it('đúng sáu mã, không hơn không kém', () => {
    expect(Object.keys(MA_LOI).sort()).toEqual([...SAU_MA].sort());
    expect(Object.keys(MICROCOPY).sort()).toEqual([...SAU_MA].sort());
  });

  it('mỗi mã ánh xạ về chính tên của nó', () => {
    for (const ma of SAU_MA) expect(MA_LOI[ma]).toBe(ma);
  });

  it('MA_LOI đóng băng — gán thêm không ăn', () => {
    expect(Object.isFrozen(MA_LOI)).toBe(true);
    try {
      MA_LOI.NEW_CODE = 'NEW_CODE';
    } catch {
      // strict mode ném; cả hai đường đều chấp nhận được, miễn là không thêm được mã.
    }
    expect(MA_LOI.NEW_CODE).toBeUndefined();
    expect(Object.keys(MA_LOI)).toHaveLength(SAU_MA.length);
  });
});

describe('core/errors.js — microcopy', () => {
  it('MICROCOPY đóng băng — không sửa được câu chữ lúc chạy', () => {
    expect(Object.isFrozen(MICROCOPY)).toBe(true);
    try {
      MICROCOPY.DB = 'câu khác';
      MICROCOPY.NEW_CODE = 'câu lạ';
    } catch {
      // strict mode ném; cả hai đường đều được, miễn là bảng không đổi.
    }
    expect(MICROCOPY.NEW_CODE).toBeUndefined();
    expect(MICROCOPY.DB).not.toBe('câu khác');
  });

  it('câu TOO_LONG mang đúng con số của MAX_NOTE_CHARS', () => {
    // Đổi hằng mà quên câu chữ thì thông báo nói dối người dùng — test này bắt đúng chỗ đó.
    const soCoDauCham = String(MAX_NOTE_CHARS).replace(/\B(?=(\d{3})+$)/g, '.');
    expect(microcopyLoi('TOO_LONG')).toContain(`${soCoDauCham} ký tự`);
  });

  it('mỗi mã có microcopy khác rỗng', () => {
    for (const ma of SAU_MA) {
      const cau = microcopyLoi(ma);
      expect(typeof cau).toBe('string');
      expect(cau.trim().length).toBeGreaterThan(0);
    }
  });

  for (const [ma, cau] of Object.entries(NGUYEN_VAN)) {
    it(`${ma} trùng nguyên văn EXPERIENCE.md`, () => {
      expect(microcopyLoi(ma)).toBe(cau);
    });
  }

  it('DB dùng câu đã chốt ở spec Story 1.2', () => {
    expect(microcopyLoi('DB')).toBe(
      'Không mở được kho dữ liệu của trình duyệt. Tải lại trang. Nếu vẫn hỏng, xuất sao lưu ở một tab khác trước khi thử tiếp.',
    );
  });

  it('BAD_VERSION dùng chung câu với BAD_FILE nhưng vẫn là mã riêng', () => {
    expect(microcopyLoi('BAD_VERSION')).toBe(NGUYEN_VAN.BAD_FILE);
    expect(MA_LOI.BAD_VERSION).not.toBe(MA_LOI.BAD_FILE);
  });
});

describe('core/errors.js — loiUngDung', () => {
  it('trả Error mang đúng .code và .message', () => {
    for (const ma of SAU_MA) {
      const loi = loiUngDung(ma);
      expect(loi).toBeInstanceOf(Error);
      expect(loi.code).toBe(ma);
      expect(loi.message).toBe(microcopyLoi(ma));
    }
  });

  it('mỗi lần gọi trả một đối tượng mới — stack không dùng chung', () => {
    expect(loiUngDung('DB')).not.toBe(loiUngDung('DB'));
  });
});

describe('core/errors.js — mã ngoài tập', () => {
  for (const xau of ['WHATEVER', 'X', '', 'quota', undefined, null, 0, {}]) {
    it(`microcopyLoi(${JSON.stringify(xau) ?? String(xau)}) ném TypeError`, () => {
      expect(() => microcopyLoi(xau)).toThrow(TypeError);
    });
    it(`loiUngDung(${JSON.stringify(xau) ?? String(xau)}) ném TypeError`, () => {
      expect(() => loiUngDung(xau)).toThrow(TypeError);
    });
  }

  it('không trả chuỗi rỗng hay câu mặc định cho mã lạ', () => {
    let ketQua = 'CHUA_NEM';
    try {
      ketQua = microcopyLoi('KHONG_CO_MA_NAY');
    } catch (loi) {
      ketQua = loi;
    }
    expect(ketQua).toBeInstanceOf(TypeError);
  });

  it('không ăn thuộc tính kế thừa từ Object.prototype', () => {
    expect(() => microcopyLoi('toString')).toThrow(TypeError);
    expect(() => microcopyLoi('constructor')).toThrow(TypeError);
  });
});
