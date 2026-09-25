// Bootstrap — điểm vào duy nhất của ứng dụng.
//
// Đây là file DUY NHẤT trong repo được phép import từ `app/adapters/`.
// Mọi module khác dưới `app/` chỉ nói chuyện qua `app/ports/`; `core/` và
// `ports/` là thuần, không chạm `window` / `document` / `indexedDB` /
// `localStorage` / `BroadcastChannel`.
//
// Và đây là file duy nhất được gọi `taoStore` — đúng một lần, cho đúng một khối state của
// ứng dụng (AD-1). `test/state-tap-trung.test.js` cưỡng chế cả hai nửa câu đó.
//
// Tập cổng TẠM (Story 1.5) vẫn còn cho hai cổng chưa có adapter: đủ mọi phương thức để qua
// `kiemTraPorts`, nhưng mỗi phương thức ném khi BỊ GỌI. Hai lý do cho việc ném thay vì trả về
// `undefined`: một cổng tạm im lặng sẽ làm story sau đi gỡ lỗi một adapter chưa tồn tại, và
// nó cũng làm mọi test tương lai xanh vì lý do sai. Hai cổng kho bền thì đã có adapter thật.
//
// `khoiDong()` nằm sau một cửa `typeof document !== 'undefined'`: `test/trang-tinh.test.js`
// import động file này ở NODE để nghiệm thu rằng nó là một ES module nạp được thật, và ở đó
// không có kho dữ liệu nào. Cùng lý do đó, hai adapter mở kho LƯỜI — dựng factory không chạm
// gì cả.

import { taoBroadcast } from './adapters/broadcast.js';
import { taoFileIo } from './adapters/file-io.js';
import { taoNoteStore } from './adapters/indexeddb.js';
import { taoSessionStore } from './adapters/localstorage.js';
import { taoQuota } from './adapters/quota.js';
import { DRAFT_BEAT_MS } from './core/limits.js';
import { taoStore } from './core/state.js';
import { PORT_METHODS } from './ports/index.js';
import { noiBanner } from './view/banner.js';
import { noiChanTrang } from './view/chan-trang.js';
import { CHON_VE_HOM_NAY, noiHangChip } from './view/hang-chip.js';
import { noiHopThoai } from './view/hop-thoai.js';
import { noiKhayTim } from './view/khay-tim.js';
import { CHON_LUOI, noiLuoi } from './view/luoi.js';
// Mệnh đề chọn ô sửa và tên thuộc tính chở `id` của mẩu đi VÀO từ `view/mau-giay.js` — nơi
// chúng được ĐẶT — chứ không khai lại ở đây. Đây là ngoại lệ đã có tiền lệ với `CHON_LUOI`:
// `main.js` không dựng DOM của mẩu, nó chỉ tìm lại đúng phần tử mà view vừa dựng, và một bản
// chép tay của cái tên là chỗ tiêu điểm lặng lẽ rơi về `<body>` vào ngày ai đó đổi tên.
import { CHON_SUA, CHON_XOA, THUOC_TINH_MAU } from './view/mau-giay.js';
import { noiNutTheme } from './view/nut-theme.js';
import { noiOSoan } from './view/o-soan.js';
import { noiTieuDe } from './view/tieu-de.js';

/**
 * Tập cổng tạm, dựng từ chính bảng phương thức của `app/ports/` — nên nó không thể thiếu
 * một phương thức mà bảng có, và không thể trôi khỏi bảng khi bảng nới ra.
 *
 * Export để `test/core-state.test.js` gọi thật một phương thức và nghiệm thu rằng nó NÉM,
 * nêu đúng `cong.phuongThuc`. Không export thì "stub ném khi bị gọi" là một lời hứa, và một
 * stub im lặng trả `undefined` cũng làm toàn bộ suite xanh y như vậy.
 */
export function congTam() {
  const ports = {};
  for (const tenCong of Object.keys(PORT_METHODS)) {
    const cong = {};
    for (const tenPhuongThuc of PORT_METHODS[tenCong]) {
      cong[tenPhuongThuc] = () => {
        throw new Error(`chưa nối adapter — Story 1.6 (${tenCong}.${tenPhuongThuc})`);
      };
    }
    ports[tenCong] = cong;
  }
  return ports;
}

/**
 * Tập cổng của ứng dụng: adapter thật cho mọi cổng — hai kho bền, kênh liên tab, file vào/ra
 * và hạn mức lưu trữ (`quota`, Story 8.1). `congTam()` vẫn trải trước làm lưới an toàn.
 *
 * Adapter đặt SAU `congTam()` trong phép trải: nếu ai đó đảo thứ tự thì cổng tạm ghi đè
 * adapter thật và mọi phép ghi lại ném "chưa nối adapter" — xanh ở mọi test, hỏng ở mọi lần
 * dùng thật.
 */
