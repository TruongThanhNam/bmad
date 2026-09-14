// Bộ truy vấn (Story 2.4) — phủ toàn bộ I/O & Edge-Case Matrix ở tầng LÕI.
//
// Vì sao ở đây chứ không trong `luoi.test.js`: "khung nhìn mặc định là vắng mặt của điều kiện"
// (AD-15) là một luật về DỮ LIỆU, và nó phải kiểm được mà không cần DOM lẫn đồng hồ. Ca ghim
// quan trọng nhất của file này là ca cuối — đưa hai mốc khác nhau cho cùng một `notes` và đòi
// hai kết quả khác nhau. Không có nó thì "hàm thuần, không đọc đồng hồ" chỉ là một lời hứa,
// và một `nowIso()` lén gọi bên trong `query.js` vẫn làm mọi ca còn lại xanh.

import { describe, expect, it } from 'vitest';
import { fold } from '../app/core/fold.js';
import { locGhiChu } from '../app/core/query.js';

const HOM_NAY = '2026-09-14';
const HOM_QUA = '2026-09-13';
const MOC_HOM_NAY = `${HOM_NAY}T09:30:00+07:00`;

const RONG = { keyword: null, date: null };

/** Một bản ghi đúng năm trường của AD-13, hai trường dẫn xuất tính như `state.js` tính. */
function ban(ngay, gio, text) {
  const createdAt = `${ngay}T${gio}+07:00`;
  return { id: `${ngay}-${gio}`, createdAt, localDate: ngay, text, textFolded: fold(text) };
}

describe('locGhiChu — khung nhìn mặc định là VẮNG MẶT của điều kiện (AD-15)', () => {
  it('giữa 1.200 ghi chú, khối điều kiện rỗng trả về đúng những mẩu của HÔM NAY', () => {
    // Kho thật của Nam sau một năm trông như thế này: vài mẩu hôm nay, một nghìn hai mẩu
    // ngày khác. Một phép lọc bỏ sót ngày, hay lọc theo `createdAt` thay vì `localDate`, chỉ
    // lộ ra ở cỡ này.
    const nen = Array.from({ length: 1196 }, (_, i) =>
      ban('2026-01-05', `0${Math.floor(i / 600)}:00:0${i % 10}`, `cũ ${i}`),
    );
    const homNay = [
      ban(HOM_NAY, '11:00:00', 'phở bò'),
      ban(HOM_NAY, '10:00:00', 'cà phê'),
      ban(HOM_NAY, '09:00:00', 'gọi mẹ'),
      ban(HOM_NAY, '08:00:00', 'đổ xăng'),
    ];
    const notes = [...homNay, ...nen];
    expect(notes).toHaveLength(1200);

    const ra = locGhiChu(notes, RONG, MOC_HOM_NAY);
    expect(ra.map((n) => n.text)).toEqual(['phở bò', 'cà phê', 'gọi mẹ', 'đổ xăng']);
  });

  it('thứ tự ĐẦU VÀO được giữ nguyên — bộ truy vấn lọc, không sắp lại', () => {
    // `sapGiamDan` trong `state.js` đã đặt bất biến thứ tự. Một phép sắp thứ hai ở đây là một
    // đường thứ hai cho cùng một luật, và hai đường sẽ lệch. Nên đưa vào một thứ tự CỐ Ý sai
    // và đòi nó ra y nguyên: bộ truy vấn không được "sửa hộ".
    const notes = [
      ban(HOM_NAY, '08:00:00', 'sớm'),
      ban(HOM_QUA, '23:00:00', 'hôm qua'),
      ban(HOM_NAY, '20:00:00', 'muộn'),
    ];
    expect(locGhiChu(notes, RONG, MOC_HOM_NAY).map((n) => n.text)).toEqual(['sớm', 'muộn']);
  });

  it('hôm nay chưa có gì: mảng RỖNG, không một bản ghi ngày khác nào lọt qua', () => {
    const notes = [ban(HOM_QUA, '23:59:00', 'hôm qua'), ban('2026-09-01', '10:00:00', 'đầu tháng')];
    expect(locGhiChu(notes, RONG, MOC_HOM_NAY)).toEqual([]);
  });

  it('kho rỗng: mảng rỗng, không ném', () => {
    expect(locGhiChu([], RONG, MOC_HOM_NAY)).toEqual([]);
  });
});

