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
      return q.locGhiChu(m.store.state.notes, m.store.state.dieuKien, t.nowIso()).length;
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
      return q.locGhiChu(m.store.state.notes, m.store.state.dieuKien, t.nowIso()).length;
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
          thuGon[1].tab === null &&
          thuGon[2].gap === 'còn 6 dòng ▾',
        JSON.stringify(thuGon.map((m) => [m.gap, m.tab])),
      );
      ghi(
        'mỗi mẩu mang giờ tạo HH:mm, và chỉ mẩu BỊ CẮT mới vào thứ tự Tab',
        thuGon.every((m) => /^\d{2}:\d{2}$/.test(m.gio)) &&
          thuGon.filter((m) => m.tab === '0').length === thuGon.filter((m) => m.gap !== null).length,
        JSON.stringify(thuGon.map((m) => [m.gio, m.tab])),
      );

      /** Click mẩu thứ `i` đúng đường của người dùng. */
      const CLICK = (i) => `
        document.querySelectorAll('.luoi > *')[${i}].dispatchEvent(
          new MouseEvent('click', { bubbles: true }),
        );
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

      // Click một mẩu KHÔNG bị cắt không đổi gì cả — kể cả chiều cao của chính nó.
      await cdp.chay(tab.sessionId, CLICK(1));
      await nghi(100);
      const sauClickNgan = (await cdp.chay(tab.sessionId, DO_MAU)).slice(0, CHU_MAU.length);
      ghi(
        'click mẩu KHÔNG bị cắt: không một thứ gì đổi',
        JSON.stringify(sauClickNgan) === JSON.stringify(haiMo),
        JSON.stringify(sauClickNgan.map((m) => m.mo)),
      );

      // Tải lại trang THẬT: đây là phép đo duy nhất chứng minh trạng thái mở rộng không rơi
      // xuống một kho bền nào. Hỏi thẳng cả hai kho sau đó, vì "trông thấy thu gọn" vẫn có thể
      // là một giá trị còn nằm đâu đó mà lượt vẽ đầu chưa đọc tới.
      await cdp.taiLai(tab.sessionId);
      await doiSoMau(oTruoc + idMau.length);
      // Đếm đủ mẩu chưa có nghĩa là layout đã ổn định: lượt vẽ đầu sau một lần tải lại có thể
      // đo trúng khung hình trước khi phông của `--font-note` xong, và chiều cao đo được lệch
      // một lần rồi tự đúng. Một nhịp nghỉ như mọi phép đo sau click ở trên.
      await nghi(100);
      const sauTaiLai = (await cdp.chay(tab.sessionId, DO_MAU)).slice(0, CHU_MAU.length);
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
      return q.locGhiChu(m.store.state.notes, { keyword: null, date: null }, t.nowIso()).length;
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
        const rong = { state: { notes: [], dieuKien: { keyword: null, date: null }, expandedIds: [] } };
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
        const trongKho = await cdp.chay(
          tab.sessionId,
          `const m = await import('/app/main.js'); return m.store.state.notes.length;`,
        );
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
        '.dai-bang-dong, .o-soan, .o-nhap, .o-luoi[tabindex], .chan-link, .nut-theme';
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
        state: { notes, dieuKien: { keyword: null, date: null }, expandedIds: [] },
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

    // Dãy nghiệm thu, và nó CHỈ gồm những phần tử đã tồn tại hôm nay. `về hôm nay` (Epic 6),
    // nút xóa có hành vi (Epic 5) và hai link sao lưu có hành vi (Epic 4) chưa tính.
    const THU_TU = [
      'input.o-nhap.o-tim',
      'input.o-nhap.o-ngay',
      'div.o-luoi',
      'div.o-luoi',
      'div.o-luoi',
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
            sangCaTrang: document.querySelectorAll(':focus-visible').length,
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
