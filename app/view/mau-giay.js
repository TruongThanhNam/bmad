// Mẩu giấy — hình dạng của MỘT thứ đã ghi (Story 2.5).
//
// Ba luật của tầng view, y hệt `o-soan.js` và `luoi.js`, và cưỡng chế bằng test chứ không bằng
// chú thích:
//
// - View CHỈ ĐỌC state. Tệp này còn không nhìn thấy `store`: nó nhận một BẢN GHI, một cờ mở
//   rộng và một hàm gọi lại. Phép đổi state duy nhất nằm trong `store.batTatMoRong` của lõi, và
//   chỗ gọi nó là `luoi.js`.
// - View không giữ state riêng. Không bộ nhớ đệm phần tử, không cờ `dangMo` cấp module —
//   trạng thái mở rộng tới đây qua tham số, mỗi lượt vẽ một lần.
// - View không bao giờ import `app/adapters/`, và không chạm `document` toàn cục: `ownerDocument`
//   đi vào qua THAM SỐ, cùng lý do `luoi.js` dùng `luoi.ownerDocument`.
//
// Không số literal nào (AD-14): ngưỡng cắt là `COLLAPSED_LINES` của `core/limits.js`, và trần
// chiều cao hiển thị là một token của `app/style.css`. Hai nơi, có chủ ý — không có cách nào cho
// CSS đọc một hằng JS mà không dựng một đường ghi style từ view, thứ luật tầng view cấm. Một ca
// Vitest đọc cả hai và ghim rằng chúng không trôi khỏi nhau.
//
// Không `new Date` (AD-4): giờ hiển thị tới từ `localTime` của `core/time.js`, nơi DUY NHẤT
// được dựng và cắt một mốc thời gian. Một `createdAt` hỏng ném `TypeError` ở đó — sập ồn ào,
// không phải một ô giờ rỗng rồi im lặng.

import { COLLAPSED_LINES } from '../core/limits.js';
import { khoangKhop } from '../core/query.js';
import { localDateTime, localTime } from '../core/time.js';

/** Class của ô lưới, và cùng lúc là class của mẩu giấy. Nó ở lại nguyên tên của Story 2.4:
 *  `luoi.js` vẫn thay cả danh sách con bằng đúng những phần tử mang class này, và thứ Story 2.5
 *  thêm vào là VẬT LIỆU treo trên nó — nền giấy, dải keo, bóng nổi — chứ không phải một tên mới. */
const LOP_MAU = 'o-luoi';

const THE_MAU = 'div';
const THE_DAU = 'div';
const THE_GIO = 'span';
const THE_XOA = 'button';
const THE_THAN = 'div';
const THE_GAP = 'div';

const LOP_DAU = 'mau-dau';
const LOP_GIO = 'mau-gio';
const LOP_XOA = 'mau-xoa';
const LOP_THAN = 'mau-than';
/** Cờ "đang mở rộng" treo trên THÂN mẩu: nó gỡ trần chiều cao, không đổi gì khác. */
const LOP_THAN_MO = 'mau-than-mo';
const LOP_GAP = 'mau-gap';

/** Thẻ và class của phần chữ KHỚP từ khóa (Story 6.1). */
const THE_KHOP = 'mark';
const LOP_KHOP = 'mau-khop';

/** Thẻ và class của ô sửa tại chỗ (Story 5.1) — nó THAY thân mẩu, không nằm cạnh. */
const THE_SUA = 'textarea';
const LOP_SUA = 'mau-sua';

/** Thuộc tính chở `id` của mẩu đang sửa, đọc từ DOM.
 *
 *  Nó không phải trang trí: `app/view/luoi.js` gác lượt vẽ bằng nó (đang sửa mẩu nào mà DOM ĐÃ
 *  có ô sửa của đúng mẩu đó thì không thay danh sách con), và `app/main.js` tìm ô sửa vừa mở
 *  bằng nó. Giữ `id` trong một biến của view là đúng cái state thứ hai mà AD-1 cấm. */
