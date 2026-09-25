// Lượt vẽ giữ tiêu điểm (Story 7.0, retro Epic 5 B2+A2) — CHẠY thật, không quét mã nguồn.
//
// Ba hàm trả tiêu điểm cũ (`traTieuDiem`, `veGiuTieuDiem` trong khối `document`, `dongRoiVe`)
// được gộp thành MỘT hàm export `veGiuTieuDiem(goc, veTatCa, neo)` của `app/main.js`. Các ca cũ
// quét thân hàm bằng regex — và một bộ quét regex vẫn xanh khi hàm neo vào MẨU thay vì vào PHẦN
// TỬ đang giữ tiêu điểm, đúng lỗi B2: Shift+Tab từ ô sửa sang nút `xóa` bị giật về thân mẩu, và
// `Enter` kế tiếp vào lại chế độ sửa thay vì mở hộp hỏi.
//
// Ở đây mọi thứ là THẬT trừ DOM: store thật, `noiLuoi` thật, `veMau` thật, `noiLuongXoa` thật.
// Gốc giả mô phỏng đúng ba điều mà các ca cần và không hơn: `activeElement`, `closest`, và việc
// `replaceChildren` GỠ phần tử đang giữ tiêu điểm thì tiêu điểm rơi về `<body>` — không có vế
// cuối thì một phép trả tiêu điểm chạy TRƯỚC lượt vẽ trông y như đúng.
//
// Mỗi ca mang tên một hàng của I/O Matrix trong spec Story 7.0.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fold } from '../app/core/fold.js';
import { AUTOSAVE_MS } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { noiLuongXoa, veGiuTieuDiem } from '../app/main.js';
import { PORT_METHODS } from '../app/ports/index.js';
import { CHON_VE_HOM_NAY } from '../app/view/hang-chip.js';
import { CHON_LUOI, noiLuoi } from '../app/view/luoi.js';
import { CHON_SUA, CHON_XOA, THUOC_TINH_MAU } from '../app/view/mau-giay.js';

const MOC = '2026-09-14T09:30:00+07:00';

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Gốc DOM tối giản — có `activeElement`, `closest`, và `<body>` khi phần tử bị gỡ
// ---------------------------------------------------------------------------

/** Phần tử đang giữ tiêu điểm — biến của CA TEST, đọc qua `goc.activeElement`. */
let tieuDiem = null;

/** `<body>`: nơi tiêu điểm rơi về khi phần tử đang giữ nó bị gỡ khỏi DOM. */
const THAN_TRANG = Object.freeze({ ten: 'body', closest: () => null });

/** Hai dạng mệnh đề chọn mà mã sản phẩm dùng: `[thuoc-tinh]` và `.lop`. Dạng lạ thì NÉM — một
 *  gốc giả trả `null` im lặng cho mệnh đề nó không hiểu làm ca xanh vì lý do sai. */
function khop(pt, chon) {
  if (typeof pt?.getAttribute !== 'function') return false;
  if (chon.startsWith('[') && chon.endsWith(']')) return pt.getAttribute(chon.slice(1, -1)) !== null;
  if (chon.startsWith('.')) return (pt.className ?? '').split(' ').includes(chon.slice(1));
  throw new Error(`gốc giả không hiểu mệnh đề chọn ${chon}`);
}

function timTrong(goc, chon) {
  for (const con of goc.con ?? []) {
    if (khop(con, chon)) return con;
    const sau = timTrong(con, chon);
    if (sau !== null) return sau;
  }
  return null;
}

/** Còn trong tài liệu không: đi ngược lên tới một gốc được đánh dấu. */
function trongTaiLieu(pt) {
  for (let n = pt; n !== null && n !== undefined; n = n.cha) if (n.gocTaiLieu === true) return true;
  return false;
}

function phanTuGia(the) {
  const pt = {
    the,
    textContent: '',
    className: '',
    type: '',
    value: '',
    style: {},
    scrollHeight: 0,
    offsetHeight: 0,
    clientHeight: 0,
    con: [],
    thuocTinh: {},
    boNghe: {},
    cha: null,
    soLanNhanTieuDiem: 0,
    append(...moi) {
      for (const c of moi) if (c !== null && typeof c === 'object') c.cha = pt;
      pt.con.push(...moi);
    },
    setAttribute(ten, giaTri) {
      pt.thuocTinh[ten] = String(giaTri);
    },
    getAttribute(ten) {
      return Object.hasOwn(pt.thuocTinh, ten) ? pt.thuocTinh[ten] : null;
    },
    addEventListener(ten, ham) {
      pt.boNghe[ten] = ham;
    },
    removeEventListener() {},
    setSelectionRange() {},
    closest(chon) {
      for (let n = pt; n !== null && n !== undefined; n = n.cha) if (khop(n, chon)) return n;
      return null;
    },
    querySelector(chon) {
      return timTrong(pt, chon);
    },
    focus() {
      pt.soLanNhanTieuDiem += 1;
      tieuDiem = pt;
    },
  };
  return pt;
}

