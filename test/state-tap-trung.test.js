import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThichJs } from './helpers/quet-nguon.js';

// AD-1 và AD-16 phải là test, không phải lời hứa.
//
// `core-state.test.js` nghiệm thu được "state.js làm đúng"; nó KHÔNG nghiệm thu được "không
// nơi nào khác ghi vào state" hay "không trường nào mang nghĩa đã lưu" — mà nửa sau mới là
// nửa vỡ ở Story 1.6, Epic 2 và mọi epic sau. Bốn cửa dưới đây quét cả cây `app/`:
//
// (a) Mọi phép GHI vào state viết THẲNG qua `state` — gán, gán hàng loạt, `delete`, và các
//     hàm đổi mảng tại chỗ — ngoài `state.js`. Đóng băng sâu đã chặn việc này lúc chạy, nhưng
//     chỉ ở nhánh mã có người chạy tới; bộ quét bắt cả nhánh chưa ai chạy, và bắt nó lúc
//     `npm test` chứ không phải lúc dùng thật. Cửa này neo vào cách VIẾT `state`, nên ghi qua
//     một biến trung gian thì nó không thấy — xem mục "LỖ ĐÃ BIẾT" ở cuối tệp.
// (b) Mọi định danh mang nghĩa "đang lưu" / "đã lưu" / "chưa chốt" / "số ký tự còn lại", ở
//     BẤT KỲ ĐÂU dưới `app/` — kể cả trong `state.js`, vì AD-16 cấm chính trường đó tồn tại.
// (c) Tên công nghệ trong `app/ports/`, KỂ CẢ trong chuỗi VÀ trong chú thích. Chữ ký cổng phải trừu tượng thật:
//     một cổng tên là "kho ghi chú bền" mà chú thích nói tên kho cụ thể thì story sau sẽ viết
//     adapter theo cái tên đó, không theo chữ ký.
// (d) Mọi lời gọi `taoStore(` ngoài `app/main.js`, và trong `main.js` thì ĐÚNG một lần — đó
//     là cách "một khối state duy nhất" trở thành một điều kiểm được (AD-1).
//
// Ba cửa (a), (b), (d) bỏ chú thích trước khi quét, và đó là bắt buộc: chính chú thích của
// khối trên nói về `state.` và về "đã lưu". Cửa (c) thì quét nguồn THÔ — spec đòi từ vựng
// trừu tượng "kể cả trong chú thích", và chú thích là thứ người viết adapter đọc.
//
// Nội dung CHUỖI thì không cửa nào bỏ, giống `date-tap-trung.test.js` — xem mục "LỖ ĐÃ BIẾT"
// ở cuối, và với cửa (c) thì đó là yêu cầu, không phải nhượng bộ.

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');

/** File duy nhất được phép đổi state (AD-1) — nên cửa (a) và (d) miễn trừ nó. */
const FILE_STATE = 'app/core/state.js';

/** File duy nhất được phép gọi `taoStore` (AD-2). */
const FILE_BOOTSTRAP = 'app/main.js';

/** Thư mục mà cửa (c) canh. */
const THU_MUC_PORTS = 'app/ports/';

// Toán tử gán, gồm cả gán kép và tăng/giảm — `state.seq++` cũng là một phép đổi state.
const TOAN_TU_GAN = String.raw`=(?!=)|\+\+|--|(?:[-+*\/%&|^]|\*\*|<<|>>>?|\?\?|\|\||&&)=`;

// Một bước truy cập trường: `.ten` hoặc `[bieuThuc]`, cho phép khoảng trắng dãn ra hai bên
// — `store . state [ khoa ] = 1` là đúng cùng một phép ghi.
const MOT_BUOC = String.raw`(?:\s*\.\s*[\w$]+|\s*\[[^\]\n]*\])`;

// Cách viết `state` mà một phép ghi có thể neo vào: `.state`, `['state']`, hoặc định danh
// `state` trần. Gộp thành một nhánh để bốn dạng ghi dưới đây không phải chép lại ba lần.
const NEO_STATE = String.raw`(?:\.\s*state|\[\s*(?:'state'|"state"|\x60state\x60)\s*\]|(?<![\w$.])state)`;

/** Phương thức đổi tại chỗ của `Array` — `.push(` không có toán tử gán nào nhưng vẫn là ghi. */
const HAM_DOI_MANG = 'push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin';

