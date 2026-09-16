import { afterEach, describe, expect, it, vi } from 'vitest';
import { taoStore } from '../app/core/state.js';
import { MA_LOI, loiUngDung } from '../app/core/errors.js';
import { APP_VERSION, AUTOSAVE_MS, DRAFT_STALE_MS, MAX_NOTE_CHARS } from '../app/core/limits.js';
import { localStamp } from '../app/core/time.js';
import { PORT_METHODS, kiemTraPorts } from '../app/ports/index.js';
import { congTam, store as storeCuaApp } from '../app/main.js';

// Phủ toàn bộ I/O & Edge-Case Matrix của spec Story 1.5, cộng hai thứ mà Matrix không nói
// thành một dòng nhưng Story 1.6+ dựa lên:
//
// - state đọc ra KHÔNG gán được từ ngoài (AD-1). Không có test này thì "một đường đổi state"
//   là một lời hứa, và lời hứa đó vỡ ở dòng `store.state.notes.push(x)` đầu tiên trong view.
// - tập khóa của state là ĐÚNG tập nào (AD-3, AD-16). Ghim đúng tập, không phải "có chứa":
//   Story 1.6 thêm một trường là phải sửa test này, và lúc đó người viết đọc lại cả bảng ba
//   tầng cùng lệnh cấm "đang lưu / đã lưu" của AD-16 — thay vì để state mọc dần không ai soát.

/** Tập cổng đủ mọi phương thức, dựng từ chính bảng của `app/ports/`. */
function portsDay() {
  const ports = {};
  for (const tenCong of Object.keys(PORT_METHODS)) {
    const cong = {};
    for (const tenPhuongThuc of PORT_METHODS[tenCong]) {
      cong[tenPhuongThuc] = () => {
        throw new Error(`không ca test nào được gọi ${tenCong}.${tenPhuongThuc}`);
      };
    }
    ports[tenCong] = cong;
  }
  return ports;
}

/** Bỏ một phương thức của một cổng, để dựng ca "adapter nối sai". */
function portsThieu(tenCong, tenPhuongThuc) {
  const ports = portsDay();
  delete ports[tenCong][tenPhuongThuc];
  return ports;
}

// Tập khóa nới 7 → 8 ở Story 3.3, có chủ ý và đúng một lần: `theme` là tầng B′ của AD-3 (bền,
// dùng chung, sống ở kho cấu hình). Nó là một TRƯỜNG STATE chứ không phải một biến closure của
// `app/view/nut-theme.js` vì nhãn nút là một hàm của theme (AD-19) — và một ô nhớ ở tầng view
// là đúng đường đổi state thứ hai mà AD-1 cấm. Đổi lấy: phép ghi kho bền vẫn nằm trọn trong
// `state.js`, và lỗi ghi tự đi ra dải băng qua khuôn `ghiTruocDatSau` đã có.
//
// Và nới 8 → 9 ở Story 4.3, cũng có chủ ý và cũng đúng một lần: `bannerSo` chở HAI CON SỐ của
// hàng 6 (`Đã nạp N ghi chú, bỏ qua M ghi chú đã có.`), thứ mà một `banner` kiểu chuỗi không
// chở được. Nó là một trường CẠNH `banner` chứ không phải một `banner` kiểu object vì
// `core/banner.js:30-35` đã cân và từ chối phép đổi đó — và `datLai` xoá nó ở mọi lần đặt dải
// băng không nói gì về nó, nên nó không bao giờ lệch khỏi loại đang hiện.
//
// Và nới 9 → 10 ở Story 4.4: `lastBackupAt` là trường tầng B′ THỨ HAI, cùng khuôn `theme` và
// cùng lý do — `app/view/chan-trang.js` dựng dòng nhắc từ nó ở mọi lượt vẽ chung, nên đọc thẳng
// kho trong `ve()` là đường đọc kho bền thứ hai ngoài `state.js` (AD-1), cộng một lần chạm kho
// mỗi lượt vẽ. Mốc đọc ĐÚNG MỘT LẦN lúc khởi động, rồi chỉ đổi qua hai đường ghi của UJ-3.
const KHOA_STATE = [
  'notes',
  'draft',
  'theme',
  'lastBackupAt',
  'dieuKien',
  'expandedIds',
  'editing',
  'banner',
  'bannerSo',
  'readOnly',
].sort();

describe('taoStore — khởi tạo', () => {
  it('state mới có notes rỗng, điều kiện vắng mặt, và các trường tầng C ở giá trị rỗng', () => {
    const store = taoStore(portsDay());
    expect(store.state).toEqual({
      notes: [],
      draft: { text: '', seq: 0 },
      // Tầng B′: `'light'` là giá trị KHỞI TẠO, không phải một lựa chọn đã ghi — nó khớp đúng
      // bảng mà `:root` của `app/style.css` vẽ ra khi không ai đặt `data-theme`.
      theme: 'light',
      // Tầng B′ thứ hai (Story 4.4): `null` là "chưa từng sao lưu", và dòng nhắc chân trang im
      // lặng tuyệt đối cho tới lần xuất đầu tiên.
      lastBackupAt: null,
      dieuKien: { keyword: null, date: null },
      expandedIds: [],
      editing: { id: null, text: '', seq: 0 },
      banner: null,
      // Hai con số của hàng 6 — `null` là "không có dải băng nào đang mang số" (Story 4.3).
      bannerSo: null,
      readOnly: false,
    });
  });

  it('tập khóa của state là ĐÚNG tập đã chốt — thêm hay bớt một trường là đỏ', () => {
    const store = taoStore(portsDay());
    expect(Object.keys(store.state).sort()).toEqual(KHOA_STATE);
  });

  it('không khóa nào mang nghĩa "đang lưu" / "đã lưu" / "số ký tự còn lại" (AD-16)', () => {
    const store = taoStore(portsDay());
    const cam = /luu|save|saved|saving|chuaChot|unsaved|conLai|remaining|charsLeft/i;
    expect(Object.keys(store.state).filter((khoa) => cam.test(khoa))).toEqual([]);
  });

  it('hai store là hai khối độc lập — không ca test nào kế thừa state của ca trước', () => {
    const a = taoStore(portsDay());
    const b = taoStore(portsDay());
    a.datDieuKien({ keyword: 'phỞ' });
    expect(b.state.dieuKien).toEqual({ keyword: null, date: null });
  });
});

describe('taoStore — kiểm cổng lúc khởi động', () => {
  it('thiếu một phương thức thì ném TypeError nêu ĐÚNG tên cổng và tên phương thức', () => {
    expect(() => taoStore(portsThieu('noteStore', 'replaceAll'))).toThrow(TypeError);
    expect(() => taoStore(portsThieu('noteStore', 'replaceAll'))).toThrow(
      /noteStore\.replaceAll/,
    );
    expect(() => taoStore(portsThieu('quota', 'estimate'))).toThrow(/quota\.estimate/);
  });

  it('nêu MỌI chỗ thiếu trong một thông báo, không dừng ở chỗ đầu tiên', () => {
    const ports = portsDay();
    delete ports.channel.publish;
    delete ports.fileIO.readChosenFile;
    let thongBao = '';
    try {
      taoStore(ports);
    } catch (loi) {
      thongBao = loi.message;
    }
    expect(thongBao).toMatch(/channel\.publish/);
    expect(thongBao).toMatch(/fileIO\.readChosenFile/);
  });

  it('thiếu cả một cổng, hoặc cổng rỗng, thì cũng ném và nêu tên cổng', () => {
    const ports = portsDay();
    delete ports.sessionStore;
    expect(() => taoStore(ports)).toThrow(/sessionStore/);
    expect(() => taoStore({ ...portsDay(), noteStore: {} })).toThrow(/noteStore\.readAll/);
  });

  it('một thành viên CÓ MẶT nhưng không phải hàm cũng là thiếu', () => {
    expect(() => taoStore({ ...portsDay(), quota: { estimate: 42 } })).toThrow(/quota\.estimate/);
  });

  it('kiemTraPorts trả về chính ports khi hợp lệ — đúng hợp đồng JSDoc của nó', () => {
    const ports = portsDay();
    expect(kiemTraPorts(ports)).toBe(ports);
  });

  it('ports không phải object thì ném ngay, không đợi tới lúc dùng', () => {
    for (const xau of [undefined, null, 'ports', [], () => {}]) {
      expect(() => taoStore(xau)).toThrow(TypeError);
    }
  });

  it('ném lúc khởi động, không phải lúc gọi — store không được dựng nửa vời', () => {
    // Nếu `taoStore` chỉ kiểm lúc một action chạm cổng thì lệnh dưới đây sẽ trả về một store.
    expect(() => taoStore(portsThieu('channel', 'subscribe'))).toThrow(TypeError);
  });
});

