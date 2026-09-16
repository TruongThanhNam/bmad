// Hai link chân trang — story này nối hành vi cho ĐÚNG MỘT trong hai (Story 4.2).
//
// Ba luật của tầng view, y hệt `nut-theme.js`:
//
// - View CHỈ ĐỌC state, và ở đây nó còn không đọc gì cả: xuất sao lưu không đổi một trường
//   state nào, nên `ve()` là một hàm rỗng và `app/main.js` cố ý KHÔNG đưa nó vào `veTatCa()` —
//   vẽ lại cả bốn view cho một lần không có gì đổi là đúng đường một nháy giao diện lọt vào
//   một thao tác đã hứa im lặng tuyệt đối. Nó vẫn được trả ra vì hình dạng `{ ve() }` là khuôn
//   chung của mọi view, và vì Story 4.4 sẽ có việc cho nó: đổ chữ vào `.chan-nhac` từ
//   `lastBackupAt`. Tới lúc ấy — và chỉ lúc ấy — `main.js` mới treo nó vào lượt vẽ chung.
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
// Story 4.3 gắn nốt `#chan-nap`, và HAI LINK KHÔNG ĐỐI XỨNG — đây là khác biệt thật giữa
// chúng, không phải một chỗ viết thiếu:
//
// - `#chan-xuat` KHÔNG vẽ lại gì: xuất sao lưu không đổi một trường state nào.
// - `#chan-nap` PHẢI vẽ lại đầy đủ: nạp đổi `notes` (lưới, tiêu đề tab) VÀ đổi dải băng — nó
//   là thao tác thành công duy nhất của sản phẩm được phép nói một câu (AD-16, hàng 6 của
//   AD-17). Nên `app/main.js` đưa lượt vẽ chung xuống đây qua THAM SỐ `sauKhiNap`, đúng khuôn
//   `sauKhiDong` của dải băng và `sauKhiChot` của ô soạn thảo.
//
// Story 4.4 đừng đọc điều đó thành một luật chung: chân trang vẫn CỐ Ý đứng ngoài `veTatCa()`,
// và nó chỉ vào lượt vẽ chung khi có chữ của riêng mình để vẽ (dòng nhắc từ `lastBackupAt`).
//
// Và KHÔNG `.catch` ở cả hai: `xuatSaoLuu()` lẫn `napSaoLuu()` không bao giờ bị từ chối — mọi
// nhánh hỏng của chúng đi ra bằng state, không bằng một lời hứa treo lại.

/** Link xuất sao lưu, mang `id` từ `index.html`. */
const CHON_XUAT = '#chan-xuat';

/** Link nạp lại, mang `id` từ `index.html`. */
const CHON_NAP = '#chan-nap';

/**
 * Nối chân trang vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {Document} [doc] Tài liệu mang hai link — mặc định `document`. Test truyền một tài
 *   liệu tối giản vào đây, nên tệp này không tự chạm một global nào.
 * @param {() => void} [sauKhiNap] Móc chạy SAU khi phép nạp đã đổi state — `app/main.js` treo
 *   lượt vẽ chung vào đây. Là THAM SỐ chứ không phải một import, cùng lý do `sauKhiDong` của
 *   dải băng là tham số: các view không được biết nhau, chỉ `main.js` biết cả năm.
 * @returns {{ ve: () => void }} `ve` không làm gì và CHƯA ai gọi nó: chân trang không vẽ từ
 *   state nào ở story này. Nó là chỗ đặt sẵn cho Story 4.4 (dòng nhắc từ `lastBackupAt`).
 */
export function noiChanTrang(store, doc = document, sauKhiNap = () => {}) {
  // Tài liệu vắng mặt hẳn đi cùng một đường với "có tài liệu nhưng không có link": cùng khuôn
  // `noiNutTheme`, và cùng lý do — `ve` vẫn phải gọi được.
  const tim = (chon) => (doc === null || doc === undefined ? null : doc.querySelector(chon));
  const nutXuat = tim(CHON_XUAT);
  const nutNap = tim(CHON_NAP);

  // Hai link gắn ĐỘC LẬP, không cùng một cửa trả sớm: một tài liệu chỉ có một trong hai (test
  // tối giản, hay một `index.html` bị sửa) vẫn phải gắn được cái còn lại. Gác chung là cách
  // nút nạp chết im lặng vì một lý do không liên quan gì tới nó.
  if (nutXuat !== null && nutXuat !== undefined) {
    // Đúng MỘT action của lõi, và KHÔNG một lượt vẽ lại nào sau nó: xuất sao lưu không đổi
    // state, nên gọi `veTatCa` ở đây là vẽ lại cả bốn view cho một lần không có gì đổi — và đó
    // cũng chính là đường một nháy giao diện lọt vào một thao tác đã hứa im lặng tuyệt đối.
    nutXuat.addEventListener('click', () => {
      store.xuatSaoLuu();
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

  return { ve() {} };
}
