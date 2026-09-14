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
import { localTime } from '../core/time.js';

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

/** Nhãn của nút xóa — nguyên văn microcopy đã chốt, chữ thường, không dấu chấm. */
const NHAN_XOA = 'xóa';

/** Hai nửa của dòng gấp. `N` chèn vào giữa `còn` và `dòng`; mũi tên cho biết chiều sắp xảy ra. */
const GAP_TRUOC = 'còn ';
const GAP_SAU = ' dòng ▾';
const NHAN_THU_LAI = 'thu lại ▴';

/** Ký tự xuống dòng — ranh giới của một DÒNG LOGIC. Đếm theo nó chứ không theo dòng hiển thị:
 *  số dòng hiển thị chỉ có nghĩa sau khi layout chạy, và view không được đo layout để suy ra
 *  state. Hệ quả đã chấp nhận: một đoạn dài không xuống dòng bị trần CSS cắt mà KHÔNG có dòng
 *  `còn N dòng ▾` — suy giảm có ý thức của story này, không phải khiếm khuyết. */
const XUONG_DONG = '\n';

/** `tabindex` của mẩu bị cắt: chỉ mẩu CÓ hành vi mới vào thứ tự Tab. */
const TAB_CO = '0';

/** `tabindex` của nút xóa: nó tồn tại về mặt HÌNH DẠNG ở story này (hộp thoại xác nhận và phép
 *  xóa thật là Epic 5), nên nó không được chiếm một điểm dừng bàn phím dẫn tới không đâu. */
const TAB_KHONG = '-1';

const THUOC_TINH_TAB = 'tabindex';

/** Hai phím "kích hoạt" của một điều khiển tùy biến. Mẩu bị cắt vào thứ tự Tab, nên nó PHẢI mở
 *  được bằng bàn phím: một điểm dừng Tab chỉ mở được bằng chuột là một điểm dừng dẫn tới không
 *  đâu. `' '` là `key` của phím cách, và nó cuộn trang theo mặc định — phải chặn. */
const PHIM_MO = ['Enter', ' '];
/** `<button>` mặc định là `submit`; ngoài một `<form>` thì nó vô hại, nhưng viết ra để nút này
 *  không bao giờ trở thành nút gửi của một form nào đó ở story sau. */
const KIEU_NUT = 'button';

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
 * Vẽ MỘT mẩu giấy.
 *
 * @param {{ id: string, createdAt: string, text: string }} note Bản ghi ghi chú.
 * @param {Document} ownerDocument Tài liệu dựng phần tử — đi vào qua tham số, không qua global.
 * @param {boolean} dangMoRong Mẩu này có đang mở rộng không (đọc từ `store.state.expandedIds`).
 * @param {() => void} khiClick Gọi khi người dùng click một mẩu BỊ CẮT. Mẩu không bị cắt không
 *   gắn bộ nghe nào: "click mẩu ngắn không đổi gì cả" là một luật, và cách chắc nhất giữ nó là
 *   không có gì để chạy.
 * @returns {Element} Phần tử mẩu giấy, sẵn sàng cho `replaceChildren`.
 */
export function veMau(note, ownerDocument, dangMoRong, khiClick) {
  const mau = ownerDocument.createElement(THE_MAU);
  mau.className = LOP_MAU;

  const dau = ownerDocument.createElement(THE_DAU);
  dau.className = LOP_DAU;

  const gio = ownerDocument.createElement(THE_GIO);
  gio.className = LOP_GIO;
  // `localTime` ném với một `createdAt` hỏng, và nó được để ném: một mẩu vẽ ra với ô giờ rỗng
  // là một bản ghi hỏng trong kho đi qua mà không ai biết.
  gio.textContent = localTime(note);

  const xoa = ownerDocument.createElement(THE_XOA);
  xoa.className = LOP_XOA;
  xoa.type = KIEU_NUT;
  xoa.setAttribute(THUOC_TINH_TAB, TAB_KHONG);
  xoa.textContent = NHAN_XOA;
  // Chặn nổi bọt NGAY TẠI NÚT. Không có dòng này thì một cú click vào `xóa` chạy tiếp lên thẻ
  // mẩu và bật/tắt mở rộng — tức nút "chỉ có hình dạng" lại có một hiệu ứng quan sát được, và
  // là một hiệu ứng không ai chờ đợi từ một nút xóa. Đây KHÔNG phải nối hành vi cho nút: nó
  // vẫn không làm gì cả, nó chỉ không làm việc của thứ khác.
  xoa.addEventListener('click', (suKien) => suKien.stopPropagation());

  dau.append(gio, xoa);

  const than = ownerDocument.createElement(THE_THAN);
  than.className = dangMoRong ? `${LOP_THAN} ${LOP_THAN_MO}` : LOP_THAN;
  // `textContent` chứ không `innerHTML`, và đó là một luật: chữ của Nam KHÔNG BAO GIỜ được
  // thành markup. `'<b>x</b>'` phải hiện ra nguyên văn như chữ, và `textContent` giữ nguyên
  // mọi ký tự xuống dòng cho `white-space: pre-wrap` của CSS xử.
  than.textContent = note.text;

  mau.append(dau, than);

  // Chỉ mẩu BỊ CẮT mới có dòng gấp, mới vào thứ tự Tab, và mới nghe click. Ba thứ đi cùng nhau
  // vì chúng là cùng một câu: mẩu này có một hành vi.
  const duDaiDeCat = soDong(note.text) > COLLAPSED_LINES;
  if (duDaiDeCat) {
    const gap = ownerDocument.createElement(THE_GAP);
    gap.className = LOP_GAP;
    gap.textContent = dangMoRong
      ? NHAN_THU_LAI
      : `${GAP_TRUOC}${soDong(note.text) - COLLAPSED_LINES}${GAP_SAU}`;
    mau.append(gap);
    mau.setAttribute(THUOC_TINH_TAB, TAB_CO);
    mau.addEventListener('click', khiClick);
    // Bàn phím đi cùng chuột, không sau nó: mẩu đã vào thứ tự Tab thì Enter và phím cách phải
    // làm đúng việc mà một cú click làm. `preventDefault` chỉ chạy trên đúng hai phím đó —
    // phím cách mặc định cuộn trang, và cuộn lưới đi một màn hình mỗi lần mở một mẩu là hỏng
    // đúng lời hứa "mở TẠI CHỖ".
    mau.addEventListener('keydown', (suKien) => {
      if (!PHIM_MO.includes(suKien.key)) return;
      suKien.preventDefault();
      khiClick();
    });
  }

  return mau;
}