describe('datDieuKien — đúng một action đổi khối điều kiện (AD-15)', () => {
  it('đặt một nửa thì nửa kia giữ nguyên', () => {
    const store = taoStore(portsDay());
    store.datDieuKien({ keyword: 'phỞ' });
    expect(store.state.dieuKien).toEqual({ keyword: 'phỞ', date: null });
    store.datDieuKien({ date: '2026-09-10' });
    expect(store.state.dieuKien).toEqual({ keyword: 'phỞ', date: '2026-09-10' });
    store.datDieuKien({ keyword: 'bún' });
    expect(store.state.dieuKien).toEqual({ keyword: 'bún', date: '2026-09-10' });
  });

  it('ngày hợp lệ được nhận nguyên dạng yyyy-MM-dd', () => {
    const store = taoStore(portsDay());
    store.datDieuKien({ date: '2026-09-10' });
    expect(store.state.dieuKien.date).toBe('2026-09-10');
  });

  it('ngày gõ dở hay sai định dạng thì GIỮ giá trị cũ và không ném', () => {
    const store = taoStore(portsDay());
    store.datDieuKien({ date: '2026-09-10' });
    for (const goDo of ['2026-9', '2026', '10/09/2026', '2026-09-10T00:00:00', ' 2026-09-10']) {
      expect(() => store.datDieuKien({ date: goDo })).not.toThrow();
      expect(store.state.dieuKien.date).toBe('2026-09-10');
    }
  });

  it('chuỗi rỗng là VẮNG MẶT điều kiện, không phải điều kiện rỗng', () => {
    const store = taoStore(portsDay());
    store.datDieuKien({ keyword: 'phỞ', date: '2026-09-10' });
    store.datDieuKien({ keyword: '' });
    expect(store.state.dieuKien.keyword).toBeNull();
    store.datDieuKien({ date: '' });
    expect(store.state.dieuKien.date).toBeNull();
  });

  it('null xóa đúng nửa được nêu', () => {
    const store = taoStore(portsDay());
    store.datDieuKien({ keyword: 'phỞ', date: '2026-09-10' });
    store.datDieuKien({ keyword: null });
    expect(store.state.dieuKien).toEqual({ keyword: null, date: '2026-09-10' });
  });

  it('khóa lạ thì ném TypeError nêu tên khóa', () => {
    const store = taoStore(portsDay());
    expect(() => store.datDieuKien({ mau: 'vàng' })).toThrow(TypeError);
    expect(() => store.datDieuKien({ mau: 'vàng' })).toThrow(/mau/);
    // Khóa đúng đi kèm khóa lạ vẫn là đỏ, và không nửa nào bị đổi.
    expect(() => store.datDieuKien({ keyword: 'x', mau: 'vàng' })).toThrow(TypeError);
    expect(store.state.dieuKien).toEqual({ keyword: null, date: null });
  });

  it('partial không phải object, hoặc nửa sai KIỂU, thì ném', () => {
    const store = taoStore(portsDay());
    for (const xau of [undefined, null, 'phỞ', [], () => {}]) {
      expect(() => store.datDieuKien(xau)).toThrow(TypeError);
    }
    expect(() => store.datDieuKien({ keyword: 7 })).toThrow(TypeError);
    expect(() => store.datDieuKien({ date: 7 })).toThrow(TypeError);
    expect(() => store.datDieuKien({ keyword: undefined })).toThrow(TypeError);
    expect(() => store.datDieuKien({ date: undefined })).toThrow(TypeError);
  });

  it('một action NÉM thì không đổi gì, kể cả nửa đã chuẩn hóa xong', () => {
    const store = taoStore(portsDay());
    // `keyword` chuẩn hóa được, `date` thì sai kiểu. Nếu nửa đầu được gán trước khi nửa sau
    // được kiểm thì nó ở lại trong khối nội bộ, rồi hiện ra ở action THÀNH CÔNG kế tiếp.
    expect(() => store.datDieuKien({ keyword: 'phỞ', date: 7 })).toThrow(TypeError);
    expect(store.state.dieuKien).toEqual({ keyword: null, date: null });
    store.datDieuKien({ date: '2026-09-10' });
    expect(store.state.dieuKien).toEqual({ keyword: null, date: '2026-09-10' });
  });

  it('object rỗng là phép không đổi gì, không phải lỗi', () => {
    const store = taoStore(portsDay());
    store.datDieuKien({ keyword: 'phỞ' });
    store.datDieuKien({});
    expect(store.state.dieuKien).toEqual({ keyword: 'phỞ', date: null });
  });
});

describe('xoaHetDieuKien — đúng một action đưa khối về vắng mặt (AD-15)', () => {
  it('đưa cả hai nửa về null', () => {
    const store = taoStore(portsDay());
    store.datDieuKien({ keyword: 'phỞ', date: '2026-09-10' });
    store.xoaHetDieuKien();
    expect(store.state.dieuKien).toEqual({ keyword: null, date: null });
  });

  it('gọi khi đang vắng mặt điều kiện là vô hại', () => {
    const store = taoStore(portsDay());
    store.xoaHetDieuKien();
    expect(store.state.dieuKien).toEqual({ keyword: null, date: null });
  });

  it('không đụng tới trường nào khác của state', () => {
    const store = taoStore(portsDay());
    const truoc = store.state;
    store.xoaHetDieuKien();
    expect(Object.keys(store.state).sort()).toEqual(KHOA_STATE);
    expect(store.state.notes).toEqual(truoc.notes);
    expect(store.state.draft).toEqual(truoc.draft);
  });
});

describe('state đọc ra là đóng băng — mã ngoài state.js không ghi thẳng được (AD-1)', () => {
  it('gán vào một trường cấp một thì ném', () => {
    const store = taoStore(portsDay());
    expect(() => {
      store.state.notes = [{ id: 'x' }];
    }).toThrow(TypeError);
    expect(store.state.notes).toEqual([]);
  });

  it('đóng băng SÂU — gán vào trường lồng bên trong cũng ném', () => {
    const store = taoStore(portsDay());
    expect(() => {
      store.state.dieuKien.keyword = 'luồn qua';
    }).toThrow(TypeError);
    expect(() => {
      store.state.editing.seq = 9;
    }).toThrow(TypeError);
    expect(store.state.dieuKien.keyword).toBeNull();
  });

  it('mảng trong state cũng đóng băng — push không lách được', () => {
    const store = taoStore(portsDay());
    expect(() => store.state.notes.push({ id: 'x' })).toThrow(TypeError);
    expect(store.state.notes).toEqual([]);
  });

  it('chính store đóng băng — không gán thêm hay thay được một action', () => {
    const store = taoStore(portsDay());
    expect(() => {
      store.datDieuKien = () => {};
    }).toThrow(TypeError);
    expect(() => {
      store.actionLa = () => {};
    }).toThrow(TypeError);
  });

  it('state đọc ra là BẢN SAO — giữ lại một ảnh cũ không thấy được thay đổi sau đó', () => {
    const store = taoStore(portsDay());
    const anhCu = store.state;
    store.datDieuKien({ keyword: 'phỞ' });
    expect(anhCu.dieuKien.keyword).toBeNull();
    expect(store.state.dieuKien.keyword).toBe('phỞ');
  });

  it('nhánh KHÔNG đổi được dùng lại y nguyên — một action không trả giá theo cỡ cả state', () => {
    // `datDieuKien` chạy theo từng phím gõ vào ô tìm kiếm, còn `notes` giữ toàn bộ ghi chú
    // trong RAM. `toBe` chứ không phải `toEqual`: nếu `notes` bị sao chép lại mỗi phím thì
    // chi phí tỉ lệ với số ghi chú, và test này là chỗ duy nhất nhìn thấy điều đó.
    const store = taoStore(portsDay());
    const notesTruoc = store.state.notes;
    const draftTruoc = store.state.draft;
    const dieuKienTruoc = store.state.dieuKien;
    store.datDieuKien({ keyword: 'phỞ' });
    expect(store.state.notes).toBe(notesTruoc);
    expect(store.state.draft).toBe(draftTruoc);
    // Nhánh ĐÃ đổi thì phải là một object mới — nếu không thì ảnh cũ đã bị sửa tại chỗ.
    expect(store.state.dieuKien).not.toBe(dieuKienTruoc);
  });
});

// ── Luồng ghi chuẩn (AD-8) ──────────────────────────────────────────────────────────────
//
// Cổng giả dưới đây ghi lại THỨ TỰ gọi, không chỉ ghi lại "đã gọi", và đó là bắt buộc: một
// action `await put(x); datLai(...)` và một action `datLai(...); await put(x)` cho cùng kết
// quả ở mọi ca THÀNH CÔNG. Chỉ ca cổng từ chối phân biệt được chúng, và đó chính là ca mà
// FR-19 nói tới. Thêm nữa, `quanSat` được gọi BÊN TRONG `put` nên nó chụp được state đúng
// lúc phép ghi bắt đầu — chỗ duy nhất nhìn thấy thứ tự thật.

/** Ba bản ghi mẫu, thứ tự vào lộn xộn so với khóa sắp xếp. */
function banGhiMau() {
  return [
    { id: 'b', createdAt: '2026-09-03T09:00:00+07:00', localDate: '2026-09-03', text: 'b', textFolded: 'b' },
    { id: 'c', createdAt: '2026-09-04T08:00:00+07:00', localDate: '2026-09-04', text: 'c', textFolded: 'c' },
    { id: 'a', createdAt: '2026-09-03T16:40:12+07:00', localDate: '2026-09-03', text: 'a', textFolded: 'a' },
  ];
}

/**
 * Cổng `noteStore` giả: nhật ký thứ tự gọi, kho trong RAM, và ép từ chối từng phương thức.
 *
 * @param {object} tuyChon `banDau` (bản ghi có sẵn), `tuChoi` (mã lỗi theo tên phương thức),
 *   `quanSat` (gọi bên trong mỗi phương thức, để chụp state đúng lúc đó).
 */
