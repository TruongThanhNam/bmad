---
title: 'Story 1.1 — Khung dự án chạy được trên HTTPS'
type: 'feature'
created: '2026-09-10'
status: 'done'
route: 'dispatch'
baseline_commit: 'f564ee9252fc5b6a2e4fb5eb124cda8637104945'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Repo chỉ có tài liệu planning và bộ BMAD tooling — không một dòng mã sản phẩm, không chỗ đặt mã, không cách chạy test. Mọi story sau của cả 8 epic đều không có nền để đứng lên.

**Approach:** Dựng đúng cây thư mục của Structural Seed, một `index.html` nạp thẳng ES module và tải xong không phát thêm request nào, một `package.json` chạy được Vitest, và một README mang bốn thứ không suy được từ mã: cách chạy cục bộ, cấm `file://`, origin cố định, checklist deploy có bước bump `APP_VERSION`.

## Boundaries & Constraints

**Always:**
- `app/main.js` là file **duy nhất** trong repo import từ `app/adapters/`.
- Không bundler, không transpile, **không thư viện chạy lúc runtime**. `index.html` và mọi file dưới `app/` không import gì từ `node_modules`; dependency chỉ tồn tại để chạy test.
- File `kebab-case.js`, hàm/biến `camelCase`. **Cấm chữ `card`** trong mã sản phẩm.
- Sau khi trang tải xong: không webfont, không CDN, không `fetch`, không telemetry, không `console` thay cho báo người dùng.
- Origin sản xuất `https://truongthanhnam.github.io/bmad/` — repo `TruongThanhNam/bmad`, nhánh `main`, thư mục gốc.

**Never:**
- Không tạo nội dung cho `app/core/limits.js`, `errors.js`, `time.js`, `fold.js`, `query.js`, `backup.js`, `state.js` — thuộc Story 1.2–1.6. Story này chỉ dựng chỗ trống.
- Không token màu/typography/spacing trong `style.css`, không script theme nội tuyến — thuộc Story 1.8.
- Không UI, không thành phần giao diện, không chữ placeholder trong trang.
- Không CI, không GitHub Actions, không service worker, không bước build.
- Không test cho `app/adapters/` — chúng chỉ được kiểm bằng danh sách thử tay trong README.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mở qua HTTP server localhost | `index.html` phục vụ qua `http://localhost` | Trang tải xong, console sạch, `app/main.js` nạp như ES module | N/A |
| Mở bằng `file://` | Mở trực tiếp từ đĩa | Trang **hỏng** — module bị chặn ngoài secure context | Không xử lý trong mã; README ghi rõ đây là cấm kèm cách chạy đúng |
| Sau khi trang tải xong | Tab đã tải, Network đang ghi | **Không** một request nào thêm | N/A |

## Quyết định đã chốt

- `README.md` hiện chỉ chứa một dòng placeholder `hello bmad!` — **ghi đè hoàn toàn**; không có thông tin cần giữ.
- Bốn thư mục `app/core|ports|adapters|view/` giữ trong git bằng `.gitkeep`, **không** tạo stub rỗng mang tên module thật — file rỗng mang tên thật sẽ va vào story chủ sở hữu của nó.
- `APP_VERSION` không được tạo ở story này; README chỉ nêu tên bước bump. Hằng số thuộc `app/core/limits.js` của Story 1.2.
- Thêm `.nojekyll`: repo public thì tài liệu planning đã đọc được trên github.com, nên phục vụ chúng không thêm phơi bày gì, đổi lại loại bỏ nguy cơ Jekyll build hỏng vì markdown planning.
- **Nghiệm thu deploy nằm trong story này, chia hai vai.** Agent dựng mã và commit; agent **không** bật GitHub Pages, không push, không tự publish site. Nam bật Pages trong repo Settings và tự nghiệm thu bốn AC cần trình duyệt thật trên URL sản xuất: tải xong không lỗi console · sau khi tải xong Network không thêm request nào · URL đúng `https://truongthanhnam.github.io/bmad/` · mở bằng `file://` thì hỏng. Story chỉ chuyển `done` sau khi Nam xác nhận.

