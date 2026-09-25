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

/** Bơm một câu vào phần tử chủ của dải băng TỪ NGOÀI mã sản phẩm — cùng quy ước `BOM_O`. */
const BOM_DAI_BANG = `
  const b = document.querySelector('.dai-bang');
  const s = document.createElement('span');
  s.className = 'dai-bang-chu';
  s.textContent = 'bộ đo bố cục — dải băng đang chiếm chỗ';
  b.replaceChildren(s);
  return Math.round(b.getBoundingClientRect().height);
`;

/** Chiều cao dải băng, đỉnh của `<main class="khung">`, đáy chân trang và khung nhìn — đủ để
 *  phân biệt "đẩy xuống" với "phủ lên": phủ lên thì đỉnh `.khung` KHÔNG nhúc nhích. */
const DO_DAI_BANG = `
  const goc = document.documentElement;
  return {
    caoBang: Math.round(document.querySelector('.dai-bang').getBoundingClientRect().height),
    dinhKhung: Math.round(document.querySelector('.khung').getBoundingClientRect().top),
    dayChan: Math.round(document.querySelector('.tang-chan').getBoundingClientRect().bottom),
    khungNhin: window.innerHeight,
    cuonTrang: goc.scrollHeight - goc.clientHeight > 1 || document.body.scrollHeight - document.body.clientHeight > 1,
  };
`;

/** Vị trí đỉnh của ba tầng không cuộn, để so trước/sau khi cuộn lưới. */
const DOC_MOC = `
  const dinh = (s) => Math.round(document.querySelector(s).getBoundingClientRect().top);
  return { soan: dinh('.tang-soan'), khay: dinh('.tang-khay'), chan: dinh('.tang-chan') };
`;