const CUA_GAN_STATE = [
  // Gán vào chính `.state` (`store.state = {...}`) hoặc vào trường dưới nó.
  new RegExp(String.raw`\.\s*state\s*${MOT_BUOC}*\s*(?:${TOAN_TU_GAN})`, 'g'),
  // Gán vào trường dưới một biến tên `state` — đòi ÍT NHẤT một bước, vì `const state = …`
  // chỉ là một biến cục bộ nhận store, không phải một phép ghi vào khối state.
  new RegExp(String.raw`(?<![\w$.])state\s*${MOT_BUOC}+\s*(?:${TOAN_TU_GAN})`, 'g'),
  // Truy cập bằng chuỗi: `store['state'].notes = []` lách qua hai cửa trên vì không có `.state`.
  new RegExp(
    String.raw`\[\s*(?:'state'|"state"|\x60state\x60)\s*\]\s*${MOT_BUOC}*\s*(?:${TOAN_TU_GAN})`,
    'g',
  ),
  // Ghi không dùng toán tử gán: gán hàng loạt, `delete`, và các hàm đổi mảng tại chỗ.
  new RegExp(String.raw`Object\s*\.\s*assign\s*\(\s*[^,)\n]*${NEO_STATE}`, 'g'),
  new RegExp(String.raw`\bdelete\s+[^;\n]*${NEO_STATE}\s*(?:\.|\[)`, 'g'),
  new RegExp(String.raw`${NEO_STATE}\s*${MOT_BUOC}*\s*\.\s*(?:${HAM_DOI_MANG})\s*\(`, 'g'),
];

/** Định danh bị AD-16 cấm. So khớp theo chuỗi con, không theo ranh giới từ: `saveStatus`
 *  và `isSavingNow` phải đỏ y như `saving`. */
const TU_CAM_AD16 = [
  'dangLuu',
  'daLuu',
  'chuaLuu',
  'dangGhi',
  'daGhi',
  'chuaChot',
  'luuThanhCong',
  'saving',
  'saved',
  'unsaved',
  'saveState',
  'saveStatus',
  'kyTuConLai',
  'conLaiKyTu',
  'charsLeft',
  'charsRemaining',
  'remainingChars',
  // Từ vựng "một phép ghi đang bay": nó là cùng một trường bị AD-16 cấm, chỉ đổi tên.
  'isDirty',
  'inFlight',
  'dangGui',
];

// KHÔNG thêm `pending`, `busy` hay `dongBo` vào danh sách trên, dù chúng cùng nghĩa trong
// một số cách viết. Cửa (b) so khớp chuỗi con trên MỌI định danh dưới `app/`, nên ba từ đó
// sẽ làm đỏ những tên hoàn toàn hợp lệ mà các story sau chắc chắn dùng: hẹn debounce của tự
// lưu ở Story 1.7 (`pendingTimer` là đúng tên cho một cái hẹn đang treo), và phép đồng bộ đa
// tab của Epic 7 (`dongBoTuTabKhac`). Một cửa hay đỏ oan là một cửa sẽ bị nới ra rồi bỏ.

/** Tên công nghệ không được xuất hiện trong `app/ports/`, kể cả trong chuỗi (AD-2). */
const TU_CAM_CONG_NGHE = ['IndexedDB', 'localStorage', 'BroadcastChannel'];

