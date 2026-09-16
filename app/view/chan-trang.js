// Chân trang: hai link, và dòng nhắc thụ động về lần sao lưu gần nhất (Story 4.1–4.4).
//
// Ba luật của tầng view, y hệt `nut-theme.js`:
//
// - View CHỈ ĐỌC state — và từ Story 4.4 nó CÓ đọc: `ve()` lấy `store.state.lastBackupAt` rồi
//   hỏi `core/backup.js` xem có câu nào để nói không. Câu chữ lẫn phép đo ngày đều sống ở lõi;
//   tệp này chỉ đổ một chuỗi đã dựng sẵn vào `.chan-nhac`, hoặc dọn nó về `''`. Vì thế
//   `app/main.js` bây giờ treo chân trang vào `veTatCa()` — chú thích cũ nói ngược lại là của
//   4.2, khi `ve()` còn rỗng.
// - View không giữ state riêng: không cờ "đang xuất", không nhớ lần xuất trước. Phép gác một
//   cú bấm thứ hai KHÔNG nằm ở đây — spec đã chốt rằng hai lần bấm cho hai file, mỗi file một
//   `exportedAt` riêng, nên không có gì để nhớ giữa hai lần.
// - View không import `app/adapters/`, và `document` đi vào qua THAM SỐ.
//
// Chọn theo `id` chứ không theo thứ tự hay `textContent`: `.chan-link` khớp cả hai nút, và một
// `querySelectorAll(...)[0]` sẽ im lặng gắn hành vi xuất vào nút nạp đúng hôm ai đó đảo thứ tự
// hai link. Nhãn thì càng không — một chuỗi tiếng Việt trong bộ chọn là chỗ đổi microcopy làm
// gãy hành vi.
//
// Story 4.3 gắn nốt `#chan-nap`, và HAI LINK VẪN KHÔNG ĐỐI XỨNG, chỉ khác chỗ so với 4.2:
//
// - `#chan-nap` PHẢI vẽ lại ĐẦY ĐỦ: nạp đổi `notes` (lưới, tiêu đề tab) VÀ đổi dải băng — nó
//   là thao tác thành công duy nhất của sản phẩm được phép nói một câu (AD-16, hàng 6 của
//   AD-17). Nên `app/main.js` đưa lượt vẽ chung xuống đây qua THAM SỐ `sauKhiNap`, đúng khuôn
//   `sauKhiDong` của dải băng và `sauKhiChot` của ô soạn thảo.
// - `#chan-xuat` vẽ lại ĐÚNG CHÂN TRANG, không cả bốn view. RENEGOTIATE CÓ GHI CHÉP (Story
//   4.4): chú thích của 4.2 nói nó "KHÔNG vẽ lại gì", vì hồi đó xuất sao lưu không đổi một
//   trường state nào. Bây giờ nó đổi `lastBackupAt`, nên "im lặng tuyệt đối" không còn đồng
//   nghĩa với "không vẽ lại" — dòng nhắc còn đứng đó sau một lần xuất vừa thành công là một
//   lời nói dối. Lượt vẽ đó không sinh một thông báo nào; nó chỉ GỠ một dòng chữ đi, nên AD-16
//   vẫn nguyên. Và nó vẽ lại CHÍNH nó chứ không gọi `veTatCa` vì đó là view duy nhất có gì để
//   đổi — kéo cả lưới và dải băng vào là đúng đường một nháy giao diện lọt vào đây.
//
// Và KHÔNG `.catch` ở cả hai: `xuatSaoLuu()` lẫn `napSaoLuu()` không bao giờ bị từ chối — mọi
// nhánh hỏng của chúng đi ra bằng state, không bằng một lời hứa treo lại.

import { cauNhacSaoLuu } from '../core/backup.js';

/** Link xuất sao lưu, mang `id` từ `index.html`. */
const CHON_XUAT = '#chan-xuat';

/** Link nạp lại, mang `id` từ `index.html`. */
const CHON_NAP = '#chan-nap';

/** Chỗ đứng của dòng nhắc. Theo CLASS chứ không `id`: `index.html` viết nó như vậy, và nó là
 *  một mẩu chữ chứ không phải một điều khiển có danh tính. */
const CHON_NHAC = '.chan-nhac';

