// Danh sách thử tay của `app/adapters/` cho BẢN NHÁP (README mục 10-13), chạy bằng máy.
//
// `app/adapters/` không có test tự động, và luật đó vẫn đứng: lý do gốc của nó là tránh dựng
// một trình duyệt GIẢ, vì một kho giả nghiệm thu được mọi thứ trừ đúng thứ cần nghiệm thu —
// tính nguyên tử của một giao dịch thật, và hành vi thật của kho phạm vi phiên qua một lần
// tải lại. Tệp này không giả lập gì cả: nó lái một Chromium THẬT qua CDP.
//
// Nó tồn tại vì danh sách thử tay có một điểm yếu đã lộ ra: nó chỉ là bằng chứng khi có người
// thật sự ngồi chạy, và trong hai story liền nó không được chạy. Lần đầu chạy, nó bắt được
// một lỗi mà 253 test Vitest đều bỏ lọt — mọi lần tải lại trang đều làm mất bản nháp (AD-3
// bước 1 đọc nhịp tim để đoán "có tab khác đang sống", trong khi sau một lần tải lại thì nhịp
// tim còn mới chính là của tab này ở kiếp trước).
//
// Chạy:  npm run thu-tay
// Không cài gì thêm. Cần Edge hoặc Chrome; đặt GHICHU_BROWSER nếu nó nằm chỗ khác.

import { fileURLToPath } from 'node:url';
import { Cdp, phucVuTinh, moTrinhDuyet, nghi, DOC_DRAFTS, DOC_SCHEMA, DON_SACH } from './cdp.mjs';
import { AUTOSAVE_MS, DRAFT_BEAT_MS, DRAFT_STALE_MS } from '../app/core/limits.js';

// Ngưỡng lấy thẳng từ `app/core/limits.js` (AD-14) — chép lại con số ở đây thì một lần chỉnh
// ngưỡng sẽ làm phép đo nói dối mà không ai thấy.
const CHU_THU = 'phở bò tái nạm';

const ketQua = [];
function ghi(ten, dat, chiTiet) {
  ketQua.push({ ten, dat, chiTiet });
  console.log(`${dat ? 'PASS' : 'FAIL'}  ${ten}${chiTiet ? ` — ${chiTiet}` : ''}`);
}

const goc = fileURLToPath(new URL('..', import.meta.url));
const server = await phucVuTinh(goc.replace(/[\\/]$/, ''));
const cdp = await moTrinhDuyet();

async function donDep() {
  await cdp.dong();
  await server.dong();
}