function congThat() {
  return {
    ...congTam(),
    noteStore: taoNoteStore(),
    sessionStore: taoSessionStore(),
    // Kênh liên tab (Story 3.3): mở LƯỜI như hai adapter trên, nên dòng này không chạm một
    // global nào ở Node — `test/trang-tinh.test.js` import động chính tệp này ở đó. Dựng MỘT lần
    // ở cấp module (`kenh`) để khối `document` nghe được đúng kênh mà store phát (Story 7.1).
    channel: kenh,
    // File vào/ra (Story 4.2 + 4.3): `taoFileIo()` chỉ dựng object, `document`/`Blob`/`URL`
    // chỉ bị hỏi tới bên trong `exportFile` và `readChosenFile` — nên dòng này cũng không chạm
    // global nào ở Node.
    fileIO: taoFileIo(),
    // Hạn mức lưu trữ (Story 8.1): mở lười, `navigator.storage` chỉ bị hỏi trong từng phương thức.
    quota: taoQuota(),
  };
}

/** `id` của ô soạn thảo — đường lui của mọi phép trả tiêu điểm. `index.html` mang bản đầu của
 *  chuỗi này; bản thứ hai ở đây là khuôn trùng lặp có ý thức mà AD-19 cho phép. */
const ID_O_SOAN = 'o-soan';

/** Mệnh đề chọn "bất cứ mẩu nào" — dựng từ tên thuộc tính của `view/mau-giay.js`, không chép. */
const CHON_MAU = `[${THUOC_TINH_MAU}]`;

/** Ba VAI TRÒ một phần tử trong mẩu có thể giữ tiêu điểm: chính mẩu (thân, `tabindex="0"`),
 *  nút `xóa`, và ô sửa. Không vai trò nào khác nhận được tiêu điểm trong một mẩu. */
const VAI_THAN = 'than';
const VAI_XOA = 'xoa';
const VAI_SUA = 'sua';

/** Vai trò NGOÀI lưới duy nhất được neo (Story 7.1): nút `về hôm nay` của hàng chip. Hàng chip
 *  `replaceChildren` ở mọi lượt vẽ, nên một lượt vẽ do tin từ tab khác gỡ đúng nút đang giữ tiêu
 *  điểm. Neo mang `id: null` — nút không thuộc mẩu nào. */
const VAI_VE_HOM_NAY = 've-hom-nay';

/**
 * Neo tiêu điểm hiện tại: `{ id, vaiTro }` khi nó nằm trong một mẩu, `null` khi nằm ở ngoài.
 *
 * Vai trò đọc bằng `closest` chứ không bằng phép so với chính mẩu: nút `xóa` và ô sửa là CON
 * của mẩu, và một phép thử "có phải chính mẩu không" đọc cả hai thành thân — đúng lỗi B2 của
 * retro Epic 5 (Shift+Tab sang `xóa` bị giật về thân, và `Enter` kế tiếp vào lại chế độ sửa).
 */
function neoTuTieuDiem(goc) {
  const dangDung = goc.activeElement ?? null;
  if (dangDung === null || typeof dangDung.closest !== 'function') return null;
  if (dangDung.closest(CHON_VE_HOM_NAY) !== null) return { id: null, vaiTro: VAI_VE_HOM_NAY };
  const mau = dangDung.closest(CHON_MAU);
  if (mau === null) return null;
  const id = mau.getAttribute(THUOC_TINH_MAU);
  if (dangDung.closest(CHON_XOA) !== null) return { id, vaiTro: VAI_XOA };
  if (dangDung.closest(CHON_SUA) !== null) return { id, vaiTro: VAI_SUA };
  return { id, vaiTro: VAI_THAN };
}

