// Khay tìm — ô từ khóa (Story 6.1) và ô ngày (Story 6.2) của tầng 2.
//
// Ba luật của tầng view, y hệt các view khác, và cưỡng chế bằng test chứ không bằng chú thích:
//
// - View CHỈ ĐỌC state (`dieuKien`) và phát đúng MỘT action: `store.datDieuKien`. Không
//   debounce, không `Enter`: mỗi phím là một lần phát, và lưới lọc lại ngay ở lượt vẽ theo sau.
// - View không giữ bản sao điều kiện. Từ khóa và ngày đang lọc sống trong `dieuKien` và CHỈ ở
//   đó; `ve()` kéo `value` của ô về theo state — nên khi `chotGhiChu` xóa điều kiện, ô cũng về
//   rỗng. Thứ DUY NHẤT view tự giữ là lỗi tại chỗ của ô ngày: lỗi là của view (không mã lỗi,
//   không dải băng), và `date` mà lượt vẽ trước đã thấy — để biết `date` đổi "từ nơi khác".
// - View không bao giờ import `app/adapters/`, và không chạm `document` toàn cục: gốc DOM đi vào
//   qua THAM SỐ. Gõ vào ô không chạm kho, không chạm cổng nào — `datDieuKien` là đồng bộ.
//
// Ô ngày: chuỗi `dd/MM/yyyy` hợp lệ → phát `{ date: 'yyyy-MM-dd' }`; rỗng → phát `{ date: null }`;
// chưa hợp lệ → KHÔNG phát (lưới đứng yên). Lỗi không bật mỗi phím: chỉ khi `blur` với chuỗi
// không rỗng chưa hợp lệ, hoặc khi chuỗi đã đủ độ dài mà vẫn chưa hợp lệ.

import { chuoiNhapDuDai, chuoiNhapTuNgay, ngayTuChuoiNhap } from '../core/time.js';

/** `id` của ô từ khóa trong `index.html`. */
const ID_O_TIM = 'o-tim';
/** `id` của ô ngày và của chữ lỗi dưới khay. */
const ID_O_NGAY = 'o-ngay';
const ID_LOI_NGAY = 'o-ngay-loi';
/** Class của khung bọc ô ngày khi đang lỗi — viền `--danger`. */
const LOP_LOI = 'o-ngay-loi';

/**
 * Nối khay tìm vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {{ getElementById: Function }} [goc] Gốc để tìm phần tử — mặc định `document`.
 * @param {() => void} [sauKhiDoi] Lượt vẽ chung, do `app/main.js` truyền vào: view không biết
 *   lưới tồn tại, nó chỉ biết điều kiện vừa đổi thì mọi thứ phải vẽ lại.
 * @returns {{ ve: () => void }} `ve` đồng bộ `value` của các ô từ state.
 */
export function noiKhayTim(store, goc = document, sauKhiDoi = () => {}) {
  const o = goc.getElementById(ID_O_TIM);
  const ngay = noiONgay(store, goc, sauKhiDoi);

  if (o !== null && o !== undefined) {
    o.addEventListener('input', () => {
      // Chuỗi gõ sao đi vậy — không trim. `''` thành `null` là việc của lõi (`keywordHopLe`).
      store.datDieuKien({ keyword: o.value });
      sauKhiDoi();
    });
  }

  /** Kéo `value` về theo state — CHỈ khi lệch, để lượt vẽ lúc đang gõ không nhảy con trỏ. */
  function ve() {
    if (o !== null && o !== undefined) {
      const muon = store.state.dieuKien.keyword ?? '';
      if (o.value !== muon) o.value = muon;
    }
    ngay.ve();
  }

  return { ve };
}

/** Phần ô ngày + nút lịch + picker gốc. Thiếu ô ngày thì `ve` rỗng. */
function noiONgay(store, goc, sauKhiDoi) {
  const o = goc.getElementById(ID_O_NGAY);
  if (o === null || o === undefined) return { ve() {} };
  const loiChu = goc.getElementById(ID_LOI_NGAY);
  const boc = o.parentElement ?? null;
  const nut = boc?.querySelector?.('.nut-lich') ?? null;
  const chon = boc?.querySelector?.('.o-ngay-chon') ?? null;

  /** `date` của state ở lần đồng bộ gần nhất — lệch với state nghĩa là nó đổi từ nơi khác. */
  let dateDaThay = store.state.dieuKien.date;

  function hienLoi(bat) {
    boc?.classList?.toggle(LOP_LOI, bat);
    if (bat) {
      o.setAttribute('aria-invalid', 'true');
      o.setAttribute('aria-describedby', ID_LOI_NGAY);
    } else {
      o.removeAttribute('aria-invalid');
      o.removeAttribute('aria-describedby');
    }
    if (loiChu !== null && loiChu !== undefined) loiChu.hidden = !bat;
  }

  function phat(date) {
    // `date` không đổi (vd `blur` ô đang rỗng, hoặc gõ lại đúng ngày đang lọc) thì không phát và
    // không vẽ lại — một lượt vẽ thừa mỗi lần Tab đi qua ô là tiếng ồn, không phải hành vi.
    const hienTai = store.state.dieuKien.date;
    if (date === hienTai) {
      hienLoi(false);
      return;
    }
    store.datDieuKien({ date });
    dateDaThay = store.state.dieuKien.date;
    hienLoi(false);
    sauKhiDoi();
  }

  /** Xử lý chuỗi hiện có trong ô. `luc` là `'go'` hoặc `'roi'` (blur). */
  function xet(luc) {
    const chuoi = o.value;
    if (chuoi === '') {
      phat(null);
      return;
    }
    const khoa = ngayTuChuoiNhap(chuoi);
    if (khoa !== null) {
      phat(khoa);
      return;
    }
    // Chưa hợp lệ: không phát, `date` giữ cũ. Lỗi bật khi rời ô hoặc đã gõ đủ độ dài; gõ dở
    // thì giữ nguyên trạng thái lỗi hiện có (chưa bật thì chưa bật).
    if (luc === 'roi' || chuoiNhapDuDai(chuoi)) hienLoi(true);
  }

  o.addEventListener('input', () => xet('go'));
  o.addEventListener('blur', () => xet('roi'));

  if (nut !== null && chon !== null) {
    nut.addEventListener('click', () => {
      chon.value = store.state.dieuKien.date ?? '';
      try {
        chon.showPicker();
      } catch {
        // Trình duyệt không cho mở picker (không có `showPicker`, hoặc bị chặn) — ô gõ tay vẫn đó.
      }
    });
    chon.addEventListener('change', () => {
      if (chon.value === '') {
        o.value = '';
      } else {
        try {
          o.value = chuoiNhapTuNgay(chon.value);
        } catch {
          return; // Giá trị picker không phải `yyyy-MM-dd` có thật (vd năm 5 chữ số) — bỏ qua.
        }
      }
      xet('go');
      o.focus?.();
    });
  }

  function ve() {
    const date = store.state.dieuKien.date;
    if (date === dateDaThay) return;
    dateDaThay = date;
    const muon = date === null ? '' : chuoiNhapTuNgay(date);
    if (o.value !== muon) o.value = muon;
    hienLoi(false);
  }

  return { ve };
}
