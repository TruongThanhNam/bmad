// Lưới ghi chú nối vào store (Story 2.4) — phần nghiệm thu được mà không cần trình duyệt.
//
// Chia việc đúng như `o-soan.test.js` chia: hình học của lưới ("ba mẩu nằm trên một hàng
// ngang, mẩu mới nhất trái nhất") là câu hỏi về LAYOUT ĐÃ TÍNH và nó sống ở `npm run
// thu-bo-cuc`. Ở đây là ba thứ khác, cả ba đều vỡ trong im lặng:
//
//   (1) Lưới vẽ ĐÚNG tập của hôm nay, theo đúng thứ tự `notes` đang mang.
//   (2) Lưới vẽ LẠI sau mỗi lần chốt — không có cơ chế subscribe nào trong dự án này, nên nửa
//       này chỉ đúng nếu `main.js` nối tay, và một `.then` bị bỏ quên không làm gì đỏ cả.
//   (3) Chữ của Nam không bao giờ thành markup, và lưới rỗng là rỗng THẬT — không một chữ nào.
//
// Cũng không dùng jsdom, cùng lý do: `noiLuoi(store, goc)` nhận gốc DOM qua tham số.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fold } from '../app/core/fold.js';
import { COLLAPSED_LINES } from '../app/core/limits.js';
import { taoStore } from '../app/core/state.js';
import { nowIso } from '../app/core/time.js';
import { PORT_METHODS } from '../app/ports/index.js';
import { noiLuoi } from '../app/view/luoi.js';
import { boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const MOC = '2026-09-14T09:30:00+07:00';
const HOM_NAY = '2026-09-14';
const HOM_QUA = '2026-09-13';

// ---------------------------------------------------------------------------
// Gốc DOM tối giản
// ---------------------------------------------------------------------------

/**
 * Một phần tử con do view dựng.
 *
 * Từ Story 2.5 mỗi ô là một CÂY nhỏ (đầu mẩu · thân · dòng gấp), không còn một khối chữ phẳng,
 * nên phần tử giả phải biết `append`, `className`, `setAttribute` và `addEventListener`. Đây là
 * bộ ĐỒ NGHỀ của ca test, không phải một ca hành vi: mọi phép nghiệm thu bên dưới giữ nguyên
 * từng chữ, chúng chỉ đọc chữ của mẩu qua `.mau-than` thay vì qua gốc của ô.
 */
function phanTuGia() {
  return {
    textContent: '',
    className: '',
    type: '',
    // Story 5.1: ô sửa nhận chữ qua `value`, và `caoTheoNoiDungSua` ghi `style.blockSize`.
    value: '',
    style: {},
    scrollHeight: 0,
    offsetHeight: 0,
    clientHeight: 0,
    con: [],
    thuocTinh: {},
    boNghe: {},
    append(...moi) {
      this.con.push(...moi);
    },
    setAttribute(ten, giaTri) {
      this.thuocTinh[ten] = giaTri;
    },
    getAttribute(ten) {
      return Object.prototype.hasOwnProperty.call(this.thuocTinh, ten) ? this.thuocTinh[ten] : null;
    },
    addEventListener(ten, ham) {
      this.boNghe[ten] = ham;
    },
  };
}

/** Phần tử mang đúng một THUỘC TÍNH, tìm trong cả cây con — `null` nếu không có. */
function timTheoThuocTinh(phanTu, ten) {
  if (phanTu.thuocTinh !== undefined && phanTu.thuocTinh[ten] !== undefined) return phanTu;
  for (const con of phanTu.con ?? []) {
    const thay = timTheoThuocTinh(con, ten);
    if (thay !== null) return thay;
  }
  return null;
}

/** Con cháu của một ô mang đúng một class — `null` nếu không có. */
function timTheoLop(phanTu, lop) {
  if (phanTu.className !== undefined && phanTu.className.split(' ').includes(lop)) return phanTu;
  for (const con of phanTu.con ?? []) {
    const thay = timTheoLop(con, lop);
    if (thay !== null) return thay;
  }
  return null;
}

/**
 * Phần tử lưới giả: đúng những gì `noiLuoi` chạm tới — `ownerDocument.createElement` và
 * `replaceChildren`. Ghi lại số lần thay con, để ca "vẽ lại sau khi chốt" đo được MỘT lượt vẽ
 * chứ không chỉ đo kết quả cuối.
 *
 * Nó mang thêm `textContent` và `append` mà `noiLuoi` KHÔNG dùng, và đó là chủ ý: ca trạng thái
 * rỗng của Story 2.6 phải thấy được một lời nhắn gắn THẲNG vào lưới. Không có hai thành viên
 * này thì `luoi.textContent = 'Bạn chưa có ghi chú nào'` đi qua mọi phép so của file này mà
 * xanh — tức cửa chặn canh đúng thứ nó không nhìn thấy.
 */
function luoiGia() {
  const luoi = {
    con: [],
    textContent: '',
    soLanThayCon: 0,
    ownerDocument: { createElement: () => phanTuGia() },
    append(...moi) {
      luoi.con.push(...moi);
    },
    replaceChildren(...moi) {
      luoi.con = moi;
      luoi.soLanThayCon += 1;
    },
    /** `luoi.js` tìm ô sửa đang có trong DOM bằng `[data-sua]` — phép gác không-vẽ-lại đọc
     *  `id` từ chính nó, không từ một biến của view. */
    querySelector(chon) {
      if (chon !== '[data-sua]') return null;
      for (const c of luoi.con) {
        const thay = timTheoThuocTinh(c, 'data-sua');
        if (thay !== null) return thay;
      }
      return null;
    },
    chu() {
      return luoi.con.map((c) => timTheoLop(c, 'mau-than')?.textContent ?? null);
    },
  };
  return luoi;
}

function gocGia(luoi, chon = '.luoi') {
  return {
    querySelector(s) {
      return s === chon ? luoi : null;
    },
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

/** Store thật, nối vào một kho giả trả về đúng tập ghi chú mà ca test dựng. */
function storeVoiKho(ghiChu = []) {
  const ports = portsDay();
  ports.sessionStore = {
    ...ports.sessionStore,
    tabIdentity: () => 'tab-nay',
    writeTabIdentity: () => {},
  };
  ports.noteStore = {
    ...ports.noteStore,
    readAll: () => Promise.resolve(ghiChu),
    claimDraft: (yeuCau) => Promise.resolve({ tabId: yeuCau.tabId, text: '' }),
    putDraft: () => Promise.resolve(),
    commitDraft: () => Promise.resolve(),
  };
  return taoStore(ports);
}

/** Một bản ghi đúng năm trường của AD-13 — `textFolded` gấp bằng `fold()` y như `state.js` gấp,
 *  nên ca có `keyword` chạy trên một bản ghi THẬT chứ không trên một chuỗi chưa gấp. */
function ban(ngay, gio, text) {
  const createdAt = `${ngay}T${gio}+07:00`;
  return { id: `${ngay}-${gio}`, createdAt, localDate: ngay, text, textFolded: fold(text) };
}

// ---------------------------------------------------------------------------
// Hành vi
// ---------------------------------------------------------------------------

describe('noiLuoi — lưới của hôm nay', () => {
  it('vẽ đúng số mẩu của hôm nay, mẩu MỚI NHẤT đứng đầu', async () => {
    const luoi = luoiGia();
    const store = storeVoiKho([
      ban(HOM_NAY, '08:00:00', 'sớm'),
      ban(HOM_NAY, '20:00:00', 'muộn'),
      ban(HOM_QUA, '23:00:00', 'hôm qua'),
    ]);
    await store.khoiDong();
    noiLuoi(store, gocGia(luoi), () => MOC).ve();

    // Hướng đọc trái→phải: ô đầu tiên của danh sách con là ô trên-cùng-trái, nên "mẩu mới
    // nhất ở đầu" LÀ một luật về thứ tự DOM, không chỉ về CSS.
    expect(luoi.chu()).toEqual(['muộn', 'sớm']);
  });

  it('hôm nay chưa có gì: không một phần tử con nào, và KHÔNG một chữ nào', async () => {
    // Story 2.6 đã chốt: trạng thái rỗng KHÔNG nói gì. Một dòng "chưa có gì" thêm vào đây sẽ
    // phải gỡ ra, nên nó bị ghim là không được tồn tại.
    const luoi = luoiGia();
    const store = storeVoiKho([ban(HOM_QUA, '23:00:00', 'hôm qua')]);
    await store.khoiDong();
    noiLuoi(store, gocGia(luoi), () => MOC).ve();

    expect(luoi.con).toEqual([]);
    expect(luoi.chu().join('')).toBe('');
  });

  it('lưới rỗng là rỗng THẬT: không con nào, và tổng textContent là chuỗi rỗng', async () => {
    // Cửa chặn của Story 2.6, và nó khác ca ngay trên: ca kia đọc chữ qua `.mau-than`, tức nó
    // chỉ nhìn thấy những gì `veMau` dựng. Một lời nhắn "Bạn chưa có ghi chú nào" gắn thẳng
    // vào lưới — một `textContent`, một node chữ, một phần tử minh họa không có `.mau-than` —
    // đi qua toàn bộ suite mà xanh. Ở đây tổng chữ của CẢ lưới, con cháu tính hết, phải là
    // chuỗi rỗng: không một ký tự nào, kể cả một khoảng trắng có nghĩa.
    const luoi = luoiGia();
    const store = storeVoiKho([]);
    await store.khoiDong();
    noiLuoi(store, gocGia(luoi), () => MOC).ve();

    const tongChu = (phanTu) =>
      (phanTu.textContent ?? '') + (phanTu.con ?? []).map(tongChu).join('');

    expect(luoi.con).toEqual([]);
    // Tính từ CHÍNH phần tử lưới, không từ `luoi.con`: cộng dồn con của một danh sách vừa được
    // assert là rỗng thì luôn ra chuỗi rỗng, và phép so đó không bao giờ đỏ được. Chữ gắn thẳng
    // vào `.luoi` — đúng thứ ca này sinh ra để chặn — chỉ đọc được ở đây.
    expect(tongChu(luoi)).toBe('');
    // Và lượt vẽ VẪN chạy: một `if (rỗng) return;` sớm trong `ve()` để lại danh sách con của
    // lượt trước nằm nguyên trên lưới — đúng cái sẽ thấy khi tab mở qua nửa đêm.
    expect(luoi.soLanThayCon).toBe(1);
  });

  it('kho rỗng: lưới trống, không ném', async () => {
    const luoi = luoiGia();
    const store = storeVoiKho([]);
    await store.khoiDong();
    const v = noiLuoi(store, gocGia(luoi), () => MOC);
    expect(() => v.ve()).not.toThrow();
    expect(luoi.con).toEqual([]);
  });

  it('vẽ LẠI sau khi chốt: mẩu mới ở ô ĐẦU, mọi mẩu khác dịch một ô về sau', async () => {
    // Mẩu vừa chốt mang mốc THẬT của đồng hồ máy (`nowIso` trong `state.js`), nên cả mẩu cũ
    // lẫn mốc truyền vào đây đều phải đi theo cùng đồng hồ đó — không phải một ngày viết cứng.
    //
    // MỘT mốc duy nhất, chụp một lần và dùng cho cả hai đầu: hỏi `nowIso()` hai lần thì một
    // lần nửa đêm rơi vào giữa hai lời gọi sẽ đẩy `mẩu cũ` ra khỏi phép lọc và làm ca này đỏ
    // vì một lý do không liên quan gì tới thứ nó hỏi.
    const bayGio = nowIso();
    const luoi = luoiGia();
    const store = storeVoiKho([ban(bayGio.slice(0, HOM_NAY.length), '00:00:00', 'mẩu cũ')]);
    await store.khoiDong();
    const v = noiLuoi(store, gocGia(luoi), () => bayGio);
    v.ve();
    expect(luoi.chu()).toEqual(['mẩu cũ']);

    store.datBanNhap('mẩu mới');
    await store.chotGhiChu();
    v.ve();

    expect(luoi.chu()).toEqual(['mẩu mới', 'mẩu cũ']);
    // Đúng HAI lượt vẽ, không một lượt nào lén chạy thêm: `ve` dựng lại cả danh sách con, nên
    // một lượt thừa là một lần cả lưới bị thay ra dưới tay người đang đọc.
    expect(luoi.soLanThayCon).toBe(2);
  });

  it('HAI NHỊP CLICK: mẩu bị cắt thì nhịp 1 CHỈ mở rộng, nhịp 2 mới vào chế độ sửa', async () => {
    // Hai nhịp không bao giờ nhập một, và đó là toàn bộ điểm của hàng "Mẩu bị cắt, click 1"
    // trong Matrix: một mẩu đang bị cắt thì cú bấm đầu tiên là "cho tôi xem hết", không phải
    // "cho tôi sửa" — sửa một đoạn chữ mà mình chỉ thấy ba dòng đầu là sửa trong bóng tối.
    const dai = Array.from({ length: COLLAPSED_LINES + 2 }, (_, i) => `dòng ${i}`).join('\n');
    const luoi = luoiGia();
    const store = storeVoiKho([ban(HOM_NAY, '09:00:00', dai)]);
    await store.khoiDong();
    const vao = [];
    const v = noiLuoi(store, gocGia(luoi), () => MOC, { vao: (id, viTri) => vao.push([id, viTri]) });
    v.ve();

    luoi.con[0].boNghe.click();
    // Nhịp 1: CHỈ mở rộng — không một lời gọi vào chế độ sửa nào.
    expect(vao).toEqual([]);
    expect(store.state.expandedIds).toEqual([store.state.notes[0].id]);

    luoi.con[0].boNghe.click();
    // Nhịp 2: vào chế độ sửa, và KHÔNG thu mẩu lại.
    expect(vao).toEqual([[store.state.notes[0].id, null]]);
    expect(store.state.expandedIds).toEqual([store.state.notes[0].id]);
  });

  it('mẩu NGẮN: nhịp 1 vào chế độ sửa luôn — nó không có gì bị cắt để mở', async () => {
    const luoi = luoiGia();
    const store = storeVoiKho([ban(HOM_NAY, '09:00:00', 'phở')]);
    await store.khoiDong();
    const vao = [];
    const v = noiLuoi(store, gocGia(luoi), () => MOC, { vao: (id) => vao.push(id) });
    v.ve();

    luoi.con[0].boNghe.click();
    expect(vao).toEqual([store.state.notes[0].id]);
    expect(store.state.expandedIds).toEqual([]);
  });

  it('editing.id xuống ĐÚNG mẩu: chỉ nó thành ô sửa, mẩu khác giữ thân chữ', async () => {
    const luoi = luoiGia();
    const store = storeVoiKho([
      ban(HOM_NAY, '11:00:00', 'mẩu trên'),
      ban(HOM_NAY, '10:00:00', 'mẩu dưới'),
    ]);
    await store.khoiDong();
    const v = noiLuoi(store, gocGia(luoi), () => MOC, {});
    v.ve();
    expect(luoi.chu()).toEqual(['mẩu trên', 'mẩu dưới']);

    store.vaoCheDoSua(store.state.notes[1].id);
    v.ve();
    // Mẩu trên giữ thân chữ; mẩu dưới thành ô sửa và thân chữ của nó biến mất.
    expect(timTheoLop(luoi.con[0], 'mau-than').textContent).toBe('mẩu trên');
    expect(timTheoLop(luoi.con[1], 'mau-than')).toBeNull();
    const oSua = timTheoLop(luoi.con[1], 'mau-sua');
    expect(oSua).not.toBeNull();
    expect(oSua.value).toBe('mẩu dưới');
    expect(oSua.thuocTinh['data-sua']).toBe(store.state.notes[1].id);
  });

  it('KHÔNG vẽ lại khi đang gõ: một lượt vẽ từ nguồn khác không chạm danh sách con', async () => {
    // Kiểm bằng cách CHẠY chỗ nối, không quét chuỗi mã nguồn: `veTatCa()` được gọi từ năm nguồn
    // khác (đóng dải băng, lật theme, nạp file, chốt ghi chú, phép ghi tự lưu vừa xong), và mỗi
    // lượt như vậy sẽ thay cả lưới ra giữa lúc đang gõ — `<textarea>` bị thay bằng một phần tử
    // mới và con trỏ về đầu. Triệu chứng sẽ là "gõ ngược".
    const luoi = luoiGia();
    const store = storeVoiKho([ban(HOM_NAY, '09:00:00', 'phở')]);
    await store.khoiDong();
    const v = noiLuoi(store, gocGia(luoi), () => MOC, {});
    store.vaoCheDoSua(store.state.notes[0].id);
    v.ve();
    const oTruoc = timTheoLop(luoi.con[0], 'mau-sua');
    const soLan = luoi.soLanThayCon;

    v.ve();
    v.ve();
    expect(luoi.soLanThayCon).toBe(soLan);
    // Và ô sửa vẫn LÀ chính nó — không một phần tử mới nào thay chỗ.
    expect(timTheoLop(luoi.con[0], 'mau-sua')).toBe(oTruoc);
  });

  it('ĐỔI mẩu đang sửa (A → B) VẪN vẽ được — phép gác so theo id, không theo "có đang sửa"', async () => {
    // Vế này là điều kiện, không phải sự tỉ mỉ thừa: khi đổi mẩu đang sửa, ô sửa của A VẪN còn
    // trong DOM lúc lượt vẽ của B chạy. Một phép gác viết rộng tay ("đang sửa gì thì thoát")
    // sẽ chặn đúng lượt vẽ mở ô sửa của B, và Nam phải bấm hai lần.
    const luoi = luoiGia();
    const store = storeVoiKho([
      ban(HOM_NAY, '11:00:00', 'mẩu A'),
      ban(HOM_NAY, '10:00:00', 'mẩu B'),
    ]);
    await store.khoiDong();
    const [a, b] = store.state.notes;
    const v = noiLuoi(store, gocGia(luoi), () => MOC, {});
    store.vaoCheDoSua(a.id);
    v.ve();
    expect(timTheoLop(luoi.con[0], 'mau-sua').thuocTinh['data-sua']).toBe(a.id);

    store.vaoCheDoSua(b.id);
    v.ve();
    expect(timTheoLop(luoi.con[0], 'mau-sua')).toBeNull();
    expect(timTheoLop(luoi.con[1], 'mau-sua').thuocTinh['data-sua']).toBe(b.id);
  });

  it('dòng gấp của mẩu ĐANG sửa gọi móc RỜI, không batTatMoRong — nó không bật mẩu mở lại', async () => {
    // `blur` đi trước `click` và nó đã gỡ `id` khỏi `expandedIds`, nên một lần `batTatMoRong`
    // ở đây làm mẩu MỞ RỘNG thay vì thu — đúng ngược lại nhãn `thu lại ▴` đang nói.
    const dai = Array.from({ length: COLLAPSED_LINES + 2 }, (_, i) => `dòng ${i}`).join('\n');
    const luoi = luoiGia();
    const store = storeVoiKho([ban(HOM_NAY, '09:00:00', dai)]);
    await store.khoiDong();
    const id = store.state.notes[0].id;
    const roi = [];
    const v = noiLuoi(store, gocGia(luoi), () => MOC, { roi: (x) => roi.push(x) });
    store.batTatMoRong(id);
    store.vaoCheDoSua(id);
    v.ve();

    timTheoLop(luoi.con[0], 'mau-gap').boNghe.click({ stopPropagation() {} });
    expect(roi).toEqual([id]);
    // Và `expandedIds` KHÔNG bị bật lại một lần nữa.
    expect(store.state.expandedIds).toEqual([id]);
  });

  it('mỗi phím trong ô sửa gọi ĐÚNG móc `go` với id của chính mẩu đó', async () => {
    const luoi = luoiGia();
    const store = storeVoiKho([ban(HOM_NAY, '09:00:00', 'phở')]);
    await store.khoiDong();
    const id = store.state.notes[0].id;
    const nhatKy = [];
    const v = noiLuoi(store, gocGia(luoi), () => MOC, {
      go: (x, text) => nhatKy.push([x, text]),
      roi: (x) => nhatKy.push(['roi', x]),
    });
    store.vaoCheDoSua(id);
    v.ve();

    const oSua = timTheoLop(luoi.con[0], 'mau-sua');
    oSua.value = 'phở bò';
    oSua.boNghe.input();
    oSua.boNghe.blur();
    expect(nhatKy).toEqual([
      [id, 'phở bò'],
      ['roi', id],
    ]);
  });

  it('móc sửa VẮNG MẶT thì lưới vẫn vẽ và click không ném — đường của test bố cục', async () => {
    const luoi = luoiGia();
    const store = storeVoiKho([ban(HOM_NAY, '09:00:00', 'phở')]);
    await store.khoiDong();
    const v = noiLuoi(store, gocGia(luoi), () => MOC);
    v.ve();
    expect(() => luoi.con[0].boNghe.click()).not.toThrow();
  });

  it('click một mẩu bị cắt: gọi action của lõi VÀ vẽ lại — click nữa thì vào chế độ sửa', async () => {
    // Không ca này thì cả đường nối `luoi.js` ↔ `veMau` không được chạy ở đâu cả: bỏ `ve()`
    // khỏi handler, hay truyền cứng `false` thay cho `dangMo.includes(note.id)`, đều đi qua
    // toàn bộ suite mà xanh — và mẩu sẽ không bao giờ mở ra dưới tay Nam.
    const dai = Array.from({ length: COLLAPSED_LINES + 2 }, (_, i) => `dòng ${i}`).join('\n');
    const luoi = luoiGia();
    const store = storeVoiKho([ban(HOM_NAY, '09:00:00', dai)]);
    await store.khoiDong();
    const v = noiLuoi(store, gocGia(luoi), () => MOC);
    v.ve();

    const moRong = () => timTheoLop(luoi.con[0], 'mau-than').className.split(' ');
    expect(moRong()).not.toContain('mau-than-mo');
    expect(store.state.expandedIds).toEqual([]);

    luoi.con[0].boNghe.click();
    expect(store.state.expandedIds).toEqual([store.state.notes[0].id]);
    // Lượt vẽ lại là nửa thứ hai, và là nửa vỡ trong im lặng: state đổi mà DOM không đổi thì
    // mẩu vẫn nằm nguyên đó thu gọn.
    expect(moRong()).toContain('mau-than-mo');
    expect(luoi.soLanThayCon).toBe(2);

    // Nhịp 2 KHÔNG thu mẩu lại nữa (Story 5.1 đổi vế này): nó vào chế độ sửa, và đường thu mẩu
    // lại là dòng gấp `thu lại ▴` — hay chính lần rời chế độ sửa, thứ gỡ `id` khỏi `expandedIds`.
    luoi.con[0].boNghe.click();
    expect(store.state.expandedIds).toEqual([store.state.notes[0].id]);
    expect(moRong()).toContain('mau-than-mo');
    // Và dòng gấp vẫn thu được — nhãn nói gì thì cú bấm làm đúng thứ đó.
    timTheoLop(luoi.con[0], 'mau-gap').boNghe.click({ stopPropagation() {} });
    expect(store.state.expandedIds).toEqual([]);
    expect(moRong()).not.toContain('mau-than-mo');
  });

  it('đọc store.state.dieuKien: đặt một điều kiện thì lưới HẸP lại theo', async () => {
    // Không có ca này thì một `{ keyword: null, date: null }` viết cứng trong `ve()` vẫn xanh ở
    // mọi ca khác — và khung nhìn sẽ không bao giờ phản ứng với ô tìm kiếm của Epic 6.
    const luoi = luoiGia();
    const store = storeVoiKho([
      ban(HOM_NAY, '11:00:00', 'phở bò'),
      ban(HOM_NAY, '10:00:00', 'cà phê'),
    ]);
    await store.khoiDong();
    const v = noiLuoi(store, gocGia(luoi), () => MOC);
    v.ve();
    expect(luoi.chu()).toEqual(['phở bò', 'cà phê']);

    // Gõ không dấu vẫn ra mẩu có dấu: điều kiện đi qua `fold` như `textFolded` đã đi qua.
    store.datDieuKien({ keyword: 'pho' });
    v.ve();
    expect(luoi.chu()).toEqual(['phở bò']);

    // Và một ngày khác thì lưới trống — điều kiện `date` cũng phải tới được view.
    store.datDieuKien({ keyword: null, date: '2026-09-01' });
    v.ve();
    expect(luoi.con).toEqual([]);
  });

  it('chữ nhiều dòng giữ NGUYÊN, và thẻ HTML hiện ra nguyên văn như chữ', async () => {
    // `textContent` chứ không `innerHTML`, và đây là nửa mà một lần sửa "cho đẹp" sẽ phá: một
    // ghi chú chứa `<script>` phải là CHỮ, không bao giờ là một phần tử.
    const luoi = luoiGia();
    const nhieuDong = 'phở bò\n\nthêm hành\n';
    const the = '<script>x</script>';
    const store = storeVoiKho([
      ban(HOM_NAY, '09:00:00', nhieuDong),
      ban(HOM_NAY, '08:00:00', the),
    ]);
    await store.khoiDong();
    noiLuoi(store, gocGia(luoi), () => MOC).ve();

    expect(luoi.chu()).toEqual([nhieuDong, the]);
    // Xuống dòng chỉ THẤY được nếu ô mang class treo luật `white-space` — `textContent` giữ
    // `\n` bất kể CSS, nên nửa còn lại của lời hứa nằm ở đây và ở `npm run thu-bo-cuc`.
    expect(luoi.con.map((c) => c.className)).toEqual(['o-luoi', 'o-luoi']);
    const css = readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8');
    const khoi = /\.o-luoi\s*\{([^}]*)\}/.exec(css);
    expect(khoi).not.toBeNull();
    expect(khoi[1]).toMatch(/white-space\s*:\s*pre-wrap/);
    expect(khoi[1]).toMatch(/overflow-wrap\s*:\s*anywhere/);
    // Cửa chặn "không màu/nền/bo góc/bóng/khoảng đệm" của Story 2.4 được NỚI ở Story 2.5, có
    // chủ ý và có ghi chép: nó ghim "mẩu giấy chưa tồn tại", không ghim một bất biến. Ô lưới
    // giờ LÀ mẩu giấy, nên nó mang vật liệu. Cái bất biến thật thì ở lại: mọi giá trị phải là
    // một token, không một giá trị viết thẳng nào.
    // (Tập token bóng và tập selector mang bóng bị ghim riêng ở `bo-cuc-bon-tang.test.js`;
    //  hình dạng và hành vi của mẩu thì ở `mau-giay.test.js`.)
    for (const thuocTinh of ['background', 'border-radius', 'padding', 'box-shadow']) {
      expect(khoi[1]).toMatch(new RegExp(`${thuocTinh}\\s*:`));
    }
    expect(khoi[1]).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/i);
  });

  it('không có .luoi trong DOM thì không ném, và ve() vẫn gọi được', () => {
    // `app/main.js` treo `ve` vào một lời hứa không bao giờ bị từ chối — cùng khuôn `noiOSoan`.
    const v = noiLuoi(storeVoiKho([]), gocGia(luoiGia(), '#khong-co'), () => MOC);
    expect(() => v.ve()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Cửa chặn tầng view — mỗi view mới mang cửa chặn của chính nó
// ---------------------------------------------------------------------------

describe('app/view/luoi.js — luật của tầng view, cưỡng chế được', () => {
  const nguon = boChuThichJs(readFileSync(join(repoRoot, 'app', 'view', 'luoi.js'), 'utf8'));

  it('chạm store ở đúng hai chỗ: đọc state, và gọi MỘT action của lõi', () => {
    // Tập này nới từ `['state']` ở Story 2.5, và nó là một bề mặt mới chứ không phải một lần
    // lách: trạng thái mở rộng sống ở tầng C của `core/state.js` và chỉ đổi bên trong một
    // action, nên view PHẢI gọi được đúng cái action đó. Ghim ĐÚNG tập, không nới thành "có
    // chứa": một `store.notes.push(...)` thêm vào ngày mai vẫn phải đỏ ngay ở đây.
    const goiStore = [...nguon.matchAll(/store\s*\.\s*([\w$]+)/g)].map((k) => k[1]);
    expect([...new Set(goiStore)].sort()).toEqual(['batTatMoRong', 'state']);
    expect(nguon).not.toMatch(/subscribe|onChange|theoDoi/i);
  });

  it('không import app/adapters/, không tự gọi cổng, không new Date', () => {
    expect(nguon).not.toMatch(/adapters\//);
    expect(nguon).not.toMatch(/\bports\b/);
    // "Hôm nay" phải đi vào qua `nowIso` của `core/time.js`, không dựng tại chỗ (AD-4).
    expect(nguon).not.toMatch(/new\s+Date\b|Date\s*\.\s*(now|parse|UTC)\b/);
  });

  it('không số literal nào — mọi ngưỡng sống ở app/core/limits.js (AD-14)', () => {
    const so = [...nguon.matchAll(/(?<![\w$.])\d[\d_]*(?:\.\d+)?/g)]
      .map((k) => k[0])
      .filter((s) => s !== '0' && s !== '1');
    expect(so).toEqual([]);
  });

  it('không dựng DOM bằng chuỗi, và giao hình dạng mẩu cho veMau', () => {
    // Phép đặt `textContent` chuyển sang `mau-giay.js` cùng với hình dạng mẩu (Story 2.5), và
    // `mau-giay.test.js` ghim nó ở đó. Vế ở lại đây là vế không bao giờ được đổi: tệp này
    // không dựng DOM từ chuỗi, bằng bất cứ cách viết nào.
    expect(nguon).toMatch(/veMau\s*\(/);
    expect(nguon).not.toMatch(/innerHTML|insertAdjacentHTML|outerHTML/);
  });

  it('app/main.js nối lưới trong cùng khối document: ve treo vào khoiDong, và làm sauKhiChot của noiOSoan', () => {
    // Cả hai nửa vỡ trong IM LẶNG. Bỏ lượt vẽ treo vào `khoiDong` thì lưới trống trơn sau mỗi
    // lần tải trang dù kho đầy ghi chú; bỏ tham số thứ ba của `noiOSoan` thì mẩu vừa chốt
    // không nhô lên cho tới lần tải sau — đúng lời hứa trung tâm của story bị phá.
    //
    // Từ Story 2.6 hai điểm nối đó nhận một callback VẼ CHUNG chứ không còn nhận thẳng
    // `luoi.ve`: có hai view phải vẽ lại, và treo riêng từng cái là cách một view bị quên ở
    // một trong hai chỗ. Nên ca này ghim đúng vế đã đổi — CÙNG một callback ở cả hai điểm
    // nối, và callback đó gọi cả hai `ve` — chứ không nới thành "có chứa chữ ve".
    const main = boChuThichJs(readFileSync(join(repoRoot, 'app', 'main.js'), 'utf8'));
    const treo = /khoiDong\s*\(\s*[^)]*\)\s*\.\s*then\s*\(\s*([\w$]+)\s*\)/.exec(main);
    const soan = /noiOSoan\s*\(\s*store\s*,\s*document\s*,\s*([\w$]+)\s*\)/.exec(main);
    expect(treo).not.toBeNull();
    expect(soan).not.toBeNull();
    expect(treo[1]).toBe(soan[1]);

    const than = new RegExp(`\\b${treo[1]}\\s*=\\s*\\(\\s*\\)\\s*=>\\s*\\{([^}]*)\\}`).exec(main);
    expect(than).not.toBeNull();
    // Đúng NĂM lượt vẽ trong callback chung, và một trong năm là của lưới. Tập này nới ba lần,
    // mỗi lần một view và mỗi lần có lý do: `['luoi', 'tieuDe']` ở Story 2.6, cộng dải băng ở
    // Story 3.1 (không vẽ lại thì mọi lỗi kho chết im lặng), cộng nút theme ở Story 3.3 (không
    // vẽ lại thì nhãn nút đứng yên ở chiều cũ sau một cú lật), cộng chân trang ở Story 4.4
    // (`ve()` của nó không còn rỗng: nó đổ dòng nhắc từ `lastBackupAt`). Vẫn ghim ĐÚNG tập,
    // không nới thành "có chứa": một view thứ sáu thêm vào ngày mai vẫn phải đọc lại chú thích.
    expect([...than[1].matchAll(/([\w$]+)\s*\.\s*ve\s*\(\s*\)/g)].map((k) => k[1])).toEqual([
      'luoi',
      'tieuDe',
      'banner',
      'nutTheme',
      'chanTrang',
    ]);
    // Lưới nối TRƯỚC khi kho được hỏi — `luoi.ve` phải tồn tại trước khi có chỗ treo nó vào.
    expect(main.search(/noiLuoi\s*\(/)).toBeLessThan(main.search(/store\s*\.\s*khoiDong\s*\(/));
  });

  it('app/main.js nối BA móc của chế độ sửa, và cả ba kéo theo một lượt vẽ (Story 5.1)', () => {
    // Bốn nửa, và cả bốn vỡ trong IM LẶNG — chúng là đúng bốn lỗi của vòng review 1:
    //
    //   (1) `go` phải treo lượt vẽ vào LỜI HỨA của `tuLuuNoiDung`, không gọi nó ở phím gõ: dự
    //       án không có subscribe, nên `notes` đổi (chữ vừa sửa) và `banner` bật lên (dải băng
    //       trần) chỉ hiện ra được ở đó.
    //   (2) `roi` phải mang theo `id` và chỉ rời khi `editing.id` khớp: `blur` nổ cả khi phần
    //       tử bị GỠ khỏi DOM, nên lượt vẽ mở ô sửa của mẩu B phát `blur` của mẩu A giữa đường.
    //   (3) lượt vẽ khi rời phải HOÃN một nhịp: `blur` đi trước `mouseup`, nên vẽ ngay làm cú
    //       bấm từ mẩu A sang mẩu B rơi vào tổ tiên chung.
    //   (4) và lượt vẽ đó phải GIỮ TIÊU ĐIỂM, theo tiền lệ `dongRoiVe`.
    const main = boChuThichJs(readFileSync(join(repoRoot, 'app', 'main.js'), 'utf8'));
    const noi = /noiLuoi\s*\(\s*store\s*,\s*document\s*,\s*[\w$]+\s*,\s*([\w$]+)\s*\)/.exec(main);
    expect(noi).not.toBeNull();
    const moc = new RegExp(`\\b${noi[1]}\\s*=\\s*\\{([\\s\\S]*?)\\n  \\}`).exec(main);
    expect(moc).not.toBeNull();
    // Ba móc, đúng ba action của lõi.
    expect(moc[1]).toMatch(/\bvao\s*:/);
    expect(moc[1]).toMatch(/\broi\s*:/);
    expect(moc[1]).toMatch(/store\s*\.\s*tuLuuNoiDung\s*\([^)]*\)\s*\.\s*then\s*\(/);

    const vao = /\bvaoSuaRoiVe\s*=\s*\(\s*id\s*,\s*viTri\s*\)\s*=>\s*\{([\s\S]*?)\n  \}/.exec(main);
    expect(vao).not.toBeNull();
    expect(vao[1]).toMatch(/store\s*\.\s*vaoCheDoSua\s*\(\s*id\s*\)/);
    expect(vao[1]).toMatch(/\.\s*focus\s*\(\s*\)/);
    expect(vao[1]).toMatch(/setSelectionRange\s*\(/);

    const roi = /\broiSuaRoiVe\s*=\s*\(\s*id\s*\)\s*=>\s*\{([\s\S]*?)\n  \}/.exec(main);
    expect(roi).not.toBeNull();
    expect(roi[1]).toMatch(/store\s*\.\s*state\s*\.\s*editing\s*\.\s*id\s*!==\s*id/);
    expect(roi[1]).toMatch(/store\s*\.\s*roiCheDoSua\s*\(\s*\)/);
    // HOÃN bằng `setTimeout`, không `requestAnimationFrame` — bộ quét của
    // `test/chuyen-dong-va-tin-hieu.test.js` chặn cái sau, nên đây là cửa duy nhất.
    expect(roi[1]).toMatch(/setTimeout\s*\(/);
    expect(roi[1]).not.toMatch(/requestAnimationFrame/);

    const giu = /\bveGiuTieuDiem\s*=\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\n  \}/.exec(main);
    expect(giu).not.toBeNull();
    expect(giu[1]).toMatch(/activeElement/);
    expect(giu[1]).toMatch(/\.\s*focus\s*\(\s*\)/);
  });
});
