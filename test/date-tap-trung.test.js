import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThichJs } from './helpers/quet-nguon.js';

// AD-4: `daysBetween` là nơi DUY NHẤT trong toàn bộ mã được dựng `Date`. AC nói "grep toàn
// repo", nên nó phải là một test — một lời hứa không chặn được story sau lỡ tay gọi
// `new Date()` trong `fold.js` hay `query.js`, và cái sai đó lệch một ngày qua mốc đổi giờ
// mùa hè, tức nó không đỏ ở chỗ nó được viết mà đỏ ở tận Epic 6.
//
// Quét cả bốn cửa dựng/đọc thời gian — `new Date(`, `Date.now(`, `Date.parse(`, `Date.UTC(`.
// Chỉ chặn `new Date(` là bỏ ngỏ đúng cái sai nguy hiểm nhất: một `Date.parse(note.createdAt)`
// ở story sau chính là phép "dựng Date từ createdAt" mà AD-4 cấm.
//
// Bỏ chú thích trước khi quét là bắt buộc: chính chú thích của `time.js` nói về `Date`.
//
// LỖ ĐÃ BIẾT: bộ quét KHÔNG bỏ nội dung chuỗi/template (khác `nguong-tap-trung.test.js`), nên
// một chuỗi chứa nguyên văn `new Date(` sẽ bị báo là vi phạm. Chọn thế có chủ ý: dương tính giả
// ở đây bắt người viết đổi một chuỗi vô hại, còn âm tính giả bỏ lọt một lời gọi thật. Có test
// ghim đúng hành vi này ở dưới, để ai nới nó phải nới một cách tường minh.

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');

/** File duy nhất được phép dựng `Date` (AD-4). */
const FILE_MIEN_TRU = 'app/core/time.js';

const bieuThucDate = /new\s+Date\s*\(|Date\s*\.\s*(?:now|parse|UTC)\s*\(/g;

/** Rút gọn đoạn khớp về một tên dạng chuẩn để thông báo nêu đúng cửa nào bị dùng. */
function dangKhop(doan) {
  const ten = /Date\s*\.\s*(now|parse|UTC)/.exec(doan);
  return ten ? `Date.${ten[1]}(` : 'new Date(';
}

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

function dungDateTrongFile(maNguon) {
  const sach = boChuThichJs(maNguon);
  const tim = [];
  for (const khop of sach.matchAll(bieuThucDate)) {
    tim.push({ dong: sach.slice(0, khop.index).split('\n').length, dang: dangKhop(khop[0]) });
  }
  return tim;
}

describe('dựng Date tập trung ở app/core/time.js', () => {
  const fileJs = danhSachFileJs(appDir);

  it('có file để quét và time.js nằm trong đó', () => {
    expect(fileJs.map(duongDanTuongDoi)).toContain(FILE_MIEN_TRU);
  });

  it('không nơi nào ngoài time.js dựng hay đọc Date', () => {
    const viPham = [];
    for (const duongDan of fileJs) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      if (tuongDoi === FILE_MIEN_TRU) continue;
      for (const { dong, dang } of dungDateTrongFile(readFileSync(duongDan, 'utf8'))) {
        viPham.push(`${tuongDoi}:${dong} — ${dang} (chuyển vào ${FILE_MIEN_TRU})`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('bộ quét bắt được cả bốn cửa và bỏ qua chú thích/khoảng trắng lạ', () => {
    // Dương tính, kể cả khi viết dãn ra.
    expect(dungDateTrongFile('const t = new Date();')).toEqual([{ dong: 1, dang: 'new Date(' }]);
    expect(dungDateTrongFile('\nconst t = new  Date (0);')).toEqual([
      { dong: 2, dang: 'new Date(' },
    ]);
    // Ba cửa tĩnh — `Date.parse(note.createdAt)` chính là cái AD-4 cấm.
    expect(dungDateTrongFile('const t = Date.now();')).toEqual([{ dong: 1, dang: 'Date.now(' }]);
    expect(dungDateTrongFile('const t = Date.parse(x);')).toEqual([
      { dong: 1, dang: 'Date.parse(' },
    ]);
    expect(dungDateTrongFile('const t = Date . UTC (y);')).toEqual([{ dong: 1, dang: 'Date.UTC(' }]);
    // Âm tính: chú thích nói về `new Date(` không phải vi phạm — chính `time.js` viết vậy.
    expect(dungDateTrongFile('// không được dựng new Date( ở đây\n/* Date.now() */')).toEqual([]);
  });

  it('LỖ ĐÃ BIẾT: chuỗi không được bỏ, nên văn bản chứa `new Date(` vẫn bị báo', () => {
    expect(dungDateTrongFile('const s = "new Date(";')).toEqual([{ dong: 1, dang: 'new Date(' }]);
  });
});
