// Bộ điều khiển trình duyệt tối thiểu qua CDP — không một dependency nào.
//
// Vì sao tự viết thay vì dùng Playwright/Puppeteer: `package.json` của dự án này chỉ được
// mang đúng một devDependency là Vitest, và luật đó có lý do — mọi thứ khác kéo theo một cây
// phụ thuộc lớn hơn cả mã sản phẩm. Node 22 đã có `fetch` và `WebSocket` toàn cục, còn CDP thì
// là JSON trên WebSocket, nên phần ta thật sự cần gọn trong một tệp.
//
// Tệp này KHÔNG nằm trong `app/`: nó là công cụ, không phải mã chạy trên trang. Mọi bất biến
// kiến trúc (`test/harness.test.js`, `test/state-tap-trung.test.js`, …) chỉ quét `app/`, và
// `vitest.config.js` chỉ gom `test/**/*.test.js`, nên `tools/` không đi vào `npm test`.

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { tmpdir } from 'node:os';

/** Kiểu nội dung theo đuôi tệp. `.js` phải là `text/javascript` — ES module không nạp được nếu sai. */
const KIEU = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

/**
 * Dựng một HTTP server tĩnh phục vụ `goc`, nghe ở một cổng rảnh do hệ điều hành chọn.
 *
 * Cổng động chứ không phải một số cố định: chạy hai lần chồng nhau, hoặc một tiến trình cũ còn
 * treo, sẽ làm một cổng ghim hỏng theo kiểu khó đoán.
 *
 * Phải là HTTP chứ không phải `file://` — AD-12 chốt app chỉ chạy trong secure context, và
 * `crypto.randomUUID` cùng `navigator.locks` đều vắng mặt ngoài context đó.
 */
