import { afterEach, describe, expect, it } from 'vitest';
import { MA_LOI } from '../app/core/errors.js';
import { taoSessionStore } from '../app/adapters/localstorage.js';

// `app/adapters/` KHÔNG có test tự động — bằng chứng của nó là danh sách thử tay trong README,
// vì dựng một IndexedDB giả để nghiệm thu một adapter mỏng là test chính cái giả lập đó.
//
// Ngoại lệ HẸP đã duyệt, đúng hai hành vi và không hơn: khóa cấu hình lạ, và ánh xạ
// `QuotaExceededError` sang mã `QUOTA` của AD-18. Cả hai chạy được mà không cần một kho thật —
// khóa lạ ném TRƯỚC khi chạm kho, còn ánh xạ mã chỉ cần một `localStorage` vài dòng. Lý do gốc
// của luật "adapter không có test" là tránh dựng một trình duyệt giả, và nó không áp ở đây.
//
// Đừng nới file này ra. Mọi hành vi cần một kho thật (`read` trả đúng giá trị đã ghi, danh tính
// tab bền qua lần tải lại) thuộc danh sách thử tay, không thuộc chỗ này.

/** Ba khóa hợp lệ của kho cấu hình (AD-3 tầng B′) — chép tay để test không đọc chung bảng với mã. */
const BA_KHOA = ['theme', 'lastBackupAt', 'persistDenied'];

/** Lỗi đúng hình dạng mà trình duyệt ném khi hết dung lượng: mã nằm ở `.name`, không ở lớp. */
function loiHetCho() {
  const loi = new Error('kho day');
  loi.name = 'QuotaExceededError';
  return loi;
}