export const THUOC_TINH_SUA = 'data-sua';

/** Cùng một thuộc tính, viết ở dạng mệnh đề chọn. EXPORT để `luoi.js` và `main.js` dùng lại
 *  chứ không khai lại: tên viết ở ba chỗ là ba chỗ có thể trôi khỏi nhau, và khi nó trôi thì
 *  phép gác không-vẽ-lại lặng lẽ tắt (gõ ngược) còn tiêu điểm lặng lẽ rơi về `<body>`. */
export const CHON_SUA = `[${THUOC_TINH_SUA}]`;

/** Thuộc tính chở `id` của MỌI mẩu — kể cả mẩu không ở chế độ sửa.
 *
 *  `app/main.js` neo tiêu điểm vào nó khi phải vẽ lại lưới: neo theo VỊ TRÍ trong danh sách con
 *  là sai ngay khi lượt vẽ đó dựng một tập mẩu khác (bộ lọc đang bật, hay nửa đêm vừa trôi qua
 *  giữa hai lượt vẽ) — tiêu điểm sẽ nhảy sang một ghi chú khác. */
export const THUOC_TINH_MAU = 'data-mau';

/** Nhãn của ô sửa cho trình đọc màn hình. Một `<textarea>` không nhãn là một ô không tên —
 *  `index.html` đã cho ô soạn thảo đúng một cái như vậy. */
const THUOC_TINH_NHAN = 'aria-label';
const NHAN_SUA = 'nội dung ghi chú';

/** Nhãn của nút xóa — nguyên văn microcopy đã chốt, chữ thường, không dấu chấm. */
const NHAN_XOA = 'xóa';

/** Nút xóa ở dạng mệnh đề chọn. EXPORT để `app/main.js` tìm lại đúng nút vừa bấm mà TRẢ TIÊU
 *  ĐIỂM sau khi hộp thoại đóng (Story 5.3) — tiền lệ `CHON_SUA` ngay trên, và cùng lý do: một
 *  bản chép tay của cái tên là chỗ tiêu điểm lặng lẽ rơi về `<body>` vào ngày ai đó đổi tên. */
export const CHON_XOA = `.${LOP_XOA}`;

/** Hai nửa của dòng gấp. `N` chèn vào giữa `còn` và `dòng`; mũi tên cho biết chiều sắp xảy ra. */
const GAP_TRUOC = 'còn ';
const GAP_SAU = ' dòng ▾';
const NHAN_THU_LAI = 'thu lại ▴';

/** Ký tự xuống dòng — ranh giới của một DÒNG LOGIC. Đếm theo nó chứ không theo dòng hiển thị:
 *  số dòng hiển thị chỉ có nghĩa sau khi layout chạy, và view không được đo layout để suy ra
 *  state. Hệ quả đã chấp nhận: một đoạn dài không xuống dòng bị trần CSS cắt mà KHÔNG có dòng
 *  `còn N dòng ▾` — suy giảm có ý thức của story này, không phải khiếm khuyết. */
const XUONG_DONG = '\n';

/** `tabindex` của MỌI mẩu: từ Story 5.1 mọi mẩu đều có một hành vi — click để vào chế độ sửa —
 *  nên mọi mẩu là một điểm dừng bàn phím.
 *
 *  Đây là một lần RENEGOTIATE có ghi chép, không một lần lách: QĐ-2 của Story 3.2 ghim "chỉ mẩu
 *  BỊ CẮT mang `tabindex`", và nó ghim đúng trạng thái lúc đó — mẩu ngắn KHÔNG có hành vi nào.
 *  Nay nó có, và một hành vi chỉ mở được bằng chuột là một hành vi không tồn tại với bàn phím.
 *  `test/focus-va-tab.test.js` mang chú thích của lần đổi này ở đúng ca QĐ-2.
 *
 *  Mẩu ĐANG sửa là ngoại lệ, và đó là điều kiện: ô sửa là một `<textarea>`, nên nó tự là điểm
 *  dừng. Để `tabindex` trên mẩu bọc thì `Tab` phải đi qua hai điểm dừng cho một thứ; và để bộ
 *  nghe `keydown` ở đó thì `Enter` cùng phím cách bị ăn mất ngay trong ô đang gõ. */
