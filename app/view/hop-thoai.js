// Hộp thoại xác nhận xóa (Story 5.3) — MODAL DUY NHẤT của sản phẩm, và nó sâu đúng một tầng.
//
// Ba luật của tầng view, y hệt năm view kia, và cưỡng chế bằng test chứ không bằng chú thích:
//
// - View CHỈ ĐỌC state. Ở đây là hai phép đọc (`store.state.xacNhanXoa` để biết có đang hỏi
//   không, `store.state.notes` để biết mẩu được hỏi còn sống không) và KHÔNG một phép ghi nào.
//   Phép xóa thật, phép đóng, và lượt vẽ theo sau đều đi ra ngoài bằng hai móc — chúng gọi
//   action của lõi VÀ gọi lượt vẽ, hai việc mà một view không được tự làm cả hai.
// - View không giữ state riêng. Không cờ `dangMo`, không `id` nhớ lại — mỗi lượt `ve()` dựng
//   lại toàn bộ từ một phép đọc. (`daVe` bên dưới là bộ nhớ của phép so "có gì đổi không",
//   cùng loại với `daVe` của `banner.js`, không phải một thông tin mà state không có.)
// - View không bao giờ import `app/adapters/`, không import view khác, và không chạm `document`
//   toàn cục: gốc DOM đi vào qua THAM SỐ.
//
// KHÔNG dùng `<dialog>`/`showModal` của trình duyệt, và đó là một quyết định chứ không phải một
// thiếu sót: `::backdrop` không nhận token theo cùng đường với phần còn lại của `app/style.css`,
// và hành vi focus/`Esc` dựng sẵn của nó nằm ngoài tầm của gốc DOM tối giản mà mọi test view
// của dự án này dùng — tức nửa quan trọng nhất của story sẽ không có người canh. Dựng bằng
// `<div>` như năm view kia, và giam tiêu điểm bằng tay.
//
// Hộp CHỈ có trong DOM khi đang mở: không có nó thì một overlay `position: fixed` vô hình vẫn
// phủ cả trang và ăn mọi cú bấm. Và nó nằm NGOÀI `<main>`, sau `<footer>` — thứ tự bốn tầng của
// Story 2.1 không đổi một dòng.
//
// Không `new Date` (AD-4), không chạm cổng, và không tự soạn một câu lỗi nào: microcopy của hộp
// là chữ CỐ ĐỊNH đã chốt, còn mọi chuyện xấu vẫn đi ra bằng dải băng (AD-17).

/** Chỗ gắn hộp thoại trong DOM. Rỗng nguyên ở dạng tĩnh, y như `.luoi` và `.dai-bang`; mọi thứ
 *  bên trong do lượt vẽ sinh ra lúc chạy. */
const CHON_GOC = '.hop-thoai-goc';

const THE_NEN = 'div';
const THE_HOP = 'div';
const THE_TIEU_DE = 'p';
const THE_THAN = 'p';
const THE_NUT = 'button';

const LOP_NEN = 'hop-thoai-nen';
const LOP_HOP = 'hop-thoai';
const LOP_TIEU_DE = 'hop-thoai-tieu-de';
const LOP_THAN = 'hop-thoai-than';
/** Hai lựa chọn, hai class RIÊNG chứ không một class chung cộng một class phụ: mỗi nút mang
 *  đúng một class giải được bằng một hằng, và đó là điều kiện để bộ quét focus của
 *  `test/focus-va-tab.test.js` nhìn thấy cả hai (xem `nutXong` bên dưới). Phần dùng chung của
 *  chúng sống trong một danh sách selector ở `app/style.css`, không trong một class thứ ba. */
const LOP_CHON = 'hop-thoai-chon';
const LOP_XOA = 'hop-thoai-xoa';

/** Microcopy đã chốt, nguyên văn từng chữ. Không biến thể theo nội dung mẩu: một hộp thoại
 *  nhắc lại chữ của Nam là một hộp thoại đọc lên nghe như đang buộc tội. */
const CHU_TIEU_DE = 'Xóa ghi chú này?';
const CHU_THAN = 'Không có thùng rác và không hoàn tác được.';
const CHU_HUY = 'hủy';
const CHU_XOA = 'xóa';

