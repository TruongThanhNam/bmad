// Hàng chip điều kiện — tầng 2b (Story 6.3).
//
// Ba luật của tầng view, y hệt các view khác, và cưỡng chế bằng test chứ không bằng chú thích:
//
// - View CHỈ ĐỌC state (`dieuKien`, `notes`) và không gọi một action nào. Nút `về hôm nay` phát
//   móc `veHomNay` do `app/main.js` truyền vào — chính `main.js` gọi `xoaHetDieuKien()`, xóa ô
//   ngày gõ dở, vẽ lại và trả tiêu điểm, bốn việc mà một view không được tự làm.
// - View không giữ bản sao điều kiện. Mỗi lượt `ve()` dựng lại toàn bộ hàng từ state.
// - Số kết quả là độ dài đầy đủ `locGhiChu` trả về, CHƯA cắt trần — hàng chip tự lọc, không
//   nhận số đếm từ lưới (hai view không biết nhau). Story 6.4 sẽ đổi chỗ này sang `total`.
//
// Chip là `<span>`: chỉ để nhìn, không bấm được, không nằm trong thứ tự Tab (UX-DR-13).

import { locGhiChu } from '../core/query.js';
import { chuoiNhapTuNgay, nowIso } from '../core/time.js';

/** Chỗ gắn tầng 2b trong `index.html`. */
const CHON_HANG = '.hang-chip';

const THE_CHIP = 'span';
const THE_NUT = 'button';
const LOP_CHIP = 'chip';
const LOP_CHIP_NGAY = 'chip chip-ngay';
const LOP_DEM = 'hang-chip-dem';
const LOP_VE = 've-hom-nay';
const KIEU_NUT = 'button';
const CHU_VE = 'về hôm nay';
const DUOI_DEM = 'ghi chú';

/**
 * Nối hàng chip vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {{ querySelector: Function }} [goc] Gốc DOM — mặc định `document`.
 * @param {() => string} [mocHienTai] Nguồn mốc hiện tại, mặc định `nowIso`; hỏi lại mỗi lượt vẽ.
 * @param {() => void} [veHomNay] Móc của nút `về hôm nay`, do `app/main.js` nối.
 * @returns {{ ve: () => void }}
 */
export function noiHangChip(store, goc = document, mocHienTai = nowIso, veHomNay = () => {}) {
  const hang = goc.querySelector(CHON_HANG);
  if (hang === null || hang === undefined) return { ve() {} };

  function ve() {
    const dieuKien = store.state.dieuKien;
    const coDieuKien = dieuKien.keyword !== null || dieuKien.date !== null;
    if (!coDieuKien) {
      hang.replaceChildren();
      hang.hidden = true;
      return;
    }
    const tai = hang.ownerDocument;
    const con = [];
    if (dieuKien.keyword !== null) {
      const chipTu = tai.createElement(THE_CHIP);
      chipTu.className = LOP_CHIP;
      chipTu.textContent = dieuKien.keyword;
      con.push(chipTu);
    }
    if (dieuKien.date !== null) {
      const chipNgay = tai.createElement(THE_CHIP);
      chipNgay.className = LOP_CHIP_NGAY;
      chipNgay.textContent = chuoiNhapTuNgay(dieuKien.date);
      con.push(chipNgay);
    }
    const dem = tai.createElement(THE_CHIP);
    dem.className = LOP_DEM;
    const soKetQua = locGhiChu(store.state.notes, dieuKien, mocHienTai()).length;
    dem.textContent = `${soKetQua} ${DUOI_DEM}`;
    con.push(dem);
    const nut = tai.createElement(THE_NUT);
    nut.className = LOP_VE;
    nut.type = KIEU_NUT;
    nut.textContent = CHU_VE;
    nut.addEventListener('click', () => veHomNay());
    con.push(nut);
    hang.replaceChildren(...con);
    hang.hidden = false;
  }

  return { ve };
}