const TAB_CO = '0';

const THUOC_TINH_TAB = 'tabindex';

/** Hai phím "kích hoạt" của một điều khiển tùy biến. Mẩu bị cắt vào thứ tự Tab, nên nó PHẢI mở
 *  được bằng bàn phím: một điểm dừng Tab chỉ mở được bằng chuột là một điểm dừng dẫn tới không
 *  đâu. `' '` là `key` của phím cách, và nó cuộn trang theo mặc định — phải chặn. */
const PHIM_MO = ['Enter', ' '];
/** `<button>` mặc định là `submit`; ngoài một `<form>` thì nó vô hại, nhưng viết ra để nút này
 *  không bao giờ trở thành nút gửi của một form nào đó ở story sau. */
const KIEU_NUT = 'button';

/** Khung nhìn mặc định: không tô, mốc `HH:mm`. */
const TIM_RONG = Object.freeze({ keyword: null, dayDu: false });

/**
 * Số dòng logic của một nội dung.
 *
 * @param {string} text Nội dung ghi chú.
 * @returns {number} Số dòng logic — luôn ≥ 1, kể cả với chuỗi rỗng.
 */
export function soDong(text) {
  return text.split(XUONG_DONG).length;
}

/**
 * Vị trí con trỏ suy từ ĐIỂM BẤM, hay `null` khi không suy được.
 *
 * Hai API cho cùng một câu hỏi và không trình duyệt nào có cả hai:
 * `caretPositionFromPoint` (chuẩn, Firefox/Chromium mới) và `caretRangeFromPoint` (WebKit và
 * Chromium cũ). Cả hai đều có thể trả `null` ngay trên một điểm hợp lệ, nên mọi nhánh ra `null`
 * và chỗ gọi có đường lui là CUỐI chữ.
 *
 * Node trả về PHẢI nằm trong thân mẩu, và phép kiểm đó là toàn bộ điểm của hàm này: bộ nghe
 * `click` gắn trên cả phần tử mẩu, nên một cú bấm vào dòng giờ tạo cho một `offset` tính trong
 * chuỗi `"09:05"` — rồi `offset` đó được áp vào TOÀN VĂN ghi chú, tức con trỏ nhảy sai chỗ mà
 * không ai giải thích được.
 *
 * @param {Document} ownerDocument Tài liệu chứa điểm bấm.
 * @param {Element} than Thân mẩu — node dưới điểm bấm phải nằm trong nó.
 * @param {object} [suKien] Sự kiện chuột. Vắng mặt (bàn phím) → `null`.
 * @returns {number|null}
 */