/** Kho phạm vi phiên giả, ghi vào một `Map` — vài dòng, không phải một trình duyệt giả. */
function camKhoPhienGia(neM = null) {
  const truoc = Object.prototype.hasOwnProperty.call(globalThis, 'sessionStorage')
    ? globalThis.sessionStorage
    : undefined;
  const daGhi = new Map();
  globalThis.sessionStorage = {
    getItem(khoa) {
      if (neM !== null) throw neM();
      return daGhi.has(khoa) ? daGhi.get(khoa) : null;
    },
    setItem(khoa, giaTri) {
      if (neM !== null) throw neM();
      daGhi.set(khoa, giaTri);
    },
    removeItem(khoa) {
      if (neM !== null) throw neM();
      daGhi.delete(khoa);
    },
  };
  const go = () => {
    if (truoc === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = truoc;
  };
  return { daGhi, go };
}

/** Kho giả tối thiểu, cắm vào `globalThis` đúng trong một ca test. */
function camKhoGia(neM) {
  const truoc = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage')
    ? globalThis.localStorage
    : undefined;
  globalThis.localStorage = {
    getItem() {
      throw neM();
    },
    setItem() {
      throw neM();
    },
    removeItem() {
      throw neM();
    },
  };
  return () => {
    if (truoc === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = truoc;
  };
}

let goKhoGia = null;

afterEach(() => {
  if (goKhoGia !== null) {
    goKhoGia();
    goKhoGia = null;
  }
});

describe('localstorage.js — khóa lạ là lỗi lập trình, không phải một lần ghi im lặng', () => {
  it('read/write/remove với khóa ngoài bảng thì ném TypeError nêu CẢ BA khóa hợp lệ', () => {
    const cong = taoSessionStore();
    for (const goi of [() => cong.read('mau'), () => cong.write('mau', 'x'), () => cong.remove('mau')]) {
      expect(goi).toThrow(TypeError);
      // Thông báo phải nêu đủ ba khóa: người viết sai một khóa cần thấy tập hợp lệ, không chỉ
      // thấy rằng khóa của mình sai.
      for (const khoa of BA_KHOA) {
        expect(goi).toThrow(new RegExp(khoa));
      }
    }
  });

  it('khóa lạ ném TRƯỚC khi chạm kho — nên nó ném cả khi không có kho nào', () => {
    // Không cắm kho giả: nếu phép kiểm khóa chạy sau lần chạm kho thì đây sẽ là
    // `localStorage is not defined`, không phải `TypeError` của bảng khóa.
    const cong = taoSessionStore();
    expect(() => cong.read('ghichu.theme')).toThrow(/theme/);
  });

  it('khóa kế thừa từ prototype không lọt qua bảng', () => {
    const cong = taoSessionStore();
    expect(() => cong.read('toString')).toThrow(TypeError);
    expect(() => cong.read('constructor')).toThrow(TypeError);
  });
});

describe('localstorage.js — writeTabIdentity ghi danh tính mới vào kho phạm vi phiên', () => {
  // Cùng lớp "không cần kho thật" với hai hành vi đã duyệt ở trên: một `Map` vài dòng là đủ,
  // không phải một giả lập kho nào. Phần bền qua lần tải lại vẫn thuộc danh sách thử tay.
  it('ghi ĐÚNG khóa ghichu.tabId, và ghi vào kho phạm vi PHIÊN chứ không phải kho cấu hình', () => {
    const phien = camKhoPhienGia();
    goKhoGia = phien.go;
    const cong = taoSessionStore();
    cong.writeTabIdentity('tab-moi');
    expect([...phien.daGhi.keys()]).toEqual(['ghichu.tabId']);
    expect(phien.daGhi.get('ghichu.tabId')).toBe('tab-moi');
    // Và lần đọc sau thấy đúng danh tính vừa ghi — không sinh một cái mới đè lên.
    expect(cong.tabIdentity()).toBe('tab-moi');
  });

  it('kho đầy thì NÉM Error có code QUOTA, không trả lời hứa bị từ chối', () => {
    const phien = camKhoPhienGia(loiHetCho);
    goKhoGia = phien.go;
    const cong = taoSessionStore();
    let batDuoc;
    try {
      cong.writeTabIdentity('tab-moi');
    } catch (loi) {
      batDuoc = loi;
    }
    expect(batDuoc).toBeInstanceOf(Error);
    expect(batDuoc).not.toBeInstanceOf(Promise);
    expect(batDuoc.code).toBe(MA_LOI.QUOTA);
  });

  it('hỏng vì lý do khác thì thành mã DB', () => {
    const phien = camKhoPhienGia(() => new Error('kho bi chan'));
    goKhoGia = phien.go;
    const cong = taoSessionStore();
    expect(() => cong.writeTabIdentity('tab-moi')).toThrow(
      expect.objectContaining({ code: MA_LOI.DB }),
    );
  });
});

describe('localstorage.js — QuotaExceededError thành mã QUOTA của AD-18', () => {
  it('write khi kho đầy thì NÉM Error có code QUOTA, không trả lời hứa bị từ chối', () => {
    goKhoGia = camKhoGia(loiHetCho);
    const cong = taoSessionStore();
    let batDuoc;
    try {
      cong.write('theme', 'dark');
    } catch (loi) {
      batDuoc = loi;
    }
    // Cổng ĐỒNG BỘ thì ném; trả về một lời hứa bị từ chối là sai bề mặt (`ports/session-store.js`).
    expect(batDuoc).toBeInstanceOf(Error);
    expect(batDuoc.code).toBe(MA_LOI.QUOTA);
    // Và nó NÉM chứ không trả về một lời hứa: một `Promise` bị từ chối ở đây sẽ trôi qua mọi
    // chỗ gọi đồng bộ mà không ai bắt.
    expect(batDuoc).not.toBeInstanceOf(Promise);
  });

  it('hỏng vì lý do khác thì thành mã DB, không phải QUOTA', () => {
    goKhoGia = camKhoGia(() => new Error('kho bi chan'));
    const cong = taoSessionStore();
    expect(() => cong.write('theme', 'dark')).toThrow(
      expect.objectContaining({ code: MA_LOI.DB }),
    );
    // Đọc hỏng cũng phải ném chứ không trả `null`: `null` nghĩa là "khóa chưa từng được ghi",
    // và nói thế về một kho đọc không được là nói sai.
    expect(() => cong.read('persistDenied')).toThrow(
      expect.objectContaining({ code: MA_LOI.DB }),
    );
  });
});
