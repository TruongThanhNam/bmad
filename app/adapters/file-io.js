// Hiện thực cổng `fileIO` — chiều XUẤT (Story 4.2) và chiều NẠP (Story 4.3).
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
// Test tự động phủ đúng MỘT nửa (quy ước repo, xem `test/adapter-session-store.test.js`):
// `test/adapter-file-io.test.js` là ngoại lệ hẹp cho `readChosenFile` — nó chỉ cần một
// `document` vài dòng, và nó là cửa mà toàn bộ chiều nạp đi qua. `exportFile` thì VẪN kiểm tay
// (checklist trong `README.md`): mọi thứ ở đó là hành vi của trình duyệt thật, và một bản giả
// của `URL.createObjectURL` chỉ nghiệm thu được rằng tệp này gọi đúng bản giả đó.

/** Kiểu MIME của file sao lưu — nội dung là JSON, và trình duyệt phải được nói đúng điều đó. */
const KIEU_JSON = 'application/json';

/** Đuôi tên file, vế thứ hai của bộ lọc ở hộp chọn file. */
const DUOI_JSON = '.json';

/** Loại ô nhập mở được hộp chọn file. Viết ra để nó không bao giờ thành một ô chữ. */
const KIEU_INPUT = 'file';

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
        // `the` khai NGOÀI try và bắt đầu `undefined`: nếu `createElement` tự nó ném (review
        // Epic 4 — trường hợp cực hiếm, tài liệu bị hỏng), `url` vẫn phải được thu hồi ở
        // `finally` dưới đây, và `finally` khi đó không có gì để `.remove()`.
        let the;
        try {
          the = document.createElement('a');
          the.href = url;
          the.download = name;
          // Gắn vào tài liệu rồi mới bấm: một thẻ rời cây DOM không kích hoạt được phép tải ở
          // mọi trình duyệt.
          document.body.appendChild(the);
          the.click();
        } finally {
          // Gỡ thẻ ở MỌI đường ra, kể cả khi `click()` ném: một `<a>` sót lại trong `<body>` là
          // một điểm dừng bàn phím vô hình mọc thêm vào trang. Nhưng chỉ khi nó đã được dựng.
          if (the !== undefined) the.remove();
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
      // Cùng khuôn `exportFile`: thân chạy NGAY trong hàm dựng lời hứa, nên một `throw` đồng
      // bộ (tài liệu bị chặn, `createElement` hỏng) thành đúng một lời hứa bị từ chối — cửa mà
      // nhánh dải băng của `napSaoLuu` đang chờ.
      return new Promise((xong, hong) => {
        const o = document.createElement('input');
        o.type = KIEU_INPUT;
        // Hai vế: kiểu MIME cho hệ điều hành biết, đuôi tên cho những hệ không suy ra được MIME
        // từ nội dung. Đây là một GỢI Ý lọc, không phải một phép gác — Nam vẫn chọn được một
        // `.txt`, và pha 1 của `core/backup.js` mới là chỗ từ chối nó bằng một câu tử tế.
        o.accept = `${KIEU_JSON},${DUOI_JSON}`;
        // Ẩn hẳn: một `<input type="file">` sót lại trong cây là một điểm dừng bàn phím vô hình
        // mọc thêm vào trang, và chân trang đã khóa đúng ba điểm dừng.
        o.hidden = true;

        function don() {
          o.remove();
        }

        // `change` chỉ nổ khi có file; `cancel` là cách trực tiếp nhất biết Nam đã bấm Huỷ.
        //
        // Nhưng KHÔNG trình duyệt nào được phép làm lời hứa này treo mãi: `core/state.js` giữ
        // một cờ chống bấm-hai-lần trong closure và chỉ nhả nó khi lời hứa hoàn tất, nên một
        // lần bỏ ngang không ai báo sẽ giết hẳn link `nạp lại` cho tới lần tải trang sau — và
        // để lại một `<input>` mồ côi mỗi cú bấm. Nên có cửa thứ ba: tài liệu giành lại tiêu
        // điểm sau khi hộp thoại đóng, và lúc đó KHÔNG có file nào được chọn, thì đó là một
        // lần bỏ ngang. Hỏi `o.files` chứ không hẹn giờ: danh sách file đã được đặt xong TRƯỚC
        // khi `change` được phát, nên cửa này không bao giờ cướp lượt của một lần chọn thật.
        o.addEventListener('change', () => {
          const file = o.files === null || o.files === undefined ? undefined : o.files[0];
          if (file === undefined || file === null) {
            don();
            xong(null);
            return;
          }
          // `file.text()` đọc toàn bộ nội dung thành chuỗi — không có trần kích thước ở đây,
          // theo đúng quyết định đã chốt của spec.
          file.text().then(
            (text) => {
              don();
              xong({ name: file.name, text });
            },
            (loi) => {
              don();
              hong(loi);
            },
          );
        });
        o.addEventListener('cancel', () => {
          don();
          xong(null);
        });

        // Cửa thứ ba. `resolve` lần thứ hai là một phép không làm gì, nên nó không cần một cờ
        // gác riêng — chỉ `don()` là chạy hai lần, và gỡ một phần tử đã gỡ cũng không làm gì.
        const cuaSo = document.defaultView;
        if (cuaSo !== null && cuaSo !== undefined) {
          cuaSo.addEventListener(
            'focus',
            () => {
              const danhSach = o.files;
              // Có file thì `change` đang trên đường tới — đừng cướp lượt của nó.
              if (danhSach !== null && danhSach !== undefined && danhSach.length > 0) return;
              don();
              xong(null);
            },
            { once: true },
          );
        }

        // Gắn vào tài liệu rồi mới bấm, cùng lý do với thẻ `<a download>`: một phần tử rời cây
        // DOM không mở được hộp thoại ở mọi trình duyệt.
        try {
          document.body.appendChild(o);
          o.click();
        } catch (loi) {
          // Cùng khuôn `exportFile`: gỡ ở MỌI đường ra, kể cả khi chính hai lời gọi này ném
          // (review Epic 4) — một `<input>` mồ côi sót lại là một điểm dừng bàn phím vô hình,
          // dù `hidden` khiến nó không thấy được. Ném lại nguyên `loi`: đây không phải cửa thứ
          // ba, và lời hứa vẫn phải bị từ chối như trước khi có `try` này.
          don();
          throw loi;
        }
      });
    },
  };
}
