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
// Tệp này là `core/` thuần: chỉ import `./time.js`, không chạm global trình duyệt.
// `crypto.randomUUID` thì có — nó không phải global của DOM, nó có ở cả Node, và AD-13 chốt
// nó là nguồn duy nhất của định danh sinh mới.

import { msBetweenIso } from './time.js';

/**
 * Bản nháp đã im lặng bao lâu, tính bằng mili giây. Càng lớn càng cũ.
 *
 * Nhịp tim rác (thiếu, sai dạng, do một phiên bản cũ để lại) là `Infinity` — tức CŨ NHẤT, chứ
 * không phải một lỗi: một bản không đọc nổi mốc sống mà lại được giữ mãi thì nó chiếm chỗ vĩnh
 * viễn và không ai nhận lại được chữ trong đó. Và một lỗi ném ra giữa một giao dịch đang mở để
 * lại một lời hứa treo, không phải một mã lỗi.
 */
function doCu(ban, now) {
  try {
    return msBetweenIso(ban.heartbeat, now);
  } catch {
    return Infinity;
  }
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
 * Bốn bước của AD-3 trên một danh sách bản nháp đã đọc xong.
 *
 * 1. Có bản mang đúng danh tính này mà nhịp tim CÒN MỚI → một tab khác đang sống với cùng danh
 *    tính (Nam nhân đôi tab, kho phạm vi phiên được sao chép theo) → sinh danh tính mới, và
 *    KHÔNG đụng tới bản của tab kia.
 * 2. Có bản của chính mình với nhịp tim ĐÃ IM → chính tab này vừa đóng rồi mở lại → dùng nó.
 *    Cùng một bản ghi, hai kết luận, phân biệt bằng đúng một phép so `staleMs`.
 * 3. Không có bản của mình → nhận NHIỀU NHẤT MỘT bản bỏ rơi, bản im lặng lâu nhất: ghi lại
 *    dưới danh tính của mình và xóa bản cũ. Bản còn nhịp tim không bao giờ bị đụng tới — đó là
 *    nửa cứng của FR-20.
 * 4. Dọn mọi bản có chữ rỗng.
 *
 * @param {Array<{ tabId: string, text: string, heartbeat: string }>} danhSach Mọi bản nháp
 *   đang có trong kho, thứ tự không được tin cậy.
 * @param {string} tabId Danh tính tab hiện tại.
 * @param {string} now Mốc hiện tại, ISO-8601 có offset.
 * @param {number} staleMs Ngưỡng im lặng để coi một bản là bỏ rơi.
 * @returns {{ tabId: string, text: string, ghi: object | null, xoa: string[] }} Danh tính sau
 *   cùng, chữ nhận được, bản ghi cần ghi (nếu có) và các khóa cần xóa — tất cả để adapter phát
 *   ra trong cùng một giao dịch.
 */
export function quyetDinhBanNhap(danhSach, tabId, now, staleMs) {
  const cuaMinh = danhSach.find((ban) => ban.tabId === tabId) ?? null;
  let danhTinh = tabId;
  let text = '';
  let ghi = null;
  const xoa = [];

  if (cuaMinh !== null && conNhipTim(cuaMinh, now, staleMs)) {
    danhTinh = crypto.randomUUID();
  } else if (cuaMinh !== null) {
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

  return { tabId: danhTinh, text, ghi, xoa };
}
