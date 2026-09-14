// Dải băng thông báo — nơi DUY NHẤT mọi chuyện xấu (cộng đúng một chuyện tốt) hiện ra (AD-17).
//
// Ba luật của tầng view, y hệt `tieu-de.js`, `luoi.js` và `o-soan.js`, và cưỡng chế bằng test
// chứ không bằng chú thích:
//
// - View CHỈ ĐỌC state. Ở đây là đúng MỘT phép đọc (`store.state.banner`) và không một phép
//   ghi nào; phép đổi duy nhất là `store.dongDaiBang()` của lõi. Luật ưu tiên KHÔNG sống ở
//   đây: nó là bất biến của `datLai` trong `core/state.js`, vì một view không nhớ lượt trước
//   thì không có gì để so.
// - View không giữ state riêng. Không bộ nhớ thông báo đang hiện, không so với lượt trước —
//   mỗi lượt `ve()` dựng lại toàn bộ từ một phép đọc, nên không có gì để lệch.
// - View không bao giờ import `app/adapters/`, và không chạm `document` toàn cục: gốc DOM đi
//   vào qua THAM SỐ, cùng lý do `luoi.js` và `tieu-de.js` nhận nó qua tham số.
//
// Chữ hiện ra LUÔN đến từ ánh xạ microcopy đã có sẵn (`microcopyBanner` của `core/banner.js`,
// nó tra `core/errors.js` cho sáu mã lỗi): view không bao giờ tự soạn câu chữ, và không bao
// giờ hiện chuỗi lỗi thô tiếng Anh của trình duyệt (AD-18).
//
// Hình dạng là DUY NHẤT, không biến thể theo loại: một class, một nền, một viền dưới. Đổi màu
// theo mức nghiêm trọng là cách bảng bảy nguồn lặng lẽ thành bảy thành phần giao diện.
//
// Không có cơ chế subscribe trong dự án này, và tệp này KHÔNG dựng một cái: `ve` được nối tay
// ở `app/main.js`, đúng khuôn ba view kia.

import { dongDuoc, microcopyBanner } from '../core/banner.js';

/** Phần tử chủ của dải băng. Rỗng nguyên ở dạng tĩnh; mọi thứ bên trong do lượt vẽ sinh ra. */
const CHON_BANNER = '.dai-bang';

const THE_CHU = 'span';
const THE_DONG = 'button';

const LOP_CHU = 'dai-bang-chu';
const LOP_DONG = 'dai-bang-dong';

/** Nút `✕` của UX-DR-17, và nhãn chữ của UX-DR-35 — dấu `✕` một mình không đọc được bằng
 *  trình đọc màn hình, và nó cũng không phải một từ. */
const DAU_DONG = '✕';
const NHAN_DONG = 'đóng thông báo';
const THUOC_TINH_NHAN = 'aria-label';

/** `<button>` mặc định là `submit`: viết ra để nút này không bao giờ trở thành nút gửi của một
 *  form nào đó ở story sau. Cùng lý do `mau-giay.js` viết nó ra. */
const KIEU_NUT = 'button';

/**
 * Nối dải băng vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {object} [goc] Gốc để tìm phần tử — mặc định `document`. Test truyền một gốc DOM tối
 *   giản vào đây, nên tệp này không tự chạm một global nào.
 * @param {() => void} [sauKhiDong] Móc chạy SAU khi action đóng đã đổi state — `app/main.js`
 *   treo lượt vẽ chung vào đây. Là THAM SỐ chứ không phải một import, cùng lý do `sauKhiChot`
 *   của `o-soan.js` là tham số: các view không được biết nhau, chỉ `main.js` biết cả bốn.
 * @returns {{ ve: () => void }} `ve` dựng lại toàn bộ dải băng từ state.
 */
