// Nút đổi bảng màu ở chân trang — chỗ DUY NHẤT theme trở thành chữ (Story 3.3).
//
// Ba luật của tầng view, y hệt `tieu-de.js`, `banner.js`, `luoi.js` và `o-soan.js`:
//
// - View CHỈ ĐỌC state. Ở đây là đúng MỘT phép đọc (`store.state.theme`); phép đổi duy nhất là
//   `store.datTheme(...)` của lõi, và chính lõi ghi xuống kho cấu hình. Tệp này không bao giờ
//   chạm `localStorage` — nhãn nút là một HÀM của state (AD-19), không phải một biến closure.
// - View không giữ state riêng. Không nhớ chiều đang bật, không so với lượt trước — mỗi lượt
//   `ve()` tính lại nhãn và thuộc tính từ đầu, nên không có gì để lệch.
// - View không import `app/adapters/`, và không chạm `document` toàn cục: tài liệu đi vào qua
//   THAM SỐ, cùng lý do ba view kia nhận nó qua tham số.
//
// KHÔNG phím tắt cho theme, và đó là một lệnh cấm chứ không phải một chỗ chưa làm (UX-DR-26):
// sản phẩm có đúng bốn phím. Nút đã nằm trong thứ tự Tab nhờ thứ tự DOM, nên `Enter` chạy được
// nó — nhưng đó là hành vi mặc định của `<button>`, không phải một bộ nghe bàn phím nào ở đây.
//
// Và KHÔNG hoạt ảnh: Story 3.4 sở hữu luật chuyển động. Đổi theme ở đây là một khung hình.

/** Nút đã có sẵn trong `index.html` — story này nối hành vi, không dựng lại hình dạng. */
const CHON_NUT = '.nut-theme';

/** Thuộc tính mang bảng màu, và nó CHỈ sống trên `<html>` — `app/style.css` chỉ nhìn ở đó. */
const THUOC_TINH_THEME = 'data-theme';

/**
 * Nhãn CHỮ của từng chiều, theo UX-DR-20 nguyên văn. Nhãn nói NƠI SẼ TỚI, không nói nơi đang
 * đứng: một nút hành động đọc là một mệnh lệnh. Không icon mặt trời/mặt trăng — một hình vẽ
 * không nói được điều đó, và trình đọc màn hình không đọc được nó.
 */
const NHAN = Object.freeze({ light: 'nền tối', dark: 'nền sáng' });

/** Chiều ngược lại của một bảng màu. Một cú bấm là một phép LẬT, không phải một hộp chọn. */
const NGUOC_LAI = Object.freeze({ light: 'dark', dark: 'light' });

/**
 * Nối nút theme vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {Document} [doc] Tài liệu mang nút và `<html>` — mặc định `document`. Test truyền một
 *   tài liệu tối giản vào đây, nên tệp này không tự chạm một global nào.
 * @param {() => void} [sauKhiLat] Móc chạy SAU khi action đã đổi state — `app/main.js` treo
 *   lượt vẽ chung vào đây. Là THAM SỐ chứ không phải một import, cùng lý do `sauKhiDong` của
 *   `banner.js`: các view không được biết nhau, chỉ `main.js` biết cả năm.
 * @returns {{ ve: () => void }} `ve` đặt lại nhãn nút và `data-theme` từ state.
 */
export function noiNutTheme(store, doc = document, sauKhiLat = () => {}) {
  // Tài liệu vắng mặt hẳn đi cùng một đường với "có tài liệu nhưng không có nút": cùng khuôn
  // `noiBanner` và `noiTieuDe`, và cùng lý do — `ve` vẫn phải gọi được, vì `app/main.js` treo
  // nó vào một lời hứa không bao giờ bị từ chối.
  const nut = doc === null || doc === undefined ? null : doc.querySelector(CHON_NUT);
  if (nut === null || nut === undefined) return { ve() {} };

  /** Bảng màu đang bật theo state, kẹp về một trong hai nhãn đã biết. */
  function themeHienTai() {
    return store.state.theme === 'dark' ? 'dark' : 'light';
  }

  /**
   * Đặt lại nhãn nút và `data-theme` từ state.
   *
   * Thuộc tính đặt trên `<html>` chứ không trên `<body>` hay trên nút: hai khối token của
   * `app/style.css` treo trên `:root`, và script nội tuyến trong `<head>` cũng viết vào đúng
   * chỗ đó. Hai nơi ghi cùng một thuộc tính là hai bảng màu cùng lúc.
   */
  function ve() {
    const theme = themeHienTai();
    // `textContent` chứ không `innerHTML`: nhãn là chữ, và một nhãn không bao giờ thành markup.
    nut.textContent = NHAN[theme];
    const goc = doc.documentElement;
    if (goc !== null && goc !== undefined) goc.setAttribute(THUOC_TINH_THEME, theme);
  }

  // Đúng MỘT action của lõi, rồi một lượt vẽ lại nối tay — cùng khuôn nút `✕` của `banner.js`.
  // Vẽ lại đặt trong `.then` chứ không ngay sau lời gọi: `datTheme` ghi xuống kho TRƯỚC rồi mới
  // đổi state, nên vẽ ngay sẽ vẽ lại đúng state cũ và nhãn đứng yên một lượt. Lời hứa đó không
  // bao giờ bị từ chối (hỏng thì đi ra bằng dải băng), nên không có `.catch` ở đây.
  nut.addEventListener('click', () => {
    store.datTheme(NGUOC_LAI[themeHienTai()]).then(sauKhiLat);
  });

  return { ve };
}