function khoGia(tuyChon = {}) {
  const { banDau = [], tuChoi = {}, quanSat = () => {}, ketQuaClaim = null } = tuyChon;
  const nhatKy = [];
  const banGhi = new Map(banDau.map((mau) => [mau.id, mau]));
  /** Bản nháp đã ghi xuống, khóa theo danh tính tab. */
  const banNhap = new Map();

  function ra(ten, giaTri) {
    if (Object.prototype.hasOwnProperty.call(tuChoi, ten)) {
      return Promise.reject(loiUngDung(tuChoi[ten]));
    }
    return Promise.resolve(giaTri);
  }

  const cong = {
    readAll() {
      nhatKy.push('readAll');
      quanSat('readAll');
      return ra('readAll', [...banGhi.values()]);
    },
    put(note) {
      nhatKy.push(`put:${note.id}`);
      quanSat('put', note);
      if (!Object.prototype.hasOwnProperty.call(tuChoi, 'put')) banGhi.set(note.id, note);
      return ra('put');
    },
    remove(id) {
      nhatKy.push(`remove:${id}`);
      quanSat('remove', id);
      if (!Object.prototype.hasOwnProperty.call(tuChoi, 'remove')) banGhi.delete(id);
      return ra('remove');
    },
    // Ghi THẬT vào `banGhi`, và thay SẠCH: `replaceAll` là "một giao dịch, hoặc tất cả hoặc
    // không gì" (`ports/note-store.js:49-57`), nên một bản giả chỉ ghi nhật ký sẽ làm phép gộp
    // file sao lưu (Story 4.3) xanh mà không ai kiểm được kho sau đó chứa gì. Từ chối thì
    // `banGhi` KHÔNG đổi một bản ghi nào — đúng nửa "kho cuộn ngược" của cùng hợp đồng đó.
    replaceAll(notes) {
      nhatKy.push('replaceAll');
      quanSat('replaceAll', notes);
      if (!Object.prototype.hasOwnProperty.call(tuChoi, 'replaceAll')) {
        banGhi.clear();
        for (const mau of notes) banGhi.set(mau.id, mau);
      }
      return ra('replaceAll');
    },

    // Quy tắc bốn bước của AD-3 sống ở `core/draft.js` và có test riêng — ở đây chỉ cần một
    // cổng trả về KẾT QUẢ đã định sẵn, để các ca dưới nghiệm thu phần nối của action.
    claimDraft(yeuCau) {
      nhatKy.push(`claimDraft:${yeuCau.tabId}`);
      quanSat('claimDraft', yeuCau);
      const mac = { tabId: yeuCau.tabId, text: '' };
      return ra('claimDraft', ketQuaClaim === null ? mac : { ...mac, ...ketQuaClaim });
    },

    putDraft(draft) {
      nhatKy.push(`putDraft:${draft.tabId}`);
      quanSat('putDraft', draft);
      if (!Object.prototype.hasOwnProperty.call(tuChoi, 'putDraft')) {
        banNhap.set(draft.tabId, draft);
      }
      return ra('putDraft');
    },

    // Một lời gọi, hai kho — cùng hình dạng với giao dịch thật của adapter. Nhật ký ghi lại CẢ
    // HAI nửa: "một transaction" ở tầng lõi quan sát được đúng bằng "đúng một lời gọi cổng
    // mang cả hai bản ghi", nên một hiện thực gọi `put` rồi `putDraft` sẽ lộ ra ở đây.
    commitDraft({ note, draft }) {
      nhatKy.push(`commitDraft:${note.id}+${draft === null ? 'null' : draft.tabId}`);
      quanSat('commitDraft', { note, draft });
      if (!Object.prototype.hasOwnProperty.call(tuChoi, 'commitDraft')) {
        banGhi.set(note.id, note);
        if (draft !== null) banNhap.set(draft.tabId, draft);
      }
      return ra('commitDraft');
    },
  };

  return { nhatKy, banGhi, banNhap, cong };
}

/**
 * Cổng `sessionStore` giả: danh tính tab cố định và nhật ký các lần ghi lại danh tính.
 *
 * Danh tính cố định chứ không sinh ngẫu nhiên: ca "tab bị nhân đôi" phân biệt được danh tính
 * mới với danh tính cũ chỉ khi biết chắc danh tính cũ là gì.
 */
function phienGia(tuyChon = {}) {
  const { danhTinh = 'tab-cu', nem = {} } = tuyChon;
  const daNhanDanhTinh = [];
  const cong = {
    read() {
      throw new Error('không ca test nào được gọi sessionStore.read');
    },
    write() {
      throw new Error('không ca test nào được gọi sessionStore.write');
    },
    remove() {
      throw new Error('không ca test nào được gọi sessionStore.remove');
    },
    tabIdentity() {
      if (Object.prototype.hasOwnProperty.call(nem, 'tabIdentity')) {
        throw loiUngDung(nem.tabIdentity);
      }
      return danhTinh;
    },
    writeTabIdentity(id) {
      if (Object.prototype.hasOwnProperty.call(nem, 'writeTabIdentity')) {
        throw loiUngDung(nem.writeTabIdentity);
      }
      daNhanDanhTinh.push(id);
    },
  };
  return { daNhanDanhTinh, cong };
}

/** Store nối vào một `noteStore` giả và một `sessionStore` giả; ba cổng còn lại vẫn ném. */
function storeVoiKho(tuyChon = {}) {
  const kho = khoGia(tuyChon);
  const phien = phienGia(tuyChon.phien);
  const ports = portsDay();
  ports.noteStore = kho.cong;
  ports.sessionStore = phien.cong;
  return { store: taoStore(ports), kho, phien };
}

describe('khoiDong — nạp toàn bộ ghi chú vào RAM, đã sắp xếp (AD-6)', () => {
  it('kho có 3 ghi chú thứ tự lộn xộn → notes là 3 phần tử giảm dần theo localStamp', async () => {
    const { store } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['c', 'a', 'b']);
    expect(store.state.notes.map((mau) => localStamp(mau))).toEqual([
      '2026-09-04T08:00:00',
      '2026-09-03T16:40:12',
      '2026-09-03T09:00:00',
    ]);
    expect(store.state.banner).toBeNull();
  });

  it('kho rỗng → notes là [] và dải băng vẫn null', async () => {
    const { store } = storeVoiKho();
    await store.khoiDong();
    expect(store.state.notes).toEqual([]);
    expect(store.state.banner).toBeNull();
  });

  it('readAll từ chối với code=DB → notes giữ [], banner DB, và không ném ra ngoài', async () => {
    const { store } = storeVoiKho({ tuChoi: { readAll: MA_LOI.DB } });
    await expect(store.khoiDong()).resolves.toBeUndefined();
    expect(store.state.notes).toEqual([]);
    expect(store.state.banner).toBe(MA_LOI.DB);
  });

  it('bản ghi mang createdAt rác → banner DB thay vì ném ra khỏi action', async () => {
    const { store } = storeVoiKho({ banDau: [{ id: 'x', createdAt: 'hôm qua' }] });
    await expect(store.khoiDong()).resolves.toBeUndefined();
    expect(store.state.notes).toEqual([]);
    expect(store.state.banner).toBe(MA_LOI.DB);
  });

  it('notes nạp vào vẫn đóng băng sâu — không ghi thẳng được từ ngoài', async () => {
    const { store } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    expect(() => {
      store.state.notes[0].text = 'luồn qua';
    }).toThrow(TypeError);
  });
});

// ── datTheme (Story 3.3) ────────────────────────────────────────────────────────────────
//
// Theme là tầng B′ của AD-3, nên nó đi đúng luồng "đổi sự tồn tại": ghi cổng TRƯỚC, đặt state
// SAU. Ba ca dưới đây là ba nửa của AC mà chỉ một action CHẠY THẬT phân biệt được — giá trị lạ
// bị từ chối, kho từ chối thì state không đổi, và chuông liên tab chỉ gõ khi phép ghi đã chốt.
//
// Hành vi của NÚT (nhãn chữ, chiều lật, vòng sáng) thì không ở đây: nó là `test/theme.test.js`.

/** Store với `sessionStore.write` và `channel.publish` ghi nhật ký được. */
function storeVoiTheme(tuyChon = {}) {
  const { nemKhiGhi = null, danhTinh = 'tab-cu' } = tuyChon;
  const daGhiKho = [];
  const daPhat = [];
  const ports = portsDay();
  ports.sessionStore = {
    read() {
      throw new Error('không ca test nào được gọi sessionStore.read');
    },
    write(key, value) {
      if (nemKhiGhi !== null) throw loiUngDung(nemKhiGhi);
      daGhiKho.push([key, value]);
    },
    remove() {
      throw new Error('không ca test nào được gọi sessionStore.remove');
    },
    tabIdentity() {
      return danhTinh;
    },
    writeTabIdentity() {},
  };
  ports.channel = {
    publish(message) {
      daPhat.push(message);
    },
    subscribe() {},
  };
  return { store: taoStore(ports), daGhiKho, daPhat };
}

describe('datTheme — ghi kho cấu hình trước, đổi state sau, rồi gõ chuông (Story 3.3)', () => {
  it('lật hai chiều: state đổi, và khóa `theme` xuống kho đúng giá trị', async () => {
    const { store, daGhiKho } = storeVoiTheme();
    expect(store.state.theme).toBe('light');
    await store.datTheme('dark');
    expect(store.state.theme).toBe('dark');
    await store.datTheme('light');
    expect(store.state.theme).toBe('light');
    // Tên THẬT (`ghichu.theme`) là chuyện của adapter — lõi chỉ biết khóa trừu tượng (AD-2).
    expect(daGhiKho).toEqual([
      ['theme', 'dark'],
      ['theme', 'light'],
    ]);
  });

  it('phát ĐÚNG MỘT bản tin session-changed, đúng hình dạng bốn trường (AD-7, AD-21)', async () => {
    const { store, daPhat } = storeVoiTheme();
    await store.datTheme('dark');
    expect(daPhat).toHaveLength(1);
    expect(daPhat[0]).toEqual({
      v: 1,
      type: 'session-changed',
      from: 'tab-cu',
      appVersion: APP_VERSION,
    });
    // Bản tin KHÔNG mang giá trị theme: cổng chỉ mang TIN, tab nhận đọc lại từ kho bền.
    expect(Object.keys(daPhat[0]).sort()).toEqual(['appVersion', 'from', 'type', 'v']);
  });

  it('kho từ chối → theme KHÔNG đổi, dải băng mang đúng mã, và không chuông nào gõ', async () => {
    for (const ma of [MA_LOI.QUOTA, MA_LOI.DB]) {
      const { store, daPhat } = storeVoiTheme({ nemKhiGhi: ma });
      await expect(store.datTheme('dark')).resolves.toBeUndefined();
      expect(store.state.theme).toBe('light');
      expect(store.state.banner).toBe(ma);
      expect(daPhat).toEqual([]);
    }
  });

  it('một phép ghi sau đó thành công thì tắt dải băng (AD-8)', async () => {
    const { store } = storeVoiTheme({ nemKhiGhi: MA_LOI.QUOTA });
    await store.datTheme('dark');
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
    const lanhLan = storeVoiTheme();
    await lanhLan.store.datTheme('dark');
    expect(lanhLan.store.state.banner).toBeNull();
  });

  it('giá trị lạ bị từ chối bằng TypeError, và cổng KHÔNG bị chạm', () => {
    const { store, daGhiKho, daPhat } = storeVoiTheme();
    for (const xau of ['system', 'Dark', '', null, undefined, 7, ['dark']]) {
      expect(() => store.datTheme(xau)).toThrow(TypeError);
    }
    expect(store.state.theme).toBe('light');
    expect(daGhiKho).toEqual([]);
    expect(daPhat).toEqual([]);
  });

  it('khoiDong nhận theme ban đầu qua THAM SỐ, và bỏ qua giá trị lạ trong im lặng', async () => {
    const { store } = storeVoiKho();
    await store.khoiDong('dark');
    expect(store.state.theme).toBe('dark');

    const khac = storeVoiKho();
    await khac.store.khoiDong('nửa tối');
    expect(khac.store.state.theme).toBe('light');

    const trong = storeVoiKho();
    await trong.store.khoiDong();
    expect(trong.store.state.theme).toBe('light');
  });

  it('theme không đụng tới trường nào khác, và tập khóa không nới ra', async () => {
    const { store } = storeVoiTheme();
    await store.datTheme('dark');
    expect(Object.keys(store.state).sort()).toEqual(KHOA_STATE);
    expect(store.state.notes).toEqual([]);
    expect(store.state.draft).toEqual({ text: '', seq: 0 });
  });
});