export function noiBanner(store, goc = document, sauKhiDong = () => {}) {
  // Gốc vắng mặt hẳn (`noiBanner(store, null)`) đi cùng một đường với "gốc có nhưng không có
  // phần tử": cùng khuôn `noiTieuDe`, và cùng lý do — `ve` vẫn phải gọi được.
  const bang = goc === null || goc === undefined ? null : goc.querySelector(CHON_BANNER);
  // Không có phần tử chủ thì không có gì để vẽ — và cũng không có gì để ném. `ve` vẫn phải
  // gọi được, vì `app/main.js` treo nó vào một lời hứa không bao giờ bị từ chối. Cùng khuôn
  // `noiTieuDe`, `noiLuoi` và `noiOSoan`.
  if (bang === null || bang === undefined) return { ve() {} };

  /**
   * Vẽ lại dải băng từ state.
   *
   * `replaceChildren(...)` trong MỘT lời gọi, cùng lý do `luoi.js` dùng nó: cả nội dung được
   * thay bằng một phép đổi DOM duy nhất, và ca "không có thông báo" đi qua đúng lời gọi đó —
   * vùng dải băng rỗng THẬT, không một ký tự nào, và `.dai-bang:empty` của `app/style.css`
   * làm nó không chiếm một điểm ảnh chiều cao nào.
   *
   * Một hàng CÓ trong bảng mà chưa có chữ (`NAP_FILE_XONG`, Epic 4 gắn phần tham số) cũng ra
   * rỗng: thà không nói gì còn hơn hiện một dải băng trắng không ai hiểu.
   */
  /**
   * Loại đã vẽ ra ở lượt trước. `undefined` là "chưa vẽ lần nào" — nó khác mọi giá trị hợp lệ
   * của `state.banner` (một chuỗi, hoặc `null`), nên lượt vẽ ĐẦU luôn chạy thật.
   *
   * Đây KHÔNG phải state thứ hai: nó không mang một thông tin nào mà state không có, và ném nó
   * đi thì lượt vẽ sau vẫn ra đúng cùng một DOM. Nó là bộ nhớ của phép so "có gì đổi không",
   * cùng loại với phép so `o.value === text` trong `o-soan.js` — và cần đúng vì lý do ở đó:
   * `veTatCa` chạy sau MỖI lần chốt, xóa, mở rộng, nên một `replaceChildren` vô điều kiện sẽ
   * làm trình đọc màn hình đọc lại một dải băng bền (`DB`/`QUOTA`) ở mọi thao tác.
   */
  let daVe;

  function ve() {
    const loai = store.state.banner;
    // Không đổi thì không chạm DOM. Vùng `aria-live` chỉ đọc lên khi nội dung THAY ĐỔI, nên
    // "không chạm" ở đây chính là "không đọc lại".
    if (loai === daVe) return;
    daVe = loai;
    const chu = loai === null || loai === undefined ? null : microcopyBanner(loai);
    if (chu === null || chu === undefined) {
      bang.replaceChildren();
      return;
    }

    const o = bang.ownerDocument;
    const cau = o.createElement(THE_CHU);
    cau.className = LOP_CHU;
    // `textContent` chứ không `innerHTML`: microcopy là chữ, và một câu lỗi không bao giờ
    // được thành markup — kể cả khi nó đến từ một bảng do chính dự án viết.
    cau.textContent = chu;

    // Nút `✕` CHỈ cho hàng đóng được, và cờ đó đọc từ bảng của `core/banner.js` chứ không từ
    // một danh sách chép lại ở đây: hai danh sách sẽ trôi khỏi nhau đúng vào ngày một epic
    // sau thêm người phát cho một hàng.
    if (!dongDuoc(loai)) {
      bang.replaceChildren(cau);
      return;
    }

    const nut = o.createElement(THE_DONG);
    nut.className = LOP_DONG;
    nut.type = KIEU_NUT;
    nut.textContent = DAU_DONG;
    nut.setAttribute(THUOC_TINH_NHAN, NHAN_DONG);
    // Đúng MỘT action của lõi, rồi một lượt vẽ lại nối tay. Không phím tắt nào được thêm cho
    // việc này — sản phẩm có đúng bốn phím, và `✕` đã ở trong thứ tự Tab.
    nut.addEventListener('click', () => {
      store.dongDaiBang();
      sauKhiDong();
    });

    bang.replaceChildren(cau, nut);
  }

  return { ve };
}