/** `<button>` mặc định là `submit`: viết ra để hai nút này không bao giờ trở thành nút gửi của
 *  một form nào đó ở story sau. Cùng lý do `banner.js` và `mau-giay.js` viết nó ra. */
const KIEU_NUT = 'button';

/** Ngữ nghĩa trợ năng của hộp. `aria-modal` nói với trình đọc màn hình rằng phần còn lại của
 *  trang đang không tương tác được — phép giam tiêu điểm bên dưới là vế THẬT của lời đó. */
const THUOC_TINH_VAI = 'role';
const VAI_HOP = 'dialog';
const THUOC_TINH_MODAL = 'aria-modal';
const MODAL_CO = 'true';
/** Nhãn của hộp là chính tiêu đề của nó, nối bằng `id` — một `<div role="dialog">` không nhãn
 *  được đọc lên thành một hộp thoại không tên. */
const THUOC_TINH_NHAN = 'aria-labelledby';
const ID_TIEU_DE = 'hop-thoai-tieu-de';
/** Dòng HẬU QUẢ, nối vào hộp bằng `aria-describedby`. Không có nó thì trình đọc màn hình đọc
 *  lên `Xóa ghi chú này?` cùng hai nút và DỪNG — vế "không có thùng rác và không hoàn tác được"
 *  chỉ tới được người đang nhìn màn hình, đúng lúc nó quan trọng nhất. */
const THUOC_TINH_MO_TA = 'aria-describedby';
const ID_THAN = 'hop-thoai-than';

/** Phím đóng hộp. `Esc` chỉ có nghĩa HỦY, và chỉ khi hộp đang mở — bộ nghe sống trên chính hộp,
 *  nên khi không có hộp thì không có ai nghe. */
const PHIM_HUY = 'Escape';
/** Phím đi giữa hai lựa chọn. Vòng khép kín là toàn bộ phép "giam": tiêu điểm không thoát ra
 *  nền, nơi một cú `Enter` sẽ bấm vào một điều khiển mà người dùng không nhìn thấy. */
const PHIM_VONG = 'Tab';

/**
 * Nối hộp thoại xác nhận xóa vào store.
 *
 * @param {object} store Khối state của ứng dụng (`app/core/state.js`).
 * @param {object} [goc] Gốc để tìm chỗ gắn — mặc định `document`. Test truyền một gốc DOM tối
 *   giản vào đây, nên tệp này không tự chạm một global nào.
 * @param {(id: string) => void} [sauKhiDong] Móc HỦY: `hủy`, `Esc` và click overlay đều gọi nó,
 *   kèm `id` của mẩu vừa được hỏi. `app/main.js` đóng hộp, vẽ lại, và TRẢ TIÊU ĐIỂM về đúng nút
 *   `xóa` của mẩu đó — view không biết lưới, nên nó không biết chỗ trả về.
 * @param {(id: string) => void} [sauKhiXoa] Móc XÓA: chỉ nút `xóa` gọi nó. `app/main.js` đóng
 *   hộp rồi gọi `store.xoaGhiChu(id)` và treo lượt vẽ vào lời hứa của nó.
 * @returns {{ ve: () => void }} `ve` dựng lại (hay gỡ bỏ) hộp thoại từ state.
 */
