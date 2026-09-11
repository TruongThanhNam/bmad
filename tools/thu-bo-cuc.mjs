// Đo bố cục bốn tầng trong một trình duyệt THẬT (Story 2.1), bằng máy.
//
// Vì sao không phải một test Vitest: những dòng của I/O & Edge-Case Matrix mà story này đứng
// hay ngã ở đó — "≥1600px thì trần 3 cột", "~900px thì 2", "~500px thì 1", "chỉ tầng lưới
// cuộn" — đều là câu hỏi về LAYOUT ĐÃ TÍNH, và không có layout engine thì không ai trả lời
// được. Quét văn bản chỉ kiểm được rằng ta đã KHAI BÁO `auto-fill`; nó không kiểm được rằng
// phép chia ra đúng 3. Một jsdom cũng không: nó không tính grid.
//
// Cùng quy ước với `npm run thu-tay`: tệp này KHÔNG vào `npm test` (vitest chỉ gom
// `test/**/*.test.js`, `tools/` nằm ngoài theo thiết kế) và không thêm dependency nào.
//
// Chạy:  npm run thu-bo-cuc
// Cần Edge hoặc Chrome; đặt GHICHU_BROWSER nếu nó nằm chỗ khác.

import { fileURLToPath } from 'node:url';
import { phucVuTinh, moTrinhDuyet, nghi } from './cdp.mjs';

const ketQua = [];
function ghi(ten, dat, chiTiet) {
  ketQua.push({ ten, dat, chiTiet });
  console.log(`${dat ? 'PASS' : 'FAIL'}  ${ten}${chiTiet ? ` — ${chiTiet}` : ''}`);
}

// Bơm ô TẠM vào lưới từ phía ngoài, không phải từ mã sản phẩm: Story 2.1 cấm nội dung mẫu
// trong `index.html`, và mẩu giấy thật chỉ tồn tại từ Story 2.5. Ô ở đây chỉ cần chiếm chỗ.
const BOM_O = (n) => `
  const luoi = document.querySelector('.luoi');
  luoi.replaceChildren();
  for (let i = 0; i < ${n}; i += 1) {
    const o = document.createElement('div');
    o.className = 'thu-o-tam';
    o.textContent = 'ô ' + i;
    o.style.blockSize = '120px';
    luoi.append(o);
  }
  return luoi.children.length;
`;

/** Số cột THỰC TẾ: đếm số ô có cùng tọa độ đỉnh với ô đầu tiên — không đọc lại khai báo CSS. */
const DEM_COT = `
  const o = [...document.querySelectorAll('.luoi > *')];
  if (o.length === 0) return 0;
  const dinh = Math.round(o[0].getBoundingClientRect().top);
  return o.filter((x) => Math.round(x.getBoundingClientRect().top) === dinh).length;
`;

const DO_CUON = `
  const cuonDuoc = (el) => el.scrollHeight - el.clientHeight > 1;
  return {
    trang: cuonDuoc(document.documentElement) || cuonDuoc(document.body),
    luoi: cuonDuoc(document.querySelector('.tang-luoi')),
    soan: cuonDuoc(document.querySelector('.tang-soan')),
    khay: cuonDuoc(document.querySelector('.tang-khay')),
    chan: cuonDuoc(document.querySelector('.tang-chan')),
  };
`;

/** Vị trí đỉnh của ba tầng không cuộn, để so trước/sau khi cuộn lưới. */
const DOC_MOC = `
  const dinh = (s) => Math.round(document.querySelector(s).getBoundingClientRect().top);
  return { soan: dinh('.tang-soan'), khay: dinh('.tang-khay'), chan: dinh('.tang-chan') };
`;

const goc = fileURLToPath(new URL('..', import.meta.url));
const server = await phucVuTinh(goc.replace(/[\\/]$/, ''));
const cdp = await moTrinhDuyet();

// `tab` được gán TRONG `try`: mở tab cũng có thể ném, và nếu nó ném ở ngoài thì `finally`
// không chạy, tiến trình trình duyệt cùng hồ sơ tạm ở lại trên máy.
let tab = null;

/** Đặt kích thước khung nhìn bằng Emulation — đổi bề rộng mà không mở lại tab. */
async function datKhungNhin(rong, cao) {
  await cdp.goi(
    'Emulation.setDeviceMetricsOverride',
    { width: rong, height: cao, deviceScaleFactor: 1, mobile: false },
    tab.sessionId,
  );
  await nghi(150);
}

