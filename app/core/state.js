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
// LUỒNG GHI CHUẨN sống ở đây, và đúng một lần (AD-8). Hai luồng, phân biệt được bằng thứ tự:
//
// - Thao tác đổi SỰ TỒN TẠI (thêm, xóa, và ở story sau là nạp file): ghi xuống kho TRƯỚC, đổi
//   state SAU. Cổng từ chối thì state giữ nguyên và mẩu giấy không xuất hiện.
// - TỰ LƯU nội dung đang gõ: state đổi NGAY theo từng phím (nếu không thì không gõ được),
//   phép ghi đi sau với debounce `AUTOSAVE_MS` và một số đếm `seq` gác. Ghi hỏng thì KHÔNG
//   hoàn tác chữ đã gõ — dải băng là thứ nói rằng chữ chưa an toàn.
//
// Cả hai đi qua đúng hai helper nội bộ dùng chung, và đó là điểm của story này: Epic 2 và
// Epic 5 nối giao diện vào bốn action dưới đây chứ không dựng lại luồng của mình. Hai bản
// luồng ghi thì nửa cứng của FR-19 ("không bao giờ giả vờ đã lưu") chỉ đúng ở một nửa.
//
// Ba trong bốn action chưa có giao diện nào gọi, và đó là đánh đổi đã chốt: thứ tự "ghi trước,
// state sau" chỉ phân biệt được bằng một action CHẠY THẬT khi cổng từ chối, nên một helper
// nội bộ không export sẽ biến AC đó thành lời hứa.
//
// Tệp này là `core/` thuần: chỉ import `../ports/index.js` và các module `core/` khác, không
// chạm global trình duyệt. `crypto.randomUUID` thì có — nó không phải global của DOM, nó có ở
// cả Node, và AD-13 chốt nó là nguồn duy nhất của `id`.

import {
  docFileSaoLuu,
  dungFileSaoLuu,
  gopTheoId,
  mocXuatSaoLuu,
  tenFileSaoLuu,
} from './backup.js';
import { LOAI_BANG, dongDuoc, thayDuoc } from './banner.js';
import { MA_LOI } from './errors.js';
import { fold } from './fold.js';
import { APP_VERSION, AUTOSAVE_MS, DRAFT_STALE_MS, MAX_NOTE_CHARS } from './limits.js';
import { localDate, localStamp, msBetweenIso, nowIso } from './time.js';
import { kiemTraPorts } from '../ports/index.js';

/** Khóa ngày của khối điều kiện: `yyyy-MM-dd` và không gì khác (AD-4). Chỉ kiểm HÌNH DẠNG —
 *  một ngày không có thật vẫn không lọc ra ghi chú nào, và đó là kết quả đúng. */
const MAU_NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Đúng hai nửa, không có nửa thứ ba (AD-15). */
const KHOA_DIEU_KIEN = Object.freeze(['keyword', 'date']);

/**
 * Hai bảng màu, và không có giá trị thứ ba (UX-DR-20).
 *
 * KHÔNG có `'system'`: nút ở chân trang là một phép LẬT hai chiều, không phải một hộp chọn ba
 * trạng thái. "Theo hệ thống" vẫn tồn tại, nhưng nó là trạng thái CHƯA CHỌN — khóa `ghichu.theme`
 * vắng mặt — và nó chỉ sống trong script nội tuyến của `index.html`, chỗ duy nhất đọc theme lúc
 * tải. Một giá trị `'system'` ghi xuống kho sẽ biến "chưa chọn" thành một lựa chọn, và nút mất
 * đúng thứ phân biệt hai chuyện đó.
 */
const THEME_HOP_LE = Object.freeze(['light', 'dark']);

/** Khóa cấu hình mang lựa chọn theme. Tên THẬT của nó (`ghichu.theme`) là chuyện của adapter. */
const KHOA_THEME = 'theme';

/** Khóa cấu hình mang mốc xuất sao lưu gần nhất — nguồn duy nhất của dòng nhắc Story 4.4. */
const KHOA_LAST_BACKUP = 'lastBackupAt';

/** Loại bản tin phát khi một khóa cấu hình đổi (AD-7). */
const TIN_PHIEN_DOI = 'session-changed';

/** Số hiệu hình dạng bản tin — hiện tại luôn là một (`app/ports/channel.js`). */
const HINH_DANG_BAN_TIN = 1;

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
 * Mã dải băng cho một lỗi từ cổng.
 *
 * Lỗi không mang mã thuộc tập đóng AD-18 vẫn phải ra một mã thật: `DB` là mã của "kho hỏng,
 * không biết hỏng thế nào", và nó đúng hơn mọi lựa chọn khác ở đây. Để `undefined` chảy vào
 * `banner` thì view sẽ đi tra microcopy của một mã không tồn tại và `errors.js` ném.
 *
 * Xét theo GIÁ TRỊ của bảng, không theo khóa: `loi.code` mang giá trị (`'QUOTA'`), và một
 * phép tra theo khóa tình cờ cũng đúng vì bảng ánh xạ tên sang chính nó — nhưng nó sẽ im lặng
 * sai ở ngày đầu tiên có một mã mà tên và giá trị khác nhau.
 */
function maBanner(loi) {
  const ma = loi == null ? undefined : loi.code;
  return Object.values(MA_LOI).includes(ma) ? ma : MA_LOI.DB;
}

/** Sắp giảm dần theo `localStamp` — bất biến của `notes` trong RAM (AD-4, AD-6). */
function sapGiamDan(danhSach) {
  const theoKhoa = new Map(danhSach.map((mau) => [mau, localStamp(mau)]));
  return [...danhSach].sort((x, y) => theoKhoa.get(y).localeCompare(theoKhoa.get(x)));
}

/**
 * Bản ghi ghi chú MỚI — đúng năm trường của AD-13, object THUẦN.
 *
 * Hai trường dẫn xuất tính tại đây, không nhận từ bên ngoài: `localDate` từ `createdAt` qua
 * `core/time.js`, `textFolded` từ `text` qua `core/fold.js`. `createdAt` là CHUỖI, không bao
 * giờ là một mốc thời gian — `banSaoDongBang` ném với thứ không phải object thuần.
 */
function banGhiMoi(text) {
  const createdAt = nowIso();
  return {
    id: crypto.randomUUID(),
    createdAt,
    localDate: localDate({ createdAt }),
    text,
    textFolded: fold(text),
  };
}

/** Bản ghi sau một lần sửa nội dung: `id` và `createdAt` bất biến, hai trường dẫn xuất tính lại. */
function banGhiSua(cu, text) {
  return {
    id: cu.id,
    createdAt: cu.createdAt,
    localDate: localDate(cu),
    text,
    textFolded: fold(text),
  };
}