describe('chotGhiChu — ghi trước, đổi state sau, và hai kho trong MỘT giao dịch (AD-8)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Store đã giành được bản nháp, với chữ đã nằm sẵn trong `draft`. */
  async function storeDaGo(chu, tuyChon = {}) {
    const bo = storeVoiKho(tuyChon);
    await bo.store.khoiDongBanNhap();
    bo.kho.nhatKy.length = 0;
    if (chu !== null) bo.store.datBanNhap(chu);
    return bo;
  }

  it('commitDraft được gọi TRƯỚC khi state.notes đổi', async () => {
    // Đây là test mà spec đòi riêng: ở ca thành công, hai thứ tự cho cùng kết quả cuối, nên
    // phải chụp state ĐÚNG LÚC phép ghi chạy.
    let store;
    const anhLucGhi = [];
    const kho = khoGia({
      quanSat: (ten) => {
        if (ten === 'commitDraft') anhLucGhi.push(store.state.notes.length);
      },
    });
    const ports = portsDay();
    ports.noteStore = kho.cong;
    store = taoStore(ports);

    store.datBanNhap('phở');
    await store.chotGhiChu();
    expect(anhLucGhi).toEqual([0]);
    expect(store.state.notes).toHaveLength(1);
  });

  it('chốt bình thường: mẩu mới ở ĐẦU notes, đúng năm trường AD-13, ô trống lại', async () => {
    const { store, kho } = await storeDaGo('Phân quyền', { banDau: banGhiMau() });
    await store.khoiDong();
    await store.chotGhiChu();
    expect(store.state.notes).toHaveLength(4);
    const moi = store.state.notes[0];
    expect(Object.keys(moi).sort()).toEqual(
      ['createdAt', 'id', 'localDate', 'text', 'textFolded'].sort(),
    );
    expect(moi.text).toBe('Phân quyền');
    expect(moi.textFolded).toBe('phan quyen');
    expect(moi.localDate).toBe(moi.createdAt.slice(0, 10));
    expect(typeof moi.id).toBe('string');
    // Cùng bản ghi đó đã xuống kho, không phải một bản khác.
    expect(kho.banGhi.get(moi.id)).toEqual(moi);
    // Bản nháp đã trống — ở CẢ state lẫn kho.
    expect(store.state.draft.text).toBe('');
    expect(kho.banNhap.get('tab-cu').text).toBe('');
    expect(store.state.banner).toBeNull();
  });

  it('ĐÚNG MỘT lời gọi cổng, và nó mang CẢ HAI bản ghi — tính nguyên tử của AD-8', async () => {
    // "Một transaction" ở tầng lõi quan sát được đúng bằng "đúng một lời gọi cổng": một hiện
    // thực gọi `put` rồi `putDraft` nối nhau cho cùng kết quả cuối, và cùng một bản nháp ma.
    let viec = null;
    const { store, kho } = await storeDaGo('phở', {
      quanSat: (ten, giaTri) => {
        if (ten === 'commitDraft') viec = giaTri;
      },
    });
    await store.chotGhiChu();
    expect(kho.nhatKy).toHaveLength(1);
    expect(kho.nhatKy[0]).toMatch(/^commitDraft:/);
    expect(viec.note.text).toBe('phở');
    expect(viec.draft).toEqual({
      tabId: 'tab-cu',
      text: '',
      heartbeat: expect.any(String),
    });
  });

  it('chưa giành được bản nháp (tabCuaMinh null): vẫn chốt, và draft của lời gọi là null', async () => {
    let viec = null;
    const { store, kho } = storeVoiKho({
      quanSat: (ten, giaTri) => {
        if (ten === 'commitDraft') viec = giaTri;
      },
    });
    // Không gọi `khoiDongBanNhap`: không có bản ghi `drafts` nào của tab này để làm rỗng.
    store.datBanNhap('phở');
    await store.chotGhiChu();
    expect(viec.draft).toBeNull();
    expect(store.state.notes).toHaveLength(1);
    expect(kho.banNhap.size).toBe(0);
  });

  it('mẩu mới KHÔNG chỉ được chèn lên đầu — mảng giữ đúng thứ tự giảm dần (AD-6)', async () => {
    // Bản ghi `c` mang mốc của NGÀY MAI so với mốc `nowIso()` sinh ra ở đây: đồng hồ máy lùi
    // lại, hay một bản ghi nạp từ file sao lưu, đều dựng đúng tình huống này.
    const tuongLai = {
      id: 'tuong-lai',
      createdAt: '2099-01-01T00:00:00+05:30',
      localDate: '2099-01-01',
      text: 'sau',
      textFolded: 'sau',
    };
    const { store } = await storeDaGo('bây giờ', { banDau: [tuongLai] });
    await store.khoiDong();
    await store.chotGhiChu();
    // Mẩu vừa thêm phải nằm SAU mẩu mang mốc muộn hơn, chứ không phải ở đầu mảng.
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['tuong-lai', store.state.notes[1].id]);
    expect(store.state.notes[1].text).toBe('bây giờ');
    const khoa = store.state.notes.map((mau) => localStamp(mau));
    expect([...khoa].sort().reverse()).toEqual(khoa);
  });

  it('gõ đêm, chốt sáng: createdAt là mốc CHỐT, không phải lúc gõ', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 14, 23, 0, 0));
    const { store } = await storeDaGo('phở đêm');
    vi.setSystemTime(new Date(2026, 8, 15, 9, 0, 0));
    await store.chotGhiChu();
    const moi = store.state.notes[0];
    expect(moi.localDate).toBe('2026-09-15');
    expect(moi.createdAt.slice(0, 16)).toBe('2026-09-15T09:00');
  });

  it('một phép ghi THÀNH CÔNG tắt dải băng của lần hỏng trước (AD-8)', async () => {
    // Dải băng ở lại "cho tới khi một phép ghi sau đó thành công" — nếu không thì một lần hết
    // dung lượng đeo bám mọi thao tác về sau và câu chữ nói dối về trạng thái hiện tại.
    vi.useFakeTimers();
    const kho = khoGia({});
    let tuChoiLanNay = true;
    const congCoTheHong = {
      ...kho.cong,
      commitDraft(viec) {
        if (tuChoiLanNay) return Promise.reject(loiUngDung(MA_LOI.QUOTA));
        return kho.cong.commitDraft(viec);
      },
    };
    const ports = portsDay();
    ports.noteStore = congCoTheHong;
    const store = taoStore(ports);

    store.datBanNhap('hỏng');
    await store.chotGhiChu();
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
    tuChoiLanNay = false;
    store.datBanNhap('xong');
    await store.chotGhiChu();
    expect(store.state.banner).toBeNull();
    expect(store.state.notes).toHaveLength(1);
  });

  it('cổng từ chối: notes KHÔNG đổi, chữ CÒN NGUYÊN trong draft, banner mang mã lỗi', async () => {
    vi.useFakeTimers();
    const { store } = await storeDaGo('phở', {
      banDau: banGhiMau(),
      tuChoi: { commitDraft: MA_LOI.QUOTA },
    });
    await store.khoiDong();
    const truoc = store.state.notes;
    await expect(store.chotGhiChu()).resolves.toBeUndefined();
    expect(store.state.notes).toBe(truoc);
    expect(store.state.draft.text).toBe('phở');
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
  });

  it('cổng từ chối: một hẹn tự lưu được đặt LẠI, để chữ chưa an toàn còn đường xuống kho', async () => {
    vi.useFakeTimers();
    const { store, kho } = await storeDaGo('phở', { tuChoi: { commitDraft: MA_LOI.DB } });
    await store.chotGhiChu();
    kho.nhatKy.length = 0;
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(kho.nhatKy).toEqual(['putDraft:tab-cu']);
    expect(kho.banNhap.get('tab-cu').text).toBe('phở');
  });

  it('draft quá trần → cổng KHÔNG bị gọi, chữ nằm nguyên trong ô, banner TOO_LONG', async () => {
    vi.useFakeTimers();
    const { store, kho } = await storeDaGo('x'.repeat(MAX_NOTE_CHARS + 1));
    await store.chotGhiChu();
    expect(kho.nhatKy).toEqual([]);
    expect(store.state.notes).toEqual([]);
    expect(store.state.draft.text).toHaveLength(MAX_NOTE_CHARS + 1);
    expect(store.state.banner).toBe(MA_LOI.TOO_LONG);
    // Đúng trần thì vẫn nhận.
    store.datBanNhap('x'.repeat(MAX_NOTE_CHARS));
    await store.chotGhiChu();
    expect(store.state.notes).toHaveLength(1);
  });

  it('bản nháp rỗng hay chỉ khoảng trắng → không cổng, không notes, không banner, ô không đổi', async () => {
    vi.useFakeTimers();
    const { store, kho } = await storeDaGo(null);
    store.datDieuKien({ keyword: 'phở' });
    for (const trong of ['', '   ', '\n\t ']) {
      store.datBanNhap(trong);
      await store.chotGhiChu();
      expect(store.state.draft.text).toBe(trong);
    }
    expect(kho.nhatKy).toEqual([]);
    expect(store.state.notes).toEqual([]);
    expect(store.state.banner).toBeNull();
    // Và điều kiện KHÔNG bị xóa: một cú bấm nhầm trên ô trống không được âm thầm tắt bộ lọc.
    expect(store.state.dieuKien).toEqual({ keyword: 'phở', date: null });
  });

  it('một lần chốt THẬT thì xoaHetDieuKien chạy — mẩu vừa chốt phải nhìn thấy được', async () => {
    vi.useFakeTimers();
    const { store } = await storeDaGo('phở');
    store.datDieuKien({ keyword: 'bún', date: '2026-09-01' });
    await store.chotGhiChu();
    expect(store.state.dieuKien).toEqual({ keyword: null, date: null });
  });

  it('hẹn tự lưu đang treo bị BỎ sau khi chốt — bản nháp đã chốt không hồi sinh', async () => {
    vi.useFakeTimers();
    const { store, kho } = await storeDaGo('phở');
    // Chốt TRONG vòng AUTOSAVE_MS: hẹn của phím cuối vẫn đang treo.
    await store.chotGhiChu();
    kho.nhatKy.length = 0;
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 3);
    // Hẹn cũ nổ ra nhưng `draft.seq` đã tăng, nên nó không chạm cổng: không một `putDraft` nào
    // đưa chữ vừa thành ghi chú quay lại kho bản nháp.
    expect(kho.nhatKy).toEqual([]);
    expect(kho.banNhap.get('tab-cu').text).toBe('');
  });

  it('chốt liên tiếp: hai ghi chú, hai id khác nhau, không mẩu nào trùng nội dung', async () => {
    vi.useFakeTimers();
    const { store } = await storeDaGo('một');
    await store.chotGhiChu();
    store.datBanNhap('hai');
    await store.chotGhiChu();
    expect(store.state.notes).toHaveLength(2);
    const [a, b] = store.state.notes;
    expect(a.id).not.toBe(b.id);
    expect([a.text, b.text].sort()).toEqual(['hai', 'một']);
    expect(store.state.draft.text).toBe('');
  });

  it('gõ tiếp TRONG LÚC đĩa còn quay: chữ mới thắng, ô KHÔNG bị làm trống', async () => {
    vi.useFakeTimers();
    let choGhi;
    const kho = khoGia({});
    const ports = portsDay();
    ports.noteStore = {
      ...kho.cong,
      commitDraft(viec) {
        return new Promise((chot) => {
          choGhi = () => chot(kho.cong.commitDraft(viec));
        });
      },
    };
    const store = taoStore(ports);
    store.datBanNhap('phở');
    const loiHua = store.chotGhiChu();
    // Nam gõ tiếp trước khi kho trả lời — `draft.seq` nhảy.
    store.datBanNhap('bún');
    choGhi();
    await loiHua;

    expect(store.state.notes).toHaveLength(1);
    expect(store.state.notes[0].text).toBe('phở');
    expect(store.state.draft.text).toBe('bún');
  });

  it('chotGhiChu KHÔNG nhận tham số — nguồn chữ duy nhất là state.draft.text', async () => {
    vi.useFakeTimers();
    const { store } = await storeDaGo('trong bản nháp');
    expect(store.chotGhiChu).toHaveLength(0);
    // Một đối số lạc vào không ném và cũng KHÔNG được dùng: đường vào thứ hai không tồn tại.
    await store.chotGhiChu('chữ lạ');
    expect(store.state.notes).toHaveLength(1);
    expect(store.state.notes[0].text).toBe('trong bản nháp');
  });

  it('bấm hai lần khi giao dịch CHƯA chốt: đúng một lời gọi cổng, đúng một ghi chú', async () => {
    // Phím tự lặp gửi `Ctrl+Enter` nhiều lần trong vài chục mili giây, và trong lúc giao dịch
    // đầu còn bay thì `draft.text` vẫn nguyên chữ — không có phép gác thì đó là hai ghi chú
    // trùng nội dung với hai `id` khác nhau, và Nam không bấm gì sai cả.
    vi.useFakeTimers();
    let choGhi;
    const kho = khoGia({});
    const ports = portsDay();
    ports.noteStore = {
      ...kho.cong,
      commitDraft(viec) {
        return new Promise((chot) => {
          choGhi = () => chot(kho.cong.commitDraft(viec));
        });
      },
    };
    const store = taoStore(ports);
    store.datBanNhap('phở');

    const lan1 = store.chotGhiChu();
    const lan2 = store.chotGhiChu();
    choGhi();
    await Promise.all([lan1, lan2]);

    expect(kho.nhatKy.filter((d) => d.startsWith('commitDraft:'))).toHaveLength(1);
    expect(store.state.notes).toHaveLength(1);
    expect(kho.banGhi.size).toBe(1);
    // Và phép gác NHẢ ra sau khi giao dịch chốt: lần chốt kế tiếp vẫn phải chạy.
    store.datBanNhap('bún');
    const lan3 = store.chotGhiChu();
    choGhi();
    await lan3;
    expect(store.state.notes).toHaveLength(2);
  });

  it('chốt trên ô đã xóa hết chữ: bản nháp RỖNG vẫn xuống kho, chữ đã xóa không quay về', async () => {
    // Bước hủy hẹn đi trước cả phép gác rỗng, nên nhánh rỗng cũng phải đặt LẠI hẹn — nếu không
    // thì kho còn giữ chữ cũ, và nó hiện lại nguyên vẹn ở lần tải trang sau.
    vi.useFakeTimers();
    const { store, kho } = await storeDaGo('phở bò');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(kho.banNhap.get('tab-cu').text).toBe('phở bò');

    store.datBanNhap('');
    await store.chotGhiChu();
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);

    expect(kho.banNhap.get('tab-cu').text).toBe('');
    expect(store.state.notes).toEqual([]);
  });

  it('themGhiChu KHÔNG còn trên store — một đường tạo ghi chú công khai, đúng một luật ghi', () => {
    const store = taoStore(portsDay());
    expect(store.themGhiChu).toBeUndefined();
  });
});