</frozen-after-approval>

## Code Map

Repo greenfield — không có mã sản phẩm để đọc hay tái sử dụng. Ba file hiện hữu liên quan:

- `README.md` — đúng một dòng `hello bmad!`. Bị ghi đè hoàn toàn.
- `.gitignore` — đã ignore `_bmad/config.user.toml`, `_bmad-output/implementation-artifacts/`, `.claude/settings.local.json`. **Chưa** ignore `node_modules/`. Không sửa dòng nào đang có.
- `ARCHITECTURE-SPINE.md` (trong `_bmad-output/planning-artifacts/architecture/architecture-ghi-chu-hang-ngay-2026-09-10/`) — mục **Structural Seed** (~dòng 458) là nguồn duy nhất cho cây thư mục; **Consistency Conventions** (~dòng 431) cho quy ước đặt tên; **Tech Stack** (~dòng 455) chốt Vitest 5.0.0 và hosting.

Đã xác minh trên máy: Node v22.14.0, npm 11.12.1, `vitest@5.0.0` là `latest` thật trên registry, `git remote origin` khớp origin sản xuất.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- tạo: `"type": "module"`, `"private": true`, script `"test": "vitest run"` + `"test:watch": "vitest"`, devDependency duy nhất `vitest` `^5.0.0` -- Vitest cần ESM; đúng một dependency, không hơn
- [x] `vitest.config.js` -- tạo: `include: ['test/**/*.test.js']` -- giữ Vitest khỏi quét `_bmad/`, `.claude/`, `node_modules/`
- [x] `.gitignore` -- thêm `node_modules/` -- dependency test không vào repo
- [x] `index.html` -- tạo: `lang="vi"`, charset, viewport, `<title>`, link `app/style.css`, `<main>` rỗng, `<script type="module" src="app/main.js">` -- điểm vào duy nhất, nạp thẳng ES module
- [x] `app/main.js` -- tạo: bootstrap rỗng, chú thích ghi rõ đây là nơi **duy nhất** được import từ `app/adapters/` -- ranh giới kiến trúc hiện diện từ file đầu tiên
- [x] `app/style.css` -- tạo: rỗng, một chú thích trỏ token về Story 1.8 -- link trong `index.html` cần đích tồn tại, không được 404
- [x] `app/core/.gitkeep`, `app/ports/.gitkeep`, `app/adapters/.gitkeep`, `app/view/.gitkeep` -- tạo -- git không track thư mục rỗng, mà cây thư mục chính là sản phẩm của story
- [x] `test/harness.test.js` -- tạo: test smoke chứng minh harness sống, cộng hai test quét file khẳng định chỉ `app/main.js` import từ `app/adapters/` và không file nào dưới `app/` import từ `node_modules` -- `vitest run` không có test file nào sẽ thoát với lỗi, và hai bất biến kiến trúc kia rất dễ bị vi phạm trong im lặng từ story sau
- [x] `README.md` -- ghi đè, phải chứa cả bốn: cách chạy cục bộ bằng HTTP server ở localhost · cảnh báo **cấm `file://`** · cảnh báo origin **không được đổi** vì đổi tên miền hoặc đường dẫn là mất toàn bộ ghi chú · checklist deploy có bước **bump `APP_VERSION`** đứng tường minh. Cộng một mục có tiêu đề **để trống** cho danh sách thử tay của `app/adapters/` -- không thứ nào trong số này suy được từ mã
- [x] `.nojekyll` -- tạo, rỗng -- GitHub Pages phục vụ nguyên trạng