/**
 * Hình dạng đầy đủ của khối state, mọi trường ở giá trị rỗng.
 *
 * Ba tầng phạm vi của AD-3, tất cả cùng sống trong RAM ở đây:
 * - tầng A (bền, dùng chung): `notes`.
 * - tầng B (bền, riêng tab): `draft`.
 * - tầng B′ (bền, dùng chung, kho cấu hình): `theme`.
 * - tầng C (phù du): `dieuKien`, `expandedIds`, `editing`, `banner`, `readOnly`.
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
    // Tầng B′ — bảng màu đang bật, dùng chung cho mọi tab qua kho cấu hình (AD-3, AD-9).
    //
    // Nó là một TRƯỜNG STATE chứ không phải một biến closure của `view/nut-theme.js`, và đó là
    // điều kiện chứ không phải sở thích: nhãn nút là một HÀM của theme (AD-19), và một ô nhớ ở
    // tầng view là đúng đường đổi state thứ hai mà AD-1 cấm. Nhờ nó nằm ở đây, phép ghi kho bền
    // vẫn đi qua `ghiTruocDatSau` như mọi phép ghi khác — nên "ghi hỏng thì theme KHÔNG đổi và
    // dải băng mang mã lỗi" là hệ quả của khuôn chung, không phải một nhánh viết riêng.
    //
    // `'light'` là giá trị khởi tạo chứ không phải một lựa chọn: `khoiDong` nhận theme THẬT từ
    // `data-theme` mà script `<head>` đã đặt. Nếu không ai đưa vào thì bảng light là thứ
    // `:root` của `app/style.css` vẽ ra, nên state và màn hình vẫn nói cùng một câu.
    theme: 'light',
    // Tầng C — điều kiện đang bật. `{null, null}` là VẮNG MẶT điều kiện (AD-15).
    dieuKien: { keyword: null, date: null },
    // Tầng C — TẬP mẩu đang mở rộng, và mẩu đang sửa cùng nội dung đang gõ của nó.
    //
    // Một MẢNG chứ không phải một `id` đơn: AC của Story 2.5 đòi "click hai mẩu bị cắt thì cả
    // hai cùng mở", nên một ô nhớ đơn sẽ thu mẩu trước lại mỗi lần mở mẩu sau. Và nó nằm ở
    // tầng C chứ không ở kho bền, nên tải lại trang là MỌI mẩu về thu gọn — theo thiết kế.
    expandedIds: [],
    editing: { id: null, text: '', seq: 0 },
    // Tầng C — dải băng: một giá trị, một chủ (AD-17).
    banner: null,
    // Tầng C — hai con số đi KÈM dải băng, và chỉ hàng 6 (`NAP_FILE_XONG`) có nghĩa với chúng.
    //
    // Một trường cạnh `banner` chứ không phải một `banner` kiểu object: `core/banner.js:30-35`
    // đã cân và từ chối phép đổi đó (14 chỗ đặt `banner` trong tệp này phải viết lại, cùng mọi
    // assertion của `test/core-state.test.js`). Đổi lại, `datLai` xoá trường này ở MỌI lần đặt
    // dải băng không nói gì về nó — nên không có đường nào để hai con số lệch khỏi loại đang
    // hiện, kể cả đường viết ở Epic sau.
    bannerSo: null,
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
 * @returns {{ state: object, datDieuKien: Function, xoaHetDieuKien: Function, dongDaiBang:
 *   Function, batTatMoRong: Function, khoiDong: Function, datTheme: Function,
 *   xuatSaoLuu: Function, napSaoLuu: Function,
 *   chotGhiChu: Function, xoaGhiChu: Function, tuLuuNoiDung: Function,
 *   khoiDongBanNhap: Function, datBanNhap: Function, nhipTimBanNhap: Function }}
 *   Store với `state` chỉ đọc và các action. Story sau thêm action vào ĐÂY, không nơi khác.
 */