/**
 * Lượt vẽ GIỮ TIÊU ĐIỂM — hàm DUY NHẤT của ứng dụng vừa vẽ lại vừa TRẢ tiêu điểm về (Story 7.0,
 * gộp ba hàm `traTieuDiem` / `veGiuTieuDiem` / `dongRoiVe` cũ, retro Epic 5 B2+A2). Ngoại lệ có
 * tên duy nhất là `vaoSuaRoiVe` trong khối `document`: nó không trả tiêu điểm về chỗ cũ mà đặt
 * vào ô sửa vừa SINH RA ở chính lượt vẽ đó, kèm vị trí con trỏ.
 *
 * Một lớp lỗi, ba nguồn: nút `✕` của dải băng, hộp thoại xác nhận, và `replaceChildren` của lưới
 * đều GỠ khỏi DOM đúng phần tử đang giữ tiêu điểm ở chính lượt vẽ do chúng gây ra — và một phần
 * tử đang focus bị gỡ thì focus rơi về `<body>`, nơi `Tab` tiếp theo bắt đầu lại từ đầu trang.
 * Sản phẩm cố ý không có phím tắt, nên bàn phím là đường duy nhất và nó không được đứt. Ba bản
 * chữa riêng đã trôi khỏi nhau một lần (bản của lưới neo vào mẩu và quên vai trò); một hàm thì
 * không trôi được, và Story 7.1 thêm một nguồn vẽ lại thứ tư (bản tin từ tab khác).
 *
 * `neo` nói tiêu điểm phải về đâu SAU lượt vẽ:
 *
 * - `undefined` — giữ chỗ đang đứng. Neo chụp từ `goc.activeElement` TRƯỚC khi vẽ (sau thì
 *   phần tử đã bị gỡ và `activeElement` là `<body>`). Tiêu điểm ở ngoài mọi mẩu thì không đụng
 *   tới: `replaceChildren` của lưới không chạm được nó.
 * - `null` — về ô soạn thảo: tầng 1, thứ `autofocus` của `index.html` đã chọn, chỗ Nam làm việc.
 * - `{ id, vaiTro }` — về đúng phần tử mang vai trò đó của mẩu `id`: `'than'` là chính mẩu,
 *   `'xoa'` là nút `xóa`, `'sua'` là ô sửa (không còn ô sửa thì lấy thân).
 * - `{ id: null, vaiTro: 've-hom-nay' }` — về nút `về hôm nay` MỚI của hàng chip (Story 7.1);
 *   nhánh `undefined` tự chụp neo này khi tiêu điểm đang ở nút đó. Nút không còn → `#o-soan`.
 *
 * Tìm mẩu theo `id` (`THUOC_TINH_MAU`), không theo vị trí trong danh sách con: lượt vẽ chạy
 * `locGhiChu` lại với mốc "hôm nay" mới và khối điều kiện đang bật, nên nó có thể dựng một tập
 * mẩu KHÁC — ô thứ `i` lúc đó là một ghi chú khác hẳn. Mẩu đã mất khỏi lưới (vừa bị xóa, hay
 * trôi khỏi kết quả tìm) thì về ô soạn thảo: đẩy tiêu điểm sang một ghi chú không ai chọn còn
 * tệ hơn, và để nó rơi về `<body>` là đứt đường bàn phím.
 *
 * EXPORT để test CHẠY được nó: khối `document` bên dưới không bao giờ chạy dưới Vitest, và một
 * bộ quét regex vẫn xanh khi phép tìm đổi thành "nút xóa đầu tiên của trang".
 *
 * @param {{ activeElement?: Element|null, querySelector: Function, getElementById: Function }}
 *   goc Gốc DOM — `document` ở trình duyệt, một gốc giả ở test.
 * @param {() => void} veTatCa Lượt vẽ chung.
 * @param {{ id: string, vaiTro: 'than'|'xoa'|'sua' } | null} [neo] Chỗ trả tiêu điểm về.
 * @returns {void}
 */
export function veGiuTieuDiem(goc, veTatCa, neo) {
  const dich = neo === undefined ? neoTuTieuDiem(goc) : neo;
  // Chụp xong mới vẽ — thứ tự này là toàn bộ điểm của nhánh `undefined`.
  veTatCa();
  // Tiêu điểm đang ở ngoài mọi mẩu: lượt vẽ không chạm tới nó, nên không có gì để trả.
  if (neo === undefined && dich === null) return;
  // Nút `về hôm nay` vừa được dựng lại: về nút MỚI; nút không còn (điều kiện đã rỗng) thì về
  // `#o-soan` — không để tiêu điểm rơi về `<body>`.
  const dichMoi = phanTuTheoNeo(goc, dich);
  if (dichMoi !== null) {
    dichMoi.focus();
    return;
  }
  goc.getElementById(ID_O_SOAN)?.focus();
}

/** Phần tử mang neo trong DOM HIỆN HÀNH (sau lượt vẽ), hay `null` khi nó không còn. */
function phanTuTheoNeo(goc, dich) {
  if (dich === null) return null;
  if (dich.vaiTro === VAI_VE_HOM_NAY) return goc.querySelector(CHON_VE_HOM_NAY) ?? null;
  const mau = mauTheoId(goc, dich.id);
  return mau === null ? null : phanTuTheoVai(mau, dich.vaiTro);
}

/** Mẩu mang `id` trong lưới HIỆN HÀNH (sau lượt vẽ), hay `null`. Chỉ xét con TRỰC TIẾP của
 *  lưới; dòng "không khớp" và dòng "còn nhiều hơn" cũng là con, nhưng không mang `id` nào. */
function mauTheoId(goc, id) {
  const vungLuoi = goc.querySelector(CHON_LUOI) ?? null;
  if (vungLuoi === null) return null;
  return [...vungLuoi.children].find((moc) => moc.getAttribute(THUOC_TINH_MAU) === id) ?? null;
}

/** Phần tử mang vai trò đó trong mẩu. Ô sửa (hay nút) không còn thì lấy thân — chính mẩu. */
function phanTuTheoVai(mau, vaiTro) {
  if (vaiTro === VAI_XOA) return mau.querySelector(CHON_XOA) ?? mau;
  if (vaiTro === VAI_SUA) return mau.querySelector(CHON_SUA) ?? mau;
  return mau;
}

