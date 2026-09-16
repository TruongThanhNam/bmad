import { afterEach, describe, expect, it } from 'vitest';
import { taoFileIo } from '../app/adapters/file-io.js';

// `app/adapters/` KHÔNG có test tự động — xem chú thích đầu `adapter-session-store.test.js`.
//
// Ngoại lệ HẸP thứ hai, và cùng lý do với ngoại lệ thứ nhất: `readChosenFile` không cần một
// trình duyệt giả, nó cần một `document` vài dòng. Và nó là cửa mà TOÀN BỘ chiều nạp đi qua —
// trả về `file` thay vì `{ name, text }` để cả suite xanh trong khi mọi file hợp lệ hiện "file
// hỏng" là một lỗi không một ca nào khác trong repo bắt được.
//
// Đúng bốn câu hỏi, và không hơn: hình dạng trả về, ba đường "không có file" (không chọn, bấm
// Huỷ, và bỏ ngang mà không sự kiện nào nổ), và phần tử có được gỡ ở MỌI đường ra không.
//
// Đừng nới file này ra. `exportFile` (Blob, URL tạm, cú bấm giả lên `<a download>`) vẫn thuộc
// danh sách thử tay: nó chỉ nghiệm thu được rằng tệp đó gọi đúng bản giả của chính test.

/** Một phần tử giả đủ dùng cho `<input type="file">` — bộ nghe, `files`, và một cờ đã gỡ. */
function theGia() {
  return {
    boNghe: {},
    files: null,
    daGo: false,
    daBam: false,
    addEventListener(ten, ham) {
      this.boNghe[ten] = ham;
    },
    remove() {
      this.daGo = true;
    },
    click() {
      this.daBam = true;
    },
  };
}

/**
 * Cầm `document` toàn cục bằng một bản giả vài dòng, và trả về phần tử mà adapter sẽ dựng.
 *
 * `defaultView` là cửa thứ ba của adapter (tài liệu giành lại tiêu điểm mà không file nào được
 * chọn = một lần bỏ ngang). Nó là một object giả y như phần còn lại, nên ca đó chạy được mà
 * không cần một cửa sổ thật.
 */
function camTaiLieuGia() {
  const the = theGia();
  const cuaSo = {
    boNghe: {},
    addEventListener(ten, ham) {
      this.boNghe[ten] = ham;
    },
  };
  const daGan = [];
  globalThis.document = {
    defaultView: cuaSo,
    body: { appendChild: (nut) => daGan.push(nut) },
    createElement: () => the,
  };
  return { the, cuaSo, daGan };
}

/** Một file giả: `text()` trả về (hoặc từ chối) đúng thứ ca test cần. */
function fileGia(noiDung, tuChoi = null) {
  return {
    name: 'ghi-chu-hang-ngay-2026-09-15.json',
    text: () => (tuChoi === null ? Promise.resolve(noiDung) : Promise.reject(tuChoi)),
  };
}

afterEach(() => {
  delete globalThis.document;
});

describe('readChosenFile — hình dạng trả về là HỢP ĐỒNG của cả chiều nạp', () => {
  it('chọn một file: trả ĐÚNG `{ name, text }`, không phải chính đối tượng file', async () => {
    // Trả `file` thay vì `{ name, text }` làm `core/backup.js` nhận `undefined` và mọi file
    // hợp lệ hiện "file hỏng" — trong khi cả suite vẫn xanh.
    const { the } = camTaiLieuGia();
    const daGoi = taoFileIo().readChosenFile();
    the.files = [fileGia('{"schemaVersion":1}')];
    the.boNghe.change();
    await expect(daGoi).resolves.toEqual({
      name: 'ghi-chu-hang-ngay-2026-09-15.json',
      text: '{"schemaVersion":1}',
    });
  });

  it('gắn vào tài liệu rồi mới bấm, và phần tử ẩn hẳn — không một điểm dừng bàn phím nào', () => {
    const { the, daGan } = camTaiLieuGia();
    taoFileIo().readChosenFile();
    expect(daGan).toEqual([the]);
    expect(the.daBam).toBe(true);
    expect(the.hidden).toBe(true);
    expect(the.type).toBe('file');
  });

  it('`text()` từ chối → lời hứa bị TỪ CHỐI, không phải một `null` im lặng', async () => {
    // `null` là "Nam bỏ ngang" ở hợp đồng cổng. Trả nó cho một lỗi đọc là làm `napSaoLuu` im
    // lặng tuyệt đối đúng lúc có chuyện xấu thật.
    const { the } = camTaiLieuGia();
    const daGoi = taoFileIo().readChosenFile();
    the.files = [fileGia(null, new Error('đọc hỏng'))];
    the.boNghe.change();
    await expect(daGoi).rejects.toThrow(/đọc hỏng/);
  });
});