export function taoStore(ports) {
  kiemTraPorts(ports);

  let noiBo = stateRong();
  let anh = banSaoDongBang(noiBo);

  /**
   * Danh tính của tab đang chạy, sống trong CLOSURE chứ không phải một trường state.
   *
   * Nó không phải thứ view vẽ ra, và tập tám khóa của AD-3 không có chỗ cho nó. `null` nghĩa
   * là chưa khởi động bản nháp — lúc đó không phép ghi bản nháp nào được chạm cổng, vì một
   * bản nháp không có chủ sẽ nằm lại trong kho mà không tab nào nhận lại được.
   */
  let tabCuaMinh = null;

  /**
   * Có một lần chốt đang bay hay không — sống trong CLOSURE, không phải một trường state.
   *
   * AD-16 cấm mọi trường mang nghĩa "đang lưu": view không có gì để vẽ ra thì không có chỉ báo
   * nào lọt vào. Nhưng phép gác thì vẫn cần, vì phím tự lặp gửi `Ctrl+Enter` nhiều lần trước
   * khi giao dịch đầu chốt xong — và lúc đó `draft.text` vẫn còn nguyên chữ để chốt lần nữa.
   */
  let dangChot = false;

  /**
   * Có một lần nạp file đang bay hay không — cùng khuôn, cùng lý do với `dangChot`.
   *
   * Phép gác này cần hơn hẳn phép gác của lần chốt: `napSaoLuu` đọc kho rồi ghi đè cả kho, nên
   * hai lần chạy chồng nhau sẽ gộp hai lần trên CÙNG một ảnh chụp `readAll` và lần ghi sau xoá
   * mất kết quả của lần trước. Nó không phải một trường state (AD-16): view không vẽ gì từ nó.
   */
  let dangNap = false;

  /**
   * Đường DUY NHẤT một action đổi state: thay các nhánh được nêu bằng object mới, rồi dựng
   * lại ảnh. Không action nào được gán vào một trường lồng bên trong `noiBo` — làm thế thì
   * phép ghi nhớ của `banSaoDongBang` sẽ trả lại bản sao cũ.
   *
   * Gọi ở CUỐI action, sau khi mọi phép kiểm đã qua: một action ném ra giữa đường phải để
   * lại state y như trước khi nó được gọi.
   *
   * PHÉP GÁC ƯU TIÊN của dải băng nằm ở ĐÂY, không ở từng chỗ gọi (AD-17). Hai lý do, và cả
   * hai đều về "không có đường thứ hai":
   *
   * - 14 chỗ đặt `banner` trong tệp này không phải đọc lại một dòng nào, nên không chỗ nào
   *   có thể quên phép gác — kể cả chỗ được viết ở Epic 7 hay Epic 8.
   * - `banner` thường đi CÙNG một nhánh khác trong một `datLai` duy nhất (`{ draft, banner }`,
   *   `{ ...dungNhanh(), banner: null }`). Gác ở đây thì nhánh kia vẫn vào state nguyên vẹn
   *   khi thông báo bị từ chối — bỏ cả lời gọi là mất luôn phần dữ liệu không liên quan.
   *
   * Loại bỏ ĐÚNG khóa `banner` chứ không bỏ cả phép đổi, và chỉ khi khóa đó CÓ MẶT: một
   * `datLai` không nói gì về dải băng thì không được vô tình chạm tới nó.
   */
  function datLai(nhanhMoi) {
    let nhanh = nhanhMoi;
    if (Object.prototype.hasOwnProperty.call(nhanhMoi, 'banner')) {
      if (thayDuoc(noiBo.banner, nhanhMoi.banner)) {
        // Một phép đặt dải băng KHÔNG nói gì về hai con số thì xoá chúng: chúng chỉ có nghĩa
        // với đúng một hàng, và một cặp số sống sót qua một lần đổi loại là cặp số của một
        // chuyện khác đứng cạnh một câu chữ không phải của nó.
        if (!Object.prototype.hasOwnProperty.call(nhanhMoi, 'bannerSo')) {
          nhanh = { ...nhanhMoi, bannerSo: null };
        }
      } else {
        // Ưu tiên thấp hơn cái đang hiện: bỏ CẢ loại lẫn hai con số của nó, và giữ nguyên phần
        // còn lại của phép đổi. Bỏ riêng `banner` mà để `bannerSo` vào là cách hai con số của
        // một dải băng bị từ chối đi đứng cạnh câu chữ của dải băng đang hiện.
        nhanh = { ...nhanhMoi };
        delete nhanh.banner;
        delete nhanh.bannerSo;
      }
    }
    noiBo = { ...noiBo, ...nhanh };
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

  /**
   * Đóng dải băng đang hiện — đường của nút `✕`, và CHỈ của nó (AD-17).
   *
   * Hàng không đóng được thì không làm gì cả: ba hàng đầu của bảng nói rằng dữ liệu đang
   * không an toàn, nên chúng chỉ tắt bởi một phép ghi sau đó thành công (AD-8) hay một lần
   * tải lại trang. `view/banner.js` cũng không dựng nút `✕` cho chúng, nên cửa này bình
   * thường không bị gõ — nhưng nó vẫn phải gác, vì "nút không có" là một luật của tầng vẽ và
   * luật của tầng vẽ không bảo vệ được một bất biến của state.
   *
   * Đây là đường KHÁC với "tắt sau khi ghi thành công" (`ghiTruocDatSau`, `ghiBanNhap`): đường
   * đó đặt `banner: null` qua `datLai` và KHÔNG xét cờ đóng-được, vì nó không phải một cú bấm
   * mà là bằng chứng rằng chuyện xấu đã qua.
   *
   * @returns {void}
   */
  function dongDaiBang() {
    const dangHien = noiBo.banner;
    if (dangHien === null) return;
    if (!dongDuoc(dangHien)) return;
    datLai({ banner: null });
  }

  /** Đưa khối điều kiện về `{ keyword: null, date: null }` — khung nhìn mặc định (AD-15). */
  function xoaHetDieuKien() {
    datLai({ dieuKien: { keyword: null, date: null } });
  }

  /**
   * Bật/tắt trạng thái MỞ RỘNG của một mẩu (Story 2.5).
   *
   * Đây là một action của lõi chứ không phải một biến trong closure của view, và lý do không
   * phải thẩm mỹ: luật "view không giữ state riêng" được ghim bằng test, và một ô nhớ thứ hai
   * ở tầng view là đúng đường đổi state mà AD-1 cấm.
   *
   * KHÔNG chạm cổng nào: trạng thái mở rộng là tầng C, chỉ RAM. Nó không đi xuống IndexedDB
   * lẫn localStorage, nên "tải lại trang thì mọi mẩu về thu gọn" đúng theo thiết kế chứ không
   * tình cờ — và vì thế nó không đi qua `ghiTruocDatSau`, y như hai action điều kiện ở trên.
   *
   * `id` lạ (mẩu đã bị xóa, hay một chuỗi bịa) KHÔNG ném: tập này là một cái nhớ phù du, và
   * một `id` không còn mẩu nào mang chỉ đơn giản không ảnh hưởng lượt vẽ nào.
   *
   * @param {string} id `id` của mẩu cần bật/tắt.
   * @returns {void}
   */
  function batTatMoRong(id) {
    if (typeof id !== 'string' || id === '') {
      throw new TypeError(`batTatMoRong nhận id là chuỗi khác rỗng, nhận được ${moTa(id)}`);
    }
    const dangMo = noiBo.expandedIds.includes(id);
    datLai({
      expandedIds: dangMo
        ? noiBo.expandedIds.filter((khac) => khac !== id)
        : [...noiBo.expandedIds, id],
    });
  }

  /**
   * HELPER DÙNG CHUNG 1 — luồng "đổi sự tồn tại": ghi xuống kho TRƯỚC, đổi state SAU (AD-8).
   *
   * `dungNhanh` được gọi CHỈ KHI phép ghi đã chốt, và được gọi lúc đó chứ không trước: nó đọc
   * khối nội bộ tại thời điểm ghi xong, nên hai action chạy chồng nhau không ghi đè kết quả
   * của nhau bằng một ảnh chụp cũ.
   *
   * Lỗi KHÔNG ném ra ngoài: một cổng từ chối là chuyện của người dùng, và đường ra của nó là
   * dải băng (AD-17). Ném thêm ra ngoài là bắt mọi chỗ gọi tự xử lý một lần nữa.
   *
   * Ghi thành công thì TẮT dải băng: AD-8 nói dải băng ở lại "cho tới khi một phép ghi sau đó
   * thành công", nên một lần hết dung lượng không được đeo bám mọi thao tác về sau.
   */
  function ghiTruocDatSau(phepGhi, dungNhanh) {
    return phepGhi().then(
      () => {
        datLai({ ...dungNhanh(), banner: null });
      },
      (loi) => {
        datLai({ banner: maBanner(loi) });
      },
    );
  }

  /**
   * HELPER DÙNG CHUNG 2 — luồng "tự lưu": state đã đổi rồi, phép ghi đi sau (AD-8).
   *
   * `seqCuaHen` là số đếm tại lúc hẹn được đặt. Hẹn nào nổ ra mà `editing.seq` đã tăng thì nó
   * đang định ghi một chữ không còn trên màn hình — nó BỊ BỎ, và không chạm cổng.
   *
   * Không hủy hẹn cũ lúc đặt hẹn mới, có chủ ý: `seq` là cơ chế chính thức của AD-8, và nếu
   * `clearTimeout` gánh phần đó thì phép gác `seq` không còn đường nào chạy qua — tức nó trở
   * thành mã không ai kiểm, đúng lúc nó là thứ duy nhất chặn một hẹn sống dai ghi đè chữ mới.
   */
  function henGhiDiSau(seqCuaHen, dungBanGhi) {
    setTimeout(() => {
      if (noiBo.editing.seq !== seqCuaHen) return;
      const banGhi = dungBanGhi();
      // Mục tiêu đã biến mất khỏi kho trong RAM (bị xóa trong lúc chờ) — không hồi sinh nó.
      if (banGhi === null) return;
      ports.noteStore.put(banGhi).then(
        () => {
          // Cùng quy tắc với `ghiTruocDatSau`: một phép ghi thành công tắt dải băng (AD-8).
          datLai({
            notes: noiBo.notes.map((mau) => (mau.id === banGhi.id ? banGhi : mau)),
            banner: null,
          });
        },
        (loi) => {
          datLai({ banner: maBanner(loi) });
        },
      );
    }, AUTOSAVE_MS);
  }

  /**
   * Nạp toàn bộ ghi chú từ kho bền vào RAM, sắp giảm dần theo `localStamp` (AD-6).
   *
   * Sắp xếp ở ĐÂY chứ không tin thứ tự của kho: chữ ký cổng nói rõ thứ tự trả về không đáng
   * tin, và `localStamp` là khóa sắp xếp duy nhất (AD-4).
   *
   * Nạp hỏng thì `notes` giữ `[]` và dải băng mang mã của lỗi — không ném ra ngoài, vì chỗ
   * gọi duy nhất là lúc khởi động và ở đó không có ai bắt.
   *
   * `themeBanDau` đi vào qua THAM SỐ, không qua một global: theme lúc tải do script nội tuyến
   * trong `<head>` của `index.html` quyết định (nó là chỗ DUY NHẤT đọc `ghichu.theme` lúc tải),
   * và `app/main.js` đọc lại kết quả đó từ `data-theme` rồi đưa xuống đây. Lõi vì thế không
   * chạm `document`, và nó cũng không đọc kho cấu hình lần thứ hai — hai phép đọc sẽ trôi khỏi
   * nhau đúng ở khung hình đầu tiên, chỗ không ai nhìn.
   *
   * Đặt theme ĐỒNG BỘ, trước cả lời hứa đọc kho: nhãn nút phải đúng ngay lượt vẽ đầu tiên, và
   * lượt vẽ đó không có lý do gì phải đợi IndexedDB trả lời. Giá trị lạ thì bị bỏ qua trong im
   * lặng — `data-theme` là thứ ai cũng gõ tay được trong DevTools, và một `TypeError` lúc khởi
   * động vì chuyện đó sẽ giết cả trang.
   *
   * @param {string} [themeBanDau] Bảng màu mà lần vẽ đầu tiên đang dùng.
   */
  function khoiDong(themeBanDau) {
    if (THEME_HOP_LE.includes(themeBanDau)) datLai({ theme: themeBanDau });
    return ports.noteStore.readAll().then(
      (danhSach) => {
        try {
          datLai({ notes: sapGiamDan(danhSach) });
        } catch {
          // Một bản ghi mang `createdAt` rác: kho đọc được nhưng không dùng được. Cùng một
          // đường ra với lỗi kho, vì với người dùng thì đó là cùng một chuyện.
          datLai({ banner: MA_LOI.DB });
        }
      },
      (loi) => {
        datLai({ banner: maBanner(loi) });
      },
    );
  }

  /**
   * Phát một bản tin `session-changed` tới mọi tab khác (AD-7).
   *
   * Hình dạng đúng bốn trường của `app/ports/channel.js`, và bản tin KHÔNG mang theo giá trị
   * theme: cổng chỉ mang TIN, không mang nội dung — tab nhận đọc lại từ kho bền, nên một tin
   * đến muộn không dựng lại được một lựa chọn đã cũ đè lên lựa chọn mới.
   *
   * Danh tính tab lấy từ `tabCuaMinh` nếu bản nháp đã khởi động, và hỏi lại kho phạm vi phiên
   * nếu chưa: một bản tin không có người phát thì tab nhận không lọc ra được tin của chính
   * mình. Kho từ chối trả danh tính thì KHÔNG phát và cũng KHÔNG có dải băng — phép ghi theme
   * đã thành công rồi, và một cái chuông không gõ được không phải chuyện của người dùng.
   *
   * CẢ phép phát nằm trong `try`, không chỉ phép hỏi danh tính: một kênh liên tab đã đóng
   * (`InvalidStateError`) ném ngay tại `publish`, và hàm này được gọi ở CUỐI những đường đã
   * thành công trọn vẹn. Để cái ném đó thoát ra ngoài là biến một cái chuông không gõ được
   * thành một mã lỗi đè lên dải băng của một thao tác vừa chạy đúng — `napSaoLuu` bắt nó ở
   * `.catch` ngoài cùng và đặt `DB`, tức mã có ưu tiên cao hơn hàng 6 và giết luôn hai con số.
   * Cùng một lý do với nhánh danh tính, chỉ khác chỗ ném.
   */
  function phatPhienDoi() {
    let nguoiPhat;
    try {
      nguoiPhat = tabCuaMinh ?? ports.sessionStore.tabIdentity();
    } catch {
      return;
    }
    try {
      ports.channel.publish({
        v: HINH_DANG_BAN_TIN,
        type: TIN_PHIEN_DOI,
        from: nguoiPhat,
        appVersion: APP_VERSION,
      });
    } catch {
      /* Chuông không gõ được không phải chuyện của người dùng — và không phải một dải băng. */
    }
  }

  /**
   * Đổi bảng màu: ghi xuống kho cấu hình TRƯỚC, đổi state SAU (AD-8), rồi gõ chuông liên tab.
   *
   * Đây là luồng "đổi sự tồn tại" chứ không phải luồng tự lưu, và thứ tự đó là toàn bộ AC "kho
   * bị chặn": `localStorage` bị chặn hẳn thì theme KHÔNG đổi, nhãn nút giữ nguyên, và dải băng
   * mang đúng mã của cổng. Đổi state trước rồi ghi sau là hứa một lựa chọn sẽ được nhớ lại
   * trong khi nó vừa rơi xuống đất.
   *
   * Cổng `sessionStore` ĐỒNG BỘ và NÉM, còn `ghiTruocDatSau` nói chuyện bằng lời hứa — nên phép
   * ghi được bọc trong một `Promise`, và phần thân chạy NGAY trong hàm dựng, không lùi lại một
   * lượt. Một `throw` trong đó thành một lời hứa bị từ chối, đúng cửa mà nhánh lỗi đang chờ.
   *
   * Giá trị lạ thì NÉM chứ không bỏ qua: chỗ gọi duy nhất là một cú lật hai chiều, nên một giá
   * trị thứ ba đi vào đây là lỗi lập trình, và nuốt nó là để nút im lặng không làm gì cả.
   *
   * @param {'light' | 'dark'} giaTri Bảng màu cần bật.
   * @returns {Promise<void>} Hoàn tất khi state đã phản ánh kết quả. Lời hứa không bao giờ bị từ
   *   chối — nhưng một giá trị lạ NÉM ĐỒNG BỘ, trước khi có lời hứa nào, nên một `.catch()` treo
   *   vào lời gọi này không bắt được nó. Đó là chủ ý: lỗi của người dùng đi ra dải băng, lỗi của
   *   lập trình viên đi ra ngăn xếp.
   */
  function datTheme(giaTri) {
    if (!THEME_HOP_LE.includes(giaTri)) {
      throw new TypeError(
        `datTheme chỉ nhận ${THEME_HOP_LE.join(' hoặc ')}, nhận được ${moTa(giaTri)}`,
      );
    }
    // Cờ trong CLOSURE, cùng khuôn `daChot` của `themGhiChu`: `ghiTruocDatSau` không nói cho
    // chỗ gọi biết nhánh nào đã chạy, và đọc `noiBo.theme` để đoán thì một lần bấm lại đúng
    // theme đang bật sẽ gõ chuông kể cả khi kho vừa từ chối.
    let xuongKho = true;
    return ghiTruocDatSau(
      () =>
        new Promise((xong) => {
          ports.sessionStore.write(KHOA_THEME, giaTri);
          xong();
        }).catch((loi) => {
          xuongKho = false;
          throw loi;
        }),
      () => ({ theme: giaTri }),
    ).then(() => {
      if (xuongKho) phatPhienDoi();
    });
  }

  /**
   * Xuất TOÀN BỘ ghi chú ra một file sao lưu, rồi ghi lại mốc xuất (Story 4.2, UJ-3).
   *
   * Đây là phanh an toàn duy nhất của sản phẩm, nên nó có ba luật riêng, và cả ba đều ngược
   * với khuôn của mọi action khác trong tệp này:
   *
   * - KHÔNG đi qua `ghiTruocDatSau`: không có state nào để đổi. Xuất sao lưu không thêm, không
   *   sửa, không xóa một ghi chú nào — nó chỉ đọc. Một `datLai` ở đây là dựng lại ảnh state cho
   *   một lần không có gì đổi.
   * - KHÔNG dải băng ở bất cứ nhánh nào (quyết định đã chốt của spec): xuất thành công thì giao
   *   diện im lặng tuyệt đối (AD-16 — không chỉ báo "đã lưu"), và xuất hỏng cũng im lặng. Bằng
   *   chứng của thất bại đã có sẵn và đúng hơn mọi thông báo: `lastBackupAt` KHÔNG được ghi,
   *   nên dòng nhắc của Story 4.4 vẫn nói "chưa có bản sao lưu nào". Tập mã lỗi đóng của
   *   `core/errors.js` vì thế không phải nới thêm một mã.
   * - Nguồn dữ liệu là `noiBo.notes` — tầng A trong RAM, tức TOÀN BỘ ghi chú chưa lọc — chứ
   *   không phải `ports.noteStore.readAll()`. Bộ lọc đang bật là tầng C và nó không được chạm
   *   tới nội dung file; còn một phép đọc kho thêm vào đây chỉ đẻ ra một nhánh lỗi nữa cho một
   *   đường đã hứa im lặng. Bản nháp đang gõ cũng không lọt: nó là tầng B, không phải ghi chú.
   *
   * `exportedAt` dựng ĐÚNG MỘT LẦN rồi dùng cho cả tên file, nội dung file và `lastBackupAt`:
   * hai lời gọi `nowIso()` cho hai giá trị lệch nhau vài mili giây, và Story 4.4 đo khoảng cách
   * ngày từ mốc đó — một mốc không khớp với chính file nó nói tới là loại lệch không ai đi tìm.
   *
   * Cổng `fileIO` có thể NÉM đồng bộ (một adapter dựng Blob hỏng) hoặc trả về một lời hứa bị từ
   * chối; cả hai đi cùng một đường, nên lời gọi nằm trong `try` và kết quả đi qua
   * `Promise.resolve`. Ghi `lastBackupAt` hỏng thì NUỐT — file đã rời máy rồi, và một dải băng
   * lỗi lúc đó nói sai về chuyện vừa xảy ra; chỉ có cái chuông liên tab là không được gõ, vì
   * không có gì trong kho đổi để tab khác đọc lại.
   *
   * @returns {Promise<void>} Hoàn tất khi file đã được trao đi và mốc đã ghi — không bao giờ bị
   *   từ chối, ở cả hai nhánh.
   */
  function xuatSaoLuu() {
    let exportedAt;
    let daGoi;
    // Cả phần DỰNG nằm trong `try`, không chỉ lời gọi cổng: `nowIso` và hai hàm của
    // `core/backup.js` ném với một bản ghi mang `createdAt` rác, và lời hứa trả về đây được
    // `app/view/chan-trang.js` tin tới mức cố ý không treo `.catch`.
    try {
      exportedAt = nowIso();
      daGoi = ports.fileIO.exportFile(
        tenFileSaoLuu(exportedAt),
        dungFileSaoLuu(noiBo.notes, exportedAt),
      );
    } catch {
      return Promise.resolve();
    }
    return Promise.resolve(daGoi).then(
      () => {
        try {
          ports.sessionStore.write(KHOA_LAST_BACKUP, exportedAt);
        } catch {
          // Kho cấu hình bị chặn: mốc không ghi được, nên không có gì cho tab khác đọc lại và
          // không có chuông nào để gõ. File thì đã xuống máy — im lặng là câu đúng.
          return;
        }
        phatPhienDoi();
      },
      () => {
        /* Cổng từ chối: im lặng hoàn toàn, và `lastBackupAt` giữ nguyên giá trị cũ. */
      },
    );
  }

  /**
   * HÀM NỘI BỘ — ghi `lastBackupAt` bằng mốc của file vừa nạp, CHỈ KHI nó mới hơn mốc đang có.
   *
   * "Mới hơn" đo bằng `msBetweenIso`, không bằng phép so chuỗi: hai mốc sinh ở hai offset khác
   * nhau cho thứ tự chuỗi ngược với thứ tự thật, đúng thứ AD-4 cấm.
   *
   * Nạp một file CŨ không được đẩy mốc lùi lại: dòng nhắc của Story 4.4 đếm "bao lâu rồi chưa
   * sao lưu", và một mốc lùi làm nó nhắc sớm; một mốc nhảy tới tương lai vì một file cũ hơn
   * ghi đè thì tệ hơn — nó im lặng đúng lúc cần nhắc. Nên chiều duy nhất mốc đi là tiến.
   *
   * NUỐT mọi lỗi: ghi chú đã vào kho rồi, và dải băng thành công đã nói đúng chuyện vừa xảy
   * ra. Một mã lỗi ở đây là nói sai về nó. Mốc rác trong file cũng đi cùng đường này —
   * `msBetweenIso` ném, và pha 1 cố ý không kiểm `exportedAt`.
   *
   * @param {string|null} exportedAt Mốc ghi trong file, hoặc `null` khi file không có.
   */
  function ghiMocSaoLuuMoiHon(exportedAt) {
    if (typeof exportedAt !== 'string') return;
    try {
      const dangCo = ports.sessionStore.read(KHOA_LAST_BACKUP);
      // Chưa từng ghi mốc nào thì mọi mốc đều mới hơn.
      if (typeof dangCo === 'string' && msBetweenIso(dangCo, exportedAt) <= 0) return;
      ports.sessionStore.write(KHOA_LAST_BACKUP, exportedAt);
    } catch {
      return;
    }
    // Chỉ gõ chuông khi có một giá trị MỚI trong kho cho tab khác đọc lại — không ghi thì
    // không có gì đổi, và một bản tin rỗng chỉ làm mọi tab đọc lại đúng thứ chúng đang có.
    phatPhienDoi();
  }

  /**
   * Nạp lại một file sao lưu: hai pha tách bạch, gộp theo `id`, và đúng một lời gọi ghi (4.3).
   *
   * Đây là nửa còn lại của phanh an toàn UJ-3, và là action DUY NHẤT được phép nói một câu khi
   * thành công (AD-16, hàng 6 của AD-17). Bốn luật riêng của nó:
   *
   * - HAI PHA TÁCH BẠCH. Pha 1 (`docFileSaoLuu`) kiểm TOÀN BỘ file trước khi chạm kho — một
   *   ghi chú sai ở ghi chú thứ 468 chặn cả 467 cái trước nó, và `replaceAll` không được gọi
   *   một lần nào. Pha 2 là đúng MỘT lời gọi cổng, tức một giao dịch: nửa vời là dữ liệu lai.
   * - NGUỒN ĐỂ GỘP LÀ KHO, không phải `noiBo.notes`. `replaceAll` xoá sạch rồi ghi lại, nên
   *   gộp trên một bản RAM cũ hơn kho là một phép XOÁ THẬT những ghi chú mà tab khác vừa thêm
   *   — đúng cái "không bao giờ mất" mà epic cấm. Đây là chỗ duy nhất trong tệp này đọc kho
   *   giữa chừng, và lý do nó đọc thì ngược hẳn với lý do `xuatSaoLuu` cố ý KHÔNG đọc.
   * - GỘP, KHÔNG BAO GIỜ MẤT: bản đang có luôn thắng (`gopTheoId`), `createdAt` gốc giữ nguyên
   *   tuyệt đối, không xóa, không ghi đè, không tombstone.
   * - `dieuKien` KHÔNG bị xoá, khác hẳn `chotGhiChu`: `EXPERIENCE.md:251` tả đúng cảnh lưới
   *   vẫn rỗng sau khi nạp và Nam tự gõ lại ngày — đó là hành vi đã chốt, không phải sơ suất.
   *
   * Dải băng thành công đặt ở một `datLai` THỨ HAI, sau `ghiTruocDatSau` chứ không lồng vào
   * nó: helper chung trộn `banner: null` vào nhánh thành công (AD-8 — một phép ghi thành công
   * tắt dải băng), và đó là luật đúng, kể cả ở đây. Một `QUOTA` đang hiện phải tắt TRƯỚC, rồi
   * hàng 6 mới lên; nhét hàng 6 vào thẳng `ghiTruocDatSau` thì phép gác ưu tiên từ chối nó và
   * `QUOTA` ở lại vĩnh viễn sau một phép ghi vừa thành công.
   *
   * @returns {Promise<void>} Hoàn tất khi state đã phản ánh kết quả — không bao giờ bị từ chối.
   */
  function napSaoLuu() {
    if (dangNap) return Promise.resolve();
    dangNap = true;
    // Cả lời gọi cổng nằm trong chuỗi lời hứa: `readChosenFile` có thể NÉM đồng bộ (một adapter
    // chưa nối), và cửa ra của mọi lỗi ở action này là dải băng, không phải một lời hứa bị từ
    // chối mà `view/chan-trang.js` cố ý không bắt.
    return Promise.resolve()
      .then(() => ports.fileIO.readChosenFile())
      .then((daChon) => {
        // Nam bấm Huỷ ở hộp chọn file: `null` là câu trả lời HỢP LỆ của cổng, không phải lỗi.
        // Im lặng tuyệt đối — không dải băng, không một trường state nào đổi.
        if (daChon === null || daChon === undefined) return undefined;
        let tuFile;
        try {
          tuFile = docFileSaoLuu(daChon.text);
        } catch (loi) {
          datLai({ banner: maBanner(loi) });
          return undefined;
        }
        const moc = mocXuatSaoLuu(daChon.text);
        return ports.noteStore.readAll().then(
          (dangCo) => {
            const gop = gopTheoId(dangCo, tuFile);
            // Cờ trong CLOSURE, cùng khuôn `daChot` của `themGhiChu`: `ghiTruocDatSau` không
            // nói cho chỗ gọi biết nhánh nào đã chạy, và đọc `noiBo.banner` để đoán thì một
            // lần nạp sau một lỗi kho sẽ tự khen mình đã xong.
            let daGop = true;
            return ghiTruocDatSau(
              () =>
                ports.noteStore.replaceAll(gop.ketQua).catch((loi) => {
                  daGop = false;
                  throw loi;
                }),
              () => ({ notes: sapGiamDan(gop.ketQua) }),
            ).then(() => {
              if (!daGop) return;
              datLai({
                banner: LOAI_BANG.NAP_FILE_XONG,
                bannerSo: { added: gop.added, skipped: gop.skipped },
              });
              ghiMocSaoLuuMoiHon(moc);
            });
          },
          (loi) => {
            // Kho không đọc được thì KHÔNG ghi gì: gộp trên một tập rỗng tưởng tượng là xoá
            // sạch kho bằng đúng nội dung file.
            datLai({ banner: maBanner(loi) });
          },
        );
      })
      .catch((loi) => {
        datLai({ banner: maBanner(loi) });
      })
      .then(() => {
        dangNap = false;
      });
  }

  /**
   * HÀM NỘI BỘ — dựng bản ghi mới rồi ghi nó xuống kho CÙNG bản nháp đã làm rỗng, và chỉ đổi
   * state sau khi giao dịch chốt (AD-8).
   *
   * Không còn là action công khai, và đó là một quyết định: hai đường tạo ghi chú với hai luật
   * ghi khác nhau (một đường không nguyên tử với `drafts`) đúng là loại lệch mà AD-8 sinh ra để
   * chặn. `chotGhiChu` là cửa duy nhất, và nó gọi hàm này cho phần dựng-và-ghi.
   *
   * `seqLucChot` là số đếm của bản nháp tại lúc chốt. Đọc `noiBo.draft.seq` LÚC GHI XONG chứ
   * không dùng một ảnh chụp cũ: Nam có thể đã gõ tiếp trong lúc đĩa còn quay, và lúc đó chữ mới
   * phải thắng — nên ô KHÔNG được làm trống, cùng chiều với phép so sánh của `khoiDongBanNhap`.
   *
   * @param {string} text Chữ được chốt, nguyên trạng.
   * @param {number} seqLucChot Số đếm bản nháp tại lúc chốt.
   * @returns {Promise<boolean>} `true` nếu giao dịch chốt được, `false` nếu cổng từ chối.
   */
  function themGhiChu(text, seqLucChot) {
    const banGhi = banGhiMoi(text);
    // Chưa giành được bản nháp thì không có bản ghi `drafts` nào của tab này để làm rỗng — và
    // dựng một bản dưới một danh tính chưa giành được là để lại rác không tab nào nhận lại.
    const banNhapRong =
      tabCuaMinh === null ? null : { tabId: tabCuaMinh, text: '', heartbeat: nowIso() };
    let daChot = true;
    return ghiTruocDatSau(
      () =>
        ports.noteStore.commitDraft({ note: banGhi, draft: banNhapRong }).catch((loi) => {
          daChot = false;
          throw loi;
        }),
      // Một `datLai` cho CẢ HAI nhánh: `ghiTruocDatSau` trộn `banner: null` vào đúng một lần,
      // nên tách làm hai là hai lần dựng lại ảnh và một khoảnh khắc state nửa vời ở giữa.
      //
      // Sắp lại chứ không chỉ chèn lên đầu: mẩu mới thường là mẩu mới nhất, nhưng "thường"
      // không phải bất biến — đồng hồ máy lùi lại, hay một bản ghi nạp từ file sao lưu (Epic
      // 4) mang mốc tương lai, đều để lại một mảng lệch thứ tự mà không ai thấy.
      () => ({
        notes: sapGiamDan([banGhi, ...noiBo.notes]),
        draft:
          noiBo.draft.seq === seqLucChot ? { text: '', seq: noiBo.draft.seq } : noiBo.draft,
      }),
    ).then(() => daChot);
  }

  /**
   * Chốt bản nháp hiện tại thành một ghi chú — nhịp cuối của UJ-1.
   *
   * KHÔNG nhận tham số: nguồn chữ duy nhất là `state.draft.text`. Bản nháp là thứ được chốt, và
   * một tham số `text` sẽ mở đúng cái cửa thứ hai mà AD-8 vừa đóng lại.
   *
   * Năm bước, theo đúng thứ tự này:
   *
   * 1. Tăng `draft.seq` — hủy mọi hẹn tự lưu đang treo. Đi TRƯỚC mọi thứ khác: một `Ctrl+Enter`
   *    xảy ra giữa hai phím gõ, và một hẹn cũ nổ ra SAU lúc chốt sẽ ghi lại xuống `drafts` đúng
   *    chữ vừa biến thành ghi chú — một bản nháp ma, và cú chốt sau sinh ra một mẩu trùng.
   *    Hủy bằng `seq` chứ không bằng `clearTimeout` là cơ chế chính thức của AD-8.
   * 2. Gác rỗng — không có gì để chốt thì thoát ngay, TRƯỚC `xoaHetDieuKien()`. AC của epic gọi
   *    `xoaHetDieuKien()` là "bước đầu tiên", nhưng đó là bước đầu tiên của một lần chốt THẬT:
   *    một cú bấm nhầm trên ô trống không được âm thầm xóa bộ lọc đang bật (Epic 6).
   * 3. Gác trần — cổng KHÔNG bị gọi, chữ nằm nguyên trong ô, dải băng `TOO_LONG` (AD-14).
   * 4. `xoaHetDieuKien()` — mẩu vừa chốt phải nhìn thấy được ngay, kể cả khi bộ lọc đang bật.
   * 5. Dựng bản ghi và ghi xuống kho, rồi mới đổi state.
   *
   * Hỏng thì chữ KHÔNG mất: `notes` không đổi, `draft.text` còn nguyên, dải băng mang mã lỗi, và
   * một hẹn tự lưu được đặt lại để chữ chưa an toàn còn một đường xuống kho.
   *
   * Một lần chốt ĐANG BAY thì cú bấm thứ hai không làm gì cả: phím tự lặp của bàn phím gửi
   * `Ctrl+Enter` nhiều lần trong vài chục mili giây, và giao dịch chưa chốt xong thì `draft.text`
   * vẫn còn nguyên chữ — hai lời gọi cổng, hai ghi chú trùng nội dung với hai `id` khác nhau.
   *
   * @returns {Promise<void>} Hoàn tất khi state đã phản ánh kết quả — không bao giờ bị từ chối.
   */
  function chotGhiChu() {
    if (dangChot) return Promise.resolve();
    const seqMoi = noiBo.draft.seq + 1;
    const text = noiBo.draft.text;
    datLai({ draft: { text, seq: seqMoi } });
    if (text.trim() === '') {
      // Bước (1) vừa hủy hẹn tự lưu đang treo, và bản nháp rỗng này cũng cần xuống kho: xóa
      // hết chữ rồi bấm nhầm `Ctrl+Enter` mà không đặt lại hẹn thì chữ đã xóa quay về ở lần
      // tải lại sau. Cùng một phép đặt lại với nhánh ghi hỏng.
      henGhiBanNhapDiSau(seqMoi);
      return Promise.resolve();
    }
    if (text.length > MAX_NOTE_CHARS) {
      datLai({ banner: MA_LOI.TOO_LONG });
      return Promise.resolve();
    }
    xoaHetDieuKien();
    dangChot = true;
    return themGhiChu(text, seqMoi).then((daChot) => {
      dangChot = false;
      // Ghi hỏng: chữ còn trên màn hình và chưa an toàn ở đâu cả. Đặt lại hẹn tự lưu cho nó —
      // nhưng chỉ khi Nam chưa gõ tiếp, vì một phím gõ sau đó đã tự đặt hẹn của nó rồi.
      if (!daChot && noiBo.draft.seq === seqMoi) henGhiBanNhapDiSau(seqMoi);
    });
  }

  /**
   * Xóa một ghi chú: rút khỏi kho trước, rồi mới rút khỏi `notes`.
   *
   * `id` không có trong RAM thì không chạm cổng: kho là nguồn sự thật cho phép ghi, nhưng một
   * `id` lạ ở đây là lỗi của chỗ gọi, và một lệnh xóa gửi xuống kho cho một bản ghi không tồn
   * tại thành công trong im lặng — tức nó sẽ trông như đã làm gì.
   *
   * @param {string} id Định danh ghi chú cần xóa.
   * @returns {Promise<void>} Hoàn tất khi state đã phản ánh kết quả — không bao giờ bị từ chối.
   */
  function xoaGhiChu(id) {
    if (typeof id !== 'string') {
      throw new TypeError(`xoaGhiChu nhận id là chuỗi, nhận được ${moTa(id)}`);
    }
    if (!noiBo.notes.some((mau) => mau.id === id)) return Promise.resolve();
    return ghiTruocDatSau(
      () => ports.noteStore.remove(id),
      // Mẩu đi thì cái nhớ phù du về nó cũng đi: một `id` không còn bản ghi nào mang sẽ ở lại
      // trong `expandedIds` tới hết phiên, và tập đó phình dần theo số lần xóa trong một tab
      // mở lâu. Lọc ngay trong closure của `datLai` sẵn có, nên nó vẫn là MỘT phép đổi state.
      () => ({
        notes: noiBo.notes.filter((mau) => mau.id !== id),
        expandedIds: noiBo.expandedIds.filter((khac) => khac !== id),
      }),
    );
  }

  /**
   * Tự lưu nội dung đang sửa của một ghi chú: `editing` đổi NGAY, phép ghi đi sau (AD-8).
   *
   * Trả về đồng bộ — hẹn ghi không đi vào giá trị trả về, vì chỗ gọi là một sự kiện bàn phím
   * và nó không có gì để đợi. Kết quả của phép ghi hiện ra ở state: hoặc `notes` đổi, hoặc
   * dải băng bật lên. Chữ trong `editing.text` thì không bao giờ bị hoàn tác.
   *
   * @param {string} id Định danh ghi chú đang sửa.
   * @param {string} text Nội dung vừa gõ.
   * @returns {void}
   */
  function tuLuuNoiDung(id, text) {
    if (typeof id !== 'string') {
      throw new TypeError(`tuLuuNoiDung nhận id là chuỗi, nhận được ${moTa(id)}`);
    }
    if (typeof text !== 'string') {
      throw new TypeError(`tuLuuNoiDung nhận text là chuỗi, nhận được ${moTa(text)}`);
    }
    // Trần chặn ở MỌI cửa vào, không chỉ ở cửa thêm mới (AD-14): cửa sửa cũng ghi vào cùng
    // một store, nên một cửa không chặn là trần không tồn tại.
    if (text.length > MAX_NOTE_CHARS) {
      datLai({ banner: MA_LOI.TOO_LONG });
      return;
    }
    const seqMoi = noiBo.editing.seq + 1;
    datLai({ editing: { id, text, seq: seqMoi } });
    henGhiDiSau(seqMoi, () => {
      const cu = noiBo.notes.find((mau) => mau.id === id);
      if (cu === undefined) return null;
      return banGhiSua(cu, text);
    });
  }

  /**
   * Ghi bản nháp hiện tại xuống kho kèm một nhịp tim mới.
   *
   * Dùng chung cho hẹn tự lưu và cho nhịp tim định kỳ: cả hai ghi ĐÚNG một hình dạng bản ghi,
   * và tách chúng ra là hai chỗ dựng `heartbeat` sẽ trôi khỏi nhau.
   *
   * @param {boolean} tatDaiBang Ghi xong thì có tắt dải băng không. Hẹn tự lưu thì có (AD-8:
   *   một phép ghi thành công tắt dải băng); nhịp tim thì KHÔNG — nó không phải hành động của
   *   người dùng, nên nó không được dọn một câu đang nói về chữ chưa an toàn.
   */
  function ghiBanNhap(tatDaiBang) {
    return ports.noteStore
      .putDraft({ tabId: tabCuaMinh, text: noiBo.draft.text, heartbeat: nowIso() })
      .then(
        () => {
          if (tatDaiBang) datLai({ banner: null });
        },
        (loi) => {
          datLai({ banner: maBanner(loi) });
        },
      );
  }

  /**
   * HELPER DÙNG CHUNG 2, bản cho bản nháp: cùng luồng tự lưu, nhưng gác bằng `draft.seq`.
   *
   * Hai số đếm độc lập là bắt buộc (AD-8): dùng chung một `seq` thì gõ vào ô soạn thảo của một
   * mẩu đang sửa sẽ hủy hẹn của bản nháp, và ngược lại.
   */
  function henGhiBanNhapDiSau(seqCuaHen) {
    setTimeout(() => {
      if (noiBo.draft.seq !== seqCuaHen) return;
      // Chưa khởi động bản nháp thì chưa có chủ để ghi dưới tên nó.
      if (tabCuaMinh === null) return;
      ghiBanNhap(true);
    }, AUTOSAVE_MS);
  }

  /**
   * Khởi động bản nháp riêng của tab này: lấy danh tính, giành lấy bản nháp, đặt chữ vào state.
   *
   * Bốn bước của AD-3 nằm trọn trong cổng — ở đây chỉ còn phần nối hai cổng: kho phát hiện tab
   * bị nhân đôi và trả về một danh tính KHÁC, và danh tính mới đó phải được ghi lại vào kho
   * phạm vi phiên, thứ mà kho ghi chú không được chạm.
   *
   * Hỏng thì đi ra bằng dải băng, không bằng một lời hứa bị từ chối: chỗ gọi duy nhất là lúc
   * khởi động và ở đó không có ai bắt.
   *
   * @returns {Promise<void>} Hoàn tất khi state đã phản ánh kết quả — không bao giờ bị từ chối.
   */
  function khoiDongBanNhap() {
    let danhTinh;
    try {
      danhTinh = ports.sessionStore.tabIdentity();
    } catch (loi) {
      datLai({ banner: maBanner(loi) });
      return Promise.resolve();
    }
    // Số đếm tại lúc phát yêu cầu. `app/main.js` gọi action này mà KHÔNG đợi, nên Nam có thể
    // đã gõ vào bản nháp trước khi kho trả lời — và lúc đó chữ giành được là chữ CŨ. Cùng cơ
    // chế `seq` của AD-8, chỉ khác chiều: hẹn quá hạn bị bỏ, và ở đây thì kết quả quá hạn bị bỏ.
    const seqLucGianh = noiBo.draft.seq;
    return ports.noteStore
      .claimDraft({ tabId: danhTinh, now: nowIso(), staleMs: DRAFT_STALE_MS })
      .then(
        (ketQua) => {
          tabCuaMinh = ketQua.tabId;
          // Đã có người gõ trong lúc chờ: chữ trên màn hình mới hơn chữ giành được, và hẹn của
          // nó đang treo. Đè lên là vừa mất chữ vừa ghi chữ cũ xuống kho ngay sau đó.
          const nhanhDraft =
            noiBo.draft.seq === seqLucGianh
              ? { text: ketQua.text, seq: seqLucGianh }
              : noiBo.draft;
          if (ketQua.tabId !== danhTinh) {
            try {
              ports.sessionStore.writeTabIdentity(ketQua.tabId);
            } catch (loi) {
              // Danh tính mới không ghi lại được: tab này vẫn dùng nó trong phiên hiện tại,
              // nhưng lần tải lại sau sẽ quay về danh tính cũ. Đó là chuyện của người dùng,
              // nên nó ra dải băng — và chữ nhận được vẫn phải vào state.
              datLai({ draft: nhanhDraft, banner: maBanner(loi) });
              return;
            }
          }
          datLai({ draft: nhanhDraft });
        },
        (loi) => {
          datLai({ banner: maBanner(loi) });
        },
      );
  }

  /**
   * Tự lưu bản nháp đang gõ: `draft` đổi NGAY, phép ghi đi sau với debounce + `seq` (AD-8).
   *
   * Quá trần thì dải băng `TOO_LONG` và cổng KHÔNG bị gọi, nhưng chữ VẪN vào state: cắt bớt
   * trong im lặng là cách chắc chắn nhất làm mất chữ người ta vừa gõ (AD-14, AD-17).
   *
   * @param {string} text Nội dung vừa gõ.
   * @returns {void}
   */
  function datBanNhap(text) {
    if (typeof text !== 'string') {
      throw new TypeError(`datBanNhap nhận text là chuỗi, nhận được ${moTa(text)}`);
    }
    const seqMoi = noiBo.draft.seq + 1;
    if (text.length > MAX_NOTE_CHARS) {
      datLai({ draft: { text, seq: seqMoi }, banner: MA_LOI.TOO_LONG });
      return;
    }
    datLai({ draft: { text, seq: seqMoi } });
    henGhiBanNhapDiSau(seqMoi);
  }

  /**
   * Báo rằng tab này còn sống: ghi lại bản nháp hiện tại với một nhịp tim mới.
   *
   * KHÔNG đổi state — nhịp tim là chuyện giữa tab và kho, không phải thứ view vẽ ra. Chỉ khi
   * ghi hỏng mới có dải băng.
   *
   * Chưa khởi động bản nháp thì không chạm cổng: một bản nháp ghi dưới một danh tính chưa được
   * giành sẽ nằm lại trong kho mà không tab nào nhận lại được.
   *
   * @returns {Promise<void>} Hoàn tất khi phép ghi đã chốt — không bao giờ bị từ chối.
   */
  function nhipTimBanNhap() {
    if (tabCuaMinh === null) return Promise.resolve();
    // Trần chặn ở MỌI đường xuống kho, không chỉ ở cửa người dùng gõ (AD-14): `datBanNhap` từ
    // chối gọi cổng khi quá trần, nhưng một nhịp tim vô điều kiện sẽ đưa đúng chữ đó xuống kho
    // mười giây sau — tức trần không tồn tại, chỉ chậm lại.
    if (noiBo.draft.text.length > MAX_NOTE_CHARS) return Promise.resolve();
    return ghiBanNhap(false);
  }

  // Đóng băng chính store: gán thêm một action từ bên ngoài là dựng đường đổi state thứ hai.
  return Object.freeze({
    get state() {
      return anh;
    },
    datDieuKien,
    xoaHetDieuKien,
    dongDaiBang,
    batTatMoRong,
    khoiDong,
    datTheme,
    xuatSaoLuu,
    napSaoLuu,
    chotGhiChu,
    xoaGhiChu,
    tuLuuNoiDung,
    khoiDongBanNhap,
    datBanNhap,
    nhipTimBanNhap,
  });
}