**Acceptance Criteria:**
- Given repo đã `npm install`, when chạy `npm test`, then Vitest khởi động, chạy `test/harness.test.js`, toàn bộ pass, exit code 0
- Given cây thư mục đã dựng, when đối chiếu Structural Seed, then khớp: `index.html`, `app/main.js`, `app/core/`, `app/ports/`, `app/adapters/`, `app/view/`, `app/style.css`, `test/`
- Given README đã ghi, when đọc nó, then có đủ bốn cảnh báo/checklist nêu trên và mục để trống cho danh sách thử tay `app/adapters/`
- Given trang phục vụ qua localhost, when mở trên Chromium bản hiện hành trên Windows, then tải xong không lỗi console, không cần cài đặt gì và không cần quyền admin
- Given Nam đã push và bật GitHub Pages, when mở `https://truongthanhnam.github.io/bmad/` trên Edge/Chrome, then tải xong không lỗi console, và sau khi tải xong Network không ghi nhận thêm request nào — nghiệm thu bằng tay bởi Nam, không phải bởi agent

## Implementation Notes

- `test/harness.test.js` quét cây `app/` bằng `node:fs` (đệ quy, chỉ `.js`) và bắt import bằng một
  regex phủ cả `import … from '…'`, `import '…'` và `import('…')`. Bất biến "không import từ
  `node_modules`" được kiểm bằng cách bắt mọi bare specifier (không `./`, `../`, `/`, và không phải
  URL) — chặt hơn việc chỉ tìm chữ `node_modules`. Đã kiểm ngược: thả tạm một file
  `app/view/tmp-probe.js` import `../adapters/foo.js` và `vitest` thì **cả hai** test đỏ, rồi xóa file.
- `package-lock.json` được commit (sản phẩm tự nhiên của `npm install`, khóa đúng `vitest@5.0.0`).
- Agent **không** push và **không** bật GitHub Pages — theo Quyết định đã chốt, phần đó là của Nam.
- **Matrix Test Audit đã thất bại ở lần đầu** và được sửa: cả ba dòng của I/O Matrix ban đầu không có
  test tự động nào phủ. Thêm `test/trang-tinh.test.js` phủ phần kiểm được ở Node — mọi `src`/`href`
  cục bộ trong `index.html` trỏ tới file có thật (không 404) · `app/main.js` nạp được thật như ES
  module · script tag dùng `type="module"` (chính là thứ khiến `file://` hỏng) · README ghi rõ cấm
  `file://` · `index.html` không tham chiếu tài nguyên ngoài · không file nguồn nào dưới `app/` chứa
  `fetch`/`XMLHttpRequest`/`WebSocket`/`EventSource`/`sendBeacon`/`@import`/URL tuyệt đối. Nghiệm thu
  cuối cùng của ba dòng này vẫn là bằng tay trên trình duyệt thật — test tĩnh chỉ bắt nguyên nhân,
  không bắt được hành vi. Đã kiểm ngược: thả `app/view/tmp-probe.js` chứa `fetch("https://cdn…")` và
  đổi `index.html` sang một webfont Google cộng một CSS không tồn tại thì **3 test đỏ**, rồi hoàn nguyên.
- Tổng sau step-03: 10 test, 2 file, toàn bộ pass.

**Vòng patch sau review (step-04) — 13 finding, không loopback:**

- Thêm `test/helpers/quet-nguon.js`: `boChuThichJs` đi từng ký tự, bỏ `//` và `/* */` **mà không
  đụng nội dung chuỗi**, nên `'https://…'` trong một chuỗi thật vẫn bị bắt còn chú thích thì không.
  `boChuThichCss` chỉ bỏ chú thích khối (vì `//` trong CSS là ký tự thật, vd `url(//host)`);
  `boChuThichHtml` bỏ `<!-- -->`. Cả hai bộ quét dùng nó.
