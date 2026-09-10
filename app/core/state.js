// Khối state duy nhất của ứng dụng, và mọi đường đổi nó (AD-1).
//
// Chỉ có MỘT khối dữ liệu, và nó chỉ đổi bên trong một action của chính tệp này. View đọc
// state rồi vẽ; adapter trả dữ liệu về cho action. Cả hai không bao giờ ghi vào state. Nếu
// hai vùng cùng sửa một dữ liệu theo hai cách thì bảng trạng thái của FR-14 sẽ không bao giờ
// khớp lại được, và không có triệu chứng nào ngoài "đôi khi nó sai".
//
// Vì sao là factory `taoStore(ports)` chứ không phải một giá trị singleton cấp module:
// "đúng một khối state" là ràng buộc về runtime của ứng dụng, không phải về cách module xuất
// giá trị. Một singleton khiến mỗi ca test kế thừa state của ca trước, nên test sẽ phải tự
// dựng một cơ chế reset — chính là một đường đổi state THỨ HAI, đúng thứ AD-1 cấm. Factory
// giữ được cả hai: test tạo store riêng cho mỗi ca, `app/main.js` gọi đúng một lần.
//
// State đọc ra là một bản sao ĐÓNG BĂNG SÂU, không phải khối nội bộ. Trả thẳng khối nội bộ
// ra thì `store.state.notes.push(x)` từ view là hợp lệ về cú pháp, và nó lách qua mọi action.
// Bản sao đóng băng biến cái lách đó thành một lỗi ném ngay tại dòng viết sai.
//
// Nhưng dựng lại bản sao đó bằng cách đi hết cây state sau MỖI action là một cái bẫy hiệu
// năng: `datDieuKien` là đường chạy theo TỪNG PHÍM gõ vào ô tìm kiếm, còn `notes` giữ toàn
// bộ ghi chú trong RAM (AD-6). Sao chép cả `notes` mỗi phím là chi phí tỉ lệ với số ghi chú
// cho một việc không đụng tới ghi chú nào — trần 200 ms của NFR-2 sẽ gãy đúng lúc kho đã
// nhiều. Nên hai nửa đi cùng nhau:
//
// - action KHÔNG sửa tại chỗ; nó thay CẢ NHÁNH đã đổi bằng một object mới (`datLai`).
// - `banSaoDongBang` ghi nhớ kết quả theo THAM CHIẾU nguồn, nên nhánh không đổi được dùng
//   lại nguyên bản sao đóng băng cũ.
//
// Hai nửa này phụ thuộc lẫn nhau: sửa tại chỗ mà vẫn ghi nhớ theo tham chiếu thì bản sao trả
// ra sẽ là bản CŨ. Đó là lý do `noiBo` không bao giờ được gán vào một trường lồng bên trong.
//
// Hình dạng state được khai báo ĐỦ ngay từ bây giờ dù phần lớn chưa dùng: có một lúc duy
// nhất ai đó đối chiếu toàn bộ với bảng ba tầng của AD-3, và đó là lúc này. Để state mọc dần
// theo từng story thì không bao giờ có lúc đó nữa.
//
// State KHÔNG có trường nào mang nghĩa "một phép ghi đang chạy" hay "đã xong" (AD-16): view
// không có gì để vẽ ra thì không có chỉ báo nào lọt vào vì nó nghe có vẻ hữu ích. Thao tác
// thành công thì im lặng; dải băng chỉ dành cho chuyện xấu, cộng đúng một ngoại lệ là kết
// quả nạp file (AD-17).
//
// Story này dựng KHUNG cộng các action không cần cổng nào — khối điều kiện (AD-15). Luồng
// ghi bền (chốt, sửa, xóa, bản nháp, nạp sao lưu) thuộc Story 1.6+; chúng đọc `ports` từ
// closure của `taoStore`.
//
// Tệp này là `core/` thuần: chỉ import `../ports/index.js`, không chạm global trình duyệt.

import { kiemTraPorts } from '../ports/index.js';

/** Khóa ngày của khối điều kiện: `yyyy-MM-dd` và không gì khác (AD-4). Chỉ kiểm HÌNH DẠNG —
 *  một ngày không có thật vẫn không lọc ra ghi chú nào, và đó là kết quả đúng. */
const MAU_NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Đúng hai nửa, không có nửa thứ ba (AD-15). */
const KHOA_DIEU_KIEN = Object.freeze(['keyword', 'date']);

// Chép tại chỗ từ `core/time.js` có chủ ý: gom thành helper dùng chung là thêm một phụ thuộc
// giữa hai module lõi chỉ để tiết kiệm hai dòng.
function moTa(giaTri) {
  return typeof giaTri === 'string' ? JSON.stringify(giaTri) : String(giaTri);
}

function laObjectThuong(giaTri) {
  return typeof giaTri === 'object' && giaTri !== null && !Array.isArray(giaTri);
}

/** Object THUẦN — dựng bằng `{}`, không phải một thực thể của lớp nào. */
function laObjectThuan(giaTri) {
  if (!laObjectThuong(giaTri)) return false;
  const to = Object.getPrototypeOf(giaTri);
  return to === Object.prototype || to === null;
}

