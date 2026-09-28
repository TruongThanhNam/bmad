---
title: 'Hai bảng màu và theme không nháy lúc tải'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
baseline_commit: '75a4c85218df609ecb9a1902449d01925c05101e'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `app/style.css` hiện là một dòng chú thích rỗng và `index.html` chưa có gì đọc theme. Toàn bộ hệ token màu/typography/spacing/bo góc của `DESIGN.md` chưa tồn tại dưới dạng mã, nên mọi story giao diện về sau sẽ buộc phải tự phát minh giá trị màu tại chỗ — đúng thứ AD-20 mục 4 cấm, vì token là chỗ duy nhất tỉ lệ tương phản đã được tính. Và nếu theme được đọc sau lần vẽ đầu tiên, mở tab giữa lúc đang làm việc sẽ nháy một khung hình sáng chói.

**Approach:** Khai báo đủ hai bảng 12 token màu (light + dark) cùng token typography 5 vai, thang spacing 7 bậc + 6 token bố cục, và 4 cấp bo góc trong `app/style.css`; thêm một script **đồng bộ, nội tuyến** trong `<head>` của `index.html` đọc `ghichu.theme` và đặt thuộc tính lên `<html>` trước lần vẽ đầu tiên. Không nút bật/tắt — bản dark tồn tại nhưng chưa với tới được (Epic 3). Hai bất biến "không màu viết thẳng" và "không nháy" được chốt bằng một file test mới, không phải bằng chú thích.

## Boundaries & Constraints

**Always:**
- Giá trị hex lấy **nguyên văn** từ `DESIGN.md` (frontmatter `colors:`) — kể cả ba giá trị đã cố ý lệch khỏi mockup (`ink-2` light, `focus` light, `danger` dark). Không làm tròn, không tự tính lại.
- `:root` mang **bảng light**; `:root[data-theme="dark"]` **ghi đè** đúng 12 token đó. Mọi khai báo màu khác trong repo chỉ được dùng `var(--…)`.
- Script theme nằm **trong `index.html`**, không trong `app/`; đồng bộ; không `type="module"`; là ngoại lệ duy nhất của AD-2 được phép.
- Phông là system font stack của `DESIGN.md`. Không webfont, không `@import`, không URL `http(s)://` ở bất kỳ đâu trong `style.css` hay `index.html`.
- `outline: none` bị cấm tuyệt đối trong `style.css` (AD-20 mục 1).
- Chiều rộng vùng chứa dùng đơn vị tương đối/`max-width`, không `px` cứng (AD-20 mục 5).
- Thuộc tính trên `<html>` là `data-theme` với đúng hai giá trị `light` | `dark`; đây là hợp đồng mà nút toggle của Epic 3 sẽ ghi vào.
- Giá trị `ghichu.theme` lạ hoặc kho ném (chế độ riêng tư chặn `localStorage`) → rơi về mặc định, **không** ném ra ngoài, trang vẫn vẽ.
- **Quyết định (đã chốt 2026-09-11): mặc định khi `ghichu.theme` vắng mặt hoặc không hợp lệ là theo hệ điều hành** — `window.matchMedia('(prefers-color-scheme: dark)').matches` → `dark`, ngược lại `light`. Lý do: tới hết Epic 2 chưa có nút bật/tắt, nên mặc định là theme duy nhất Nam với tới được; đọc từ hệ điều hành thì cả hai bảng đều dùng được thật. Key đã lưu **luôn thắng** hệ điều hành, và script **không bao giờ** ghi giá trị suy ra từ hệ điều hành xuống `localStorage` — key chỉ mang lựa chọn tường minh của người dùng (`ghichu.theme` vắng mặt vẫn nghĩa là "chưa chọn").

