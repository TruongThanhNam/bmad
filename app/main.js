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
import { DRAFT_BEAT_MS } from './core/limits.js';
import { taoStore } from './core/state.js';
import { PORT_METHODS } from './ports/index.js';
import { noiBanner } from './view/banner.js';
import { noiChanTrang } from './view/chan-trang.js';
import { noiHopThoai } from './view/hop-thoai.js';
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
 * Tập cổng của ứng dụng: adapter thật cho hai kho bền, kênh liên tab và file vào/ra; cổng tạm
 * cho cổng còn lại (`quota` của Epic 8).
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
    // global nào ở Node — `test/trang-tinh.test.js` import động chính tệp này ở đó.
    channel: taoBroadcast(),
    // File vào/ra (Story 4.2 + 4.3): `taoFileIo()` chỉ dựng object, `document`/`Blob`/`URL`
    // chỉ bị hỏi tới bên trong `exportFile` và `readChosenFile` — nên dòng này cũng không chạm
    // global nào ở Node.
    fileIO: taoFileIo(),
  };
}

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
  /**
   * Lượt vẽ GIỮ TIÊU ĐIỂM — cùng lớp lỗi với `dongRoiVe`, cùng cách chữa.
   *
   * `Tab` ra khỏi ô sửa đưa tiêu điểm tới điểm dừng kế tiếp, và điểm dừng đó nay nằm TRONG lưới
   * (mọi mẩu mang `tabindex="0"` từ story này). Lượt vẽ sau đó `replaceChildren` cả lưới, tức
   * gỡ đúng phần tử vừa nhận tiêu điểm — và tiêu điểm rơi về `<body>`, nơi `Tab` tiếp theo bắt
   * đầu lại từ đầu trang. Sản phẩm cố ý không có phím tắt, nên bàn phím là đường duy nhất.
   *
   * Neo vào `id` của MẨU đang nhận tiêu điểm, không vào vị trí của nó trong danh sách con: lượt
   * vẽ này chạy `locGhiChu` lại với một mốc "hôm nay" mới và khối điều kiện đang bật, nên nó có
   * thể dựng một tập mẩu KHÁC — và lúc đó ô thứ `i` là một ghi chú khác hẳn. Mẩu biến mất khỏi
   * lưới thì KHÔNG làm gì: đẩy tiêu điểm sang một ghi chú không ai chọn còn tệ hơn để nó rơi.
   *
   * Tiêu điểm ở ngoài lưới thì cũng không phải làm gì — `replaceChildren` không chạm tới nó.
   */
  const veGiuTieuDiem = () => {
    const dangDung = document.activeElement;
    const mauDangDung = dangDung === null ? null : dangDung.closest(`[${THUOC_TINH_MAU}]`);
    const idGiu = mauDangDung === null ? null : mauDangDung.getAttribute(THUOC_TINH_MAU);
    veTatCa();
    if (idGiu === null) return;
    const vungLuoi = document.querySelector(CHON_LUOI);
    if (vungLuoi === null) return;
    const thay = [...vungLuoi.children].find(
      (moc) => moc.getAttribute(THUOC_TINH_MAU) === idGiu,
    );
    if (thay !== undefined) thay.focus();
  };
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
      setTimeout(veGiuTieuDiem);
    });
  };
  const mocSua = {
    vao: vaoSuaRoiVe,
    roi: roiSuaRoiVe,
    // Đúng MỘT lời gọi action cho mỗi phím — không vẽ lại ở phím gõ. Lượt vẽ treo vào lời hứa
    // của action, tức nó chạy khi phép ghi ĐÃ XONG hoặc ĐÃ HỎNG: đó là lúc `notes` mang chữ mới
    // (lưới phải hiện nó) hay `banner` mang một mã lỗi (dải băng phải hiện ra). `luoi.ve` tự
    // gác để `<textarea>` đang gõ không bị thay ra bởi lượt vẽ này.
    go: (id, text) => {
      store.tuLuuNoiDung(id, text).then(veTatCa);
    },
    // Nút `xóa` của mỗi mẩu (Story 5.3). Nó KHÔNG xóa: nó mở một câu hỏi, và câu hỏi đó là một
    // trường state như mọi thứ khác. Sản phẩm không có hoàn tác và không có thùng rác, nên
    // đường xóa thật phải đi qua đúng một bước xác nhận.
    // Và nó ĐỢI lượt rời chế độ sửa đang treo (nếu có) xong trước: `blur` đi trước `click`
    // nhưng `roiCheDoSua()` là bất đồng bộ, nên mở hộp ngay là hỏi về một mẩu có thể đang trên
    // đường bị xóa. Chưa có lượt nào thì `luotRoiSua` là một lời hứa đã chốt, và `.then` của nó
    // chạy ở microtask kế — không có khung hình nào nhìn thấy sự chậm đó.
    xoa: (id) => {
      luotRoiSua.then(() => {
        store.moXacNhanXoa(id);
        veTatCa();
      });
    },
  };
  // ── Xóa qua hộp thoại xác nhận (Story 5.3) ─────────────────────────────────────────────
  //
  // Ba hàm, và cả ba làm một việc THỨ HAI mà chỉ file này biết cách làm — gọi một lượt vẽ, và
  // với hai hàm đóng thì còn trả TIÊU ĐIỂM về đúng chỗ. `view/hop-thoai.js` không biết lưới
  // tồn tại, đúng như `view/banner.js` không biết ô soạn thảo tồn tại.
  /**
   * Trả tiêu điểm về nút `xóa` của mẩu vừa được hỏi, đường lui là ô soạn thảo.
   *
   * Cùng lớp lỗi với `dongRoiVe` và `veGiuTieuDiem`, cùng cách chữa: hộp thoại tự gỡ mình khỏi
   * DOM ở đúng lượt vẽ do nó gây ra, và một phần tử đang focus bị gỡ đi thì focus rơi về
   * `<body>` — `Tab` tiếp theo bắt đầu lại từ đầu trang. Sản phẩm cố ý không có phím tắt, nên
   * bàn phím là đường duy nhất và nó không được đứt.
   *
   * Neo vào `id` chứ không vào vị trí, cùng lý do với `veGiuTieuDiem`: lượt vẽ vừa chạy có thể
   * dựng một tập mẩu KHÁC. Mẩu không còn trên lưới (vừa bị xóa thật, hay trôi khỏi khung nhìn)
   * thì về ô soạn thảo — đẩy tiêu điểm sang một ghi chú không ai chọn còn tệ hơn.
   */
  const traTieuDiemVeNutXoa = (id) => {
    const vungLuoi = document.querySelector(CHON_LUOI);
    const mau =
      vungLuoi === null
        ? undefined
        : [...vungLuoi.children].find((moc) => moc.getAttribute(THUOC_TINH_MAU) === id);
    const nut = mau === undefined ? null : mau.querySelector(CHON_XOA);
    if (nut !== null && nut !== undefined) {
      nut.focus();
      return;
    }
    const o = document.getElementById(ID_O_SOAN);
    if (o !== null) o.focus();
  };
  /** HỦY — `hủy`, `Esc` và click overlay đi chung một đường: đóng, vẽ lại, trả tiêu điểm.
   *  Không một phép ghi nào, nên không có gì để đợi và lượt vẽ chạy ngay. */
  const dongHopThoaiRoiVe = (id) => {
    store.dongXacNhanXoa();
    veTatCa();
    traTieuDiemVeNutXoa(id);
  };
  /** XÓA — đóng hộp TRƯỚC, rồi xóa. Lượt vẽ treo vào LỜI HỨA của `xoaGhiChu` (khuôn `mocSua.go`
   *  ngay trên): dự án không có subscribe, nên `notes` mất một mẩu — hay dải băng mang một mã
   *  lỗi vì kho từ chối — chỉ hiện ra được ở đó. Ghi hỏng thì mẩu còn nguyên trên lưới, và tiêu
   *  điểm về lại đúng nút `xóa` của nó. */
  const xoaRoiVe = (id) => {
    store.dongXacNhanXoa();
    store.xoaGhiChu(id).then(() => {
      veTatCa();
      traTieuDiemVeNutXoa(id);
    });
  };
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
  // còn làm một việc thứ hai mà chỉ file này biết cách làm: TRẢ FOCUS.
  //
  // Nút `✕` tự gỡ mình khỏi DOM ở đúng lượt vẽ do nó gây ra, và một phần tử đang focus bị gỡ
  // đi thì focus rơi về `<body>` — người dùng bàn phím mất chỗ đứng, và `Tab` tiếp theo bắt
  // đầu lại từ đầu trang. Sản phẩm cố ý KHÔNG có phím tắt, nên bàn phím là đường duy nhất và
  // nó không được đứt. Ô soạn thảo là chỗ trả về đúng: nó là tầng 1, là thứ `autofocus` của
  // `index.html` đã chọn lúc tải, và là chỗ Nam đang làm việc.
  //
  // `view/banner.js` KHÔNG được biết tới ô soạn thảo: hai view không biết nhau, chỉ file này
  // biết cả bốn. Chuỗi `'o-soan'` vì thế bị viết lần thứ hai ở đây (`index.html` mang bản đầu),
  // đúng khuôn trùng lặp có ý thức mà AD-19 cho phép.
  const ID_O_SOAN = 'o-soan';
  const dongRoiVe = () => {
    veTatCa();
    const o = document.getElementById(ID_O_SOAN);
    if (o !== null) o.focus();
  };
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
  const hopThoai = noiHopThoai(store, document, dongHopThoaiRoiVe, xoaRoiVe);
  // Một callback vẽ chung cho cả SÁU view: đây là chỗ DUY NHẤT biết rằng "vẽ lại" nghĩa là
  // vẽ lại cả sáu. Treo riêng từng cái vào từng điểm nối là cách một view mới bị quên ở một
  // trong hai chỗ, và tiêu đề sẽ đứng yên sau lần chốt mà không làm gì đỏ cả.
  const veTatCa = () => {
    luoi.ve();
    tieuDe.ve();
    banner.ve();
    nutTheme.ve();
    chanTrang.ve();
    hopThoai.ve();
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
  const oSoan = noiOSoan(store, document, veTatCa);
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