/**
 * Nối chân trang vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {Document} [doc] Tài liệu mang hai link — mặc định `document`. Test truyền một tài
 *   liệu tối giản vào đây, nên tệp này không tự chạm một global nào.
 * @param {() => void} [sauKhiNap] Móc chạy SAU khi phép nạp đã đổi state — `app/main.js` treo
 *   lượt vẽ chung vào đây. Là THAM SỐ chứ không phải một import, cùng lý do `sauKhiDong` của
 *   dải băng là tham số: các view không được biết nhau, chỉ `main.js` biết cả năm.
 * @returns {{ ve: () => void }} `ve` đổ dòng nhắc vào `.chan-nhac` từ `store.state.lastBackupAt`
 *   — `app/main.js` gọi nó trong `veTatCa()`, và handler nút xuất gọi nó sau lời hứa. Tài liệu
 *   không có chỗ đứng (test tối giản) thì nó không làm gì và không ném.
 */
export function noiChanTrang(store, doc = document, sauKhiNap = () => {}) {
  // Tài liệu vắng mặt hẳn đi cùng một đường với "có tài liệu nhưng không có link": cùng khuôn
  // `noiNutTheme`, và cùng lý do — `ve` vẫn phải gọi được.
  const tim = (chon) => (doc === null || doc === undefined ? null : doc.querySelector(chon));
  const nutXuat = tim(CHON_XUAT);
  const nutNap = tim(CHON_NAP);
  const choNhac = tim(CHON_NHAC);

  /**
   * Đổ dòng nhắc vào chỗ đứng, hoặc dọn sạch nó.
   *
   * `textContent` chứ không `innerHTML`: câu nhắc là CHỮ, và một cửa dựng HTML ở đây là một cửa
   * không có lý do tồn tại. Không có gì để nói thì `''` chứ không phải một khoảng trắng hay một
   * dấu gạch: `.chan-nhac:empty { display: none }` của `app/style.css` là thứ giữ chân trang
   * khỏi một khoảng `gap` ma, và một node chỉ chứa khoảng trắng phá đúng hợp đồng đó.
   *
   * Không ẩn/hiện bằng tay, không `hidden`, không `style.display`: CSS đã làm việc đó theo nội
   * dung, nên ở đây chỉ có một đường duy nhất và nó không thể lệch khỏi cái CSS đang thấy.
   */
  function veNhac() {
    if (choNhac === null || choNhac === undefined) return;
    choNhac.textContent = cauNhacSaoLuu(store.state.lastBackupAt) ?? '';
  }

  // Hai link gắn ĐỘC LẬP, không cùng một cửa trả sớm: một tài liệu chỉ có một trong hai (test
  // tối giản, hay một `index.html` bị sửa) vẫn phải gắn được cái còn lại. Gác chung là cách
  // nút nạp chết im lặng vì một lý do không liên quan gì tới nó.
  if (nutXuat !== null && nutXuat !== undefined) {
    // Đúng MỘT action của lõi, rồi ĐÚNG MỘT lượt vẽ của riêng chân trang — không phải
    // `veTatCa`. Xuất sao lưu đổi đúng một trường (`lastBackupAt`), và trường đó chỉ có một
    // người đọc là dòng nhắc ngay đây; kéo lưới, tiêu đề và dải băng vào là một nháy giao diện
    // trong một thao tác đã hứa im lặng.
    //
    // Vẽ SAU khi lời hứa hoàn tất, không ngay sau lời gọi: mốc chỉ vào state sau khi cổng file
    // đã nhận và kho cấu hình đã ghi xong. Một lượt vẽ đồng bộ ở đây vẽ lại đúng cái đang có.
    // Và vẫn KHÔNG `.catch`: `xuatSaoLuu()` không bao giờ bị từ chối, ở cả hai nhánh.
    nutXuat.addEventListener('click', () => {
      store.xuatSaoLuu().then(veNhac);
    });
  }

  if (nutNap !== null && nutNap !== undefined) {
    // Vẽ lại SAU khi lời hứa hoàn tất, không ngay sau lời gọi: `napSaoLuu` đọc file, đọc kho
    // rồi ghi kho — mọi thứ đáng vẽ đều nằm sau ba phép bất đồng bộ đó. Một lượt vẽ đồng bộ ở
    // đây vẽ lại đúng cái đang có trên màn hình.
    //
    // Phép gác bấm-hai-lần KHÔNG nằm ở đây: nó là cờ trong closure của `core/state.js`, vì
    // view không giữ state riêng — và vì một cửa gác ở tầng vẽ không bảo vệ được một bất biến
    // của kho.
    nutNap.addEventListener('click', () => {
      store.napSaoLuu().then(sauKhiNap);
    });
  }

  return { ve: veNhac };
}