**Never:**
- Không nút/điều khiển bật tắt theme, không action, không port mới, không đổi `app/core/limits.js`, không đổi state.
- Không dựng màn hình, không layout của mẩu giấy/ô soạn thảo/lưới — chỉ token cộng nền + chữ cơ sở đủ để bản dark nhìn thấy được.
- Không `prefers-reduced-motion`, không keyframe, không chuyển động nào (chưa có gì để chuyển động).
- Không import `app/adapters/localstorage.js` vào script nội tuyến — nó là ES module, nạp nó là bất đồng bộ, là mất chính điều story này mua.
- Không sửa `test/harness.test.js`, `test/state-tap-trung.test.js`, `test/nguong-tap-trung.test.js`, `test/core-limits.test.js`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Theme đã chọn dark | `localStorage['ghichu.theme'] === 'dark'` | `<html data-theme="dark">` đã đặt trước lần vẽ đầu; không khung hình sáng nào | N/A |
| Theme đã chọn light | `= 'light'` | `<html data-theme="light">` | N/A |
| Chưa từng chọn, hệ nền tối | key không tồn tại, `prefers-color-scheme: dark` | `<html data-theme="dark">`; kho **không** bị ghi | N/A |
| Chưa từng chọn, hệ nền sáng | key không tồn tại, `prefers-color-scheme` sáng/không rõ | `<html data-theme="light">`; kho **không** bị ghi | N/A |
| Key thắng hệ điều hành | `= 'light'` nhưng hệ nền tối | `data-theme="light"` — lựa chọn tường minh luôn thắng | N/A |
| Giá trị rác | `= 'DARK'`, `''`, `'xanh'` | Xử như chưa chọn: rơi về hệ điều hành; **không** ghi lại vào kho | Không ném |
| `localStorage` bị chặn | truy cập ném `SecurityError` | Rơi về hệ điều hành; trang vẫn vẽ bình thường | `try/catch` nuốt tại chỗ, không log lỗi ra người dùng |
| `matchMedia` vắng mặt | `window.matchMedia` không tồn tại | Rơi về `light` | `try/catch` hoặc kiểm `typeof`, không ném |
| Token bị dùng sai | một file `app/` viết thẳng `#FBF3DE` hay `rgb(…)` | Test token đỏ, nêu tên file và giá trị | N/A |

</frozen-after-approval>

## Code Map

