// Hiện thực cổng `channel` bằng BroadcastChannel (AD-2, AD-7, AD-9).
//
// Đây là adapter thứ ba, và nó mỏng đúng như hai cái kia: nó không biết gì về state, không dựng
// bản tin, không đọc kho. Hình dạng bản tin là hợp đồng của `app/ports/channel.js` và nó được
// dựng ở `app/core/state.js` — adapter chỉ mang gói hàng qua cửa.
//
// MỞ KÊNH LƯỜI, không chạm global lúc import, đúng khuôn `indexeddb.js` và `localstorage.js`:
// `test/trang-tinh.test.js` import động `app/main.js` ở NODE để nghiệm thu rằng nó là một ES
// module nạp được thật, và ở đó `BroadcastChannel` có thể không tồn tại. Dựng kênh lúc dựng
// factory thì lệnh import đó ném, và một test không liên quan gì tới kênh bỗng đỏ.
//
// Môi trường KHÔNG có kênh thì hai phương thức thành hai lệnh không làm gì cả, IM LẶNG: phát
// một bản tin là gõ chuông cho các tab khác, và một cái chuông không gõ được không phải chuyện
// của người dùng (AD-17 — dải băng chỉ dành cho chuyện xấu THẬT). Ném ở đây sẽ biến một lần đổi
// theme thành công thành một dải băng lỗi.
//
// `subscribe` được hiện thực đủ nhưng CHƯA AI đăng ký nghe: xử lý tin đến — bỏ tin của chính
// mình, nạp lại từ kho, phát hiện lệch phiên bản — là Epic 7 và AD-21. Hiện thực nó ngay bây
// giờ vì `CHANNEL_METHODS` có hai phương thức và `kiemTraPorts` đòi đủ cả hai; một `subscribe`
// giả trả `undefined` sẽ làm story sau đi gỡ lỗi một adapter đã "có sẵn".

/** Tên kênh — cùng tiền tố `ghichu.` của AD-9, vì origin có thể dùng chung với app khác. */
const TEN_KENH = 'ghichu.tab-sync';

/**
 * Dựng một hiện thực của cổng `channel`.
 *
 * @returns {{ publish: Function, subscribe: Function }} Cổng kênh liên tab; kênh chỉ được mở ở
 *   lần gọi phương thức ĐẦU TIÊN, và không bao giờ mở nếu môi trường không có cơ chế này.
 */
export function taoBroadcast() {
  /** Kênh đã mở, hoặc `null` khi chưa thử mở lần nào. */
  let kenh = null;
  /** Đã thử mở và môi trường không cho — nhớ lại để không thử lại ở mọi lời gọi. */
  let khongCo = false;

  function moKenh() {
    if (kenh !== null || khongCo) return kenh;
    // `typeof` trên một định danh chưa khai báo là an toàn — đây là phép hỏi DUY NHẤT chạm tới
    // môi trường, và nó chỉ chạy khi một phương thức đã bị gọi.
    if (typeof BroadcastChannel !== 'function') {
      khongCo = true;
      return null;
    }
    // Dựng kênh cũng NÉM được: một origin bị cô lập (`about:blank`, iframe sandbox không có
    // `allow-same-origin`) có `BroadcastChannel` trên global nhưng từ chối mở. Nhớ lại thất bại
    // đó để không thử lại ở mọi lời gọi — và để im lặng là TÍNH CHẤT của adapter, không phải
    // một may mắn của trình duyệt hôm nay.
    try {
      kenh = new BroadcastChannel(TEN_KENH);
    } catch {
      khongCo = true;
      return null;
    }
    return kenh;
  }

  return {
    publish(message) {
      const mo = moKenh();
      if (mo === null) return;
      // `postMessage` ném khi kênh đã đóng, hay khi bản tin không sao chép cấu trúc được. Lỗi
      // đó KHÔNG được thoát ra ngoài: chỗ gọi là `datTheme`, nơi phép ghi đã thành công rồi —
      // để nó nổi lên là biến một lần đổi theme đã xong thành một lời hứa bị từ chối, và
      // `view/nut-theme.js` (cố ý không có `.catch`) sẽ bỏ luôn lượt vẽ lại.
      try {
        mo.postMessage(message);
      } catch {
        /* Một cái chuông không gõ được không phải chuyện của người dùng (AD-17). */
      }
    },

    subscribe(listener) {
      const mo = moKenh();
      if (mo === null) return;
      // Gỡ `data` ra tại đây: cổng nói bằng BẢN TIN, không bằng sự kiện của trình duyệt — để
      // một `MessageEvent` chảy lên lõi là để tên công nghệ leo qua cổng (AD-2).
      mo.addEventListener('message', (su) => listener(su.data));
    },
  };
}