const MAU_GOI_TAO_STORE = /taoStore\s*\(/g;

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

function soDong(sach, viTri) {
  return sach.slice(0, viTri).split('\n').length;
}

/** Cửa (a). */
function ganVaoStateTrongFile(maNguon) {
  const sach = boChuThichJs(maNguon);
  const tim = [];
  for (const mau of CUA_GAN_STATE) {
    for (const khop of sach.matchAll(mau)) {
      tim.push({ dong: soDong(sach, khop.index), doan: khop[0].trim() });
    }
  }
  return tim.sort((a, b) => a.dong - b.dong);
}

/** Cửa (b). */
function tuCamTrongFile(maNguon) {
  const sach = boChuThichJs(maNguon);
  const thap = sach.toLowerCase();
  const tim = [];
  for (const tu of TU_CAM_AD16) {
    const tuThap = tu.toLowerCase();
    let i = thap.indexOf(tuThap);
    while (i >= 0) {
      tim.push({ dong: soDong(sach, i), tu });
      i = thap.indexOf(tuThap, i + tuThap.length);
    }
  }
  return tim.sort((a, b) => a.dong - b.dong);
}

/**
 * Cửa (c) — cửa DUY NHẤT quét nguồn THÔ, không bỏ chú thích.
 *
 * Ba cửa còn lại bỏ chú thích vì chú thích nói về điều bị cấm không phải điều bị cấm. Ở đây
 * thì ngược lại: spec đòi chữ ký cổng trừu tượng "kể cả trong chú thích", và lý do rất cụ
 * thể — người viết adapter ở Story 1.6 đọc chú thích, không đọc `@typedef`. Một chú thích
 * nêu tên công nghệ chính là chỗ ràng buộc "lõi không biết trình duyệt" bị phá bằng lời.
 */
function tuCongNgheTrongFile(maNguon) {
  const sach = maNguon;
  const thap = sach.toLowerCase();
  const tim = [];
  for (const tu of TU_CAM_CONG_NGHE) {
    const tuThap = tu.toLowerCase();
    let i = thap.indexOf(tuThap);
    while (i >= 0) {
      tim.push({ dong: soDong(sach, i), tu });
      i = thap.indexOf(tuThap, i + tuThap.length);
    }
  }
  return tim.sort((a, b) => a.dong - b.dong);
}

/** Cửa (d). */
function goiTaoStoreTrongFile(maNguon) {
  const sach = boChuThichJs(maNguon);
  const tim = [];
  for (const khop of sach.matchAll(MAU_GOI_TAO_STORE)) {
    tim.push({ dong: soDong(sach, khop.index) });
  }
  return tim;
}

describe('một khối state, một đường đổi (AD-1) và im lặng khi thành công (AD-16)', () => {
  const fileJs = danhSachFileJs(appDir);

  it('có file để quét, và cả state.js lẫn main.js nằm trong đó', () => {
    const ten = fileJs.map(duongDanTuongDoi);
    expect(ten).toContain(FILE_STATE);
    expect(ten).toContain(FILE_BOOTSTRAP);
    expect(ten.some((t) => t.startsWith(THU_MUC_PORTS))).toBe(true);
  });

  it('(a) không nơi nào ngoài state.js gán vào state', () => {
    const viPham = [];
    for (const duongDan of fileJs) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      if (tuongDoi === FILE_STATE) continue;
      for (const { dong, doan } of ganVaoStateTrongFile(readFileSync(duongDan, 'utf8'))) {
        viPham.push(`${tuongDoi}:${dong} — gán vào state (\`${doan}\`); dùng một action trong ${FILE_STATE}`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('(b) không định danh nào mang nghĩa "đang lưu" / "đã lưu" / "số ký tự còn lại"', () => {
    const viPham = [];
    for (const duongDan of fileJs) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      for (const { dong, tu } of tuCamTrongFile(readFileSync(duongDan, 'utf8'))) {
        viPham.push(`${tuongDoi}:${dong} — \`${tu}\` (AD-16: state không có trường như vậy)`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('(c) app/ports/ không nêu tên công nghệ, kể cả trong chuỗi', () => {
    const viPham = [];
    for (const duongDan of fileJs) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      if (!tuongDoi.startsWith(THU_MUC_PORTS)) continue;
      for (const { dong, tu } of tuCongNgheTrongFile(readFileSync(duongDan, 'utf8'))) {
        viPham.push(`${tuongDoi}:${dong} — \`${tu}\` (AD-2: chữ ký cổng dùng từ vựng trừu tượng)`);
      }
    }
    expect(viPham).toEqual([]);
  });

  it('(d) chỉ main.js gọi taoStore, và đúng một lần', () => {
    const viPham = [];
    let soLanTrongBootstrap = 0;
    for (const duongDan of fileJs) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      if (tuongDoi === FILE_STATE) continue;
      const goi = goiTaoStoreTrongFile(readFileSync(duongDan, 'utf8'));
      if (tuongDoi === FILE_BOOTSTRAP) {
        soLanTrongBootstrap = goi.length;
        continue;
      }
      for (const { dong } of goi) {
        viPham.push(`${tuongDoi}:${dong} — chỉ ${FILE_BOOTSTRAP} được gọi taoStore`);
      }
    }
    expect(viPham).toEqual([]);
    expect(soLanTrongBootstrap).toBe(1);
  });
});

describe('bộ quét tự nó đúng — dương tính lẫn âm tính', () => {
  it('(a) dương tính: các dạng ghi thẳng vào state đều bị bắt, đúng số dòng', () => {
    expect(ganVaoStateTrongFile('store.state.notes = [];')).toEqual([
      { dong: 1, doan: '.state.notes =' },
    ]);
    expect(ganVaoStateTrongFile('\n\nstore.state = {};').map((v) => v.dong)).toEqual([3]);
    expect(ganVaoStateTrongFile('state.editing.seq++;').map((v) => v.dong)).toEqual([1]);
    expect(ganVaoStateTrongFile('store.state.draft.text += "x";').map((v) => v.dong)).toEqual([1]);
    // Viết dãn ra thì hai cửa cùng nổ trên một dòng — báo dư một lần thì vô hại, bỏ lọt mới nguy.
    expect(ganVaoStateTrongFile('store . state [ khoa ] = 1;').map((v) => v.dong)).toEqual([1, 1]);
    expect(ganVaoStateTrongFile('state.banner ??= null;').map((v) => v.dong)).toEqual([1]);
  });

  it('(a) dương tính: ghi KHÔNG dùng toán tử gán cũng bị bắt', () => {
    // Bốn dạng lách qua một bộ quét chỉ tìm dấu `=`.
    expect(ganVaoStateTrongFile('Object.assign(store.state, { notes: [] });').length).toBeGreaterThan(
      0,
    );
    expect(ganVaoStateTrongFile('delete store.state.banner;').length).toBeGreaterThan(0);
    expect(ganVaoStateTrongFile('store.state.notes.push(note);').length).toBeGreaterThan(0);
    expect(ganVaoStateTrongFile('store.state.notes.sort(theoStamp);').length).toBeGreaterThan(0);
    expect(ganVaoStateTrongFile('store.state.notes.splice(i, n);').length).toBeGreaterThan(0);
    expect(ganVaoStateTrongFile("store['state'].notes = [];").map((v) => v.dong)).toEqual([1]);
    expect(ganVaoStateTrongFile('\nstore["state"].dieuKien.keyword = "x";').map((v) => v.dong)).toEqual(
      [2],
    );
  });

  it('(a) âm tính: ĐỌC state, và một biến cục bộ tên state, không phải vi phạm', () => {
    expect(ganVaoStateTrongFile('const x = store.state.notes;')).toEqual([]);
    expect(ganVaoStateTrongFile('if (store.state.readOnly === true) return;')).toEqual([]);
    expect(ganVaoStateTrongFile('const state = taoStore(ports);')).toEqual([]);
    expect(ganVaoStateTrongFile('let state;\nstate = taoStore(ports);')).toEqual([]);
    // Một trường chỉ TRÙNG tiền tố cũng không bị bắt.
    expect(ganVaoStateTrongFile('obj.stateful = true;')).toEqual([]);
    // Chú thích nói về phép gán bị cấm thì không làm đỏ oan.
    expect(ganVaoStateTrongFile('// đừng viết store.state.notes = [] ở đây')).toEqual([]);
  });

  it('(b) dương tính lẫn âm tính cho từ vựng AD-16', () => {
    expect(tuCamTrongFile('const dangLuu = true;')).toEqual([{ dong: 1, tu: 'dangLuu' }]);
    // Chuỗi con, không phải ranh giới từ: một hậu tố không cứu được nó.
    expect(tuCamTrongFile('let isSavingNow = false;').map((v) => v.tu)).toEqual(['saving']);
    expect(tuCamTrongFile('\nconst soKyTuConLai = n;').map((v) => v.tu)).toEqual(['kyTuConLai']);
    expect(tuCamTrongFile('const x = { saveStatus: 1 };').map((v) => v.tu)).toEqual([
      'saveStatus',
    ]);
    expect(tuCamTrongFile('function saveState(x) {}').map((v) => v.tu)).toEqual(['saveState']);
    // "Một phép ghi đang bay" là cùng cái trường bị cấm, chỉ đổi tên.
    expect(tuCamTrongFile('let isDirty = false;').map((v) => v.tu)).toEqual(['isDirty']);
    expect(tuCamTrongFile('let ghiInFlight = null;').map((v) => v.tu)).toEqual(['inFlight']);
    expect(tuCamTrongFile('let dangGuiTin = false;').map((v) => v.tu)).toEqual(['dangGui']);
    // Âm tính CÓ CHỦ Ý: tên hợp lệ của story sau không được đỏ, xem chú thích ở TU_CAM_AD16.
    expect(tuCamTrongFile('let pendingTimer = null;\nconst busy = f();')).toEqual([]);
    expect(tuCamTrongFile('function dongBoTuTabKhac() {}')).toEqual([]);
    // Âm tính: chú thích nhắc tới lệnh cấm, và microcopy tiếng Việt có chữ "lưu".
    expect(tuCamTrongFile('// AD-16: không có trường dangLuu hay saved')).toEqual([]);
    expect(tuCamTrongFile("const s = 'Chữ vừa gõ CHƯA được lưu.';")).toEqual([]);
    expect(tuCamTrongFile("const s = 'Xuất sao lưu, rồi xóa bớt ghi chú cũ.';")).toEqual([]);
  });

  it('(c) tên công nghệ bị bắt trong chuỗi VÀ trong chú thích', () => {
    expect(tuCongNgheTrongFile("const s = 'localStorage';").map((v) => v.tu)).toEqual([
      'localStorage',
    ]);
    expect(tuCongNgheTrongFile('\nconst t = `kho IndexedDB`;').map((v) => v.tu)).toEqual([
      'IndexedDB',
    ]);
    // Đây là cửa duy nhất KHÔNG bỏ chú thích, và đó là yêu cầu của spec: chữ ký cổng phải
    // trừu tượng kể cả trong chú thích, vì chú thích là thứ người viết adapter đọc.
    expect(
      tuCongNgheTrongFile('// kênh liên tab được dựng bằng BroadcastChannel').map((v) => v.tu),
    ).toEqual(['BroadcastChannel']);
    expect(tuCongNgheTrongFile('\n/* đọc từ localStorage */').map((v) => v.dong)).toEqual([2]);
    // Âm tính: từ vựng trừu tượng thật thì không đỏ.
    expect(tuCongNgheTrongFile('// kho ghi chú bền, có giao dịch')).toEqual([]);
  });

  it('(d) đếm đúng số lời gọi taoStore và bỏ qua chú thích', () => {
    expect(goiTaoStoreTrongFile('const a = taoStore(p);').map((v) => v.dong)).toEqual([1]);
    expect(goiTaoStoreTrongFile('taoStore(p);\ntaoStore (q);').map((v) => v.dong)).toEqual([1, 2]);
    expect(goiTaoStoreTrongFile("import { taoStore } from './core/state.js';")).toEqual([]);
    expect(goiTaoStoreTrongFile('// gọi taoStore(p) đúng một lần')).toEqual([]);
  });

  it('LỖ ĐÃ BIẾT: ghi qua BIẾN TRUNG GIAN lọt qua cửa (a)', () => {
    // Bộ quét neo vào cách VIẾT `state`, nên đặt tên khác cho nó là ra khỏi tầm với — muốn
    // bắt được thì phải lần theo luồng dữ liệu, tức viết một bộ phân tích cú pháp, và đó là
    // đổi một lỗ nhỏ lấy một bộ quét không ai bảo trì được.
    //
    // Chốt chặn cho lỗ này là ĐÓNG BĂNG SÂU lúc chạy (`core-state.test.js`): dòng dưới đây
    // ném `TypeError` ngay lần đầu có người chạy tới nó. Nói cách khác cửa (a) bắt được cái
    // sai TRƯỚC khi ai chạy tới, còn đóng băng bắt phần còn lại LÚC chạy tới; không cửa nào
    // một mình đủ, và không cửa nào giả vờ là đủ.
    expect(ganVaoStateTrongFile('const s = store.state;\ns.notes = [];')).toEqual([]);
  });

  it('LỖ ĐÃ BIẾT: chuỗi không được bỏ, nên văn bản chứa mã vi phạm vẫn bị báo', () => {
    // Cùng lựa chọn với `date-tap-trung.test.js`: dương tính giả bắt người viết đổi một chuỗi
    // vô hại, còn âm tính giả bỏ lọt một phép ghi thật. Với cửa (c) thì đây là yêu cầu.
    expect(ganVaoStateTrongFile('const s = "store.state.notes = []";').map((v) => v.dong)).toEqual([
      1,
    ]);
    expect(goiTaoStoreTrongFile('const s = "taoStore(";').map((v) => v.dong)).toEqual([1]);
  });
});