export function viTriConTroTuDiem(ownerDocument, than, suKien) {
  if (suKien === null || suKien === undefined) return null;
  const { clientX, clientY } = suKien;
  if (typeof clientX !== 'number' || typeof clientY !== 'number') return null;

  let node = null;
  let viTri = null;
  if (typeof ownerDocument.caretPositionFromPoint === 'function') {
    const diem = ownerDocument.caretPositionFromPoint(clientX, clientY);
    if (diem === null || diem === undefined) return null;
    node = diem.offsetNode;
    viTri = diem.offset;
  } else if (typeof ownerDocument.caretRangeFromPoint === 'function') {
    const pham = ownerDocument.caretRangeFromPoint(clientX, clientY);
    if (pham === null || pham === undefined) return null;
    node = pham.startContainer;
    viTri = pham.startOffset;
  } else {
    return null;
  }

  if (typeof viTri !== 'number') return null;
  if (node === null || node === undefined) return null;
  // Node PHẢI là một node CHỮ. Cả hai API trả `offset` theo chính node chúng trả về: với một
  // node chữ đó là một vị trí KÝ TỰ (thứ đang cần), nhưng với một node PHẦN TỬ — chuyện xảy ra
  // khi điểm bấm rơi vào khoảng đệm, hay vào khoảng trống sau dòng cuối — nó là CHỈ SỐ CON. Một
  // chỉ số con đọc thành vị trí ký tự cho ra con trỏ ở ký tự thứ 0 hay thứ 1 của cả ghi chú.
  // Hằng so sánh lấy từ chính node (`Node` là global của DOM, và tệp này không chạm global nào).
  if (node.nodeType !== node.TEXT_NODE) return null;
  // `contains` tính cả chính phần tử, nên một cú bấm vào khoảng đệm của thân mẩu vẫn đi qua.
  if (typeof than.contains !== 'function') return null;
  if (!than.contains(node)) return null;
  // Thân có phần khớp được tô (Story 6.1) bị chia thành nhiều node chữ + `<mark>`, và `offset`
  // chỉ tính trong node vừa bấm: cộng độ dài mọi node chữ ĐỨNG TRƯỚC nó trong thân.
  let truoc = 0;
  const duyet = (nut) => {
    if (nut === node) return true;
    if (nut.nodeType === node.TEXT_NODE) {
      truoc += nut.textContent.length;
      return false;
    }
    for (const con of nut.childNodes ?? []) if (duyet(con)) return true;
    return false;
  };
  duyet(than);
  return truoc + viTri;
}

/**
 * Ô sửa cao khít nội dung — cùng phép đo với `caoTheoNoiDung` của `o-soan.js`, cùng lý do.
 *
 * Hàm này được EXPORT và gọi từ `luoi.js` SAU `replaceChildren`, không gọi ngay lúc dựng phần
 * tử: `scrollHeight` của một phần tử còn RỜI khỏi DOM là `0`, nên đo lúc dựng sẽ ghim
 * `block-size: 0px` và ô sửa mở ra vô hình cho tới phím đầu tiên.
 *
 * @param {Element} o Ô sửa (`<textarea class="mau-sua">`).
 * @returns {void}
 */
export function caoTheoNoiDungSua(o) {
  if (o === null || o === undefined) return;
  // `block-size` về `auto` TRƯỚC khi đọc `scrollHeight`: một ô đang bị ghim chiều cao có
  // `scrollHeight` bằng đúng chiều cao đó, nên bỏ bước này là ô chỉ cao lên và không co lại.
  o.style.blockSize = 'auto';
  // `box-sizing: border-box` đếm cả viền mà `scrollHeight` thì không — hiệu số được ĐO, không
  // viết thành số, nên luật CSS đổi thì nó tự đúng theo.
  const vienTrenDuoi = o.offsetHeight - o.clientHeight;
  o.style.blockSize = `${o.scrollHeight + vienTrenDuoi}px`;
}

/** Thân mẩu ở dạng CHỮ CHẾT — hình dạng mặc định của một thứ đã chốt. */
function veThanChu(note, ownerDocument, dangMoRong, keyword) {
  const than = ownerDocument.createElement(THE_THAN);
  than.className = dangMoRong ? `${LOP_THAN} ${LOP_THAN_MO}` : LOP_THAN;
  // Text node và `<mark>` chứ không `innerHTML`, và đó là một luật: chữ của Nam KHÔNG BAO GIỜ
  // được thành markup. `'<b>x</b>'` phải hiện ra nguyên văn như chữ, và node chữ giữ nguyên mọi
  // ký tự xuống dòng cho `white-space: pre-wrap` của CSS xử.
  //
  // Khoảng khớp tính ở lõi trên `textFolded` và cắt thẳng trên `text`: `fold` giữ độ dài.
  const khoang = keyword === null ? [] : khoangKhop(note.textFolded, keyword);
  if (khoang.length === 0) {
    than.textContent = note.text;
    return than;
  }
  let den = 0;
  for (const [dau, cuoi] of khoang) {
    if (dau > den) than.append(ownerDocument.createTextNode(note.text.slice(den, dau)));
    const khop = ownerDocument.createElement(THE_KHOP);
    khop.className = LOP_KHOP;
    khop.textContent = note.text.slice(dau, cuoi);
    than.append(khop);
    den = cuoi;
  }
  if (den < note.text.length) than.append(ownerDocument.createTextNode(note.text.slice(den)));
  return than;
}

