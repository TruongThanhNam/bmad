import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThichJs } from './helpers/quet-nguon.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');

function danhSachFileJs(thuMuc) {
  const ketQua = [];
  if (!existsSync(thuMuc)) return ketQua;
  for (const muc of readdirSync(thuMuc, { withFileTypes: true })) {
    const duongDan = join(thuMuc, muc.name);
    if (muc.isDirectory()) {
      ketQua.push(...danhSachFileJs(duongDan));
    } else if (muc.name.endsWith('.js')) {
      ketQua.push(duongDan);
    }
  }
  return ketQua;
}

// Bắt cả `import … from '…'`, `import '…'`, `import('…')` và `export … from '…'`.
const bieuThucImport =
  /(?:^|[^\w$.])(?:import|export)\s*(?:[\s\S]*?\sfrom\s*)?\(?\s*['"]([^'"]+)['"]/g;

function cacDichImport(maNguon) {
  const dich = [];
  for (const khop of boChuThichJs(maNguon).matchAll(bieuThucImport)) {
    dich.push(khop[1]);
  }
  return dich;
}

function duongDanTuongDoi(duongDanTuyetDoi) {
  return relative(repoRoot, duongDanTuyetDoi).split('\\').join('/');
}

function laTuongDoi(dich) {
  return dich.startsWith('./') || dich.startsWith('../') || dich.startsWith('/');
}

function laUrl(dich) {
  return /^[a-z][a-z0-9+.-]*:/i.test(dich) || dich.startsWith('//');
}

describe('harness', () => {
  it('Vitest chạy được — test smoke', () => {
    expect(1 + 1).toBe(2);
  });
});

describe('bất biến kiến trúc', () => {
  const fileJs = danhSachFileJs(appDir);

  it('có ít nhất một file JS dưới app/ để quét', () => {
    expect(fileJs.length).toBeGreaterThan(0);
  });

  it('chỉ app/main.js được import từ app/adapters/', () => {
    const viPham = [];
    for (const duongDan of fileJs) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      if (tuongDoi === 'app/main.js') continue;
      for (const dich of cacDichImport(readFileSync(duongDan, 'utf8'))) {
        // Khớp cả `../adapters/x.js`, `../adapters` và `./adapters.js`.
        if (/(?:^|\/)adapters(?:\/|\.js$|$)/.test(dich)) {
          viPham.push(`${tuongDoi} -> ${dich}`);
        }
      }
    }
    expect(viPham).toEqual([]);
  });

  it('không file nào dưới app/ import từ node_modules', () => {
    const viPham = [];
    for (const duongDan of fileJs) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      for (const dich of cacDichImport(readFileSync(duongDan, 'utf8'))) {
        const bareSpecifier = !laTuongDoi(dich) && !laUrl(dich);
        // Đường dẫn tương đối chọc vào node_modules là cách tự nhiên nhất để kéo
        // một thư viện vào một dự án không có bước build — chính thứ cần chặn.
        const chocVaoNodeModules = /(?:^|\/)node_modules\//.test(dich);
        if (bareSpecifier || chocVaoNodeModules) {
          viPham.push(`${tuongDoi} -> ${dich}`);
        }
      }
    }
    expect(viPham).toEqual([]);
  });

  it('mọi specifier tương đối dưới app/ có đuôi .js/.css và trỏ tới file có thật', () => {
    const viPham = [];
    for (const duongDan of fileJs) {
      const tuongDoi = duongDanTuongDoi(duongDan);
      for (const dich of cacDichImport(readFileSync(duongDan, 'utf8'))) {
        if (!laTuongDoi(dich) || laUrl(dich)) continue;
        if (!/\.(?:js|css)$/.test(dich)) {
          viPham.push(`${tuongDoi} -> ${dich} (thiếu đuôi .js/.css — trình duyệt không tự đoán)`);
          continue;
        }
        const dichTuyetDoi = dich.startsWith('/')
          ? join(repoRoot, dich)
          : resolve(dirname(duongDan), dich);
        if (!existsSync(dichTuyetDoi) || !statSync(dichTuyetDoi).isFile()) {
          viPham.push(`${tuongDoi} -> ${dich} (404 trên trình duyệt)`);
        }
      }
    }
    expect(viPham).toEqual([]);
  });

  it('core/ và ports/ không chạm global của trình duyệt', () => {
    const globalCam = [
      /\bwindow\b/,
      /\bdocument\b/,
      /\bindexedDB\b/,
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\bBroadcastChannel\b/,
      /\bnavigator\b/,
    ];
    const viPham = [];
    for (const thuMuc of ['core', 'ports']) {
      for (const duongDan of danhSachFileJs(join(appDir, thuMuc))) {
        const noiDung = boChuThichJs(readFileSync(duongDan, 'utf8'));
        for (const mau of globalCam) {
          if (mau.test(noiDung)) {
            viPham.push(`${duongDanTuongDoi(duongDan)} — khớp ${mau}`);
          }
        }
      }
    }
    expect(viPham).toEqual([]);
  });
});
