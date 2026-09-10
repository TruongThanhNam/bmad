// Phép kiểm hình dạng cổng lúc chạy — chốt chặn duy nhất bắt được adapter nối sai (AD-2).
//
// Vì sao có tệp này chứ không chỉ có JSDoc: `app/adapters/` KHÔNG có test tự động (theo
// thiết kế — chúng mỏng, và bằng chứng của chúng là một danh sách thử tay trong README).
// Nghĩa là không có gì cưỡng chế rằng một adapter thật hiện thực đủ chữ ký nó nhận. Không
// có phép kiểm này, một phương thức bị đặt sai tên không lộ ra lúc khởi động mà lộ ra giữa
// một giao dịch đang ghi, dưới dạng "không phải một hàm" — sai chỗ, sai lúc, và mất chữ.
//
// Nên `taoStore(ports)` gọi `kiemTraPorts` TRƯỚC KHI làm bất cứ việc gì khác, và thông báo
// nêu đúng tên cổng cùng tên phương thức còn thiếu.
//
// Gộp mọi thiếu sót vào MỘT thông báo, không ném ở cái thiếu đầu tiên: người vừa viết một
// adapter mới thường thiếu vài phương thức cùng lúc, và sửa từng lần một là chạy lại năm lần.
//
// Bảng dưới đây không tự gõ lại tên phương thức — nó gộp năm danh sách do chính các tệp
// chữ ký xuất ra, nên chữ ký và phép kiểm không thể trôi khỏi nhau.
//
// Tệp này là `ports/` thuần: chỉ import các tệp chữ ký cùng thư mục, không chạm global.

import { CHANNEL_METHODS } from './channel.js';
import { FILE_IO_METHODS } from './file-io.js';
import { NOTE_STORE_METHODS } from './note-store.js';
import { QUOTA_METHODS } from './quota.js';
import { SESSION_STORE_METHODS } from './session-store.js';

/**
 * Năm cổng lõi cần thế giới cung cấp, và các phương thức bắt buộc của từng cổng.
 *
 * Đóng băng để một story sau không gán lén thêm một cổng thứ sáu mà không đi qua một tệp
 * chữ ký có JSDoc.
 */
export const PORT_METHODS = Object.freeze({
  noteStore: NOTE_STORE_METHODS,
  sessionStore: SESSION_STORE_METHODS,
  channel: CHANNEL_METHODS,
  fileIO: FILE_IO_METHODS,
  quota: QUOTA_METHODS,
});

/** Tên năm cổng, theo đúng thứ tự bảng trên. */
export const PORT_NAMES = Object.freeze(Object.keys(PORT_METHODS));

// Chép tại chỗ từ `core/time.js` có chủ ý: một helper dựng thông điệp lỗi dùng chung sẽ là
// một phụ thuộc giữa `ports/` và `core/` chỉ để tiết kiệm hai dòng.
function moTa(giaTri) {
  return typeof giaTri === 'string' ? JSON.stringify(giaTri) : String(giaTri);
}

/** Một cổng phải là object mang các hàm — hàm và mảng thì không phải. */
function laObjectCong(giaTri) {
  return typeof giaTri === 'object' && giaTri !== null && !Array.isArray(giaTri);
}

/**
 * Kiểm rằng `ports` mang đủ năm cổng và mỗi cổng đủ phương thức của nó.
 *
 * Trả về chính `ports` khi hợp lệ, để chỗ gọi viết được `const p = kiemTraPorts(ports)`.
 * Thiếu bất cứ gì thì ném `TypeError` nêu **mọi** chỗ thiếu, mỗi chỗ dạng `cong.phuongThuc`.
 *
 * @param {object} ports Tập hiện thực cổng do `app/main.js` nối vào.
 * @returns {object} Chính `ports`.
 */
export function kiemTraPorts(ports) {
  if (!laObjectCong(ports)) {
    throw new TypeError(`ports phải là một object mang năm cổng, nhận được ${moTa(ports)}`);
  }
  const thieu = [];
  for (const tenCong of PORT_NAMES) {
    const cong = ports[tenCong];
    if (!laObjectCong(cong)) {
      thieu.push(`${tenCong} (nhận được ${moTa(cong)})`);
      continue;
    }
    for (const tenPhuongThuc of PORT_METHODS[tenCong]) {
      if (typeof cong[tenPhuongThuc] !== 'function') {
        thieu.push(`${tenCong}.${tenPhuongThuc}`);
      }
    }
  }
  if (thieu.length > 0) {
    throw new TypeError(`Cổng chưa đủ để khởi động — còn thiếu: ${thieu.join(', ')}`);
  }
  return ports;
}