/**
 * Thân mẩu ở CHẾ ĐỘ SỬA — một `<textarea>` mượn nguyên ngôn ngữ vật liệu của ô soạn thảo.
 *
 * Hàm riêng chứ không một nhánh `if` trong `veMau`, và đó là một điều kiện chứ không thẩm mỹ:
 * `test/focus-va-tab.test.js` SUY RA tập điều khiển focusable từ chính mã nguồn bằng cách nối
 * `const x = …createElement(T)` với `x.className = L`. Một phần tử dựng qua `let` rồi gán thì
 * bộ quét không thấy — tức `.mau-sua` sẽ không được cửa "mọi điều khiển đều có vòng sáng" phủ,
 * trong im lặng.
 */
function veThanSua(note, ownerDocument, sua) {
  const oSua = ownerDocument.createElement(THE_SUA);
  oSua.className = LOP_SUA;
  oSua.setAttribute(THUOC_TINH_SUA, note.id);
  oSua.setAttribute(THUOC_TINH_NHAN, NHAN_SUA);
  // `value`, KHÔNG `textContent`: với một `<textarea>` thì `textContent` đặt nội dung MẶC ĐỊNH
  // chứ không đặt chữ đang hiện.
  oSua.value = sua.text;
  // Đúng MỘT lời gọi action cho mỗi phím, và không gì khác — khuôn `o-soan.js`. Debounce, số
  // đếm `seq` và dải băng khi ghi hỏng đều đã nằm trong `store.tuLuuNoiDung`, nên dựng lại một
  // nửa nào của chúng ở đây là dựng đường đổi state thứ hai.
  //
  // KHÔNG gọi một lượt vẽ ở đây: `luoi.js` sẽ `replaceChildren` cả lưới, tức thay chính
  // `<textarea>` đang gõ và đưa con trỏ về đầu — triệu chứng sẽ là "gõ ngược".
  oSua.addEventListener('input', () => {
    sua.go(oSua.value);
    caoTheoNoiDungSua(oSua);
  });
  // Đổi bề rộng cửa sổ là NGẮT DÒNG LẠI, y như ở ô soạn thảo: chiều cao đã ghim lúc gõ không
  // còn đúng và những dòng mọc thêm bị `overflow: hidden` kẹp mất. Cửa sổ lấy qua CHÍNH tài
  // liệu đi vào bằng tham số, không qua một global.
  //
  // Và nó được GỠ lúc mất tiêu điểm, khác `o-soan.js`: ô soạn thảo có đúng một phần tử sống
  // suốt vòng đời trang, còn ô sửa bị `replaceChildren` thay ra ở mỗi lần rời chế độ sửa — một
  // bộ nghe không gỡ sẽ ở lại trên cửa sổ và ghim một `<textarea>` đã rời DOM, mỗi lần sửa một
  // cái. Mất tiêu điểm LÀ lúc ô sắp bị thay ra, nên nó là chỗ gỡ đúng.
  const cuaSo = ownerDocument.defaultView ?? null;
  const doLaiTheoCuaSo = () => caoTheoNoiDungSua(oSua);
  if (cuaSo !== null) cuaSo.addEventListener('resize', doLaiTheoCuaSo);
  oSua.addEventListener('blur', () => {
    if (cuaSo !== null) cuaSo.removeEventListener('resize', doLaiTheoCuaSo);
    sua.roi();
  });
  return oSua;
}

