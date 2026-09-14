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
    con: [],
    thuocTinh: {},
    boNghe: {},
    append(...moi) {
      this.con.push(...moi);
    },
    setAttribute(ten, giaTri) {
      this.thuocTinh[ten] = giaTri;
    },
    addEventListener(ten, ham) {
      this.boNghe[ten] = ham;
    },
  };
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
 */
function luoiGia() {
  const luoi = {
    con: [],
    soLanThayCon: 0,
    ownerDocument: { createElement: () => phanTuGia() },
    replaceChildren(...moi) {
      luoi.con = moi;
      luoi.soLanThayCon += 1;
    },
    chu() {
      return luoi.con.map((c) => timTheoLop(c, 'mau-than').textContent);
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
    // Trạng thái rỗng có lời nhắn là Story 2.6. Một dòng "chưa có gì" thêm ở đây sẽ phải gỡ
    // ra, nên nó bị ghim là không được tồn tại.
    const luoi = luoiGia();
    const store = storeVoiKho([ban(HOM_QUA, '23:00:00', 'hôm qua')]);
    await store.khoiDong();
    noiLuoi(store, gocGia(luoi), () => MOC).ve();

    expect(luoi.con).toEqual([]);
    expect(luoi.chu().join('')).toBe('');
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

  it('click một mẩu bị cắt: gọi action của lõi VÀ vẽ lại — click nữa thì thu lại', async () => {
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

    luoi.con[0].boNghe.click();
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
    // Cả hai nửa vỡ trong IM LẶNG. Bỏ `.then(luoi.ve)` thì lưới trống trơn sau mỗi lần tải
    // trang dù kho đầy ghi chú; bỏ tham số thứ ba của `noiOSoan` thì mẩu vừa chốt không nhô
    // lên cho tới lần tải sau — đúng lời hứa trung tâm của story bị phá.
    const main = boChuThichJs(readFileSync(join(repoRoot, 'app', 'main.js'), 'utf8'));
    expect(main).toMatch(/khoiDong\s*\(\s*\)\s*\.\s*then\s*\(\s*[\w$]+\s*\.\s*ve\s*\)/);
    expect(main).toMatch(/noiOSoan\s*\(\s*store\s*,\s*document\s*,\s*[\w$]+\s*\.\s*ve\s*\)/);
    // Lưới nối TRƯỚC khi kho được hỏi — `luoi.ve` phải tồn tại trước khi có chỗ treo nó vào.
    expect(main.search(/noiLuoi\s*\(/)).toBeLessThan(main.search(/store\s*\.\s*khoiDong\s*\(/));
  });
});