- `test/harness.test.js`: regex nhận cả `export … from`; mẫu adapter thành
  `/(?:^|\/)adapters(?:\/|\.js$|$)/`; test node_modules bắt thêm mọi specifier có đoạn
  `node_modules/` (đường dẫn tương đối chọc vào `node_modules` là cách tự nhiên nhất để kéo thư
  viện vào một dự án không có bước build); thêm test mọi specifier tương đối phải có đuôi
  `.js`/`.css` và trỏ tới file có thật; thêm test `core/`+`ports/` không chạm `window` ·
  `document` · `indexedDB` · `localStorage` · `sessionStorage` · `BroadcastChannel` · `navigator`.
- `test/trang-tinh.test.js`: regex thuộc tính nhận nháy đơn, nháy kép và không nháy; assertion
  script module không còn ghim thứ tự/kiểu nháy (thu các thẻ `<script>` rồi đòi đúng một thẻ mang
  cả `type=module` và `src=app/main.js`); bỏ `?query`/`#hash` trước `existsSync`; **danh sách cấm
  mạng giờ chạy cả trên `index.html`** nên `<script>fetch('https://…')</script>` nội tuyến không
  lọt; bỏ mẫu `url(…)` vì mẫu URL tuyệt đối đã bao trùm.
- `README.md` (chỉ văn, không tạo `limits.js`): bước bump `APP_VERSION` giữ nguyên là bắt buộc
  nhưng thêm blockquote nói rõ hằng số do **Story 1.2** tạo và tới lúc đó mới làm được; thêm mục
  "Bật GitHub Pages (làm một lần)" với đúng đường Settings → Pages → branch `main` → folder `/`;
  thêm mục "Vì sao có `.nojekyll`"; thêm đoạn cảnh báo cục bộ chạy ở `/` còn sản xuất ở `/bmad/`
  nên đường dẫn tuyệt đối 404 trên sản xuất, và hai origin không dùng chung dữ liệu.
- **Kiểm ngược tự làm, không tin báo cáo của subagent.** Thả `app/core/probe.js` chứa
  `export … from '../adapters/idb.js'` · `../../node_modules/some-lib/x.js` · `./khong-ton-tai.js`
  · `./limits` (thiếu đuôi) · `localStorage` · `document` → **đúng 4 test mới đỏ**. Thả probe chỉ
  có chú thích (import bị comment-out + hai URL trong chú thích) → **13/13 pass**, không đỏ oan.
  Thả probe có chuỗi thật `'https://cdn.example.com/a.js'` → **đỏ đúng 1 test**. Xóa probe, về 13/13.
- Verification chạy lại đầy đủ: `npm test` 13/13 pass · `git check-ignore` xác nhận `node_modules/`
  bị ignore · `python -m http.server` phục vụ `/` · `app/main.js` · `app/style.css` đều HTTP 200.
- Tổng cuối: **13 test, 2 file test + 1 helper, toàn bộ pass.**

## Spec Change Log

## Review Triage Log

### Vòng 1 — blind-hunter · edge-case-hunter · verification-gap