export async function phucVuTinh(goc) {
  const server = createServer(async (req, res) => {
    const duongDan = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const tep = join(goc, normalize(duongDan === '/' ? '/index.html' : duongDan));
    // Chặn đường vòng ra ngoài thư mục gốc.
    if (!tep.startsWith(goc)) {
      res.writeHead(403).end('ngoài phạm vi');
      return;
    }
    try {
      const noiDung = await readFile(tep);
      res.writeHead(200, { 'content-type': KIEU[extname(tep)] ?? 'application/octet-stream' });
      res.end(noiDung);
    } catch {
      res.writeHead(404).end('không có');
    }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const cong = server.address().port;
  return { diaChi: `http://127.0.0.1:${cong}/`, dong: () => new Promise((ok) => server.close(ok)) };
}

/** Các chỗ Edge/Chrome thường nằm trên Windows, cộng một lối thoát bằng biến môi trường. */
const NOI_TIM_TRINH_DUYET = [
  process.env.GHICHU_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

function timTrinhDuyet() {
  for (const noi of NOI_TIM_TRINH_DUYET) {
    if (noi && existsSync(noi)) return noi;
  }
  throw new Error(
    'Không tìm thấy Edge hay Chrome. Đặt biến môi trường GHICHU_BROWSER trỏ tới tệp thực thi.',
  );
}

/**
 * Mở một trình duyệt Chromium ở chế độ headless với hồ sơ TẠM, rồi nối vào nó qua CDP.
 *
 * Hồ sơ tạm là bắt buộc: chạy trên hồ sơ thật sẽ dùng chung kho dữ liệu với trình duyệt hằng
 * ngày của người dùng, và bước dọn sạch origin ở đầu mỗi lượt đo sẽ xóa dữ liệu thật.
 *
 * Cổng gỡ lỗi để `0` rồi đọc lại từ `DevToolsActivePort`, cùng lý do với cổng của server.
 */
export async function moTrinhDuyet() {
  const hoSo = await mkdtemp(join(tmpdir(), 'ghichu-thu-tay-'));
  const tienTrinh = spawn(
    timTrinhDuyet(),
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${hoSo}`,
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const tepCong = join(hoSo, 'DevToolsActivePort');
  let cong = null;
  for (let i = 0; i < 100 && cong === null; i += 1) {
    await nghi(100);
    if (existsSync(tepCong)) {
      const dong = readFileSync(tepCong, 'utf8').split('\n');
      if (dong[0]?.trim()) cong = dong[0].trim();
    }
  }
  if (cong === null) throw new Error('trình duyệt không mở được cổng gỡ lỗi sau 10 giây');

  const cdp = await Cdp.ketNoi(cong);
  cdp.dong = async () => {
    tienTrinh.kill();
    await nghi(300);
    await rm(hoSo, { recursive: true, force: true }).catch(() => {});
  };
  return cdp;
}

export class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.cho = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.cho.has(m.id)) {
        const { xong, hong } = this.cho.get(m.id);
        this.cho.delete(m.id);
        if (m.error) hong(new Error(JSON.stringify(m.error)));
        else xong(m.result);
      }
    });
  }

  static async ketNoi(cong) {
    const r = await fetch(`http://127.0.0.1:${cong}/json/version`);
    const ws = new WebSocket((await r.json()).webSocketDebuggerUrl);
    await new Promise((ok, no) => {
      ws.addEventListener('open', ok, { once: true });
      ws.addEventListener('error', no, { once: true });
    });
    return new Cdp(ws);
  }

  goi(method, params = {}, sessionId) {
    const id = ++this.id;
    const goiDi = { id, method, params };
    if (sessionId) goiDi.sessionId = sessionId;
    this.ws.send(JSON.stringify(goiDi));
    return new Promise((xong, hong) => this.cho.set(id, { xong, hong }));
  }

  /** Mở một tab mới và gắn vào nó; `sessionId` trả về là thứ dùng để chạy JS trong tab đó. */
  async tabMoi(url) {
    const { targetId } = await this.goi('Target.createTarget', { url });
    const { sessionId } = await this.goi('Target.attachToTarget', { targetId, flatten: true });
    return { targetId, sessionId };
  }

  async dongTab(targetId) {
    await this.goi('Target.closeTarget', { targetId });
  }

  /** Chạy một thân hàm async trong tab, trả về giá trị đã tuần tự hóa. */
  async chay(sessionId, than) {
    const r = await this.goi(
      'Runtime.evaluate',
      { expression: `(async () => { ${than} })()`, awaitPromise: true, returnByValue: true },
      sessionId,
    );
    if (r.exceptionDetails) {
      throw new Error(
        'JS trong tab ném: ' +
          (r.exceptionDetails.exception?.description ?? JSON.stringify(r.exceptionDetails)),
      );
    }
    return r.result.value;
  }

  async taiLai(sessionId) {
    await this.goi('Page.enable', {}, sessionId);
    await this.goi('Page.reload', {}, sessionId);
    await this.doiSan(sessionId);
  }

  /** Đợi tới khi `app/main.js` nạp xong và `store` sẵn sàng trong tab. */
  async doiSan(sessionId) {
    for (let i = 0; i < 100; i += 1) {
      try {
        const ok = await this.chay(
          sessionId,
          `const m = await import('/app/main.js'); return typeof m.store === 'object';`,
        );
        if (ok) return;
      } catch {
        // Trang chưa nạp xong — thử lại.
      }
      await nghi(100);
    }
    throw new Error('tab không sẵn sàng sau 10 giây');
  }
}

export function nghi(ms) {
  return new Promise((ok) => setTimeout(ok, ms));
}

/** Đọc toàn bộ store `drafts` bằng một giao dịch RIÊNG, độc lập với mã của app. */
export const DOC_DRAFTS = `
  const kho = await new Promise((ok, no) => {
    const y = indexedDB.open('ghichu');
    y.onsuccess = () => ok(y.result);
    y.onerror = () => no(y.error);
  });
  const ra = await new Promise((ok, no) => {
    const t = kho.transaction(['drafts'], 'readonly');
    const y = t.objectStore('drafts').getAll();
    y.onsuccess = () => ok(y.result);
    t.onerror = () => no(t.error);
  });
  kho.close();
  return ra;
`;

/** Hình dạng schema thật của kho, đọc từ chính trình duyệt. */
export const DOC_SCHEMA = `
  const kho = await new Promise((ok, no) => {
    const y = indexedDB.open('ghichu');
    y.onsuccess = () => ok(y.result);
    y.onerror = () => no(y.error);
  });
  const ra = {
    version: kho.version,
    stores: [...kho.objectStoreNames],
    indexes: [...kho.transaction(['notes'], 'readonly').objectStore('notes').indexNames],
    keyPathDrafts: kho.transaction(['drafts'], 'readonly').objectStore('drafts').keyPath,
  };
  kho.close();
  return ra;
`;

/** Xóa sạch mọi dấu vết của origin — mỗi lượt đo phải bắt đầu từ một kho trống. */
export const DON_SACH = `
  localStorage.clear();
  sessionStorage.clear();
  await new Promise((ok) => {
    const y = indexedDB.deleteDatabase('ghichu');
    y.onsuccess = ok; y.onerror = ok; y.onblocked = ok;
  });
  return true;
`;
