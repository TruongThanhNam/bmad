import { describe, expect, it } from 'vitest';
import { quyetDinhBanNhap } from '../app/core/draft.js';
import { DRAFT_STALE_MS } from '../app/core/limits.js';

// Bốn bước của AD-3, và nửa cứng của FR-20: "tab khác không bao giờ lấy mất bản nháp đang gõ"
// phải là một test chứ không phải một chú thích.
//
// Adapter chỉ còn việc phát các phép ghi/xóa của bản kế hoạch ra trong một giao dịch — phần
// nguyên tử đó thuộc danh sách thử tay của README, vì nghiệm thu nó cần một kho thật. Phần
// QUYẾT ĐỊNH thì thuần, và nó nằm ở đây.

const NGUONG = DRAFT_STALE_MS;
const BAY_GIO = '2026-09-11T10:00:00+07:00';

/** Một mốc cách `BAY_GIO` đúng ngần này mili giây về trước. */
function truocDay(ms) {
  const moc = new Date(new Date(BAY_GIO).getTime() - ms);
  return moc.toISOString().replace('Z', '+00:00');
}

function ban(tabId, text, cachDay) {
  return { tabId, text, heartbeat: truocDay(cachDay) };
}

function quyetDinh(danhSach, tabId) {
  return quyetDinhBanNhap(danhSach, tabId, BAY_GIO, NGUONG);
}

describe('quyetDinhBanNhap — bước 1: tab bị nhân đôi thì sinh danh tính mới', () => {
  it('bản mang đúng danh tính này mà nhịp tim CÒN MỚI → danh tính khác và chữ rỗng', () => {
    const keHoach = quyetDinh([ban('A', 'phở', NGUONG / 2)], 'A');
    expect(keHoach.tabId).not.toBe('A');
    expect(typeof keHoach.tabId).toBe('string');
    expect(keHoach.text).toBe('');
  });

  it('bản của tab kia GIỮ NGUYÊN — không ghi, không xóa', () => {
    const keHoach = quyetDinh([ban('A', 'phở', NGUONG / 2)], 'A');
    expect(keHoach.ghi).toBeNull();
    expect(keHoach.xoa).toEqual([]);
  });

  it('hai lần gọi cho hai danh tính KHÁC nhau — không phải một giá trị cố định', () => {
    const mot = quyetDinh([ban('A', 'phở', NGUONG / 2)], 'A');
    const hai = quyetDinh([ban('A', 'phở', NGUONG / 2)], 'A');
    expect(mot.tabId).not.toBe(hai.tabId);
  });
});

describe('quyetDinhBanNhap — bước 2: bản của chính mình, nhịp tim đã im', () => {
  it('dùng lại chữ của mình, không ghi lại và không xóa gì', () => {
    const keHoach = quyetDinh([ban('A', 'phở', NGUONG * 2)], 'A');
    expect(keHoach).toEqual({ tabId: 'A', text: 'phở', ghi: null, xoa: [] });
  });

  it('không bao giờ nhận bản của ai khác khi đã có bản của mình', () => {
    const keHoach = quyetDinh(
      [ban('A', 'của mình', NGUONG * 2), ban('B', 'của người', NGUONG * 9)],
      'A',
    );
    expect(keHoach.text).toBe('của mình');
    expect(keHoach.xoa).toEqual([]);
  });

  it('đúng một phép so phân biệt bước 1 với bước 2, ngay ở hai bên ngưỡng', () => {
    // Ngay dưới ngưỡng: còn sống → bước 1. Ngay trên ngưỡng: đã im → bước 2.
    expect(quyetDinh([ban('A', 'phở', NGUONG - 1)], 'A').tabId).not.toBe('A');
    expect(quyetDinh([ban('A', 'phở', NGUONG + 1)], 'A').text).toBe('phở');
  });
});