/**
 * Vẽ MỘT mẩu giấy.
 *
 * @param {{ id: string, createdAt: string, text: string }} note Bản ghi ghi chú.
 * @param {Document} ownerDocument Tài liệu dựng phần tử — đi vào qua tham số, không qua global.
 * @param {boolean} dangMoRong Mẩu này có đang mở rộng không (đọc từ `store.state.expandedIds`).
 * @param {(viTri: number|null) => void} khiClick Gọi khi người dùng click (hay bấm `Enter`/phím
 *   cách trên) THÂN mẩu. `viTri` là vị trí con trỏ suy từ điểm bấm, hay `null` khi không suy
 *   được — chỗ gọi quyết định nhịp này là "mở rộng" hay "vào chế độ sửa". Mẩu ĐANG sửa không
 *   gắn bộ nghe nào: ô sửa là một `<textarea>` và nó tự lo phần bàn phím.
 * @param {{ text: string, go: (text: string) => void, roi: () => void } | null} [sua] Khác
 *   `null` thì mẩu này đang ở CHẾ ĐỘ SỬA: thân mẩu là một `<textarea>` mang `text`, mỗi phím gõ
 *   gọi `go`, và mất tiêu điểm gọi `roi`.
 * @param {() => void} [khiGap] Gọi khi người dùng click DÒNG GẤP. Mặc định là `khiClick` để chỗ
 *   gọi cũ không phải đổi; `luoi.js` truyền một móc riêng vì nhãn `thu lại ▴` phải THU mẩu lại,
 *   không vào chế độ sửa.
 * @param {(id: string) => void} [khiXoa] Gọi khi người dùng bấm nút `xóa` (Story 5.3). Vắng mặt
 *   thì nút vẫn vẽ ra và vẫn chặn nổi bọt, chỉ không phát gì — đường của test bố cục, cùng
 *   khuôn `mocSua` vắng mặt ở `luoi.js`. Nó KHÔNG xóa gì: nó mở hộp thoại xác nhận, và chỗ nối
 *   quyết định điều đó.
 * @param {{ keyword: string | null, dayDu: boolean }} [tim] Hai phép ĐỌC của Story 6.1, do
 *   `luoi.js` truyền xuống từ `dieuKien`: `keyword` để tô phần khớp, `dayDu` (đang có điều
 *   kiện) để hiện mốc `dd/MM/yyyy HH:mm` thay cho `HH:mm`. Vắng mặt thì như khung nhìn mặc định.
 * @returns {Element} Phần tử mẩu giấy, sẵn sàng cho `replaceChildren`.
 */