| # | Finding | Verdict | Bằng chứng |
| --- | --- | --- | --- |
| 1 | `vitest@^5.0.0` là major không tồn tại, `npm install` sẽ fail | `false` | `npm view vitest dist-tags` → `latest: 5.0.0`. `npm test` đã chạy thật, banner `RUN v5.0.0`, 10/10 pass. Cả ba layer cùng sai vì knowledge cutoff. |
| 2 | Không có `package-lock.json` được commit | `false` | Lockfile đã commit trong `a153bb9`; `git diff --stat` cho `package-lock.json \| 1168 +++`. Nó vắng trong file diff vì bị loại có ý thức khi dựng diff cho reviewer. |
| 3 | Claim "bare specifier chặt hơn tìm chữ `node_modules`" là sai — `../node_modules/x` lọt | `medium` | Đúng: `laTuongDoi` nhận `../` nên `../node_modules/vitest` không bị bắt. Trong dự án không có bước build, import tương đối vào `node_modules` chính là cách tự nhiên nhất để lôi một thư viện vào — đúng thứ bất biến này tồn tại để chặn. |
| 4 | `export … from '../adapters/x.js'` lọt qua test ranh giới adapter | `medium` | Regex chỉ có `import`. Barrel re-export là dạng rất thường gặp; story 1.5–1.6 dễ viết phải. |
| 5 | `../adapters` hoặc `./adapters.js` (không có `/` cuối) lọt | `low` | `/(^\|\/)adapters\//` đòi dấu `/` cuối. Ít khả năng vì Structural Seed cho `adapters/` là thư mục, nhưng sửa regex là sửa trực tiếp, không thêm phức tạp. |
| 6 | `index.html` được miễn khỏi ban-list mạng — inline `<script>fetch(…)</script>` lọt | `medium` | `danhSachFileNguon(appDir)` chỉ đi `app/` và chỉ `.js`/`.css`; `indexHtml` chỉ bị kiểm qua thuộc tính `src`/`href`. Một webfont hay telemetry nhúng inline vào **trang duy nhất được ship** sẽ xanh cả suite. |
| 7 | Regex thuộc tính chỉ nhận nháy kép — `href='https://…'` lọt cả hai kiểm | `medium` | Đúng: `/(?:src\|href)\s*=\s*"([^"]+)"/`. Không có gì bắt buộc file phải dùng nháy kép; một lần sửa tay là lỗ. Cùng lớp hậu quả với #6. |
| 8 | Không kiểm specifier tương đối có `.js` tường minh và trỏ tới file có thật | `medium` | Không test nào làm việc này. `import './core/limits'` (thiếu `.js`) chạy được ở Node/Vite nhưng 404 ở trình duyệt → trang boot ra `<main>` rỗng. README ghi rõ không CI, không staging, không rollback tự động → tín hiệu đầu tiên là origin sản xuất. |
| 9 | Không test nào cưỡng chế tính thuần của `core/`/`ports/` dù chú thích trong `main.js` tuyên bố nó | `medium` | Đúng: hai test hiện có chỉ kiểm import adapter và bare specifier. Sẽ vỡ ở Story 1.5 (`state.js`) hoặc 1.6 (kho IndexedDB) khi ai đó chạm `indexedDB`/`window` thẳng trong `core/` — trong im lặng. |
| 10 | Query string / hash / dấu `/` đầu làm test 404 báo sai | `low` | `app/style.css?v=2` → `existsSync` fail. Hiện chưa xảy ra, và đây là rủi ro báo-sai chứ không phải bỏ-sót. Sửa `d.split(/[?#]/)[0]` là sửa trực tiếp. |
| 11 | Assertion `type="module"` ghim thứ tự và kiểu nháy của thuộc tính, không ghim hành vi | `low` | Đúng: `<script src="app/main.js" type="module">` sẽ đỏ dù hành vi không đổi. Rủi ro báo-sai; sửa regex là sửa trực tiếp. |
| 12 | Ban `/https?:\/\//i` và regex import quét cả chú thích → prose và import bị comment-out làm đỏ suite | `low` | Cả hai đúng, chung một gốc: scanner khớp text thô, không bỏ chú thích. Hậu quả thật là test đỏ oan rồi bị người ta nới lỏng. Ghi chú: `/https?:\/\//i` đã bao trùm mẫu `url(…)` nên một trong hai là dư. |
| 13 | README ghi `APP_VERSION` là hằng trong `app/core/limits.js` — file chưa tồn tại | `low` | Đúng theo nghĩa chữ. Frozen block đã chốt không tạo `limits.js` ở story này, nên sửa **không** phải tạo file mà chỉ là ghi rõ "(từ Story 1.2)" trong README. |
| 14 | `.nojekyll` không được giải thích; README không ghi cách bật GitHub Pages | `low` | Đúng: README có origin nhưng không có bước Settings → Pages. Đáng sửa vì frozen block giao chính việc bật Pages cho Nam, mà spec thì bị gitignore — repo không tự ghi lại được. |
| 15 | Dev cục bộ phục vụ ở `/` còn sản xuất ở `/bmad/`, README không nêu lệch này | `low` | Đúng. Hai hệ quả thật: đường dẫn tuyệt đối kiểu `/app/…` chạy được ở localhost và 404 ở sản xuất; và dữ liệu localhost với sản xuất không bao giờ trùng nhau. |
| 16 | `index.html` không có `<noscript>`, JS tắt hoặc module lỗi thì ra trang trắng | `low` | Đúng về sự việc. Nhưng frozen Boundaries nói thẳng "không UI, không chữ placeholder trong trang", và epic-1-context nói Epic 1 kết thúc là chưa có gì để bấm. Affordance báo lỗi thuộc story có UI thật. → `defer`. |
| 17 | `import()` `app/main.js` sẽ ném ở Node khi main.js chạm DOM ở story sau | `low` — loại | Hiện main.js chỉ có chú thích nên pass thật. Đây là vấn đề của story tương lai, và cách sửa lúc đó (đổi `environment`, hoặc bỏ assertion) phụ thuộc mã lúc đó. Thêm phòng bị bây giờ là phức tạp cho một tình huống chưa chứng minh được là tới. |
| 18 | ENOENT lúc collect nếu `app/` hoặc `index.html` biến mất → cả suite lỗi thay vì đỏ rõ ràng | `false` | File biến mất chính là tình huống thảm hoạ, và lỗi ồn ào là hành vi đúng. Không có gì cho thấy trạng thái đó tới được trong dùng thường ngày. |
| 19 | Thư mục symlink dưới `app/` bị đọc sai hoặc bị bỏ qua | `low` — loại | Không chứng minh được là tới được: repo không có symlink nào và không có gì trong kế hoạch tạo ra. Sửa là thêm nhánh `statSync` — phức tạp cho tình huống giả định. |
| 20 | Không khai `engines` Node → `npm install; npm test` không tái lập được | `low` — loại | Lockfile đã khoá `vitest@5.0.0`. Drift phiên bản Node với n = 1 người dùng là không đáng kể; không story nào yêu cầu. |

