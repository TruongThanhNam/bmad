// Phủ ba dòng của I/O & Edge-Case Matrix trong spec Story 1.1 bằng phần kiểm được ở Node.
// Ba dòng đó nói về hành vi trình duyệt thật, nên nghiệm thu cuối cùng vẫn là bằng tay
// (README, mục checklist deploy). Những gì kiểm được tĩnh thì kiểm ở đây — vì đó chính là
// chỗ sẽ bị vi phạm trong im lặng: một webfont, một CDN, một `fetch` lọt vào từ story sau.

import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThich, boChuThichHtml } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');
const indexHtmlThoc = readFileSync(join(repoRoot, 'index.html'), 'utf8');
const indexHtml = boChuThichHtml(indexHtmlThoc);

function danhSachFileNguon(thuMuc) {
  const ketQua = [];
  for (const muc of readdirSync(thuMuc, { withFileTypes: true })) {
    const duongDan = join(thuMuc, muc.name);
    if (muc.isDirectory()) {
      ketQua.push(...danhSachFileNguon(duongDan));
    } else if (muc.name.endsWith('.js') || muc.name.endsWith('.css')) {
      ketQua.push(duongDan);
    }
  }
  return ketQua;
}

function duongDanTuongDoi(duongDanTuyetDoi) {
  return relative(repoRoot, duongDanTuyetDoi).split('\\').join('/');
}

// Nhận cả giá trị nháy kép, nháy đơn và không nháy.
const bieuThucThuocTinh = /(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;

function cacDichTaiNguyen(html) {
  const dich = [];
  for (const khop of html.matchAll(bieuThucThuocTinh)) {
    dich.push(khop[1] ?? khop[2] ?? khop[3]);
  }
  return dich;
}

/** Bỏ `?query` và `#hash` — chúng không thuộc đường dẫn trên đĩa. */
function boQueryVaHash(dich) {
  return dich.split('#')[0].split('?')[0];
}

// Danh sách cấm: mọi cách một file có thể phát request sau khi trang đã tải xong.
// Không có `url(…)` riêng — mẫu URL tuyệt đối bên dưới đã bao trùm nó.
const cam = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /\bnavigator\.sendBeacon\b/,
  /\bimportScripts\s*\(/,
  /@import\b/,
  /https?:\/\//i,
];

function viPhamDanhSachCam(ten, noiDung) {
  const viPham = [];
  for (const mau of cam) {
    if (mau.test(noiDung)) viPham.push(`${ten} — khớp ${mau}`);
  }
  return viPham;
}

describe('Matrix — mở qua HTTP server ở localhost', () => {
  it('mọi src/href cục bộ trong index.html đều trỏ tới file có thật, không 404', () => {
    const dich = cacDichTaiNguyen(indexHtml);
    expect(dich.length).toBeGreaterThan(0);

    const thieu = dich
      .filter((d) => !/^[a-z][a-z0-9+.-]*:/i.test(d) && !d.startsWith('//') && !d.startsWith('#'))
      .filter((d) => !existsSync(join(repoRoot, boQueryVaHash(d))));
    expect(thieu).toEqual([]);
  });

  it('app/main.js là ES module hợp lệ — nạp được thật', async () => {
    await expect(import(new URL('../app/main.js', import.meta.url).href)).resolves.toBeDefined();
  });
});

describe('Matrix — mở bằng file:// thì hỏng, và điều đó được ghi rõ', () => {
  it('index.html nạp mã bằng type="module" — chính là thứ khiến file:// hỏng', () => {
    // Không ghim thứ tự hay kiểu nháy của thuộc tính — chỉ đòi hành vi.
    const theScript = [...indexHtml.matchAll(/<script\b[^>]*>/gi)].map((k) => k[0]);
    const moduleChinh = theScript.filter(
      (the) =>
        /\btype\s*=\s*['"]?module\b/i.test(the) && /\bsrc\s*=\s*['"]?app\/main\.js\b/i.test(the),
    );
    expect(moduleChinh).toHaveLength(1);
  });

  it('README ghi rõ cấm file:// và chỉ cách chạy đúng bằng HTTP server ở localhost', () => {
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
    expect(readme).toMatch(/file:\/\//);
    expect(readme).toMatch(/localhost/);
  });
});

describe('Matrix — sau khi tải xong không phát thêm request nào', () => {
  it('index.html không tham chiếu tài nguyên ngoài — không webfont, không CDN', () => {
    const ngoai = cacDichTaiNguyen(indexHtml).filter(
      (d) => /^https?:/i.test(d) || d.startsWith('//'),
    );
    expect(ngoai).toEqual([]);
  });

  it('index.html không mở kết nối mạng từ script/style nội tuyến', () => {
    // Trang duy nhất được phục vụ cũng phải qua danh sách cấm: một
    // `<script>fetch('https://…')</script>` không được lọt.
    expect(viPhamDanhSachCam('index.html', indexHtml)).toEqual([]);
  });

  it('không file nguồn nào dưới app/ mở kết nối mạng hay nhúng tài nguyên ngoài', () => {
    const viPham = [];
    for (const duongDan of danhSachFileNguon(appDir)) {
      const noiDung = boChuThich(duongDan, readFileSync(duongDan, 'utf8'));
      viPham.push(...viPhamDanhSachCam(duongDanTuongDoi(duongDan), noiDung));
    }
    expect(viPham).toEqual([]);
  });
});
