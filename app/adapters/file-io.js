// Hiện thực cổng `fileIO` — chiều XUẤT (Story 4.2). Chiều nạp là Story 4.3.
//
// Adapter thứ tư, và mỏng đúng như ba cái kia: nó không biết hình dạng file sao lưu, không
// dựng JSON, không đọc state. Nội dung và tên file do `app/core/backup.js` dựng sẵn và
// `app/core/state.js` đưa xuống — ở đây chỉ còn phần lõi không được biết: Blob, URL tạm, và
// một cú bấm giả lên thẻ `<a download>`.
//
// KHÔNG dùng `showSaveFilePicker`: nó mở một hộp thoại chọn chỗ lưu, và cam kết "xuất xong thì
// giao diện im lặng tuyệt đối" không sống chung được với một hộp thoại. Thẻ `<a download>` thì
// chạy được ở mọi trình duyệt mục tiêu và rơi thẳng vào thư mục Tải về.
//
// Không chạm global lúc import, đúng khuôn ba adapter kia: `taoFileIo()` chỉ dựng object, và
// `document` chỉ được hỏi tới bên trong `exportFile`. `test/trang-tinh.test.js` import động
// `app/main.js` ở NODE, nơi không có `document` lẫn `Blob`.
//
// Adapter CỐ Ý không có test tự động (quy ước repo, như `broadcast.js`): mọi thứ ở đây là hành
// vi của trình duyệt thật, và một bản giả của `URL.createObjectURL` chỉ nghiệm thu được rằng
// tệp này gọi đúng bản giả đó. Đường kiểm thật là bước thủ công trong spec.

/** Kiểu MIME của file sao lưu — nội dung là JSON, và trình duyệt phải được nói đúng điều đó. */
const KIEU_JSON = 'application/json';

/**
 * Dựng một hiện thực của cổng `fileIO`.
 *
 * @returns {{ exportFile: Function, readChosenFile: Function }} Cổng file; chỉ chiều xuất có
 *   thân thật ở story này.
 */
export function taoFileIo() {
  return {
    exportFile(name, text) {
      // Thân chạy NGAY trong hàm dựng lời hứa, không lùi lại một lượt: mọi thứ ở đây là đồng
      // bộ, và một `throw` (Blob dựng hỏng, `createObjectURL` bị chặn) thành đúng một lời hứa
      // bị từ chối — cửa mà nhánh im lặng của `xuatSaoLuu` đang chờ.
      return new Promise((xong) => {
        const url = URL.createObjectURL(new Blob([text], { type: KIEU_JSON }));
        const the = document.createElement('a');
        try {
          the.href = url;
          the.download = name;
          // Gắn vào tài liệu rồi mới bấm: một thẻ rời cây DOM không kích hoạt được phép tải ở
          // mọi trình duyệt.
          document.body.appendChild(the);
          the.click();
        } finally {
          // Gỡ thẻ ở MỌI đường ra, kể cả khi `click()` ném: một `<a>` sót lại trong `<body>` là
          // một điểm dừng bàn phím vô hình mọc thêm vào trang.
          the.remove();
          // Thu hồi URL tạm cũng ở mọi đường ra — một Blob không thu hồi sống tới hết đời trang,
          // và xuất nhiều lần trong một phiên thì rò đúng bằng kích thước kho mỗi lần. Nhưng
          // LÙI một lượt: thu hồi ngay trong cùng nhịp đồng bộ với `click()` đã từng làm chính
          // trình duyệt hủy phép tải chưa kịp bắt đầu — và đường này im lặng ở cả hai nhánh,
          // nên thất bại đó sẽ không để lại một dấu vết nào.
          setTimeout(() => URL.revokeObjectURL(url));
        }
        xong();
      });
    },

    readChosenFile() {
      // Ném chứ không trả `null`: `null` là câu trả lời HỢP LỆ của cổng này ("người dùng bỏ
      // ngang"), nên trả nó ở đây sẽ làm Story 4.3 đi gỡ lỗi một phép nạp trông như đã chạy.
      throw new Error('chưa làm — Story 4.3 (fileIO.readChosenFile)');
    },
  };
}
