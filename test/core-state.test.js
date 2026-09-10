import { describe, expect, it } from 'vitest';
import { taoStore } from '../app/core/state.js';
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

const KHOA_STATE = [
  'notes',
  'draft',
  'dieuKien',
  'expandedId',
  'editing',
  'banner',
  'readOnly',
].sort();

describe('taoStore — khởi tạo', () => {
  it('state mới có notes rỗng, điều kiện vắng mặt, và các trường tầng C ở giá trị rỗng', () => {
    const store = taoStore(portsDay());
    expect(store.state).toEqual({
      notes: [],
      draft: { text: '', seq: 0 },
      dieuKien: { keyword: null, date: null },
      expandedId: null,
      editing: { id: null, text: '', seq: 0 },
      banner: null,
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

describe('app/main.js — điểm nối duy nhất, chạy được thật', () => {
  it('nối được một khối state dùng ngay: state ở giá trị khởi tạo và action là hàm', () => {
    expect(storeCuaApp.state.dieuKien).toEqual({ keyword: null, date: null });
    expect(typeof storeCuaApp.datDieuKien).toBe('function');
    expect(typeof storeCuaApp.xoaHetDieuKien).toBe('function');
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