/**
 * Luồng xóa qua hộp thoại xác nhận (Story 5.3): bốn móc nối lưới và hộp thoại vào action của
 * lõi, kèm hai việc THỨ HAI mà chỉ tầng nối biết cách làm — gọi lượt vẽ và trả tiêu điểm.
 *
 * Nó là một hàm EXPORT chứ không là bốn closure trong khối `document` bên dưới vì một lý do: chỉ
 * như vậy thì test mới CHẠY được nó. Khối kia không bao giờ chạy dưới Vitest, và một bộ quét
 * regex trên mã nguồn thì vẫn xanh khi phép tìm nút đổi thành "nút xóa đầu tiên của trang".
 * Mọi thứ nó chạm đi vào qua tham số — `goc` là `document` ở trình duyệt, một gốc giả ở test.
 *
 * Tiêu điểm sau `hủy` và sau `xóa` về nút `xóa` của mẩu vừa được hỏi, qua `veGiuTieuDiem`: hộp
 * thoại tự gỡ mình khỏi DOM ở đúng lượt vẽ do nó gây ra. Mẩu không còn (vừa bị xóa thật) thì
 * hàm đó tự lui về ô soạn thảo.
 *
 * @param {object} store Khối state của ứng dụng.
 * @param {{ querySelector: Function, getElementById: Function }} goc Gốc DOM.
 * @param {() => void} veTatCa Lượt vẽ chung của cả sáu view.
 * @param {() => Promise<void>} [choRoiSua] Lời hứa của lượt rời chế độ sửa đang treo, hỏi lại
 *   ở MỖI lần bấm. Mặc định là một lời hứa đã chốt.
 * @returns {{ moHoi: (id: string) => Promise<void>, huy: (id: string) => void,
 *   xoa: (id: string) => Promise<void> }}
 */
export function noiLuongXoa(store, goc, veTatCa, choRoiSua = () => Promise.resolve()) {
  return {
    /**
     * Nút `xóa` của một mẩu: nó KHÔNG xóa, nó mở một câu hỏi. Và nó ĐỢI lượt rời chế độ sửa
     * đang treo (nếu có) xong trước: `blur` đi trước `click` nhưng `roiCheDoSua()` là bất đồng
     * bộ, nên mở hộp ngay là hỏi về một mẩu có thể đang trên đường bị xóa (Story 5.2) — hộp
     * NHÁY MỞ rồi tự đóng. Không có lượt nào thì lời hứa đã chốt, và sự chậm là một microtask.
     */
    moHoi(id) {
      return choRoiSua().then(() => {
        store.moXacNhanXoa(id);
        veTatCa();
      });
    },
    /** HỦY — `hủy`, `Esc` và click overlay đi chung một đường: đóng, vẽ lại, trả tiêu điểm.
     *  Không một phép ghi nào, nên không có gì để đợi. */
    huy(id) {
      store.dongXacNhanXoa();
      veGiuTieuDiem(goc, veTatCa, { id, vaiTro: VAI_XOA });
    },
    /**
     * XÓA — đóng hộp và VẼ LẠI NGAY, rồi mới xóa.
     *
     * Lượt vẽ ngay là điều kiện chứ không phải thẩm mỹ: `xoaGhiChu` ghi xuống kho trước, nên
     * trong khe chờ đó hộp thoại vẫn còn trong DOM nếu không ai gỡ nó — một cú bấm `xóa` thứ
     * hai gọi `remove` lần nữa, và một cú `hủy` cho người dùng thấy "đã hủy" rồi mẩu vẫn biến
     * mất. Tiêu điểm về nút của mẩu (nó còn sống trong khe chờ), rồi lượt vẽ thứ hai treo vào
     * LỜI HỨA của `xoaGhiChu`: ghi được thì mẩu biến mất và tiêu điểm về ô soạn thảo, ghi hỏng
     * thì mẩu còn nguyên, dải băng mang mã lỗi, và tiêu điểm ở lại đúng nút của nó.
     */
    xoa(id) {
      const neo = { id, vaiTro: VAI_XOA };
      store.dongXacNhanXoa();
      veGiuTieuDiem(goc, veTatCa, neo);
      return store.xoaGhiChu(id).then(() => veGiuTieuDiem(goc, veTatCa, neo));
    },
  };
}

/** Kênh liên tab DUY NHẤT — một adapter, dùng chung cho chiều phát (store) và chiều nghe. */
const kenh = taoBroadcast();

/** Khối state duy nhất của ứng dụng. */
export const store = taoStore(congThat());

