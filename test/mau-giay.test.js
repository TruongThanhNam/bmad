// Mẩu giấy (Story 2.5) — phần nghiệm thu được mà không cần trình duyệt.
//
// Chia việc như `luoi.test.js` chia: chiều cao ĐÃ TÍNH ("mọi mẩu thu gọn cùng chiều cao trần",
// "mở rộng đẩy hàng dưới xuống") là câu hỏi cho một layout engine, và nó sống ở
// `npm run thu-bo-cuc`. Ở đây là những thứ khác, và cả chúng đều vỡ trong im lặng:
//
//   (1) Mẩu nào bị cắt, mẩu nào không — và `N` của dòng `còn N dòng ▾` có đúng không.
//   (2) Click mẩu NGẮN không đổi gì cả: không bộ nghe, không `tabindex`, không dòng gấp.
//   (3) Chữ của Nam không bao giờ thành markup, và giờ tạo đi qua `core/time.js`.
//   (4) Hằng đếm dòng của JS và token trần chiều cao của CSS không trôi khỏi nhau.
//
// Không dùng jsdom: `veMau` nhận `ownerDocument` qua THAM SỐ, nên một gốc DOM tối giản là đủ.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLLAPSED_LINES } from '../app/core/limits.js';
import { soDong, veMau } from '../app/view/mau-giay.js';
import { boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const CREATED_AT = '2026-09-14T09:05:00+07:00';

// ---------------------------------------------------------------------------
// Gốc DOM tối giản
// ---------------------------------------------------------------------------

function phanTuGia() {
  return {
    textContent: '',
    className: '',
    type: '',
    con: [],
    thuocTinh: {},
    boNghe: {},
    cha: null,
    append(...moi) {
      for (const con of moi) con.cha = this;
      this.con.push(...moi);
    },
    setAttribute(ten, giaTri) {
      this.thuocTinh[ten] = giaTri;
    },
    addEventListener(ten, ham) {
      this.boNghe[ten] = ham;
    },
  };
}

const docGia = { createElement: () => phanTuGia() };

/**
 * Phát một sự kiện NỔI BỌT từ `phanTu` lên tới gốc, dừng khi ai đó gọi `stopPropagation`.
 *
 * Phải mô phỏng đúng nửa nổi bọt, không chỉ gọi thẳng handler của một phần tử: cửa chặn thật ở
 * đây là "click vào nút xóa KHÔNG chạy tiếp lên thẻ mẩu", và một phép gọi thẳng thì không bao
 * giờ thấy được sự khác nhau giữa có và không có `stopPropagation`.
 */
function phat(phanTu, ten, them = {}) {
  const suKien = { ...them, daChanNoiBot: false, daChanMacDinh: false };
  suKien.stopPropagation = () => {
    suKien.daChanNoiBot = true;
  };
  suKien.preventDefault = () => {
    suKien.daChanMacDinh = true;
  };
  for (let nut = phanTu; nut !== null && !suKien.daChanNoiBot; nut = nut.cha) {
    nut.boNghe[ten]?.(suKien);
  }
  return suKien;
}

/** Con cháu mang đúng một class, hoặc `null`. */
function theoLop(phanTu, lop) {
  if (phanTu.className.split(' ').includes(lop)) return phanTu;
  for (const con of phanTu.con) {
    const thay = theoLop(con, lop);
    if (thay !== null) return thay;
  }
  return null;
}

function ban(text, createdAt = CREATED_AT) {
  return { id: `id-${text.length}`, createdAt, localDate: createdAt.slice(0, 10), text };
}

/** Nội dung `n` dòng logic, mỗi dòng ngắn — số dòng HIỂN THỊ không dính vào phép đếm. */
function nDong(n) {
  return Array.from({ length: n }, (_, i) => `dòng ${i}`).join('\n');
}

const NGAN = nDong(COLLAPSED_LINES);
const DAI = nDong(COLLAPSED_LINES + 4);

// ---------------------------------------------------------------------------
// Hình dạng
// ---------------------------------------------------------------------------

describe('veMau — hình dạng một mẩu giấy', () => {
  it('mẩu ngắn: nền giấy, HH:mm, nút xóa, toàn văn — và KHÔNG dòng gấp', () => {
    const mau = veMau(ban(NGAN), docGia, false, () => {});
    // Class của ô lưới ở lại nguyên tên: `luoi.js` vẫn thay danh sách con bằng đúng nó.
    expect(mau.className).toBe('o-luoi');
    expect(theoLop(mau, 'mau-gio').textContent).toBe('09:05');
    expect(theoLop(mau, 'mau-xoa').textContent).toBe('xóa');
    expect(theoLop(mau, 'mau-than').textContent).toBe(NGAN);
    expect(theoLop(mau, 'mau-gap')).toBeNull();
  });

  it('mẩu dài: dòng `còn N dòng ▾` với N là số dòng LOGIC còn lại', () => {
    const mau = veMau(ban(DAI), docGia, false, () => {});
    expect(theoLop(mau, 'mau-gap').textContent).toBe(`còn 4 dòng ▾`);
    // Toàn văn vẫn nằm trong DOM: phép cắt là một cái trần CSS, không phải một phép cắt chuỗi.
    // Cắt chuỗi ở đây thì lần mở rộng sau đó sẽ phải đi hỏi lại kho.
    expect(theoLop(mau, 'mau-than').textContent).toBe(DAI);
  });

  it('đúng ở BIÊN: bằng ngưỡng thì không cắt, hơn một dòng thì `còn 1 dòng ▾`', () => {
    // Biên là chỗ một phép so `>=` viết nhầm thành `>` đi qua mọi ca khác mà không ai thấy.
    expect(theoLop(veMau(ban(nDong(COLLAPSED_LINES)), docGia, false, () => {}), 'mau-gap')).toBeNull();
    expect(
      theoLop(veMau(ban(nDong(COLLAPSED_LINES + 1)), docGia, false, () => {}), 'mau-gap').textContent,
    ).toBe('còn 1 dòng ▾');
  });

  it('mẩu đang mở rộng: dòng đổi thành `thu lại ▴` và thân gỡ trần chiều cao', () => {
    const mau = veMau(ban(DAI), docGia, true, () => {});
    expect(theoLop(mau, 'mau-gap').textContent).toBe('thu lại ▴');
    expect(theoLop(mau, 'mau-than').className.split(' ')).toContain('mau-than-mo');
  });

  it('mẩu thu gọn: thân KHÔNG mang cờ mở rộng', () => {
    const mau = veMau(ban(DAI), docGia, false, () => {});
    expect(theoLop(mau, 'mau-than').className.split(' ')).not.toContain('mau-than-mo');
  });

  it('chữ nhiều dòng giữ NGUYÊN, và thẻ HTML hiện ra nguyên văn như chữ', () => {
    // `textContent` chứ không `innerHTML`: một ghi chú chứa `<b>` phải là CHỮ, không bao giờ
    // là một phần tử.
    const nhieuDong = 'phở bò\n\nthêm hành\n';
    expect(theoLop(veMau(ban(nhieuDong), docGia, false, () => {}), 'mau-than').textContent).toBe(
      nhieuDong,
    );
    const the = '<b>x</b>';
    expect(theoLop(veMau(ban(the), docGia, false, () => {}), 'mau-than').textContent).toBe(the);
  });

  it('dòng trống vẫn là một dòng logic — `a\\n\\nb` đếm là ba', () => {
    expect(soDong('a\n\nb')).toBe(3);
    expect(soDong('')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Hành vi mở rộng
// ---------------------------------------------------------------------------

describe('veMau — nhịp click mở rộng', () => {
  it('mẩu bị cắt vào thứ tự Tab và nghe click', () => {
    let dem = 0;
    const mau = veMau(ban(DAI), docGia, false, () => {
      dem += 1;
    });
    expect(mau.thuocTinh.tabindex).toBe('0');
    expect(typeof mau.boNghe.click).toBe('function');
    mau.boNghe.click();
    expect(dem).toBe(1);
  });

  it('mẩu KHÔNG bị cắt: không tabindex, không bộ nghe — click không đổi gì cả', () => {
    // Đây là nửa mà "gắn handler cho mọi mẩu rồi kiểm bên trong" làm sai trong im lặng: mẩu
    // ngắn sẽ nhận focus khi bấm chuột, và thứ tự Tab dài thêm bằng số mẩu KHÔNG có hành vi.
    const goiLai = () => {
      throw new Error('mẩu ngắn không được gọi lại handler');
    };
    const mau = veMau(ban(NGAN), docGia, false, goiLai);
    expect(mau.thuocTinh.tabindex).toBeUndefined();
    expect(mau.boNghe.click).toBeUndefined();
    expect(mau.boNghe.keydown).toBeUndefined();
  });

  it('mẩu bị cắt mở được bằng BÀN PHÍM: Enter và phím cách, và phím cách không cuộn trang', () => {
    // Mẩu đã vào thứ tự Tab thì nó phải mở được bằng bàn phím — một điểm dừng Tab chỉ mở được
    // bằng chuột là một điểm dừng dẫn tới không đâu.
    for (const phim of ['Enter', ' ']) {
      let dem = 0;
      const mau = veMau(ban(DAI), docGia, false, () => {
        dem += 1;
      });
      const suKien = phat(mau, 'keydown', { key: phim });
      expect(dem).toBe(1);
      expect(suKien.daChanMacDinh).toBe(true);
    }
  });

  it('phím khác KHÔNG mở mẩu, và không chặn hành vi mặc định của nó', () => {
    // `Tab` phải đi tiếp, `a` phải là `a`: chặn bừa ở đây là khóa bàn phím lại trong lưới.
    let dem = 0;
    const mau = veMau(ban(DAI), docGia, false, () => {
      dem += 1;
    });
    for (const phim of ['Tab', 'a', 'ArrowDown', 'Escape']) {
      const suKien = phat(mau, 'keydown', { key: phim });
      expect(suKien.daChanMacDinh).toBe(false);
    }
    expect(dem).toBe(0);
  });

  it('click vào nút xóa KHÔNG mở/thu mẩu — nó chặn nổi bọt ngay tại chính nó', () => {
    // Nút xóa chưa có hành vi ở story này (Epic 5), nhưng "chưa có hành vi" phải đúng cả từ
    // phía người dùng: một cú bấm `xóa` làm mẩu bung ra là một hiệu ứng quan sát được, và là
    // hiệu ứng không ai chờ đợi từ một nút xóa.
    let dem = 0;
    const mau = veMau(ban(DAI), docGia, false, () => {
      dem += 1;
    });
    const suKien = phat(theoLop(mau, 'mau-xoa'), 'click');
    expect(dem).toBe(0);
    expect(suKien.daChanNoiBot).toBe(true);
    // Và click vào chỗ khác của mẩu thì VẪN mở — phép chặn hẹp đúng bằng cái nút.
    expect(phat(theoLop(mau, 'mau-than'), 'click').daChanNoiBot).toBe(false);
    expect(dem).toBe(1);
  });

  it('nút xóa tồn tại về mặt HÌNH DẠNG: là <button> và ở ngoài thứ tự Tab', () => {
    // Hộp thoại xác nhận và phép xóa thật là Epic 5. Một nút chưa có hành vi mà vẫn chiếm một
    // điểm dừng bàn phím là một điểm dừng dẫn tới không đâu, nhân với số mẩu trên lưới.
    const xoa = theoLop(veMau(ban(NGAN), docGia, false, () => {}), 'mau-xoa');
    expect(xoa.type).toBe('button');
    expect(xoa.thuocTinh.tabindex).toBe('-1');
  });
});

// ---------------------------------------------------------------------------
// Giờ tạo — dẫn xuất, không tự cắt
// ---------------------------------------------------------------------------

describe('veMau — giờ tạo', () => {
  it('nửa đêm, đúng trưa và một offset khác đều ra HH:mm của giờ TẠI CHỖ', () => {
    const gio = (createdAt) =>
      theoLop(veMau(ban('x', createdAt), docGia, false, () => {}), 'mau-gio').textContent;
    expect(gio('2026-09-14T00:00:00+07:00')).toBe('00:00');
    expect(gio('2026-09-14T12:00:00+07:00')).toBe('12:00');
    // Offset khác KHÔNG đổi giờ hiển thị: `localTime` đọc giờ tại chỗ lúc tạo, không quy về UTC.
    expect(gio('2026-09-14T23:59:59-03:00')).toBe('23:59');
    expect(gio('2026-09-14T07:08:09Z')).toBe('07:08');
  });

  it('createdAt hỏng thì NÉM TypeError — sập ồn ào, không cắt im lặng', () => {
    for (const xau of [undefined, '', '14/09/2026', '2026-09-14T09:05:00', '2026-02-30T09:05:00Z']) {
      expect(() => veMau({ id: 'x', createdAt: xau, text: 'x' }, docGia, false, () => {})).toThrow(
        TypeError,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Cửa chặn tầng view — mỗi view mới mang cửa chặn của chính nó
// ---------------------------------------------------------------------------

describe('app/view/mau-giay.js — luật của tầng view, cưỡng chế được', () => {
  const nguon = boChuThichJs(readFileSync(join(repoRoot, 'app', 'view', 'mau-giay.js'), 'utf8'));

  it('không chạm store, không adapter, không cổng, không document toàn cục', () => {
    expect(nguon).not.toMatch(/\bstore\b/);
    expect(nguon).not.toMatch(/adapters\//);
    expect(nguon).not.toMatch(/\bports\b/);
    // `ownerDocument` đi vào qua tham số; một `document.` trần là một global.
    expect(nguon).not.toMatch(/(?<![\w$.])document\s*\./);
  });

  it('không new Date — giờ tạo đi qua core/time.js (AD-4)', () => {
    expect(nguon).not.toMatch(/new\s+Date\b|Date\s*\.\s*(now|parse|UTC)\b/);
    expect(nguon).toMatch(/localTime\s*\(/);
  });

  it('không số literal nào — ngưỡng cắt sống ở app/core/limits.js (AD-14)', () => {
    const so = [...nguon.matchAll(/(?<![\w$.])\d[\d_]*(?:\.\d+)?/g)]
      .map((k) => k[0])
      .filter((s) => s !== '0' && s !== '1');
    expect(so).toEqual([]);
    expect(nguon).toMatch(/COLLAPSED_LINES/);
  });

  it('nội dung đặt bằng textContent, không bao giờ innerHTML', () => {
    expect(nguon).toMatch(/\.textContent\s*=/);
    expect(nguon).not.toMatch(/innerHTML|insertAdjacentHTML|outerHTML/);
  });

  it('không dải băng, không aria-live, không role="list" — Epic 3 và epic dải băng', () => {
    expect(nguon).not.toMatch(/aria-live|role\s*=|setAttribute\(\s*['"]role/i);
  });
});

// ---------------------------------------------------------------------------
// Ngưỡng thu gọn sống ở HAI nơi, có chủ ý — và chúng không được trôi khỏi nhau
// ---------------------------------------------------------------------------

describe('COLLAPSED_LINES của JS và token trần chiều cao của CSS', () => {
  it('--note-collapsed-lines bằng đúng COLLAPSED_LINES', () => {
    // Không có cách nào cho CSS đọc một hằng JS mà không dựng một đường ghi style từ view —
    // thứ luật tầng view cấm. Nên hai nơi, và ca này là người canh: một bên đổi mà bên kia
    // không, thì dòng `còn N dòng ▾` sẽ nói một con số mà con mắt thấy một con số khác.
    const css = readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8');
    const khop = /--note-collapsed-lines\s*:\s*([\d.]+)\s*;/.exec(css);
    expect(khop).not.toBeNull();
    expect(Number(khop[1])).toBe(COLLAPSED_LINES);
  });

  it('trần chiều cao của .mau-than dựng từ đúng hai token đó, kèm overflow: hidden', () => {
    const css = readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8');
    const khoi = /\.mau-than\s*\{([^}]*)\}/.exec(css);
    expect(khoi).not.toBeNull();
    expect(khoi[1]).toMatch(
      /max-(block-size|height)\s*:\s*calc\(\s*var\(--note-collapsed-lines\)\s*\*\s*var\(--note-line-h\)\s*\)/,
    );
    // Thiếu `overflow: hidden` thì trần không cắt gì cả — nội dung tràn ra ngoài hộp và mọi
    // mẩu lại cao khác nhau, đúng thứ "hàng luôn đều" cấm.
    expect(khoi[1]).toMatch(/overflow\s*:\s*hidden/);
  });

  it('--note-line-h bằng đúng phần line-height của --font-note', () => {
    // Hai token này CÓ ràng buộc với nhau dù CSS không nói ra: trần cắt bằng `n × --note-line-h`
    // chỉ rơi đúng ranh giới dòng khi `--note-line-h` là chiều cao dòng THẬT của vai chữ đang
    // dùng. Đổi `--font-note` sang `/1.4` mà quên token này thì mẩu cắt lệch giữa một dòng, và
    // không phép đo nào khác thấy — kể cả bộ đo Chromium, vì "mọi mẩu cao bằng nhau" vẫn đúng.
    const css = readFileSync(join(repoRoot, 'app', 'style.css'), 'utf8');
    const fontNote = /--font-note\s*:\s*[^;]*?\d[\d.]*px\/([\d.]+)/.exec(css);
    expect(fontNote).not.toBeNull();
    const lineH = /--note-line-h\s*:\s*([\d.]+)em\s*;/.exec(css);
    expect(lineH).not.toBeNull();
    expect(Number(lineH[1])).toBe(Number(fontNote[1]));
  });
});
