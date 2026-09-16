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
// `#chan-nap` CỐ Ý không được gắn gì: Story 4.3 sở hữu toàn bộ chiều nạp, và một handler tạm ở
// đây (dù chỉ để "chưa làm") là một cửa thứ hai cho phép gộp dễ sai nhất của ứng dụng.
//
// Và KHÔNG `.catch`: `xuatSaoLuu()` không bao giờ bị từ chối — cả hai nhánh của nó im lặng.

/** Link xuất sao lưu, mang `id` từ `index.html`. */
const CHON_XUAT = '#chan-xuat';

/**
 * Nối chân trang vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {Document} [doc] Tài liệu mang hai link — mặc định `document`. Test truyền một tài
 *   liệu tối giản vào đây, nên tệp này không tự chạm một global nào.
 * @returns {{ ve: () => void }} `ve` không làm gì và CHƯA ai gọi nó: chân trang không vẽ từ
 *   state nào ở story này. Nó là chỗ đặt sẵn cho Story 4.4 (dòng nhắc từ `lastBackupAt`).
 */
export function noiChanTrang(store, doc = document) {
  // Tài liệu vắng mặt hẳn đi cùng một đường với "có tài liệu nhưng không có link": cùng khuôn
  // `noiNutTheme`, và cùng lý do — `ve` vẫn phải gọi được.
  const nutXuat = doc === null || doc === undefined ? null : doc.querySelector(CHON_XUAT);
  if (nutXuat === null || nutXuat === undefined) return { ve() {} };

  // Đúng MỘT action của lõi, và KHÔNG một lượt vẽ lại nào sau nó: xuất sao lưu không đổi state,
  // nên gọi `veTatCa` ở đây là vẽ lại cả bốn view cho một lần không có gì đổi — và đó cũng
  // chính là đường một nháy giao diện lọt vào một thao tác đã hứa im lặng tuyệt đối.
  nutXuat.addEventListener('click', () => {
    store.xuatSaoLuu();
  });

  return { ve() {} };
}
