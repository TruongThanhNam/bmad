// Adapter cổng `quota` — nơi DUY NHẤT chạm `navigator.storage` (AD-10, Story 8.1).
//
// Mở LƯỜI: dựng factory không chạm global nào, vì `test/trang-tinh.test.js` import `main.js`
// ở Node. `navigator.storage` chỉ bị hỏi tới bên trong từng phương thức.
//
// Không có test tự động theo luật của `app/adapters/`; kiểm bằng checklist trong `README.md`.

/** `navigator.storage` nếu có, không thì `null` — không bao giờ ném. */
function khoLuuTru() {
  try {
    return typeof navigator !== 'undefined' && navigator.storage ? navigator.storage : null;
  } catch {
    return null;
  }
}

/** Dựng hiện thực của cổng `quota`. */
export function taoQuota() {
  return {
    /** Ước lượng dung lượng; API vắng thì hai con số `null` (Story 8.2 dùng). */
    async estimate() {
      const kho = khoLuuTru();
      if (!kho || typeof kho.estimate !== 'function') return { used: null, limit: null };
      let uoc;
      try {
        uoc = await kho.estimate();
      } catch {
        return { used: null, limit: null };
      }
      return {
        used: typeof uoc?.usage === 'number' ? uoc.usage : null,
        limit: typeof uoc?.quota === 'number' ? uoc.quota : null,
      };
    },
    /** Xin lưu trữ bền; API vắng thì `null`. */
    async persist() {
      const kho = khoLuuTru();
      if (!kho || typeof kho.persist !== 'function') return null;
      let kq;
      try {
        kq = await kho.persist();
      } catch {
        return null;
      }
      return typeof kq === 'boolean' ? kq : null;
    },
  };
}
