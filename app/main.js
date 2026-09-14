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
// Tập cổng TẠM (Story 1.5) vẫn còn cho ba cổng chưa có adapter: đủ mọi phương thức để qua
// `kiemTraPorts`, nhưng mỗi phương thức ném khi BỊ GỌI. Hai lý do cho việc ném thay vì trả về
// `undefined`: một cổng tạm im lặng sẽ làm story sau đi gỡ lỗi một adapter chưa tồn tại, và
// nó cũng làm mọi test tương lai xanh vì lý do sai. Hai cổng kho bền thì đã có adapter thật.
//
// `khoiDong()` nằm sau một cửa `typeof document !== 'undefined'`: `test/trang-tinh.test.js`
// import động file này ở NODE để nghiệm thu rằng nó là một ES module nạp được thật, và ở đó
// không có kho dữ liệu nào. Cùng lý do đó, hai adapter mở kho LƯỜI — dựng factory không chạm
// gì cả.

import { taoNoteStore } from './adapters/indexeddb.js';
import { taoSessionStore } from './adapters/localstorage.js';
import { DRAFT_BEAT_MS } from './core/limits.js';
import { taoStore } from './core/state.js';
import { PORT_METHODS } from './ports/index.js';
import { noiLuoi } from './view/luoi.js';
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
 * Tập cổng của ứng dụng: adapter thật cho hai kho bền, cổng tạm cho ba cổng còn lại.
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
  };
}

/** Khối state duy nhất của ứng dụng. */
export const store = taoStore(congThat());

// Nạp ghi chú từ kho bền vào RAM (AD-6) — chỉ khi đang ở trình duyệt thật.
if (typeof document !== 'undefined') {
  // `khoiDong` không bao giờ bị từ chối: nạp hỏng đi ra bằng dải băng, không bằng một lời hứa
  // treo lại. Nên không có `.catch` ở đây, và không có lời hứa nào không ai bắt.
  const luoi = noiLuoi(store);
  // Tiêu đề tab là view THỨ HAI, không phải một nhánh của lưới: con số nó hiện là số ghi chú
  // của hôm nay bất kể điều kiện đang bật, còn lưới thì vẽ đúng tập ĐANG hiển thị. Hai câu
  // hỏi khác nhau, nên hai tệp — và chúng không import nhau, chỉ file này biết cả hai.
  const tieuDe = noiTieuDe(store, document);
  // Một callback vẽ chung cho cả hai view: đây là chỗ DUY NHẤT biết rằng "vẽ lại" nghĩa là
  // vẽ lại cả hai. Treo riêng từng cái vào từng điểm nối là cách một view mới bị quên ở một
  // trong hai chỗ, và tiêu đề sẽ đứng yên sau lần chốt mà không làm gì đỏ cả.
  const veTatCa = () => {
    luoi.ve();
    tieuDe.ve();
  };
  // `notes` nạp BẤT ĐỒNG BỘ, nên lượt vẽ đầu tiên phải chờ kho trả lời — vẽ ngay ở đây chỉ
  // dựng lại một mảng rỗng và nháy một con số sai lên thanh tab. Không có cơ chế subscribe
  // trong dự án này (và không được dựng một cái), nên cả hai lượt vẽ lại được nối TAY: một ở
  // đây, một qua `sauKhiChot` bên dưới.
  store.khoiDong().then(veTatCa);
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
