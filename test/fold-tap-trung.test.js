import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThichJs } from './helpers/quet-nguon.js';

// AD-5: `fold()` ở `app/core/fold.js` là nơi DUY NHẤT bỏ dấu. AC nói "grep toàn repo", nên nó
// phải là một test — một lời hứa không chặn được Story 1.6 lỡ tay tự `normalize('NFD')` khi
// dựng `textFolded`, hay Epic 6 tự bỏ dấu chuỗi người dùng gõ. Hai bản chép tay lệch nhau một
// ly là gõ đúng mà không ra kết quả, và không có triệu chứng nào ngoài việc dùng thật.
//
// Quét ba cửa, vì một bản bỏ dấu tự chế phải đi qua ít nhất một trong số chúng:
// - `normalize(` — phân rã chuẩn, bước lõi của mọi cách bỏ dấu tử tế;
// - dải dấu kết hợp — `\p{M}` hoặc dải U+0300–U+036F viết thẳng hay viết bằng `\u….`;
// - map `đ`/`Đ` viết tay — nhận ra bằng một chuỗi literal CHỈ chứa đúng ký tự đó, hoặc bằng
//   escape `\u0111`/`\u0110`. Không chặn ký tự `đ` nói chung: microcopy tiếng Việt ở
//   `errors.js` đầy `đ`, chặn thế là dạy người ta nới lỏng chính check này.
//
// Bỏ chú thích trước khi quét là BẮT BUỘC: chính chú thích của `fold.js` nói về `NFD` và
// `\p{M}`, không bỏ thì suite đỏ oan ngay từ file được miễn trừ.
//
// LỖ ĐÃ BIẾT: bộ quét KHÔNG bỏ nội dung chuỗi/template (khác `nguong-tap-trung.test.js`), nên
// một chuỗi chứa nguyên văn `normalize(` sẽ bị báo là vi phạm. Chọn thế có chủ ý, giống
// `date-tap-trung.test.js`: dương tính giả bắt người viết đổi một chuỗi vô hại, còn âm tính
// giả bỏ lọt một lời gọi thật. Có test ghim đúng hành vi này ở dưới.

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');

/** File duy nhất được phép bỏ dấu (AD-5). */
const FILE_MIEN_TRU = 'app/core/fold.js';

