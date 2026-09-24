// Hộp thoại xác nhận xóa (Story 5.3) — phần nghiệm thu được mà không cần trình duyệt.
//
// Chia việc như `banner.test.js` và `luoi.test.js` chia: hình học ("hộp căn giữa cả hai chiều",
// "overlay phủ kín khung nhìn", "vòng sáng nhìn rõ ở cả hai theme") là câu hỏi cho một layout
// engine, và nó sống ở `npm run thu-bo-cuc`. Ở đây là bốn thứ khác, và cả bốn vỡ trong im lặng:
//
//   (1) Hộp hiện ra từ ĐÚNG một trường state, và biến đi khi trường đó về `null`.
//   (2) Ba đường hủy (`hủy`, `Esc`, click overlay) đều là HỦY — không đường nào xóa.
//   (3) Tiêu điểm mở ở `hủy` và KHÔNG thoát ra nền: `Tab`/`Shift+Tab` vòng giữa đúng hai nút.
//   (4) Mẩu được hỏi biến khỏi `notes` thì hộp tự đóng — không hỏi về một thứ không còn tồn tại.
//
// Không dùng jsdom, cùng lý do với bốn tệp view kia: `noiHopThoai(store, goc, …)` nhận gốc DOM
// qua THAM SỐ, nên một gốc tối giản là đủ — và nó là thứ giữ cho tệp view không chạm global nào.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MA_LOI, loiUngDung } from '../app/core/errors.js';
import { fold } from '../app/core/fold.js';
import { taoStore } from '../app/core/state.js';
import { noiLuongXoa } from '../app/main.js';
import { PORT_METHODS } from '../app/ports/index.js';
import { noiHopThoai } from '../app/view/hop-thoai.js';
import { boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const CHON_GOC = '.hop-thoai-goc';

// ---------------------------------------------------------------------------
// Gốc DOM tối giản
// ---------------------------------------------------------------------------

function phanTuGia() {
  return {
    textContent: '',
    className: '',
    type: '',
    id: '',
    con: [],
    thuocTinh: {},
    boNghe: {},
    cha: null,
    soLanNhanTieuDiem: 0,
    append(...moi) {
      for (const con of moi) con.cha = this;
      this.con.push(...moi);
    },
    replaceChildren(...moi) {
      for (const con of moi) con.cha = this;
      this.con = moi;
    },
    setAttribute(ten, giaTri) {
      this.thuocTinh[ten] = giaTri;
    },
    addEventListener(ten, ham) {
      this.boNghe[ten] = ham;
    },
    focus() {
      this.soLanNhanTieuDiem += 1;
      tieuDiem = this;
    },
  };
}

/** Phần tử đang giữ tiêu điểm trong gốc giả — một biến của CA TEST, không của view. */
let tieuDiem = null;

/**
 * Phát một sự kiện NỔI BỌT từ `phanTu` lên tới gốc, dừng khi ai đó gọi `stopPropagation`.
 *
 * Phải mô phỏng đúng nửa nổi bọt, y như `mau-giay.test.js`: cửa chặn thật ở đây là "click TRONG
 * hộp không chạy tiếp lên overlay", và một phép gọi thẳng handler thì không bao giờ thấy được
 * sự khác nhau giữa có và không có `stopPropagation`.
 */
function phat(phanTu, ten, them = {}) {
  // `target` là phần tử PHÁT sự kiện và nó không đổi khi sự kiện nổi bọt — đúng như DOM thật.
  const suKien = { target: phanTu, ...them, daChanNoiBot: false, daChanMacDinh: false };
  suKien.stopPropagation = () => {
    suKien.daChanNoiBot = true;
  };
  suKien.preventDefault = () => {
    suKien.daChanMacDinh = true;
  };
  for (let nut = phanTu; nut !== null && nut !== undefined && !suKien.daChanNoiBot; nut = nut.cha) {
    nut.boNghe[ten]?.(suKien);
  }
  return suKien;
}

/**
 * Một cú bấm CHUỘT thật, hai nhịp — đúng thứ tự trình duyệt làm.
 *
 * `mousedown` đi trước, và chính nó là nhịp DỜI TIÊU ĐIỂM: trình duyệt đưa tiêu điểm sang phần
 * tử vừa bấm (hay sang `<body>` khi phần tử đó không nhận được tiêu điểm), TRỪ KHI ai đó gọi
 * `preventDefault` ở nhịp này. Rồi mới tới `click`.
 *
 * Mô phỏng đủ cả hai nhịp là điều kiện để ca "bấm vào thân hộp không làm mất phép giam" có
 * nghĩa: một phép gọi thẳng `click` không bao giờ thấy được tiêu điểm đã đi đâu.
 */
function bamChuot(phanTu) {
  const xuong = phat(phanTu, 'mousedown');
  if (!xuong.daChanMacDinh) tieuDiem = phanTu.boNghe.click === undefined ? null : phanTu;
  return { xuong, bam: phat(phanTu, 'click') };
}

/** Con cháu mang đúng một class, hoặc `null`. */
function theoLop(phanTu, lop) {
  if (phanTu === null || phanTu === undefined) return null;
  if ((phanTu.className ?? '').split(' ').includes(lop)) return phanTu;
  for (const con of phanTu.con ?? []) {
    const thay = theoLop(con, lop);
    if (thay !== null) return thay;
  }
  return null;
}

/** Mọi chuỗi chữ trong một cây — dùng để chứng minh một chuỗi KHÔNG có ở đâu cả. */
function moiChu(phanTu) {
  if (phanTu === null || phanTu === undefined) return [];
  return [phanTu.textContent ?? '', ...(phanTu.con ?? []).flatMap(moiChu)];
}

function gocGia(chuNha, chon = CHON_GOC) {
  return {
    querySelector(s) {
      return s === chon ? chuNha : null;
    },
  };
}

function chuNhaGia() {
  const pt = phanTuGia();
  pt.ownerDocument = { createElement: () => phanTuGia() };
  return pt;
}

// ---------------------------------------------------------------------------
// Store THẬT, kho giả — cùng khuôn `luoi.test.js`
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

function ban(id, text) {
  const createdAt = '2026-09-14T09:05:00+07:00';
  return { id, createdAt, localDate: createdAt.slice(0, 10), text, textFolded: fold(text) };
}

function storeVoiKho(ghiChu = [], remove = () => Promise.resolve()) {
  const ports = portsDay();
  ports.noteStore = {
    ...ports.noteStore,
    readAll: () => Promise.resolve(ghiChu),
    remove,
    // Hẹn tự lưu của `tuLuuNoiDung` có thể nổ ra sau khi ca test đã xong (nó là một
    // `setTimeout` thật). Cho nó một cửa im lặng thay vì để `portsDay()` ném ở một chỗ không ca
    // nào bắt — phép ghi đó không phải thứ tệp này hỏi về.
    put: () => Promise.resolve(),
  };
  return taoStore(ports);
}

/**
 * Gốc DOM giả cho `noiLuongXoa`: một lưới dựng lại TỪ STATE ở mỗi lượt vẽ, bằng phần tử MỚI —
 * đúng như `replaceChildren` của `view/luoi.js`. Đó là điều kiện để các ca dưới đây có nghĩa:
 * một phép trả tiêu điểm chạy TRƯỚC lượt vẽ đặt tiêu điểm lên một nút đã bị gỡ khỏi lưới, và
 * `nutXoaCua` (đọc lưới HIỆN HÀNH) không bao giờ trả về nút đó.
 */
function gocLuoiGia(store) {
  const oSoan = {
    ten: 'o-soan',
    focus() {
      tieuDiem = this;
    },
  };
  const luoi = { children: [] };
  const ve = () => {
    luoi.children = store.state.notes.map((note) => {
      const nut = {
        ten: `xoa:${note.id}`,
        focus() {
          tieuDiem = this;
        },
      };
      return {
        getAttribute: (ten) => (ten === 'data-mau' ? note.id : null),
        querySelector: (chon) => (chon === '.mau-xoa' ? nut : null),
        nut,
      };
    });
  };
  ve();
  const goc = {
    querySelector: (chon) => (chon === '.luoi' ? luoi : null),
    getElementById: (id) => (id === 'o-soan' ? oSoan : null),
  };
  const nutXoaCua = (id) => luoi.children.find((mau) => mau.getAttribute('data-mau') === id)?.nut;
  return { goc, ve, oSoan, nutXoaCua };
}

/** Store đã nạp sẵn hai mẩu, hộp thoại đã nối, và một nhật ký hai móc. */
async function dungCanh() {
  const store = storeVoiKho([ban('a', 'phở'), ban('b', 'bún')]);
  await store.khoiDong();
  const chuNha = chuNhaGia();
  const nhatKy = [];
  const hop = noiHopThoai(
    store,
    gocGia(chuNha),
    (id) => nhatKy.push(`dong:${id}`),
    (id) => nhatKy.push(`xoa:${id}`),
  );
  return { store, chuNha, nhatKy, hop };
}

// ---------------------------------------------------------------------------
// (1) Hộp vẽ ra từ đúng một trường state
// ---------------------------------------------------------------------------

describe('noiHopThoai — hộp hiện ra và biến đi theo `xacNhanXoa`', () => {
  it('không ai hỏi gì thì chỗ gắn RỖNG THẬT — không một phần tử nào', async () => {
    const { chuNha, hop } = await dungCanh();
    hop.ve();
    expect(chuNha.con).toEqual([]);
  });

  it('mở cho một mẩu: overlay, hộp, hai dòng chữ và hai lựa chọn — đúng microcopy đã chốt', async () => {
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const nen = chuNha.con[0];
    expect(nen.className).toBe('hop-thoai-nen');
    expect(theoLop(nen, 'hop-thoai-tieu-de').textContent).toBe('Xóa ghi chú này?');
    expect(theoLop(nen, 'hop-thoai-than').textContent).toBe(
      'Không có thùng rác và không hoàn tác được.',
    );
    expect(theoLop(nen, 'hop-thoai-chon').textContent).toBe('hủy');
    expect(theoLop(nen, 'hop-thoai-xoa').textContent).toBe('xóa');
    // Hộp KHÔNG nhắc lại chữ của Nam: một hộp thoại đọc lên nội dung ghi chú nghe như đang
    // buộc tội, và nó cũng là một chỗ chữ của Nam có thể thành markup.
    expect(moiChu(nen).join(' ')).not.toContain('phở');
  });

  it('hộp mang ngữ nghĩa hộp thoại và có TÊN — `role`, `aria-modal`, nhãn là chính tiêu đề', async () => {
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const khung = theoLop(chuNha.con[0], 'hop-thoai');
    expect(khung.thuocTinh.role).toBe('dialog');
    expect(khung.thuocTinh['aria-modal']).toBe('true');
    const tieuDe = theoLop(khung, 'hop-thoai-tieu-de');
    expect(khung.thuocTinh['aria-labelledby']).toBe(tieuDe.id);
    expect(tieuDe.id).not.toBe('');
    // Và dòng HẬU QUẢ phải đi cùng hộp: thiếu `aria-describedby` thì trình đọc màn hình đọc
    // `Xóa ghi chú này?` cùng hai nút rồi DỪNG, và vế "không có thùng rác và không hoàn tác
    // được" chỉ tới được người đang nhìn màn hình — đúng lúc nó quan trọng nhất.
    const than = theoLop(khung, 'hop-thoai-than');
    expect(khung.thuocTinh['aria-describedby']).toBe(than.id);
    expect(than.id).not.toBe('');
    expect(than.id).not.toBe(tieuDe.id);
  });

  it('hai lựa chọn là <button>, không phải nút gửi của một form nào', async () => {
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    for (const lop of ['hop-thoai-chon', 'hop-thoai-xoa']) {
      expect(theoLop(chuNha.con[0], lop).type).toBe('button');
    }
  });

  it('đóng state rồi vẽ lại: chỗ gắn rỗng trở lại — hộp CHỈ có trong DOM khi đang mở', async () => {
    // Không có vế này thì một overlay `position: fixed` vô hình vẫn phủ cả trang và ăn mọi cú
    // bấm — trang trông bình thường và không bấm được gì, không một ca nào đỏ.
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    expect(chuNha.con).toHaveLength(1);
    store.dongXacNhanXoa();
    hop.ve();
    expect(chuNha.con).toEqual([]);
  });

  it('vẽ lại nhiều lần với cùng một `id` KHÔNG dựng lại hộp — tiêu điểm không bị giật về `hủy`', async () => {
    // `veTatCa()` chạy sau mỗi lần chốt, mỗi phím gõ đã xuống kho, mỗi nhịp đóng dải băng. Một
    // lần dựng lại vô điều kiện thay hai nút ra giữa lúc chúng đang giữ tiêu điểm — tức đẩy
    // tiêu điểm về `<body>` ở đúng một hộp thoại mà cả điểm của nó là giam tiêu điểm lại.
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const lanDau = chuNha.con[0];
    const huy = theoLop(lanDau, 'hop-thoai-chon');
    hop.ve();
    hop.ve();
    expect(chuNha.con[0]).toBe(lanDau);
    expect(huy.soLanNhanTieuDiem).toBe(1);
  });

  it('không có chỗ gắn trong DOM thì không ném, và `ve()` vẫn gọi được', async () => {
    // `app/main.js` treo `ve` vào một lời hứa không bao giờ bị từ chối — cùng khuôn `noiBanner`.
    const store = storeVoiKho([]);
    expect(() => noiHopThoai(store, gocGia(chuNhaGia(), '#khong-co')).ve()).not.toThrow();
    expect(() => noiHopThoai(store, null).ve()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// (2) Ba đường hủy, một đường xóa
// ---------------------------------------------------------------------------

describe('noiHopThoai — `hủy`, `Esc` và click overlay đều là HỦY; chỉ `xóa` là xóa', () => {
  it('bấm `hủy` gọi móc đóng kèm id, và KHÔNG gọi móc xóa', async () => {
    const { store, chuNha, nhatKy, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    phat(theoLop(chuNha.con[0], 'hop-thoai-chon'), 'click');
    expect(nhatKy).toEqual(['dong:a']);
  });

  it('bấm `xóa` gọi móc xóa kèm id, và KHÔNG gọi móc đóng', async () => {
    const { store, chuNha, nhatKy, hop } = await dungCanh();
    store.moXacNhanXoa('b');
    hop.ve();
    phat(theoLop(chuNha.con[0], 'hop-thoai-xoa'), 'click');
    expect(nhatKy).toEqual(['xoa:b']);
  });

  it('cú bấm trên một nút KHÔNG chạy tiếp lên overlay — một cú bấm, một việc', async () => {
    // Không có phép chặn này thì bấm `xóa` gọi CẢ móc xóa lẫn móc hủy, và bấm `hủy` gọi móc hủy
    // hai lần. Cả hai đi qua một suite chỉ đo "có gọi không" mà xanh.
    const { store, chuNha, nhatKy, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    expect(phat(theoLop(chuNha.con[0], 'hop-thoai-xoa'), 'click').daChanNoiBot).toBe(true);
    expect(nhatKy).toEqual(['xoa:a']);
  });

  it('click TRÊN NỀN là hủy; click trong thân hộp (không trúng nút) thì không làm gì', async () => {
    const { store, chuNha, nhatKy, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const nen = chuNha.con[0];
    phat(theoLop(nen, 'hop-thoai-tieu-de'), 'click');
    expect(nhatKy).toEqual([]);
    phat(nen, 'click');
    expect(nhatKy).toEqual(['dong:a']);
  });

  it('`Esc` trong hộp là hủy, và nó chặn hành vi mặc định', async () => {
    const { store, chuNha, nhatKy, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const khung = theoLop(chuNha.con[0], 'hop-thoai');
    const suKien = phat(khung, 'keydown', { key: 'Escape' });
    expect(nhatKy).toEqual(['dong:a']);
    expect(suKien.daChanMacDinh).toBe(true);
  });

  it('`Esc` khi KHÔNG có hộp nào mở không có tác dụng gì — bộ nghe sống trên chính hộp', async () => {
    // Đây là cách "Esc chỉ có nghĩa khi hộp đang mở" được bảo đảm bằng cách DỰNG được: không có
    // hộp thì không có phần tử nào mang bộ nghe, nên không có gì để phát vào. Cửa (b) của
    // `test/focus-va-tab.test.js` giữ vế còn lại: không listener bàn phím nào ở cấp tài liệu.
    const { chuNha, nhatKy, hop } = await dungCanh();
    hop.ve();
    expect(chuNha.con).toEqual([]);
    expect(nhatKy).toEqual([]);
  });

  it('phím khác KHÔNG đóng hộp và KHÔNG chặn hành vi mặc định của nó', async () => {
    const { store, chuNha, nhatKy, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const khung = theoLop(chuNha.con[0], 'hop-thoai');
    for (const key of ['Enter', ' ', 'a', 'ArrowDown']) {
      expect(phat(khung, 'keydown', { key }).daChanMacDinh).toBe(false);
    }
    expect(nhatKy).toEqual([]);
  });

  it('view KHÔNG tự đổi state: nó chỉ gọi hai móc, `xacNhanXoa` vẫn nguyên sau mỗi cú bấm', async () => {
    // Phép đóng state là việc của `app/main.js` (nó còn phải vẽ lại và trả tiêu điểm). Một view
    // tự gọi `dongXacNhanXoa` là một view đổi state mà không ai vẽ lại — hộp ở lại trên màn
    // hình cho tới lượt vẽ sau, do một nguồn khác gây ra.
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    phat(theoLop(chuNha.con[0], 'hop-thoai-chon'), 'click');
    expect(store.state.xacNhanXoa).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// (3) Tiêu điểm: mở ở `hủy`, và không thoát ra nền
// ---------------------------------------------------------------------------

describe('noiHopThoai — tiêu điểm mở ở `hủy` và bị giam giữa đúng hai nút', () => {
  it('mở hộp thì tiêu điểm vào `hủy` — lựa chọn AN TOÀN, không `xóa`', async () => {
    // Một `Enter` theo phản xạ ngay lúc hộp mở ra không được xóa mất thứ gì.
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    expect(tieuDiem).toBe(theoLop(chuNha.con[0], 'hop-thoai-chon'));
  });

  it('`Tab` từ `hủy` sang `xóa`, `Tab` từ `xóa` về `hủy` — vòng khép kín', async () => {
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const nen = chuNha.con[0];
    const huy = theoLop(nen, 'hop-thoai-chon');
    const xoa = theoLop(nen, 'hop-thoai-xoa');
    const khung = theoLop(nen, 'hop-thoai');

    expect(phat(khung, 'keydown', { key: 'Tab', target: huy }).daChanMacDinh).toBe(true);
    expect(tieuDiem).toBe(xoa);
    expect(phat(khung, 'keydown', { key: 'Tab', target: xoa }).daChanMacDinh).toBe(true);
    expect(tieuDiem).toBe(huy);
  });

  it('`Shift+Tab` đi cùng một vòng — hai điểm thì "nút kia" là nút còn lại ở cả hai chiều', async () => {
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const nen = chuNha.con[0];
    const huy = theoLop(nen, 'hop-thoai-chon');
    const xoa = theoLop(nen, 'hop-thoai-xoa');
    const khung = theoLop(nen, 'hop-thoai');

    phat(khung, 'keydown', { key: 'Tab', shiftKey: true, target: huy });
    expect(tieuDiem).toBe(xoa);
    phat(khung, 'keydown', { key: 'Tab', shiftKey: true, target: xoa });
    expect(tieuDiem).toBe(huy);
  });

  it('bấm chuột vào THÂN hộp KHÔNG lấy tiêu điểm khỏi hai nút — phép giam không được tắt', async () => {
    // Cả hai bộ nghe bàn phím sống trên `hop`, và chúng chỉ nhận được phím vì phím nổi bọt lên
    // từ một phần tử BÊN TRONG đang giữ tiêu điểm. Để một cú bấm vào chữ (hay vào khoảng đệm)
    // đẩy tiêu điểm về `<body>` là `Esc` chết và `Tab` hết bị chặn — hộp thoại vẫn hiện ra
    // nhưng phép giam đã tắt, và không một lượt vẽ nào nói cho ai biết.
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const nen = chuNha.con[0];
    const huy = theoLop(nen, 'hop-thoai-chon');
    expect(tieuDiem).toBe(huy);

    for (const lop of ['hop-thoai-tieu-de', 'hop-thoai-than', 'hop-thoai']) {
      const { xuong } = bamChuot(theoLop(nen, lop));
      // Nhịp DỜI TIÊU ĐIỂM bị bỏ, và chỉ nó: `click` vẫn phát bình thường.
      expect(xuong.daChanMacDinh).toBe(true);
      expect(tieuDiem).toBe(huy);
    }

    // Và phép giam vẫn còn sống sau đó — đây là vế thật sự đáng lo.
    const khung = theoLop(nen, 'hop-thoai');
    phat(khung, 'keydown', { key: 'Tab', target: huy });
    expect(tieuDiem).toBe(theoLop(nen, 'hop-thoai-xoa'));
  });

  it('nhấn chuột trên VÙNG MỜ cũng không lấy tiêu điểm đi — kể cả một cú kéo không thành `click`', async () => {
    // Bộ nghe giữ tiêu điểm sống trên `nen`, không trên `hop`. Gắn trên `hop` thì cú nhấn trên
    // vùng mờ vẫn đẩy tiêu điểm về `<body>`, và nếu đó là một cú KÉO nhả ra ngoài vùng mờ thì
    // không có `click` nào tới để đóng hộp: hộp ở lại trên màn hình với phép giam đã tắt.
    const { store, chuNha, nhatKy, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const nen = chuNha.con[0];
    const huy = theoLop(nen, 'hop-thoai-chon');

    // Chỉ nhịp `mousedown` — cú kéo nhả ra ngoài, không `click` nào theo sau.
    const xuong = phat(nen, 'mousedown');
    expect(xuong.daChanMacDinh).toBe(true);
    expect(tieuDiem).toBe(huy);
    expect(nhatKy).toEqual([]);

    // Và phép giam còn sống: `Esc` vẫn hủy được.
    phat(theoLop(nen, 'hop-thoai'), 'keydown', { key: 'Escape', target: huy });
    expect(nhatKy).toEqual(['dong:a']);
  });

  it('bấm chuột vào một NÚT thì tiêu điểm đi bình thường — phép giữ hẹp đúng bằng phần còn lại', async () => {
    // Vế âm tính: một phép chặn viết rộng tay sẽ giữ tiêu điểm lại cả khi bấm vào chính nút, và
    // `:focus-visible` cùng thứ tự `Tab` sau đó đọc ra một chỗ đứng không phải chỗ vừa bấm.
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const nen = chuNha.con[0];
    const xoa = theoLop(nen, 'hop-thoai-xoa');
    const { xuong } = bamChuot(xoa);
    expect(xuong.daChanMacDinh).toBe(false);
    expect(tieuDiem).toBe(xoa);
  });

  it('`Tab` với một `target` LẠ vẫn bị chặn và rơi về `hủy` — không đường nào ra nền', async () => {
    // Đường lui phải là lựa chọn an toàn, và `preventDefault` phải chạy ở MỌI nhánh: bỏ nó ở
    // một nhánh nào là để trình duyệt đưa tiêu điểm ra nền, nơi một cú `Enter` bấm vào một
    // điều khiển người dùng không nhìn thấy.
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    const nen = chuNha.con[0];
    const khung = theoLop(nen, 'hop-thoai');
    const suKien = phat(khung, 'keydown', { key: 'Tab', target: theoLop(nen, 'hop-thoai-than') });
    expect(suKien.daChanMacDinh).toBe(true);
    expect(tieuDiem).toBe(theoLop(nen, 'hop-thoai-chon'));
  });
});

// ---------------------------------------------------------------------------
// (4) Mẩu được hỏi biến mất
// ---------------------------------------------------------------------------

describe('noiHopThoai — không hỏi về một mẩu không còn tồn tại', () => {
  it('`xacNhanXoa` mang một id mà `notes` không còn → chỗ gắn rỗng', async () => {
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('khong-co');
    hop.ve();
    expect(chuNha.con).toEqual([]);
  });

  it('bấm `xóa` trên mẩu ĐANG SỬA còn chữ: `blur` chạy trước, rồi hộp mở cho đúng mẩu đó', async () => {
    // Hàng I/O Matrix "Click `xóa` trên mẩu ĐANG sửa", nửa thứ nhất. Thứ tự ở đây KHÔNG phải
    // dàn dựng: trình duyệt phát `blur` của ô sửa cùng nhịp với `mousedown`, TRƯỚC `click` của
    // nút — nên `roiCheDoSua()` luôn chạy xong trước khi `moXacNhanXoa` được gọi.
    //
    // Chữ còn thì mẩu còn, nên hộp phải mở ra cho đúng nó — và nó phải mở ra dù mẩu vừa bị
    // `roiCheDoSua` gỡ khỏi `expandedIds`.
    const { store, chuNha, hop } = await dungCanh();
    store.vaoCheDoSua('a');
    expect(store.state.editing.id).toBe('a');
    await store.roiCheDoSua();
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['a', 'b']);

    store.moXacNhanXoa('a');
    hop.ve();
    expect(chuNha.con).toHaveLength(1);
    expect(theoLop(chuNha.con[0], 'hop-thoai-tieu-de').textContent).toBe('Xóa ghi chú này?');
  });

  it('bấm `xóa` trên mẩu ĐANG SỬA đã xóa sạch chữ: mẩu tự biến mất, hộp KHÔNG mở', async () => {
    // Nửa thứ hai của cùng hàng, và nó là nửa vỡ trong im lặng: `blur` chạy trước, `roiCheDoSua`
    // thấy ô rỗng nên nó XÓA mẩu (Story 5.2), rồi `click` của nút `xóa` mới tới và gọi
    // `moXacNhanXoa` cho một `id` vừa chết. Hỏi "Xóa ghi chú này?" về một mẩu đã biến khỏi lưới
    // là mời người ta bấm `xóa` cho một mẩu khác — hoặc tệ hơn, cho không mẩu nào.
    const { store, chuNha, hop } = await dungCanh();
    store.vaoCheDoSua('a');
    store.tuLuuNoiDung('a', '   ');
    await store.roiCheDoSua();
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['b']);

    store.moXacNhanXoa('a');
    hop.ve();
    expect(chuNha.con).toEqual([]);
  });

  it('ĐÚNG THỨ TỰ THẬT: `blur` mới KHỞI ĐỘNG lượt rời khi `click` tới — hộp không được NHÁY MỞ', async () => {
    // Đây là hàng I/O Matrix ở đúng nhịp mà nó xảy ra, không phải ở một phiên bản đã `await`
    // sẵn. `blur` chạy trước `click`, nhưng `roiCheDoSua()` là BẤT ĐỒNG BỘ: lúc cú bấm vào nút
    // `xóa` tới nơi, `notes` VẪN còn mẩu đó. Mở hộp ngay lúc đó là hộp hiện ra cho một mẩu đang
    // trên đường chết, rồi tự đóng ở lượt vẽ sau — một cú nháy, và một câu hỏi về hư không.
    //
    // Phép `remove` bị GIỮ LẠI cho tới khi ca này thả nó: một kho trả lời ngay thì phép xóa xong
    // trong vài microtask, trước cả khi một móc KHÔNG đợi kịp chạy — và ca xanh vì lý do sai.
    let thaXoa;
    const store = storeVoiKho(
      [ban('a', 'phở'), ban('b', 'bún')],
      () =>
        new Promise((giai) => {
          thaXoa = giai;
        }),
    );
    await store.khoiDong();
    const chuNha = chuNhaGia();
    const hop = noiHopThoai(store, gocGia(chuNha), () => {}, () => {});
    store.vaoCheDoSua('a');
    store.tuLuuNoiDung('a', '   ');

    // Móc THẬT của `app/main.js`, không một bản chép lại trong test: bản chép thì xanh cả khi
    // mã thật quên đợi. Mỗi lượt vẽ ghi lại hộp có đang hiện hay không.
    const daThayHop = [];
    let luotRoiSua = Promise.resolve();
    const luong = noiLuongXoa(
      store,
      gocLuoiGia(store).goc,
      () => {
        hop.ve();
        daThayHop.push(chuNha.con.length > 0);
      },
      () => luotRoiSua,
    );

    // `blur`: khởi động lượt rời, KHÔNG await — đúng như `roiSuaRoiVe` làm.
    luotRoiSua = store.roiCheDoSua();
    // Chứng minh cái bẫy có thật: ngay lúc này mẩu vẫn còn, nên mở hộp ngay là hộp MỞ RA.
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['a', 'b']);

    // `click` của nút `xóa` — tới trong lúc phép xóa của lượt rời còn đang bay.
    const moXong = luong.moHoi('a');
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    // Móc đang ĐỢI: chưa một lượt vẽ nào chạy, nên chưa có gì để nháy.
    expect(daThayHop).toEqual([]);

    thaXoa();
    await moXong;
    // Không một lượt vẽ nào từng thấy hộp mở: mẩu đã chết trước khi câu hỏi được đặt ra.
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['b']);
    expect(daThayHop).toEqual([false]);
    expect(chuNha.con).toEqual([]);
  });

  it('mẩu biến khỏi `notes` giữa chừng → hộp tự đóng ở lượt vẽ KẾ', async () => {
    // Dòng I/O Matrix: một lần rời chế độ sửa với ô rỗng (Story 5.2), hay một lần nạp sao lưu,
    // xóa mất mẩu đang được hỏi. Hỏi tiếp về nó là mời người ta bấm `xóa` cho một mẩu khác.
    const { store, chuNha, hop } = await dungCanh();
    store.moXacNhanXoa('a');
    hop.ve();
    expect(chuNha.con).toHaveLength(1);
    await store.xoaGhiChu('a');
    hop.ve();
    expect(chuNha.con).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Cửa chặn tầng view — mỗi view mới mang cửa chặn của chính nó
// ---------------------------------------------------------------------------

describe('app/view/hop-thoai.js — luật của tầng view, cưỡng chế được', () => {
  const nguon = boChuThichJs(
    readFileSync(join(repoRoot, 'app', 'view', 'hop-thoai.js'), 'utf8'),
  );

  it('chạm store ở đúng MỘT chỗ: đọc state, và không một action nào', () => {
    // Ghim ĐÚNG tập, không nới thành "có chứa". Hai action (`moXacNhanXoa`/`dongXacNhanXoa`) là
    // của `app/main.js`: chúng phải đi kèm một lượt vẽ và một phép trả tiêu điểm, hai việc mà
    // view không được tự làm cả hai.
    const goiStore = [...nguon.matchAll(/store\s*\.\s*([\w$]+)/g)].map((k) => k[1]);
    expect([...new Set(goiStore)].sort()).toEqual(['state']);
    expect(nguon).not.toMatch(/subscribe|onChange|theoDoi/i);
  });

  it('không import view khác, không import app/adapters/, không chạm cổng', () => {
    // Các view KHÔNG biết nhau (chỉ `main.js` biết cả sáu), và một `import` từ `./luoi.js` ở
    // đây là đường vòng đầu tiên để hai view bắt đầu gọi thẳng vào nhau.
    expect(nguon).not.toMatch(/from\s*'\.\/(?!hop-thoai)/);
    expect(nguon).not.toMatch(/adapters\//);
    expect(nguon).not.toMatch(/\bports\b/);
  });

  it('không `new Date`, không `document` toàn cục, không dựng DOM bằng chuỗi', () => {
    expect(nguon).not.toMatch(/new\s+Date\b|Date\s*\.\s*(now|parse|UTC)\b/);
    expect(nguon).not.toMatch(/innerHTML|insertAdjacentHTML|outerHTML/);
    // `document` chỉ được phép xuất hiện đúng một lần: giá trị MẶC ĐỊNH của tham số `goc`,
    // cùng khuôn `noiBanner`/`noiLuoi`. Mọi phép tìm phần tử khác đi qua tham số đó.
    expect(nguon.match(/\bdocument\b/g)).toHaveLength(1);
    expect(nguon).toMatch(/goc\s*=\s*document/);
  });

  it('không `<dialog>`/`showModal` — quyết định đã chốt của story', () => {
    // `::backdrop` không nhận token theo cùng đường với phần còn lại của `app/style.css`, và
    // hành vi focus/`Esc` dựng sẵn của `<dialog>` nằm ngoài tầm của gốc DOM tối giản mà mọi
    // test view của dự án này dùng — tức nửa quan trọng nhất của story sẽ không có người canh.
    expect(nguon).not.toMatch(/showModal|['"`]dialog['"`]\s*\)/);
    expect(nguon).not.toMatch(/::backdrop/);
  });

  it('chỗ gắn ở NGOÀI <main>, SAU <footer>, và rỗng nguyên ở dạng tĩnh', () => {
    // Ba nửa. Trong `<main>` thì lớp phủ nằm trong vùng của `.khung` và không phủ được chân
    // trang; trước `<footer>` thì thứ tự đọc của bốn tầng đổi; và một khoảng trắng bên trong
    // thẻ là một nút chữ mà `app/view/hop-thoai.js` sẽ không bao giờ dọn — nó `replaceChildren`
    // từ lượt vẽ đầu, nhưng lượt vẽ đầu chỉ chạy khi có gì đó để vẽ.
    const html = readFileSync(join(repoRoot, 'index.html'), 'utf8');
    const than = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
    expect(than[1]).not.toContain('hop-thoai-goc');
    expect(html.indexOf('hop-thoai-goc')).toBeGreaterThan(html.indexOf('</footer>'));
    const moc = /<div class="hop-thoai-goc"\s*>([\s\S]*?)<\/div>/i.exec(html);
    expect(moc).not.toBeNull();
    expect(moc[1]).toBe('');
  });

  it('app/main.js cắm ĐÚNG luồng xóa vào lưới và hộp thoại — hành vi thì ca bên dưới chạy thật', () => {
    // Chỉ phần CẮM được quét ở đây, và nó là phần duy nhất không chạy được dưới Vitest: khối
    // `document` của `main.js` không bao giờ chạy ở Node. Hành vi của `noiLuongXoa` — thứ tự vẽ,
    // chỗ trả tiêu điểm, phép đợi lượt rời — có describe riêng bên dưới và nó CHẠY mã thật.
    const main = boChuThichJs(readFileSync(join(repoRoot, 'app', 'main.js'), 'utf8'));
    expect(main).toMatch(
      /noiHopThoai\s*\(\s*store\s*,\s*document\s*,\s*luongXoa\s*\.\s*huy\s*,\s*luongXoa\s*\.\s*xoa\s*\)/,
    );
    // Móc `xoa` của lưới chỉ MỞ một câu hỏi.
    const moc = /\bxoa\s*:\s*\(\s*id\s*\)\s*=>\s*\{([\s\S]*?)\n    \}/.exec(main);
    expect(moc).not.toBeNull();
    expect(moc[1].trim()).toMatch(/^luongXoa\s*\.\s*moHoi\s*\(\s*id\s*\)\s*;?$/);
    // Lượt rời đi vào qua một HÀM đọc lại biến mỗi lần — một giá trị chụp lúc nối là lời hứa đã
    // chốt mãi mãi, và móc không bao giờ đợi gì cả.
    expect(main).toMatch(
      /noiLuongXoa\s*\(\s*store\s*,\s*document\s*,\s*\(\s*\)\s*=>\s*veTatCa\s*\(\s*\)\s*,\s*\(\s*\)\s*=>\s*luotRoiSua\s*\)/,
    );
    expect(main).toMatch(/luotRoiSua\s*=\s*store\s*\.\s*roiCheDoSua\s*\(\s*\)\s*\.\s*then\s*\(/);
  });

  it('không tự soạn một câu lỗi nào — mọi chuyện xấu đi ra bằng dải băng (AD-17)', () => {
    // Cùng cửa chặn mà `luoi.test.js` mang: một view dựng câu chữ lỗi của riêng nó là nguồn
    // thông báo thứ hai, và bảng ưu tiên của `core/banner.js` không còn bao được cả sản phẩm.
    expect(nguon).not.toMatch(/không lưu được|hết dung lượng|lỗi|thất bại/i);
    expect(nguon).not.toMatch(/maBanner|MA_LOI|banner/);
  });
});

// ---------------------------------------------------------------------------
// noiLuongXoa — nối dây của `app/main.js`, CHẠY thật trên một gốc DOM giả
// ---------------------------------------------------------------------------

describe('noiLuongXoa — lượt vẽ, phép xóa và chỗ trả tiêu điểm, chạy chứ không quét', () => {
  async function dungLuong({ remove } = {}) {
    const store = storeVoiKho([ban('a', 'phở'), ban('b', 'bún')], remove);
    await store.khoiDong();
    const luoi = gocLuoiGia(store);
    const nhatKy = [];
    const veTatCa = () => {
      luoi.ve();
      nhatKy.push(`ve:${store.state.xacNhanXoa ?? '-'}`);
    };
    const luong = noiLuongXoa(store, luoi.goc, veTatCa);
    return { store, luoi, nhatKy, luong };
  }

  it('moHoi: mở câu hỏi cho đúng mẩu và vẽ lại — không xóa gì', async () => {
    const { store, nhatKy, luong } = await dungLuong();
    await luong.moHoi('b');
    expect(store.state.xacNhanXoa).toBe('b');
    expect(nhatKy).toEqual(['ve:b']);
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['a', 'b']);
  });

  it('huy: đóng, vẽ lại, rồi tiêu điểm về nút `xóa` của ĐÚNG mẩu vừa hỏi, trên lưới MỚI', async () => {
    // Hai cách hỏng, và cả hai giữ mọi regex trên mã nguồn xanh: tìm "nút xóa đầu tiên của
    // trang" thay vì theo `id` (tiêu điểm về mẩu `a`), và trả tiêu điểm TRƯỚC lượt vẽ (nút cũ
    // bị gỡ khỏi lưới ngay sau đó). `nutXoaCua` đọc lưới hiện hành nên bắt được cả hai.
    const { store, luoi, nhatKy, luong } = await dungLuong();
    await luong.moHoi('b');
    luong.huy('b');
    expect(store.state.xacNhanXoa).toBeNull();
    expect(nhatKy).toEqual(['ve:b', 've:-']);
    expect(tieuDiem).toBe(luoi.nutXoaCua('b'));
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['a', 'b']);
  });

  it('xoa: hộp gỡ khỏi màn hình NGAY, trước khi phép ghi trả lời — không có khe cho cú bấm thứ hai', async () => {
    // Không có lượt vẽ đồng bộ này thì hộp thoại còn trong DOM tới khi `xoaGhiChu` chốt: một cú
    // `xóa` thứ hai gọi `remove` lần nữa, và một cú `hủy` cho người dùng thấy "đã hủy" rồi mẩu
    // vẫn biến mất.
    let traLoi;
    const { store, luoi, nhatKy, luong } = await dungLuong({
      remove: () =>
        new Promise((giai) => {
          traLoi = giai;
        }),
    });
    await luong.moHoi('a');
    const xong = luong.xoa('a');
    // Phép ghi còn đang bay, mà hộp đã đóng và đã vẽ lại.
    expect(store.state.xacNhanXoa).toBeNull();
    expect(nhatKy).toEqual(['ve:a', 've:-']);
    // Mẩu còn sống trong khe chờ, nên tiêu điểm đứng trên nút của nó chứ không rơi về `<body>`.
    expect(tieuDiem).toBe(luoi.nutXoaCua('a'));

    traLoi();
    await xong;
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['b']);
    expect(nhatKy).toEqual(['ve:a', 've:-', 've:-']);
    // Mẩu đã biến mất: đường lui là ô soạn thảo.
    expect(tieuDiem).toBe(luoi.oSoan);
  });

  it('xoa với ghi hỏng: mẩu còn nguyên, dải băng mang mã lỗi, tiêu điểm ở lại nút của nó', async () => {
    const { store, luoi, luong } = await dungLuong({
      remove: () => Promise.reject(loiUngDung(MA_LOI.QUOTA)),
    });
    await luong.moHoi('a');
    await luong.xoa('a');
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['a', 'b']);
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
    expect(store.state.xacNhanXoa).toBeNull();
    expect(tieuDiem).toBe(luoi.nutXoaCua('a'));
  });

  it('huy cho một mẩu không còn trên lưới: về ô soạn thảo, không sang một mẩu khác', async () => {
    // Story 7.0: `traTieuDiem` riêng đã biến mất — `huy`/`xoa` gọi `veGiuTieuDiem` của
    // `main.js` (mọi hàng tiêu điểm của nó chạy ở `test/giu-tieu-diem.test.js`). Ca này giữ lại
    // câu hỏi cũ ở đúng chỗ nối: luồng xóa có ĐI QUA đường lui đó không.
    const { luoi, luong } = await dungLuong();
    luong.huy('khong-co');
    expect(tieuDiem).toBe(luoi.oSoan);
  });

  it('không còn bề mặt `traTieuDiem` — luồng xóa chỉ có ba móc', async () => {
    const { luong } = await dungLuong();
    expect(Object.keys(luong).sort()).toEqual(['huy', 'moHoi', 'xoa']);
  });
});