describe('locGhiChu — hai nửa của khối điều kiện', () => {
  it('date cụ thể lọc theo ĐÚNG ngày đó, không theo hôm nay', () => {
    const notes = [
      ban(HOM_NAY, '10:00:00', 'của hôm nay'),
      ban('2026-09-01', '10:00:00', 'của mùng một'),
    ];
    const ra = locGhiChu(notes, { keyword: null, date: '2026-09-01' }, MOC_HOM_NAY);
    expect(ra.map((n) => n.text)).toEqual(['của mùng một']);
  });

  it('keyword so trên textFolded — gõ không dấu vẫn ra mẩu có dấu', () => {
    const notes = [ban(HOM_NAY, '11:00:00', 'phở bò'), ban(HOM_NAY, '10:00:00', 'cà phê')];
    const ra = locGhiChu(notes, { keyword: 'pho', date: null }, MOC_HOM_NAY);
    expect(ra.map((n) => n.text)).toEqual(['phở bò']);
  });

  it('keyword CHỒNG lên phép lọc ngày, không thay cho nó', () => {
    // Nửa vỡ trong im lặng: một cài đặt lọc "hoặc ngày hoặc chữ" vẫn ra đúng một mẩu ở ca
    // trên, và ở đây nó sẽ kéo cả mẩu hôm qua có chữ `phở` ra theo.
    const notes = [
      ban(HOM_NAY, '11:00:00', 'phở bò'),
      ban(HOM_NAY, '10:00:00', 'cà phê'),
      ban(HOM_QUA, '11:00:00', 'phở gà'),
    ];
    const ra = locGhiChu(notes, { keyword: 'phở', date: null }, MOC_HOM_NAY);
    expect(ra.map((n) => n.text)).toEqual(['phở bò']);
  });

  it('cả hai nửa cùng có: ngày cụ thể GIAO với chữ', () => {
    const notes = [
      ban('2026-09-01', '11:00:00', 'phở bò'),
      ban('2026-09-01', '10:00:00', 'cà phê'),
      ban(HOM_NAY, '11:00:00', 'phở gà'),
    ];
    const ra = locGhiChu(notes, { keyword: 'pho', date: '2026-09-01' }, MOC_HOM_NAY);
    expect(ra.map((n) => n.text)).toEqual(['phở bò']);
  });

  it('có date thì MỐC HIỆN TẠI không còn ảnh hưởng gì', () => {
    const notes = [ban('2026-09-01', '10:00:00', 'của mùng một')];
    const dieuKien = { keyword: null, date: '2026-09-01' };
    expect(locGhiChu(notes, dieuKien, MOC_HOM_NAY)).toEqual(
      locGhiChu(notes, dieuKien, '2027-03-08T23:59:59-05:00'),
    );
  });
});

describe('locGhiChu KHÔNG đọc đồng hồ — "hôm nay" đi vào qua tham số', () => {
  it('cùng một notes, hai mốc khác nhau → hai kết quả khác nhau', () => {
    const notes = [ban(HOM_NAY, '00:05:00', 'sau nửa đêm'), ban(HOM_QUA, '23:55:00', 'trước đó')];
    expect(locGhiChu(notes, RONG, MOC_HOM_NAY).map((n) => n.text)).toEqual(['sau nửa đêm']);
    // Đúng lượt vẽ lúc `00:05` của ngày mới: mẩu vừa chốt hiện ra, mẩu hôm qua rời KHUNG NHÌN
    // cùng lúc — dữ liệu vẫn nguyên trong `notes`, đó là cái giá đã nhận của "không hẹn giờ
    // nửa đêm".
    expect(locGhiChu(notes, RONG, `${HOM_QUA}T23:55:30+07:00`).map((n) => n.text)).toEqual([
      'trước đó',
    ]);
  });

  it('mốc mang offset khác vẫn lọc theo giờ TẠI CHỖ của mốc, không theo UTC', () => {
    // `localDate` cắt mười ký tự đầu của chuỗi CÓ offset, nên `2026-09-14T00:30:00+07:00` là
    // ngày 14 — dù cùng thời điểm đó ở UTC vẫn là ngày 13. Đây đúng là cái AD-4 sinh ra để
    // chặn, và bộ truy vấn phải thừa hưởng nó chứ không tự cắt lại.
    const notes = [ban(HOM_NAY, '00:30:00', 'nửa đêm về sáng')];
    expect(locGhiChu(notes, RONG, `${HOM_NAY}T00:30:00+07:00`).map((n) => n.text)).toEqual([
      'nửa đêm về sáng',
    ]);
  });
});