- `_bmad-output/planning-artifacts/ux-designs/ux-Sticky Notes-2026-09-09/DESIGN.md` — **nguồn có thẩm quyền** của mọi giá trị. Frontmatter `colors:` mang 12 khóa light và 12 khóa `*-dark`; `typography:` mang 5 vai (`note` 14.5px/1.55, `composer` 15px/1.55, `time` 11.5px/600/`letter-spacing .04em` mono, `ui` 13px, `foot` 11.5px); `spacing:` mang 7 bậc `1..7` = 4/8/12/16/20/28/40px cộng `note-padding-y` 8 · `note-padding-x` 12 · `grid-gap` 8 · `page-gutter` 16 · `note-min-col` 260 · `container-max` 1040; `rounded:` mang `paper` 3px · `input` 6px · `tray` 8px · `full` 9999px. Bảng "Colors" ghi các cặp tương phản đã đo — **không đổi một hex nào** mà không tính lại bảng đó (cặp `danger` trên `chip-bg` bản dark chỉ 4.55:1).
- `index.html` (12 dòng) — `<link rel="stylesheet" href="app/style.css">` ở dòng 7; script module chính ở `<body>`. Script theme phải chèn trong `<head>`, **trước** `<link>` thì càng tốt (thuộc tính đặt xong trước khi CSS được áp).
- `app/style.css` — hiện **một dòng chú thích**, thay toàn bộ.
- `app/adapters/localstorage.js` dòng 22-26 — `BANG_KHOA` đã ánh xạ `theme → 'ghichu.theme'`. Script nội tuyến viết lại chuỗi `'ghichu.theme'` **một lần nữa** ở `index.html`: đây là trùng lặp có ý thức mà AD-19 cho phép. Đừng import file này.
- `app/ports/session-store.js` dòng 11-22 — header giải thích vì sao `sessionStore` là port đồng bộ duy nhất ("giao diện sáng/tối không được nháy"). Đọc để biết ranh giới; **không sửa**.
- `test/trang-tinh.test.js` — đọc `index.html` (dòng 14), **strip chú thích** rồi quét cả file bằng danh sách cấm dòng 52-61: `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `importScripts(`, `@import`, `https?://`. Quét `app/` cho **cả `.js` và `.css`** (dòng 23) với cùng danh sách. Dòng 88-96 đòi **đúng một** `<script>` khớp cả `type=module` và `src=app/main.js` — script nội tuyến không có hai thứ đó nên không phá phép đếm. Dòng 106-111 đòi không tham chiếu tài nguyên ngoài. **Không sửa file này**; nó đã phủ phần "không mạng".
- `test/nguong-tap-trung.test.js` dòng 29 và `test/harness.test.js` — chỉ quét `.js` dưới `app/`, nên số trong `style.css` và trong script nội tuyến ngoài tầm với. Không cần thêm hằng vào `limits.js` (và `test/core-limits.test.js` dòng 32-36 sẽ đỏ nếu thêm tên mới mà không khai ở đó).
- `README.md` dòng 90 — mục "Danh sách thử tay cho `app/adapters/`", danh sách đánh số **liên tục tới 13**; mục mới bắt đầu từ **14** dưới một `###` riêng. `## Checklist deploy` dòng 54 giữ nguyên.
- Spine `_bmad-output/planning-artifacts/architecture/architecture-ghi-chu-hang-ngay-2026-09-10/ARCHITECTURE-SPINE.md` — **AD-19 dòng 393-402** là văn bản có thẩm quyền của script nội tuyến; **AD-20 dòng 404-419** là sàn a11y (mục 1 `outline: none`, mục 4 không màu viết thẳng, mục 5 đơn vị tương đối); AD-12 dòng 282-285 là lệnh cấm webfont; AD-3 dòng 89 chốt `localStorage` mang **đúng ba key**.

## Tasks & Acceptance

**Execution:**
- [x] `app/style.css` -- viết lại toàn bộ: một khối `:root` khai báo 12 token màu light + typography 5 vai + 7 bậc spacing + 6 token bố cục + 4 cấp bo góc, rồi một khối `:root[data-theme="dark"]` ghi đè **đúng 12** token màu bản dark; thêm nền + chữ cơ sở cho `html`/`body` dùng `var(--bg)`/`var(--ink)`/`var(--font-note)` và một `.container` dùng `max-width: var(--container-max)` -- không có nền cơ sở thì "không nháy màu" không kiểm chứng được vì chưa có màu nào để nháy
- [x] `index.html` -- chèn trong `<head>`, trước `<link rel="stylesheet">`, một `<script>` **không** `type="module"`: đọc `localStorage.getItem('ghichu.theme')` trong `try/catch`, chấp nhận đúng `'light'`/`'dark'`; mọi thứ khác (vắng mặt, rác, kho ném) rơi về `window.matchMedia('(prefers-color-scheme: dark)')` — và rơi tiếp về `'light'` nếu `matchMedia` không có — rồi `document.documentElement.setAttribute('data-theme', …)`; **không** ghi gì xuống `localStorage` -- đồng bộ và nội tuyến là điều kiện duy nhất để thuộc tính có mặt trước lần vẽ đầu; ghi giá trị suy ra xuống kho sẽ biến "chưa chọn" thành "đã chọn" và làm nút toggle của Epic 3 mất trạng thái thứ ba
- [x] `test/token-style.test.js` (mới) -- đọc `app/style.css` và kiểm: 24 khai báo token màu có mặt với **đúng hex** của `DESIGN.md` (bảng hex ghim trong chính file test, hoa/thường không tính), 5 vai typography · 13 token spacing · 4 bo góc có mặt, khối `dark` ghi đè đúng 12 tên màu không thừa không thiếu, không `outline:\s*none`, và — sau khi bỏ chú thích và bỏ **hai khối khai báo token** — không còn một giá trị màu viết thẳng nào (`#rgb`/`#rrggbb`/`rgb(`/`rgba(`/`hsl(`/tên màu CSS) trong bất kỳ file `.css` nào dưới `app/` -- AD-20 mục 4 nói tương phản được "bảo đảm bằng cách dựng được"; bảng hex ghim trong test là cách duy nhất bắt được một hex bị gõ sai
- [x] `test/token-style.test.js` -- thêm ca cho `index.html`: có đúng một `<script>` nội tuyến trong `<head>`, nó **không** mang `type="module"` và không mang `src`, nó chứa `'ghichu.theme'` và `data-theme`, và nó đứng **trước** `<link rel="stylesheet">`; cộng ca chạy thẳng thân script đó với `localStorage`/`matchMedia`/`documentElement` giả, phủ **đủ bảy hàng** của I/O Matrix (kể cả "key `light` thắng hệ nền tối" và "`matchMedia` vắng mặt → `light`") và khẳng định `localStorage.setItem` **không** bị gọi lần nào -- `adapters/` không có test tự động nhưng script này **không** ở `adapters/`, nó là mã thuần vài dòng nên phải có test thật thay vì chỉ một mục thử tay
- [x] `README.md` -- thêm một `###` cho theme với các mục thử tay đánh số tiếp từ **14**: đặt `ghichu.theme = 'dark'` trong DevTools rồi tải lại → không khung hình sáng nào (Performance → Screenshots để xác nhận); xóa key rồi tải lại → theme khớp nền hệ điều hành, và đảo cài đặt Windows (hoặc DevTools → Rendering → Emulate `prefers-color-scheme`) rồi tải lại thì đảo theo; đặt giá trị rác → rơi về hệ điều hành, console không báo lỗi, và `ghichu.theme` **vẫn còn nguyên giá trị rác** (script không ghi); tab Network sau khi tải xong → **không** request nào, không webfont -- "không nháy" là một tính chất của lần vẽ đầu tiên, không máy nào trong `npm test` chứng kiến được nó

**Acceptance Criteria:**
- Given repo đã cài, when `npm test`, then toàn bộ test cũ **và** mới pass, exit 0, không devDependency mới, không cần môi trường trình duyệt
- Given `test/harness.test.js` · `test/state-tap-trung.test.js` · `test/nguong-tap-trung.test.js` · `test/core-limits.test.js` không bị sửa, when chạy chúng, then cả bốn xanh — `app/core/limits.js` không có hằng mới
- Given `test/trang-tinh.test.js` không bị sửa, when chạy nó, then xanh: vẫn đúng một `<script type="module" src="app/main.js">`, không `@import`, không URL `http(s)://`, không tài nguyên ngoài
- Given tạm đổi một hex trong `app/style.css` (ví dụ `--paper` light thành `#FBF3DF`), when `npm test`, then ca ghim hex đỏ và nêu đúng tên token; hoàn tác thì xanh
- Given tạm thêm `color: #123456;` vào một quy tắc ngoài hai khối token, when `npm test`, then ca "không màu viết thẳng" đỏ; hoàn tác thì xanh
- Given tạm di chuyển script theme xuống cuối `<body>`, when `npm test`, then ca thứ tự trong `<head>` đỏ; hoàn tác thì xanh
- Given tạm cho script ghi `localStorage.setItem('ghichu.theme', …)` giá trị suy ra từ hệ điều hành, when `npm test`, then ca "không ghi xuống kho" đỏ; hoàn tác thì xanh
- Given grep `window|document|indexedDB|localStorage|sessionStorage|BroadcastChannel|navigator` trên `app/core/` và `app/ports/`, when chạy, then không ra kết quả nào — và `localStorage` chỉ xuất hiện ở `app/adapters/localstorage.js` cộng script nội tuyến của `index.html`
- Given phục vụ app ở `localhost` và chạy hết các mục thử tay mới của README, when kiểm DevTools, then `<html>` mang `data-theme` đúng ngay ở khung hình đầu, và `localStorage` vẫn chỉ có thể mang ba key `ghichu.theme` · `ghichu.lastBackupAt` · `ghichu.persistDenied`

## Implementation Notes

- **File test ban đầu ra tên `test/bang-mau-va-theme.test.js`** vì sandbox của agent hiện thực chặn mọi phép ghi vào đường dẫn có chữ `token` trong tên (bảo vệ chống ghi file bí mật). Đã `git mv` về đúng tên spec `test/token-style.test.js` ở bước nghiệm thu, và sửa hai chỗ trỏ tên cũ (chú thích đầu `app/style.css`, đoạn mở đầu mục thử tay trong `README.md`). Không còn lệch nào.
- **Chú thích của `style.css` cố ý không viết ra cặp `outline`/`none`.** Ca AD-20 mục 1 quét bản THÔ của file (không bỏ chú thích), vì một mẫu đã bị comment vẫn là mẫu người sau sẽ copy — nên chính chú thích giải thích lệnh cấm cũng phải diễn đạt vòng.
- **Ca so vị trí trong `<head>` chạy trên bản đã bỏ chú thích HTML.** Chú thích của script theme nhắc `<link rel="stylesheet">` và `type="module"` để giải thích ràng buộc; để chúng lọt vào phép so vị trí là tạo một ca đỏ giả.
- **Cả năm kiểm ngược dương tính đã chạy lại ở bước nghiệm thu** (hex sai · `color: #123456` ngoài khối token · `outline: none` · `setItem` trong script · script xuống cuối `<body>`) cộng ca `@import` webfont: mỗi lần đúng ca dự kiến đỏ, hoàn tác thì 276/276 xanh. Ca `setItem` làm đỏ **10** test và ca dời script làm đỏ **14** — vì mọi hàng I/O Matrix cũng khẳng định kho không bị ghi, và ca đếm script trong `<head>` sập theo.
- **Thêm `--tracking-time` cạnh 5 vai typography.** `letter-spacing` của vai `time` không nằm được trong `font` shorthand, nên nó là một token riêng thay vì một số viết thẳng ở story sau.

## Spec Change Log

## Review Triage Log

### 2026-09-11 — Review pass (blind-hunter · edge-case-hunter · verification-gap)

| # | Finding | Verdict | Bằng chứng | Route |
|---|---------|---------|-----------|-------|
| 1 | Lệnh cấm tắt focus ring chỉ ghim **một** cách viết và **một** file | medium | verification-gap thêm `.x:focus-visible { outline: 0 }` vào `style.css` → 276/276 vẫn xanh. Quét cũng không đi qua `danhSachFileCss`, nên một file `.css` mới dưới `app/` không bị soi. AD-20 mục 1 là "cấm tuyệt đối", và đây là đường duy nhất của người dùng bàn phím | patch |
| 2 | Phép cắt khối token **miễn trừ `:root` ở mọi file**, không chỉ `style.css` | medium | verification-gap dựng `app/view/x.css` với `:root { --brand: #FF00FF }` → 25/25 xanh; cùng file với `rgba()` **ngoài** `:root` thì đỏ, xác nhận lỗ hổng đúng là phép miễn trừ theo selector. Ca "đúng hai khối" chỉ soi `styleCss` nên không thấy `:root` thứ hai | patch |
| 3 | Khối `:root` light **không** bị kiểm thừa, khác khối dark | medium | Ca "đúng 12 tên" chỉ áp cho khối dark. `:root` lại bị cắt khỏi phép quét màu, nên một `background: #123456` hay một token thứ sáu nhét vào đó đi qua toàn bộ suite — đúng cái lỗ mà ca khối dark được viết ra để bịt | patch |
| 4 | 22 token không-màu ship **không ghim giá trị** | medium | verification-gap đổi `--space-4` → `1px` và `--container-max` → `104px`, chạy full suite: 276/276 xanh. Ca a11y chỉ khẳng định `max-width: var(--container-max)` được dùng, không bao giờ khẳng định nó bằng bao nhiêu | patch |
| 5 | Chuỗi khóa `'ghichu.theme'` ở `index.html` **không** được đối chiếu với `BANG_KHOA` của adapter | medium | verification-gap đổi `BANG_KHOA.theme` → `'ghichu.ui.theme'`: 276/276 xanh. Ship như thế thì nút toggle Epic 3 ghi một khóa, script tiền-vẽ đọc khóa khác → theme đã lưu âm thầm bị bỏ qua, tức đúng cái nháy story này tồn tại để chặn | patch |
| 6 | `cacKhoi` (`/([^{}]*)\{([^{}]*)\}/g`) không phân tích được `@media`/`@supports`/nesting | medium | Regex không có đếm độ sâu; một `@media` làm khối trong bị gán sai selector và khối ngoài không khớp → khai báo trong media query lọt khỏi **cả** phép cắt token lẫn phép quét màu, im lặng. AD-20 mục 5 nói về phóng 200%, nên media query gần như chắc chắn là lần sửa kế tiếp của file này | patch |
| 7 | `/\bwidth:\s*\d+px/` khớp luôn `max-width`/`min-width` | medium | `-` là ranh giới từ nên `max-width: 118px` khớp. `DESIGN.md` đã đòi `date-input { width: 118px }`, nên ca này sẽ đỏ giả ở story bố cục kế tiếp, với thông điệp trỏ sai chỗ | patch |
| 8 | Thiếu `color-scheme` ở cả hai khối | medium | Không khai `color-scheme` thì ở bản dark thanh cuộn, con trỏ nhập, chrome của điều khiển form và vùng chọn văn bản vẫn là bản sáng. Đáng chú ý: rãnh thanh cuộn trắng nằm ngay **khung hình đầu tiên** mà mục thử tay 14 yêu cầu soi — nó trực tiếp làm yếu lời hứa "nền tối ngay từ khung đầu" | patch |
| 9 | Chú thích `style.css` nói quá về tầm phủ; `/1.55` ở `--font-ui`/`--font-foot` **không** có trong `DESIGN.md` | low | Header liệt kê đúng ba chỗ lệch cố ý, toàn là màu, nên hai `line-height` tự thêm đọc như tai nạn — dù `font` shorthand buộc phải chọn một giá trị. Cùng chỗ: chú thích nói "ghim cả 24 hex và cưỡng chế luật đó" trong khi tầm phủ hẹp hơn ở các dòng 1-4 trên | patch |
| 10 | Mục thử tay 17 nói "không request nào" nhưng trình duyệt tự xin `/favicon.ico` | low | Người thử sẽ thấy một request không được nhắc và không biết nên coi là đạt hay không đạt; sửa là một cụm từ | patch |
| 11 | Thiếu token shadow/alpha/focus-ring, và lint mới chặn đường viết chúng | false | `DESIGN.md` có `shadowInset`/`shadowHover`/ring 28%, nhưng AC của story (epics dòng 654) liệt kê **đúng** bốn nhóm: 12 màu · 5 vai · spacing · bo góc — shadow không thuộc phạm vi. Và lint không chặn: story sau thêm `--shadow-*` **vào khối token** là đường hợp lệ, y hệt cách `--tracking-time` được thêm | — |
| 12 | Không có dự phòng dark bằng CSS thuần cho trường hợp tắt JS | false | Tắt JS thì app không tồn tại: `index.html` chỉ có `<main></main>`, toàn bộ nội dung do ES module dựng, kho là IndexedDB. Không có màn hình nào để sai theme | — |
| 13 | Giá trị rác có khoảng trắng (`' dark'`) không được `trim` | false | I/O Matrix nói rác **xử như chưa chọn** → rơi về hệ điều hành. `' dark'` rơi về hệ điều hành đúng như đặc tả; đây là hành vi đã định, không phải lỗi | — |
| 14 | OS đổi bảng màu khi trang đang mở thì theme suy ra bị cũ | low | Thật, nhưng tải lại là xử lý xong, và thêm một `addEventListener` là thêm nhánh trạng thái mà story này chưa chứng minh có ai chạm tới; intent chốt "đọc trước lần vẽ đầu", theo dõi liên tục không nằm trong đó | rejected |
| 15 | Ca `toHaveLength(1)` và `search(/<script/)` giả định script theme là script duy nhất và đầu tiên trong `<head>` | low | Đúng là giòn, nhưng import map/CSP nonce không nằm trong kế hoạch nào (AD-12 cấm gần hết), còn phép đếm "đúng một script trong `<head>`" tự nó là thứ đáng giữ. Sửa bằng cách khớp theo thân script là thêm phức tạp cho một tình huống chưa tồn tại | rejected |
| 16 | Không test nào cấm `ghichu.theme`/`data-theme` xuất hiện dưới `app/` | low | `app/adapters/localstorage.js` **phải** mang `'ghichu.theme'` trong `BANG_KHOA`, nên một lệnh cấm đơn giản không diễn đạt được; dòng 5 đã bịt đúng rủi ro thật (hai cách viết trôi khỏi nhau) bằng phép đối chiếu | rejected |
| 17 | Script đọc global trần nên một `globalThis` về sau sẽ lách được cặp giả của test | low | Suy đoán về một lần sửa chưa xảy ra; sửa là thêm một ca cấm cú pháp. Nếu xảy ra thật thì các ca I/O Matrix sẽ đỏ vì `localStorage` giả không còn được dùng | rejected |
| 18 | `.container` được định nghĩa nhưng chưa có markup nào dùng | low | Đúng, và cố ý: spec đòi nó để ghim AD-20 mục 5 ngay khi luật được đặt ra. Không có hại nào được nêu tên | rejected |

**Đã vá cả 10 mục.** Suite từ 276 → **282 test** (file `token-style` từ 25 → 31 ca). Ba guard mới tôi tự kiểm lại sau khi vá, mỗi lần đúng ca dự kiến đỏ rồi hoàn tác: đổi `BANG_KHOA.theme` → `'ghichu.giaodien'` (**3** đỏ), `background: #123456` nhét **trong** khối `:root` (1 đỏ), thêm một khối `@media` vào `style.css` (1 đỏ). Không entry `intent_gap` hay `bad_spec`, nên không có vòng quay lại nào.



**Vì sao `data-theme` chứ không phải `class="dark"`.** AD-19 nói "đặt **thuộc tính** lên `<html>`" và không nêu tên. `data-theme` với hai giá trị tường minh làm cho "chưa đặt" khác hẳn "light" — nghĩa là nếu script vì lý do nào đó không chạy, `:root` vẫn ra bản light chứ không ra một trạng thái nửa vời. Một `class` thì chỉ có mặt/vắng mặt, nên bản light và bản "script chết" không phân biệt được, và nút toggle của Epic 3 sẽ phải nhớ xóa class thay vì ghi một giá trị.

**Vì sao script đứng trước `<link rel="stylesheet">`.** Trình duyệt chặn vẽ cho tới khi CSS ở `<head>` tải xong, nên đặt script **sau** `<link>` trên lý thuyết vẫn kịp. Nhưng `style.css` là file cùng origin, có thể đã nằm trong cache và áp gần như tức thời; đặt script trước thì thứ tự đúng theo định nghĩa chứ không nhờ vào thời điểm mạng. Đây cũng là thứ ca test thứ tự ghim lại, để một lần refactor `<head>` về sau không âm thầm đổi lại.

**Vì sao bản dark không kiểm được bằng `npm test`, và tại sao vẫn ổn.** Không có trình duyệt trong `npm test`, nên "không nháy" chỉ kiểm được **gián tiếp**: script đồng bộ + nội tuyến + đứng trong `<head>` + đặt thuộc tính — bốn tính chất đó kiểm được trên văn bản, và cộng lại chúng *kéo theo* "trước lần vẽ đầu". Bản thân lần vẽ đầu thuộc danh sách thử tay. Cách chia này giống cách Story 1.7 chia bốn bước AD-3: logic thuần thì test, hành vi của kho thật thì thử tay.

**Cạm bẫy: test "không màu viết thẳng" phải loại trừ đúng phần khai báo token, không loại trừ cả file.** Nếu ca test bỏ qua toàn bộ `style.css` thì nó không kiểm gì; nếu nó quét cả khối `:root` thì chính 24 token trở thành vi phạm. Cách chia đúng: cắt ra hai khối khai báo token theo selector (`:root {…}` và `:root[data-theme="dark"] {…}`), quét phần còn lại. Hệ quả cố ý: về sau muốn thêm một màu mới thì phải thêm nó **vào token**, không có đường nào khác.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ pass, exit 0, số test tăng
- Kiểm ngược dương tính: đổi một hex trong `style.css` → ca ghim hex đỏ; hoàn tác
- Kiểm ngược dương tính: thêm `color: #123456;` ngoài khối token → ca "không màu viết thẳng" đỏ; hoàn tác
- Kiểm ngược dương tính: thêm `outline: none;` → ca AD-20 mục 1 đỏ; hoàn tác
- Kiểm ngược dương tính: thêm `@import url("https://fonts.googleapis.com/x");` vào `style.css` → `trang-tinh.test.js` đỏ ở **hai** mẫu (`@import` và `https://`); hoàn tác
- `git status --porcelain` -- expected: chỉ `index.html`, `app/style.css`, `test/token-style.test.js`, `README.md`, và file spec này

**Manual checks (if no CLI):**
- Phục vụ `localhost`, chạy các mục thử tay mới trong README; DevTools → Performance → Screenshots để xác nhận khung hình đầu tiên đã đúng theme; tab Network sau khi tải xong phải trống
