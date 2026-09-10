import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThichJs, laViTriRegex } from './helpers/quet-nguon.js';

// AC "grep toàn repo không ra ngưỡng nào ngoài limits.js" phải là một test, không phải lời hứa.
// Test chỉ đọc `limits.js` nghiệm thu được "các hằng có mặt" nhưng không nghiệm thu được
// "không ngưỡng nào ở ngoài" — mà nửa sau mới là nửa vỡ ở Story 1.6 hay Epic 6.

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');

/** File duy nhất được phép chứa số literal (AD-14). */
const FILE_MIEN_TRU = 'app/core/limits.js';

/** Số được miễn trừ ở khắp nơi: chúng không phải ngưỡng, chúng là cấu trúc
 *  (chỉ số đầu mảng, bước nhảy một đơn vị, "không tìm thấy" `-1` của `indexOf` —
 *  dấu trừ không thuộc literal nên chỉ cần miễn trừ chữ số `1`). */
const SO_MIEN_TRU = new Set(['0', '1']);

function danhSachFileJs(thuMuc) {
  const ketQua = [];
  if (!existsSync(thuMuc)) return ketQua;
  for (const muc of readdirSync(thuMuc, { withFileTypes: true })) {
    const duongDan = join(thuMuc, muc.name);
    if (muc.isDirectory()) {
      ketQua.push(...danhSachFileJs(duongDan));
    } else if (muc.name.endsWith('.js')) {
      ketQua.push(duongDan);
    }
  }
  return ketQua;
}

function duongDanTuongDoi(duongDanTuyetDoi) {
  return relative(repoRoot, duongDanTuyetDoi).split('\\').join('/');
}

// `laViTriRegex` dùng chung với `boChuThichJs` (test/helpers/quet-nguon.js): nó xét cả
// từ khóa đứng trước, nên `return /^\d{4}$/` không bị đọc thành phép chia.

/**
 * Thay nội dung mọi chuỗi ('…', "…", `…`) và mọi regex literal bằng rỗng, giữ nguyên
 * dấu mở/đóng. Ba lý do, không phải một:
 *
 * - Một microcopy nhắc "20.000 ký tự" là câu chữ, không phải một ngưỡng nằm sai chỗ.
 * - `{4}` trong `/^\d{4}$/` là lượng từ của regex, không phải một ngưỡng — Story 1.3 phân
 *   tích `dd/MM/yyyy` sẽ viết đúng dạng này và không được đỏ oan.
 * - NHƯNG phần `${…}` của template literal là MÃ THẬT: `` `${400}` `` phải bị bắt, nên bộ
 *   quét thoát khỏi trạng thái chuỗi ở `${` và vào lại ở `}` khớp cặp.
 */
function boNoiDungChuoi(ma) {
  let ketQua = '';
  let i = 0;
  let dauChuoi = null;
  // Ngăn xếp template đang bị tạm ngắt bởi `${`; mỗi phần tử đếm độ sâu `{` lồng nhau.
  const nganXepTemplate = [];
  while (i < ma.length) {
    const c = ma[i];
    if (dauChuoi) {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (dauChuoi === '`' && c === '$' && ma[i + 1] === '{') {
        // Vào vùng nội suy: đây là mã, phải quét.
        nganXepTemplate.push(0);
        dauChuoi = null;
        ketQua += '${';
        i += 2;
        continue;
      }
      if (c === dauChuoi) {
        dauChuoi = null;
        ketQua += c;
      } else if (c === '\n') {
        ketQua += c;
      }
      i += 1;
      continue;
    }
    if (nganXepTemplate.length > 0) {
      if (c === '{') {
        nganXepTemplate[nganXepTemplate.length - 1] += 1;
      } else if (c === '}') {
        if (nganXepTemplate[nganXepTemplate.length - 1] === 0) {
          // Đóng vùng nội suy — quay lại thân template.
          nganXepTemplate.pop();
          dauChuoi = '`';
          ketQua += c;
          i += 1;
            continue;
        }
        nganXepTemplate[nganXepTemplate.length - 1] -= 1;
      }
    }
    if (c === '"' || c === "'" || c === '`') {
      dauChuoi = c;
    } else if (c === '/' && laViTriRegex(ketQua)) {
      // Regex literal: bỏ toàn bộ thân, kể cả lớp ký tự `[…/…]` chứa dấu `/`.
      let j = i + 1;
      let trongLop = false;
      let dong = false;
      while (j < ma.length) {
        const d = ma[j];
        if (d === '\\') {
          j += 2;
          continue;
        }
        if (d === '\n') break;
        if (trongLop) {
          if (d === ']') trongLop = false;
        } else if (d === '[') {
          trongLop = true;
        } else if (d === '/') {
          dong = true;
          break;
        }
        j += 1;
      }
      if (dong) {
        ketQua += '//';
        i = j + 1;
        // Bỏ luôn cờ (`gimsuyd`) để chúng không thành định danh lạc.
        while (i < ma.length && /[a-z]/.test(ma[i])) i += 1;
        continue;
      }
      // Không đóng được trên cùng một dòng → đây là phép chia, xử như ký tự thường.
    }
    ketQua += c;
    i += 1;
  }
  return ketQua;
}