/** Tên một phần tử theo thẻ và class — đủ để đọc ra một dãy điểm dừng và so được với bảng. */
const HAM_TEN = `
  const ten = (el) => {
    if (el === null || el === document.body || el === document.documentElement) return null;
    const lop = String(el.className || '').trim().split(/\\s+/).filter(Boolean);
    return el.tagName.toLowerCase() + lop.map((l) => '.' + l).join('');
  };
  const vong = (el) => {
    const s = getComputedStyle(el);
    return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderTopColor].join(' | ');
  };
  // Khóa DUY NHẤT của một điều khiển: tên cộng vị trí của nó trong danh sách điều khiển theo
  // thứ tự DOM. Tên một mình không phân biệt được hai button.chan-link hay ba div.o-luoi.
  const CHON_DIEU_KHIEN =
    '.dai-bang-dong, .o-soan, .o-nhap, .o-luoi[tabindex], .mau-xoa, .chan-link, .nut-theme';
  const khoa = (el) => {
    const ds = [...document.querySelectorAll(CHON_DIEU_KHIEN)];
    const i = ds.indexOf(el);
    return i === -1 ? null : ten(el) + '#' + i;
  };
  // Vòng sáng ĐỌC RIÊNG từng phần: vong() nối năm thuộc tính nên một phép so includes
  // trên nó sẽ xanh cả khi màu --focus nằm ở border-top-color và outline đã bị gỡ sạch.
  const chiTietVong = (el) => {
    const s = getComputedStyle(el);
    return { kieu: s.outlineStyle, rong: s.outlineWidth, mau: s.outlineColor, bong: s.boxShadow };
  };
  // Tỉ lệ tương phản WCAG giữa hai màu rgb(...) — con số mà AC đòi ≥ 3:1 và cho tới giờ
  // chỉ có mắt người trả lời. Máy tính được nó, nên máy phải là thứ trả lời.
  const soRgb = (c) => (c.match(/[\\d.]+/g) || []).slice(0, 3).map(Number);
  const sang = (c) => {
    const [r, g, b] = soRgb(c).map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const tuongPhan = (a, b) => {
    const [x, y] = [sang(a), sang(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  // Nền THẬT phía sau một phần tử: leo lên tổ tiên cho tới màu đầu tiên không trong suốt.
  const nenSau = (el) => {
    for (let n = el.parentElement; n !== null; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (c !== 'transparent' && !/rgba\\(\\s*0\\s*,\\s*0\\s*,\\s*0\\s*,\\s*0\\s*\\)/.test(c)) return c;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
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

  // ── Con trỏ nằm sẵn trong ô soạn thảo, không cần một cú click nào (Story 2.2) ────────
  //
  // Đo NGAY sau khi mở tab và trước mọi phép đo khác: không khối nào dưới đây click vào đâu,
  // nhưng "phần tử đang nhận bàn phím lúc trang vừa tải" là một tính chất của lúc vừa tải.
  {
    const d = await cdp.chay(
      tab.sessionId,
      `
      const oDangNhan = document.activeElement;
      return {
        lop: oDangNhan === null ? null : oDangNhan.className,
        the: oDangNhan === null ? null : oDangNhan.tagName.toLowerCase(),
        coAutofocus: document.querySelector('.o-soan').hasAttribute('autofocus'),
        coMaxlength: document.querySelector('.o-soan').hasAttribute('maxlength'),
      };
    `,
    );
    ghi(
      'trang vừa tải: con trỏ đã ở trong ô soạn thảo, và ô không mang maxlength',
      d.the === 'textarea' && d.lop.includes('o-soan') && d.coAutofocus && !d.coMaxlength,
      JSON.stringify(d),
    );
  }

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

  // ── Dải băng ĐẨY ba tầng xuống, không phủ lên (Story 3.1) ───────────────────────────
  //
  // Vì sao không phải một ca Vitest: "đẩy xuống chứ không phủ lên" là một câu hỏi về LAYOUT ĐÃ
  // TÍNH. Quét văn bản chỉ kiểm được rằng ta đã KHAI BÁO `flex: none` — nó không phân biệt nổi
  // một `position: fixed` thêm vào ở cuối `style.css`, và cái đó phủ lên đúng tầng 1.
  //
  // Nội dung bơm vào từ NGOÀI mã sản phẩm, đúng khuôn `BOM_O`: bốn trong bảy nguồn của bảng
  // chưa có người phát, và ca này hỏi về bố cục chứ không về đường phát.
  {
    await datKhungNhin(1280, 700);
    await cdp.chay(tab.sessionId, BOM_O(6));
    await nghi(100);
    const truoc = await cdp.chay(tab.sessionId, DO_DAI_BANG);
    await cdp.chay(tab.sessionId, BOM_DAI_BANG);
    await nghi(100);
    const sau = await cdp.chay(tab.sessionId, DO_DAI_BANG);
    const daDay = sau.dinhKhung - truoc.dinhKhung;
    ghi(
      'dải băng hiện ra: ĐẨY ba tầng xuống đúng chiều cao của nó, chân trang vẫn trong khung nhìn',
      truoc.caoBang === 0 &&
        sau.caoBang > 0 &&
        Math.abs(daDay - sau.caoBang) <= 1 &&
        sau.dayChan <= sau.khungNhin + 1 &&
        !sau.cuonTrang,
      `cao ${truoc.caoBang}→${sau.caoBang} · đỉnh .khung đẩy ${daDay}px · đáy chân ${sau.dayChan}/${sau.khungNhin} · cuộn trang=${sau.cuonTrang}`,
    );
    // Dọn: mọi phép đo sau đây đo một trang KHÔNG có dải băng, như mọi lần trước.
    await cdp.chay(
      tab.sessionId,
      `document.querySelector('.dai-bang').replaceChildren(); return true;`,
    );
    await nghi(100);
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

  // ── Ô soạn thảo: sàn 92px, tự cao theo nội dung, và focus ring (Story 2.2) ──────────
  //
  // Ba câu hỏi ở đây không ai trả lời được bằng cách quét văn bản: 92px là giá trị ĐÃ TÍNH
  // của một token, "ô cao khít nội dung" là một phép so `scrollHeight` với `clientHeight`
  // sau khi layout chạy, và focus ring chỉ tồn tại khi `:focus-visible` thật sự khớp.
  {
    await datKhungNhin(1280, 700);
    await cdp.chay(tab.sessionId, `document.querySelector('.luoi').replaceChildren(); return true;`);

    // Gõ bằng cách đặt `value` rồi phát `input` — đúng đường mà bộ nghe của view lắng.
    const GO = (chu) => `
      const o = document.querySelector('.o-soan');
      o.value = ${JSON.stringify(chu)};
      o.dispatchEvent(new Event('input', { bubbles: true }));
      return o.value.length;
    `;
    const DO_O = `
      const o = document.querySelector('.o-soan');
      const s = getComputedStyle(o);
      const goc = document.documentElement;
      return {
        cao: Math.round(o.getBoundingClientRect().height),
        cuonTrongO: o.scrollHeight - o.clientHeight > 1,
        cuonTrang: goc.scrollHeight - goc.clientHeight > 1 || document.body.scrollHeight - document.body.clientHeight > 1,
        padding: s.paddingTop + ' ' + s.paddingLeft,
        bong: s.boxShadow,
      };
    `;

    await cdp.chay(tab.sessionId, GO(''));
    await nghi(100);
    const rong = await cdp.chay(tab.sessionId, DO_O);
    ghi(
      'ô soạn thảo rỗng: cao đúng 92px (--composer-min-h) và padding 12px/16px của DESIGN.md',
      rong.cao === 92 && rong.padding === '12px 16px',
      JSON.stringify(rong),
    );

    const nhieuDong = Array.from({ length: 12 }, (_, i) => `dòng ${i}`).join('\n');
    await cdp.chay(tab.sessionId, GO(nhieuDong));
    await nghi(100);
    const dai = await cdp.chay(tab.sessionId, DO_O);
    ghi(
      'nội dung 12 dòng: ô cao thêm khít chữ, KHÔNG thanh cuộn trong ô, và trang vẫn không cuộn',
      dai.cao > rong.cao && !dai.cuonTrongO && !dai.cuonTrang,
      JSON.stringify(dai),
    );

    // Xóa hết chữ phải làm ô CO LẠI về đúng sàn — nửa mà một hàm autosize thiếu bước đặt
    // `block-size: auto` trước khi đọc `scrollHeight` sẽ làm sai trong im lặng.
    await cdp.chay(tab.sessionId, GO(''));
    await nghi(100);
    const lai = await cdp.chay(tab.sessionId, DO_O);
    ghi(
      'xóa hết chữ: ô co lại đúng 92px, không giữ chiều cao cũ',
      lai.cao === 92,
      JSON.stringify(lai),
    );

    // Trần chiều cao: bản nháp rất dài KHÔNG được ăn mất lưới và chân trang.
    //
    // Đây là cái giá của "không thanh cuộn ngoài": `.tang` là `flex: none` và `body` là
    // `overflow: hidden`, nên mỗi pixel ô soạn thảo cao thêm là một pixel lấy từ lưới — và
    // khi lưới hết chỗ thì chân trang đi ra ngoài khung nhìn VĨNH VIỄN. `--composer-max-h`
    // là chốt chặn, và chính ô phải cuộn để chữ dưới đáy còn tới được.
    await cdp.chay(tab.sessionId, GO(Array.from({ length: 40 }, (_, i) => `dòng ${i}`).join('\n')));
    await nghi(100);
    const rat = await cdp.chay(
      tab.sessionId,
      `
      const o = document.querySelector('.o-soan');
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const goc = document.documentElement;
      return {
        caoO: Math.round(o.getBoundingClientRect().height),
        cuonTrongO: o.scrollHeight - o.clientHeight > 1,
        caoLuoi: Math.round(r('.tang-luoi').height),
        dayChan: Math.round(r('.tang-chan').bottom),
        khungNhin: window.innerHeight,
        cuonTrang: goc.scrollHeight - goc.clientHeight > 1,
      };
    `,
    );
    ghi(
      'bản nháp 40 dòng: ô dừng ở trần 320px và tự cuộn; lưới còn chiều cao, chân trang còn trong khung, trang không cuộn',
      rat.caoO === 320 &&
        rat.cuonTrongO &&
        rat.caoLuoi > 0 &&
        rat.dayChan <= rat.khungNhin &&
        !rat.cuonTrang,
      JSON.stringify(rat),
    );
    await cdp.chay(tab.sessionId, GO(''));
    await nghi(100);

    // Focus ring: viền đổi màu CỘNG một ring, và cả hai phải khác lúc chưa focus.
    const focus = await cdp.chay(
      tab.sessionId,
      `
      const o = document.querySelector('.o-soan');
      const doc = () => {
        const s = getComputedStyle(o);
        return { bong: s.boxShadow, vien: s.borderTopColor };
      };
      o.blur();
      const truoc = doc();
      o.focus();
      const sau = doc();
      return { truoc, sau, khop: o.matches(':focus-visible') };
    `,
    );
    ghi(
      'focus vào ô: viền đổi sang --focus và ring hiện ra, cả hai khác lúc chưa focus',
      focus.khop && focus.sau.bong !== focus.truoc.bong && focus.sau.vien !== focus.truoc.vien,
      JSON.stringify(focus),
    );

    // Đợi hết hẹn tự lưu rồi mới đi tiếp: bản nháp cuối cùng ghi xuống kho là bản RỖNG, nên
    // bộ đo không để lại chữ nào trong IndexedDB của origin cục bộ.
    await nghi(600);
  }

  // ── Lưới ghi chú: hàng ngang, xuống hàng, và xuống dòng trong ô (Story 2.4) ──────────
  //
  // Vì sao không phải một ca Vitest: `luoi.test.js` ghim được THỨ TỰ DOM ("mẩu mới nhất là
  // phần tử con đầu tiên") và nội dung `textContent`, và nó dừng đúng ở đó. Ba câu hỏi còn
  // lại là câu hỏi về LAYOUT ĐÃ TÍNH:
  //   - "trái sang phải" — các ô cùng hàng có cùng tọa độ đỉnh, tọa độ trái tăng dần;
  //   - "hết hàng xuống hàng, không masonry" — ô thứ tư phải mở một hàng MỚI và quay về CỘT
  //     ĐẦU. Đây là nửa mà một `grid-auto-flow: column` hay một thư viện masonry phá, và nó
  //     chỉ lộ ra khi có đủ ô để tràn hàng — ba ô ở lưới ba cột thì không bao giờ tràn;
  //   - "chữ nhiều dòng giữ nguyên xuống dòng" — `textContent` giữ `\n` bất kể CSS, nên chỉ
  //     một layout engine phân biệt được `white-space: pre-wrap` với `normal`: mẩu hai đoạn
  //     phải CAO hơn mẩu một dòng.
  {
    await datKhungNhin(1280, 700);
    await cdp.chay(tab.sessionId, `document.querySelector('.luoi').replaceChildren(); return true;`);

    /** Chốt một ghi chú qua đúng đường của người dùng: gõ, rồi `Ctrl+Enter`. */
    const CHOT = (chu) => `
      const o = document.querySelector('.o-soan');
      o.value = ${JSON.stringify(chu)};
      o.dispatchEvent(new Event('input', { bubbles: true }));
      o.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
      return true;
    `;
    /** Đợi tới khi lưới đã có đủ số ô — một phép ghi chậm phải hỏng thành TIMEOUT, không
     *  thành một phép đo hình học sai. Một `nghi()` cố định làm đúng điều ngược lại. */
    const doiSoO = async (mong) => {
      for (let i = 0; i < 50; i += 1) {
        const so = await cdp.chay(
          tab.sessionId,
          `return document.querySelectorAll('.luoi > *').length;`,
        );
        if (so === mong) return;
        await nghi(100);
      }
      throw new Error(`lưới không đạt ${mong} ô sau 5s — phép ghi hỏng hoặc lưới không vẽ lại`);
    };

    // Ô thứ tư mở hàng thứ hai ở lưới ba cột (1280px). Mẩu chốt SAU CÙNG đứng đầu, nên mẩu
    // hai đoạn là ô số 0 và mẩu một dòng ngay cạnh nó là ô số 1 — hai ô cùng hàng, cùng bề
    // rộng, khác nhau đúng ở số dòng.
    const CHU = ['mẩu một', 'mẩu hai', 'mẩu ba', 'đoạn một\n\nđoạn hai'];
    // Số ghi chú trong KHO trước khi đo, để phép dọn so đúng thứ cần so: số ô trên lưới chỉ
    // đếm ghi chú của HÔM NAY, còn `state.notes` đếm cả kho.
    const khoTruoc = await cdp.chay(
      tab.sessionId,
      `const m = await import('/app/main.js'); return m.store.state.notes.length;`,
    );
    // Số ô mà lượt vẽ đầu tiên SẼ sinh ra, hỏi thẳng bộ truy vấn: kho có thể đã mang ghi chú
    // của hôm nay từ trước, và đếm `.luoi` lúc này ra 0 chỉ vì dòng `replaceChildren` bên trên.
    const oTruoc = await cdp.chay(
      tab.sessionId,
      `
      const m = await import('/app/main.js');
      const q = await import('/app/core/query.js');
      const t = await import('/app/core/time.js');
      return q.locGhiChu(m.store.state.notes, m.store.state.dieuKien, t.nowIso()).total;
    `,
    );

    // Id của những mẩu THẬT SỰ được tạo, gom từng cái một. Xóa theo `notes.slice(0, 3)` là
    // xóa ba mẩu mới nhất BẤT KỂ chúng là gì — một lần chốt hỏng, hay một ghi chú thật mới
    // hơn, là mất dữ liệu thật trên máy người chạy.
    const idDaTao = [];
    try {
      for (const chu of CHU) {
        await cdp.chay(tab.sessionId, CHOT(chu));
        await doiSoO(oTruoc + idDaTao.length + 1);
        const moi = await cdp.chay(
          tab.sessionId,
          `
          const m = await import('/app/main.js');
          const n = m.store.state.notes.find((x) => x.text === ${JSON.stringify(chu)});
          return n === undefined ? null : n.id;
        `,
        );
        if (moi !== null) idDaTao.push(moi);
      }

      const d = await cdp.chay(
        tab.sessionId,
        `
        const o = [...document.querySelectorAll('.luoi > *')].slice(0, 4);
        const r = (x) => x.getBoundingClientRect();
        return {
          // Chữ của Nam đọc qua thân mẩu, không qua gốc của ô: từ Story 2.5 gốc ô còn mang
          // giờ tạo và nhãn nút xóa, nên textContent của nó không còn là nội dung ghi chú.
          chu: o.map((x) => x.querySelector('.mau-than').textContent),
          dinh: o.map((x) => Math.round(r(x).top)),
          trai: o.map((x) => Math.round(r(x).left)),
          cao: o.map((x) => Math.round(r(x).height)),
          xuongDong: getComputedStyle(o[0]).whiteSpace,
        };
      `,
      );

      const hangMot = d.dinh[0] === d.dinh[1] && d.dinh[1] === d.dinh[2];
      const traiTang = d.trai[0] < d.trai[1] && d.trai[1] < d.trai[2];
      ghi(
        'ba ô đầu trên MỘT hàng ngang, mẩu mới nhất trái nhất, cũ dần sang phải',
        d.chu.join('|') === [...CHU].reverse().join('|') && hangMot && traiTang,
        JSON.stringify(d),
      );
      ghi(
        'ô thứ tư XUỐNG HÀNG và quay về cột đầu — hết hàng xuống hàng, không masonry',
        d.dinh[3] > d.dinh[0] && d.trai[3] === d.trai[0],
        `đỉnh=${JSON.stringify(d.dinh)} trái=${JSON.stringify(d.trai)}`,
      );
      // So với ô Ở HÀNG KHÁC, không với ô cùng hàng: grid kéo mọi ô trong một hàng về cùng
      // chiều cao (`align-items: stretch`), nên ô một dòng nằm cạnh mẩu hai đoạn cũng cao
      // đúng bằng nó. Ô thứ tư đứng một mình ở hàng hai, và nó là phép so đúng.
      ghi(
        'mẩu hai đoạn CAO hơn mẩu một dòng — xuống dòng của Nam còn nguyên trên lưới',
        d.cao[0] > d.cao[3] && d.xuongDong === 'pre-wrap',
        `hai đoạn=${d.cao[0]}px · một dòng=${d.cao[3]}px · white-space=${d.xuongDong}`,
      );
    } finally {
      // Dọn trong `finally`: một phép đo ném ở giữa vẫn không được để lại mẩu rác nào trong
      // IndexedDB THẬT của origin cục bộ — README hứa đúng điều đó.
      const conLai = await cdp.chay(
        tab.sessionId,
        `
        const m = await import('/app/main.js');
        for (const id of ${JSON.stringify(idDaTao)}) await m.store.xoaGhiChu(id);
        return m.store.state.notes.length;
      `,
      );
      ghi(
        'dọn sạch đúng những mẩu bộ đo vừa tạo — kho trở lại y như trước',
        conLai === khoTruoc,
        `kho ${khoTruoc} → ${conLai} (đã tạo ${idDaTao.length})`,
      );
    }
  }

  // ── Mẩu giấy: cắt, mở rộng, và chiều cao trần (Story 2.5) ───────────────────────────
  //
  // Vì sao không phải một ca Vitest: `mau-giay.test.js` ghim được HÌNH DẠNG (mẩu nào có dòng
  // `còn N dòng ▾`, `N` bằng mấy, cờ mở rộng treo ở đâu) và nó dừng đúng ở đó. Bốn câu hỏi
  // còn lại là câu hỏi về LAYOUT ĐÃ TÍNH, và không có layout engine thì không ai trả lời được:
  //   - "mọi mẩu thu gọn CÙNG chiều cao trần" — kể cả một đoạn dài không xuống dòng, thứ mà
  //     phép đếm dòng logic của JS cố tình không thấy; chỉ `max-block-size` + `overflow` cắt.
  //   - "mở rộng TẠI CHỖ và đẩy hàng dưới xuống" — một phép so tọa độ đỉnh trước/sau.
  //   - "hai mẩu cùng mở" — nửa mà một ô nhớ đơn ở tầng C làm sai trong im lặng.
  //   - "tải lại trang thì MỌI mẩu về thu gọn" — chỉ một lần tải lại THẬT chứng minh được
  //     rằng trạng thái mở không rơi xuống IndexedDB hay localStorage ở đâu đó.
  {
    await datKhungNhin(1280, 700);

    const CHOT_MAU = (chu) => `
      const o = document.querySelector('.o-soan');
      o.value = ${JSON.stringify(chu)};
      o.dispatchEvent(new Event('input', { bubbles: true }));
      o.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
      return true;
    `;
    /** Đọc hình học của mọi mẩu đang trên lưới, theo đúng thứ tự DOM. */
    const DO_MAU = `
      const o = [...document.querySelectorAll('.luoi > *')];
      const r = (x) => x.getBoundingClientRect();
      return o.map((x) => ({
        chu: x.querySelector('.mau-than').textContent,
        cao: Math.round(r(x).height),
        dinh: Math.round(r(x).top),
        gap: x.querySelector('.mau-gap') === null ? null : x.querySelector('.mau-gap').textContent,
        mo: x.querySelector('.mau-than.mau-than-mo') !== null,
        tab: x.getAttribute('tabindex'),
        gio: x.querySelector('.mau-gio').textContent,
      }));
    `;

    // Ba mẩu DÀI và một mẩu một-đoạn-dài-không-xuống-dòng. Mẩu cuối là ca "suy giảm có ý
    // thức": nó KHÔNG có dòng `còn N dòng ▾` (một dòng logic), nhưng vẫn phải bị trần CSS cắt
    // về đúng chiều cao của những mẩu kia — nếu không, hàng hết đều.
    const DAI = (ten) => Array.from({ length: 9 }, (_, i) => `${ten} dòng ${i}`).join('\n');
    const MOT_DOAN = `một đoạn rất dài không hề xuống dòng `.repeat(20);
    const CHU_MAU = [DAI('A'), DAI('B'), MOT_DOAN, DAI('D')];

    const khoTruoc = await cdp.chay(
      tab.sessionId,
      `const m = await import('/app/main.js'); return m.store.state.notes.length;`,
    );
    const oTruoc = await cdp.chay(
      tab.sessionId,
      `
      const m = await import('/app/main.js');
      const q = await import('/app/core/query.js');
      const t = await import('/app/core/time.js');
      return q.locGhiChu(m.store.state.notes, m.store.state.dieuKien, t.nowIso()).total;
    `,
    );
    const doiSoMau = async (mong) => {
      for (let i = 0; i < 50; i += 1) {
        const so = await cdp.chay(
          tab.sessionId,
          `return document.querySelectorAll('.luoi > *').length;`,
        );
        if (so === mong) return;
        await nghi(100);
      }
      throw new Error(`lưới không đạt ${mong} mẩu sau 5s — phép ghi hỏng hoặc lưới không vẽ lại`);
    };

    const idMau = [];
    try {
      for (const chu of CHU_MAU) {
        await cdp.chay(tab.sessionId, CHOT_MAU(chu));
        await doiSoMau(oTruoc + idMau.length + 1);
        const moi = await cdp.chay(
          tab.sessionId,
          `
          const m = await import('/app/main.js');
          const n = m.store.state.notes.find((x) => x.text === ${JSON.stringify(chu)});
          return n === undefined ? null : n.id;
        `,
        );
        // Tra không ra `id` là một lỗi, không phải một ca để bỏ qua: mẩu ĐÃ được tạo (lưới vừa
        // đếm đủ số ô), nên bỏ qua im lặng là để nó ở lại trong IndexedDB thật của máy người
        // chạy, ngoài tầm với của phép dọn trong `finally`. Ném ở đây thì `finally` vẫn chạy và
        // dọn đúng những mẩu đã gom được, còn bộ đo thoát khác `0` như nó phải thế.
        if (moi === null) {
          throw new Error(`chốt xong nhưng không tra ra id của mẩu — kho có thể còn mẩu rác`);
        }
        idMau.push(moi);
      }

      // Chỉ đo những mẩu bộ đo vừa tạo: kho trên máy người chạy có thể đã mang ghi chú thật
      // của hôm nay, và chúng đứng SAU trong danh sách (cũ hơn).
      const thuGon = (await cdp.chay(tab.sessionId, DO_MAU)).slice(0, CHU_MAU.length);
      ghi(
        'mọi mẩu THU GỌN cao bằng nhau — kể cả đoạn dài không xuống dòng, hàng vẫn đều',
        new Set(thuGon.map((m) => m.cao)).size === 1 && thuGon.every((m) => !m.mo),
        JSON.stringify(thuGon.map((m) => m.cao)),
      );
      ghi(
        'mẩu nhiều dòng có `còn N dòng ▾` đúng số; đoạn dài một-dòng-logic thì KHÔNG có',
        thuGon[0].gap === 'còn 6 dòng ▾' &&
          thuGon[1].gap === null &&
          thuGon[2].gap === 'còn 6 dòng ▾',
        JSON.stringify(thuGon.map((m) => m.gap)),
      );
      // ĐO LẠI theo hành vi mới của Story 5.1: MỌI mẩu vào thứ tự Tab, không chỉ mẩu bị cắt.
      // Ca cũ ghim "chỉ mẩu BỊ CẮT" và nó ghim đúng trạng thái lúc đó — mẩu ngắn thật sự không
      // có hành vi nào cho tới story này. Nay click nó vào chế độ sửa, nên nó phải mở được
      // bằng cả bàn phím.
      ghi(
        'mỗi mẩu mang giờ tạo HH:mm, và MỌI mẩu vào thứ tự Tab (Story 5.1)',
        thuGon.every((m) => /^\d{2}:\d{2}$/.test(m.gio)) && thuGon.every((m) => m.tab === '0'),
        JSON.stringify(thuGon.map((m) => [m.gio, m.tab])),
      );

      /** Click mẩu thứ `i` đúng đường của người dùng — kèm TOẠ ĐỘ THẬT ở giữa thân mẩu.
       *
       *  Toạ độ không phải trang trí: `caretPositionFromPoint` đọc `clientX`/`clientY`, và một
       *  `MouseEvent` dựng trần mang `0/0` — tức con trỏ luôn rơi về đường lui (cuối chữ) và
       *  phép đo "con trỏ theo điểm bấm" xanh mà không chứng minh gì. */
      const CLICK = (i) => `
        const mau = document.querySelectorAll('.luoi > *')[${i}];
        const than = mau.querySelector('.mau-than') ?? mau;
        const r = than.getBoundingClientRect();
        mau.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          clientX: Math.round(r.left + r.width / 2),
          clientY: Math.round(r.top + r.height / 2),
        }));
        return true;
      `;
      // Mẩu cuối trong danh sách là mẩu CŨ NHẤT bộ đo tạo; ở lưới 3 cột nó nằm ở hàng thứ hai,
      // nên đỉnh của nó là thước đo "hàng dưới bị đẩy xuống".
      const hangDuoi = CHU_MAU.length - 1;
      await cdp.chay(tab.sessionId, CLICK(0));
      await nghi(100);
      const motMo = (await cdp.chay(tab.sessionId, DO_MAU)).slice(0, CHU_MAU.length);
      ghi(
        'click mẩu bị cắt: mở TẠI CHỖ, dòng đổi `thu lại ▴`, và hàng dưới bị đẩy xuống',
        motMo[0].mo &&
          motMo[0].gap === 'thu lại ▴' &&
          motMo[0].cao > thuGon[0].cao &&
          motMo[hangDuoi].dinh > thuGon[hangDuoi].dinh,
        `cao ${thuGon[0].cao}→${motMo[0].cao} · đỉnh hàng dưới ${thuGon[hangDuoi].dinh}→${motMo[hangDuoi].dinh}`,
      );

      await cdp.chay(tab.sessionId, CLICK(2));
      await nghi(100);
      const haiMo = (await cdp.chay(tab.sessionId, DO_MAU)).slice(0, CHU_MAU.length);
      ghi(
        'click mẩu bị cắt thứ hai: CẢ HAI cùng mở, mẩu trước KHÔNG bị thu lại',
        haiMo[0].mo && haiMo[2].mo,
        JSON.stringify(haiMo.map((m) => m.mo)),
      );

      // ── Chế độ sửa tại chỗ (Story 5.1) ──────────────────────────────────────────────
      //
      // Bốn phép đo, và cả bốn là câu hỏi mà `npm test` không trả lời được: chiều cao ĐÃ TÍNH
      // của ô sửa, tiêu điểm sau một lượt `replaceChildren` thật, một dải băng hiện ra trên màn
      // hình thật, và chữ trên lưới sau khi hẹn ghi nổ.
      //
      // Mọi phép đọc `.mau-sua` kiểm `null` và báo qua `ghi(...)`: một hồi quy phải hiện ra như
      // một dòng FAIL, không như một lần NỔ của công cụ.

      // Vị trí trong DOM của MỘT mẩu cụ thể, hỏi lại mỗi lần: lưới sắp theo khóa thời gian và
      // kho trên máy người chạy có thể đã mang ghi chú thật, nên một chỉ số viết cứng là cách
      // bộ đo lặng lẽ sửa nhầm một mẩu khác — rồi báo đỏ về một thứ sản phẩm làm đúng.
      const CHI_SO = (id) => `
        const m = await import('/app/main.js');
        const q = await import('/app/core/query.js');
        const t = await import('/app/core/time.js');
        const ds = q.locGhiChu(m.store.state.notes, m.store.state.dieuKien, t.nowIso());
        return ds.items.findIndex((x) => x.id === ${JSON.stringify(id)});
      `;
      /** Mẩu MỘT-ĐOẠN-DÀI (`CHU_MAU[2]`) — mẩu duy nhất KHÔNG bị cắt (một dòng LOGIC), tức
       *  nhịp 1 vào chế độ sửa luôn. */
      const idNgan = idMau[2];
      const viTriNgan = async () => cdp.chay(tab.sessionId, CHI_SO(idNgan));

      // ĐO LẠI theo hành vi mới: click một mẩu KHÔNG bị cắt nay vào chế độ sửa (nhịp 1), vì nó
      // không có gì bị cắt để mở. Ca cũ ghim "không một thứ gì đổi".
      await cdp.chay(tab.sessionId, CLICK(await viTriNgan()));
      await nghi(150);
      const oSuaMoiMo = await cdp.chay(
        tab.sessionId,
        `
        const o = document.querySelector('.mau-sua');
        if (o === null) return null;
        const r = o.getBoundingClientRect();
        const s = getComputedStyle(o);
        return {
          cao: Math.round(r.height),
          blockSize: o.style.blockSize,
          cuon: o.scrollHeight - o.clientHeight,
          tieuDiem: document.activeElement === o,
          conTro: o.selectionStart,
          chu: o.value,
          tranOng: s.overflow,
          keoDuoc: s.resize,
        };
      `,
      );
      if (oSuaMoiMo === null) {
        ghi('click mẩu ngắn mở ô sửa tại chỗ', false, 'không tìm thấy `.mau-sua` sau cú click');
      } else {
        // `scrollHeight` của một phần tử còn RỜI khỏi DOM là 0, nên một phép đo quá sớm ghim
        // `block-size: 0px` và ô sửa mở ra VÔ HÌNH cho tới phím đầu tiên.
        ghi(
          'ô sửa lúc vừa mở: cao > 0, khít nội dung, nhận tiêu điểm, và con trỏ ở ĐÚNG CHỖ BẤM',
          oSuaMoiMo.cao > 0 &&
            oSuaMoiMo.blockSize !== '0px' &&
            oSuaMoiMo.cuon <= 1 &&
            oSuaMoiMo.tieuDiem &&
            // Bấm vào GIỮA thân mẩu, nên con trỏ phải nằm giữa chữ — không ở đầu, và không ở
            // cuối. Đường lui "cuối chữ" là đúng cho bàn phím; ở đây nó là một hồi quy, và nếu
            // con số này không vào phép so thì nó là một hồi quy không ai thấy.
            oSuaMoiMo.conTro > 0 &&
            oSuaMoiMo.conTro < oSuaMoiMo.chu.length,
          JSON.stringify({ ...oSuaMoiMo, chu: `${oSuaMoiMo.chu.length} ký tự` }),
        );
        ghi(
          'ô sửa KHÔNG là vùng cuộn thứ ba và KHÔNG kéo được — hình học của hàng lưới còn nguyên',
          oSuaMoiMo.tranOng === 'hidden' && oSuaMoiMo.keoDuoc === 'none',
          `overflow=${oSuaMoiMo.tranOng} · resize=${oSuaMoiMo.keoDuoc}`,
        );
      }

      // `Tab` ra khỏi ô sửa: `blur` → `roiCheDoSua` → một lượt `replaceChildren` cả lưới, tức
      // gỡ đúng phần tử vừa nhận tiêu điểm. Không giữ tiêu điểm thì nó rơi về `<body>` và `Tab`
      // tiếp theo bắt đầu lại từ đầu trang.
      await cdp.chay(
        tab.sessionId,
        `
        const o = document.querySelector('.mau-sua');
        if (o === null) return false;
        // Điểm dừng kế tiếp trong thứ tự DOM là mẩu ngay sau nó — nay MỌI mẩu mang tabindex.
        const ds = [...document.querySelectorAll('.luoi > *')];
        const sau = ds[ds.indexOf(o.closest('.o-luoi')) + 1];
        if (sau !== undefined) sau.focus();
        else o.blur();
        return true;
      `,
      );
      await nghi(200);
      const sauTab = await cdp.chay(
        tab.sessionId,
        `
        const m = await import('/app/main.js');
        const a = document.activeElement;
        return {
          veBody: a === document.body || a === null,
          ten: a === null ? null : a.tagName.toLowerCase() + '.' + String(a.className || '').trim(),
          dangSua: m.store.state.editing.id,
          conOSua: document.querySelector('.mau-sua') !== null,
        };
      `,
      );
      ghi(
        '`Tab` ra khỏi ô sửa: thoát chế độ sửa, và tiêu điểm KHÔNG rơi về <body>',
        !sauTab.veBody && sauTab.dangSua === null && !sauTab.conOSua,
        JSON.stringify(sauTab),
      );

      // Trần ký tự TRONG ô sửa: dải băng phải hiện ra NGAY, và câu của nó không có `Ctrl+Enter`
      // — mệnh đề đó chỉ đúng ở ô soạn thảo.
      await cdp.chay(tab.sessionId, CLICK(await viTriNgan()));
      await nghi(150);
      const banTran = await cdp.chay(
        tab.sessionId,
        `
        const l = await import('/app/core/limits.js');
        const o = document.querySelector('.mau-sua');
        if (o === null) return null;
        o.value = 'x'.repeat(l.MAX_NOTE_CHARS + 1);
        o.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      `,
      );
      if (banTran === null) {
        ghi('dải băng trần khi đang sửa', false, 'không tìm thấy `.mau-sua` để dán chữ vào');
      } else {
        await nghi(200);
        const chuBang = await cdp.chay(
          tab.sessionId,
          `
          const m = await import('/app/main.js');
          const c = document.querySelector('.dai-bang-chu');
          const o = document.querySelector('.mau-sua');
          return {
            chu: c === null ? null : c.textContent,
            loai: m.store.state.banner,
            conChu: o === null ? null : o.value.length,
            trongState: m.store.state.editing.text.length,
          };
        `,
        );
        ghi(
          'dán quá trần lúc đang sửa: dải băng HIỆN RA, câu không có `Ctrl+Enter`, chữ vẫn còn',
          chuBang.chu !== null &&
            !chuBang.chu.includes('Ctrl+Enter') &&
            chuBang.chu.includes('không nhận thêm.') &&
            chuBang.loai === 'TOO_LONG_KHI_SUA' &&
            chuBang.conChu === chuBang.trongState,
          JSON.stringify(chuBang),
        );
        // Dọn: đưa ô sửa về đúng chữ cũ rồi rời, nếu không mẩu này giữ 20.001 ký tự.
        await cdp.chay(
          tab.sessionId,
          `
          const o = document.querySelector('.mau-sua');
          if (o === null) return false;
          o.value = ${JSON.stringify(CHU_MAU[2])};
          o.dispatchEvent(new Event('input', { bubbles: true }));
          o.blur();
          return true;
        `,
        );
        await nghi(600);
      }

      // Chữ vừa sửa phải hiện trên LƯỚI ngay lúc phép ghi xong — không đợi một tương tác khác.
      // Dự án không có subscribe, nên vế này chỉ đúng nếu `main.js` treo một lượt vẽ vào lời
      // hứa của `tuLuuNoiDung`.
      const CHU_SUA = `${CHU_MAU[2]}— đã sửa`;
      // Vị trí TRƯỚC khi sửa: "mẩu không nhảy chỗ sau một lần sửa" là một lời hứa trung tâm của
      // story, và nó chỉ đo được bằng hai phép đọc quanh phép sửa.
      const viTriTruocKhiSua = await viTriNgan();
      // Bấm rồi ĐỢI CÓ ô sửa, không đợi một khoảng cố định: lượt vẽ khi rời chế độ sửa trước đó
      // được hoãn một nhịp và một hẹn ghi có thể còn đang bay, nên một `nghi()` cố định là một
      // cuộc đua — và nó thua ở đúng những máy chậm mà bộ đo cần chạy được.
      for (let i = 0; i < 20; i += 1) {
        await cdp.chay(tab.sessionId, CLICK(await viTriNgan()));
        await nghi(150);
        const co = await cdp.chay(
          tab.sessionId,
          `return document.querySelector('.mau-sua') !== null;`,
        );
        if (co) break;
      }
      const daGo = await cdp.chay(
        tab.sessionId,
        `
        const o = document.querySelector('.mau-sua');
        if (o === null) return false;
        o.value = ${JSON.stringify(CHU_SUA)};
        o.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      `,
      );
      if (daGo !== true) {
        ghi('sửa nội dung tại chỗ rồi chờ hẹn ghi', false, 'không tìm thấy `.mau-sua` để gõ vào');
      } else {
        // Đợi hết `AUTOSAVE_MS` cộng một khoảng cho giao dịch IndexedDB — KHÔNG rời ô sửa, vì
        // đúng vế đang đo là "lưới hiện chữ mới mà không cần tương tác thêm".
        await nghi(1200);
        const sauGhi = await cdp.chay(
          tab.sessionId,
          `
          const m = await import('/app/main.js');
          const n = m.store.state.notes.find((x) => x.id === ${JSON.stringify(idNgan)});
          return {
            trongKho: n === undefined ? null : n.text,
            createdAt: n === undefined ? null : n.createdAt,
            viTri: m.store.state.notes.indexOf(n),
          };
        `,
        );
        ghi(
          'hẹn ghi nổ: bản ghi trong RAM mang chữ mới, và `createdAt` giữ nguyên',
          sauGhi.trongKho === CHU_SUA && sauGhi.createdAt !== null,
          JSON.stringify(sauGhi),
        );
        // Rời ô sửa rồi đọc THÂN MẨU trên lưới: đây là vế "hiện ra được".
        await cdp.chay(
          tab.sessionId,
          `
          const o = document.querySelector('.mau-sua');
          if (o !== null) o.blur();
          return true;
        `,
        );
        await nghi(300);
        const iSau = await viTriNgan();
        const chuTrenLuoi = await cdp.chay(
          tab.sessionId,
          `
          const t = [...document.querySelectorAll('.luoi > *')].map((x) =>
            x.querySelector('.mau-than') === null ? null : x.querySelector('.mau-than').textContent,
          );
          return t;
        `,
        );
        ghi(
          'thân mẩu trên lưới đọc đúng chữ vừa sửa, và mẩu KHÔNG đổi vị trí',
          iSau === viTriTruocKhiSua && chuTrenLuoi[iSau] === CHU_SUA,
          `vị trí ${viTriTruocKhiSua}→${iSau} · ${JSON.stringify(String(chuTrenLuoi[iSau]).slice(0, 48))}`,
        );
      }

      // Tải lại trang THẬT: đây là phép đo duy nhất chứng minh trạng thái mở rộng không rơi
      // xuống một kho bền nào. Hỏi thẳng cả hai kho sau đó, vì "trông thấy thu gọn" vẫn có thể
      // là một giá trị còn nằm đâu đó mà lượt vẽ đầu chưa đọc tới.
      await cdp.taiLai(tab.sessionId);
      await doiSoMau(oTruoc + idMau.length);
      // Đếm đủ mẩu chưa có nghĩa là layout đã ổn định: lượt vẽ đầu sau một lần tải lại có thể
      // đo trúng khung hình trước khi phông của `--font-note` xong, và chiều cao đo được lệch
      // một lần rồi tự đúng.
      //
      // Một nhịp nghỉ CỐ ĐỊNH không đủ, và đó là một chuyện đo được chứ không phải một phỏng
      // đoán: ở commit nền ca này xanh 7/7 lần chạy, còn sau Story 3.3 nó đỏ 2/4 — luôn luôn
      // đỏ ở đúng một vế (chiều cao một mẩu 128 → 106), trong khi ba vế còn lại (mọi mẩu thu
      // gọn, `expandedIds` rỗng, không khóa nào trong `localStorage`) vẫn đúng. Tức là phép đo
      // trúng một khung hình chưa xong, không phải sản phẩm lùi. Story 3.3 thêm một view thứ tư
      // vào lượt vẽ chung và một phép đặt theme đồng bộ lúc khởi động, nên khung hình đầu dịch
      // đi vài mili giây — vừa đủ để một nhịp 100ms hết ăn chắc.
      //
      // Chờ tới khi ỔN ĐỊNH thay vì chờ một con số: đọc lại cho tới khi hai lần đọc liên tiếp
      // cho cùng một dãy chiều cao. Nó KHÔNG làm phép so yếu đi — dãy vẫn phải khớp từng số với
      // `thuGon` — nó chỉ bỏ đi cái giả định rằng 100ms luôn đủ.
      let sauTaiLai = (await cdp.chay(tab.sessionId, DO_MAU)).slice(0, CHU_MAU.length);
      for (let lan = 0; lan < 10; lan += 1) {
        await nghi(100);
        const lai = (await cdp.chay(tab.sessionId, DO_MAU)).slice(0, CHU_MAU.length);
        const yenNgua = JSON.stringify(lai) === JSON.stringify(sauTaiLai);
        sauTaiLai = lai;
        if (yenNgua) break;
      }
      const dauVet = await cdp.chay(
        tab.sessionId,
        `
        const m = await import('/app/main.js');
        const khoaLocal = Object.keys(localStorage).filter((k) => /expand|mo-rong|collaps/i.test(k));
        return { trongState: m.store.state.expandedIds.length, khoaLocal };
      `,
      );
      ghi(
        'tải lại trang: MỌI mẩu về thu gọn, và không dấu vết nào của trạng thái mở trong kho',
        sauTaiLai.every((m) => !m.mo) &&
          dauVet.trongState === 0 &&
          dauVet.khoaLocal.length === 0 &&
          JSON.stringify(sauTaiLai.map((m) => m.cao)) === JSON.stringify(thuGon.map((m) => m.cao)),
        `mở ${JSON.stringify(sauTaiLai.map((m) => m.mo))} · cao ${JSON.stringify(thuGon.map((m) => m.cao))}→${JSON.stringify(sauTaiLai.map((m) => m.cao))} · ${JSON.stringify(dauVet)}`,
      );
    } finally {
      const conLai = await cdp.chay(
        tab.sessionId,
        `
        const m = await import('/app/main.js');
        for (const id of ${JSON.stringify(idMau)}) await m.store.xoaGhiChu(id);
        return m.store.state.notes.length;
      `,
      );
      ghi(
        'dọn sạch đúng những mẩu giấy bộ đo vừa tạo — kho trở lại y như trước',
        conLai === khoTruoc,
        `kho ${khoTruoc} → ${conLai} (đã tạo ${idMau.length})`,
      );
    }
  }

  // ── Tiêu đề tab, trạng thái rỗng, và NFR-1 (Story 2.6) ──────────────────────────────
  //
  // Vì sao không phải một ca Vitest: `tieu-de.test.js` ghim được phép ĐẾM (đúng hôm nay, bỏ
  // qua hôm qua, không đi theo điều kiện) trên một tài liệu giả, và nó dừng đúng ở đó. Ba
  // câu hỏi còn lại chỉ trình duyệt trả lời được:
  //   - `document.title` THẬT sau khi kho trả lời, và sau một lần chốt thật — nửa mà một
  //     `main.js` quên nối view thứ hai vẫn đi qua toàn bộ suite Vitest mà xanh;
  //   - "vùng lưới không một ký tự nào" đo trên DOM thật, con cháu tính hết — `luoi.test.js`
  //     chỉ nhìn thấy những gì `veMau` dựng, nên một lời nhắn gắn thẳng vào `.luoi` thoát
  //     khỏi nó;
  //   - NFR-1 (mở tab tới gõ được ≤ 2 giây với 2.000 ghi chú) là một phép ĐO thời gian, và
  //     không có cách nào hứa nó bằng văn bản.
  {
    await datKhungNhin(1280, 700);

    const NEN = 'Ghi chú hàng ngày';
    const mongDoi = (n) => (n === 0 ? NEN : `${n} - ${NEN}`);
    /** Số ghi chú của HÔM NAY trong kho thật, hỏi thẳng bộ truy vấn với điều kiện rỗng. */
    const SO_HOM_NAY = `
      const m = await import('/app/main.js');
      const q = await import('/app/core/query.js');
      const t = await import('/app/core/time.js');
      return q.locGhiChu(m.store.state.notes, { keyword: null, date: null }, t.nowIso()).total;
    `;
    /** Đợi tiêu đề đạt giá trị mong đợi — một lượt vẽ chậm phải hỏng thành TIMEOUT, không
     *  thành một phép so sai. Trả về tiêu đề cuối cùng đọc được, để chỗ gọi ghi lại. */
    const doiTieuDe = async (mong) => {
      let thay = null;
      for (let i = 0; i < 50; i += 1) {
        thay = await cdp.chay(tab.sessionId, `return document.title;`);
        if (thay === mong) return thay;
        await nghi(100);
      }
      return thay;
    };

    // Tải lại để đo tiêu đề của một lần mở tab THẬT: khối trên vừa xóa mấy mẩu nó tạo, và
    // phép xóa đó không đi kèm một lượt vẽ nào (không có subscribe trong dự án này).
    await cdp.taiLai(tab.sessionId);
    const homNay = await cdp.chay(tab.sessionId, SO_HOM_NAY);
    {
      const thay = await doiTieuDe(mongDoi(homNay));
      ghi(
        'tiêu đề tab sau khi nạp: đúng dạng `{số} - Ghi chú hàng ngày`, số là ghi chú của hôm nay',
        thay === mongDoi(homNay),
        `mong ${JSON.stringify(mongDoi(homNay))} · thấy ${JSON.stringify(thay)}`,
      );
    }

    // ── Sau MỘT lần chốt thật: con số tăng đúng một, ngay ở lượt vẽ đó ─────────────────
    {
      const CHU_TIEU_DE = 'mẩu đo tiêu đề tab';
      let idDaTao = null;
      // Chụp số bản ghi TRƯỚC khi chốt: phép dọn ở `finally` phải so với một con số đã biết,
      // không phải với chính nó đọc lại lần nữa — so một giá trị với chính nó thì một phép
      // dọn không chạy cũng xanh.
      const khoTruoc = await cdp.chay(
        tab.sessionId,
        `const m = await import('/app/main.js'); return m.store.state.notes.length;`,
      );
      try {
        await cdp.chay(
          tab.sessionId,
          `
          const o = document.querySelector('.o-soan');
          o.value = ${JSON.stringify(CHU_TIEU_DE)};
          o.dispatchEvent(new Event('input', { bubbles: true }));
          o.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
          return true;
        `,
        );
        const thay = await doiTieuDe(mongDoi(homNay + 1));
        idDaTao = await cdp.chay(
          tab.sessionId,
          `
          const m = await import('/app/main.js');
          const n = m.store.state.notes.find((x) => x.text === ${JSON.stringify(CHU_TIEU_DE)});
          return n === undefined ? null : n.id;
        `,
        );
        ghi(
          'chốt một mẩu: tiêu đề tab đổi NGAY ở lượt vẽ đó, số tăng đúng một',
          thay === mongDoi(homNay + 1) && idDaTao !== null,
          `${JSON.stringify(mongDoi(homNay))} → ${JSON.stringify(thay)}`,
        );
      } finally {
        const conLai = await cdp.chay(
          tab.sessionId,
          `
          const m = await import('/app/main.js');
          if (${JSON.stringify(idDaTao)} !== null) await m.store.xoaGhiChu(${JSON.stringify(idDaTao)});
          return m.store.state.notes.length;
        `,
        );
        ghi(
          'dọn mẩu của phép đo tiêu đề — kho trở lại y như trước',
          conLai === khoTruoc,
          `kho ${khoTruoc} → ${conLai} bản ghi`,
        );
      }
    }

    // ── Hôm nay RỖNG: vùng lưới không một ký tự nào, và tiêu đề bỏ hẳn tiền tố số ──────
    //
    // Kho thật trên máy Nam có thể đã mang ghi chú của hôm nay, và bộ đo KHÔNG được xóa
    // chúng đi để dựng một trạng thái rỗng. Nên hai view được nối vào một store rỗng dựng
    // tại chỗ: DOM vẫn là DOM thật, lượt vẽ vẫn là lượt vẽ thật, chỉ dữ liệu là rỗng. Một
    // lần tải lại ngay sau đó trả trang về đúng state của kho.
    {
      const d = await cdp.chay(
        tab.sessionId,
        `
        const l = await import('/app/view/luoi.js');
        const td = await import('/app/view/tieu-de.js');
        const rong = { state: { notes: [], dieuKien: { keyword: null, date: null }, expandedIds: [], editing: { id: null, text: '', seq: {} } } };
        l.noiLuoi(rong, document).ve();
        td.noiTieuDe(rong, document).ve();
        const luoi = document.querySelector('.luoi');
        return {
          soCon: luoi.children.length,
          chu: luoi.textContent,
          soNode: luoi.childNodes.length,
          title: document.title,
        };
      `,
      );
      ghi(
        'hôm nay rỗng: vùng lưới KHÔNG một ký tự nào, không node nào — và tiêu đề bỏ hẳn tiền tố số',
        d.soCon === 0 && d.soNode === 0 && d.chu === '' && d.title === NEN,
        JSON.stringify(d),
      );
      await cdp.taiLai(tab.sessionId);
    }

    // ── NFR-1: 2.000 ghi chú trong máy, mở tab tới gõ được ≤ 2 giây ───────────────────
    //
    // Bơm thẳng vào IndexedDB bằng một giao dịch RIÊNG, không qua `store`: 2.000 lần
    // `chotGhiChu` là 2.000 giao dịch và mất hàng chục giây. Bản ghi mang đúng năm trường
    // của AD-13, `textFolded` gấp bằng chính `core/fold.js` — một bản ghi lệch chuẩn sẽ đo
    // một trang không giống trang thật.
    //
    // Ngày TRẢI RA QUÁ KHỨ, không dồn vào hôm nay: NFR-1 nói "2.000 ghi chú trong máy", và
    // khung nhìn mặc định chỉ vẽ hôm nay — đó chính là tính chất đang được đo (chiều dài
    // lưới không phụ thuộc tổng số ghi chú). Dồn cả 2.000 vào hôm nay là đo một màn hình mà
    // sản phẩm không bao giờ dựng.
    {
      const SO_BAN_GHI = 2000;
      const TIEN_TO = 'thu-nfr-';
      const TRAN_MS = 2000;
      /** `id` dựng bằng một quy tắc, không lấy từ giá trị trả về của phép bơm: nếu phép bơm
       *  ném SAU khi giao dịch đã ghi một phần (hay ném lúc tuần tự hóa 2.000 `id`), một danh
       *  sách rỗng nghĩa là `finally` xóa đúng không bản ghi nào — và 2.000 mẩu rác ở lại
       *  trong kho thật của Nam, đúng thứ khối này nói nó không bao giờ làm. */
      const idNfr = Array.from({ length: SO_BAN_GHI }, (_, i) => `${TIEN_TO}${i}`);
      /** Đếm bằng CHÍNH phép đếm mà `finally` dùng: so một con số của RAM với một con số của
       *  IndexedDB là so hai đại lượng khác nguồn, và chúng chỉ bằng nhau khi không có gì lệch. */
      const DEM_KHO = `
        const kho = await new Promise((ok, no) => {
          const y = indexedDB.open('ghichu');
          y.onsuccess = () => ok(y.result);
          y.onerror = () => no(y.error);
        });
        const con = await new Promise((ok, no) => {
          const gd = kho.transaction(['notes'], 'readonly');
          const y = gd.objectStore('notes').count();
          y.onsuccess = () => ok(y.result);
          y.onerror = () => no(y.error);
        });
        kho.close();
        return con;
      `;
      const khoTruoc = await cdp.chay(tab.sessionId, DEM_KHO);
      try {
        await cdp.chay(
          tab.sessionId,
          `
          const { fold } = await import('/app/core/fold.js');
          const ban = [];
          for (let i = 0; i < ${SO_BAN_GHI}; i += 1) {
            // Trải đều lùi về quá khứ, bắt đầu từ HÔM QUA: không bản ghi nào rơi vào hôm nay.
            const moc = new Date();
            moc.setHours(12, 0, 0, 0);
            moc.setDate(moc.getDate() - 1 - (i % 500));
            const hai = (n) => String(n).padStart(2, '0');
            const ngay = moc.getFullYear() + '-' + hai(moc.getMonth() + 1) + '-' + hai(moc.getDate());
            const gio = hai(Math.floor(i / 500)) + ':' + hai(i % 60) + ':' + hai((i * 7) % 60);
            const createdAt = ngay + 'T' + gio + '+00:00';
            const text = 'ghi chú đo hiệu năng số ' + i;
            ban.push({ id: ${JSON.stringify(TIEN_TO)} + i, createdAt, localDate: ngay, text, textFolded: fold(text) });
          }
          const kho = await new Promise((ok, no) => {
            const y = indexedDB.open('ghichu');
            y.onsuccess = () => ok(y.result);
            y.onerror = () => no(y.error);
          });
          await new Promise((ok, no) => {
            const gd = kho.transaction(['notes'], 'readwrite');
            const st = gd.objectStore('notes');
            for (const b of ban) st.put(b);
            gd.oncomplete = ok;
            gd.onerror = () => no(gd.error);
            gd.onabort = () => no(gd.error);
          });
          kho.close();
          return true;
        `,
        );

        // Đồng hồ chạy TRONG tab và bắt đầu từ lúc điều hướng, không phải từ lúc Node hỏi:
        // mọi vòng lặp thăm dò của bộ đo đều nằm ngoài phép đo. Kịch bản dưới được cài
        // TRƯỚC khi tài liệu tồn tại, nên nó thấy được cả khung hình đầu tiên.
        //
        // "Gõ được" là một câu hỏi về cả hai nửa: con trỏ đã nằm trong ô (thuộc tính
        // `autofocus`, có mặt từ lúc phân tích HTML) VÀ `noiOSoan` đã chạy xong (chỉ lúc đó
        // bộ nghe `input` mới gắn và ký tự mới vào được state).
        //
        // Phép thăm dò là THUẦN ĐỌC: nó không phát một sự kiện nào. `noiOSoan` gọi
        // `caoTheoNoiDung()` ở dòng cuối cùng của nó, và lời gọi đó đặt `style.blockSize` —
        // nên một `blockSize` khác rỗng CHÍNH LÀ bằng chứng bộ nghe đã gắn, đọc được mà không
        // chạm vào gì. Một `input` giả phát ra ở đây thì chạy thẳng vào `datBanNhap(o.value)`
        // với `o.value` còn rỗng (bản nháp chưa kịp đồng bộ về ô), tức bộ đo GHI ĐÈ bản nháp
        // thật của Nam bằng chuỗi rỗng — đúng thứ bộ đo không bao giờ được làm.
        const { identifier } = await cdp.goi(
          'Page.addScriptToEvaluateOnNewDocument',
          {
            source: `
              window.__nfr = null;
              const thu = () => {
                const o = document.querySelector('.o-soan');
                if (o !== null && document.activeElement === o && o.style.blockSize !== '') {
                  window.__nfr = performance.now();
                  return;
                }
                requestAnimationFrame(thu);
              };
              requestAnimationFrame(thu);
            `,
          },
          tab.sessionId,
        );
        let moc = null;
        try {
          await cdp.taiLai(tab.sessionId);
          for (let i = 0; i < 100; i += 1) {
            moc = await cdp.chay(tab.sessionId, `return window.__nfr;`);
            if (moc !== null) break;
            await nghi(50);
          }
        } finally {
          // Gỡ trong `finally`: kịch bản này chạy lại ở MỌI lần tải trang sau đó, kể cả các
          // khối đo bên dưới. Một lần ném ở giữa mà không gỡ là để nó sống hết cả lượt chạy.
          await cdp.goi('Page.removeScriptToEvaluateOnNewDocument', { identifier }, tab.sessionId);
        }
        // "Gõ được" tới TRƯỚC khi `notes` nạp xong — kho đọc bất đồng bộ, và ô soạn không chờ
        // nó. Đọc ngay ở đây là đua với chính app: máy nhanh thì thấy `0` dù kho đủ 2.000. Chờ
        // có hạn cho state nạp đủ; hạn là để một lần nạp hỏng vẫn đỏ, không treo cả lượt chạy.
        let trongKho = 0;
        for (let i = 0; i < 100; i += 1) {
          trongKho = await cdp.chay(
            tab.sessionId,
            `const m = await import('/app/main.js'); return m.store.state.notes.length;`,
          );
          if (trongKho >= SO_BAN_GHI) break;
          await nghi(50);
        }
        ghi(
          `NFR-1: ${SO_BAN_GHI} ghi chú trong kho, mở tab tới gõ được ≤ ${TRAN_MS}ms`,
          moc !== null && moc <= TRAN_MS && trongKho >= SO_BAN_GHI,
          `${moc === null ? 'không đo được' : `${Math.round(moc)}ms`} · kho ${trongKho} bản ghi`,
        );
      } finally {
        // Dọn bằng một giao dịch RIÊNG và theo đúng `id` đã bơm — cùng luật với hai khối
        // trên: kho thật của Nam phải trở lại y như trước, kể cả khi phép đo ném giữa chừng.
        const conLai = await cdp.chay(
          tab.sessionId,
          `
          const kho = await new Promise((ok, no) => {
            const y = indexedDB.open('ghichu');
            y.onsuccess = () => ok(y.result);
            y.onerror = () => no(y.error);
          });
          await new Promise((ok, no) => {
            const gd = kho.transaction(['notes'], 'readwrite');
            const st = gd.objectStore('notes');
            for (const id of ${JSON.stringify(idNfr)}) st.delete(id);
            gd.oncomplete = ok;
            gd.onerror = () => no(gd.error);
            gd.onabort = () => no(gd.error);
          });
          const con = await new Promise((ok, no) => {
            const gd = kho.transaction(['notes'], 'readonly');
            const y = gd.objectStore('notes').count();
            y.onsuccess = () => ok(y.result);
            y.onerror = () => no(y.error);
          });
          kho.close();
          return con;
        `,
        );
        ghi(
          'dọn sạch đúng 2.000 bản ghi bộ đo vừa bơm — kho trở lại y như trước',
          conLai === khoTruoc,
          `kho ${khoTruoc} → ${conLai} (đã bơm ${idNfr.length})`,
        );
        // Trả trang về đúng kho đã dọn, để các khối đo sau không thừa hưởng 2.000 bản ghi.
        await cdp.taiLai(tab.sessionId);
      }
    }
  }

  // ── Thứ tự Tab và focus ring (Story 3.2) ────────────────────────────────────────────
  //
  // Vì sao KHÔNG phải một ca Vitest: `test/focus-va-tab.test.js` quét được NGUỒN — không
  // `tabindex` dương, không listener bàn phím cấp `document`/`window`, mọi điều khiển đều có
  // một luật `:focus-visible` phủ nó — và nó dừng đúng ở đó. Ba câu hỏi còn lại chỉ một trình
  // duyệt thật trả lời được, và `phanTuGia()` của các test view thì không có `focus()`,
  // `tabIndex`, `matches()` lẫn layout:
  //   - "`Tab` THẬT SỰ đi đâu" — thứ tự tiêu điểm là kết quả của cây DOM ĐÃ DỰNG cộng luật
  //     của chính trình duyệt, không phải của một thuộc tính nào đọc được bằng mắt;
  //   - "vòng sáng có HIỆN ra không, và có lấy màu từ `--focus` không" — `:focus-visible` chỉ
  //     khớp khi tiêu điểm tới bằng BÀN PHÍM, nên nó phải được gõ bằng phím thật;
  //   - "click chuột thì KHÔNG có vòng" — nửa mà một `:focus` trần làm sai trong im lặng.
  //
  // Phím gửi qua `Input.dispatchKeyEvent`, không qua một `KeyboardEvent` tổng hợp: một sự kiện
  // do JS phát KHÔNG di chuyển tiêu điểm và KHÔNG bật trạng thái "lần tương tác cuối là bàn
  // phím" — tức nó đo đúng không gì cả.
  {
    await datKhungNhin(1280, 700);
    await cdp.taiLai(tab.sessionId);
    // Tab headless không "được kích hoạt" theo nghĩa của hệ điều hành, và khi đó cả phép gửi
    // phím lẫn `:focus-visible` đều im lặng không có tác dụng. Bật giả lập tiêu điểm là điều
    // kiện của cả khối, không phải một tinh chỉnh.
    await cdp.goi('Emulation.setFocusEmulationEnabled', { enabled: true }, tab.sessionId);

    /** Gõ `Tab` (hoặc `Shift+Tab`) THẬT. `modifiers: 8` là Shift trong giao thức CDP. */
    const nhanTab = async (nguoc = false) => {
      for (const type of ['rawKeyDown', 'keyUp']) {
        await cdp.goi(
          'Input.dispatchKeyEvent',
          {
            type,
            key: 'Tab',
            code: 'Tab',
            windowsVirtualKeyCode: 9,
            nativeVirtualKeyCode: 9,
            modifiers: nguoc ? 8 : 0,
          },
          tab.sessionId,
        );
      }
      await nghi(30);
    };

    /** Click THẬT bằng chuột — cùng lý do với phím: một `MouseEvent` tổng hợp không đổi được
     *  "lần tương tác cuối là chuột", tức không đo được dòng "focus bằng chuột → không ring". */
    const nhanChuot = async (x, y) => {
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cdp.goi(
          'Input.dispatchMouseEvent',
          { type, x, y, button: 'left', clickCount: 1, buttons: type === 'mousePressed' ? 1 : 0 },
          tab.sessionId,
        );
      }
      await nghi(50);
    };


    /** Phần tử đang nhận bàn phím: tên, có khớp `:focus-visible` không, vòng sáng, và tọa độ. */
    const DO_DIEM_DUNG = `
      ${HAM_TEN}
      const el = document.activeElement;
      if (el === null) return null;
      const r = el.getBoundingClientRect();
      const ct = chiTietVong(el);
      const nen = nenSau(el);
      return {
        ten: ten(el),
        khoa: khoa(el),
        khop: el.matches(':focus-visible'),
        vong: vong(el),
        ct,
        nen,
        tyLe: Math.round(tuongPhan(ct.mau, nen) * 100) / 100,
        trai: Math.round(r.left),
        dinh: Math.round(r.top),
      };
    `;

    /** Vòng sáng của MỌI điều khiển lúc KHÔNG có tiêu điểm — mẫu nền để so trước/sau. */
    const DO_NEN = `
      ${HAM_TEN}
      if (document.activeElement !== null) document.activeElement.blur();
      // Khóa theo THỨ TỰ DOM, không theo tên: trang có hai button.chan-link và ba div.o-luoi,
      // nên một map khóa bằng tên gộp chúng lại và phép so trước/sau đối chiếu nhầm phần tử.
      const ra = {};
      for (const el of document.querySelectorAll(CHON_DIEU_KHIEN)) ra[khoa(el)] = vong(el);
      return ra;
    `;

    /** Màu THẬT của `--focus` ở theme đang bật, đọc qua một phần tử tạm — `getPropertyValue`
     *  trả về đúng chuỗi hex đã khai, còn `getComputedStyle` của vòng sáng trả về `rgb(…)`. */
    const DO_MAU_FOCUS = `
      const t = document.createElement('span');
      t.style.color = 'var(--focus)';
      document.body.append(t);
      const c = getComputedStyle(t).color;
      t.remove();
      return c;
    `;

    // Ba mẩu BỊ CẮT, dựng qua đúng view thật với một store GIẢ — không một phép ghi nào xuống
    // IndexedDB, nên khối này không cần (và không có) một bước dọn kho như các khối trên. Cùng
    // khuôn với ca "hôm nay rỗng" ở Story 2.6.
    const BOM_MAU_CAT = `
      const l = await import('/app/view/luoi.js');
      const dai = (t) => Array.from({ length: 9 }, (_, i) => t + ' dòng ' + i).join('\\n');
      const notes = ['A', 'B', 'C'].map((t, i) => ({
        id: 'thu-focus-' + i,
        createdAt: '2026-01-01T0' + (9 - i) + ':00:00+00:00',
        localDate: '2026-01-01',
        text: dai(t),
        textFolded: '',
      }));
      const gia = {
        state: { notes, dieuKien: { keyword: null, date: null }, expandedIds: [], editing: { id: null, text: '', seq: {} } },
        batTatMoRong() {},
      };
      l.noiLuoi(gia, document, () => '2026-01-01T12:00:00+00:00').ve();
      return [...document.querySelectorAll('.luoi > *')].map((x) => x.getAttribute('tabindex'));
    `;

    // Đợi lượt vẽ ĐẦU TIÊN của chính app xong hẳn rồi mới bơm. `cdp.doiSan` chỉ đợi `main.js`
    // nạp xong; `khoiDong().then(veTatCa)` là một lời hứa đọc IndexedDB và nó kết thúc SAU đó.
    // Bơm trước lúc ấy là thua một cuộc đua: `veTatCa` chạy sau sẽ `replaceChildren` lưới bằng
    // state thật (rỗng) và xóa sạch ba mẩu vừa bơm — đúng kiểu đỏ-không-đều không do sản phẩm.
    await nghi(400);
    const tabMau = await cdp.chay(tab.sessionId, BOM_MAU_CAT);
    ghi(
      'ba mẩu BỊ CẮT trên lưới, và cả ba vào thứ tự Tab bằng tabindex="0"',
      tabMau.length === 3 && tabMau.every((t) => t === '0'),
      JSON.stringify(tabMau),
    );

    /** Dãy điểm dừng mà `Tab` (hoặc `Shift+Tab`) đi qua, `soBuoc` bước. */
    const diTab = async (soBuoc, nguoc = false) => {
      const day = [];
      for (let i = 0; i < soBuoc; i += 1) {
        await nhanTab(nguoc);
        day.push(await cdp.chay(tab.sessionId, DO_DIEM_DUNG));
      }
      return day;
    };

    const DAT_TIEU_DIEM_O_SOAN = `document.querySelector('.o-soan').focus(); return true;`;

    // Dãy nghiệm thu của khung nhìn MẶC ĐỊNH. `về hôm nay` (Story 6.3) chỉ có khi có điều kiện,
    // nên nó không ở trong dãy này — khối ngay sau dãy đo nó riêng.
    //
    // Nút `xóa` gia nhập ở Story 5.3, và với nó thứ tự trong MỖI mẩu là THÂN rồi NÚT XÓA — đúng
    // thứ tự DOM, không một `tabindex` nào nắn lại. Trước đó nó mang `tabindex="-1"` vì nó chưa
    // có hành vi nào; nay nó mở hộp thoại xác nhận, và đó là đường xóa DUY NHẤT của sản phẩm.
    const THU_TU = [
      'input.o-nhap.o-tim',
      'input.o-nhap.o-ngay',
      // Story 6.2: nút lịch ngay sau ô ngày; picker gốc `.o-ngay-chon` ra khỏi Tab.
      'button.nut-lich',
      'div.o-luoi',
      'button.mau-xoa',
      'div.o-luoi',
      'button.mau-xoa',
      'div.o-luoi',
      'button.mau-xoa',
      'button.chan-link',
      'button.chan-link',
      'button.nut-theme',
    ];

    {
      const dau = await cdp.chay(tab.sessionId, DO_DIEM_DUNG);
      const day = await diTab(THU_TU.length);
      ghi(
        'Tab liên tiếp từ đầu trang: đúng dãy của I/O Matrix, và không một điểm dừng lạ nào',
        dau.ten === 'textarea.o-soan' &&
          JSON.stringify(day.map((d) => d.ten)) === JSON.stringify(THU_TU),
        `bắt đầu ${dau.ten} → ${JSON.stringify(day.map((d) => d.ten))}`,
      );

      // Thứ tự Tab qua lưới TRÙNG thứ tự trái-sang-phải trên màn hình. Đây là vế mà một
      // `order` hay một `*-reverse` thêm vào CSS phá trong im lặng: mắt đi một đường, bàn phím
      // đi một đường khác.
      const mau = day.filter((d) => d.ten === 'div.o-luoi');
      const traiTang = mau.every((m, i) => i === 0 || m.trai > mau[i - 1].trai);
      const cungHang = mau.every((m) => m.dinh === mau[0].dinh);
      ghi(
        'thứ tự Tab qua lưới trùng thứ tự trái-sang-phải đo bằng getBoundingClientRect',
        mau.length === 3 && traiTang && cungHang,
        `trái=${JSON.stringify(mau.map((m) => m.trai))} đỉnh=${JSON.stringify(mau.map((m) => m.dinh))}`,
      );

      // Shift+Tab đi đúng đường về. Đứng ở điểm dừng cuối, nên bước đầu tiên ngược lại rơi vào
      // áp chót — dãy mong đợi là dãy đảo, bỏ phần tử cuối, rồi cộng `o-soan` ở đáy.
      const nguoc = await diTab(THU_TU.length, true);
      const mongNguoc = [...THU_TU].reverse().slice(1).concat('textarea.o-soan');
      ghi(
        'Shift+Tab cho ra đúng dãy NGƯỢC — bàn phím quay lại đúng đường nó đã đi',
        JSON.stringify(nguoc.map((d) => d.ten)) === JSON.stringify(mongNguoc),
        `${JSON.stringify(nguoc.map((d) => d.ten))}`,
      );
    }

    // ── Story 6.3: có điều kiện thì `về hôm nay` đứng sau nút lịch, trước mẩu đầu ─────────
    //
    // Điều kiện bật qua ĐÚNG đường của người dùng (gõ vào `#o-tim`), rồi bơm lại ba mẩu giả vào
    // lưới — lượt vẽ thật vừa thay lưới bằng tập khớp (rỗng) của kho thật. Hàng chip không bị
    // lượt bơm đó chạm tới, nên nó vẫn là của app thật.
    {
      await cdp.chay(
        tab.sessionId,
        `const o = document.getElementById('o-tim'); o.value = 'zzz-thu-chip';
         o.dispatchEvent(new Event('input', { bubbles: true })); return true;`,
      );
      await nghi(100);
      await cdp.chay(tab.sessionId, BOM_MAU_CAT);
      const hang = await cdp.chay(
        tab.sessionId,
        `const h = document.querySelector('.hang-chip');
         return { an: h.hidden, chu: [...h.children].map((c) => c.textContent),
                  goiY: document.getElementById('o-soan').getAttribute('placeholder') };`,
      );
      ghi(
        'có điều kiện: hàng chip hiện `zzz-thu-chip · 0 ghi chú · về hôm nay`, ô soạn mang placeholder cảnh báo',
        hang.an === false &&
          JSON.stringify(hang.chu) === JSON.stringify(['zzz-thu-chip', '0 ghi chú', 'về hôm nay']) &&
          hang.goiY === 'gõ vào đây sẽ bỏ mọi điều kiện lọc',
        JSON.stringify(hang),
      );
      await cdp.chay(tab.sessionId, `document.querySelector('.nut-lich').focus(); return true;`);
      const day = await diTab(2);
      ghi(
        'Tab từ nút lịch khi có điều kiện: `về hôm nay` rồi mới tới mẩu đầu',
        JSON.stringify(day.map((d) => d.ten)) === JSON.stringify(['button.ve-hom-nay', 'div.o-luoi']),
        JSON.stringify(day.map((d) => d.ten)),
      );
      // Ngày gõ dở + rời ô: lỗi ngày bật, và chữ đó KHÔNG ở trong state — `về hôm nay` phải
      // tự xóa nó (`khayTim.xoaNhap()`).
      const loiTruoc = await cdp.chay(
        tab.sessionId,
        `const n = document.getElementById('o-ngay'); n.value = '03/09/20';
         n.dispatchEvent(new Event('input', { bubbles: true }));
         n.dispatchEvent(new Event('blur'));
         document.querySelector('.ve-hom-nay').focus();
         return document.getElementById('o-ngay-loi').hidden;`,
      );
      ghi('ngày gõ dở + rời ô: chữ lỗi ngày hiện trước khi về hôm nay', loiTruoc === false, String(loiTruoc));
      for (const type of ['keyDown', 'keyUp']) {
        await cdp.goi(
          'Input.dispatchKeyEvent',
          {
            type,
            key: 'Enter',
            code: 'Enter',
            text: type === 'keyDown' ? '\r' : undefined,
            windowsVirtualKeyCode: 13,
            nativeVirtualKeyCode: 13,
          },
          tab.sessionId,
        );
      }
      await nghi(120);
      const sau = await cdp.chay(
        tab.sessionId,
        `return { an: document.querySelector('.hang-chip').hidden,
                  tim: document.getElementById('o-tim').value,
                  ngay: document.getElementById('o-ngay').value,
                  loiAn: document.getElementById('o-ngay-loi').hidden,
                  dung: document.activeElement && document.activeElement.id,
                  goiY: document.getElementById('o-soan').hasAttribute('placeholder') };`,
      );
      ghi(
        'Enter trên `về hôm nay`: hàng chip biến mất, ô tìm rỗng, placeholder gỡ, tiêu điểm ở #o-soan',
        sau.an === true && sau.tim === '' && sau.ngay === '' && sau.loiAn === true && sau.dung === 'o-soan' && sau.goiY === false,
        JSON.stringify(sau),
      );
      // Trả lưới về ba mẩu giả cho các khối đo vòng sáng bên dưới.
      await cdp.chay(tab.sessionId, BOM_MAU_CAT);
    }

    // ── Vòng sáng: hiện ra, khác lúc nghỉ, và lấy màu từ `--focus` — ở CẢ HAI theme ──────
    {
      const doMotTheme = async (theme) => {
        await cdp.chay(
          tab.sessionId,
          `document.documentElement.dataset.theme = ${JSON.stringify(theme)}; return true;`,
        );
        await nghi(100);
        const nen = await cdp.chay(tab.sessionId, DO_NEN);
        const mauFocus = await cdp.chay(tab.sessionId, DO_MAU_FOCUS);
        await cdp.chay(tab.sessionId, DAT_TIEU_DIEM_O_SOAN);
        const day = await diTab(THU_TU.length);
        const xau = day.filter((d) => {
          const daDoi = d.vong !== nen[d.khoa];
          // Khẳng định trên ĐÚNG thuộc tính outline, không trên chuỗi nối năm thứ: một màu
          // `--focus` sót ở `border-top-color` không được phép cứu một outline đã bị gỡ.
          const coOutline = d.ct.kieu !== 'none' && d.ct.mau === mauFocus;
          return !(d.khop && daDoi && coOutline);
        });
        return { mauFocus, xau, day };
      };

      for (const theme of ['light', 'dark']) {
        const { mauFocus, xau, day } = await doMotTheme(theme);
        ghi(
          `theme ${theme}: mỗi điểm dừng khớp :focus-visible, vòng sáng ĐỔI so với lúc nghỉ, và outline màu ${mauFocus}`,
          day.length === THU_TU.length && xau.length === 0,
          xau.length === 0
            ? `${day.length} điểm đo, tất cả có outline lấy từ --focus`
            : `hỏng: ${JSON.stringify(xau.map((d) => [d.ten, d.khop, d.ct]))}`,
        );

        // ── Tương phản ≥ 3:1, đo THẬT ────────────────────────────────────────────────────
        //
        // Đây là con số AC đòi và chú thích `app/style.css` khẳng định, và cho tới giờ nó là thứ
        // duy nhất máy tính được mà lại bị đẩy cho mắt người ở README. `.o-soan` đi kèm vì vòng
        // của nó là `color-mix(… 28%, transparent)` — chỗ khả nghi nhất của cả trang.
        const loang = day
          .map((d) => [d.ten, d.tyLe])
          .filter(([, t]) => !(t >= 3));
        ghi(
          `theme ${theme}: vòng sáng tương phản ≥ 3:1 với nền thật ở MỌI điểm dừng`,
          day.length > 0 && loang.length === 0,
          loang.length === 0
            ? `thấp nhất ${Math.min(...day.map((d) => d.tyLe))}:1 trên ${day.length} điểm đo`
            : `dưới ngưỡng: ${JSON.stringify(loang)}`,
        );

        const oSoan = await cdp.chay(
          tab.sessionId,
          `
          ${HAM_TEN}
          const el = document.querySelector('.o-soan');
          el.focus();
          const s = getComputedStyle(el);
          const nen = nenSau(el);
          return {
            khop: el.matches(':focus-visible'),
            vien: s.borderTopColor,
            nen,
            tyLe: Math.round(tuongPhan(s.borderTopColor, nen) * 100) / 100,
          };
        `,
        );
        ghi(
          `theme ${theme}: vòng sáng RIÊNG của ô soạn thảo cũng ≥ 3:1 — chất liệu khác, ngưỡng không khác`,
          oSoan.khop && oSoan.tyLe >= 3,
          `viền ${oSoan.vien} trên ${oSoan.nen} = ${oSoan.tyLe}:1`,
        );
      }
      await cdp.chay(tab.sessionId, `document.documentElement.dataset.theme = 'light'; return true;`);
    }

    // ── Dải băng: `✕` là điểm dừng ĐẦU TIÊN, và chỉ khi hàng đóng được ───────────────────
    //
    // Nội dung bơm từ NGOÀI mã sản phẩm, đúng khuôn `BOM_DAI_BANG`: câu hỏi ở đây là về thứ tự
    // tiêu điểm, không về đường phát thông báo.
    {
      const BOM = (coNutDong) => `
        const b = document.querySelector('.dai-bang');
        const s = document.createElement('span');
        s.className = 'dai-bang-chu';
        s.textContent = 'bộ đo thứ tự Tab';
        const con = [s];
        if (${coNutDong ? 'true' : 'false'}) {
          const n = document.createElement('button');
          n.className = 'dai-bang-dong';
          n.type = 'button';
          n.textContent = '✕';
          n.setAttribute('aria-label', 'đóng thông báo');
          con.push(n);
        }
        b.replaceChildren(...con);
        return b.children.length;
      `;
      const TRONG_BANG = `
        const el = document.activeElement;
        return el !== null && document.querySelector('.dai-bang').contains(el);
      `;

      await cdp.chay(tab.sessionId, BOM(true));
      await cdp.chay(tab.sessionId, DAT_TIEU_DIEM_O_SOAN);
      await nhanTab(true);
      const dungO = await cdp.chay(tab.sessionId, DO_DIEM_DUNG);
      const trongBang = await cdp.chay(tab.sessionId, TRONG_BANG);
      ghi(
        'dải băng ĐÓNG ĐƯỢC: `✕` là điểm dừng đầu tiên của trang, ngay trước ô soạn thảo',
        trongBang && dungO.ten === 'button.dai-bang-dong' && dungO.khop,
        `${JSON.stringify({ ten: dungO.ten, khop: dungO.khop, tyLe: dungO.tyLe })}`,
      );

      // Dãy TIẾN đầy đủ khi dải băng đang hiện. Một bước `Shift+Tab` chỉ chứng minh `✕` đứng
      // trước ô soạn thảo; nó KHÔNG chứng minh "thứ tự còn lại y nguyên", mà đó mới là vế AC đòi
      // ở trạng thái thứ hai này.
      {
        await cdp.chay(
          tab.sessionId,
          `document.querySelector('.dai-bang-dong').focus(); return true;`,
        );
        const day = await diTab(THU_TU.length + 1);
        const mong = ['textarea.o-soan', ...THU_TU];
        ghi(
          'dải băng ĐÓNG ĐƯỢC: dãy Tab TIẾN đầy đủ — `✕` rồi y nguyên thứ tự của trạng thái kia',
          JSON.stringify(day.map((d) => d.ten)) === JSON.stringify(mong),
          `từ ✕ → ${JSON.stringify(day.map((d) => d.ten))}`,
        );
      }

      await cdp.chay(tab.sessionId, BOM(false));
      await cdp.chay(tab.sessionId, DAT_TIEU_DIEM_O_SOAN);
      await nhanTab(true);
      const trongBangSau = await cdp.chay(tab.sessionId, TRONG_BANG);
      ghi(
        'dải băng KHÔNG đóng được: không thêm một điểm dừng nào ở đỉnh trang',
        trongBangSau === false,
        `Shift+Tab từ ô soạn thảo dừng trong dải băng = ${trongBangSau}`,
      );
      await cdp.chay(
        tab.sessionId,
        `document.querySelector('.dai-bang').replaceChildren(); return true;`,
      );
    }

    // ── Focus bằng CHUỘT: không vòng sáng ────────────────────────────────────────────────
    //
    // Vòng sáng là bản đồ BÀN PHÍM. Một vòng nhảy ra sau mỗi cú chuột là nhiễu thị giác, và nó
    // là đúng cái mà `:focus` trần làm còn `:focus-visible` thì không.
    {
      const nen = await cdp.chay(tab.sessionId, DO_NEN);
      // Hàng I/O Matrix nói `.chan-link` **và** mẩu giấy. Mẩu giấy là một `<div tabindex="0">` —
      // đúng loại phần tử dễ bật vòng sáng khi click nhất, nên bỏ nó ra là bỏ đúng nửa khó.
      // `songSot` = phần tử còn nguyên sau cú click. Mẩu giấy thì KHÔNG: click nó bật mở rộng,
      // `luoi.js` vẽ lại toàn phần và phần tử vừa bấm bị thay bằng một phần tử khác — nên hỏi
      // "nó có đang nhận tiêu điểm không" là hỏi sai. Câu đúng cho nó là câu rộng hơn, và cũng
      // là câu AC thật sự quan tâm: sau một cú chuột, CẢ TRANG không một vòng sáng nào.
      for (const { chon, songSot } of [
        { chon: '.chan-link', songSot: true },
        { chon: '.o-luoi[tabindex]', songSot: false },
      ]) {
        const diem = await cdp.chay(
          tab.sessionId,
          `
          const r = document.querySelector(${JSON.stringify(chon)}).getBoundingClientRect();
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
        `,
        );
        await nhanChuot(diem.x, diem.y);
        const d = await cdp.chay(
          tab.sessionId,
          `
          ${HAM_TEN}
          const el = document.querySelector(${JSON.stringify(chon)});
          const r = el.getBoundingClientRect();
          return {
            laDangNhan: document.activeElement === el,
            // Cú click có TRÚNG không — thay cho laDangNhan ở phần tử bị vẽ lại. Thiếu một
            // phép kiểm kiểu này thì một cú click trượt toạ độ cũng cho ca xanh.
            trung:
              ${diem.x} >= Math.floor(r.left) && ${diem.x} <= Math.ceil(r.right) &&
              ${diem.y} >= Math.floor(r.top) && ${diem.y} <= Math.ceil(r.bottom),
            khop: el.matches(':focus-visible'),
            // Từ Story 5.1 một cú click vào mẩu ngắn mở ô sửa và đưa tiêu điểm vào đó. Một
            // textarea đang nhận tiêu điểm LUÔN khớp :focus-visible theo chính định nghĩa của
            // trình duyệt (ô nhập chữ luôn hiện vòng sáng, bất kể chuột hay bàn phím), và đó là
            // hành vi ĐÚNG — con trỏ nháy ở đâu thì vòng sáng ở đó. Nên phép đếm bỏ riêng ô sửa
            // ra; vế đang hỏi vẫn nguyên: phần tử VỪA BẤM không được sáng lên.
            sangCaTrang: [...document.querySelectorAll(':focus-visible')].filter(
              (x) => !x.classList.contains('mau-sua'),
            ).length,
            vong: vong(el),
            khoa: khoa(el),
          };
        `,
        );
        ghi(
          `click chuột vào \`${chon}\`: KHÔNG vòng sáng — ring không phải phản hồi chuột`,
          (songSot ? d.laDangNhan : d.trung) &&
            !d.khop &&
            d.sangCaTrang === 0 &&
            d.vong === nen[d.khoa],
          JSON.stringify(d),
        );
      }
    }

    // Tắt lại giả lập tiêu điểm: nó là điều kiện của RIÊNG khối này, và để nó bật sang các khối
    // sau là đổi âm thầm môi trường đo của chúng.
    await cdp.goi('Emulation.setFocusEmulationEnabled', { enabled: false }, tab.sessionId);
    // Trả trang về trạng thái sạch: khối dưới đo màu trên một trang không có mẩu bơm tay nào.
    await cdp.taiLai(tab.sessionId);
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
    // Bỏ focus khỏi ô soạn thảo trước khi đo màu: còn focus thì `box-shadow` đo được là bóng
    // lõm CỘNG ring, và phép đo này hỏi về vật liệu lúc nghỉ.
    await cdp.chay(tab.sessionId, `document.querySelector('.o-soan').blur(); return true;`);
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
        // Bóng lõm là token thứ 13 đổi theo theme (Story 2.2): bóng nâu trên nền tối không
        // đọc được, nên bản dark có giá trị riêng. Nó đứng đúng ở đây vì phép so hai bên là
        // cách duy nhất bắt được một khối dark thiếu dòng ghi đè.
        'bóng lõm ô soạn thảo': doc('.o-soan', 'boxShadow'),
        'chữ dòng nhắc': doc('.o-soan-nhac', 'color'),
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
    // Bóng lõm phải THẤY ĐƯỢC ở cả hai theme, không chỉ "khác nhau": một `box-shadow: none`
    // ở cả hai bên cũng đổi được nếu ai đó đổi nó theo theme, và nó vẫn là không có bóng.
    {
      const sangCoBong = sang['bóng lõm ô soạn thảo'];
      const toiCoBong = toi['bóng lõm ô soạn thảo'];
      ghi(
        'bóng lõm ô soạn thảo khác rỗng ở CẢ HAI theme, và là bóng inset',
        sangCoBong !== 'none' &&
          toiCoBong !== 'none' &&
          sangCoBong.includes('inset') &&
          toiCoBong.includes('inset'),
        `light=${sangCoBong} · dark=${toiCoBong}`,
      );
    }
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
    // Story 6.2: lỗi ô ngày — viền là `--danger` và chữ lỗi hiện, ở CẢ HAI theme.
    for (const theme of ['light', 'dark']) {
      const loi = await cdp.chay(
        tab.sessionId,
        `document.documentElement.dataset.theme = ${JSON.stringify(theme)};
         const boc = document.querySelector('.o-ngay-boc');
         const chu = document.getElementById('o-ngay-loi');
         boc.classList.add('o-ngay-loi'); chu.hidden = false;
         const tam = document.createElement('span');
         tam.style.color = 'var(--danger)'; document.body.append(tam);
         const ra = { vien: getComputedStyle(boc).borderTopColor, danger: getComputedStyle(tam).color,
                      thay: chu.getBoundingClientRect().height > 0 };
         tam.remove(); boc.classList.remove('o-ngay-loi'); chu.hidden = true;
         return ra;`,
      );
      ghi(
        `lỗi ô ngày (${theme}): viền --danger và chữ lỗi hiện`,
        loi.vien === loi.danger && loi.thay,
        `viền=${loi.vien} danger=${loi.danger} chữ=${loi.thay}`,
      );
    }
  }

  // ── Nút theme: lật bằng chuột và bằng `Enter`, rồi đo tương phản THẬT (Story 3.3) ─────
  //
  // Vì sao KHÔNG phải một ca Vitest: `test/theme.test.js` tính tỉ lệ từ hai khối token, và nó
  // dừng đúng ở đó. Hai câu hỏi còn lại chỉ trình duyệt thật trả lời được:
  //   - "một cú bấm THẬT có lật bảng màu không" — `click` tổng hợp không đi qua cùng đường với
  //     một cú chuột thật, và `Enter` trên một `<button>` là hành vi của chính trình duyệt;
  //   - "cặp chữ/nền nào THẬT SỰ xuất hiện trên màn hình" — nền của một phần tử đến từ tổ tiên
  //     gần nhất có nền đục, tức từ cây DOM đã dựng. Bảng `NEN_CUA` của Vitest là một lời khai;
  //     đây là phép đối chiếu nó với sự thật.
  //
  // Dùng lại `tuongPhan` trong `HAM_TEN` — công thức WCAG đã có ở file này, và không có công
  // thức thứ hai nào được viết ra.
  {
    await datKhungNhin(1280, 700);
    // Khởi điểm XÁC ĐỊNH: ghi `light` xuống kho rồi tải lại, nên script nội tuyến trong `<head>`
    // đặt `data-theme="light"` bất kể hệ điều hành của máy chạy thử đang ở bảng nào.
    await cdp.chay(tab.sessionId, `localStorage.setItem('ghichu.theme', 'light'); return true;`);
    await cdp.taiLai(tab.sessionId);
    await cdp.goi('Emulation.setFocusEmulationEnabled', { enabled: true }, tab.sessionId);
    // Đợi `main.js` nối xong view: bấm trước lúc ấy là bấm vào một nút chưa có bộ nghe nào.
    await nghi(400);

    /** Trạng thái theme đọc từ ba nguồn cùng lúc — chúng phải nói cùng một câu. */
    const DOC_THEME = `
      return {
        thuocTinh: document.documentElement.getAttribute('data-theme'),
        khoa: localStorage.getItem('ghichu.theme'),
        nhan: document.querySelector('.nut-theme').textContent.trim(),
      };
    `;

    const TAM_NUT = `
      const r = document.querySelector('.nut-theme').getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    `;

    /** Gõ `Enter` THẬT lên phần tử đang có tiêu điểm. */
    const nhanEnter = async () => {
      for (const type of ['keyDown', 'keyUp']) {
        await cdp.goi(
          'Input.dispatchKeyEvent',
          {
            type,
            key: 'Enter',
            code: 'Enter',
            text: type === 'keyDown' ? '\r' : undefined,
            windowsVirtualKeyCode: 13,
            nativeVirtualKeyCode: 13,
          },
          tab.sessionId,
        );
      }
      await nghi(120);
    };

    const nhanChuotTai = async (x, y) => {
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cdp.goi(
          'Input.dispatchMouseEvent',
          { type, x, y, button: 'left', clickCount: 1, buttons: type === 'mousePressed' ? 1 : 0 },
          tab.sessionId,
        );
      }
      await nghi(120);
    };

    const truoc = await cdp.chay(tab.sessionId, DOC_THEME);
    ghi(
      'khởi điểm: lựa chọn đã lưu là `light`, và nhãn nút đọc `nền tối`',
      truoc.thuocTinh === 'light' && truoc.nhan === 'nền tối',
      JSON.stringify(truoc),
    );

    const tam = await cdp.chay(tab.sessionId, TAM_NUT);
    await nhanChuotTai(tam.x, tam.y);
    const sauChuot = await cdp.chay(tab.sessionId, DOC_THEME);
    ghi(
      'bấm CHUỘT thật: data-theme, khóa `ghichu.theme` và nhãn nút đổi cùng một lúc',
      sauChuot.thuocTinh === 'dark' && sauChuot.khoa === 'dark' && sauChuot.nhan === 'nền sáng',
      JSON.stringify(sauChuot),
    );

    // Nửa ÂM TÍNH của cùng hàng I/O Matrix, và nó phải hỏi ngay tại đây chứ không ở khối vòng
    // sáng bên trên: một cú click vào nút này LẬT cả bảng màu, nên chen nó vào vòng lặp kia là
    // đổi âm thầm môi trường đo của mọi ca sau. Cú chuột vừa rồi đã thật; câu còn lại chỉ là
    // "nó có để lại vòng sáng nào không".
    const vongSauChuot = await cdp.chay(
      tab.sessionId,
      `
      const nut = document.querySelector('.nut-theme');
      return {
        nutSang: nut.matches(':focus-visible'),
        sangCaTrang: document.querySelectorAll(':focus-visible').length,
      };
    `,
    );
    ghi(
      'bấm CHUỘT vào nút theme: KHÔNG vòng sáng nào — vòng là bản đồ bàn phím',
      vongSauChuot.nutSang === false && vongSauChuot.sangCaTrang === 0,
      JSON.stringify(vongSauChuot),
    );

    await cdp.chay(tab.sessionId, `document.querySelector('.nut-theme').focus(); return true;`);
    await nhanEnter();
    const sauEnter = await cdp.chay(tab.sessionId, DOC_THEME);
    ghi(
      'gõ `Enter` trên nút cho ra ĐÚNG cùng kết quả với chuột — bàn phím không phải đường phụ',
      sauEnter.thuocTinh === 'light' && sauEnter.khoa === 'light' && sauEnter.nhan === 'nền tối',
      JSON.stringify(sauEnter),
    );

    // ── Tương phản ≥ 4.5:1 của MỌI phần tử mang chữ, ở cả hai theme ──────────────────────
    //
    // "Mang chữ" đo theo NÚT VĂN BẢN CON TRỰC TIẾP, không theo `textContent`: `textContent` của
    // `<body>` gồm chữ của cả trang, nên mọi vật chứa sẽ bị đo với màu mà chính nó không vẽ ra.
    // Ô nhập tính riêng — chữ của chúng nằm trong shadow tree, không phải một nút con.
    const DO_CHU = `
      ${HAM_TEN}
      const nenThat = (el) => {
        for (let n = el; n !== null; n = n.parentElement) {
          const c = getComputedStyle(n).backgroundColor;
          if (c !== 'transparent' && !/rgba\\(\\s*0\\s*,\\s*0\\s*,\\s*0\\s*,\\s*0\\s*\\)/.test(c)) return c;
        }
        return getComputedStyle(document.body).backgroundColor;
      };
      const coChuRieng = (el) =>
        [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '');
      const ra = [];
      for (const el of document.querySelectorAll('body *')) {
        if (!el.matches('textarea, input') && !coChuRieng(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden') continue;
        const nen = nenThat(el);
        ra.push({
          ten: ten(el),
          mau: s.color,
          nen,
          tyLe: Math.round(tuongPhan(s.color, nen) * 100) / 100,
        });
      }
      return ra;
    `;


    for (const theme of ['light', 'dark']) {
      // Lật bằng CHÍNH cái nút, không bằng một phép gán `dataset` — phép đo phải chạy trên đúng
      // trạng thái mà một cú bấm thật để lại.
      const dang = await cdp.chay(tab.sessionId, DOC_THEME);
      if (dang.thuocTinh !== theme) {
        const t = await cdp.chay(tab.sessionId, TAM_NUT);
        await nhanChuotTai(t.x, t.y);
      }
      await nghi(100);
      // Khẳng định cú lật ĐÃ xảy ra, trước khi đo. Thiếu dòng này thì một cú bấm trượt làm cả
      // hai vòng lặp đo CÙNG một bảng màu — và cả hai vẫn báo PASS, tức phép đo "ở cả hai
      // theme" im lặng trở thành phép đo ở một theme.
      const daLat = await cdp.chay(tab.sessionId, DOC_THEME);
      ghi(
        `theme ${theme}: cú bấm thật đưa trang về đúng bảng màu cần đo`,
        daLat.thuocTinh === theme,
        JSON.stringify(daLat),
      );
      // Bơm một mẩu giấy BỊ CẮT qua view thật: giờ tạo, dòng gấp và nút xóa là ba chỗ dùng
      // `--ink-2` trên mặt giấy, và không có mẩu nào thì ba cặp đó không được đo lần nào.
      await cdp.chay(
        tab.sessionId,
        `
        const l = await import('/app/view/luoi.js');
        const notes = [{
          id: 'thu-theme-1',
          createdAt: '2026-01-01T09:00:00+00:00',
          localDate: '2026-01-01',
          text: Array.from({ length: 9 }, (_, i) => 'dòng ' + i).join('\\n'),
          textFolded: '',
        }];
        const gia = {
          state: { notes, dieuKien: { keyword: null, date: null }, expandedIds: [], editing: { id: null, text: '', seq: {} } },
          batTatMoRong() {},
        };
        l.noiLuoi(gia, document, () => '2026-01-01T12:00:00+00:00').ve();
        return true;
      `,
      );
      await nghi(50);
      const day = await cdp.chay(tab.sessionId, DO_CHU);
      const loang = day.filter((d) => !(d.tyLe >= 4.5));
      ghi(
        `theme ${theme}: MỌI phần tử mang chữ tương phản ≥ 4.5:1 với nền thật của nó`,
        day.length > 0 && loang.length === 0,
        loang.length === 0
          ? `thấp nhất ${Math.min(...day.map((d) => d.tyLe))}:1 trên ${day.length} phần tử`
          : `dưới ngưỡng: ${JSON.stringify(loang)}`,
      );
    }

    // ── Đường LÚC TẢI: lựa chọn đã lưu sống sót qua một lần tải lại ──────────────────────
    //
    // Đây là ca duy nhất đi qua `app/main.js` đọc `data-theme` rồi đưa xuống `khoiDong`. Mọi
    // ca khác hoặc truyền theme bằng tay (Vitest) hoặc ép `light` trước khi nhìn, nên bỏ hẳn
    // đối số ở `main.js` vẫn để cả suite xanh — trong khi một lựa chọn `dark` đã lưu bật ngược
    // về sáng ở MỌI lần tải. Nhãn nút là thứ lộ ra điều đó: thuộc tính `data-theme` do script
    // nội tuyến đặt và nó đúng dù lõi có biết theme hay không, còn NHÃN thì vẽ từ state.
    await cdp.chay(tab.sessionId, `localStorage.setItem('ghichu.theme', 'dark'); return true;`);
    await cdp.taiLai(tab.sessionId);
    await nghi(400);
    const sauTaiLai = await cdp.chay(tab.sessionId, DOC_THEME);
    ghi(
      'tải lại với lựa chọn `dark` đã lưu: trang vẫn tối VÀ nhãn nút đọc `nền sáng`',
      sauTaiLai.thuocTinh === 'dark' && sauTaiLai.nhan === 'nền sáng',
      JSON.stringify(sauTaiLai),
    );

    // Trả trang về trạng thái sạch cho khối đo bề rộng bên dưới: một mẩu bơm tay và một lựa
    // chọn theme để lại là đổi âm thầm môi trường đo của nó.
    await cdp.chay(tab.sessionId, `localStorage.removeItem('ghichu.theme'); return true;`);
    await cdp.goi('Emulation.setFocusEmulationEnabled', { enabled: false }, tab.sessionId);
    await cdp.taiLai(tab.sessionId);
  }

  // ── Ô ngày rộng đúng 118px kể cả viền và padding ─────────────────────────────────────
  {
    const rong = await cdp.chay(
      tab.sessionId,
      `return Math.round(document.querySelector('.o-ngay-boc').getBoundingClientRect().width);`,
    );
    ghi('ô ngày rộng đúng 118px (kích thước NGOÀI, đã gồm viền)', rong === 118, `${rong}px`);
  }

  // ── Phóng 200% (tương đương reflow) — Story 3.4 ──────────────────────────────────────
  //
  // QĐ-2: nghiệm thu bằng phép đo TƯƠNG ĐƯƠNG reflow, không bằng zoom thật. CDP không đặt
  // được mức phóng thật (xem chú thích khối 500px ở trên), nhưng phóng 200% chia đôi khung
  // nhìn CSS trong khi CỠ CHỮ giữ nguyên — và đó chính là thứ `datKhungNhin` dựng lại được.
  // Mục thử tay số 18 ở lại README làm vế mắt nhìn.
  //
  // Vì sao 550 chứ không phải 640: ranh giới 2↔1 cột là HỆ QUẢ SỐ HỌC của token, đúng 560px
  // (2×260 + 8 + 2×16), nên 200% trên một cửa sổ 1280 rộng cho 640px và ở đó lưới vẫn còn
  // ĐÚNG 2 cột — đó là hành vi đã ghim, không phải một khiếm khuyết. 550×400 là 200% của một
  // cửa sổ 1100×800, tức "cửa sổ cỡ thường" của mục thử tay 18, và là khung nhìn mà câu "lưới
  // về 1 cột" thật sự đúng. Đổi `--note-min-col`, `--grid-gap` hay `--page-gutter` là thấy ca
  // này lệch ngay, đúng như ranh giới 828px ở khối trên.
  //
  // Vì sao ca 500px phía trên KHÔNG thay được khối này: nó bơm `.thu-o-tam` — những khối
  // `120px` KHÔNG CÓ CHỮ — nên nó trả lời được "bố cục có tràn không" mà không trả lời được
  // "chữ có bị cắt không", tức đúng nửa mà AC 200% đòi. Ghi chú THẬT, chữ THẬT, bơm qua đúng
  // đường của người dùng, là điều kiện để phép đo có nghĩa.
  {
    await datKhungNhin(550, 400);

    const CHOT_PHONG = (chu) => `
      const o = document.querySelector('.o-soan');
      o.value = ${JSON.stringify(chu)};
      o.dispatchEvent(new Event('input', { bubbles: true }));
      o.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
      return true;
    `;
    const doiSoPhong = async (mong) => {
      for (let i = 0; i < 50; i += 1) {
        const so = await cdp.chay(
          tab.sessionId,
          `return document.querySelectorAll('.luoi > *').length;`,
        );
        if (so === mong) return;
        await nghi(100);
      }
      throw new Error(`lưới không đạt ${mong} mẩu sau 5s — phép ghi hỏng hoặc lưới không vẽ lại`);
    };

    // Chữ ngắn lẫn chữ dài: một mẩu một từ không bao giờ tràn, nên một mình nó chứng minh
    // được rất ít. Mẩu dài là thứ phải XUỐNG DÒNG thay vì bị cắt ngang.
    const CHU_PHONG = [
      'mẩu ngắn',
      'một câu dài vừa phải để thử xem chữ có xuống dòng hay bị cắt ngang ở khung nhìn hẹp',
      'ghi chú thứ ba, dài hơn một chút nữa, đủ để lưới phải xuống hàng ở một cột',
    ];

    const khoTruoc = await cdp.chay(
      tab.sessionId,
      `const m = await import('/app/main.js'); return m.store.state.notes.length;`,
    );
    const oTruoc = await cdp.chay(
      tab.sessionId,
      `
      const m = await import('/app/main.js');
      const q = await import('/app/core/query.js');
      const t = await import('/app/core/time.js');
      return q.locGhiChu(m.store.state.notes, m.store.state.dieuKien, t.nowIso()).total;
    `,
    );

    const idPhong = [];
    try {
      for (const chu of CHU_PHONG) {
        await cdp.chay(tab.sessionId, CHOT_PHONG(chu));
        await doiSoPhong(oTruoc + idPhong.length + 1);
        const moi = await cdp.chay(
          tab.sessionId,
          `
          const m = await import('/app/main.js');
          const n = m.store.state.notes.find((x) => x.text === ${JSON.stringify(chu)});
          return n === undefined ? null : n.id;
        `,
        );
        // Cùng lý do với khối mẩu giấy: tra không ra `id` là một lỗi, không phải một ca để bỏ
        // qua — bỏ qua im lặng là để mẩu rác ở lại trong kho thật của máy người chạy.
        if (moi === null) {
          throw new Error('chốt xong nhưng không tra ra id của mẩu — kho có thể còn mẩu rác');
        }
        idPhong.push(moi);
      }

      // Chờ tới khi ỔN ĐỊNH, không chờ một con số (khuôn Story 3.3): phông của `--font-note`
      // xong muộn một khung hình là đủ để một phép đo chiều rộng lệch rồi tự đúng.
      const DO_PHONG = `
        const goc = document.documentElement;
        const bo = new Set(['.o-soan', '.tang-luoi']);
        const coChuRieng = (e) => [...e.childNodes]
          .some((n) => n.nodeType === 3 && n.textContent.trim() !== '');
        const catChu = [...document.querySelectorAll('body *')]
          .filter((e) => !['SCRIPT', 'STYLE'].includes(e.tagName))
          // Hai vùng này CUỘN theo thiết kế đã ghim (ô soạn thảo có trần chiều cao, tầng lưới
          // là vùng cuộn của trang), nên scrollWidth của chúng không nói lên chữ bị cắt.
          .filter((e) => ![...bo].some((s) => e.matches(s)))
          .filter(coChuRieng)
          // Ngưỡng là "> clientWidth + 1", không phải "> clientWidth": một điểm ảnh lẻ là phần
          // dư của phép làm tròn bố cục, không phải một chữ bị cắt. Con số +1 này cũng được
          // nói ra trong README, để không ai "sửa" mã cho khớp một câu văn thiếu nó.
          .filter((e) => e.scrollWidth > e.clientWidth + 1)
          .map((e) => ({
            the: e.tagName + '.' + e.className,
            scroll: e.scrollWidth,
            client: e.clientWidth,
          }));
        // Đếm luôn số phần tử đo được: Math.max() của một dãy RỖNG là -Infinity, và
        // -Infinity <= 550 là true — tức một lớp .tang bị đổi tên biến cửa "không tràn
        // ngang" thành một PASS im lặng, đúng hình dạng mà đầu tệp này chép lại từ Story 3.3.
        const canhPhai = [...document.querySelectorAll('.tang *')]
          .map((e) => Math.round(e.getBoundingClientRect().right));
        return {
          cuonNgang: goc.scrollWidth - goc.clientWidth > 1,
          soPhanTuDo: canhPhai.length,
          phaiNhatCuaNoiDung: canhPhai.length === 0 ? null : Math.max(...canhPhai),
          catChu,
        };
      `;
      let d = await cdp.chay(tab.sessionId, DO_PHONG);
      let daYen = false;
      for (let lan = 0; lan < 10; lan += 1) {
        await nghi(100);
        const lai = await cdp.chay(tab.sessionId, DO_PHONG);
        daYen = JSON.stringify(lai) === JSON.stringify(d);
        d = lai;
        if (daYen) break;
      }
      // Không ổn định sau 1s là HỎNG TO TIẾNG, không phải một mẫu giữa chừng đem đi so: cả ba
      // ca dưới đây đọc từ `d`, nên một `d` chưa yên làm chúng trả lời về một bố cục không
      // tồn tại — xanh hay đỏ đều vô nghĩa như nhau.
      ghi('phóng 200%: bố cục ổn định trước khi đo (hai lượt đọc liên tiếp trùng nhau)', daYen, daYen ? 'đã yên' : 'còn đổi sau 10 lượt đọc');
      const cot = await cdp.chay(tab.sessionId, DEM_COT);
      const cuon = await cdp.chay(tab.sessionId, DO_CUON);

      ghi('phóng 200% (550×400) với ghi chú THẬT: lưới về 1 cột', cot === 1, `cột=${cot}`);
      ghi(
        'phóng 200%: không cuộn ngang trang, không phần tử nào của bốn tầng vượt 550px',
        d.soPhanTuDo > 0 && !d.cuonNgang && d.phaiNhatCuaNoiDung <= 550,
        `đo ${d.soPhanTuDo} phần tử · cuộn ngang=${d.cuonNgang} · phải nhất=${d.phaiNhatCuaNoiDung}/550`,
      );
      // Nửa còn lại của mục thử tay 18: "trang vẫn KHÔNG có thanh cuộn dọc ngoài — chỉ tầng
      // lưới cuộn". `DO_PHONG` chỉ trả lời chiều ngang, nên không có dòng này thì README đang
      // hứa nhiều hơn phần đã đo.
      ghi(
        'phóng 200%: trang không cuộn dọc — chỉ tầng lưới cuộn, ba tầng kia đứng yên',
        !cuon.trang && cuon.luoi && !cuon.soan && !cuon.khay && !cuon.chan,
        JSON.stringify(cuon),
      );
      ghi(
        'phóng 200%: không một phần tử mang chữ nào bị cắt ngang',
        d.catChu.length === 0,
        d.catChu.length === 0
          ? 'không phần tử nào có scrollWidth > clientWidth + 1'
          : JSON.stringify(d.catChu),
      );
    } finally {
      const conLai = await cdp.chay(
        tab.sessionId,
        `
        const m = await import('/app/main.js');
        for (const id of ${JSON.stringify(idPhong)}) await m.store.xoaGhiChu(id);
        return m.store.state.notes.length;
      `,
      );
      ghi(
        'phóng 200%: dọn sạch đúng những mẩu vừa tạo — kho trở lại y như trước',
        conLai === khoTruoc,
        `kho ${khoTruoc} → ${conLai} (đã tạo ${idPhong.length})`,
      );
      // Trả khung nhìn về chỗ cũ: khối này là khối CUỐI hôm nay, nhưng một khối thêm vào sau
      // nó mà thừa hưởng 550×400 là một phép đo sai trong im lặng.
      await datKhungNhin(1280, 700);
    }
  }

  // ── Luồng xóa 5.2/5.3, Shift+Tab sang `xóa`, sửa kết quả tìm tới hết khớp (Story 7.0) ──
  //
  // Vì sao không chỉ Vitest: `test/giu-tieu-diem.test.js` CHẠY `veGiuTieuDiem` trên một gốc
  // giả, và gốc giả đó tự quyết "Shift+Tab đi đâu" và "`Enter` trên nút là `click`". Ở đây trình
  // duyệt quyết: phím THẬT qua `Input.dispatchKeyEvent`, thứ tự `blur`/`focus` thật, lượt vẽ
  // hoãn bằng `setTimeout` thật, và IndexedDB thật (retro Epic 5 #12, retro Epic 6 #22).
  //
  // Mẩu đo được CHỐT thật và DỌN theo đúng `id` ở `finally`, cùng luật với các khối trên.
  {
    await datKhungNhin(1280, 700);
    await cdp.taiLai(tab.sessionId);
    // Cùng điều kiện với khối Story 3.2: không có nó thì phím gửi vào tab headless không dời
    // được tiêu điểm, và mọi dòng dưới đây đo đúng không gì cả.
    await cdp.goi('Emulation.setFocusEmulationEnabled', { enabled: true }, tab.sessionId);
    // `doiSan` chỉ đợi `store` tồn tại, không đợi `khoiDong` nạp xong `notes`. Đọc `khoTruoc`
    // hay chốt mẩu trước lúc ấy là đếm sai kho, và lượt `readAll` về muộn có thể đè mất mẩu vừa
    // chốt. Cùng cách đợi với khối theme.
    await nghi(400);

    /** Một phím THẬT. `modifiers: 8` là Shift. `text` chỉ cho phím sinh ký tự (`Enter`), để
     *  `<button>` nhận phép kích hoạt mặc định của nó. */
    const nhanPhim = async ({ key, code, vk, text, shift = false }) => {
      for (const type of [text === undefined ? 'rawKeyDown' : 'keyDown', 'keyUp']) {
        await cdp.goi(
          'Input.dispatchKeyEvent',
          {
            type,
            key,
            code,
            text: type === 'keyUp' ? undefined : text,
            windowsVirtualKeyCode: vk,
            nativeVirtualKeyCode: vk,
            modifiers: shift ? 8 : 0,
          },
          tab.sessionId,
        );
      }
      await nghi(30);
    };
    const ENTER = { key: 'Enter', code: 'Enter', vk: 13, text: '\r' };
    const ESC = { key: 'Escape', code: 'Escape', vk: 27 };
    const TAB = { key: 'Tab', code: 'Tab', vk: 9 };

    /** Đợi một biểu thức trong tab thành đúng; hết hạn thì trả `false` — ca đỏ, không treo. */
    const doi = async (bieuThuc, soLan = 60) => {
      for (let i = 0; i < soLan; i += 1) {
        if (await cdp.chay(tab.sessionId, `return Boolean(${bieuThuc});`)) return true;
        await nghi(50);
      }
      return false;
    };
    /** Tiêu điểm đang ở đâu: `id`, class, mẩu chứa nó, và hộp thoại có đang mở không. */
    const DUNG = `
      const el = document.activeElement;
      const m = await import('/app/main.js');
      const hop = document.querySelector('.hop-thoai') !== null;
      if (el === null || el === document.body) return { body: true, hop, hoi: m.store.state.xacNhanXoa };
      const mau = el.closest('[data-mau]');
      return {
        body: false,
        id: el.id || null,
        lop: String(el.className || ''),
        mau: mau === null ? null : mau.getAttribute('data-mau'),
        hop,
        hoi: m.store.state.xacNhanXoa,
      };
    `;
    const dung = () => cdp.chay(tab.sessionId, DUNG);
    const TREN_LUOI = (id) => `document.querySelector('.luoi > [data-mau="' + ${JSON.stringify(id)} + '"]') !== null`;
    const TRONG_KHO = (id) =>
      `(await import('/app/main.js')).store.state.notes.some((x) => x.id === ${JSON.stringify(id)})`;
    const datTieuDiem = (chon) =>
      cdp.chay(tab.sessionId, `document.querySelector(${JSON.stringify(chon)}).focus(); return true;`);
    const nutXoa = (id) => `.luoi > [data-mau="${id}"] .mau-xoa`;
    const thanMau = (id) => `.luoi > [data-mau="${id}"]`;
    /** Gõ vào một ô qua đúng bộ nghe `input` của nó — chữ thay một lần, như một cú dán. */
    const goVao = (chon, chu) =>
      cdp.chay(
        tab.sessionId,
        `const o = document.querySelector(${JSON.stringify(chon)}); o.value = ${JSON.stringify(chu)};
         o.dispatchEvent(new Event('input', { bubbles: true })); return true;`,
      );

    const CHU = {
      hop: 'thu-7-0 hộp thoại',
      shift: 'thu-7-0 shift tab',
      rong: 'thu-7-0 rời rỗng',
      tim: 'thu-7-0 kqtim70',
      nhanh: 'thu-7-0 kqnhanh70',
    };
    const khoTruoc = await cdp.chay(
      tab.sessionId,
      `const m = await import('/app/main.js'); return m.store.state.notes.length;`,
    );
    const id = {};
    try {
      for (const [khoa, chu] of Object.entries(CHU)) {
        await goVao('.o-soan', chu);
        await cdp.chay(
          tab.sessionId,
          `document.querySelector('.o-soan').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
           return true;`,
        );
        await doi(`(await import('/app/main.js')).store.state.notes.some((x) => x.text === ${JSON.stringify(chu)})`);
        id[khoa] = await cdp.chay(
          tab.sessionId,
          `const n = (await import('/app/main.js')).store.state.notes.find((x) => x.text === ${JSON.stringify(chu)});
           return n === undefined ? null : n.id;`,
        );
        if (id[khoa] === null) throw new Error(`chốt "${chu}" xong mà không tra ra id — kho có thể còn mẩu rác`);
        await doi(TREN_LUOI(id[khoa]));
      }

      // ── Hộp 5.3: mở / Esc / `hủy` / `xóa`, tiêu điểm ở nút hoặc `#o-soan` ────────────────
      {
        await datTieuDiem(nutXoa(id.hop));
        await nhanPhim(ENTER);
        await doi(`document.querySelector('.hop-thoai') !== null`);
        const mo = await dung();
        ghi(
          'hộp 5.3: `Enter` trên `xóa` mở hộp cho ĐÚNG mẩu, tiêu điểm ở `hủy`',
          mo.hop && mo.hoi === id.hop && mo.lop.includes('hop-thoai-chon'),
          JSON.stringify(mo),
        );

        await nhanPhim(ESC);
        await doi(`document.querySelector('.hop-thoai') === null`);
        const sauEsc = await dung();
        ghi(
          'hộp 5.3: `Esc` đóng hộp, tiêu điểm về nút `xóa` của chính mẩu đó — không `<body>`',
          !sauEsc.hop && sauEsc.mau === id.hop && sauEsc.lop.includes('mau-xoa'),
          JSON.stringify(sauEsc),
        );

        await nhanPhim(ENTER);
        await doi(`document.querySelector('.hop-thoai') !== null`);
        // Tiêu điểm mở ở `hủy`, nên `Enter` ngay là HỦY.
        await nhanPhim(ENTER);
        await doi(`document.querySelector('.hop-thoai') === null`);
        const sauHuy = await dung();
        const conSauHuy = await cdp.chay(tab.sessionId, `return ${TRONG_KHO(id.hop)};`);
        ghi(
          'hộp 5.3: `hủy` đóng hộp, mẩu còn nguyên, tiêu điểm về nút `xóa` của nó',
          !sauHuy.hop && conSauHuy && sauHuy.mau === id.hop && sauHuy.lop.includes('mau-xoa'),
          JSON.stringify(sauHuy),
        );

        await nhanPhim(ENTER);
        await doi(`document.querySelector('.hop-thoai') !== null`);
        await nhanPhim(TAB);
        const oXoa = await dung();
        await nhanPhim(ENTER);
        await doi(`!(${TRONG_KHO(id.hop)})`);
        await doi(`!(${TREN_LUOI(id.hop)})`);
        await nghi(100);
        const sauXoa = await dung();
        const conSauXoa = await cdp.chay(tab.sessionId, `return ${TRONG_KHO(id.hop)};`);
        ghi(
          'hộp 5.3: `Tab` sang `xóa` rồi `Enter` — mẩu biến khỏi kho và lưới, tiêu điểm về `#o-soan`',
          oXoa.lop.includes('hop-thoai-xoa') && !conSauXoa && !sauXoa.hop && sauXoa.id === 'o-soan',
          `trước Enter ${JSON.stringify(oXoa)} · sau ${JSON.stringify(sauXoa)}`,
        );
      }

      // ── Shift+Tab từ ô sửa sang `xóa` của chính mẩu đó, rồi `Enter` (E5#11) ───────────────
      {
        await datTieuDiem(thanMau(id.shift));
        await nhanPhim(ENTER);
        await doi(`document.activeElement !== null && document.activeElement.matches('.mau-sua')`);
        const dangSua = await dung();
        await nhanPhim({ ...TAB, shift: true });
        // Lượt vẽ hoãn một nhịp `setTimeout` sau `roiCheDoSua()`: đợi ô sửa biến mất.
        await doi(`document.querySelector('.mau-sua') === null`);
        await nghi(100);
        const sauShift = await dung();
        ghi(
          'Shift+Tab từ ô sửa: tiêu điểm Ở LẠI nút `xóa` của chính mẩu đó — không bị giật về thân',
          dangSua.lop.includes('mau-sua') &&
            sauShift.mau === id.shift &&
            sauShift.lop.includes('mau-xoa'),
          `đang sửa ${JSON.stringify(dangSua)} → ${JSON.stringify(sauShift)}`,
        );
        await nhanPhim(ENTER);
        await doi(`document.querySelector('.hop-thoai') !== null`);
        const sauEnter = await dung();
        ghi(
          'Shift+Tab rồi `Enter`: mở hộp hỏi về ĐÚNG mẩu đó — không vào lại chế độ sửa',
          sauEnter.hop && sauEnter.hoi === id.shift &&
            (await cdp.chay(tab.sessionId, `return document.querySelector('.mau-sua') === null;`)),
          JSON.stringify(sauEnter),
        );
        await nhanPhim(ESC);
        await doi(`document.querySelector('.hop-thoai') === null`);
      }

      // ── Rời ô sửa rỗng (Story 5.2): mẩu tự biến mất, tiêu điểm về `#o-soan` ──────────────
      {
        await datTieuDiem(thanMau(id.rong));
        await nhanPhim(ENTER);
        await doi(`document.activeElement !== null && document.activeElement.matches('.mau-sua')`);
        await goVao('.mau-sua', '');
        await nhanPhim({ ...TAB, shift: true });
        await doi(`!(${TRONG_KHO(id.rong)})`);
        await doi(`!(${TREN_LUOI(id.rong)})`);
        await nghi(100);
        const sauRong = await dung();
        const conTrongKho = await cdp.chay(tab.sessionId, `return ${TRONG_KHO(id.rong)};`);
        ghi(
          'rời ô sửa rỗng: mẩu biến khỏi kho và lưới, không hỏi gì, tiêu điểm ở `#o-soan` — không `<body>`',
          !conTrongKho && !sauRong.hop && !sauRong.body && sauRong.id === 'o-soan',
          JSON.stringify(sauRong),
        );
      }

      // ── Sửa một mẩu trong kết quả tìm tới khi hết khớp (E6#22) ───────────────────────────
      {
        await goVao('#o-tim', 'kqtim70');
        await doi(TREN_LUOI(id.tim));
        const chiMotMau = await cdp.chay(tab.sessionId, `return document.querySelectorAll('.luoi > [data-mau]').length;`);
        await datTieuDiem(thanMau(id.tim));
        await nhanPhim(ENTER);
        await doi(`document.activeElement !== null && document.activeElement.matches('.mau-sua')`);
        await goVao('.mau-sua', 'thu-7-0 đã hết khớp');
        // Đợi hẹn tự lưu xuống kho: sau đó `notes` không còn khớp, nhưng lưới GÁC ô sửa đang gõ.
        await doi(
          `(await import('/app/main.js')).store.state.notes.some((x) => x.id === ${JSON.stringify(id.tim)} && x.text === 'thu-7-0 đã hết khớp')`,
        );
        const conKhiGo = await cdp.chay(tab.sessionId, `return ${TREN_LUOI(id.tim)};`);
        await nhanPhim({ ...TAB, shift: true });
        await doi(`!(${TREN_LUOI(id.tim)})`);
        await nghi(100);
        const sauTim = await dung();
        const khongKhop = await cdp.chay(
          tab.sessionId,
          `return document.querySelector('.luoi-khong-khop') !== null;`,
        );
        ghi(
          'sửa kết quả tìm tới hết khớp: mẩu đứng yên lúc gõ, biến mất khi rời, tiêu điểm về `#o-soan`',
          chiMotMau === 1 && conKhiGo && khongKhop && !sauTim.body && sauTim.id === 'o-soan',
          `khớp ${chiMotMau} mẩu · còn lúc gõ=${conKhiGo} · không khớp=${khongKhop} · ${JSON.stringify(sauTim)}`,
        );
        await goVao('#o-tim', '');
      }

      // ── Như trên, nhưng rời TRƯỚC khi hẹn `AUTOSAVE_MS` nổ ──────────────────────────────
      //
      // Đây là đường mà `mocSua.go` phải đi qua `veGiuTieuDiem`. Lượt vẽ hoãn của `roi` còn thấy
      // chữ cũ nên mẩu còn khớp, và tiêu điểm ở lại nút `xóa`. Rồi `put` xong, và CHÍNH lượt vẽ
      // của `go` gỡ mẩu cùng nút đó. Ca trên đợi `put` xong trước khi rời, nên không đi vào đây.
      {
        await goVao('#o-tim', 'kqnhanh70');
        await doi(TREN_LUOI(id.nhanh));
        await datTieuDiem(thanMau(id.nhanh));
        await nhanPhim(ENTER);
        await doi(`document.activeElement !== null && document.activeElement.matches('.mau-sua')`);
        await goVao('.mau-sua', 'thu-7-0 rời nhanh đã hết khớp');
        await nhanPhim({ ...TAB, shift: true });
        // Ghim thứ tự: lúc vừa rời, kho CHƯA mang chữ mới. Nếu đã mang thì ca này chỉ lặp lại ca trên.
        const chuaGhi = await cdp.chay(
          tab.sessionId,
          `return (await import('/app/main.js')).store.state.notes.some((x) => x.id === ${JSON.stringify(id.nhanh)} && x.text === ${JSON.stringify(CHU.nhanh)});`,
        );
        await doi(
          `(await import('/app/main.js')).store.state.notes.some((x) => x.id === ${JSON.stringify(id.nhanh)} && x.text === 'thu-7-0 rời nhanh đã hết khớp')`,
        );
        await doi(`!(${TREN_LUOI(id.nhanh)})`);
        await nghi(100);
        const sauNhanh = await dung();
        ghi(
          'rời ô sửa kết quả tìm TRƯỚC hẹn tự lưu: lượt vẽ của `put` gỡ mẩu, tiêu điểm về `#o-soan` — không `<body>`',
          chuaGhi && !sauNhanh.body && sauNhanh.id === 'o-soan',
          `kho còn chữ cũ lúc rời=${chuaGhi} · ${JSON.stringify(sauNhanh)}`,
        );
        await goVao('#o-tim', '');
      }
    } finally {
      const conLai = await cdp.chay(
        tab.sessionId,
        `
        const m = await import('/app/main.js');
        for (const id of ${JSON.stringify(Object.values(id).filter((x) => typeof x === 'string'))}) await m.store.xoaGhiChu(id);
        return m.store.state.notes.length;
      `,
      );
      ghi(
        'Story 7.0: dọn sạch đúng những mẩu vừa tạo — kho trở lại y như trước',
        conLai === khoTruoc,
        `kho ${khoTruoc} → ${conLai} (đã tạo ${Object.keys(id).length})`,
      );
      await cdp.goi('Emulation.setFocusEmulationEnabled', { enabled: false }, tab.sessionId);
      await cdp.taiLai(tab.sessionId);
    }
  }

  // ── Story 7.1: hai tab THẬT trên cùng một kênh `ghichu` ─────────────────────────────────
  //
  // Tab A là `tab` ở trên; tab B mở mới trên cùng origin. Mọi phép ghi đi qua action của store
  // (bản tin phát bởi mã sản phẩm, qua BroadcastChannel thật), và mọi phép đo đọc ở tab KIA.
  {
    const A = tab.sessionId;
    const tabB = await cdp.tabMoi(server.diaChi);
    const B = tabB.sessionId;
    const M = `const m = await import('/app/main.js');`;
    /** Đợi tới khi biểu thức (async, trong tab) ra thật; trả về giá trị cuối cùng đọc được. */
    const doiTab = async (phien, bieuThuc, soLan = 60) => {
      let cuoi = false;
      for (let i = 0; i < soLan; i += 1) {
        cuoi = await cdp.chay(phien, `${M} return Boolean(${bieuThuc});`);
        if (cuoi) return true;
        await nghi(100);
      }
      return cuoi;
    };
    const CO_CHU = (chu) => `m.store.state.notes.some((x) => x.text === ${JSON.stringify(chu)})`;
    const ID_CUA = (chu) =>
      `m.store.state.notes.find((x) => x.text === ${JSON.stringify(chu)})?.id ?? null`;
    const daTao = [];
    try {
      await cdp.doiSan(B);
      // Hai tab cùng mở thì chỉ một tab có tiêu điểm cửa sổ; giả lập tiêu điểm cho cả hai để
      // `focus()`/`blur()` của ô sửa chạy như khi Nam đang nhìn tab đó.
      for (const phien of [A, B]) {
        await cdp.goi('Emulation.setFocusEmulationEnabled', { enabled: true }, phien);
      }
      // B đang gõ dở ô soạn — gõ thật qua sự kiện `input`, không qua action.
      await cdp.chay(
        B,
        `const o = document.querySelector('#o-soan'); o.value = 'dong-bo-7-1 B viết dở';
         o.dispatchEvent(new Event('input', { bubbles: true })); return true;`,
      );

      // Chốt ở A → B hiện mẩu, tab title đúng, bản nháp của B nguyên vẹn.
      const CHU_A = 'dong-bo-7-1 từ A';
      const tieuDeTruoc = await cdp.chay(B, `return document.title;`);
      await cdp.chay(A, `${M} m.store.datBanNhap(${JSON.stringify(CHU_A)}); await m.store.chotGhiChu(); return true;`);
      daTao.push(await cdp.chay(A, `${M} return ${ID_CUA(CHU_A)};`));
      const tinChot = await doiTab(B, `${CO_CHU(CHU_A)} && document.querySelector('.luoi').textContent.includes(${JSON.stringify(CHU_A)})`);
      // Tab title của B đếm ghi chú HÔM NAY: mẩu vừa chốt là của hôm nay, nên con số phải tăng
      // đúng một. (Tab A không tự vẽ lại ở đây — ca này gọi thẳng action, không qua giao diện.)
      const tieuDe = await cdp.chay(B, `return document.title;`);
      const so = (t) => Number((/^(\d+) /.exec(t) ?? [0, 0])[1]);
      const nhapB = await cdp.chay(
        B,
        `${M} return [document.querySelector('#o-soan').value, m.store.state.draft.text];`,
      );
      ghi(
        'Story 7.1 — chốt ở A: B hiện mẩu mới, tab title của B tăng đúng một, không F5',
        tinChot && so(tieuDe) === so(tieuDeTruoc) + 1,
        `B title ${JSON.stringify(tieuDeTruoc)} → ${JSON.stringify(tieuDe)}`,
      );
      ghi(
        'Story 7.1 — B đang gõ ô soạn: A chốt không đụng ô soạn lẫn bản nháp của B',
        nhapB[0] === 'dong-bo-7-1 B viết dở' && nhapB[1] === 'dong-bo-7-1 B viết dở',
        JSON.stringify(nhapB),
      );

      // Sửa ở A → B hiện chữ mới.
      const CHU_SUA = 'dong-bo-7-1 A đã sửa';
      await cdp.chay(
        A,
        `${M} const id = ${ID_CUA(CHU_A)}; m.store.vaoCheDoSua(id);
         await m.store.tuLuuNoiDung(id, ${JSON.stringify(CHU_SUA)}); await m.store.roiCheDoSua(); return true;`,
      );
      ghi('Story 7.1 — sửa ở A: B hiện chữ mới sau khi `put` xong', await doiTab(B, CO_CHU(CHU_SUA)));

      // Xóa ở A → B mất mẩu.
      await cdp.chay(A, `${M} await m.store.xoaGhiChu(${ID_CUA(CHU_SUA)}); return true;`);
      ghi(
        'Story 7.1 — xóa ở A: mẩu biến khỏi B',
        await doiTab(B, `!(${CO_CHU(CHU_SUA)}) && !document.querySelector('.luoi').textContent.includes(${JSON.stringify(CHU_SUA)})`),
      );

      // Theme lan sang: B đổi `data-theme` và nhãn nút.
      const themeCu = await cdp.chay(A, `${M} return m.store.state.theme;`);
      const themeMoi = themeCu === 'dark' ? 'light' : 'dark';
      const nhanCu = await cdp.chay(B, `return document.querySelector('.nut-theme').textContent;`);
      await cdp.chay(A, `${M} await m.store.datTheme(${JSON.stringify(themeMoi)}); return true;`);
      const themeLan = await doiTab(
        B,
        `document.documentElement.getAttribute('data-theme') === ${JSON.stringify(themeMoi)}`,
      );
      const nhanMoi = await cdp.chay(B, `return document.querySelector('.nut-theme').textContent;`);
      ghi(
        'Story 7.1 — đổi theme ở A: B đổi theme và nhãn nút',
        themeLan && nhanMoi !== nhanCu,
        `${themeCu}→${themeMoi} · nhãn ${JSON.stringify(nhanCu)}→${JSON.stringify(nhanMoi)}`,
      );
      await cdp.chay(A, `${M} await m.store.datTheme(${JSON.stringify(themeCu)}); return true;`);
      await doiTab(B, `document.documentElement.getAttribute('data-theme') === ${JSON.stringify(themeCu)}`);

      // A đang sửa X, B xóa X → dải băng `MAU_SUA_BI_XOA` ở A, chữ đang gõ còn trong ô.
      const CHU_X = 'dong-bo-7-1 mẩu X';
      await cdp.chay(B, `${M} m.store.datBanNhap(${JSON.stringify(CHU_X)}); await m.store.chotGhiChu(); return true;`);
      await doiTab(A, CO_CHU(CHU_X));
      const idX = await cdp.chay(A, `${M} return ${ID_CUA(CHU_X)};`);
      daTao.push(idX);
      await cdp.chay(
        A,
        `${M} const than = document.querySelector('.luoi > [data-mau="' + ${JSON.stringify(idX)} + '"]');
         than.click(); return true;`,
      );
      await doiTab(A, `document.querySelector('.mau-sua') !== null`);
      await cdp.chay(
        A,
        `const o = document.querySelector('.mau-sua'); o.value = ${JSON.stringify(`${CHU_X} chữ đang gõ`)};
         o.dispatchEvent(new Event('input', { bubbles: true })); return true;`,
      );
      await cdp.chay(B, `${M} await m.store.xoaGhiChu(${JSON.stringify(idX)}); return true;`);
      const coBang = await doiTab(
        A,
        `m.store.state.banner === 'MAU_SUA_BI_XOA' && document.querySelector('.dai-bang').textContent.includes('Ghi chú này vừa bị xóa ở tab khác.')`,
      );
      const oSuaCon = await cdp.chay(A, `const o = document.querySelector('.mau-sua'); return o === null ? null : o.value;`);
      // Rời ô sửa: mẩu biến mất, kho không hồi sinh nó.
      await cdp.chay(A, `document.querySelector('.mau-sua')?.blur(); return true;`);
      await doiTab(A, `document.querySelector('.mau-sua') === null`);
      await nghi(1500);
      const hoiSinh = await cdp.chay(B, `${M} await m.store.napLaiGhiChu(); return m.store.state.notes.some((x) => x.id === ${JSON.stringify(idX)});`);
      ghi(
        'Story 7.1 — A sửa X, B xóa X: dải băng ở A, chữ còn trong ô sửa, rời thì mẩu mất và không hồi sinh',
        coBang && oSuaCon === `${CHU_X} chữ đang gõ` && !hoiSinh,
        `dải băng=${coBang} · ô sửa=${JSON.stringify(oSuaCon)} · hồi sinh=${hoiSinh}`,
      );
      await cdp.chay(A, `${M} m.store.dongDaiBang(); return true;`);
    } finally {
      // Dọn: xóa mọi mẩu còn sót, trả ô soạn của B về rỗng, đóng B.
      await cdp
        .chay(
          A,
          `${M} await m.store.napLaiGhiChu();
           for (const id of ${JSON.stringify(daTao.filter(Boolean))}) await m.store.xoaGhiChu(id);
           return true;`,
        )
        .catch(() => {});
      await cdp
        .chay(
          B,
          `const o = document.querySelector('#o-soan'); o.value = '';
           o.dispatchEvent(new Event('input', { bubbles: true })); return true;`,
        )
        .catch(() => {});
      await nghi(1500);
      await cdp.goi('Emulation.setFocusEmulationEnabled', { enabled: false }, A).catch(() => {});
      await cdp.dongTab(tabB.targetId).catch(() => {});
    }
  }

  // ── Story 7.2: tin lệch phiên bản đưa tab vào chế độ chỉ đọc ────────────────────────────
  //
  // Tin giả gửi từ một BroadcastChannel THỨ HAI mở ngay trong tab (cùng tên `ghichu`): kênh của
  // app nhận nó như tin từ tab khác. Rồi gõ + chốt qua giao diện thật, tải lại, và đếm kho.
  {
    const A = tab.sessionId;
    const M = `const m = await import('/app/main.js');`;
    const CHU = 'chi-doc-7-2 không được xuống kho';
    let tinhTrang = null;
    try {
      const khoTruoc = await cdp.chay(A, `${M} await m.store.napLaiGhiChu(); return m.store.state.notes.length;`);
      await cdp.chay(
        A,
        `const k = new BroadcastChannel('ghichu');
         k.postMessage({ v: 1, type: 'notes-changed', from: 'tab-gia', appVersion: '0.0.0' });
         k.close(); return true;`,
      );
      let coBang = false;
      for (let i = 0; i < 50 && !coBang; i += 1) {
        coBang = await cdp.chay(
          A,
          `const d = document.querySelector('.dai-bang');
           return d !== null && d.textContent.includes('Đã có bản mới. Tải lại trang — tab này đang ở chế độ chỉ đọc.');`,
        );
        if (!coBang) await nghi(100);
      }
      const coNutDong = await cdp.chay(A, `return document.querySelector('.dai-bang .dai-bang-dong') !== null;`);
      ghi(
        'Story 7.2 — tin lệch phiên bản: dải băng chỉ đọc hiện đúng microcopy, không có `✕`',
        coBang && !coNutDong,
        `dải băng=${coBang} · nút đóng=${coNutDong}`,
      );
      await cdp.chay(
        A,
        `const o = document.querySelector('#o-soan'); o.focus(); o.value = ${JSON.stringify(CHU)};
         o.dispatchEvent(new Event('input', { bubbles: true }));
         o.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true }));
         return true;`,
      );
      await nghi(1500);
      const oConChu = await cdp.chay(A, `return document.querySelector('#o-soan').value;`);
      await cdp.taiLai(A);
      await cdp.doiSan(A);
      tinhTrang = await cdp.chay(
        A,
        `${M} await m.store.napLaiGhiChu();
         return { so: m.store.state.notes.length, co: m.store.state.notes.some((x) => x.text === ${JSON.stringify(CHU)}), bang: m.store.state.banner };`,
      );
      ghi(
        'Story 7.2 — gõ + chốt khi chỉ đọc: chữ ở lại trong ô, tải lại không thêm mẩu nào, hết chỉ đọc',
        oConChu === CHU && tinhTrang.so === khoTruoc && !tinhTrang.co && tinhTrang.bang !== 'VERSION_SKEW',
        `ô=${JSON.stringify(oConChu)} · kho ${khoTruoc} → ${JSON.stringify(tinhTrang)}`,
      );
    } finally {
      // Bản nháp không xuống kho lúc chỉ đọc, nhưng dọn ô soạn cho chắc.
      await cdp
        .chay(
          A,
          `const o = document.querySelector('#o-soan'); o.value = '';
           o.dispatchEvent(new Event('input', { bubbles: true })); return true;`,
        )
        .catch(() => {});
      await nghi(1500);
    }
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
