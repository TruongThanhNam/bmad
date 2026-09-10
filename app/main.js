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
// Story 1.5 nối một tập cổng TẠM: đủ mọi phương thức để qua `kiemTraPorts`, nhưng mỗi
// phương thức ném khi BỊ GỌI. Hai lý do cho việc ném thay vì trả về `undefined`: một cổng
// tạm im lặng sẽ làm Story 1.6 đi gỡ lỗi một adapter chưa tồn tại, và nó cũng làm mọi test
// tương lai xanh vì lý do sai. Story 1.6 thay tập cổng này bằng adapter thật; các view của
// Epic 2+ được nối vào ngay dưới đây.

import { taoStore } from './core/state.js';
import { PORT_METHODS } from './ports/index.js';

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

/** Khối state duy nhất của ứng dụng. */
export const store = taoStore(congTam());

// Story 1.6+ nối adapter thật và render lần đầu ở đây, dùng `store` ở trên. View nhận store
// qua tham số — không module nào dưới `app/` được import lại từ file này, vì đó là đường vòng
// để `view/` kéo cả `adapters/` vào theo.