export function veMau(
  note,
  ownerDocument,
  dangMoRong,
  khiClick,
  sua = null,
  khiGap = khiClick,
  khiXoa = undefined,
  tim = TIM_RONG,
) {
  const mau = ownerDocument.createElement(THE_MAU);
  mau.className = LOP_MAU;
  mau.setAttribute(THUOC_TINH_MAU, note.id);

  const dau = ownerDocument.createElement(THE_DAU);
  dau.className = LOP_DAU;

  const gio = ownerDocument.createElement(THE_GIO);
  gio.className = LOP_GIO;
  // `localTime` ném với một `createdAt` hỏng, và nó được để ném: một mẩu vẽ ra với ô giờ rỗng
  // là một bản ghi hỏng trong kho đi qua mà không ai biết.
  gio.textContent = tim.dayDu ? localDateTime(note) : localTime(note);

  const xoa = ownerDocument.createElement(THE_XOA);
  xoa.className = LOP_XOA;
  xoa.type = KIEU_NUT;
  // KHÔNG `tabindex="-1"` nữa (Story 5.3): nút nay có hành vi thật — nó mở hộp thoại xác nhận —
  // và đây là đường xóa DUY NHẤT của sản phẩm. Một hành vi chỉ bấm được bằng chuột là một hành
  // vi không tồn tại với bàn phím. Thứ tự Tab trong mỗi mẩu vì thế là THÂN rồi NÚT XÓA, đúng
  // thứ tự DOM và không một `tabindex` dương nào.
  xoa.textContent = NHAN_XOA;
  // Chặn nổi bọt NGAY TẠI NÚT, rồi mới phát móc của nó. Không có vế đầu thì một cú click vào
  // `xóa` chạy tiếp lên thẻ mẩu và vừa mở hộp thoại vừa bật/tắt mở rộng (hay vào chế độ sửa) —
  // hai chuyện cho một cú bấm.
  xoa.addEventListener('click', (suKien) => {
    suKien?.stopPropagation?.();
    khiXoa?.(note.id);
  });

  dau.append(gio, xoa);

  const dangSua = sua !== null && sua !== undefined;

  // Thân mẩu: một `<div>` chữ chết, hay một `<textarea>` gõ được. MỘT trong hai, không bao giờ
  // cả hai — ô sửa THAY thân mẩu, nên không có lúc nào cùng một nội dung nằm ở hai chỗ.
  const than = dangSua
    ? veThanSua(note, ownerDocument, sua)
    : veThanChu(note, ownerDocument, dangMoRong, tim.keyword);

  mau.append(dau, than);

  // Dòng gấp chỉ có mặt khi mẩu BỊ CẮT — nó là con số "còn bao nhiêu dòng chưa thấy", và với
  // một mẩu không bị cắt thì con số đó là không.
  const duDaiDeCat = soDong(note.text) > COLLAPSED_LINES;
  if (duDaiDeCat) {
    const gap = ownerDocument.createElement(THE_GAP);
    gap.className = LOP_GAP;
    gap.textContent = dangMoRong
      ? NHAN_THU_LAI
      : `${GAP_TRUOC}${soDong(note.text) - COLLAPSED_LINES}${GAP_SAU}`;
    // Chặn nổi bọt NGAY TẠI DÒNG GẤP, đúng khuôn nút `xóa`: nhãn `thu lại ▴` phải THU mẩu lại,
    // và để cú bấm chạy tiếp lên thẻ mẩu là để nó vào chế độ sửa thay vì thu.
    gap.addEventListener('click', (suKien) => {
      suKien?.stopPropagation?.();
      khiGap();
    });
    mau.append(gap);
  }

  // MỌI mẩu vào thứ tự Tab và nghe click, vì từ Story 5.1 mọi mẩu có một hành vi: click để sửa.
  // Mẩu ĐANG sửa là ngoại lệ duy nhất — xem chú thích của `TAB_CO`.
  if (!dangSua) {
    mau.setAttribute(THUOC_TINH_TAB, TAB_CO);
    mau.addEventListener('click', (suKien) => {
      khiClick(viTriConTroTuDiem(ownerDocument, than, suKien));
    });
    // Bàn phím đi cùng chuột, không sau nó: mẩu đã vào thứ tự Tab thì Enter và phím cách phải
    // làm đúng việc mà một cú click làm. `preventDefault` chỉ chạy trên đúng hai phím đó —
    // phím cách mặc định cuộn trang, và cuộn lưới đi một màn hình mỗi lần mở một mẩu là hỏng
    // đúng lời hứa "mở TẠI CHỖ". Bàn phím không có điểm bấm, nên con trỏ về CUỐI chữ (`null`).
    mau.addEventListener('keydown', (suKien) => {
      // CHỈ phím gõ trên CHÍNH thẻ mẩu, không phím nổi bọt lên từ một điều khiển bên trong.
      //
      // Từ Story 5.3 nút `xóa` là một điểm dừng bàn phím NẰM TRONG mẩu, nên `Enter` và phím
      // cách bấm trên nút cũng nổi bọt tới đây. Không có dòng này thì một phím trên nút làm HAI
      // việc (mở hộp thoại VÀ đưa mẩu vào chế độ sửa) — và tệ hơn: `preventDefault` ngay dưới
      // nuốt luôn phép kích hoạt mặc định của `<button>`, nên phím cách KHÔNG mở được hộp thoại
      // nữa. Đường bàn phím mà story này vừa mở ra sẽ hỏng ngay ở nước đi đầu tiên.
      if (suKien.target !== mau) return;
      if (!PHIM_MO.includes(suKien.key)) return;
      suKien.preventDefault();
      khiClick(null);
    });
  }

  return mau;
}
