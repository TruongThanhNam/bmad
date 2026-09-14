// Ô soạn thảo — file view đầu tiên của dự án, và nó đặt khuôn cho mọi view sau.
//
// Ba luật của tầng view, cả ba đều được cưỡng chế bằng test chứ không bằng chú thích này:
//
// - View CHỈ ĐỌC state. Mọi phép đổi đi qua một action của `app/core/state.js`; ở đây là đúng
//   một lời gọi `store.datBanNhap(...)`. Debounce `AUTOSAVE_MS`, số đếm `seq`, dải băng khi
//   ghi hỏng — tất cả đã nằm trong action, nên view không được dựng lại một nửa nào của chúng.
// - View không giữ state riêng. Chữ đang gõ sống ở đúng một chỗ: `store.state.draft.text`.
//   Một biến `chuVuaGo` cấp module ở đây là khối state thứ hai, và nó sẽ lệch.
// - View không bao giờ import `app/adapters/`. Nó nhận `store` qua THAM SỐ — chỉ `app/main.js`
//   biết adapter nào đang nối vào.
//
// Không số literal nào trong tệp này (AD-14). Sàn chiều cao 92px sống ở `--composer-min-h`
// trong `app/style.css`, nên `caoTheoNoiDung` chỉ cần đo, không cần biết một con số nào.

/** Ô soạn thảo trong DOM. View định vị bằng `id`, không bằng thứ tự phần tử. */
const CHON_O_SOAN = '#o-soan';

/** Phím chốt, đi cùng `Ctrl` — nguyên văn microcopy "Ctrl+Enter để chốt" của EXPERIENCE.md. */
const PHIM_CHOT = 'Enter';

/**
 * Nối ô soạn thảo vào store: mỗi phím gõ đi thẳng vào action tự lưu.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {object} [goc] Gốc để tìm phần tử — mặc định là `document`. Test truyền một gốc DOM
 *   tối giản vào đây, nên tệp này không tự chạm global nào.
 * @param {() => void} [sauKhiChot] Móc chạy SAU khi lời hứa chốt chốt xong — `app/main.js`
 *   treo `luoi.ve` vào đây. Là THAM SỐ chứ không phải một import: hai view không được biết
 *   nhau, chỉ `main.js` biết cả hai — cùng lý do view không được biết adapter. Không có cơ
 *   chế subscribe trong dự án này, và đây là điểm nối duy nhất không sinh một state thứ hai.
 * @returns {{ dongBoTuState: () => void }} `dongBoTuState` đưa chữ trong state ra ô, dùng
 *   đúng một lần sau khi `khoiDongBanNhap()` chốt.
 */