describe('readChosenFile — MỌI lần bỏ ngang đều hoàn tất bằng `null`', () => {
  it('`change` mà không có file nào', async () => {
    const { the } = camTaiLieuGia();
    const daGoi = taoFileIo().readChosenFile();
    the.files = [];
    the.boNghe.change();
    await expect(daGoi).resolves.toBeNull();
  });

  it('`cancel` — đường trực tiếp nhất của cú bấm Huỷ', async () => {
    const { the } = camTaiLieuGia();
    const daGoi = taoFileIo().readChosenFile();
    the.boNghe.cancel();
    await expect(daGoi).resolves.toBeNull();
  });

  it('KHÔNG sự kiện nào nổ: tài liệu giành lại tiêu điểm là cửa thứ ba', async () => {
    // Trình duyệt không phát `cancel` thì lời hứa treo mãi, và cờ chống bấm-hai-lần trong
    // `core/state.js` không bao giờ được nhả — link `nạp lại` chết hẳn tới lần tải trang sau.
    const { the, cuaSo } = camTaiLieuGia();
    const daGoi = taoFileIo().readChosenFile();
    cuaSo.boNghe.focus();
    await expect(daGoi).resolves.toBeNull();
  });

  it('cửa thứ ba KHÔNG cướp lượt của một lần chọn thật', async () => {
    // `files` đã được đặt xong TRƯỚC khi `change` được phát, nên tiêu điểm quay về trước
    // `change` là chuyện bình thường — và nó không được biến một lần chọn thành một lần huỷ.
    const { the, cuaSo } = camTaiLieuGia();
    const daGoi = taoFileIo().readChosenFile();
    the.files = [fileGia('nội dung')];
    cuaSo.boNghe.focus();
    the.boNghe.change();
    await expect(daGoi).resolves.toEqual({
      name: 'ghi-chu-hang-ngay-2026-09-15.json',
      text: 'nội dung',
    });
  });
});

describe('readChosenFile — phần tử được gỡ ở MỌI đường ra', () => {
  // Một `<input type="file">` sót lại là một điểm dừng bàn phím vô hình, và nó mọc thêm một
  // cái mỗi cú bấm.
  const duong = {
    'chọn file': async (the) => {
      the.files = [fileGia('x')];
      the.boNghe.change();
    },
    'không có file': async (the) => {
      the.files = [];
      the.boNghe.change();
    },
    huỷ: async (the) => the.boNghe.cancel(),
    'đọc hỏng': async (the) => {
      the.files = [fileGia(null, new Error('đọc hỏng'))];
      the.boNghe.change();
    },
  };

  for (const [ten, chay] of Object.entries(duong)) {
    it(`gỡ sau đường "${ten}"`, async () => {
      const { the } = camTaiLieuGia();
      const daGoi = taoFileIo().readChosenFile().catch(() => null);
      await chay(the);
      await daGoi;
      expect(the.daGo).toBe(true);
    });
  }

  it('gỡ cả ở đường bỏ ngang không sự kiện — không để lại một phần tử mồ côi nào', async () => {
    const { the, cuaSo } = camTaiLieuGia();
    const daGoi = taoFileIo().readChosenFile();
    cuaSo.boNghe.focus();
    await daGoi;
    expect(the.daGo).toBe(true);
  });
});