describe('quyetDinhBanNhap — bước 3: nhận bản bỏ rơi, nhiều nhất một', () => {
  it('hai bản bỏ rơi của tab khác → nhận đúng MỘT, bản có nhịp tim CŨ NHẤT', () => {
    const keHoach = quyetDinh(
      [ban('B', 'mới hơn', NGUONG * 2), ban('C', 'cũ nhất', NGUONG * 5)],
      'A',
    );
    expect(keHoach.text).toBe('cũ nhất');
    expect(keHoach.tabId).toBe('A');
    // Ghi lại dưới danh tính của mình, và xóa bản cũ — cùng một bản kế hoạch, cùng một giao dịch.
    expect(keHoach.ghi).toEqual({ tabId: 'A', text: 'cũ nhất', heartbeat: BAY_GIO });
    expect(keHoach.xoa).toEqual(['C']);
    // Bản kia còn nguyên: nhận nhiều nhất một.
    expect(keHoach.xoa).not.toContain('B');
  });

  it('FR-20 — bản bỏ lại CÒN NHỊP TIM thì KHÔNG bị nhận và còn nguyên trong kho', () => {
    // Đây là ca mà nửa cứng của FR-20 đứng hay đổ: bỏ phép so ngưỡng đi thì nó đỏ.
    const keHoach = quyetDinh([ban('B', 'đang gõ dở', NGUONG / 2)], 'A');
    expect(keHoach.text).toBe('');
    expect(keHoach.ghi).toBeNull();
    expect(keHoach.xoa).toEqual([]);
  });

  it('kho rỗng → chữ rỗng, không ghi, không xóa', () => {
    expect(quyetDinh([], 'A')).toEqual({ tabId: 'A', text: '', ghi: null, xoa: [] });
  });

  it('nhịp tim ở TƯƠNG LAI cũng là CŨ NHẤT — không thì bản đó sống vĩnh viễn', () => {
    // Đồng hồ máy bị chỉnh lùi để lại một mốc tương lai, và tuổi âm thì luôn dưới mọi ngưỡng:
    // bản nháp đó sẽ không bao giờ nhận lại được.
    const keHoach = quyetDinh([ban('B', 'từ tương lai', -NGUONG * 9)], 'A');
    expect(keHoach.text).toBe('từ tương lai');
    expect(keHoach.xoa).toEqual(['B']);
  });

  it('nhịp tim rác bị coi là CŨ NHẤT, không làm cả phép quyết định ném', () => {
    // Một bản do phiên bản cũ để lại sẽ chiếm chỗ vĩnh viễn nếu "không đọc nổi mốc" nghĩa là
    // "còn sống".
    const keHoach = quyetDinh(
      [{ tabId: 'B', text: 'rác mốc', heartbeat: 'hôm qua' }, ban('C', 'có mốc', NGUONG * 2)],
      'A',
    );
    expect(keHoach.text).toBe('rác mốc');
    expect(keHoach.xoa).toEqual(['B']);
  });
});

describe('quyetDinhBanNhap — bước 4: dọn mọi bản rỗng', () => {
  it('bản có text rỗng bị xóa, bản có chữ không bị đụng', () => {
    const keHoach = quyetDinh([ban('Z', '', NGUONG * 2), ban('B', 'giữ lại', NGUONG / 2)], 'A');
    expect(keHoach.xoa).toEqual(['Z']);
  });

  it('bản vừa nhận ở bước 3 KHÔNG bị bước 4 xóa mất, và không khóa nào vào danh sách hai lần', () => {
    const keHoach = quyetDinh([ban('C', 'nhận đi', NGUONG * 5), ban('Z', '', NGUONG * 5)], 'A');
    expect(keHoach.ghi).toEqual({ tabId: 'A', text: 'nhận đi', heartbeat: BAY_GIO });
    expect(keHoach.xoa).toEqual(['C', 'Z']);
    expect(new Set(keHoach.xoa).size).toBe(keHoach.xoa.length);
    expect(keHoach.xoa).not.toContain('A');
  });

  it('bản rỗng của CHÍNH MÌNH cũng bị dọn, và chữ trả về là rỗng', () => {
    const keHoach = quyetDinh([ban('A', '', NGUONG * 2)], 'A');
    expect(keHoach.text).toBe('');
    expect(keHoach.xoa).toEqual(['A']);
  });
});

describe('quyetDinhBanNhap — hai tab khởi động cùng lúc', () => {
  it('tab thứ hai thấy bản đã biến mất nên nó nhận chữ rỗng', () => {
    // Giao dịch của tab thứ nhất đã chốt: bản `C` không còn trong danh sách mà tab thứ hai đọc.
    const boRoi = ban('C', 'chỉ một tab nhận được', NGUONG * 5);
    const mot = quyetDinh([boRoi], 'A');
    expect(mot.text).toBe('chỉ một tab nhận được');
    const hai = quyetDinh([{ tabId: 'A', text: mot.text, heartbeat: BAY_GIO }], 'B');
    expect(hai.text).toBe('');
    expect(hai.ghi).toBeNull();
  });
});
