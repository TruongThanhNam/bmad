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
import { caoTheoNoiDungSua, soDong, veMau } from '../app/view/mau-giay.js';
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
    // Ba thành viên của Story 5.1: ô sửa nhận chữ qua `value`, và `caoTheoNoiDungSua` ghi
    // `style.blockSize` sau khi đọc ba phép đo hình học (đều `0` ở gốc DOM giả — chiều cao
    // THẬT là câu hỏi cho `npm run thu-bo-cuc`).
    value: '',
    style: {},
    scrollHeight: 0,
    offsetHeight: 0,
    clientHeight: 0,
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

/** Một node CHỮ tối giản. Hằng `TEXT_NODE` sống trên chính node trong DOM thật, và
 *  `viTriConTroTuDiem` đọc nó ở đó — nên node giả phải mang cả hai, không chỉ `nodeType`. */
const KIEU_NODE_CHU = 3;
const KIEU_NODE_PHAN_TU = 1;
function nodeChu() {
  return { nodeType: KIEU_NODE_CHU, TEXT_NODE: KIEU_NODE_CHU };
}
function nodePhanTu() {
  return { nodeType: KIEU_NODE_PHAN_TU, TEXT_NODE: KIEU_NODE_CHU };
}

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

  it('mẩu KHÔNG bị cắt VẪN vào thứ tự Tab và VẪN nghe click — Story 5.1 đảo chiều ca này', () => {
    // Ca này từng ghim điều NGƯỢC LẠI ("click mẩu ngắn không đổi gì cả: không bộ nghe, không
    // `tabindex`"), và nó ghim đúng trạng thái lúc đó chứ không ghim một bất biến: mẩu ngắn
    // THẬT SỰ không có hành vi nào cho tới Story 5.1. Nay click nó vào chế độ sửa, nên nó có
    // một hành vi — và một hành vi chỉ mở được bằng chuột là một hành vi không tồn tại với bàn
    // phím. Vế ở lại nguyên: mẩu ngắn KHÔNG có dòng gấp (`còn N dòng ▾` của một mẩu không bị
    // cắt là một con số bằng không).
    let dem = 0;
    const mau = veMau(ban(NGAN), docGia, false, () => {
      dem += 1;
    });
    expect(mau.thuocTinh.tabindex).toBe('0');
    expect(typeof mau.boNghe.click).toBe('function');
    expect(typeof mau.boNghe.keydown).toBe('function');
    expect(theoLop(mau, 'mau-gap')).toBeNull();
    mau.boNghe.click();
    expect(dem).toBe(1);
  });

  it('nhịp click mang VỊ TRÍ CON TRỎ suy từ điểm bấm — bàn phím thì `null`', () => {
    // `caretPositionFromPoint` không kiểm được bằng mắt ở đây (không layout engine), nhưng
    // ĐƯỜNG NỐI thì kiểm được: nó phải được hỏi, và kết quả phải đi xuống chỗ gọi nguyên vẹn.
    const nhan = [];
    const than = nodeChu();
    const doc = {
      createElement: () => phanTuGia(),
      caretPositionFromPoint: () => ({ offsetNode: than, offset: 7 }),
    };
    const mau = veMau(ban(NGAN), doc, false, (viTri) => nhan.push(viTri));
    // Node dưới điểm bấm nằm TRONG thân mẩu: `offset` đi qua.
    theoLop(mau, 'mau-than').contains = (nut) => nut === than;
    phat(mau, 'click', { clientX: 10, clientY: 20 });
    expect(nhan).toEqual([7]);
    // Bàn phím không có điểm bấm — `null`, và chỗ gọi lấy đường lui là cuối chữ.
    phat(mau, 'keydown', { key: 'Enter' });
    expect(nhan).toEqual([7, null]);
  });

  it('node dưới điểm bấm NGOÀI thân mẩu thì bỏ offset — bấm vào dòng giờ không nhảy con trỏ', () => {
    // Bộ nghe `click` nằm trên cả phần tử mẩu, nên một cú bấm vào `09:05` cho một `offset` tính
    // trong chuỗi năm ký tự đó — rồi `offset` ấy được áp vào TOÀN VĂN ghi chú. Con trỏ nhảy sai
    // chỗ, và không ai giải thích được tại sao.
    const nhan = [];
    const gio = nodeChu();
    const doc = {
      createElement: () => phanTuGia(),
      caretPositionFromPoint: () => ({ offsetNode: gio, offset: 3 }),
    };
    const mau = veMau(ban(NGAN), doc, false, (viTri) => nhan.push(viTri));
    theoLop(mau, 'mau-than').contains = () => false;
    phat(mau, 'click', { clientX: 10, clientY: 20 });
    expect(nhan).toEqual([null]);
  });

  it('node dưới điểm bấm là một PHẦN TỬ thì bỏ offset — đó là chỉ số con, không phải vị trí ký tự', () => {
    // Cả hai API trả `offset` theo chính node chúng trả về. Rơi vào khoảng đệm của thân mẩu hay
    // vào khoảng trống sau dòng cuối thì node đó là một PHẦN TỬ, và `offset` là CHỈ SỐ CON —
    // một con số bé tí (0 hay 1) mà đọc thành vị trí ký tự sẽ ném con trỏ về đầu ghi chú.
    const nhan = [];
    const nut = nodePhanTu();
    const doc = {
      createElement: () => phanTuGia(),
      caretPositionFromPoint: () => ({ offsetNode: nut, offset: 1 }),
    };
    const mau = veMau(ban(NGAN), doc, false, (viTri) => nhan.push(viTri));
    // Nó NẰM TRONG thân mẩu — phép kiểm `contains` một mình đi qua, nên ca này là người canh
    // duy nhất của nửa còn lại.
    theoLop(mau, 'mau-than').contains = () => true;
    phat(mau, 'click', { clientX: 10, clientY: 20 });
    expect(nhan).toEqual([null]);
  });

  it('không API nào của trình duyệt trả lời được thì về `null`, không ném', () => {
    const nhan = [];
    const mau = veMau(ban(NGAN), docGia, false, (viTri) => nhan.push(viTri));
    expect(() => phat(mau, 'click', { clientX: 1, clientY: 1 })).not.toThrow();
    expect(nhan).toEqual([null]);
    // Và `caretRangeFromPoint` (WebKit, Chromium cũ) là đường thứ hai cho cùng câu hỏi.
    const than = nodeChu();
    const doc = {
      createElement: () => phanTuGia(),
      caretRangeFromPoint: () => ({ startContainer: than, startOffset: 4 }),
    };
    const mau2 = veMau(ban(NGAN), doc, false, (viTri) => nhan.push(viTri));
    theoLop(mau2, 'mau-than').contains = (nut) => nut === than;
    phat(mau2, 'click', { clientX: 1, clientY: 1 });
    expect(nhan).toEqual([null, 4]);
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
// Chế độ sửa tại chỗ (Story 5.1)
// ---------------------------------------------------------------------------

describe('veMau — chế độ sửa tại chỗ', () => {
  /** Móc sửa giả, cùng hình dạng mà `luoi.js` truyền xuống. */
  function mocSua(text) {
    const nhatKy = [];
    return {
      nhatKy,
      sua: {
        text,
        go: (moi) => nhatKy.push(`go:${moi}`),
        roi: () => nhatKy.push('roi'),
      },
    };
  }

  it('thân mẩu THAY bằng <textarea class="mau-sua" data-sua=id>, chữ vào qua value', () => {
    const { sua } = mocSua('chữ đang gõ');
    const mau = veMau(ban(NGAN), docGia, false, () => {}, sua);
    const o = theoLop(mau, 'mau-sua');
    expect(o).not.toBeNull();
    // `value`, KHÔNG `textContent`: với một `<textarea>` thì `textContent` chỉ đặt nội dung mặc
    // định — ô sẽ mở ra rỗng dưới tay Nam.
    expect(o.value).toBe('chữ đang gõ');
    expect(o.textContent).toBe('');
    // `id` đọc được TỪ DOM: `luoi.js` gác lượt vẽ bằng nó, và `main.js` tìm ô sửa bằng nó.
    expect(o.thuocTinh['data-sua']).toBe(ban(NGAN).id);
    // Một `<textarea>` không nhãn là một ô không tên với trình đọc màn hình.
    expect(o.thuocTinh['aria-label']).toBe('nội dung ghi chú');
    // MỘT trong hai, không bao giờ cả hai — ô sửa THAY thân mẩu.
    expect(theoLop(mau, 'mau-than')).toBeNull();
  });

  it('chữ trong ô sửa đến từ móc, KHÔNG từ note.text — notes chưa đổi cho tới khi put xong', () => {
    const { sua } = mocSua('chữ mới nhất');
    const o = theoLop(veMau(ban('chữ cũ trong kho'), docGia, false, () => {}, sua), 'mau-sua');
    expect(o.value).toBe('chữ mới nhất');
  });

  it('mỗi phím gọi ĐÚNG một lần `go`, và không gì khác — không timer, không seq trong view', () => {
    const { nhatKy, sua } = mocSua('a');
    const o = theoLop(veMau(ban(NGAN), docGia, false, () => {}, sua), 'mau-sua');
    o.value = 'ab';
    o.boNghe.input();
    o.value = 'abc';
    o.boNghe.input();
    expect(nhatKy).toEqual(['go:ab', 'go:abc']);
  });

  it('mỗi phím ĐO LẠI chiều cao ô — không thì `overflow: hidden` kẹp mất dòng vừa mọc', () => {
    // Ô sửa là `overflow: hidden` cộng một chiều cao do JS ghim (nó KHÔNG được là vùng cuộn thứ
    // ba của trang). Bỏ phép đo khỏi bộ nghe `input` thì chiều cao đứng yên ở giá trị lúc mở, và
    // mọi dòng gõ thêm biến mất dưới cái trần đó — không một ca nào khác trong file này thấy.
    const { sua } = mocSua('a');
    const o = theoLop(veMau(ban(NGAN), docGia, false, () => {}, sua), 'mau-sua');
    o.style.blockSize = '';
    o.scrollHeight = 120;
    o.offsetHeight = 42;
    o.clientHeight = 40;
    o.boNghe.input();
    expect(o.style.blockSize).toBe('122px');
    // Và nó ĐO LẠI, không chỉ đặt một lần: gõ thêm một dòng nữa thì con số đi theo.
    o.scrollHeight = 150;
    o.boNghe.input();
    expect(o.style.blockSize).toBe('152px');
  });

  it('bộ nghe `resize` của cửa sổ được GỠ lúc ô mất tiêu điểm — không ghim một ô đã rời DOM', () => {
    // Ô sửa bị `replaceChildren` thay ra ở mỗi lần rời chế độ sửa. Một bộ nghe không gỡ sẽ ở lại
    // trên cửa sổ và ghim đúng cái `<textarea>` vừa bị vứt đi, mỗi lần sửa một cái.
    const boNgheCuaSo = [];
    const cuaSo = {
      addEventListener: (ten, ham) => boNgheCuaSo.push([ten, ham]),
      removeEventListener: (ten, ham) => {
        const i = boNgheCuaSo.findIndex(([t, h]) => t === ten && h === ham);
        if (i >= 0) boNgheCuaSo.splice(i, 1);
      },
    };
    const doc = { createElement: () => phanTuGia(), defaultView: cuaSo };
    const { sua } = mocSua('a');
    const o = theoLop(veMau(ban(NGAN), doc, false, () => {}, sua), 'mau-sua');
    expect(boNgheCuaSo.map(([t]) => t)).toEqual(['resize']);
    o.boNghe.blur();
    expect(boNgheCuaSo).toEqual([]);
  });

  it('mất tiêu điểm gọi `roi`', () => {
    const { nhatKy, sua } = mocSua('a');
    const o = theoLop(veMau(ban(NGAN), docGia, false, () => {}, sua), 'mau-sua');
    o.boNghe.blur();
    expect(nhatKy).toEqual(['roi']);
  });

  it('mẩu ĐANG sửa KHÔNG mang tabindex và KHÔNG nghe keydown — ô sửa tự là điểm dừng', () => {
    // Để `tabindex` trên mẩu bọc thì `Tab` đi qua hai điểm dừng cho một thứ; để bộ nghe
    // `keydown` ở đó thì `Enter` và phím cách bị ăn mất ngay trong ô đang gõ.
    const { sua } = mocSua('a');
    const mau = veMau(ban(NGAN), docGia, false, () => {}, sua);
    expect(mau.thuocTinh.tabindex).toBeUndefined();
    expect(mau.boNghe.click).toBeUndefined();
    expect(mau.boNghe.keydown).toBeUndefined();
  });

  it('dòng gấp chặn nổi bọt và gọi móc gấp RIÊNG — nhãn `thu lại ▴` phải THU mẩu lại', () => {
    // Không có nó thì chữ trên màn hình nói một việc và cú bấm làm một việc khác: cú bấm chạy
    // tiếp lên thẻ mẩu và VÀO chế độ sửa thay vì thu mẩu.
    const nhatKy = [];
    const mau = veMau(
      ban(DAI),
      docGia,
      true,
      () => nhatKy.push('click'),
      null,
      () => nhatKy.push('gap'),
    );
    const suKien = phat(theoLop(mau, 'mau-gap'), 'click');
    expect(nhatKy).toEqual(['gap']);
    expect(suKien.daChanNoiBot).toBe(true);
  });

  it('móc gấp mặc định LÀ khiClick — chỗ gọi cũ không phải đổi một dòng', () => {
    let dem = 0;
    const mau = veMau(ban(DAI), docGia, false, () => {
      dem += 1;
    });
    phat(theoLop(mau, 'mau-gap'), 'click');
    expect(dem).toBe(1);
  });

  it('caoTheoNoiDungSua đo SAU khi ô vào DOM: block-size về auto trước, rồi mới đọc scrollHeight', () => {
    // `scrollHeight` của một phần tử đang bị ghim chiều cao bằng đúng chiều cao đó, nên bỏ bước
    // `auto` là ô chỉ cao lên được và không bao giờ co lại khi xóa chữ.
    const nhatKy = [];
    const o = {
      scrollHeight: 60,
      offsetHeight: 42,
      clientHeight: 40,
      style: {
        set blockSize(giaTri) {
          nhatKy.push(giaTri);
        },
      },
    };
    caoTheoNoiDungSua(o);
    // 60 (nội dung + padding) + 2 (hai đường viền, ĐO chứ không viết thành số).
    expect(nhatKy).toEqual(['auto', '62px']);
  });

  it('caoTheoNoiDungSua với null thì không ném — ô sửa có thể không có trong lượt vẽ này', () => {
    expect(() => caoTheoNoiDungSua(null)).not.toThrow();
    expect(() => caoTheoNoiDungSua(undefined)).not.toThrow();
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