try {
  tab = await cdp.tabMoi(server.diaChi);
  await cdp.doiSan(tab.sessionId);

  // ── Bốn tầng có mặt và xếp đúng thứ tự trên→dưới ─────────────────────────────────────
  await datKhungNhin(1600, 900);
  {
    const moc = await cdp.chay(tab.sessionId, DOC_MOC);
    ghi(
      'bốn tầng xếp đúng thứ tự trên→dưới: soạn < khay < chân',
      moc.soan < moc.khay && moc.khay < moc.chan,
      JSON.stringify(moc),
    );
  }

  // ── Số cột ở ba bề rộng: 3 / 2 / 1, không một breakpoint nào được khai báo ───────────
  //
  // Ba bề rộng dưới đây KHÔNG phải con số tùy ý, và cũng không phải mốc: chúng là ba điểm
  // lấy mẫu nằm gọn trong ba dải mà số học của token đã định sẵn.
  //   3 cột cần 3×260 + 2×8 = 796px nội dung → từ 796 + 2×16 = 828px khung nhìn trở lên
  //   2 cột cần 2×260 + 1×8 = 528px nội dung → từ 528 + 2×16 = 560px trở lên
  // Nên dải 2 cột là [560, 828). Dòng "~900px" của I/O Matrix là cách nói ước lượng cho
  // "cửa sổ vừa"; 900px thật sự nằm trong dải 3 cột, nên điểm lấy mẫu là 800px. Ranh giới
  // 828px được ghim riêng ngay bên dưới, để một lần đổi token làm lệch nó là thấy ngay.
  await cdp.chay(tab.sessionId, BOM_O(9));
  for (const [rong, mong] of [
    [1600, 3],
    [800, 2],
    [500, 1],
  ]) {
    await datKhungNhin(rong, 900);
    const cot = await cdp.chay(tab.sessionId, DEM_COT);
    ghi(`lưới ở ~${rong}px rộng: ${mong} cột`, cot === mong, `đo được ${cot}`);
  }

  // Ranh giới 3↔2 cột nằm đúng chỗ số học chỉ ra, không sớm hơn, không muộn hơn.
  {
    await datKhungNhin(830, 900);
    const tren = await cdp.chay(tab.sessionId, DEM_COT);
    await datKhungNhin(826, 900);
    const duoi = await cdp.chay(tab.sessionId, DEM_COT);
    ghi(
      'ranh giới 3↔2 cột ở 828px — đúng phép chia của token, không phải một mốc khai báo',
      tren === 3 && duoi === 2,
      `830px=${tren} cột · 826px=${duoi} cột`,
    );
  }

  // ── Trần 3 cột là hệ quả số học, không phải mốc: siêu rộng vẫn dừng ở 3 ──────────────
  await datKhungNhin(2560, 900);
  {
    const cot = await cdp.chay(tab.sessionId, DEM_COT);
    ghi('cửa sổ siêu rộng 2560px vẫn dừng ở 3 cột (trần --container-max)', cot === 3, `đo được ${cot}`);
    const rongVungChua = await cdp.chay(
      tab.sessionId,
      `return Math.round(document.querySelector('.tang-luoi .container').getBoundingClientRect().width);`,
    );
    ghi('vùng chứa dừng ở 1040px', rongVungChua === 1040, `${rongVungChua}px`);
  }

  // ── Khe lưới 8px và lề trang 16px đến từ token ───────────────────────────────────────
  {
    const dayDac = await cdp.chay(
      tab.sessionId,
      `
      const l = getComputedStyle(document.querySelector('.luoi'));
      const c = getComputedStyle(document.querySelector('.tang-luoi .container'));
      return { gap: l.columnGap, gutter: c.paddingLeft };
    `,
    );
    ghi(
      'khe lưới 8px và lề trang 16px — đúng --grid-gap / --page-gutter',
      dayDac.gap === '8px' && dayDac.gutter === '16px',
      JSON.stringify(dayDac),
    );
  }

  // ── Chỉ tầng lưới cuộn; trang không có thanh cuộn ngoài ─────────────────────────────
  await datKhungNhin(1280, 700);
  await cdp.chay(tab.sessionId, BOM_O(40));
  {
    const c = await cdp.chay(tab.sessionId, DO_CUON);
    ghi(
      'chỉ tầng lưới cuộn — trang, ô soạn thảo, khay và chân trang thì không',
      c.luoi && !c.trang && !c.soan && !c.khay && !c.chan,
      JSON.stringify(c),
    );

    const truoc = await cdp.chay(tab.sessionId, DOC_MOC);
    await cdp.chay(tab.sessionId, `document.querySelector('.tang-luoi').scrollTop = 400; return true;`);
    await nghi(100);
    const sau = await cdp.chay(tab.sessionId, DOC_MOC);
    const daCuon = await cdp.chay(
      tab.sessionId,
      `return document.querySelector('.tang-luoi').scrollTop;`,
    );
    ghi(
      'cuộn lưới 400px: ba tầng kia đứng YÊN tại chỗ',
      daCuon > 0 && JSON.stringify(truoc) === JSON.stringify(sau),
      `scrollTop=${daCuon} ${JSON.stringify(truoc)} → ${JSON.stringify(sau)}`,
    );
  }

  // ── Lưới rỗng: vẫn chiếm chỗ còn lại, chân trang vẫn ở đáy ───────────────────────────
  {
    await cdp.chay(tab.sessionId, `document.querySelector('.luoi').replaceChildren(); return true;`);
    await nghi(100);
    const d = await cdp.chay(
      tab.sessionId,
      `
      const chan = document.querySelector('.tang-chan').getBoundingClientRect();
      const luoi = document.querySelector('.tang-luoi').getBoundingClientRect();
      return {
        dayChan: Math.round(chan.bottom),
        khungNhin: window.innerHeight,
        caoLuoi: Math.round(luoi.height),
        soO: document.querySelectorAll('.luoi > *').length,
      };
    `,
    );
    ghi(
      'lưới rỗng: lưới vẫn chiếm chỗ còn lại và chân trang vẫn chạm đáy khung nhìn',
      d.soO === 0 && d.caoLuoi > 0 && Math.abs(d.dayChan - d.khungNhin) <= 1,
      JSON.stringify(d),
    );
  }

  // ── Khung nhìn hẹp nhất: không tràn ngang ───────────────────────────────────────────
  //
  // KHÔNG phải phép đo phóng trình duyệt: CDP không đặt được mức zoom thật (`width` của
  // `setDeviceMetricsOverride` đã tính bằng điểm ảnh CSS, còn `deviceScaleFactor` chỉ đổi
  // mật độ điểm ảnh vật lý). Phóng 200% vẫn là mục thử tay số 18 trong README. Ở đây chỉ
  // hỏi thêm một điều mà mẫu 500px phía trên không hỏi: bề ngang có tràn không.
  {
    await datKhungNhin(500, 400);
    await cdp.chay(tab.sessionId, BOM_O(6));
    const cot = await cdp.chay(tab.sessionId, DEM_COT);
    const c = await cdp.chay(tab.sessionId, DO_CUON);
    const tranNgang = await cdp.chay(
      tab.sessionId,
      `
      const goc = document.documentElement;
      const rongNhat = Math.max(...[...document.querySelectorAll('.tang *')]
        .map((e) => Math.round(e.getBoundingClientRect().right)));
      return { cuonNgang: goc.scrollWidth - goc.clientWidth > 1, phaiNhatCuaNoiDung: rongNhat };
    `,
    );
    ghi(
      'khung nhìn hẹp 500px: 1 cột, không cuộn trang, không tràn ngang',
      cot === 1 && !c.trang && !tranNgang.cuonNgang && tranNgang.phaiNhatCuaNoiDung <= 500,
      `cột=${cot} ${JSON.stringify(tranNgang)} ${JSON.stringify(c)}`,
    );
  }

  // ── Khung nhìn thấp: lưới không bị ô soạn thảo đẩy mất, chân trang không rơi ra ngoài ─
  //
  // `body` là `overflow: hidden`, nên bất cứ thứ gì cao lên ở tầng 1 mà đẩy hai tầng dưới
  // ra khỏi khung nhìn là đẩy chúng đi VĨNH VIỄN — không còn thanh cuộn nào đi tới. Đây là
  // cái giá của "không thanh cuộn ngoài", và nó phải được canh.
  {
    await datKhungNhin(1280, 360);
    await cdp.chay(tab.sessionId, BOM_O(20));
    const d = await cdp.chay(
      tab.sessionId,
      `
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      return {
        caoLuoi: Math.round(r('.tang-luoi').height),
        dayChan: Math.round(r('.tang-chan').bottom),
        khungNhin: window.innerHeight,
        keoDuocOSoan: getComputedStyle(document.querySelector('.o-soan')).resize,
      };
    `,
    );
    ghi(
      'khung nhìn thấp 360px: lưới vẫn còn chiều cao, chân trang vẫn trong khung, ô soạn thảo không kéo được',
      d.caoLuoi > 0 && d.dayChan <= d.khungNhin && d.keoDuocOSoan === 'none',
      JSON.stringify(d),
    );
  }

  // ── Hai theme: mọi màu thật sự ĐỔI khi theme đổi ─────────────────────────────────────
  //
  // So sánh light với dark chứ không kiểm dạng chuỗi: một màu viết thẳng, hay một token
  // thiếu bản ghi đè trong `:root[data-theme="dark"]`, vẫn là `rgb(...)` hợp lệ — chỉ phép
  // so hai bên mới bắt được nó đứng yên.
  {
    // Trả khung nhìn và lưới về trạng thái sạch trước khi đo màu: hai khối trên vừa đặt
    // một khung hẹp/thấp và bơm ô tạm, và không phép đo nào nên thừa hưởng trạng thái đó.
    await datKhungNhin(1280, 700);
    await cdp.chay(tab.sessionId, `document.querySelector('.luoi').replaceChildren(); return true;`);
    const DOC_MAU = `
      const doc = (s, t) => getComputedStyle(document.querySelector(s))[t];
      return {
        'nền bàn': doc('body', 'backgroundColor'),
        'chữ chính': doc('body', 'color'),
        'nền khay': doc('.khay', 'backgroundColor'),
        'nhãn khay': doc('.khay-nhan', 'color'),
        'nền ô nhập': doc('.o-tim', 'backgroundColor'),
        'viền ô nhập': doc('.o-tim', 'borderTopColor'),
        'chữ chân trang': doc('.chan-link', 'color'),
        'viền nút theme': doc('.nut-theme', 'borderTopColor'),
        'nét icon lịch': doc('.icon-lich', 'stroke'),
      };
    `;
    const doTheme = async (theme) => {
      await cdp.chay(
        tab.sessionId,
        `document.documentElement.dataset.theme = ${JSON.stringify(theme)}; return true;`,
      );
      await nghi(100);
      return cdp.chay(tab.sessionId, DOC_MAU);
    };
    const sang = await doTheme('light');
    const toi = await doTheme('dark');
    const dungYen = Object.keys(sang).filter((k) => sang[k] === toi[k]);
    ghi(
      'mọi màu đo được đều ĐỔI giữa light và dark — không một mảng nào viết cứng',
      dungYen.length === 0,
      dungYen.length === 0
        ? `${Object.keys(sang).length} điểm đo, tất cả đều đổi`
        : `đứng yên: ${dungYen.join(', ')}`,
    );
    // `currentColor` của icon phải bám đúng màu chữ của khung bọc, không phải một màu riêng.
    const boc = await cdp.chay(
      tab.sessionId,
      `return getComputedStyle(document.querySelector('.o-ngay-boc')).color;`,
    );
    ghi(
      'nét icon lịch bám currentColor của .o-ngay-boc, không tự khai màu',
      toi['nét icon lịch'] === boc,
      `icon=${toi['nét icon lịch']} bọc=${boc}`,
    );
  }

  // ── Ô ngày rộng đúng 118px kể cả viền và padding ─────────────────────────────────────
  {
    const rong = await cdp.chay(
      tab.sessionId,
      `return Math.round(document.querySelector('.o-ngay-boc').getBoundingClientRect().width);`,
    );
    ghi('ô ngày rộng đúng 118px (kích thước NGOÀI, đã gồm viền)', rong === 118, `${rong}px`);
  }
} finally {
  if (tab !== null) await cdp.dongTab(tab.targetId).catch(() => {});
  await cdp.dong();
  await server.dong();
}

const hong = ketQua.filter((k) => !k.dat);
console.log(`\n=== ${ketQua.length - hong.length}/${ketQua.length} đạt ===`);
for (const h of hong) console.log(` HỎNG — ${h.ten}: ${h.chiTiet}`);
process.exit(hong.length > 0 ? 1 : 0);
