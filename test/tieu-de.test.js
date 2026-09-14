// Tiêu đề tab nối vào store (Story 2.6) — bước 2 của UJ-1, và nó vỡ trong im lặng.
//
// Một tiêu đề sai không làm gì hỏng: trang vẫn chạy, lưới vẫn đúng, chỉ có thanh tab nói dối.
// Nên bốn câu hỏi dưới đây phải là test chứ không phải một lần nhìn bằng mắt:
//
//   (1) Con số là số ghi chú của HÔM NAY — không phải tổng kho, không phải hôm qua.
//   (2) Con số KHÔNG đi theo điều kiện đang bật, cả `keyword` lẫn `date`. Đây là nửa mà một
//       `store.state.dieuKien` viết vào chỗ khối điều kiện rỗng sẽ phá, và Epic 6 mới lộ ra.
//   (3) Hôm nay rỗng thì BỎ hẳn tiền tố số — quyết định đã chốt của story, không phải `0 - `.
//   (4) Tiêu đề tính lại ở mỗi lượt vẽ, nên tab mở qua nửa đêm đếm theo ngày mới.
//
// Không dùng jsdom, cùng lý do `luoi.test.js` không dùng: `noiTieuDe(store, doc)` nhận tài
// liệu qua tham số, nên một object đúng một trường `title` là đủ.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fold } from '../app/core/fold.js';
import { taoStore } from '../app/core/state.js';
import { nowIso } from '../app/core/time.js';
import { PORT_METHODS } from '../app/ports/index.js';
import { noiTieuDe } from '../app/view/tieu-de.js';
import { boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const MOC = '2026-09-14T09:30:00+07:00';
const MOC_HOM_SAU = '2026-09-15T00:30:00+07:00';
const HOM_NAY = '2026-09-14';
const HOM_QUA = '2026-09-13';

/** Chuỗi nền, viết lại ở đây nguyên văn: ca cuối đọc cả `index.html` lẫn `tieu-de.js` để ghim
 *  rằng ba bản của chuỗi này không trôi khỏi nhau. */
const NEN = 'Ghi chú hàng ngày';

// ---------------------------------------------------------------------------
// Store THẬT, kho giả, tài liệu giả
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

/** Bản ghi đúng năm trường của AD-13, `textFolded` gấp y như `state.js` gấp. */
function ban(ngay, gio, text) {
  const createdAt = `${ngay}T${gio}+07:00`;
  return { id: `${ngay}-${gio}`, createdAt, localDate: ngay, text, textFolded: fold(text) };
}

/** Tài liệu giả: đúng thứ `tieu-de.js` chạm tới, và không hơn. */
function docGia() {
  return { title: NEN };
}

// ---------------------------------------------------------------------------
// Hành vi
// ---------------------------------------------------------------------------

describe('noiTieuDe — thanh tab nói hôm nay đã ghi bao nhiêu', () => {
  it('hôm nay có 4 ghi chú: tiêu đề là `4 - Ghi chú hàng ngày`', async () => {
    const doc = docGia();
    const store = storeVoiKho([
      ban(HOM_NAY, '08:00:00', 'một'),
      ban(HOM_NAY, '09:00:00', 'hai'),
      ban(HOM_NAY, '10:00:00', 'ba'),
      ban(HOM_NAY, '11:00:00', 'bốn'),
    ]);
    await store.khoiDong();
    noiTieuDe(store, doc, () => MOC).ve();

    expect(doc.title).toBe(`4 - ${NEN}`);
  });

  it('ghi chú của hôm qua KHÔNG được tính', async () => {
    const doc = docGia();
    const store = storeVoiKho([
      ban(HOM_QUA, '08:00:00', 'qua một'),
      ban(HOM_QUA, '09:00:00', 'qua hai'),
      ban(HOM_QUA, '10:00:00', 'qua ba'),
      ban(HOM_NAY, '08:00:00', 'nay một'),
      ban(HOM_NAY, '09:00:00', 'nay hai'),
    ]);
    await store.khoiDong();
    noiTieuDe(store, doc, () => MOC).ve();

    // Không phải `5 - …`: con số là số của HÔM NAY, không phải tổng kho.
    expect(doc.title).toBe(`2 - ${NEN}`);
  });

  it('vừa chốt cái thứ 5: lượt vẽ sau đó đổi `4 - …` thành `5 - …`', async () => {
    // Không có cơ chế subscribe trong dự án này, nên nửa "cập nhật ngay khi lưới vẽ lại" chỉ
    // đúng nếu `main.js` gọi lại `ve` — ca này ghim nửa còn lại: gọi lại thì con số ĐỔI.
    // Mẩu vừa chốt mang mốc THẬT của đồng hồ máy (`nowIso` trong `state.js`), nên cả bốn mẩu
    // cũ lẫn mốc truyền vào view đều phải đi theo cùng đồng hồ đó — không phải một ngày viết
    // cứng. MỘT mốc duy nhất, chụp một lần: hỏi lại giữa chừng thì một lần nửa đêm rơi vào
    // giữa hai lời gọi sẽ làm ca này đỏ vì một lý do không liên quan tới thứ nó hỏi.
    const bayGio = nowIso();
    const ngay = bayGio.slice(0, HOM_NAY.length);
    const doc = docGia();
    const store = storeVoiKho([
      ban(ngay, '00:00:00', 'một'),
      ban(ngay, '00:00:01', 'hai'),
      ban(ngay, '00:00:02', 'ba'),
      ban(ngay, '00:00:03', 'bốn'),
    ]);
    await store.khoiDong();
    const v = noiTieuDe(store, doc, () => bayGio);
    v.ve();
    expect(doc.title).toBe(`4 - ${NEN}`);

    store.datBanNhap('cái thứ năm');
    await store.chotGhiChu();
    v.ve();

    expect(doc.title).toBe(`5 - ${NEN}`);
  });

  it('hôm nay RỖNG: bỏ hẳn tiền tố số, tiêu đề đúng chuỗi nền', async () => {
    // Quyết định đã chốt của story, và nó phải được ghim bằng test chứ không bằng chú thích:
    // `0 - Ghi chú hàng ngày` là một dòng chữ nói "hôm nay chưa có gì", và trạng thái rỗng
    // không nói gì — kể cả trên thanh tab.
    const doc = docGia();
    const store = storeVoiKho([ban(HOM_QUA, '23:00:00', 'hôm qua')]);
    await store.khoiDong();
    noiTieuDe(store, doc, () => MOC).ve();

    expect(doc.title).toBe(NEN);
    expect(doc.title).not.toMatch(/^\d/);
  });

  it('kho rỗng hoàn toàn: vẫn đúng chuỗi nền, không ném', async () => {
    const doc = docGia();
    const store = storeVoiKho([]);
    await store.khoiDong();
    const v = noiTieuDe(store, doc, () => MOC);
    expect(() => v.ve()).not.toThrow();
    expect(doc.title).toBe(NEN);
  });

  it('điều kiện `keyword` đang bật: lưới hẹp lại nhưng con số KHÔNG đổi', async () => {
    // Đây là ca mà một `store.state.dieuKien` viết vào chỗ khối điều kiện rỗng sẽ đỏ — và là
    // lý do khối đó được dựng TẠI CHỖ trong `tieu-de.js` thay vì đọc ra từ state.
    const doc = docGia();
    const store = storeVoiKho([
      ban(HOM_NAY, '08:00:00', 'phở bò'),
      ban(HOM_NAY, '09:00:00', 'cà phê'),
      ban(HOM_NAY, '10:00:00', 'bún chả'),
      ban(HOM_NAY, '11:00:00', 'trà đá'),
    ]);
    await store.khoiDong();
    const v = noiTieuDe(store, doc, () => MOC);
    v.ve();
    expect(doc.title).toBe(`4 - ${NEN}`);

    store.datDieuKien({ keyword: 'pho' });
    v.ve();
    expect(doc.title).toBe(`4 - ${NEN}`);
  });

  it('điều kiện `date` là hôm qua: con số vẫn đếm HÔM NAY', async () => {
    const doc = docGia();
    const store = storeVoiKho([
      ban(HOM_QUA, '08:00:00', 'qua một'),
      ban(HOM_QUA, '09:00:00', 'qua hai'),
      ban(HOM_NAY, '08:00:00', 'nay một'),
      ban(HOM_NAY, '09:00:00', 'nay hai'),
    ]);
    await store.khoiDong();
    const v = noiTieuDe(store, doc, () => MOC);

    store.datDieuKien({ keyword: null, date: HOM_QUA });
    v.ve();

    // Lưới lúc này hiện hai mẩu của hôm qua; thanh tab vẫn nói "hôm nay đã ghi 2".
    expect(doc.title).toBe(`2 - ${NEN}`);
  });

  it('qua nửa đêm: lượt vẽ của ngày mới đếm theo ngày mới, thường là về rỗng', async () => {
    // `mocHienTai` là HÀM và được hỏi lại trong `ve()`: chốt mốc một lần lúc nối thì tab mở
    // qua 00:00 sẽ mang con số của hôm qua tới sáng hôm sau.
    const doc = docGia();
    const store = storeVoiKho([
      ban(HOM_NAY, '08:00:00', 'một'),
      ban(HOM_NAY, '09:00:00', 'hai'),
    ]);
    await store.khoiDong();
    let moc = MOC;
    const v = noiTieuDe(store, doc, () => moc);
    v.ve();
    expect(doc.title).toBe(`2 - ${NEN}`);

    moc = MOC_HOM_SAU;
    v.ve();
    expect(doc.title).toBe(NEN);
  });

  it('bản ghi có createdAt hỏng: ném TypeError — sập ồn ào, không đếm sai im lặng', () => {
    // Store THẬT không đưa được một bản ghi rác tới đây: `khoiDong` bắt lỗi của `sapGiamDan`
    // và đi ra bằng dải băng với `notes` giữ `[]`. Nên ca này hỏi thẳng VIEW, với một store
    // giả mang đúng bản ghi hỏng — thứ nó ghim là view không được tự dựng một nhánh "bỏ qua
    // bản ghi lạ": một phép đếm im lặng bỏ sót là một con số sai mà không ai thấy.
    const doc = docGia();
    const hong = { ...ban(HOM_NAY, '08:00:00', 'hỏng'), createdAt: 'hôm nào đó' };
    const storeGia = { state: { notes: [hong] } };

    expect(() => noiTieuDe(storeGia, doc, () => MOC).ve()).toThrow(TypeError);
  });

  it('không có tài liệu thì không ném, và ve() vẫn gọi được', () => {
    // `app/main.js` treo `ve` vào một lời hứa không bao giờ bị từ chối — cùng khuôn `noiLuoi`
    // và `noiOSoan`. Và `test/trang-tinh.test.js` nạp `main.js` ở Node, nơi không có
    // `document` nào.
    const v = noiTieuDe(storeVoiKho([]), null, () => MOC);
    expect(() => v.ve()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Cửa chặn tầng view — mỗi view mới mang cửa chặn của chính nó
// ---------------------------------------------------------------------------

describe('app/view/tieu-de.js — luật của tầng view, cưỡng chế được', () => {
  const duongDan = join(repoRoot, 'app', 'view', 'tieu-de.js');
  const nguon = boChuThichJs(readFileSync(duongDan, 'utf8'));

  it('chạm store ở đúng MỘT chỗ: đọc state, không một action nào', () => {
    const goiStore = [...nguon.matchAll(/store\s*\.\s*([\w$]+)/g)].map((k) => k[1]);
    expect([...new Set(goiStore)].sort()).toEqual(['state']);
    expect(nguon).not.toMatch(/subscribe|onChange|theoDoi/i);
  });

  it('không import app/adapters/, không tự gọi cổng, không new Date', () => {
    expect(nguon).not.toMatch(/adapters\//);
    expect(nguon).not.toMatch(/\bports\b/);
    // "Hôm nay" phải đi vào qua `nowIso` của `core/time.js`, không dựng tại chỗ (AD-4).
    expect(nguon).not.toMatch(/new\s+Date\b|Date\s*\.\s*(now|parse|UTC)\b/);
  });

  it('không dựng DOM bằng chuỗi, và không biết gì tới lưới', () => {
    expect(nguon).not.toMatch(/innerHTML|insertAdjacentHTML|outerHTML/);
    // Hai view không import nhau: chỉ `main.js` biết cả hai.
    expect(nguon).not.toMatch(/luoi\.js|mau-giay\.js|o-soan\.js/);
  });

  it('không số literal nào ngoài 0/1 — mọi ngưỡng sống ở app/core/limits.js (AD-14)', () => {
    const so = [...nguon.matchAll(/(?<![\w$.])\d[\d_]*(?:\.\d+)?/g)]
      .map((k) => k[0])
      .filter((s) => s !== '0' && s !== '1');
    expect(so).toEqual([]);
  });

  it('đếm bằng locGhiChu với khối điều kiện RỖNG dựng tại chỗ, không đọc state.dieuKien', () => {
    // Cả ba nửa của Design Notes, ghim bằng văn bản vì cả ba đều xanh ở mọi ca hành vi nếu
    // chỉ có một tập dữ liệu không bật điều kiện nào: phép đếm phải đi qua ĐÚNG `locGhiChu`
    // (không một `demHomNay()` thứ hai), và điều kiện đi vào nó phải là `{null, null}` viết
    // tại chỗ chứ không phải điều kiện đang bật.
    expect(nguon).toMatch(/locGhiChu\s*\(/);
    expect(nguon).toMatch(/keyword\s*:\s*null\s*,\s*date\s*:\s*null/);
    expect(nguon).not.toMatch(/state\s*\.\s*dieuKien/);
  });

  it('chuỗi nền trùng đúng từng chữ với <title> tĩnh của index.html', () => {
    // Trùng lặp CÓ Ý THỨC (AD-19): `index.html` mang chuỗi tĩnh để tab có tên đúng trước khi
    // module nào chạy, `tieu-de.js` mang nó để dựng lại tiêu đề có số. Không ca này thì hai
    // bản trôi khỏi nhau và sáng mở tab ra sẽ thấy tên tab NHÁY một lần khi lượt vẽ đầu chạy.
    const html = readFileSync(join(repoRoot, 'index.html'), 'utf8');
    const the = /<title>([^<]*)<\/title>/.exec(html);
    expect(the).not.toBeNull();
    expect(the[1]).toBe(NEN);
    expect(nguon).toContain(`'${NEN}'`);
  });
});