// Nạp ghi chú từ kho bền vào RAM (AD-6) — chỉ khi đang ở trình duyệt thật.
if (typeof document !== 'undefined') {
  // `khoiDong` không bao giờ bị từ chối: nạp hỏng đi ra bằng dải băng, không bằng một lời hứa
  // treo lại. Nên không có `.catch` ở đây, và không có lời hứa nào không ai bắt.
  // ── Chế độ sửa tại chỗ (Story 5.1) ─────────────────────────────────────────────────────
  //
  // Ba móc nối lưới vào ba action của lõi, và cả ba làm một việc THỨ HAI mà chỉ file này biết
  // cách làm: gọi một lượt vẽ. Dự án không có cơ chế subscribe (xem chú thích ở
  // `view/luoi.js`), nên mọi phép đổi state xảy ra SAU một lời hứa chỉ hiện ra được nếu một
  // chỗ nối ở đây kéo theo một lượt vẽ.
  const vaoSuaRoiVe = (id, viTri) => {
    store.vaoCheDoSua(id);
    veTatCa();
    // Ô sửa chỉ tồn tại SAU lượt vẽ, nên tiêu điểm và con trỏ đặt ở đây chứ không trong view.
    const oSua = document.querySelector(CHON_SUA);
    if (oSua === null) return;
    oSua.focus();
    // Đường lui là CUỐI chữ: bàn phím không có điểm bấm, và `caretPositionFromPoint` trả `null`
    // ở khá nhiều tình huống hợp lệ. Cuối chữ là chỗ một người viết tiếp.
    const cuoi = oSua.value.length;
    const dat = typeof viTri === 'number' && viTri >= 0 && viTri <= cuoi ? viTri : cuoi;
    oSua.setSelectionRange(dat, dat);
  };
  /**
   * Lượt RỜI CHẾ ĐỘ SỬA gần nhất, ở dạng lời hứa — `Promise.resolve()` khi chưa có lượt nào.
   *
   * Nó tồn tại vì một lý do và chỉ một: `blur` chạy TRƯỚC `click`, nhưng `roiCheDoSua()` là bất
   * đồng bộ. Nên lúc cú bấm vào nút `xóa` tới nơi, lượt rời mới chỉ KHỞI ĐỘNG — và nếu ô sửa
   * rỗng thì mẩu đang trên đường bị xóa (Story 5.2) mà `notes` vẫn còn nó. Mở hộp thoại ngay
   * lúc đó là hỏi "Xóa ghi chú này?" về một mẩu vừa chết: hộp NHÁY MỞ rồi tự đóng ở lượt vẽ sau.
   *
   * Đây KHÔNG phải state thứ hai: nó không mang một thông tin nào mà state không có, nó chỉ là
   * cái móc để đợi một phép ghi đang bay — cùng loại với `.then` mà `mocSua.go` treo lượt vẽ vào.
   */
  let luotRoiSua = Promise.resolve();
  const roiSuaRoiVe = (id) => {
    // `blur` nổ cả khi phần tử bị GỠ khỏi DOM: lượt vẽ đưa mẩu B vào chế độ sửa xoá ô sửa của
    // mẩu A, và trình duyệt phát `blur` của A ngay giữa lượt vẽ đó. Một `blur` của mẩu khác là
    // tiếng vọng của một lượt vẽ, không phải một lần rời — bỏ nó.
    if (store.state.editing.id !== id) return;
    // `roiCheDoSua()` có thể xóa mẩu (chữ rỗng — Story 5.2), một phép ghi bất đồng bộ: đợi nó
    // xong trước khi vẽ lại, nếu không lưới vẽ lại bằng dữ liệu cũ (mẩu rỗng còn hiện một khắc).
    luotRoiSua = store.roiCheDoSua().then(() => {
      // Lượt vẽ HOÃN một nhịp, và `setTimeout` chứ không `requestAnimationFrame` (bộ quét của
      // `test/chuyen-dong-va-tin-hieu.test.js` chặn): `blur` chạy cùng nhịp với `mousedown`,
      // TRƯỚC `mouseup` và `click`. Vẽ ngay thì phần tử chuột vừa bấm xuống bị thay ra trước khi
      // nhả chuột, trình duyệt phát `click` lên tổ tiên chung thay vì lên mẩu — cú bấm từ mẩu A
      // sang mẩu B bị mất, và Nam phải bấm hai lần.
      //
      // Và lượt vẽ đó GIỮ tiêu điểm ở chỗ nó vừa tới (neo `undefined`): `Tab` ra khỏi ô sửa đưa
      // tiêu điểm tới một điểm dừng NẰM TRONG lưới — thân mẩu kế, hay nút `xóa` của chính mẩu
      // này khi đi `Shift+Tab` — và `replaceChildren` sắp gỡ đúng phần tử đó.
      setTimeout(() => veGiuTieuDiem(document, veTatCa));
    });
  };
  const mocSua = {
    vao: vaoSuaRoiVe,
    roi: roiSuaRoiVe,
    // Đúng MỘT lời gọi action cho mỗi phím — không vẽ lại ở phím gõ. Lượt vẽ treo vào lời hứa
    // của action, tức nó chạy khi phép ghi ĐÃ XONG hoặc ĐÃ HỎNG: đó là lúc `notes` mang chữ mới
    // (lưới phải hiện nó) hay `banner` mang một mã lỗi (dải băng phải hiện ra). `luoi.ve` tự
    // gác để `<textarea>` đang gõ không bị thay ra bởi lượt vẽ này.
    //
    // Và lượt vẽ đó GIỮ tiêu điểm (neo `undefined`, Story 7.0): rời ô sửa của một kết quả tìm
    // TRƯỚC khi hẹn `AUTOSAVE_MS` nổ thì lượt vẽ hoãn của `roi` còn thấy chữ cũ, và chính lượt vẽ
    // của `put` này mới gỡ mẩu hết khớp — cùng lúc gỡ nút `xóa` mà `Shift+Tab` vừa đặt tiêu điểm.
    go: (id, text) => {
      store.tuLuuNoiDung(id, text).then(() => veGiuTieuDiem(document, veTatCa));
    },
    // Nút `xóa` của mỗi mẩu (Story 5.3) — nó mở một câu hỏi, không xóa. Hành vi sống ở
    // `noiLuongXoa` phía trên khối này, nơi test chạy được nó; đây chỉ là chỗ cắm.
    xoa: (id) => {
      luongXoa.moHoi(id);
    },
    // Nhịp click đầu trên mẩu bị cắt (Story 8.0, retro E7 #28): mở rộng rồi vẽ lại lưới. Lượt
    // vẽ `replaceChildren` gỡ đúng cái thân đang giữ tiêu điểm, nên phải neo về thân mới của
    // chính mẩu đó — không thì `Enter` trên mẩu bị cắt thả tiêu điểm về `<body>`.
    moRong: (id) => {
      store.batTatMoRong(id);
      veGiuTieuDiem(document, veTatCa, { id, vaiTro: VAI_THAN });
    },
  };
  // ── Xóa qua hộp thoại xác nhận (Story 5.3) ─────────────────────────────────────────────
  //
  // `luotRoiSua` đi vào qua một HÀM chứ không qua giá trị: nó bị gán lại ở mỗi lần rời chế độ
  // sửa, và móc phải đợi lượt rời MỚI NHẤT, không phải lượt có lúc nối. `veTatCa` bọc lười vì
  // nó khai ở bên dưới, cùng khuôn `latRoiVe`.
  const luongXoa = noiLuongXoa(store, document, () => veTatCa(), () => luotRoiSua);
  // `undefined` cho tham số thứ ba: nguồn mốc hiện tại giữ mặc định `nowIso` của
  // `core/time.js` — chỉ test bố cục mới truyền một mốc cố định vào đó.
  const luoi = noiLuoi(store, document, undefined, mocSua);
  // Tiêu đề tab là view THỨ HAI, không phải một nhánh của lưới: con số nó hiện là số ghi chú
  // của hôm nay bất kể điều kiện đang bật, còn lưới thì vẽ đúng tập ĐANG hiển thị. Hai câu
  // hỏi khác nhau, nên hai tệp — và chúng không import nhau, chỉ file này biết cả hai.
  const tieuDe = noiTieuDe(store, document);
  // Dải băng là view THỨ BA, và nó vẽ từ đúng MỘT giá trị state (`banner`) — nên nó không
  // biết gì về lưới lẫn tiêu đề, và ngược lại. Nút `✕` gọi action đóng của lõi rồi gọi lại
  // lượt vẽ chung, đúng khuôn `sauKhiChot` của `o-soan.js`.
  //
  // Callback là một hàm khai ở đây chứ không phải thẳng `veTatCa`: `veTatCa` được khai ngay bên
  // dưới và nó phải gọi được `banner.ve`, nên hai thứ tham chiếu vòng lại nhau — một lớp bọc
  // lười là cách duy nhất không phải tách lượt vẽ của dải băng ra khỏi lượt vẽ chung. Và nó
  // còn làm một việc thứ hai mà chỉ file này biết cách làm: TRẢ FOCUS về ô soạn thảo (neo
  // `null` của `veGiuTieuDiem`) — nút `✕` tự gỡ mình khỏi DOM ở đúng lượt vẽ do nó gây ra.
  //
  // `view/banner.js` KHÔNG được biết tới ô soạn thảo: hai view không biết nhau, chỉ file này
  // biết cả hai. Chuỗi `'o-soan'` vì thế bị viết lần thứ hai ở đầu tệp (`index.html` mang bản
  // đầu), đúng khuôn trùng lặp có ý thức mà AD-19 cho phép.
  const dongRoiVe = () => veGiuTieuDiem(document, veTatCa, null);
  const banner = noiBanner(store, document, dongRoiVe);
  // Nút theme là view THỨ TƯ, và nó nối SAU ba view trên: thứ tự nối của chúng không đổi một
  // dòng. Nó vẽ từ đúng MỘT giá trị state (`theme`) và đặt `data-theme` trên `<html>` — nên nó
  // không biết gì về lưới, tiêu đề lẫn dải băng, đúng như chúng không biết gì về nó.
  //
  // `veTatCa` đi vào qua THAM SỐ, cùng khuôn `sauKhiDong` của dải băng và `sauKhiChot` của ô
  // soạn thảo: lật theme đổi state, và mọi view phải vẽ lại từ state mới.
  const latRoiVe = () => veTatCa();
  const nutTheme = noiNutTheme(store, document, latRoiVe);
  // Chân trang là view THỨ NĂM, và từ Story 4.4 nó VÀO `veTatCa`: `ve()` của nó đổ dòng nhắc
  // vào `.chan-nhac` từ `lastBackupAt`, tức nó đã có chữ của riêng mình để vẽ. Nối ở đây, sau
  // nút theme, để thứ tự nối của bốn view trên không đổi một dòng.
  //
  // Nhưng nó NHẬN lượt vẽ chung qua tham số, và chỉ chiều NẠP dùng tới: nạp đổi `notes` và đổi
  // dải băng, nên lưới, tiêu đề tab và dải băng đều phải vẽ lại — trong khi xuất không đổi một
  // trường state nào. Một lớp bọc lười vì `veTatCa` khai ngay bên dưới, cùng khuôn `latRoiVe`.
  const napRoiVe = () => veTatCa();
  const chanTrang = noiChanTrang(store, document, napRoiVe);
  // Hộp thoại xác nhận xóa là view THỨ SÁU (Story 5.3), và nó nối SAU năm view trên: thứ tự
  // nối của chúng không đổi một dòng. Nó vẽ từ `xacNhanXoa` cộng một phép đọc `notes` (mẩu được
  // hỏi có còn sống không) — nên nó không biết gì về lưới, và lưới không biết gì về nó.
  //
  // Hai móc đi vào qua THAM SỐ, cùng khuôn `sauKhiDong` của dải băng: chỉ file này biết chỗ
  // trả tiêu điểm về, và chỉ file này được phép vừa gọi action vừa gọi một lượt vẽ.
  const hopThoai = noiHopThoai(store, document, luongXoa.huy, luongXoa.xoa);
  // Khay tìm là view THỨ BẢY (Story 6.1), nối SAU sáu view trên. Nó phát `datDieuKien` mỗi phím
  // rồi gọi lượt vẽ chung — lớp bọc lười vì `veTatCa` khai ngay bên dưới, cùng khuôn `latRoiVe`.
  const khayTim = noiKhayTim(store, document, () => veTatCa());
  // Xóa điều kiện tra cứu — ĐƯỜNG DUY NHẤT, cho mọi chỗ gọi (retro Epic 6, A1). Hai nửa đi
  // cùng nhau hoặc không đi: chữ gõ dở của ô ngày KHÔNG nằm trong state, nên khi `date` vốn đã
  // `null` thì `khayTim.ve()` không thấy lần xóa nào và chữ dở ở lại trong ô. Một đường xóa mới
  // (Story 7.1 sẽ thêm) gọi hàm này, không gọi riêng một nửa — `test/luoi.test.js` ghim rằng
  // `xoaHetDieuKien(` và `xoaNhap(` mỗi thứ chỉ xuất hiện đúng một lần trong tệp này.
  //
  // `store.xoaHetDieuKien()` ở đường chốt là lần thứ hai (`chotBanNhap` đã tự xóa trong lõi).
  // Thường thì lần thứ hai đó không đổi gì vì điều kiện đã rỗng. Có một khe: điều kiện gõ vào ô
  // tìm trong lúc `commitDraft` còn đang ghi xuống kho (vài ms) cũng bị xóa theo. Khe này được
  // nhận có chủ ý (spec 7.0): đường chốt phải đi qua hàm chung.
  const xoaHetDieuKienVaNhap = () => {
    store.xoaHetDieuKien();
    khayTim.xoaNhap();
  };
  // Hàng chip là view THỨ TÁM (Story 6.3). Nút `về hôm nay` về khung nhìn mặc định trong MỘT
  // thao tác: xóa điều kiện cùng ngày gõ dở, vẽ lại, rồi trả tiêu điểm về ô soạn thảo — nút vừa
  // bấm tự biến mất ở chính lượt vẽ đó.
  const veHomNay = () => {
    xoaHetDieuKienVaNhap();
    veGiuTieuDiem(document, veTatCa, null);
  };
  const hangChip = noiHangChip(store, document, undefined, veHomNay);
  // Một callback vẽ chung cho MỌI view: đây là chỗ DUY NHẤT biết rằng "vẽ lại" nghĩa là vẽ lại
  // tất cả. Treo riêng từng cái vào từng điểm nối là cách một view mới bị quên ở một trong hai
  // chỗ, và tiêu đề sẽ đứng yên sau lần chốt mà không làm gì đỏ cả.
  //
  // `oSoan` khai ở bên dưới (nó phải nối trước `khoiDongBanNhap`, sau `veSauChot`), nhưng mọi
  // lời gọi `veTatCa` đều chạy SAU khi khối này chạy xong — trong một `.then` hay một bộ nghe
  // sự kiện — nên tham chiếu tới nó không bao giờ rơi vào vùng chết tạm thời.
  const veTatCa = () => {
    luoi.ve();
    tieuDe.ve();
    banner.ve();
    nutTheme.ve();
    chanTrang.ve();
    hopThoai.ve();
    khayTim.ve();
    hangChip.ve();
    oSoan.ve();
  };
  // `notes` nạp BẤT ĐỒNG BỘ, nên lượt vẽ đầu tiên phải chờ kho trả lời — vẽ ngay ở đây chỉ
  // dựng lại một mảng rỗng và nháy một con số sai lên thanh tab. Không có cơ chế subscribe
  // trong dự án này (và không được dựng một cái), nên cả hai lượt vẽ lại được nối TAY: một ở
  // đây, một qua `sauKhiChot` bên dưới.
  // Theme lúc tải đi vào qua THAM SỐ, đọc lại từ đúng chỗ script nội tuyến trong `<head>` vừa
  // ghi: đó là nơi DUY NHẤT đọc `ghichu.theme` lúc tải, nên lõi không đọc kho lần thứ hai và
  // không chạm `document`. Vẽ ngay sau khi gọi (chứ không chỉ trong `.then`) là thứ đưa nhãn
  // nút về đúng chiều ở khung hình đầu: `khoiDong` đặt theme ĐỒNG BỘ, `notes` mới là phần chờ.
  const themeLucTai = document.documentElement.getAttribute('data-theme');
  store.khoiDong(themeLucTai).then(veTatCa);
  // Xin lưu trữ bền ở MỌI lần khởi động (Story 8.1, AD-10). Trên Firefox lời hứa có thể resolve
  // vài phút sau, lúc Nam đang gõ — nên lượt vẽ GIỮ TIÊU ĐIỂM. Không bao giờ bị từ chối.
  store.xinLuuTruBen().then(() => veGiuTieuDiem(document, veTatCa));
  // Chiều NHẬN của kênh liên tab (Story 7.1) — người nghe DUY NHẤT, nối sau `khoiDong`. Lõi lọc
  // tin rác và tin của chính tab, đọc lại kho, rồi lượt vẽ GIỮ TIÊU ĐIỂM: bản tin đến bất đồng
  // bộ, lúc tiêu điểm có thể đang ở bất cứ đâu. `nhanBanTin` không bao giờ bị từ chối. Hàm gỡ
  // mà `subscribe` trả về không cần giữ: bộ nghe sống đúng bằng trang.
  kenh.subscribe((tin) => {
    store.nhanBanTin(tin).then(() => veGiuTieuDiem(document, veTatCa));
  });
  // Lượt vẽ ĐẦU của riêng nút theme chạy ngay, không đợi kho: `khoiDong` đặt `theme` ĐỒNG BỘ
  // (chỉ `notes` là phần bất đồng bộ), nên nhãn về đúng chiều ở khung hình đầu tiên thay vì
  // đọc `nền tối` trên một trang đang tối cho tới khi IndexedDB trả lời.
  nutTheme.ve();
  // View nối TRƯỚC khi giành bản nháp, và thứ tự đó là điều kiện: `claimDraft` là bất đồng
  // bộ, nên mọi ký tự Nam gõ trong lúc kho còn đang trả lời chỉ vào được state nếu bộ nghe
  // `input` đã gắn xong. Nối sau là một cửa sổ im lặng ở đúng giây đầu tiên của trang.
  //
  // `veTatCa` đi vào như THAM SỐ: `o-soan.js` không được import `luoi.js` hay `tieu-de.js` —
  // các view không biết nhau, chỉ file này biết cả ba.
  //
  // Chốt đã xóa điều kiện thì ô ngày cũng phải về rỗng, kể cả chữ gõ dở chưa từng vào state —
  // qua `xoaHetDieuKienVaNhap`, đường xóa duy nhất. Chốt thoát sớm (ô soạn rỗng, chữ vượt trần)
  // thì điều kiện còn nguyên, và ngày đang gõ dở cũng phải còn nguyên.
  const veSauChot = (daXoaDieuKien) => {
    if (daXoaDieuKien) xoaHetDieuKienVaNhap();
    veTatCa();
  };
  const oSoan = noiOSoan(store, document, veSauChot);
  // Bốn bước khởi động bản nháp của AD-3, cùng một cửa và cùng một lý do.
  //
  // `khoiDongBanNhap()` không bao giờ bị từ chối (hỏng thì đi ra bằng dải băng), nên `.then`
  // một vế là đủ và không có lời hứa nào không ai bắt. Đúng MỘT lần đồng bộ ở đây là đủ cho
  // cả cuộc đua: `state.js` đã bỏ kết quả giành được khi `draft.seq` đã nhảy, và
  // `dongBoTuState` so sánh trước khi gán — nên chữ Nam đang gõ luôn thắng.
  store.khoiDongBanNhap().then(oSoan.dongBoTuState);
  // Nhịp tim đặt Ở ĐÂY chứ không trong `taoStore`: một hẹn lặp dựng bên trong store sẽ sống
  // trong MỌI ca test tạo store, và không có đường nào dừng nó. Action thì "gọi mới chạy",
  // nên test gọi thẳng nó.
  setInterval(() => store.nhipTimBanNhap(), DRAFT_BEAT_MS);
}

// Các view còn lại của Epic 2+ nối vào cùng một cửa `document` ở trên, cùng một cách: nhận
// `store` qua THAM SỐ. Không module nào dưới `app/` được import lại từ file này, vì đó là
// đường vòng để `view/` kéo cả `adapters/` vào theo.
