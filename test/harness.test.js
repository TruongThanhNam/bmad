import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(repoRoot, 'app');

function danhSachFileJs(thuMuc) {
  const ketQua = [];
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

// Bắt cả `import ... from '...'`, `import '...'` và `import('...')`.
const bieuThucImport = /(?:^|[^\w$.])import\s*(?:[\s\S]*?\sfrom\s*)?\(?\s*['"]([^'"]+)['"]/g;

function cacDichImport(maNguon) {
  const dich = [];
  for (const khop of maNguon.matchAll(bieuThucImport)) {
    dich.push(khop[1]);
  }
  return dich;
}

function duongDanTuongDoi(duongDanTuyetDoi) {
  return relative(repoRoot, duongDanTuyetDoi).split('\\').join('/');
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
        if (/(^|\/)adapters\//.test(dich)) {
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
        const laTuongDoi = dich.startsWith('./') || dich.startsWith('../') || dich.startsWith('/');
        const laUrl = /^[a-z][a-z0-9+.-]*:/i.test(dich);
        if (!laTuongDoi && !laUrl) {
          viPham.push(`${tuongDoi} -> ${dich}`);
        }
      }
    }
    expect(viPham).toEqual([]);
  });
});
