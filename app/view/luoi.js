// Lưới ghi chú — mắt nhìn thấy thứ vừa được chốt xuống.
//
// Ba luật của tầng view, y hệt `o-soan.js` và cưỡng chế bằng test chứ không bằng chú thích:
//
// - View CHỈ ĐỌC state. Ở đây là đúng hai phép đọc (`store.state.notes`, `store.state.dieuKien`)
//   và không một phép ghi nào. Phép LỌC không sống ở đây: nó là `locGhiChu` của `core/query.js`,
//   nên nó kiểm được mà không cần DOM lẫn đồng hồ.
// - View không giữ state riêng. Không danh sách đã vẽ, không tập `expandedIds`, không bộ nhớ đệm —
//   mỗi lượt `ve()` dựng lại toàn bộ danh sách con từ state, nên không có gì để lệch.
// - View không bao giờ import `app/adapters/`. Nó nhận `store` qua THAM SỐ.
//
// Không có cơ chế subscribe trong dự án này, và story này KHÔNG dựng một cái: `ve` được nối
// tay ở `app/main.js` vào đúng hai chỗ — kho nạp xong, và sau mỗi lần chốt.
//
// "Hôm nay" tính lại ở MỖI lượt vẽ (`mocHienTai()` chạy trong `ve`, không một lần lúc nối):
// chốt mốc lúc tải trang thì một ghi chú chốt sau nửa đêm sẽ không hiện ra — tức phá đúng lời
// hứa "mẩu giấy nhô lên là bằng chứng duy nhất". Cái giá đã nhận: tab mở qua 00:00 thì lượt vẽ
// đầu tiên của ngày mới quét sạch mẩu hôm qua khỏi lưới. Dữ liệu vẫn nguyên trong kho — chúng
// chỉ ra khỏi KHUNG NHÌN, và không có hẹn giờ nửa đêm nào được dựng cho một ca hiếm như vậy.
//
// Hình dạng đầy đủ của mẩu giấy — giờ tạo, cắt bớt, mở rộng, nút xóa — sống ở `mau-giay.js`
// (Story 2.5), không ở đây. Chia việc như vậy để tệp này giữ đúng MỘT trách nhiệm: chọn hiển
// thị cái gì, theo thứ tự nào. "Hiển thị ra sao" là câu hỏi khác, và nó kiểm được từng mẩu một
// mà không cần cả lưới.

import { locGhiChu } from '../core/query.js';
import { nowIso } from '../core/time.js';
import { veMau } from './mau-giay.js';

/** Lưới trong DOM. Phần tử rỗng nguyên ở dạng tĩnh; mọi ô do lượt vẽ sinh ra lúc chạy. */
const CHON_LUOI = '.luoi';

/**
 * Nối lưới vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {object} [goc] Gốc để tìm phần tử — mặc định `document`. Test truyền một gốc DOM tối
 *   giản vào đây, nên tệp này không tự chạm một global nào.
 * @param {() => string} [mocHienTai] Nguồn mốc hiện tại, mặc định `nowIso` của `core/time.js`.
 *   Là HÀM chứ không phải một chuỗi: nó phải được hỏi lại ở mỗi lượt vẽ.
 * @returns {{ ve: () => void }} `ve` dựng lại toàn bộ ô của lưới từ state.
 */
export function noiLuoi(store, goc = document, mocHienTai = nowIso) {
  const luoi = goc.querySelector(CHON_LUOI);
  // Không có lưới thì không có gì để vẽ — và cũng không có gì để ném. `ve` vẫn phải gọi được,
  // vì `app/main.js` treo nó vào một lời hứa không bao giờ bị từ chối. Cùng khuôn `noiOSoan`.
  if (luoi === null || luoi === undefined) return { ve() {} };

  /**
   * Vẽ lại lưới từ state.
   *
   * `replaceChildren(...)` trong MỘT lời gọi, không phải một vòng `append`: nó thay cả danh
   * sách con bằng một phép đổi DOM duy nhất, nên không có khung hình nào lưới rỗng giữa chừng.
   *
   * Hình dạng từng mẩu là việc của `veMau`; ở đây chỉ có hai phép ĐỌC state đi vào nó —
   * `notes`/`dieuKien` cho tập hiển thị, `expandedIds` cho cờ mở rộng — và một handler gọi
   * đúng MỘT action của lõi rồi vẽ lại. Không có cơ chế subscribe trong dự án này (và không
   * được dựng một cái), nên lượt vẽ sau khi mở/thu được nối tay ngay tại đây.
   */
  function ve() {
    const hienThi = locGhiChu(store.state.notes, store.state.dieuKien, mocHienTai());
    const dangMo = store.state.expandedIds;
    const o = hienThi.map((note) =>
      veMau(note, luoi.ownerDocument, dangMo.includes(note.id), () => {
        store.batTatMoRong(note.id);
        ve();
      }),
    );
    // Danh sách rỗng cũng đi qua đúng lời gọi này: lưới sạch trơn, KHÔNG một chữ nào. Trạng
    // thái rỗng có lời nhắn là Story 2.6, và một dòng chữ "chưa có gì" thêm ở đây sẽ phải gỡ.
    luoi.replaceChildren(...o);
  }

  return { ve };
}
