// Hiện thực cổng `sessionStore` bằng localStorage + sessionStorage (AD-3, AD-9).
//
// Cổng này ĐỒNG BỘ, và đó là ràng buộc chứ không phải tiện tay: theme phải đọc được trước lần
// vẽ đầu tiên (không được nháy màu sai), và danh tính tab phải có trước mọi phép ghi bản nháp.
// Hệ quả cho lỗi: cổng đồng bộ thì NÉM, không bao giờ trả về một lời hứa bị từ chối — quy tắc
// nằm ở header `app/ports/session-store.js`.
//
// Bảng khóa ĐÓNG BĂNG đúng ba khóa cấu hình. Khóa lạ là `TypeError` nêu cả ba khóa hợp lệ, chứ
// không phải một lần ghi im lặng: đó là cách "không một ghi chú nào sống ở kho cấu hình" trở
// thành điều cưỡng chế được thay vì một lời hứa (AD-3 tầng B′).
//
// Danh tính tab KHÔNG phải khóa thứ tư của kho cấu hình: nó thuộc phạm vi một PHIÊN của một
// tab, nên nó sống ở kho phạm vi phiên. Đặt nó cạnh theme thì mọi tab dùng chung một danh
// tính, và bản nháp riêng tab (AD-3 tầng B) mất đúng thứ phân biệt chủ của nó.
//
// Đọc LƯỜI, không chạm kho lúc import: `test/trang-tinh.test.js` import động `app/main.js` ở
// Node, nơi không có kho nào cả.

import { MA_LOI, loiUngDung } from '../core/errors.js';

/** Ba khóa cấu hình được phép tồn tại, và tên thật của chúng dưới kho (AD-3, AD-9). */
const BANG_KHOA = Object.freeze({
  theme: 'ghichu.theme',
  lastBackupAt: 'ghichu.lastBackupAt',
  persistDenied: 'ghichu.persistDenied',
});

/** Khóa danh tính tab — phạm vi phiên, cùng tiền tố `ghichu.` của AD-9. */
const KHOA_TAB = 'ghichu.tabId';

/** Tên lỗi mà trình duyệt dùng cho "hết dung lượng" — cửa duy nhất vào mã `QUOTA` (AD-10). */
const TEN_LOI_HET_CHO = 'QuotaExceededError';

function maCuaLoi(loi) {
  return loi != null && loi.name === TEN_LOI_HET_CHO ? MA_LOI.QUOTA : MA_LOI.DB;
}

/** Tên thật của một khóa cấu hình, hoặc ném nếu khóa nằm ngoài bảng đóng băng. */
function tenThat(key) {
  if (!Object.prototype.hasOwnProperty.call(BANG_KHOA, key)) {
    throw new TypeError(
      `kho cấu hình chỉ mang ${Object.keys(BANG_KHOA).join(', ')} — nhận được ${String(key)}`,
    );
  }
  return BANG_KHOA[key];
}

/**
 * Dựng một hiện thực của cổng `sessionStore`.
 *
 * @returns {{ read: Function, write: Function, remove: Function, tabIdentity: Function,
 *   writeTabIdentity: Function }}
 *   Cổng cấu hình bền cộng danh tính tab; mọi phương thức ĐỒNG BỘ và NÉM khi hỏng.
 */
export function taoSessionStore() {
  return {
    read(key) {
      const ten = tenThat(key);
      try {
        return localStorage.getItem(ten);
      } catch (loi) {
        // Kho bị chặn hẳn (chế độ riêng tư của một số trình duyệt) — đọc không được là một
        // lỗi thật, không phải "khóa chưa từng được ghi". Trả `null` ở đây sẽ làm cờ
        // `persistDenied` im lặng thành "chưa bị từ chối".
        throw loiUngDung(maCuaLoi(loi));
      }
    },

    write(key, value) {
      const ten = tenThat(key);
      try {
        localStorage.setItem(ten, value);
      } catch (loi) {
        throw loiUngDung(maCuaLoi(loi));
      }
    },

    remove(key) {
      const ten = tenThat(key);
      try {
        localStorage.removeItem(ten);
      } catch (loi) {
        throw loiUngDung(maCuaLoi(loi));
      }
    },

    tabIdentity() {
      try {
        const daCo = sessionStorage.getItem(KHOA_TAB);
        if (daCo !== null && daCo !== '') return daCo;
        // `crypto.randomUUID` chỉ tồn tại trong secure context, và AD-12 đã chốt rằng app chỉ
        // chạy ở HTTPS hoặc `localhost` — nên không có nhánh dự phòng nào ở đây.
        const moi = crypto.randomUUID();
        sessionStorage.setItem(KHOA_TAB, moi);
        return moi;
      } catch (loi) {
        throw loiUngDung(maCuaLoi(loi));
      }
    },

    // Ghi vào kho PHẠM VI PHIÊN, cùng khóa với `tabIdentity` — không phải khóa thứ tư của kho
    // cấu hình. Chỗ gọi duy nhất là action xử lý tab bị nhân đôi (AD-3 bước 1).
    writeTabIdentity(id) {
      try {
        sessionStorage.setItem(KHOA_TAB, id);
      } catch (loi) {
        throw loiUngDung(maCuaLoi(loi));
      }
    },
  };
}