function dungGoc() {
  const luoi = phanTuGia('section');
  luoi.className = 'luoi';
  luoi.gocTaiLieu = true;
  luoi.ownerDocument = {
    createElement: (the) => phanTuGia(the),
    createTextNode: (chu) => ({ nodeType: 3, textContent: chu }),
  };
  Object.defineProperty(luoi, 'children', {
    get: () => luoi.con.filter((c) => typeof c.getAttribute === 'function'),
  });
  luoi.replaceChildren = (...moi) => {
    for (const cu of luoi.con) cu.cha = null;
    for (const c of moi) c.cha = luoi;
    luoi.con = moi;
    // Đúng như trình duyệt: phần tử đang giữ tiêu điểm vừa rời DOM → tiêu điểm về `<body>`.
    if (tieuDiem !== null && tieuDiem !== THAN_TRANG && !trongTaiLieu(tieuDiem)) {
      tieuDiem = THAN_TRANG;
    }
  };
  const oSoan = phanTuGia('textarea');
  oSoan.gocTaiLieu = true;
  const oTim = phanTuGia('input');
  oTim.gocTaiLieu = true;
  const goc = {
    get activeElement() {
      return tieuDiem;
    },
    querySelector: (chon) => (chon === CHON_LUOI ? luoi : null),
    getElementById: (id) => (id === 'o-soan' ? oSoan : null),
  };
  const mauCua = (id) => luoi.children.find((m) => m.getAttribute(THUOC_TINH_MAU) === id) ?? null;
  return {
    goc,
    luoi,
    oSoan,
    oTim,
    mauCua,
    nutXoaCua: (id) => mauCua(id)?.querySelector(CHON_XOA) ?? null,
    oSuaCua: (id) => mauCua(id)?.querySelector(CHON_SUA) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Store THẬT, kho giả
// ---------------------------------------------------------------------------

function portsDay() {
  const ports = {};
  for (const tenCong of Object.keys(PORT_METHODS)) {
    const cong = {};
    for (const tenPhuongThuc of PORT_METHODS[tenCong]) {
      cong[tenPhuongThuc] = () => {
        throw new Error(`không ca test nào được gọi ${tenCong}.${tenPhuongThuc}`);
      };
    }
    ports[tenCong] = cong;
  }
  return ports;
}

function ban(id, text, gio) {
  const createdAt = `2026-09-14T${gio}+07:00`;
  return { id, createdAt, localDate: '2026-09-14', text, textFolded: fold(text) };
}

/** Hai mẩu của hôm nay: `x` mới hơn nên đứng TRƯỚC `y` trên lưới. */
const HAI_MAU = [ban('x', 'phở', '09:10:00'), ban('y', 'bún', '09:00:00')];

async function dungCanh(ghiChu = HAI_MAU) {
  const ports = portsDay();
  ports.noteStore = {
    ...ports.noteStore,
    readAll: () => Promise.resolve(ghiChu),
    put: () => Promise.resolve(),
    remove: () => Promise.resolve(),
  };
  const store = taoStore(ports);
  await store.khoiDong();
  const dom = dungGoc();
  const nhatKy = [];
  let luong = null;
  // Móc `xoa` của lưới THẬT — đúng chỗ cắm `mocSua.xoa` của `main.js`: nút `xóa` mở câu hỏi.
  const luoi = noiLuoi(store, dom.goc, () => MOC, { xoa: (id) => luong.moHoi(id) });
  const veTatCa = () => {
    luoi.ve();
    nhatKy.push('ve');
  };
  luong = noiLuongXoa(store, dom.goc, veTatCa);
  veTatCa();
  tieuDiem = null;
  return { store, veTatCa, nhatKy, ...dom };
}

/** Đợi hết mọi microtask đang treo — đủ cho một chuỗi `.then` ngắn của luồng xóa. */
function xaHet() {
  return new Promise((giai) => {
    setTimeout(giai, 0);
  });
}

/** Vào chế độ sửa `id` và đặt tiêu điểm vào ô sửa — đúng `vaoSuaRoiVe` của `main.js`. */
function vaoSua(c, id) {
  c.store.vaoCheDoSua(id);
  c.veTatCa();
  c.oSuaCua(id).focus();
}

// ---------------------------------------------------------------------------
// I/O Matrix
// ---------------------------------------------------------------------------

describe('veGiuTieuDiem — mọi hàng tiêu điểm của I/O Matrix Story 7.0', () => {
  it('Shift+Tab sang `xóa`: tiêu điểm ở nút `xóa` của X, và `Enter` mở hộp hỏi về X', async () => {
    const c = await dungCanh();
    vaoSua(c, 'x');
    // Shift+Tab: trình duyệt dời tiêu điểm sang điểm dừng liền trước — nút `xóa` của CHÍNH mẩu
    // này (đầu mẩu đứng trước ô sửa trong DOM) — rồi `blur` của ô sửa mới chạy.
    const nutCu = c.nutXoaCua('x');
    nutCu.focus();
    await c.store.roiCheDoSua();
    // Lượt vẽ hoãn của `roiSuaRoiVe`: neo `undefined`.
    veGiuTieuDiem(c.goc, c.veTatCa);

    expect(c.oSuaCua('x')).toBeNull();
    expect(tieuDiem).toBe(c.nutXoaCua('x'));
    // Và đó là nút của lưới MỚI: nút cũ đã bị gỡ ở chính lượt vẽ này.
    expect(tieuDiem).not.toBe(nutCu);
    // Không phải thân mẩu — thứ bản cũ đặt tiêu điểm vào (lỗi B2).
    expect(tieuDiem).not.toBe(c.mauCua('x'));

    // `Enter` trên một `<button>` là một `click` của nó.
    tieuDiem.boNghe.click({ stopPropagation() {} });
    await xaHet();
    expect(c.store.state.xacNhanXoa).toBe('x');
    expect(c.store.state.editing.id).toBeNull();
  });

  it('Tab ra mẩu kế: đang sửa X, Tab tới thân Y → tiêu điểm ở thân Y của lưới mới', async () => {
    const c = await dungCanh();
    vaoSua(c, 'x');
    const yCu = c.mauCua('y');
    yCu.focus();
    await c.store.roiCheDoSua();
    veGiuTieuDiem(c.goc, c.veTatCa);
    expect(tieuDiem).toBe(c.mauCua('y'));
    expect(tieuDiem).not.toBe(yCu);
  });

  it('Mẩu mất sau vẽ: neo X mà X không còn trên lưới → `#o-soan`, ở cả ba vai trò', async () => {
    const c = await dungCanh();
    for (const vaiTro of ['than', 'xoa', 'sua']) {
      tieuDiem = null;
      veGiuTieuDiem(c.goc, c.veTatCa, { id: 'khong-co', vaiTro });
      expect(tieuDiem).toBe(c.oSoan);
    }
  });

  it('Mẩu mất sau vẽ, neo `undefined`: tiêu điểm trên X, X vừa bị xóa → `#o-soan`', async () => {
    const c = await dungCanh();
    c.mauCua('x').focus();
    await c.store.xoaGhiChu('x');
    veGiuTieuDiem(c.goc, c.veTatCa);
    expect(c.mauCua('x')).toBeNull();
    expect(tieuDiem).toBe(c.oSoan);
  });

  it('Ngoài lưới: tiêu điểm ở ô tìm → vẫn vẽ, nhưng KHÔNG đụng tiêu điểm', async () => {
    const c = await dungCanh();
    c.oTim.focus();
    const soLanTruoc = c.oTim.soLanNhanTieuDiem;
    const soLuotVe = c.nhatKy.length;
    veGiuTieuDiem(c.goc, c.veTatCa);
    expect(c.nhatKy.length).toBe(soLuotVe + 1);
    expect(tieuDiem).toBe(c.oTim);
    expect(c.oTim.soLanNhanTieuDiem).toBe(soLanTruoc);
    expect(c.oSoan.soLanNhanTieuDiem).toBe(0);
  });

  it('Sửa kết quả tìm tới hết khớp: tìm `abc`, sửa X thành `xyz`, Shift+Tab → X biến mất; `#o-soan`', async () => {
    vi.useFakeTimers();
    const c = await dungCanh([ban('x', 'abc', '09:10:00'), ban('y', 'abc nữa', '09:00:00')]);
    c.store.datDieuKien({ keyword: 'abc' });
    c.veTatCa();
    expect(c.mauCua('x')).not.toBeNull();

    vaoSua(c, 'x');
    // Móc `go` của `main.js`: một action mỗi phím, lượt vẽ GIỮ TIÊU ĐIỂM treo vào lời hứa của nó.
    c.store.tuLuuNoiDung('x', 'xyz').then(() => veGiuTieuDiem(c.goc, c.veTatCa));
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    // `put` đã xong và `notes` mang `xyz` — nhưng lưới GÁC ô sửa đang gõ, nên X còn đứng đó.
    expect(c.store.state.notes.find((m) => m.id === 'x').text).toBe('xyz');
    expect(c.oSuaCua('x')).not.toBeNull();

    c.nutXoaCua('x').focus();
    await c.store.roiCheDoSua();
    veGiuTieuDiem(c.goc, c.veTatCa);
    expect(c.mauCua('x')).toBeNull();
    expect(c.mauCua('y')).not.toBeNull();
    expect(tieuDiem).toBe(c.oSoan);
  });

  it('Sửa kết quả tìm tới hết khớp, rời TRƯỚC khi hẹn tự lưu nổ: lượt vẽ của `put` cũng giữ tiêu điểm', async () => {
    // Móc `go` của `main.js` treo `veGiuTieuDiem` (neo `undefined`) vào lời hứa của
    // `tuLuuNoiDung`. Rời ô sửa trong `AUTOSAVE_MS`: lượt vẽ hoãn còn thấy X (notes cũ), tiêu
    // điểm ở `xóa` của X; rồi `put` xong, lượt vẽ của nó gỡ X — tiêu điểm phải về `#o-soan`,
    // không rơi về `<body>` như khi móc chỉ gọi `veTatCa`.
    vi.useFakeTimers();
    const c = await dungCanh([ban('x', 'abc', '09:10:00'), ban('y', 'abc nữa', '09:00:00')]);
    c.store.datDieuKien({ keyword: 'abc' });
    c.veTatCa();
    vaoSua(c, 'x');
    c.store.tuLuuNoiDung('x', 'xyz').then(() => veGiuTieuDiem(c.goc, c.veTatCa));

    c.nutXoaCua('x').focus();
    await c.store.roiCheDoSua();
    veGiuTieuDiem(c.goc, c.veTatCa);
    expect(c.mauCua('x')).not.toBeNull();
    expect(tieuDiem).toBe(c.nutXoaCua('x'));

    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    expect(c.store.state.notes.find((m) => m.id === 'x').text).toBe('xyz');
    expect(c.mauCua('x')).toBeNull();
    expect(tieuDiem).not.toBe(THAN_TRANG);
    expect(tieuDiem).toBe(c.oSoan);
  });

  it('Rời ô sửa rỗng: xóa hết chữ, Shift+Tab → X bị xóa; `#o-soan`, không `<body>`', async () => {
    const c = await dungCanh();
    vaoSua(c, 'x');
    await c.store.tuLuuNoiDung('x', '').then(c.veTatCa);
    c.nutXoaCua('x').focus();
    await c.store.roiCheDoSua();
    veGiuTieuDiem(c.goc, c.veTatCa);
    expect(c.store.state.notes.map((m) => m.id)).toEqual(['y']);
    expect(c.mauCua('x')).toBeNull();
    expect(tieuDiem).not.toBe(THAN_TRANG);
    expect(tieuDiem).toBe(c.oSoan);
  });
});

describe('veGiuTieuDiem — nút `về hôm nay` (Story 7.1)', () => {
  /** Hàng chip giả: mỗi lượt vẽ dựng lại nút (đúng `replaceChildren` của `hang-chip.js`). */
  function gocCoHangChip(c, conNut) {
    const hang = phanTuGia('div');
    hang.gocTaiLieu = true;
    let nut = null;
    const veHang = () => {
      if (nut !== null) nut.cha = null;
      nut = null;
      if (conNut()) {
        nut = phanTuGia('button');
        nut.className = 've-hom-nay';
        nut.cha = hang;
      }
      hang.con = nut === null ? [] : [nut];
      if (tieuDiem !== null && tieuDiem !== THAN_TRANG && !trongTaiLieu(tieuDiem)) {
        tieuDiem = THAN_TRANG;
      }
    };
    veHang();
    const goc = {
      get activeElement() {
        return tieuDiem;
      },
      querySelector: (chon) => {
        if (chon === CHON_VE_HOM_NAY) return nut;
        return c.goc.querySelector(chon);
      },
      getElementById: c.goc.getElementById,
    };
    const veTatCa = () => {
      c.veTatCa();
      veHang();
    };
    return { goc, veTatCa, nut: () => nut };
  }

  it('tin đến, nút còn: tiêu điểm ở nút MỚI, không rơi về `<body>`', async () => {
    const c = await dungCanh();
    const h = gocCoHangChip(c, () => true);
    const nutCu = h.nut();
    nutCu.focus();
    veGiuTieuDiem(h.goc, h.veTatCa);
    expect(tieuDiem).toBe(h.nut());
    expect(tieuDiem).not.toBe(nutCu);
  });

  it('tin đến, nút không còn: tiêu điểm về `#o-soan`', async () => {
    const c = await dungCanh();
    let con = true;
    const h = gocCoHangChip(c, () => con);
    h.nut().focus();
    con = false;
    veGiuTieuDiem(h.goc, h.veTatCa);
    expect(tieuDiem).toBe(c.oSoan);
  });

  it('tiêu điểm ở `xóa` của Y, tin đến, Y còn: tiêu điểm vẫn ở `xóa` của Y', async () => {
    const c = await dungCanh();
    const nutCu = c.nutXoaCua('y');
    nutCu.focus();
    await c.store.napLaiGhiChu();
    veGiuTieuDiem(c.goc, c.veTatCa);
    expect(tieuDiem).toBe(c.nutXoaCua('y'));
    expect(tieuDiem).not.toBe(nutCu);
  });
});

describe('veGiuTieuDiem — ba dạng neo', () => {
  it('`null` về `#o-soan` kể cả khi tiêu điểm đang đứng trên một mẩu', async () => {
    const c = await dungCanh();
    c.mauCua('y').focus();
    veGiuTieuDiem(c.goc, c.veTatCa, null);
    expect(tieuDiem).toBe(c.oSoan);
  });

  it('`{ id, vaiTro: "sua" }` về ô sửa khi còn; không còn ô sửa thì về thân', async () => {
    const c = await dungCanh();
    c.store.vaoCheDoSua('x');
    veGiuTieuDiem(c.goc, c.veTatCa, { id: 'x', vaiTro: 'sua' });
    expect(tieuDiem).toBe(c.oSuaCua('x'));
    await c.store.roiCheDoSua();
    veGiuTieuDiem(c.goc, c.veTatCa, { id: 'x', vaiTro: 'sua' });
    expect(tieuDiem).toBe(c.mauCua('x'));
  });

  it('`{ id, vaiTro: "than" }` về chính mẩu, tìm theo `id` chứ không theo vị trí', async () => {
    const c = await dungCanh();
    veGiuTieuDiem(c.goc, c.veTatCa, { id: 'y', vaiTro: 'than' });
    // `y` đứng thứ HAI trên lưới: một phép tìm theo vị trí (hay "mẩu đầu tiên") ra `x`.
    expect(c.luoi.children.indexOf(tieuDiem)).toBe(1);
    expect(tieuDiem.getAttribute(THUOC_TINH_MAU)).toBe('y');
  });

  it('`undefined` trong ô sửa đang gõ: lưới gác, tiêu điểm ở lại ĐÚNG ô đó', async () => {
    const c = await dungCanh();
    vaoSua(c, 'x');
    const oDangGo = tieuDiem;
    veGiuTieuDiem(c.goc, c.veTatCa);
    expect(tieuDiem).toBe(oDangGo);
    expect(c.oSuaCua('x')).toBe(oDangGo);
  });

  it('chạy ĐÚNG một lượt vẽ mỗi lần gọi, và chụp neo TRƯỚC lượt vẽ đó', async () => {
    // Chụp sau lượt vẽ thì phần tử đã bị gỡ, `activeElement` là `<body>`, và nhánh "ngoài mọi
    // mẩu" nuốt mất tiêu điểm — đúng lượt rơi mà hàm này có mặt để chặn.
    const c = await dungCanh();
    c.mauCua('x').focus();
    const truoc = c.nhatKy.length;
    veGiuTieuDiem(c.goc, c.veTatCa);
    expect(c.nhatKy.length).toBe(truoc + 1);
    expect(tieuDiem).toBe(c.mauCua('x'));
  });
});