/**
 * Hình dạng đầy đủ của khối state, mọi trường ở giá trị rỗng.
 *
 * Ba tầng phạm vi của AD-3, tất cả cùng sống trong RAM ở đây:
 * - tầng A (bền, dùng chung): `notes`.
 * - tầng B (bền, riêng tab): `draft`.
 * - tầng C (phù du): `dieuKien`, `expandedId`, `editing`, `banner`, `readOnly`.
 *
 * `seq` là số đếm chống hẹn tự lưu sống lâu hơn thứ nó định ghi (AD-8): hẹn nào nổ ra mà
 * `seq` của nó không còn là `seq` hiện tại thì bị bỏ. Một số đếm cho bản nháp, một cho mẩu
 * đang sửa, vì chúng là hai mục tiêu tự lưu độc lập.
 */
function stateRong() {
  return {
    // Tầng A — toàn bộ ghi chú, sắp giảm dần theo khóa sắp xếp (AD-6).
    notes: [],
    // Tầng B — bản nháp của riêng tab này; không bao giờ đồng bộ sang tab khác (AD-7).
    draft: { text: '', seq: 0 },
    // Tầng C — điều kiện đang bật. `{null, null}` là VẮNG MẶT điều kiện (AD-15).
    dieuKien: { keyword: null, date: null },
    // Tầng C — mẩu đang mở rộng, và mẩu đang sửa cùng nội dung đang gõ của nó.
    expandedId: null,
    editing: { id: null, text: '', seq: 0 },
    // Tầng C — dải băng: một giá trị, một chủ (AD-17).
    banner: null,
    // Tầng C — tab đã thấy mã lệch phiên bản thì mọi action có ghi bị từ chối (AD-21).
    readOnly: false,
  };
}

/**
 * Bản sao đóng băng đã dựng cho một object nguồn, tra theo THAM CHIẾU của nguồn đó.
 *
 * `WeakMap` chứ không phải `Map`: khóa là object state, và một nhánh bị action thay ra phải
 * được thu hồi cùng lúc chứ không sống mãi trong một bảng tra.
 */
const banSaoDaDung = new WeakMap();

/**
 * Bản sao đóng băng sâu của một giá trị state.
 *
 * Đóng băng nông là không đủ: `store.state.dieuKien.keyword = 'x'` vẫn chạy được, và nó đổi
 * đúng cái nó không được đổi. Sao chép trước khi đóng băng cũng là cố ý — đóng băng thẳng
 * khối nội bộ sẽ làm chính các action không ghi vào nó được nữa.
 *
 * Ghi nhớ theo tham chiếu nguồn: một nhánh mà action không thay thì lần này trả lại đúng bản
 * sao lần trước, nên chi phí một action tỉ lệ với phần THỰC SỰ đổi, không với cỡ cả state.
 *
 * `Date` / `Map` / thực thể của một lớp thì NÉM, không đi qua: chúng không sao chép được
 * bằng phép đi cây này, nên chúng sẽ lọt ra ngoài dưới dạng tham chiếu KHÔNG đóng băng — tức
 * một lỗ đúng bằng cái mà cả hàm này sinh ra để bịt. Ném ở đây biến "một trường state kiểu
 * lạ" thành đỏ ngay ca test đầu tiên, thay vì thành một chỗ ghi thẳng vào state ở Epic sau.
 */
function banSaoDongBang(giaTri) {
  if (giaTri === null || typeof giaTri !== 'object') return giaTri;
  const daCo = banSaoDaDung.get(giaTri);
  if (daCo !== undefined) return daCo;

  let ra;
  if (Array.isArray(giaTri)) {
    ra = Object.freeze(giaTri.map(banSaoDongBang));
  } else if (laObjectThuan(giaTri)) {
    const object = {};
    for (const khoa of Object.keys(giaTri)) {
      object[khoa] = banSaoDongBang(giaTri[khoa]);
    }
    ra = Object.freeze(object);
  } else {
    throw new TypeError(
      `state chỉ chứa giá trị nguyên thủy, mảng và object thuần — không sao chép được ${moTa(giaTri)}`,
    );
  }
  banSaoDaDung.set(giaTri, ra);
  return ra;
}

/**
 * Chuẩn hóa nửa từ khóa của khối điều kiện.
 *
 * Chuỗi rỗng thành `null` vì nó là VẮNG MẶT điều kiện, không phải một điều kiện rỗng: xóa
 * hết chữ trong ô tìm kiếm phải trả về khung nhìn mặc định, không phải "tìm chuỗi rỗng".
 */
function keywordHopLe(giaTri) {
  if (giaTri === null) return null;
  if (typeof giaTri !== 'string') {
    throw new TypeError(`keyword phải là chuỗi hoặc null, nhận được ${moTa(giaTri)}`);
  }
  return giaTri === '' ? null : giaTri;
}