describe('xoaGhiChu — rút khỏi kho trước, rút khỏi state sau (AD-8)', () => {
  it('remove được gọi TRƯỚC khi state.notes đổi', async () => {
    let store;
    const anhLucRemove = [];
    const kho = khoGia({
      banDau: banGhiMau(),
      quanSat: (ten) => {
        if (ten === 'remove') anhLucRemove.push(store.state.notes.length);
      },
    });
    const ports = portsDay();
    ports.noteStore = kho.cong;
    store = taoStore(ports);

    await store.khoiDong();
    await store.xoaGhiChu('a');
    expect(anhLucRemove).toEqual([3]);
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['c', 'b']);
  });

  it('remove từ chối code=DB → phần tử VẪN CÒN trong notes, banner DB, không ném', async () => {
    const { store } = storeVoiKho({ banDau: banGhiMau(), tuChoi: { remove: MA_LOI.DB } });
    await store.khoiDong();
    await expect(store.xoaGhiChu('a')).resolves.toBeUndefined();
    expect(store.state.notes.map((mau) => mau.id)).toEqual(['c', 'a', 'b']);
    expect(store.state.banner).toBe(MA_LOI.DB);
  });

  it('id không tồn tại → không gọi cổng, không đổi state', async () => {
    const { store, kho } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    kho.nhatKy.length = 0;
    const truoc = store.state;
    await store.xoaGhiChu('khong-co');
    expect(kho.nhatKy).toEqual([]);
    expect(store.state).toBe(truoc);
  });

  it('sai kiểu id thì ném TypeError nêu tên tham số', () => {
    const { store } = storeVoiKho();
    expect(() => store.xoaGhiChu(null)).toThrow(TypeError);
    expect(() => store.xoaGhiChu(null)).toThrow(/id/);
    expect(() => store.xoaGhiChu(7)).toThrow(TypeError);
  });
});

