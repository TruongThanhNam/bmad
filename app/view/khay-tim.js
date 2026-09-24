// Khay tìm — ô từ khóa của tầng 2 (Story 6.1).
//
// Ba luật của tầng view, y hệt các view khác, và cưỡng chế bằng test chứ không bằng chú thích:
//
// - View CHỈ ĐỌC state (`dieuKien.keyword`) và phát đúng MỘT action: `store.datDieuKien`. Không
//   debounce, không `Enter`: mỗi phím là một lần phát, và lưới lọc lại ngay ở lượt vẽ theo sau.
// - View không giữ bản sao từ khóa. Chữ đang tìm sống trong `dieuKien` và CHỈ ở đó; `ve()` kéo
//   `value` của ô về theo state — nên khi `chotGhiChu` xóa điều kiện, ô cũng về rỗng.
// - View không bao giờ import `app/adapters/`, và không chạm `document` toàn cục: gốc DOM đi vào
//   qua THAM SỐ. Gõ vào ô tìm không chạm kho, không chạm cổng nào — `datDieuKien` là đồng bộ.

/** `id` của ô từ khóa trong `index.html`. */
const ID_O_TIM = 'o-tim';

/**
 * Nối khay tìm vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {{ getElementById: Function }} [goc] Gốc để tìm phần tử — mặc định `document`.
 * @param {() => void} [sauKhiDoi] Lượt vẽ chung, do `app/main.js` truyền vào: view không biết
 *   lưới tồn tại, nó chỉ biết điều kiện vừa đổi thì mọi thứ phải vẽ lại.
 * @returns {{ ve: () => void }} `ve` đồng bộ `value` của ô từ state.
 */
export function noiKhayTim(store, goc = document, sauKhiDoi = () => {}) {
  const o = goc.getElementById(ID_O_TIM);
  if (o === null || o === undefined) return { ve() {} };

  o.addEventListener('input', () => {
    // Chuỗi gõ sao đi vậy — không trim. `''` thành `null` là việc của lõi (`keywordHopLe`).
    store.datDieuKien({ keyword: o.value });
    sauKhiDoi();
  });

  /** Kéo `value` về theo state — CHỈ khi lệch, để lượt vẽ lúc đang gõ không nhảy con trỏ. */
  function ve() {
    const muon = store.state.dieuKien.keyword ?? '';
    if (o.value !== muon) o.value = muon;
  }

  return { ve };
}