/**
 * Chuẩn hóa nửa ngày của khối điều kiện.
 *
 * Chuỗi gõ dở hay sai định dạng thì GIỮ giá trị cũ và không ném: người dùng gõ `2026-9` trên
 * đường tới `2026-09-10`, và mỗi phím trung gian không được làm dòng ghi chú nhảy. Lỗi định
 * dạng là lỗi tại chỗ của view, không phải lỗi của một phép đổi state (AD-15, AD-17).
 *
 * Nhưng SAI KIỂU thì ném: một con số hay một object chảy vào đây là lỗi lập trình, và giữ
 * giá trị cũ trong im lặng sẽ che nó đi.
 */
function ngayHopLe(giaTri, giaTriCu) {
  if (giaTri === null || giaTri === '') return null;
  if (typeof giaTri !== 'string') {
    throw new TypeError(`date phải là chuỗi 'yyyy-MM-dd', '' hoặc null, nhận được ${moTa(giaTri)}`);
  }
  return MAU_NGAY.test(giaTri) ? giaTri : giaTriCu;
}

/**
 * Dựng khối state của ứng dụng cùng toàn bộ action đổi được nó.
 *
 * Kiểm hình dạng cổng TRƯỚC KHI làm bất cứ việc gì khác: một cổng nối sai phải nổ lúc khởi
 * động, nêu đúng tên cổng và phương thức, thay vì nổ giữa một giao dịch đang ghi.
 *
 * @param {object} ports Năm cổng của `app/ports/`, do `app/main.js` nối vào.
 * @returns {{ state: object, datDieuKien: (partial: object) => void, xoaHetDieuKien: () => void }}
 *   Store với `state` chỉ đọc và các action. Story 1.6+ thêm action vào ĐÂY, không nơi khác.
 */
export function taoStore(ports) {
  kiemTraPorts(ports);

  let noiBo = stateRong();
  let anh = banSaoDongBang(noiBo);

  /**
   * Đường DUY NHẤT một action đổi state: thay các nhánh được nêu bằng object mới, rồi dựng
   * lại ảnh. Không action nào được gán vào một trường lồng bên trong `noiBo` — làm thế thì
   * phép ghi nhớ của `banSaoDongBang` sẽ trả lại bản sao cũ.
   *
   * Gọi ở CUỐI action, sau khi mọi phép kiểm đã qua: một action ném ra giữa đường phải để
   * lại state y như trước khi nó được gọi.
   */
  function datLai(nhanhMoi) {
    noiBo = { ...noiBo, ...nhanhMoi };
    anh = banSaoDongBang(noiBo);
  }

  /**
   * Đổi một hoặc cả hai nửa của khối điều kiện. Nửa không được nêu thì giữ nguyên.
   *
   * @param {{ keyword?: string | null, date?: string | null }} partial Nửa cần đổi.
   */
  function datDieuKien(partial) {
    if (!laObjectThuong(partial)) {
      throw new TypeError(
        `datDieuKien nhận một object mang keyword và/hoặc date, nhận được ${moTa(partial)}`,
      );
    }
    // Khóa lạ là lỗi lập trình, và bỏ qua trong im lặng là cách một nửa điều kiện thứ ba mọc
    // ra rồi sống ở đâu đó ngoài khối này — đúng thứ AD-15 sinh ra để chặn.
    for (const khoa of Object.keys(partial)) {
      if (!KHOA_DIEU_KIEN.includes(khoa)) {
        throw new TypeError(
          `datDieuKien chỉ nhận ${KHOA_DIEU_KIEN.join(' và ')}, nhận được khóa ${moTa(khoa)}`,
        );
      }
    }
    // Chuẩn hóa CẢ HAI nửa vào biến cục bộ trước, rồi mới chốt cả hai cùng lúc. Gán từng nửa
    // ngay lúc chuẩn hóa được nó thì `{ keyword: 'pho', date: 7 }` sẽ đổi `keyword` rồi mới
    // ném ở `date` — state còn lại một nửa đã đổi mà không ai chốt, và nửa mồ côi đó xuất
    // hiện trong ảnh của action THÀNH CÔNG kế tiếp. Một action ném là một action không đổi gì.
    const dieuKienCu = noiBo.dieuKien;
    let keyword = dieuKienCu.keyword;
    let date = dieuKienCu.date;
    if (Object.prototype.hasOwnProperty.call(partial, 'keyword')) {
      keyword = keywordHopLe(partial.keyword);
    }
    if (Object.prototype.hasOwnProperty.call(partial, 'date')) {
      date = ngayHopLe(partial.date, dieuKienCu.date);
    }
    datLai({ dieuKien: { keyword, date } });
  }

  /** Đưa khối điều kiện về `{ keyword: null, date: null }` — khung nhìn mặc định (AD-15). */
  function xoaHetDieuKien() {
    datLai({ dieuKien: { keyword: null, date: null } });
  }

  // Đóng băng chính store: gán thêm một action từ bên ngoài là dựng đường đổi state thứ hai.
  return Object.freeze({
    get state() {
      return anh;
    },
    datDieuKien,
    xoaHetDieuKien,
  });
}