const CUA = [
  { dang: "normalize(", mau: /\bnormalize\s*\(/g },
  {
    // `\p{M}`, dải U+0300–U+036F viết thẳng, và TOÀN dải đó viết bằng escape `\u….`.
    dang: "dải dấu kết hợp",
    mau: /\\p\{M[a-z_]*\}|[\u0300-\u036f]|\\u03(?:[0-5][0-9a-fA-F]|6[0-9a-fA-F])/g,
  },
  {
    // `đ`/`Đ` trong chuỗi một ký tự, viết bằng escape, HOẶC nằm trong thân một regex literal
    // (`x.replace(/đ/g, "d")` là cách viết tay phổ biến nhất, và nó không có dấu nháy nào).
    dang: "map đ→d viết tay",
    mau: /(['"`])[Đđ]\1|\\u011[01]|\/[^\n/]*[Đđ][^\n/]*\/[a-z]*/g,
  },
  {
    // Bảng tra ký tự tiền tổ hợp — dạng phổ biến nhất của người không biết NFD:
    // `{ 'á': 'a' }` hay `['ể', 'e']`. HẸP theo ngữ cảnh ánh xạ (một ký tự có dấu
    // trong nháy, rồi `:`/`,`, rồi một chữ cái ASCII trong nháy), nên microcopy tiếng Việt
    // đầy dấu ở `errors.js` không bị đụng tới.
    dang: "bảng tra ký tự có dấu",
    // Một ký tự CÓ DẤU = là chữ cái nhưng không nằm trong ASCII.
    mau: /(['"`])(?=\p{L})[^\x00-\x7F]\1\s*[:,]\s*(['"`])[A-Za-z]\2/gu,
  },
];

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

function boDauTrongFile(maNguon) {
  const sach = boChuThichJs(maNguon);
  const tim = [];
  for (const { dang, mau } of CUA) {
    for (const khop of sach.matchAll(mau)) {
      tim.push({ dong: sach.slice(0, khop.index).split('\n').length, dang });
    }
  }
  return tim.sort((a, b) => a.dong - b.dong);
}

describe('bỏ dấu tập trung ở app/core/fold.js', () => {
  const fileJs = danhSachFileJs(appDir);

  it('có file để quét và fold.js nằm trong đó', () => {
    expect(fileJs.map(duongDanTuongDoi)).toContain(FILE_MIEN_TRU);
  });

  it('không nơi nào ngoài fold.js tự bỏ dấu', () => {
    const viPham = [];
    for (const duongDan of fileJs) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      if (tuongDoi === FILE_MIEN_TRU) continue;
      for (const { dong, dang } of boDauTrongFile(readFileSync(duongDan, 'utf8'))) {
        viPham.push(`${tuongDoi}:${dong} — ${dang} (gọi fold() từ ${FILE_MIEN_TRU})`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('bộ quét bắt được cả ba cửa, kể cả khi viết dãn ra', () => {
    expect(boDauTrongFile("const x = s.normalize('NFD');")).toEqual([
      { dong: 1, dang: 'normalize(' },
    ]);
    expect(boDauTrongFile('\nconst x = s . normalize ("NFD");')).toEqual([
      { dong: 2, dang: 'normalize(' },
    ]);
    expect(boDauTrongFile("const r = /\\p{M}/gu;").map((v) => v.dang)).toEqual([
      'dải dấu kết hợp',
    ]);
    // Hai đầu dải là hai lần khớp — báo dư một dòng thì vô hại, bỏ lọt mới nguy.
    expect(boDauTrongFile('const r = /[\\u0300-\\u036f]/g;').map((v) => v.dang)).toEqual([
      'dải dấu kết hợp',
      'dải dấu kết hợp',
    ]);
    // Dải dấu kết hợp viết thẳng bằng ký tự thật, không qua escape.
    expect(boDauTrongFile('const r = /[\u0300-\u036f]/g;').map((v) => v.dang)).toEqual([
      'dải dấu kết hợp',
      'dải dấu kết hợp',
    ]);
    expect(boDauTrongFile("const m = { '\u0111': 'd', '\u0110': 'D' };").map((v) => v.dang)).toEqual(
      [
        'map đ→d viết tay',
        'map đ→d viết tay',
        // Cùng một dòng cũng là một bảng tra: hai cửa cùng nổ, và thế là đúng.
        'bảng tra ký tự có dấu',
        'bảng tra ký tự có dấu',
      ],
    );
    expect(boDauTrongFile("const m = { '\\u0111': 'd' };").map((v) => v.dang)).toEqual([
      'map đ→d viết tay',
    ]);
  });

  it('bắt cả ba dạng viết tay không dùng dấu nháy quanh ký tự', () => {
    // (a) map `đ` viết dạng regex literal — không có dấu nháy nào quanh ký tự.
    expect(boDauTrongFile('const y = x.replace(/đ/g, "d").replace(/Đ/g, "D");').map((v) => v.dang))
      .toEqual(['map đ→d viết tay', 'map đ→d viết tay']);
    // (b) escape dấu thanh riêng lẻ ở GIỮA dải, không phải hai đầu.
    expect(
      boDauTrongFile('const r = /[\\u0301\\u0303\\u0309\\u0323]/g;').map((v) => v.dang),
    ).toEqual(['dải dấu kết hợp', 'dải dấu kết hợp', 'dải dấu kết hợp', 'dải dấu kết hợp']);
    // (c) bảng tra ký tự tiền tổ hợp — dạng phổ biến nhất của người không biết NFD.
    expect(boDauTrongFile("const M = { 'á': 'a', 'ể': 'e' };").map((v) => v.dang)).toEqual([
      'bảng tra ký tự có dấu',
      'bảng tra ký tự có dấu',
    ]);
    // Cùng bảng đó viết dạng mảng cặp.
    expect(boDauTrongFile('const M = [["ữ", "u"], ["ọ", "o"]];').map((v) => v.dang)).toEqual([
      'bảng tra ký tự có dấu',
      'bảng tra ký tự có dấu',
    ]);
  });

  it('âm tính: chú thích nhắc tới normalize( và \\p{M} không làm đỏ oan', () => {
    const nguon = "// không được tự normalize('NFD') ở đây\n/* bỏ \\p{M} và map 'đ' */";
    expect(boDauTrongFile(nguon)).toEqual([]);
  });

  it('âm tính: microcopy tiếng Việt chứa `đ` không phải là map đ→d', () => {
    expect(boDauTrongFile("const s = 'Không mở được kho dữ liệu — thử lại.';")).toEqual([]);
  });

  it('âm tính: microcopy đầy ký tự có dấu và dấu phẩy không phải bảng tra', () => {
    // Câu thật trong `app/core/errors.js` — cửa "bảng tra" phải hẹp theo NGỮ CẢNH ánh xạ,
    // không phải theo sự có mặt của ký tự có dấu.
    const nguon = [
      "const M = {",
      "  A: 'Đã có bản mới. Tải lại trang — tab này đang ở chế độ chỉ đọc.',",
      "  B: 'Xuất sao lưu, rồi xóa bớt ghi chú cũ. Chữ vừa gõ CHƯA được lưu.',",
      "};",
    ].join('\n');
    expect(boDauTrongFile(nguon)).toEqual([]);
    // Và toàn bộ `errors.js` thật cũng phải sạch.
    expect(boDauTrongFile(readFileSync(join(appDir, 'core', 'errors.js'), 'utf8'))).toEqual([]);
  });

  it('chính app/core/fold.js nổ ĐÚNG những cửa nó phải nổ', () => {
    // Ghim danh sách, không phải `length > 0`: nới một cửa mà quên cập nhật ở đây thì test này
    // đỏ, thay vì im lặng xanh trong khi bộ quét đã hỏng.
    const foldJs = readFileSync(join(appDir, 'core', 'fold.js'), 'utf8');
    const cuaNo = [...new Set(boDauTrongFile(foldJs).map((v) => v.dang))].sort();
    expect(cuaNo).toEqual(
      ['normalize(', 'dải dấu kết hợp', 'map đ→d viết tay', 'bảng tra ký tự có dấu'].sort(),
    );
  });

  it('LỖ ĐÃ BIẾT: chuỗi không được bỏ, nên văn bản chứa `normalize(` vẫn bị báo', () => {
    expect(boDauTrongFile('const s = "normalize(";')).toEqual([{ dong: 1, dang: 'normalize(' }]);
  });
});