// Số literal JS: thập phân, dấu chấm động, mũ, phân tách `_`, và cả `0x`/`0b`/`0o`.
// `(?<![\w$.])` chặn bắt nhầm phần đuôi của một định danh (`utf8`) hay `x.0`.
// KHÔNG bắt dấu `-` đứng trước: trong `tong - 400` dấu trừ là phép toán, và báo `số -400`
// là nêu một literal không hề được viết trong file.
const bieuThucSo = /(?<![\w$.])(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)n?/g;

function soTrongFile(maNguon) {
  const sach = boNoiDungChuoi(boChuThichJs(maNguon));
  const tim = [];
  for (const khop of sach.matchAll(bieuThucSo)) {
    const so = khop[0];
    if (SO_MIEN_TRU.has(so)) continue;
    const dong = sach.slice(0, khop.index).split('\n').length;
    tim.push({ so, dong });
  }
  return tim;
}

describe('ngưỡng tập trung ở app/core/limits.js', () => {
  const fileJs = danhSachFileJs(appDir);

  it('có file để quét và limits.js nằm trong đó', () => {
    expect(fileJs.map(duongDanTuongDoi)).toContain(FILE_MIEN_TRU);
  });

  it('không số literal nào sống ngoài limits.js', () => {
    const viPham = [];
    for (const duongDan of fileJs) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      if (tuongDoi === FILE_MIEN_TRU) continue;
      for (const { so, dong } of soTrongFile(readFileSync(duongDan, 'utf8'))) {
        viPham.push(`${tuongDoi}:${dong} — số ${so} (chuyển vào ${FILE_MIEN_TRU})`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('bộ quét tự nó bắt được một ngưỡng lạc và bỏ qua chú thích/chuỗi', () => {
    // Dương tính: con số trần trụi trong mã.
    expect(soTrongFile('const cho = 400;').map((v) => v.so)).toEqual(['400']);
    // Miễn trừ cấu trúc.
    expect(soTrongFile('let i = 0; i += 1; arr.indexOf(x) === -1;')).toEqual([]);
    // Âm tính: chú thích và chuỗi có chữ số không làm đỏ oan.
    expect(soTrongFile('// AD-14, 2026\n/* 50 * 1024 */\nconst s = "20.000 ký tự";')).toEqual([]);
  });

  it('regex literal không đỏ oan, nhưng ${…} trong template thì bị bắt', () => {
    // Lượng từ của regex là cú pháp, không phải ngưỡng — Story 1.3 viết đúng dạng này.
    expect(soTrongFile('const r = /^\\d{4}-\\d{2}-\\d{2}$/;')).toEqual([]);
    // Lớp ký tự chứa dấu `/` không làm bộ quét hiểu nhầm chỗ đóng regex.
    expect(soTrongFile('const r = /[/0-9]{2}/g;\nconst x = 400;').map((v) => v.so)).toEqual(['400']);
    // Phần nội suy là mã thật: một ngưỡng giấu trong đó phải đỏ.
    expect(soTrongFile('const t = `cho ${400} ms`;').map((v) => v.so)).toEqual(['400']);
    // Nội suy lồng nhau, và thân template vẫn là câu chữ.
    expect(soTrongFile('const t = `${ {a: 400}.a } và 20.000 ký tự`;').map((v) => v.so)).toEqual([
      '400',
    ]);
    // Phép chia vẫn là phép chia, không bị nuốt như regex.
    expect(soTrongFile('const x = tong / 300;').map((v) => v.so)).toEqual(['300']);
    // Regex ngay sau một TỪ KHÓA (không phải dấu) vẫn là regex — Story 1.3 viết dạng này.
    expect(soTrongFile('function f(x) {\n  return /^\\d{4}$/.test(x);\n}')).toEqual([]);
    for (const tu of ['typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw']) {
      expect(laViTriRegex(`x ${tu}`)).toBe(true);
    }
  });

  it('báo đúng literal như nó được viết, và đúng số dòng sau chú thích khối', () => {
    // Dấu trừ là phép toán: literal trong file là `400`, không phải `-400`.
    expect(soTrongFile('const x = tong - 400;').map((v) => v.so)).toEqual(['400']);
    // Chú thích khối bị bỏ nhưng số dòng phía sau không trôi.
    const nguon = '/**\n * mot\n * hai\n * ba\n */\nconst x = 400;';
    expect(soTrongFile(nguon)).toEqual([{ so: '400', dong: 6 }]);
    // Regex chứa dấu nháy không đẩy bộ quét vào trạng thái chuỗi giả.
    expect(soTrongFile("const q = /['\"]/;\n// nam 2026 va nguong 400\n")).toEqual([]);
  });
});