describe('tuLuuNoiDung — state đổi ngay, phép ghi đi sau với debounce + seq (AD-8)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mỗi phím đổi editing.text NGAY, và put chạy ĐÚNG MỘT LẦN sau hẹn cuối', async () => {
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    kho.nhatKy.length = 0;

    for (const go of ['p', 'ph', 'phở']) {
      store.tuLuuNoiDung('a', go);
      expect(store.state.editing.text).toBe(go);
      expect(store.state.editing.id).toBe('a');
    }
    // Chưa tới hạn: chưa chạm cổng lần nào.
    expect(kho.nhatKy).toEqual([]);

    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(kho.nhatKy).toEqual(['put:a']);
    expect(kho.banGhi.get('a').text).toBe('phở');
    expect(kho.banGhi.get('a').textFolded).toBe('pho');
    // `id` và `createdAt` bất biến qua một lần sửa (AD-13).
    expect(kho.banGhi.get('a').createdAt).toBe('2026-09-03T16:40:12+07:00');
    expect(store.state.notes.find((mau) => mau.id === 'a').text).toBe('phở');
  });

  it('hẹn quá hạn BỊ BỎ: nó nổ ra, seq đã tăng, và put không chạy', async () => {
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    kho.nhatKy.length = 0;

    // Hẹn thứ nhất đặt ở t=0. Phím thứ hai ở t=1 tăng `seq`, nhưng KHÔNG hủy hẹn cũ — `seq`
    // là cơ chế chính thức của AD-8, nên nó phải là thứ chặn hẹn cũ.
    store.tuLuuNoiDung('a', 'cũ');
    await vi.advanceTimersByTimeAsync(1);
    store.tuLuuNoiDung('a', 'mới');

    // Đủ để hẹn THỨ NHẤT nổ, chưa đủ cho hẹn thứ hai.
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS - 1);
    expect(kho.nhatKy).toEqual([]);

    // Hẹn thứ hai nổ và ghi đúng chữ đang trên màn hình.
    await vi.advanceTimersByTimeAsync(1);
    expect(kho.nhatKy).toEqual(['put:a']);
    expect(kho.banGhi.get('a').text).toBe('mới');
  });

  it('mục tiêu bị xóa trong lúc chờ thì hẹn không hồi sinh nó', async () => {
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    store.tuLuuNoiDung('a', 'phở');
    await store.xoaGhiChu('a');
    kho.nhatKy.length = 0;
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(kho.nhatKy).toEqual([]);
    expect(kho.banGhi.has('a')).toBe(false);
  });

  it('put từ chối QUOTA → chữ trong editing.text KHÔNG bị hoàn tác, banner QUOTA', async () => {
    vi.useFakeTimers();
    const { store } = storeVoiKho({ banDau: banGhiMau(), tuChoi: { put: MA_LOI.QUOTA } });
    await store.khoiDong();
    store.tuLuuNoiDung('a', 'phở');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(store.state.editing.text).toBe('phở');
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
    // Bản cũ vẫn là bản cũ trong RAM: phép ghi hỏng thì không có gì đổi trên đĩa.
    expect(store.state.notes.find((mau) => mau.id === 'a').text).toBe('a');
  });

  it('text quá trần ở cửa SỬA cũng bị chặn — put không được gọi, banner TOO_LONG', async () => {
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    kho.nhatKy.length = 0;
    store.tuLuuNoiDung('a', 'x'.repeat(MAX_NOTE_CHARS + 1));
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(kho.nhatKy).toEqual([]);
    expect(store.state.banner).toBe(MA_LOI.TOO_LONG);
  });

  it('một lần tự lưu THÀNH CÔNG tắt dải băng của lần hỏng trước (AD-8)', async () => {
    vi.useFakeTimers();
    const kho = khoGia({ banDau: banGhiMau() });
    let tuChoiLanNay = true;
    const congCoTheHong = {
      ...kho.cong,
      put(note) {
        if (tuChoiLanNay) return Promise.reject(loiUngDung(MA_LOI.QUOTA));
        return kho.cong.put(note);
      },
    };
    const ports = portsDay();
    ports.noteStore = congCoTheHong;
    const store = taoStore(ports);

    await store.khoiDong();
    store.tuLuuNoiDung('a', 'hỏng');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(store.state.banner).toBe(MA_LOI.QUOTA);

    tuChoiLanNay = false;
    store.tuLuuNoiDung('a', 'xong');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(store.state.banner).toBeNull();
    expect(store.state.notes.find((mau) => mau.id === 'a').text).toBe('xong');
  });

  it('trả về đồng bộ và sai kiểu đối số thì ném TypeError nêu tên tham số', () => {
    // Hẹn thật sẽ nổ 400 ms SAU khi ca test kết thúc, nên hẹn giả cũng là cách dọn dẹp.
    vi.useFakeTimers();
    const { store } = storeVoiKho({ banDau: banGhiMau() });
    expect(store.tuLuuNoiDung('a', 'x')).toBeUndefined();
    expect(() => store.tuLuuNoiDung(7, 'x')).toThrow(/id/);
    expect(() => store.tuLuuNoiDung('a', 7)).toThrow(/text/);
    expect(() => store.tuLuuNoiDung(null, null)).toThrow(TypeError);
  });
});

describe('batTatMoRong — trạng thái mở rộng, tầng C, chỉ RAM', () => {
  it('mặc định không mẩu nào mở rộng', () => {
    expect(taoStore(portsDay()).state.expandedIds).toEqual([]);
  });

  it('bật rồi tắt cùng một id — đúng một nhịp click, đúng một nhịp thu lại', () => {
    const store = taoStore(portsDay());
    store.batTatMoRong('a');
    expect(store.state.expandedIds).toEqual(['a']);
    store.batTatMoRong('a');
    expect(store.state.expandedIds).toEqual([]);
  });

  it('NHIỀU mẩu cùng mở — mở mẩu thứ hai KHÔNG thu mẩu thứ nhất', () => {
    // Nửa mà một ô nhớ đơn (`expandedId`) làm sai trong im lặng, và là lý do tầng C mang một
    // TẬP chứ không một id.
    const store = taoStore(portsDay());
    store.batTatMoRong('a');
    store.batTatMoRong('b');
    expect(store.state.expandedIds).toEqual(['a', 'b']);
    store.batTatMoRong('a');
    expect(store.state.expandedIds).toEqual(['b']);
  });

  it('id lạ không ném, và không nhân đôi khi bật hai lần liên tiếp', () => {
    const store = taoStore(portsDay());
    expect(() => store.batTatMoRong('khong-co-mau-nao-mang-id-nay')).not.toThrow();
    expect(store.state.expandedIds).toEqual(['khong-co-mau-nao-mang-id-nay']);
  });

  it('id không phải chuỗi khác rỗng thì ném TypeError', () => {
    const store = taoStore(portsDay());
    for (const xau of [undefined, null, '', 7, {}]) {
      expect(() => store.batTatMoRong(xau)).toThrow(TypeError);
    }
  });

  it('KHÔNG chạm một cổng nào — không phép ghi nào xuống kho bền', () => {
    // `portsDay()` ném ở MỌI phương thức, nên một lời gọi cổng lén lút sẽ ném ngay đây. Đó là
    // cách "tải lại trang thì mọi mẩu về thu gọn" được bảo đảm bằng cách dựng được, chứ không
    // bằng một mục thử tay.
    const store = taoStore(portsDay());
    expect(() => store.batTatMoRong('a')).not.toThrow();
  });

  it('chốt một ghi chú KHÔNG thu các mẩu đang mở lại', async () => {
    // Dòng I/O Matrix "Chốt khi đang mở": mẩu mới hiện ra ở dạng thu gọn, nhưng những mẩu Nam
    // đã mở ra để đọc phải ở NGUYÊN như vậy. Đây là nửa mà một `datLai` viết rộng tay trong
    // `chotGhiChu` — hay một `xoaHetDieuKien` nới ra quá — làm sai trong im lặng.
    const { store } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    store.datBanNhap('mẩu mới');
    store.batTatMoRong('a');
    store.batTatMoRong('b');
    await store.chotGhiChu();
    expect(store.state.expandedIds).toEqual(['a', 'b']);
  });

  it('xoaGhiChu dọn id đó khỏi tập — cái nhớ phù du không phình theo số lần xóa', async () => {
    const { store } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    const [dau, sau] = store.state.notes;
    store.batTatMoRong(dau.id);
    store.batTatMoRong(sau.id);
    await store.xoaGhiChu(dau.id);
    expect(store.state.expandedIds).toEqual([sau.id]);
  });

  it('tập đọc ra ĐÓNG BĂNG — không đẩy thêm được từ ngoài (AD-1)', () => {
    const store = taoStore(portsDay());
    store.batTatMoRong('a');
    expect(() => store.state.expandedIds.push('b')).toThrow(TypeError);
    expect(store.state.expandedIds).toEqual(['a']);
  });
});

describe('action của luồng ghi chuẩn đều nằm trên store, và tập khóa state KHÔNG nới ra', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('store xuất đủ các action của luồng ghi chuẩn, kể cả ba action bản nháp', () => {
    const store = taoStore(portsDay());
    for (const ten of [
      'khoiDong',
      'datTheme',
      'chotGhiChu',
      'xoaGhiChu',
      'tuLuuNoiDung',
      'khoiDongBanNhap',
      'datBanNhap',
      'nhipTimBanNhap',
      'batTatMoRong',
    ]) {
      expect(typeof store[ten]).toBe('function');
    }
  });

  it('sau một vòng nạp–thêm–xóa–tự lưu, state vẫn đúng tập khóa đã chốt', async () => {
    vi.useFakeTimers();
    const { store } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    store.datBanNhap('phở');
    await store.chotGhiChu();
    await store.xoaGhiChu('b');
    store.tuLuuNoiDung('a', 'x');
    expect(Object.keys(store.state).sort()).toEqual(KHOA_STATE);
  });

  it('sau khi chạy cả BA action bản nháp, state vẫn đúng tập khóa — danh tính tab không lọt vào', async () => {
    vi.useFakeTimers();
    const { store } = storeVoiKho({ ketQuaClaim: { tabId: 'tab-moi', text: 'phở' } });
    await store.khoiDongBanNhap();
    store.datBanNhap('phở bò');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    await store.nhipTimBanNhap();
    expect(Object.keys(store.state).sort()).toEqual(KHOA_STATE);
    expect(store.state.draft).toEqual({ text: 'phở bò', seq: 1 });
  });
});

// ── Bản nháp riêng từng tab (AD-3 tầng B, AD-8) ─────────────────────────────────────────