## Design Notes

**Vì sao `test/` không được rỗng.** AC gốc đòi "`npm test` thì Vitest khởi động và chạy". `vitest run` không tìm thấy test file nào sẽ thoát với lỗi, nên `test/` rỗng làm AC này không nghiệm thu được. Bộ test smoke vừa chứng minh harness sống, vừa là chỗ đặt hai bất biến kiến trúc dạng quét-cây-thư-mục — chúng thuộc `test/`, không phải test một module `core/`.

**Vì sao trang là vỏ rỗng.** Epic 1 kết thúc mà chưa có gì để bấm là đánh đổi có ý thức của kế hoạch. Chữ placeholder trong `<main>` sẽ tạo ra thứ Story 2.1 phải đi dọn.

## Verification

**Commands:**
- `npm install` -- expected: cài đúng `vitest`, không lỗi
- `npm test` -- expected: toàn bộ test pass, exit code 0
- `git status --porcelain` -- expected: `node_modules/` không xuất hiện
- `python -m http.server 8080` (hoặc `npx --yes http-server -p 8080 .`) -- expected: phục vụ được `http://localhost:8080/index.html`

**Manual checks (if no CLI):**
- Mở `http://localhost:8080/` trên Edge/Chrome: Console sạch, không lỗi, không warning từ mã app.
- DevTools Network: tải trang, đợi ổn định, xóa log — từ đó không request mới nào xuất hiện.
- Mở `index.html` bằng `file://`: xác nhận module bị chặn, trang hỏng đúng như README đã ghi.

**Nam làm bằng tay sau khi agent xong (agent không tự làm):**
- Push nhánh `main`, bật GitHub Pages (Settings → Pages → branch `main`, folder `/`).
- Mở `https://truongthanhnam.github.io/bmad/`: Console sạch; Network sau khi tải ổn định không thêm request nào.