try {
  // ── Dọn sạch origin ───────────────────────────────────────────────────────────────
  {
    const t = await cdp.tabMoi(server.diaChi);
    await cdp.doiSan(t.sessionId);
    await cdp.chay(t.sessionId, DON_SACH);
    await cdp.dongTab(t.targetId);
  }

  const tabA = await cdp.tabMoi(server.diaChi);
  await cdp.doiSan(tabA.sessionId);

  // ── Schema thật của kho ───────────────────────────────────────────────────────────
  {
    const s = await cdp.chay(tabA.sessionId, DOC_SCHEMA);
    ghi(
      'schema: kho ghichu v1, có notes (index localDate) và drafts (keyPath tabId)',
      s.version === 1 &&
        s.stores.includes('notes') &&
        s.stores.includes('drafts') &&
        s.indexes.includes('localDate') &&
        s.keyPathDrafts === 'tabId',
      JSON.stringify(s),
    );
  }

  // ── Mục 10: bản nháp sống qua lần tải lại ─────────────────────────────────────────
  await cdp.chay(
    tabA.sessionId,
    `const m = await import('/app/main.js'); m.store.datBanNhap(${JSON.stringify(CHU_THU)}); return true;`,
  );
  await nghi(AUTOSAVE_MS + 400);

  const tabIdA = await cdp.chay(tabA.sessionId, `return sessionStorage.getItem('ghichu.tabId');`);
  {
    const bn = await cdp.chay(tabA.sessionId, DOC_DRAFTS);
    const mot = bn.length === 1 ? bn[0] : null;
    ghi(
      '10a: đúng một bản ghi drafts, đúng ba trường tabId/text/heartbeat',
      mot !== null && JSON.stringify(Object.keys(mot).sort()) === '["heartbeat","tabId","text"]',
      JSON.stringify(bn),
    );
    ghi(
      '10b: tabId của bản ghi bằng ghichu.tabId trong kho phạm vi phiên',
      mot !== null && mot.tabId === tabIdA,
      `bản ghi=${mot?.tabId} phiên=${tabIdA}`,
    );
    const ls = await cdp.chay(
      tabA.sessionId,
      `return Object.entries(localStorage).map(([k, v]) => k + '=' + v);`,
    );
    ghi('10c: localStorage không chứa bản nháp nào', !ls.some((d) => d.includes(CHU_THU)), JSON.stringify(ls));
  }

  await cdp.taiLai(tabA.sessionId);
  await nghi(600);
  {
    const sau = await cdp.chay(
      tabA.sessionId,
      `const m = await import('/app/main.js');
       const o = document.querySelector('.o-soan');
       return {
         text: m.store.state.draft.text,
         tabId: sessionStorage.getItem('ghichu.tabId'),
         trongO: o === null ? null : o.value,
         conTro: o === null ? null : o.selectionStart,
       };`,
    );
    // Tải lại NGAY, tức trong vòng DRAFT_STALE_MS: đây đúng là ca mà quy tắc cũ hỏng.
    ghi(
      '10d: tải lại ngay thì chữ trở lại nguyên trạng và tabId KHÔNG đổi',
      sau.text === CHU_THU && sau.tabId === tabIdA,
      JSON.stringify(sau),
    );
    // Story 2.2: chữ phải ra tới Ô, không chỉ tới state. Phần nối ở `app/main.js`
    // (`khoiDongBanNhap().then(oSoan.dongBoTuState)`) không có chốt chặn nào khác lúc chạy
    // thật — bỏ nó đi thì state vẫn đúng và màn hình vẫn trống.
    ghi(
      '10e: chữ ra tới Ô SOẠN THẢO, và con trỏ ở cuối chữ',
      sau.trongO === CHU_THU && sau.conTro === CHU_THU.length,
      JSON.stringify({ trongO: sau.trongO, conTro: sau.conTro }),
    );
  }

  // ── Mục 11: tab bị nhân đôi thì không ai lấy mất bản nháp của ai ──────────────────
  {
    // Thao tác Duplicate của trình duyệt sao chép kho phạm vi phiên sang tab mới. Ở đây đặt
    // tay đúng danh tính đó rồi tải lại — cùng một trạng thái đầu vào, không cần chuột.
    const tabB = await cdp.tabMoi(server.diaChi);
    await cdp.doiSan(tabB.sessionId);
    await cdp.chay(
      tabB.sessionId,
      `sessionStorage.setItem('ghichu.tabId', ${JSON.stringify(tabIdA)}); return true;`,
    );
    await cdp.taiLai(tabB.sessionId);
    await nghi(800);

    const tabIdB = await cdp.chay(tabB.sessionId, `return sessionStorage.getItem('ghichu.tabId');`);
    ghi(
      '11a: tab nhân đôi sinh tabId MỚI, khác tab gốc',
      typeof tabIdB === 'string' && tabIdB.length > 0 && tabIdB !== tabIdA,
      `gốc=${tabIdA} nhân đôi=${tabIdB}`,
    );
    const draftB = await cdp.chay(
      tabB.sessionId,
      `const m = await import('/app/main.js'); return m.store.state.draft.text;`,
    );
    ghi('11b: tab nhân đôi nhận bản nháp RỖNG', draftB === '', JSON.stringify(draftB));

    const bn = await cdp.chay(tabB.sessionId, DOC_DRAFTS);
    const cuaA = bn.find((d) => d.tabId === tabIdA);
    ghi(
      '11c: bản nháp của tab gốc còn NGUYÊN CHỮ — nửa cứng của FR-20',
      cuaA !== undefined && cuaA.text === CHU_THU,
      JSON.stringify(bn.map((d) => ({ tabId: d.tabId.slice(0, 8), text: d.text }))),
    );

    await cdp.dongTab(tabB.targetId);
  }

  // ── Mục 13: nhịp tim đập đều, và bản rỗng được dọn ────────────────────────────────
  {
    const truoc = (await cdp.chay(tabA.sessionId, DOC_DRAFTS)).find((d) => d.tabId === tabIdA);
    await nghi(DRAFT_BEAT_MS + 2000);
    const sau = (await cdp.chay(tabA.sessionId, DOC_DRAFTS)).find((d) => d.tabId === tabIdA);
    ghi(
      '13a: heartbeat nhích lên sau một nhịp DRAFT_BEAT_MS',
      truoc !== undefined && sau !== undefined && sau.heartbeat > truoc.heartbeat,
      `${truoc?.heartbeat} → ${sau?.heartbeat}`,
    );
  }
  {
    await cdp.chay(
      tabA.sessionId,
      `
      const kho = await new Promise((ok, no) => { const y = indexedDB.open('ghichu'); y.onsuccess = () => ok(y.result); y.onerror = () => no(y.error); });
      await new Promise((ok, no) => {
        const t = kho.transaction(['drafts'], 'readwrite');
        t.objectStore('drafts').put({ tabId: 'rac-rong', text: '', heartbeat: new Date().toISOString() });
        t.oncomplete = ok; t.onerror = () => no(t.error);
      });
      kho.close();
      return true;
    `,
    );
    const tabC = await cdp.tabMoi(server.diaChi);
    await cdp.doiSan(tabC.sessionId);
    await nghi(800);
    const bn = await cdp.chay(tabC.sessionId, DOC_DRAFTS);
    ghi(
      '13b: bản ghi có text rỗng bị dọn ở lần khởi động sau',
      !bn.some((d) => d.tabId === 'rac-rong'),
      JSON.stringify(bn.map((d) => d.tabId.slice(0, 8))),
    );
    await cdp.dongTab(tabC.targetId);
  }

  // ── Mục 12: bản bỏ rơi nhận lại được, ĐÚNG MỘT LẦN ────────────────────────────────
  {
    await cdp.dongTab(tabA.targetId);
    console.log(`      (đợi ${DRAFT_STALE_MS / 1000}s cho nhịp tim của tab gốc chết hẳn…)`);
    await nghi(DRAFT_STALE_MS + 3000);

    // Hai tab mở gần như cùng lúc, cùng nhìn thấy một bản bỏ rơi: tính nguyên tử của giao
    // dịch là thứ duy nhất chặn cả hai cùng nhận.
    const t1 = await cdp.tabMoi(server.diaChi);
    const t2 = await cdp.tabMoi(server.diaChi);
    await cdp.doiSan(t1.sessionId);
    await cdp.doiSan(t2.sessionId);
    await nghi(1200);

    const d1 = await cdp.chay(
      t1.sessionId,
      `const m = await import('/app/main.js'); return m.store.state.draft.text;`,
    );
    const d2 = await cdp.chay(
      t2.sessionId,
      `const m = await import('/app/main.js'); return m.store.state.draft.text;`,
    );
    ghi(
      '12a: ĐÚNG MỘT tab nhận lại bản bỏ rơi, tab kia nhận rỗng',
      [d1, d2].filter((x) => x === CHU_THU).length === 1,
      `tab1=${JSON.stringify(d1)} tab2=${JSON.stringify(d2)}`,
    );

    const bn = await cdp.chay(t1.sessionId, DOC_DRAFTS);
    ghi(
      '12b: bản ghi cũ biến mất — chỉ còn MỘT bản mang chữ đó, không nhân bản',
      bn.filter((d) => d.text === CHU_THU).length === 1 && !bn.some((d) => d.tabId === tabIdA),
      JSON.stringify(bn.map((d) => ({ tabId: d.tabId.slice(0, 8), text: d.text }))),
    );

    await cdp.dongTab(t1.targetId);
    await cdp.dongTab(t2.targetId);
  }
} finally {
  await donDep();
}

const hong = ketQua.filter((k) => !k.dat);
console.log(`\n=== ${ketQua.length - hong.length}/${ketQua.length} đạt ===`);
for (const h of hong) console.log(` HỎNG — ${h.ten}: ${h.chiTiet}`);
process.exit(hong.length > 0 ? 1 : 0);