export function noiOSoan(store, goc = document, sauKhiChot = () => {}) {
  const o = goc.querySelector(CHON_O_SOAN);
  // Không có ô thì không có gì để nối — và cũng không có gì để ném. `dongBoTuState` vẫn phải
  // gọi được, vì `app/main.js` treo nó vào một lời hứa không bao giờ bị từ chối.
  if (o === null || o === undefined) return { dongBoTuState() {} };

  /**
   * Ô cao khít nội dung.
   *
   * `block-size` phải về `auto` TRƯỚC khi đọc `scrollHeight`: một ô đang bị ghim chiều cao có
   * `scrollHeight` bằng đúng chiều cao đó, nên bỏ bước này là ô chỉ cao lên được và không bao
   * giờ co lại khi xóa chữ.
   *
   * Cộng thêm `offsetHeight - clientHeight` vì `box-sizing` là `border-box`: `scrollHeight`
   * đếm nội dung cộng padding nhưng KHÔNG đếm viền, còn `block-size` thì đếm cả viền — thiếu
   * hiệu số này thì vùng nội dung hụt đúng bề dày hai đường viền và dòng cuối bị nuốt một
   * phần. Hiệu số được ĐO, không viết thành số, nên luật CSS đổi thì nó tự đúng theo.
   */
  function caoTheoNoiDung() {
    o.style.blockSize = 'auto';
    const vienTrenDuoi = o.offsetHeight - o.clientHeight;
    o.style.blockSize = `${o.scrollHeight + vienTrenDuoi}px`;
  }

  o.addEventListener('input', () => {
    store.datBanNhap(o.value);
    caoTheoNoiDung();
  });

  // `Ctrl+Enter` chốt bản nháp thành ghi chú, và KHÔNG phím nào khác bị chạm tới: `Enter` trần
  // xuống dòng là hành vi mặc định của `<textarea>`, không phải thứ view phải dựng lại — nên
  // `preventDefault()` chỉ chạy trên đúng tổ hợp chốt.
  //
  // Không đọc chữ trong ô để truyền vào action: `chotGhiChu()` không nhận tham số, và nguồn chữ
  // duy nhất là `store.state.draft.text`. Mỗi phím gõ đã đi qua `datBanNhap`, nên state luôn là
  // bản mới nhất — truyền `o.value` vào đây là dựng một đường thứ hai cho cùng một dữ liệu.
  //
  // Đồng bộ ô SAU khi lời hứa chốt xong, không trước: chốt hỏng thì `draft.text` còn nguyên và
  // `dongBoTuState` (nó chỉ gán khi lệch) sẽ không chạm ô — chữ ở lại đúng chỗ Nam để nó.
  o.addEventListener('keydown', (suKien) => {
    // Bộ gõ tiếng Việt còn đang dựng một âm tiết: phím lúc này thuộc về bộ gõ, không thuộc về
    // ứng dụng. Chốt giữa chừng là chốt một chữ dở — `phơ` thay cho `phở`.
    if (suKien.isComposing) return;
    // `AltGr` là `Ctrl+Alt` trên bàn phím Windows, và nó gõ ra ký tự chứ không ra lệnh. Không
    // loại `altKey` thì một tổ hợp AltGr rơi trúng `Enter` sẽ chốt sau lưng người gõ.
    if (suKien.altKey) return;
    if (!suKien.ctrlKey || suKien.key !== PHIM_CHOT) return;
    suKien.preventDefault();
    store.chotGhiChu().then(() => {
      dongBoTuState();
      caoTheoNoiDung();
      // Lưới vẽ lại ở ĐÂY, sau khi state đã nhận mẩu mới — không trước, và không ở bộ nghe
      // `keydown`: chốt hỏng thì `notes` không đổi và lượt vẽ này chỉ dựng lại đúng cái đang
      // có. `chotGhiChu` không bao giờ bị từ chối (hỏng đi ra bằng dải băng), nên một nhánh
      // `.catch` ở đây là một nhánh chết.
      sauKhiChot();
    });
  });

  // Đổi bề rộng cửa sổ là NGẮT DÒNG LẠI: cùng một chữ chiếm nhiều dòng hơn ở ô hẹp, nên chiều
  // cao đã ghim lúc gõ không còn đúng và những dòng mọc thêm bị kẹp mất. Đo lại theo `resize`
  // là cách duy nhất biết điều đó xảy ra.
  //
  // Cửa sổ lấy qua CHÍNH phần tử (`o.ownerDocument.defaultView`), không qua một global: tệp
  // này nhận gốc DOM bằng tham số, và nó phải giữ được tính chất đó để test dựng gốc giả.
  const cuaSo = o.ownerDocument?.defaultView ?? null;
  if (cuaSo !== null) cuaSo.addEventListener('resize', caoTheoNoiDung);

  /**
   * Đưa chữ trong state ra ô — đúng một lần, sau khi `khoiDongBanNhap()` chốt.
   *
   * Phép SO SÁNH ở dòng đầu là toàn bộ điểm của hàm này. `app/main.js` gọi
   * `khoiDongBanNhap()` mà không đợi, nên Nam có thể đã gõ xong một câu trước khi kho trả
   * lời. `state.js` đã bỏ kết quả giành được khi `draft.seq` nhảy, nên state lúc đó mang chữ
   * MỚI — và gán lại một giá trị y hệt vẫn là một phép đặt `value` làm con trỏ nhảy về cuối
   * giữa lúc đang gõ. So trước khi gán thì không có cú nhảy nào.
   *
   * Vì so được như vậy nên view KHÔNG cần một cơ chế nghe thay đổi state, và không được dựng
   * một cái: một store thứ hai hay một hàng subscribe là đúng thứ AD-1 cấm.
   */
  function dongBoTuState() {
    const text = store.state.draft.text;
    if (o.value === text) return;
    o.value = text;
    // Con trỏ về CUỐI chữ: bản nháp nhận lại được là một câu đang viết dở, và chỗ tiếp tục
    // viết là cuối câu, không phải đầu câu.
    o.setSelectionRange(text.length, text.length);
    caoTheoNoiDung();
  }

  // Ô rỗng lúc tải cũng phải đi qua một lần đo: nếu không, chiều cao inline chưa tồn tại và
  // phím đầu tiên làm ô giật từ chiều cao mặc định của trình duyệt xuống sàn của token.
  caoTheoNoiDung();

  return { dongBoTuState };
}
