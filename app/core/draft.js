// Quy tắc khởi động bản nháp của AD-3, dưới dạng một hàm THUẦN.
//
// Bốn bước phải chạy trong ĐÚNG MỘT giao dịch `readwrite` — đó là ràng buộc của AD-3, và nó
// thuộc về adapter, nơi có giao dịch. Nhưng phần QUYẾT ĐỊNH (bản nào được nhận, danh tính nào
// được dùng, bản nào bị dọn) không cần một kho nào cả: nó là một phép biến đổi từ danh sách
// bản ghi đã đọc sang một BẢN KẾ HOẠCH ghi/xóa.
//
// Tách thế vì hai lý do, không phải một:
//
// - `app/adapters/` không có test tự động (theo thiết kế), nhưng nửa cứng của FR-20 — "tab
//   khác không bao giờ lấy mất bản nháp đang gõ" — phải là một test chứ không phải một chú
//   thích. Để quy tắc nằm trọn trong adapter là đổi bằng chứng của FR-20 lấy một lời hứa.
// - Bản kế hoạch được adapter áp dụng ĐỒNG BỘ ngay trong callback của `getAll()`, nên tính
//   nguyên tử không suy suyển: không có `await` nào chen vào giữa, và giao dịch không chết
//   giữa chừng.
//
// DANH TÍNH TAB KHÔNG ĐƯỢC QUYẾT Ở ĐÂY, và đó là bản sửa của vòng review thứ hai. Bản đầu
// theo đúng nguyên văn AD-3 bước 1: "có bản ghi mang `tabId` của mình mà nhịp tim còn mới"
// thì coi là một tab khác đang sống và sinh danh tính mới. Chạy trên trình duyệt thật thì
// quy tắc đó làm hỏng chính lời hứa của story: kho phạm vi phiên sống sót qua một lần TẢI
// LẠI, còn bản ghi thì vẫn mang nhịp tim của vài giây trước — do chính tab này viết ở kiếp
// trước. Tab tưởng mình bị nhân đôi, sinh danh tính mới, và bỏ lại bản nháp của chính nó.
// Vì nhịp tim đập mỗi `DRAFT_BEAT_MS` còn ngưỡng là `DRAFT_STALE_MS`, MỌI lần tải lại đều
// rơi vào cửa sổ đó.
//
// Nhịp tim không phân biệt được "một tab khác đang sống" với "chính tôi vừa tải lại" — nó là
// một phép suy đoán từ một mốc thời gian. Dấu hiệu sống THẬT là một khóa mà trình duyệt tự
// nhả khi tab chết, và khóa thì thuộc về adapter. Nên adapter chốt danh tính TRƯỚC, rồi mới
// đưa danh tính đã chốt vào đây; hàm này không còn bước 1 nữa.
//
// Tệp này là `core/` thuần: chỉ import `./time.js`, không chạm global trình duyệt.

import { msBetweenIso } from './time.js';

/**
 * Bản nháp đã im lặng bao lâu, tính bằng mili giây. Càng lớn càng cũ.
 *
 * Nhịp tim rác (thiếu, sai dạng, do một phiên bản cũ để lại) là `Infinity` — tức CŨ NHẤT, chứ
 * không phải một lỗi: một bản không đọc nổi mốc sống mà lại được giữ mãi thì nó chiếm chỗ vĩnh
 * viễn và không ai nhận lại được chữ trong đó. Và một lỗi ném ra giữa một giao dịch đang mở để
 * lại một lời hứa treo, không phải một mã lỗi.
 *
 * Một mốc ở TƯƠNG LAI (đồng hồ máy bị chỉnh lùi) cho tuổi âm, và tuổi âm thì luôn dưới mọi
 * ngưỡng — tức bản đó "còn sống" vĩnh viễn. Cùng một lớp hỏng với nhịp tim rác, nên cùng một
 * đường ra.
 */
function doCu(ban, now) {
  let tuoi;
  try {
    tuoi = msBetweenIso(ban.heartbeat, now);
  } catch {
    return Infinity;
  }
  return tuoi < 0 ? Infinity : tuoi;
}

/** Còn dấu hiệu sống hay không — đúng một phép so ngưỡng im lặng (AD-3). */
function conNhipTim(ban, now, staleMs) {
  return doCu(ban, now) < staleMs;
}

/** Bản nháp mang chữ thật, tức bản đáng nhận lại. */
function coChu(ban) {
  return typeof ban.text === 'string' && ban.text !== '';
}

/**
 * Ba bước còn lại của AD-3 trên một danh sách bản nháp đã đọc xong.
 *
 * Bước 1 (chốt danh tính) đã chạy ở adapter và `tabId` dưới đây là kết quả của nó: tab này
 * đang GIỮ khóa của danh tính đó, nên không tab nào khác còn sống mang nó.
 *
 * 2. Có bản của chính mình → dùng nó, BẤT KỂ nhịp tim. Giữ được khóa đã là bằng chứng không
 *    ai khác cầm danh tính này, nên một nhịp tim còn mới chỉ có thể là của chính mình ở lần
 *    tải trang trước — đúng ca "mở lại app thì chữ còn nguyên" của FR-3.
 * 3. Không có bản của mình → nhận NHIỀU NHẤT MỘT bản bỏ rơi, bản im lặng lâu nhất: ghi lại
 *    dưới danh tính của mình và xóa bản cũ. Bản còn nhịp tim không bao giờ bị đụng tới — đó là
 *    nửa cứng của FR-20. Ở bước này nhịp tim vẫn là thước đo đúng: bản của một tab KHÁC, và
 *    ta không hỏi được khóa của nó mà không mở rộng bề mặt.
 * 4. Dọn mọi bản có chữ rỗng.
 *
 * @param {Array<{ tabId: string, text: string, heartbeat: string }>} danhSach Mọi bản nháp
 *   đang có trong kho, thứ tự không được tin cậy.
 * @param {string} tabId Danh tính tab, ĐÃ chốt và đang được giữ khóa.
 * @param {string} now Mốc hiện tại, ISO-8601 có offset.
 * @param {number} staleMs Ngưỡng im lặng để coi một bản là bỏ rơi.
 * @returns {{ text: string, ghi: object | null, xoa: string[] }} Chữ nhận được, bản ghi cần
 *   ghi (nếu có) và các khóa cần xóa — tất cả để adapter phát ra trong cùng một giao dịch.
 */
export function quyetDinhBanNhap(danhSach, tabId, now, staleMs) {
  const cuaMinh = danhSach.find((ban) => ban.tabId === tabId) ?? null;
  let text = '';
  let ghi = null;
  const xoa = [];

  if (cuaMinh !== null) {
    text = coChu(cuaMinh) ? cuaMinh.text : '';
  } else {
    let chon = null;
    for (const ban of danhSach) {
      if (!coChu(ban) || conNhipTim(ban, now, staleMs)) continue;
      if (chon === null || doCu(ban, now) > doCu(chon, now)) chon = ban;
    }
    if (chon !== null) {
      text = chon.text;
      ghi = { tabId, text, heartbeat: now };
      xoa.push(chon.tabId);
    }
  }

  // Bước 4 — đi trên danh sách ĐÃ ĐỌC, nên bản vừa dựng ở bước 3 (mang chữ thật) không tự xóa
  // mình, và một khóa không bao giờ vào danh sách xóa hai lần.
  for (const ban of danhSach) {
    if (!coChu(ban) && !xoa.includes(ban.tabId)) xoa.push(ban.tabId);
  }

  return { text, ghi, xoa };
}
