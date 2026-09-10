import { describe, expect, it } from 'vitest';
import { fold } from '../app/core/fold.js';

// AD-5 đòi chứng minh cả KẾT QUẢ lẫn LÝ DO: ngoài ma trận I/O còn phải có test cho thấy đảo
// thứ tự (phân rã trước, map `đ` sau) cho kết quả SAI, và một test riêng cho bất biến vị trí.

const NFD = 'NFD';
const DAU_SAC = '́'; // dấu sắc đứng rời (đầu vào đã ở dạng NFD)
const I_CHAM = 'İ'; // `İ` — hạ chữ thường ra HAI ký tự

describe('fold — ma trận I/O', () => {
  it('bỏ dấu cơ bản và hạ chữ thường', () => {
    expect(fold('Phân quyền')).toBe('phan quyen');
  });

  it('`đ` hoa và thường đều thành `d`', () => {
    expect(fold('Đường ĐI')).toBe('duong di');
  });

  it('nhiều dấu chồng, độ dài giữ nguyên', () => {
    const nguon = 'Kiểm thử — ế, ợ, ữ';
    expect(fold(nguon)).toBe('kiem thu — e, o, u');
    expect(fold(nguon)).toHaveLength(nguon.length);
  });

  it('phần không phải chữ Việt còn nguyên, chỉ hạ chữ thường', () => {
    expect(fold('ABC 123 \n\t!@#')).toBe('abc 123 \n\t!@#');
  });

  it('chuỗi rỗng ra chuỗi rỗng', () => {
    expect(fold('')).toBe('');
  });

  it('ký tự ngoài BMP không bị xẻ đôi', () => {
    const nguon = 'Ghi 📌 chú';
    expect(fold(nguon)).toBe('ghi 📌 chu');
    expect(fold(nguon)).toHaveLength(nguon.length);
  });

  it('đầu vào không phải chuỗi thì ném TypeError nêu giá trị nhận được', () => {
    expect(() => fold(null)).toThrow(TypeError);
    expect(() => fold(null)).toThrow(/null/);
    expect(() => fold(42)).toThrow(/42/);
    expect(() => fold(undefined)).toThrow(/undefined/);
    expect(() => fold(['x'])).toThrow(TypeError);
  });

  it('đầu vào đã ở dạng NFD: dấu kết hợp GIỮ NGUYÊN, `đ` vẫn thành `d`', () => {
    const nguon = `e${DAU_SAC} đ`;
    expect(fold(nguon)).toBe(`e${DAU_SAC} d`);
    expect(fold(nguon)).toHaveLength(nguon.length);
  });

  it('`İ` giữ nguyên vì hạ chữ thường nó làm đổi độ dài', () => {
    expect(fold(I_CHAM)).toBe(I_CHAM);
    expect(fold(`A${I_CHAM}B`)).toBe(`a${I_CHAM}b`);
    expect(fold(I_CHAM)).toHaveLength(I_CHAM.length);
  });
});

describe('fold — vì sao map `đ` phải đi TRƯỚC', () => {
  /**
   * ĐẢO thứ tự AD-5, đúng như người ta hay viết: phân rã và bỏ dấu TRƯỚC, map `đ` SAU, hạ chữ
   * thường CUỐI — lý lẽ nghe rất xuôi ("hạ chữ thường cuối thì khỏi phải map cả `Đ`").
   */
  function foldDaoThuTu(text) {
    return text
      .normalize(NFD)
      .replace(/\p{M}/gu, '')
      .replace(/đ/g, 'd')
      .toLowerCase();
  }

  it('`đ` không có phân rã chuẩn, nên phân rã không đụng tới nó', () => {
    expect('đ'.normalize(NFD)).toBe('đ');
    expect('đ'.normalize(NFD).replace(/\p{M}/gu, '')).toBe('đ');
  });

  it('đảo thứ tự vẫn ra đúng ở ca không có `đ`, nên ca dễ không phát hiện được lỗi', () => {
    expect(foldDaoThuTu('Phân quyền')).toBe(fold('Phân quyền'));
  });

  it('nhưng `Đ` không được map: đảo thứ tự cho `đuong`, gõ `duong` không ra gì', () => {
    expect(foldDaoThuTu('Đường')).toBe('đuong');
    expect(foldDaoThuTu('Đường')).not.toBe(fold('Đường'));
    expect(fold('Đường')).toBe('duong');
  });

  it('và đảo thứ tự phá bất biến vị trí ở đầu vào đã NFD', () => {
    const nguon = `e${DAU_SAC}`;
    expect(foldDaoThuTu(nguon)).toHaveLength(nguon.length - 1);
    expect(fold(nguon)).toHaveLength(nguon.length);
  });
});

describe('fold — bất biến vị trí', () => {
  const MAU_THU = [
    'Phân quyền',
    'Đường ĐI',
    'Kiểm thử — ế, ợ, ữ',
    'Ghi chú hằng ngày, 08:30 sáng',
    'Nguyễn Đình Chiểu',
    'ABC 123 \n\t!@#',
    'Ghi 📌 chú',
    `e${DAU_SAC} đ`,
    I_CHAM,
    '',
  ];

  it('độ dài không đổi với mọi chuỗi thử', () => {
    for (const nguon of MAU_THU) {
      expect(fold(nguon)).toHaveLength(nguon.length);
    }
  });

  it('ánh xạ chỉ số 1-1: mọi tiền tố giữ đúng độ dài của nó', () => {
    for (const nguon of MAU_THU) {
      const daBoDau = fold(nguon);
      for (let i = 0; i <= nguon.length; i += 1) {
        // Nếu chỉ số 1-1 thì bỏ dấu tiền tố dài `i` phải ra đúng `i` ký tự...
        expect(fold(nguon.slice(0, i))).toHaveLength(i);
        // ...và đúng bằng `i` ký tự đầu của kết quả trên cả chuỗi.
        expect(fold(nguon.slice(0, i))).toBe(daBoDau.slice(0, i));
      }
    }
  });

  it('lũy đẳng: bỏ dấu lần hai không đổi gì (Epic 6 sẽ fold cả chuỗi đã fold)', () => {
    for (const nguon of MAU_THU) {
      const motLan = fold(nguon);
      expect(fold(motLan)).toBe(motLan);
    }
  });

  it('đầu ra không còn dấu kết hợp và không còn chữ hoa, trừ đúng hai ca đã ghi nhận', () => {
    const ngoaiLe = new Set();
    for (const nguon of MAU_THU) {
      for (const kyTu of fold(nguon)) {
        if (/\p{M}/u.test(kyTu) || kyTu !== kyTu.toLowerCase()) {
          ngoaiLe.add(kyTu);
        }
      }
    }
    // Đúng hai ca người dùng đã chốt đánh đổi — và KHÔNG ca nào khác lọt vào đây.
    expect([...ngoaiLe].sort()).toEqual([DAU_SAC, I_CHAM].sort());
  });

  it('mỗi ký tự đầu ra ứng đúng một ký tự đầu vào, không dồn không tách', () => {
    const nguon = 'Đường ĐI';
    const daBoDau = fold(nguon);
    for (let i = 0; i < nguon.length; i += 1) {
      expect(daBoDau[i]).toBe(fold(nguon[i]));
    }
  });
});