describe('khoiDongBanNhap — nối danh tính tab với bản nháp giành được (AD-3)', () => {
  it('chưa có bản nháp nào → draft giữ rỗng, và cổng nhận đúng danh tính cùng ngưỡng im lặng', async () => {
    let yeuCau = null;
    const { store, kho } = storeVoiKho({
      quanSat: (ten, giaTri) => {
        if (ten === 'claimDraft') yeuCau = giaTri;
      },
    });
    await store.khoiDongBanNhap();
    expect(store.state.draft).toEqual({ text: '', seq: 0 });
    expect(kho.nhatKy).toEqual(['claimDraft:tab-cu']);
    expect(yeuCau.tabId).toBe('tab-cu');
    expect(yeuCau.staleMs).toBe(DRAFT_STALE_MS);
    // `now` là một mốc ISO-8601 có offset, không phải một mốc thời gian dựng tại chỗ.
    expect(yeuCau.now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });

  it('có bản của chính mình → chữ vào draft.text, và KHÔNG ghi lại danh tính', async () => {
    const { store, phien } = storeVoiKho({ ketQuaClaim: { tabId: 'tab-cu', text: 'phở' } });
    await store.khoiDongBanNhap();
    expect(store.state.draft).toEqual({ text: 'phở', seq: 0 });
    expect(phien.daNhanDanhTinh).toEqual([]);
  });

  it('tab bị nhân đôi → danh tính MỚI được ghi lại vào kho phạm vi phiên, draft rỗng', async () => {
    const { store, phien } = storeVoiKho({ ketQuaClaim: { tabId: 'tab-moi', text: '' } });
    await store.khoiDongBanNhap();
    expect(phien.daNhanDanhTinh).toEqual(['tab-moi']);
    expect(store.state.draft).toEqual({ text: '', seq: 0 });
  });

  it('danh tính mới ghi lại không được → dải băng, nhưng chữ nhận được VẪN vào state', async () => {
    const { store } = storeVoiKho({
      ketQuaClaim: { tabId: 'tab-moi', text: 'giữ lại' },
      phien: { nem: { writeTabIdentity: MA_LOI.QUOTA } },
    });
    await expect(store.khoiDongBanNhap()).resolves.toBeUndefined();
    expect(store.state.draft.text).toBe('giữ lại');
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
  });

  it('gõ TRONG LÚC chờ kho trả lời → chữ vừa gõ KHÔNG bị chữ giành được đè lên', async () => {
    // `app/main.js` gọi action này mà không đợi, nên đây là một khoảng thật, không phải giả
    // định: đè lên là vừa mất chữ trên màn hình vừa để hẹn đang treo ghi chữ cũ xuống kho.
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho({ ketQuaClaim: { tabId: 'tab-cu', text: 'chữ cũ' } });
    const xong = store.khoiDongBanNhap();
    store.datBanNhap('chữ mới');
    await xong;
    expect(store.state.draft).toEqual({ text: 'chữ mới', seq: 1 });

    // Và hẹn đang treo vẫn ghi đúng chữ trên màn hình, không phải chữ giành được.
    kho.nhatKy.length = 0;
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(kho.nhatKy).toEqual(['putDraft:tab-cu']);
    expect(kho.banNhap.get('tab-cu').text).toBe('chữ mới');
    vi.useRealTimers();
  });

  it('kho hỏng → draft giữ { text: "", seq: 0 }, banner DB, action KHÔNG ném', async () => {
    const { store } = storeVoiKho({ tuChoi: { claimDraft: MA_LOI.DB } });
    await expect(store.khoiDongBanNhap()).resolves.toBeUndefined();
    expect(store.state.draft).toEqual({ text: '', seq: 0 });
    expect(store.state.banner).toBe(MA_LOI.DB);
  });

  it('lấy danh tính tab hỏng → dải băng, và cổng kho KHÔNG bị chạm', async () => {
    const { store, kho } = storeVoiKho({ phien: { nem: { tabIdentity: MA_LOI.DB } } });
    await expect(store.khoiDongBanNhap()).resolves.toBeUndefined();
    expect(kho.nhatKy).toEqual([]);
    expect(store.state.banner).toBe(MA_LOI.DB);
  });

  it('danh tính KHÔNG phải một trường state — tập khóa không nới ra', async () => {
    const { store } = storeVoiKho({ ketQuaClaim: { tabId: 'tab-moi', text: 'phở' } });
    await store.khoiDongBanNhap();
    expect(Object.keys(store.state).sort()).toEqual(KHOA_STATE);
  });
});

describe('datBanNhap — state đổi ngay, phép ghi đi sau với debounce + seq riêng (AD-8)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mỗi phím đổi draft.text NGAY và tăng seq; putDraft chạy ĐÚNG MỘT LẦN sau hẹn cuối', async () => {
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho();
    await store.khoiDongBanNhap();
    kho.nhatKy.length = 0;

    let seq = 0;
    for (const go of ['p', 'ph', 'phở']) {
      store.datBanNhap(go);
      seq += 1;
      expect(store.state.draft.text).toBe(go);
      expect(store.state.draft.seq).toBe(seq);
    }
    expect(kho.nhatKy).toEqual([]);

    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(kho.nhatKy).toEqual(['putDraft:tab-cu']);
    const daGiu = kho.banNhap.get('tab-cu');
    expect(daGiu.text).toBe('phở');
    expect(Object.keys(daGiu).sort()).toEqual(['heartbeat', 'tabId', 'text']);
  });

  it('hẹn quá hạn BỊ BỎ: nó nổ ra, draft.seq đã tăng, và putDraft không chạy', async () => {
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho();
    await store.khoiDongBanNhap();
    kho.nhatKy.length = 0;

    store.datBanNhap('cũ');
    await vi.advanceTimersByTimeAsync(1);
    store.datBanNhap('mới');

    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS - 1);
    expect(kho.nhatKy).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(kho.nhatKy).toEqual(['putDraft:tab-cu']);
    expect(kho.banNhap.get('tab-cu').text).toBe('mới');
  });

  it('draft.seq và editing.seq là HAI số đếm độc lập (AD-8)', async () => {
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho({ banDau: banGhiMau() });
    await store.khoiDong();
    await store.khoiDongBanNhap();
    kho.nhatKy.length = 0;

    store.datBanNhap('bản nháp');
    // Gõ vào ô sửa của một mẩu khác KHÔNG được hủy hẹn của bản nháp: dùng chung một số đếm là
    // đúng cách hai mục tiêu tự lưu giết hẹn của nhau.
    store.tuLuuNoiDung('a', 'mẩu đang sửa');
    expect(store.state.draft.seq).toBe(1);
    expect(store.state.editing.seq).toBe(1);

    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(kho.nhatKy.sort()).toEqual(['put:a', 'putDraft:tab-cu']);
    expect(kho.banNhap.get('tab-cu').text).toBe('bản nháp');
  });

  it('ghi hỏng QUOTA → chữ trong draft.text KHÔNG bị hoàn tác, banner QUOTA, không ném', async () => {
    vi.useFakeTimers();
    const { store } = storeVoiKho({ tuChoi: { putDraft: MA_LOI.QUOTA } });
    await store.khoiDongBanNhap();
    store.datBanNhap('phở');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(store.state.draft.text).toBe('phở');
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
  });

  it('quá trần → putDraft KHÔNG được gọi, banner TOO_LONG, nhưng chữ VẪN vào state', async () => {
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho();
    await store.khoiDongBanNhap();
    kho.nhatKy.length = 0;
    const qua = 'x'.repeat(MAX_NOTE_CHARS + 1);
    store.datBanNhap(qua);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(kho.nhatKy).toEqual([]);
    expect(store.state.banner).toBe(MA_LOI.TOO_LONG);
    // Cắt bớt trong im lặng là cách chắc chắn nhất làm mất chữ vừa gõ.
    expect(store.state.draft.text).toBe(qua);
    expect(store.state.draft.seq).toBe(1);
  });

  it('một lần tự lưu bản nháp THÀNH CÔNG tắt dải băng của lần hỏng trước (AD-8)', async () => {
    vi.useFakeTimers();
    const kho = khoGia({});
    let tuChoiLanNay = true;
    const ports = portsDay();
    ports.noteStore = {
      ...kho.cong,
      putDraft(draft) {
        if (tuChoiLanNay) return Promise.reject(loiUngDung(MA_LOI.QUOTA));
        return kho.cong.putDraft(draft);
      },
    };
    ports.sessionStore = phienGia().cong;
    const store = taoStore(ports);

    await store.khoiDongBanNhap();
    store.datBanNhap('hỏng');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(store.state.banner).toBe(MA_LOI.QUOTA);

    tuChoiLanNay = false;
    store.datBanNhap('xong');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(store.state.banner).toBeNull();
  });

  it('chưa khởi động bản nháp thì hẹn không chạm cổng — không có chủ để ghi dưới tên nó', async () => {
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho();
    store.datBanNhap('phở');
    expect(store.state.draft.text).toBe('phở');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(kho.nhatKy).toEqual([]);
  });

  it('trả về đồng bộ và sai kiểu đối số thì ném TypeError nêu tên tham số', () => {
    vi.useFakeTimers();
    const { store } = storeVoiKho();
    expect(store.datBanNhap('x')).toBeUndefined();
    expect(() => store.datBanNhap(7)).toThrow(TypeError);
    expect(() => store.datBanNhap(7)).toThrow(/text/);
    for (const xau of [null, undefined, {}, []]) {
      expect(() => store.datBanNhap(xau)).toThrow(TypeError);
    }
  });
});

describe('nhipTimBanNhap — báo còn sống, KHÔNG đổi state', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ghi bản nháp hiện tại kèm mốc mới, và state giữ nguyên y hệt', async () => {
    vi.useFakeTimers();
    const { store, kho } = storeVoiKho({ ketQuaClaim: { tabId: 'tab-cu', text: 'phở' } });
    await store.khoiDongBanNhap();
    kho.nhatKy.length = 0;
    const truoc = store.state;

    await store.nhipTimBanNhap();
    expect(kho.nhatKy).toEqual(['putDraft:tab-cu']);
    const daGiu = kho.banNhap.get('tab-cu');
    expect(daGiu.text).toBe('phở');
    expect(daGiu.heartbeat).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
    expect(store.state).toBe(truoc);
  });

  it('ghi dưới danh tính MỚI khi tab bị nhân đôi, không phải danh tính cũ', async () => {
    const { store, kho } = storeVoiKho({ ketQuaClaim: { tabId: 'tab-moi', text: '' } });
    await store.khoiDongBanNhap();
    kho.nhatKy.length = 0;
    await store.nhipTimBanNhap();
    expect(kho.nhatKy).toEqual(['putDraft:tab-moi']);
  });

  it('chưa khởi động bản nháp → không chạm cổng, không đổi state', async () => {
    const { store, kho } = storeVoiKho();
    const truoc = store.state;
    await expect(store.nhipTimBanNhap()).resolves.toBeUndefined();
    expect(kho.nhatKy).toEqual([]);
    expect(store.state).toBe(truoc);
  });

  it('ghi hỏng → dải băng, action không ném', async () => {
    const { store } = storeVoiKho({ tuChoi: { putDraft: MA_LOI.DB } });
    await store.khoiDongBanNhap();
    await expect(store.nhipTimBanNhap()).resolves.toBeUndefined();
    expect(store.state.banner).toBe(MA_LOI.DB);
  });

  it('ghi được thì KHÔNG tắt dải băng — nhịp tim không phải hành động của người dùng', async () => {
    // Hẹn của `datBanNhap` phải nổ trong tầm kiểm soát của ca test, không phải 400 ms sau khi
    // nó kết thúc.
    vi.useFakeTimers();
    const { store } = storeVoiKho({ ketQuaClaim: { tabId: 'tab-cu', text: 'phở' } });
    await store.khoiDongBanNhap();
    // Dựng sẵn một dải băng bằng một lần ghi hỏng, rồi nhịp tim GHI ĐƯỢC không được dọn nó.
    store.datBanNhap('x'.repeat(MAX_NOTE_CHARS + 1));
    expect(store.state.banner).toBe(MA_LOI.TOO_LONG);
    store.datBanNhap('vừa đủ');
    await store.nhipTimBanNhap();
    expect(store.state.banner).toBe(MA_LOI.TOO_LONG);
  });

  it('bản nháp đang quá trần thì nhịp tim KHÔNG chạm cổng — trần chặn ở mọi đường xuống kho', async () => {
    // `datBanNhap` từ chối gọi cổng khi quá trần; một nhịp tim vô điều kiện sẽ đưa đúng chữ đó
    // xuống kho mười giây sau, tức trần chỉ chậm lại chứ không tồn tại.
    const { store, kho } = storeVoiKho();
    await store.khoiDongBanNhap();
    store.datBanNhap('x'.repeat(MAX_NOTE_CHARS + 1));
    kho.nhatKy.length = 0;
    await expect(store.nhipTimBanNhap()).resolves.toBeUndefined();
    expect(kho.nhatKy).toEqual([]);
    expect(store.state.banner).toBe(MA_LOI.TOO_LONG);
  });
});