export function noiHopThoai(store, goc = document, sauKhiDong = () => {}, sauKhiXoa = () => {}) {
  // Gốc vắng mặt hẳn đi cùng một đường với "gốc có nhưng không có chỗ gắn": cùng khuôn
  // `noiBanner`, và cùng lý do — `ve` vẫn phải gọi được, vì `app/main.js` treo nó vào một lời
  // hứa không bao giờ bị từ chối.
  const chuNha = goc === null || goc === undefined ? null : goc.querySelector(CHON_GOC);
  if (chuNha === null || chuNha === undefined) return { ve() {} };

  /**
   * `id` đã vẽ ra ở lượt trước, hay `null` khi lượt trước không vẽ gì. `undefined` là "chưa vẽ
   * lần nào" — nó khác mọi giá trị hợp lệ, nên lượt vẽ ĐẦU luôn chạy thật.
   *
   * Đây KHÔNG phải state thứ hai (cùng lý lẽ với `daVe` của `banner.js`): nó không mang một
   * thông tin nào mà state không có, và ném nó đi thì lượt vẽ sau vẫn ra đúng cùng một DOM.
   * Nhưng nó CẦN đúng vì một lý do riêng của story này: `veTatCa()` chạy sau mỗi lần chốt, mỗi
   * phím gõ đã xuống kho, mỗi nhịp đóng dải băng — và một lần dựng lại vô điều kiện sẽ thay hai
   * nút ra giữa lúc chúng đang giữ tiêu điểm, tức đẩy tiêu điểm về `<body>` và trả `Tab` về đầu
   * trang, ở một hộp thoại mà cả điểm của nó là giam tiêu điểm lại.
   */
  let daVe;

  function dong(id) {
    sauKhiDong(id);
  }

  /**
   * Phần dùng chung của hai lựa chọn — nhận phần tử ĐÃ dựng, không tự dựng lấy.
   *
   * Và đó là một điều kiện chứ không phải thẩm mỹ, đúng bài học của `veThanSua` ở
   * `mau-giay.js`: `test/focus-va-tab.test.js` SUY RA tập điều khiển focusable bằng cách nối
   * `const x = …createElement(T)` với `x.className = L`. Một nút dựng trong một hàm dựng chung
   * với class đi vào qua THAM SỐ thì bộ quét không giải được — tức `.hop-thoai-chon` và
   * `.hop-thoai-xoa` sẽ không được cửa "mọi điều khiển đều có vòng sáng" phủ, trong im lặng.
   */
  function nutXong(nut, chu, khiBam) {
    nut.type = KIEU_NUT;
    nut.textContent = chu;
    nut.addEventListener('click', (suKien) => {
      // Chặn nổi bọt NGAY TẠI NÚT: bộ nghe `click` của overlay nghĩa là HỦY, và để một cú bấm
      // `xóa` chạy tiếp lên đó là gọi cả hai móc cho một cú bấm.
      suKien?.stopPropagation?.();
      khiBam();
    });
    return nut;
  }

  /**
   * Vẽ lại hộp thoại từ state.
   *
   * Hai cửa cho "không vẽ gì", và cả hai đều ra cùng một kết quả — chỗ gắn rỗng trơn:
   *
   *   (1) `xacNhanXoa` là `null`: không ai đang hỏi gì.
   *   (2) `xacNhanXoa` mang một `id` mà `notes` không còn: mẩu đã biến khỏi lưới giữa chừng
   *       (một lần rời chế độ sửa với ô rỗng, hay một lần nạp sao lưu). Hỏi về một thứ không
   *       còn tồn tại là mời người ta bấm `xóa` cho một mẩu khác.
   */
  function ve() {
    const id = store.state.xacNhanXoa;
    const con = id !== null && id !== undefined && store.state.notes.some((mau) => mau.id === id);
    const canVe = con ? id : null;
    // Không đổi thì không chạm DOM — xem chú thích của `daVe`.
    if (canVe === daVe) return;
    daVe = canVe;
    if (canVe === null) {
      chuNha.replaceChildren();
      return;
    }

    const o = chuNha.ownerDocument;

    const nen = o.createElement(THE_NEN);
    nen.className = LOP_NEN;
    // Click trên NỀN là hủy. Nó đứng được vì cú bấm trong hộp đã bị chặn nổi bọt ngay tại chỗ
    // (hai nút ở trên, và chính hộp ngay dưới) — nên tới được đây nghĩa là đã bấm ra ngoài.
    nen.addEventListener('click', () => dong(canVe));

    const hop = o.createElement(THE_HOP);
    hop.className = LOP_HOP;
    hop.setAttribute(THUOC_TINH_VAI, VAI_HOP);
    hop.setAttribute(THUOC_TINH_MODAL, MODAL_CO);
    hop.setAttribute(THUOC_TINH_NHAN, ID_TIEU_DE);
    hop.setAttribute(THUOC_TINH_MO_TA, ID_THAN);
    hop.addEventListener('click', (suKien) => suKien?.stopPropagation?.());

    const tieuDe = o.createElement(THE_TIEU_DE);
    tieuDe.className = LOP_TIEU_DE;
    tieuDe.id = ID_TIEU_DE;
    // `textContent` chứ không `innerHTML`, đúng luật của mọi view: microcopy là CHỮ.
    tieuDe.textContent = CHU_TIEU_DE;

    const than = o.createElement(THE_THAN);
    than.className = LOP_THAN;
    than.id = ID_THAN;
    than.textContent = CHU_THAN;

    const huy = o.createElement(THE_NUT);
    huy.className = LOP_CHON;
    nutXong(huy, CHU_HUY, () => dong(canVe));

    const xoa = o.createElement(THE_NUT);
    xoa.className = LOP_XOA;
    nutXong(xoa, CHU_XOA, () => sauKhiXoa(canVe));

    // Giam tiêu điểm, và phép giam là đúng một vòng giữa HAI nút — đó là toàn bộ tập điều khiển
    // của hộp, nên không có gì để đi tìm bằng một phép quét cây.
    //
    // KHÔNG đọc `activeElement`: bộ nghe sống trên hộp và `Tab` bao giờ cũng phát từ đúng phần
    // tử đang giữ tiêu điểm, nên `target` đã trả lời câu hỏi đó rồi — và một phép đọc
    // `activeElement` là một phép chạm `document` mà tệp này không được phép có.
    //
    // `preventDefault` chạy trên MỌI `Tab` trong hộp (cả hai chiều, cả khi `target` lạ): bỏ nó
    // ở một nhánh nào là để trình duyệt đưa tiêu điểm ra nền, nơi một cú `Enter` bấm vào một
    // điều khiển người dùng không nhìn thấy.
    const luaChon = [huy, xoa];
    // Cú bấm vào CHỮ, vào khoảng đệm của hộp, hay vào VÙNG MỜ quanh nó KHÔNG được lấy tiêu điểm
    // khỏi hai nút.
    //
    // Đây không phải chuyện thẩm mỹ: cả hai bộ nghe bàn phím sống trên `hop`, và chúng chỉ nhận
    // được phím vì phím nổi bọt lên từ một phần tử BÊN TRONG đang giữ tiêu điểm. Để tiêu điểm
    // rơi về `<body>` là `Esc` chết và `Tab` hết bị chặn — tức hộp thoại vẫn hiện ra nhưng phép
    // giam đã tắt, và không một lượt vẽ nào nói cho ai biết.
    //
    // Bộ nghe gắn trên `nen` chứ không trên `hop`: `nen` bọc cả hộp, nên một bộ nghe phủ được cả
    // hai chỗ. Gắn trên `hop` thì một cú nhấn trên vùng mờ vẫn đẩy tiêu điểm đi — và nếu đó là
    // một cú KÉO nhả ra ngoài vùng mờ thì không có `click` nào tới để đóng hộp, tức hộp ở lại
    // trên màn hình với phép giam đã tắt.
    //
    // `mousedown` chứ không `pointerdown` (bộ quét của `test/chuyen-dong-va-tin-hieu.test.js`
    // chặn cái sau), và `preventDefault` ở đây chỉ bỏ đúng một hành vi mặc định: phép DỜI tiêu
    // điểm. Sự kiện `click` vẫn phát bình thường, nên hai nút và overlay không đổi gì.
    nen.addEventListener('mousedown', (suKien) => {
      if (luaChon.includes(suKien.target)) return;
      suKien.preventDefault?.();
    });
    hop.addEventListener('keydown', (suKien) => {
      if (suKien.key === PHIM_HUY) {
        suKien.preventDefault?.();
        dong(canVe);
        return;
      }
      if (suKien.key !== PHIM_VONG) return;
      suKien.preventDefault?.();
      const dangDung = luaChon.indexOf(suKien.target);
      // Hai phần tử thì "nút kia" là nút còn lại, ở cả hai chiều — `Shift` không đổi đích đến,
      // nó chỉ đổi chiều của một vòng có đúng hai điểm. `target` lạ (không phải một trong hai)
      // ra `-1`, và đường lui là `hủy`: lựa chọn an toàn, đúng như lúc mới mở.
      const ke = dangDung === 0 ? xoa : huy;
      ke.focus?.();
    });

    hop.append(tieuDe, than, huy, xoa);
    nen.append(hop);
    chuNha.replaceChildren(nen);
    // Tiêu điểm đặt SAU khi hộp đã vào DOM: `focus()` trên một phần tử còn rời khỏi tài liệu
    // không làm gì cả. `hủy` chứ không `xóa` — hộp mở ra ở lựa chọn AN TOÀN, nên một cú `Enter`
    // theo phản xạ không xóa mất thứ gì.
    huy.focus?.();
  }

  return { ve };
}