describe('app/main.js — điểm nối duy nhất, chạy được thật', () => {
  it('nối được một khối state dùng ngay: state ở giá trị khởi tạo và action là hàm', () => {
    expect(storeCuaApp.state.dieuKien).toEqual({ keyword: null, date: null });
    expect(typeof storeCuaApp.datDieuKien).toBe('function');
    expect(typeof storeCuaApp.xoaHetDieuKien).toBe('function');
  });

  it('nối ADAPTER THẬT cho kho ghi chú, không phải cổng tạm', async () => {
    // Đảo phép trải trong `congThat()` để cổng tạm thắng adapter thật thì mọi ca khác vẫn
    // xanh — nên phải chạy một action THẬT và nhìn nó hỏng đúng kiểu của adapter thật.
    //
    // Ở Node không có kho dữ liệu nào, nên adapter mở kho lười sẽ hỏng và đi ra bằng dải băng
    // `DB`. Cổng tạm thì NÉM đồng bộ "chưa nối adapter", tức lệnh dưới đây sẽ ném chứ không
    // trả về một lời hứa. Hai kết cục phân biệt được nhau, và đó là điểm của ca này.
    //
    // Ca này đứng CUỐI mục và chạm `banner` — một trường mà các ca hàng xóm không đọc, nên
    // chúng không bị nó làm nhiễu.
    storeCuaApp.datBanNhap('x');
    await expect(storeCuaApp.chotGhiChu()).resolves.toBeUndefined();
    expect(storeCuaApp.state.banner).toBe(MA_LOI.DB);
    expect(storeCuaApp.state.notes).toEqual([]);
  });

  it('tập cổng tạm đủ mọi phương thức để qua kiemTraPorts', () => {
    const ports = congTam();
    expect(kiemTraPorts(ports)).toBe(ports);
  });

  it('mỗi phương thức của cổng tạm NÉM khi bị gọi, nêu đúng cong.phuongThuc', () => {
    // Một stub im lặng trả `undefined` cũng làm suite xanh y như một stub ném, nên phải gọi
    // thật: nếu không, Story 1.6 sẽ đi gỡ lỗi một adapter chưa tồn tại.
    const ports = congTam();
    for (const tenCong of Object.keys(PORT_METHODS)) {
      for (const tenPhuongThuc of PORT_METHODS[tenCong]) {
        expect(() => ports[tenCong][tenPhuongThuc]()).toThrow(
          new RegExp(`${tenCong}\\.${tenPhuongThuc}`),
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Phép gác ưu tiên dải băng, và action đóng (Story 3.1)
//
// Luật ưu tiên của AD-17 là bất biến của ĐƯỜNG GHI, không của đường vẽ: view không giữ state
// riêng nên nó không có gì để so. `test/banner.test.js` nghiệm thu bảng và hàm thuần; ở đây là
// nửa mà chỉ tệp này trả lời được — phép gác nằm trong `datLai`, nên nó đúng cho CẢ 14 chỗ đặt
// `banner` và cho mọi chỗ một epic sau viết thêm.
// ---------------------------------------------------------------------------

/** Store với `banner` đã ở một mã cho trước, đặt qua một action THẬT (không gán vào state). */
function storeVoiBanner(ma) {
  const ports = portsDay();
  const loi = new Error('lỗi thô của trình duyệt');
  loi.code = ma;
  ports.noteStore = { ...ports.noteStore, readAll: () => Promise.reject(loi) };
  const store = taoStore(ports);
  return store.khoiDong().then(() => store);
}

describe('dải băng — phép gác ưu tiên ở tầng ghi', () => {
  it('ưu tiên thấp KHÔNG đè được ưu tiên cao đang hiện, nhưng nhánh khác của cùng lời gọi vẫn vào', async () => {
    const store = await storeVoiBanner(MA_LOI.QUOTA);
    const dai = 'x'.repeat(MAX_NOTE_CHARS + 1);
    // `datBanNhap` quá trần đặt `draft` VÀ `banner: TOO_LONG` trong một `datLai`. Thông báo bị
    // từ chối (ưu tiên 5 < ưu tiên 2), nhưng chữ vừa gõ không bao giờ bị bỏ vì chuyện đó.
    store.datBanNhap(dai);
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
    expect(store.state.draft.text).toBe(dai);
  });

  it('ưu tiên cao THAY được ưu tiên thấp đang hiện — trên CÙNG một store', async () => {
    // MỘT store, hai phép ghi hỏng liên tiếp. Hai store riêng không nghiệm thu được gì: store
    // thứ hai bắt đầu với `banner` rỗng, nên nhánh CHẤP NHẬN của `thayDuoc` không bao giờ chạy
    // — một phép gác "đã có banner thì không gì thay được" vẫn đi qua ca đó mà xanh.
    const ports = portsDay();
    let ma = MA_LOI.TOO_LONG;
    ports.noteStore = { ...ports.noteStore, readAll: () => Promise.reject(loiUngDung(ma)) };
    const store = taoStore(ports);
    await store.khoiDong();
    expect(store.state.banner).toBe(MA_LOI.TOO_LONG);

    ma = MA_LOI.QUOTA;
    await store.khoiDong();
    expect(store.state.banner).toBe(MA_LOI.QUOTA);
  });

  it('cùng mức ưu tiên: cái mới thay cái cũ — hai lần cùng một chuyện thì lần sau là lần đang xảy ra', async () => {
    // `<=` chứ không `<` trong `thayDuoc`, và đây là ca duy nhất phân biệt được hai cách viết
    // đó ở tầng ghi. Hai mã của CÙNG một hàng (hàng 4 của AD-17) nên phép đặt sau phải đi qua,
    // và giá trị đổi là bằng chứng quan sát được — cùng một mã thì không phân biệt nổi.
    const ports = portsDay();
    let ma = MA_LOI.BAD_FILE;
    ports.noteStore = { ...ports.noteStore, readAll: () => Promise.reject(loiUngDung(ma)) };
    const store = taoStore(ports);
    await store.khoiDong();
    expect(store.state.banner).toBe(MA_LOI.BAD_FILE);

    ma = MA_LOI.BAD_VERSION;
    await store.khoiDong();
    expect(store.state.banner).toBe(MA_LOI.BAD_VERSION);
  });

  it('XÓA CHỦ ĐÍCH đi qua phép gác: một phép ghi thành công tắt cả dải băng không đóng được (AD-8)', async () => {
    // Đây là nửa mà phép gác dễ phá nhất: chặn `banner: null` thì `QUOTA` đeo bám mọi thao tác
    // về sau và không có đường nào tắt nó ngoài tải lại trang.
    const ports = portsDay();
    let hong = true;
    ports.sessionStore = {
      ...ports.sessionStore,
      tabIdentity: () => 'tab-nay',
      writeTabIdentity: () => {},
    };
    ports.noteStore = {
      ...ports.noteStore,
      readAll: () => Promise.resolve([]),
      claimDraft: (yeuCau) => Promise.resolve({ tabId: yeuCau.tabId, text: '' }),
      putDraft: () => (hong ? Promise.reject(loiUngDung(MA_LOI.QUOTA)) : Promise.resolve()),
    };
    const store = taoStore(ports);
    await store.khoiDong();
    await store.khoiDongBanNhap();

    vi.useFakeTimers();
    try {
      store.datBanNhap('phở');
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
      await Promise.resolve();
      expect(store.state.banner).toBe(MA_LOI.QUOTA);

      hong = false;
      store.datBanNhap('phở bò');
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
      await Promise.resolve();
      expect(store.state.banner).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('dongDaiBang — đường của nút ✕', () => {
  it('hàng đóng được: banner về rỗng', async () => {
    const store = await storeVoiBanner(MA_LOI.TOO_LONG);
    store.dongDaiBang();
    expect(store.state.banner).toBeNull();
  });

  it('ba hàng đầu KHÔNG đóng được: action không làm gì cả', async () => {
    for (const ma of [MA_LOI.VERSION_SKEW, MA_LOI.QUOTA, MA_LOI.DB]) {
      const store = await storeVoiBanner(ma);
      store.dongDaiBang();
      expect(store.state.banner).toBe(ma);
    }
  });

  it('không có gì đang hiện: không ném, không đổi gì', () => {
    const store = taoStore(portsDay());
    expect(() => store.dongDaiBang()).not.toThrow();
    expect(store.state.banner).toBeNull();
  });

  it('nó là một action của store đã đông lạnh, không một đường đổi state thứ hai', () => {
    const store = taoStore(portsDay());
    expect(typeof store.dongDaiBang).toBe('function');
    expect(Object.isFrozen(store)).toBe(true);
  });
});
