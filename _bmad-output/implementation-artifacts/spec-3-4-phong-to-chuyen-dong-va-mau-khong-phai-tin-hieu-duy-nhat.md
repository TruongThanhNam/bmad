---
title: 'Story 3.4 — Phóng to, chuyển động, và màu không phải tín hiệu duy nhất'
type: 'feature'
created: '2026-09-15'
status: 'done'
route: 'dispatch'
baseline_commit: '0c808956796e946a2f096a77208803ad1c7b80f2'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ba mục cuối của sàn a11y (AD-20 mục 5, 6) mới chỉ được **khai trong chú thích**: `style.css` hôm nay không có chuyển động nào và không có `:hover` nào, nhưng **không một ca nào** giữ nó ở trạng thái đó — ngày mai một `transition: all .3s` hay một `.x:hover { display: block }` vào được mà suite vẫn xanh. Cùng dáng ấy: `--danger` đã có trong cả hai bảng token nhưng **chưa áp vào selector nào**, nên luật "màu không bao giờ là tín hiệu duy nhất" chưa có người canh đúng lúc Epic 6 sắp thêm viền lỗi ô ngày. Và AC phóng 200% chỉ có mục thử tay số 18 đứng sau — ca harness 500px sẵn có bơm **ô giả không chữ**, nên nó chưa từng hỏi "có chữ nào bị cắt không".

**Approach:** Không thêm tính năng nào. Biến ba lời hứa thành ba lệnh cấm **grep được**, cộng một khối harness đo reflow ở khung nhìn tương đương 200% với **ghi chú thật**.

## Boundaries & Constraints

**Always:**
- `style.css` giữ **không một chuyển động nào và không một at-rule nào**. Mặc định tĩnh không phải là bước đệm — nó là trạng thái cuối của story này.
- Mọi ca quét nguồn đi qua `boChuThich*` của `test/helpers/quet-nguon.js`, đúng khuôn đang dùng.
- Phép đo "tương đương 200%" chạy trên **ghi chú thật** bơm qua app, không qua `BOM_O`.
- Lệnh cấm mới phải **nêu tên chỗ vi phạm** khi đỏ, không chỉ `expect(false)`.

**Never:**
- Không thêm `@media`, `@supports`, `@keyframes`, `transition`, `animation` — kể cả một khối `prefers-reduced-motion` rỗng "để sẵn".
- Không nới lệnh cấm at-rule ở `test/token-style.test.js`, không sửa `cacKhoi` ở bất kỳ file nào — bộ quét một tầng giữ nguyên giả định của nó.
- Không đụng `bo-cuc-bon-tang.test.js:117-131` (chặn breakpoint) và không đụng `focus-va-tab.test.js`.
- Không thêm trạng thái lỗi ô ngày, không thêm chip — đó là Epic 5/6. Story này chỉ dựng cái bẫy đón chúng.
- Không đổi một hex, một token, một luật CSS nào đang có.

## Quyết định đã chốt

- **QĐ-1 — Tĩnh tuyệt đối, không dựng khối `@media`.** AC "mọi transition nằm trong một khối `prefers-reduced-motion: no-preference`" được thỏa mãn **rỗng** và được ghim bằng vế mạnh hơn: cấm `transition`/`animation` ở **mọi** file dưới `app/`. Đổi lấy: AC "chuyển màu ≤ 120ms khi được phép" không có gì để đo — chấp nhận, vì không có chuyển màu nào tồn tại. Lợi: lệnh cấm at-rule của `token-style.test.js` (thứ bảo vệ bộ quét CSS một tầng khỏi mù trong im lặng) **không phải nới**, và năm bản `cacKhoi` không phải viết lại.
- **QĐ-2 — Phóng 200% nghiệm thu bằng phép đo tương đương reflow**, không bằng zoom thật: 200% chia đôi khung nhìn CSS trong khi cỡ chữ giữ nguyên — đúng thứ `datKhungNhin` dựng lại được. Khổ đo là **550×400** (200% của cửa sổ 1100×800, tức "cửa sổ cỡ thường" của mục thử tay 18): ranh giới 2↔1 cột là hệ quả số học của token, đúng **560px** (`2×260 + 8 + 2×16`), nên 640px vẫn còn **2 cột** — hành vi đã ghim, không phải khiếm khuyết. Mục thử tay số 18 **ở lại** README làm vế mắt nhìn.

- **QĐ-3 — Giữ nguyên spec đầy đủ** dù vượt ngưỡng 1.600 token; phần lớn độ dài là Code Map dạng tra cứu, đúng tiền lệ Story 3.1–3.3.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Khung nhìn 550×400, có ghi chú thật | 3 ghi chú, chữ dài lẫn ngắn | Lưới **1 cột**; không cuộn ngang trang; mọi phần tử `.tang *` nằm trong 550px | N/A |
| Chữ bị cắt ngang | cùng trên | Không phần tử mang chữ nào có `scrollWidth > clientWidth + 1` | Bỏ qua `.o-soan` và `.tang-luoi` — cuộn là hành vi đã ghim |
| Ai đó thêm chuyển động | `transition: color .3s` vào `style.css` | Ca đỏ, nêu đúng tên file và chuỗi vi phạm | N/A |
| Ai đó thêm hover-only | `.mau-xoa:hover { opacity: 1 }` | Ca đỏ, nêu đúng selector | N/A |
| Ai đó dùng `--danger` làm tín hiệu | `border-color: var(--danger)` trên một selector mới | Ca đỏ, đòi selector được khai vào danh sách kèm chỗ đứng của **chữ** đi cùng | N/A |
| Tương tác bị cấm | `draggable`, `dragstart`, `contextmenu`, `IntersectionObserver` trong `app/` hoặc `index.html` | Ca đỏ, nêu tên file và từ khóa | N/A |

</frozen-after-approval>

## Code Map

- `app/style.css:281-284` — chú thích "không một `@media` nào, và đó là điều kiện chứ không phải sự thiếu sót". Nói về **breakpoint**; story này nới nghĩa nó ra thành cả chuyển động. Sửa chú thích, **không** sửa luật nào.
- `app/style.css:465-470` (`.luoi`) — `repeat(auto-fill, minmax(var(--note-min-col), 1fr))`; đã đúng, **không sửa**.
- `app/style.css:153-154` (`.container`) — `width: 100%` + `max-width: var(--container-max)`; đã đúng.
- `app/style.css:195-203`, `:370-373` — vòng sáng `:focus-visible`, chỗ duy nhất một `transition` có thể bị cám dỗ thêm vào. Giữ trần.
- `app/style.css:252-256`, `:514-516` — hai chú thích đã nói rõ "hiện sẵn, không chờ chuột"; ca cấm `:hover` là thứ **cưỡng chế** chúng.
- `app/style.css:56`, `:124` — `--danger` khai ở cả hai bảng, **chưa dùng ở đâu**. Đó là trạng thái ca mới ghim.
- `test/token-style.test.js` — ca `'không file .css nào có at-rule hay lồng ngoặc'` và `'AD-20 mục 5'` (`width: \d+px`). **Không sửa file này.** Đọc để không viết trùng.
- `test/helpers/quet-nguon.js:128,133,138` — `boChuThichCss` / `boChuThichHtml` / `boChuThich(duongDan, ma)`. Khuôn bắt buộc.
- `test/bo-cuc-bon-tang.test.js:19-20` — khuôn đọc file + bỏ chú thích; `:104-115` ghim lưới/lề; `:117-131` chặn breakpoint. **Không sửa.**
- `test/state-tap-trung.test.js` — khuôn "ca quét nguồn toàn cây" gần nhất để bắt chước (duyệt thư mục, gom `viPham`, `expect(viPham).toEqual([])`).
- `tools/thu-bo-cuc.mjs:19-22` (`ghi`), `:146-151` (`datKhungNhin`), `:40-45` (`DEM_COT`), `:47-56` (`DO_CUON`), `:340-365` (ca 500px **ô giả** — mẫu gần nhất, và đúng chỗ nói rõ vì sao không đo được zoom thật), `:826-833` (vòng chờ ổn định của Story 3.3), `:1869` (`} finally {` — khối Story 3.4 chèn ngay trước).
- `tools/thu-bo-cuc.mjs:562,576-588,728` — khuôn bơm **ghi chú thật** qua app rồi đọc `store.state.notes`.
- `README.md:294-297` (ghi chú "không đo được zoom thật"), `:306-308` (mục thử tay 18).
- `_bmad-output/planning-artifacts/epics.md:1019-1055` — AC nguyên văn Story 3.4.

## Tasks & Acceptance

**Execution:**
- [x] `test/chuyen-dong-va-tin-hieu.test.js` — **file mới**, bốn nhóm ca quét nguồn (đọc qua `boChuThich`, gom `viPham` nêu tên file + chuỗi vi phạm):
  (a) **Chuyển động:** không `transition`/`animation`/`@keyframes`/`scroll-behavior: smooth` ở bất kỳ `.css` nào dưới `app/`; không `.style.transition`/`.animate(`/`requestAnimationFrame` ở bất kỳ `.js` nào dưới `app/`; không `<style>`/`style="…"` mang chúng trong `index.html`. Kèm chú thích nêu QĐ-1 và nói rõ: khối `@media (prefers-reduced-motion)` **chưa tồn tại**, nên lệnh cấm này là vế mạnh hơn của AC, không phải vế thay thế.
  (b) **Không hover-only:** không một `:hover` nào trong `app/**/*.css` — trỏ về hai chú thích `style.css:252-256`, `:514-516`.
  (c) **Màu không phải tín hiệu duy nhất:** một danh sách `DUNG_DANGER` trong file test, **hôm nay rỗng**; mọi luật CSS dùng `var(--danger)` ngoài hai khối token phải có selector nằm trong danh sách, và mỗi mục danh sách phải kèm chuỗi ghi chỗ đứng của **chữ** đi cùng. Chú thích nói thẳng: Epic 6 thêm viền lỗi ô ngày sẽ làm ca này đỏ, và đó là mục đích.
  (d) **Tương tác bị cấm:** không `draggable`/`dragstart`/`dragover`/`drop`/`contextmenu`/`IntersectionObserver`/`pointerdown` + hẹn giờ (long-press) trong `app/**` và `index.html`.
- [x] `test/chuyen-dong-va-tin-hieu.test.js` (tiếp) — **ca tự-đột-biến**: với mỗi nhóm (a)–(d), chạy chính hàm quét trên một chuỗi giả có vi phạm và khẳng định nó **bắt được**. Không có vế này thì bốn ca trên xanh cả khi regex gõ sai.
- [x] `tools/thu-bo-cuc.mjs` — khối `── Phóng 200% (tương đương reflow) — Story 3.4 ──` chèn trước `} finally {` (`:1869`): `datKhungNhin(640, 400)`, bơm **3 ghi chú thật** qua app (khuôn `:576-588`), chờ ổn định (khuôn `:826-833`), rồi ba ca — `DEM_COT === 1`; không cuộn ngang trang và mọi `.tang *` có `right <= 640` (khuôn `:351-358`); **không chữ bị cắt**: không phần tử mang chữ riêng nào có `scrollWidth > clientWidth + 1`, trừ `.o-soan` và `.tang-luoi`. Khôi phục khung nhìn ở cuối khối.
- [x] `app/style.css:281-284` — nới chú thích: không at-rule nào, và lý do nay gồm **cả hai** — trần 3 cột là hệ quả số học của token, **và** chuyển động là thứ được thêm vào chứ không phải thứ bị gỡ ra; ai cần một khối `prefers-reduced-motion` phải nâng bộ quét một tầng của `token-style.test.js` **trước**.
- [x] `README.md` — cạnh mục thử tay 18: ghi rằng phép đo tương đương đã tự động ở `npm run thu-bo-cuc` và mục 18 còn lại là vế mắt nhìn (chữ có bị cắt ngang không, vòng sáng ở mức phóng còn là vòng không); thêm một dòng nêu luật tĩnh tuyệt đối của QĐ-1.

**Acceptance Criteria:**
- Given một `transition: color 120ms` dán vào bất kỳ luật nào của `style.css`, when `npm test`, then ca (a) **đỏ** và in ra đúng tên file cùng chuỗi vi phạm.
- Given một `.mau-xoa:hover { opacity: 1 }` dán vào `style.css`, when `npm test`, then ca (b) **đỏ** nêu đúng selector.
- Given một luật mới `.o-ngay-loi { border-color: var(--danger) }` không khai vào `DUNG_DANGER`, when `npm test`, then ca (c) **đỏ**.
- Given repo ở trạng thái hiện tại, when `npm test`, then **không ca nào** của `token-style`, `bo-cuc-bon-tang`, `focus-va-tab`, `theme` phải sửa để xanh trở lại.
- Given `npm run thu-bo-cuc`, when chạy trọn, then tổng số ca tăng đúng bằng số ca của khối mới và **mọi ca cũ vẫn xanh** — kể cả ca 500px sẵn có, nghĩa là khối mới đã trả khung nhìn về chỗ cũ.

## Implementation Notes

**Bốn file, không một luật CSS nào đổi.** `test/chuyen-dong-va-tin-hieu.test.js` (mới, 382 dòng),
`tools/thu-bo-cuc.mjs` (+151, khối cuối trước `} finally {`), `app/style.css` (chỉ chú thích
`:281`), `README.md`. **Không một file test cũ nào phải sửa** — đúng thứ AC thứ tư đòi.

**Con số 640 trong spec sai, và phép đo bắt được ngay lần chạy đầu** (`cột=2`). Ranh giới 2↔1 cột
là hệ quả số học của token, đúng **560px** (`2×260 + 8 + 2×16`) — cùng dáng với ranh giới 828px
cho 3↔2 cột mà README đã ghi. Khổ đo chuyển sang **550×400** (200% của cửa sổ 1100×800); số học
được viết vào cả chú thích harness lẫn README, nên lần đổi `--note-min-col`/`--grid-gap`/
`--page-gutter` nào cũng sẽ thấy ca này lệch. Xem Spec Change Log.

**Ba cổng đột biến được chạy thật, không chỉ suy luận.** Dán vào `style.css` cùng lúc
`transition: color 120ms`, `.mau-xoa:hover { opacity: 1 }` và `.o-ngay-loi { border-color:
var(--danger) }` → đúng ba ca đỏ, mỗi ca nêu đúng `app/style.css:408`, `:409`, `:410` kèm chuỗi
vi phạm; khôi phục xong suite xanh lại.

**Bộ quét HTML phải quét theo VÙNG, không theo cả tệp.** Quét `index.html` bằng bộ mẫu CSS sẽ đọc
một thuộc tính HTML tên `animation` thành một khai báo CSS. Nên ba cửa — khối `<style>`, thuộc
tính `style="…"`, khối `<script>` nội tuyến — được quét bằng đúng bộ mẫu của ngôn ngữ vùng đó, và
số dòng được cộng bù về số dòng THẬT trong tệp (có ca ghim đúng vế này).

**Khối harness dọn trong `finally` và trả khung nhìn về 1280×700.** Ba mẩu được chốt qua đúng
đường người dùng (`.o-soan` + `Ctrl+Enter`), tra `id` rồi xóa đúng ba `id` đó; tra không ra `id`
là NÉM chứ không bỏ qua — bỏ qua im lặng là để mẩu rác ở lại trong kho thật của người chạy. Ca
500px sẵn có vẫn xanh sau khối mới, tức khung nhìn đã thật sự được trả về.

**Nghiệm thu:** `npm test` 24 file / **545 ca** xanh · `npm run thu-bo-cuc` **70/70**.

**Rủi ro còn lại:** `test/token-style.test.js` không đọc được bằng công cụ trong phiên này
(permission deny), nên phép "không viết trùng lệnh cấm" dựa trên nội dung người dùng dán vào hội
thoại chứ không phải trên file đọc từ đĩa. File không bị sửa và đang xanh.

## Spec Change Log

**Lần 1 — khổ đo 640×400 → 550×400** (trước bước review, do phép đo thật bác bỏ con số trong
spec, không do một finding).
- *Phát hiện:* lần chạy harness đầu tiên cho `cột=2` ở 640×400.
- *Sửa:* hai chỗ trong khối đóng băng — hàng đầu I/O Matrix và QĐ-2 — đổi sang 550×400, kèm một
  câu nêu ranh giới 560px và nói rõ "640px vẫn 2 cột là hành vi đã ghim". Người dùng duyệt.
- *Trạng thái xấu tránh được:* sửa mã cho khớp con số sai, tức ghim `2 cột` ở một khổ mà AC của
  epic nói "lưới rớt về 1 cột" — vế đó sẽ không còn ai đo.
- *KEEP:* số học phải nằm trong chú thích harness và README, không chỉ trong spec — đó là thứ
  làm ca này đỏ có ích khi ai đổi token lưới.



## Review Triage Log

**Vòng 1** — ba lớp: `blind-hunter` (12 finding), `edge-case-hunter` (12 + 2 claim), `verification-gap` (2 + 3 phụ). Không entry nào là `intent_gap` hay `bad_spec` → **không loopback**.

| # | Finding | Verdict | Bằng chứng | Route |
|---|---------|---------|-----------|-------|
| 1 | Số dòng CSS báo SAI: `boChuThichCss` xóa chú thích khối mà **không giữ số dòng** | medium | Đo thật: dán vi phạm vào cuối `style.css` (dòng thật **604**) thì ca báo `app/style.css:408` — lệch ~196 dòng. Đúng thứ spec đòi ("nêu tên chỗ vi phạm") lại là thứ hỏng. Ba lớp đều không nêu; phát hiện khi đối chiếu lần chạy đột biến với `quet-nguon.js:128-130` | patch |
| 2 | `on*` nội tuyến thoát ba trong sáu mẫu tương tác | medium | Chạy thật: `/\bcontextmenu\b/.test('oncontextmenu="f()"')` → `false`, tương tự `ondragstart`, `onpointerdown` — `\b` không nổ sau chữ `n` của `on`. Chỉ `drop` có nhánh `\bondrop\b` | patch |
| 3 | Gate (b) không quét `<style>` của `index.html` | medium | `hoverTrongCss` chỉ lặp `fileCss`; gate (a) cùng file thì CÓ quét `index.html`. Một `.o-luoi:hover .mau-xoa { opacity: 1 }` dán vào `<style>` đi lọt — đúng điều khiển hover-only mà lệnh cấm sinh ra để chặn | patch |
| 4 | Vùng `<style>`/`<script>` nội tuyến được quét **THÔ** | medium | `chuyenDongTrongHtml` truyền `khop[1]` thẳng vào `quet`; chỉ chú thích HTML bị bóc. Vi phạm chính luật "Always" của spec (mọi ca quét đi qua `boChuThich*`), và một `// requestAnimationFrame` trong script nội tuyến sẽ đỏ oan | patch |
| 5 | `Math.max(...[])` = `-Infinity` → cửa "không vượt 550px" xanh im lặng | medium | Cả ba lớp nêu. `-Infinity <= 550` là `true`; `.tang` đổi tên là ca PASS mà không đo gì. Đúng dáng `NaN < 4.5` mà chính header của file dẫn từ Story 3.3 | patch |
| 6 | Vòng chờ ổn định bỏ cuộc trong im lặng | medium | Hết 10 vòng mà hai lần đọc chưa khớp thì vẫn dùng `d` cuối để chạy cả ba `ghi` — nghiệm thu trên một mẫu đang trôi | patch |
| 7 | Nửa "không thanh cuộn dọc ngoài" của mục 18 **không** được đo ở 550×400 | medium | Lớp verification-gap (tin theo hồ sơ): `DO_PHONG` chỉ trả dữ liệu chiều ngang; `DO_CUON` sẵn có chỉ được gọi ở `:260` và `:350`. Gỡ `min-block-size: 0` của `.tang-luoi` → cả ba ca mới vẫn xanh, trong khi README đã dời mệnh đề ấy ra khỏi danh sách mắt nhìn | patch |
| 8 | Prose khai file này cưỡng chế lệnh cấm khối `prefers-reduced-motion` rỗng, nhưng không mẫu nào nhắc tới nó | low | README và `style.css:281` đều nói vậy; lệnh cấm thật nằm ở `token-style.test.js`. Phép sửa là thêm mẫu, không thêm nhánh | patch |
| 9 | `style.cssText` và `setAttribute('style', …)` lọt bộ quét JS | low | Mẫu đòi tên bắt đầu bằng `transition`/`animation`. Thêm một mẫu không tốn gì — đúng lý lẽ file đã dùng để cấm trần `pointerdown` | patch |
| 10 | Nhánh danh sách cho phép của `dungDangerTrongCss` là mã chết chưa ai chạy | low | `DUNG_DANGER` rỗng, nên `some((m) => m.chon === chon)` chưa từng đúng; mục Epic 6 đầu tiên có thể không khớp chính selector của nó | patch |
| 11 | README nói `scrollWidth > clientWidth`, mã dùng `+ 1` | low | Lệch tài liệu/mã; người sau sẽ "sửa" mã cho khớp tài liệu và mất biên làm tròn 1px | patch |
| 12 | Kho thật có ghi chú trùng chữ → `notes.find(x => x.text === chu)` xóa nhầm mẩu thật | **false** | `cdp.mjs:87,93` mở trình duyệt với `--user-data-dir` là thư mục **mkdtemp mới mỗi lần chạy**, nên IndexedDB luôn rỗng — `khoTruoc` luôn 0. Không có mẩu thật nào để trùng hay để xóa nhầm | — |
| 13 | `doiSoPhong` ném sau khi chốt → mẩu không vào `idPhong`, ở lại kho | **false** | Cùng bằng chứng #12: kho là hồ sơ tạm bị vứt khi trình duyệt đóng | — |
| 14 | `MAU_HOVER` đỏ oan với `@media (hover: hover)` | **false** | Chạy thật: `/[^{};]*:hover[^{};]*/.test('@media (hover: hover) {')` → `false`. Chuỗi đó không chứa `:hover`. Và at-rule vốn đã bị `token-style` cấm | — |
| 15 | Trả khung nhìn về `1280×700` là một con số đoán | **false** | `1280×700` là quy ước của chính harness — 9 khối khác đặt đúng số đó (`:257,315,400,529,663,880,1186,1573,1654`), và mọi khối đều tự đặt khung nhìn của mình | — |
| 16 | `coChuRieng` bỏ sót chữ bị cắt nằm trong thẻ con của một wrapper | maybe-false | Nếu wrapper cắt mà con không tự tràn thì phép đo không thấy. Chưa dựng được ca chạm tới: chỗ cắt duy nhất hôm nay (`.o-luoi` của Story 2.5) cắt theo CHIỀU DỌC. Sẽ là medium nếu thật — cần một wrapper `overflow-x` ẩn với con mang chữ để chốt | defer |
| 17 | Đệ quy `danhSachFile` treo nếu có symlink vòng dưới `app/` | low | Thật về lý thuyết; repo không có symlink nào và không bước build nào tạo ra. Phép sửa thêm một nhánh cho chuyện không gặp | bác bỏ |
| 18 | `.css`/`.js` sản phẩm nằm ngoài `app/` không bị lệnh cấm chạm tới | low | `app/` + `index.html` là toàn bộ mã sản phẩm (`trang-tinh.test.js` ghim điều đó); mở rộng là nới phạm vi, không phải vá lỗ | bác bỏ |
| 19 | `chuyenDongTrongHtml` tính lệch sai khi nhóm bắt RỖNG (`<style></style>`) | low | `indexOf('')` = 0 nên quy về dòng của thẻ mở — nhưng một vùng rỗng cho **không** kết quả nào, nên không câu báo nào sai chỗ | **false** |
| 21 | `boChuThichHtml` cũng **không** giữ số dòng — cùng dáng #1, còn sót sau vòng vá | medium | Không lớp nào nêu; bắt được lúc TỰ kiểm patch #1: chèn một `<style>` ngay trước `</head>` (dòng thật **42**, vì `</head>` ở `:42`) thì cổng báo `index.html:32` — lệch đúng **10**, bằng số chú thích HTML trong file. Chạm gate (d) và cả phép tính lệch vùng của `hoverTrongHtml`/`chuyenDongTrongHtml` | patch |
| 20 | Chuẩn hóa nháy đơn/danh sách selector trước khi so với `KHOI_TOKEN` | low | `style.css` dùng nháy kép và `token-style.test.js` ghim đúng hai chuỗi selector ấy; một cách viết khác sẽ đỏ ở đó trước | bác bỏ |

## Design Notes

**Lệnh cấm rẻ hơn khối `@media`, và mạnh hơn.** AC viết dưới dạng "mọi chuyển động nằm trong một khối" vì nó giả định sẽ **có** chuyển động. Khi không có cái nào, vế đúng không phải là dựng một cái khối rỗng cho khớp câu chữ — mà là cấm hẳn, vì "không transition nào ở đâu cả" **kéo theo** "mọi transition đều nằm trong khối ấy". Đổi lại, lệnh cấm at-rule của `token-style.test.js` — thứ duy nhất ngăn bộ quét màu một tầng mù trong im lặng — không phải đụng tới. Ngày nào thật sự cần chuyển động, hóa đơn đó được trả **cùng lúc** với việc nâng bộ quét, đúng chỗ.

**Ca quét nguồn phải tự chứng minh nó còn mắt.** Một regex gõ sai cho ra `viPham = []` — trông hệt như một repo sạch. Vì thế mỗi nhóm cấm đi kèm một phép chạy trên chuỗi giả có vi phạm. Đây là bài học đã trả giá ở Story 3.3 (finding #4: `NaN < 4.5` là `false`, cửa ngưỡng xanh im lặng).

**Ca 500px sẵn có không thay được ca mới.** Nó bơm `.thu-o-tam` — những khối `120px` **không có chữ** — nên nó trả lời được "bố cục có tràn không" mà không trả lời được "chữ có bị cắt không", tức đúng nửa mà AC 200% đòi. Ghi chú thật, chữ thật, là điều kiện để phép đo có nghĩa.

## Verification

**Commands:**
- `npm test` — expected: toàn bộ xanh, gồm `test/chuyen-dong-va-tin-hieu.test.js` mới; không file test cũ nào phải sửa.
- `npm run thu-bo-cuc` — expected: toàn bộ xanh, gồm ba ca của khối Story 3.4.

**Manual checks:**
- Mở qua HTTP localhost, `Ctrl` `+` tới 200%: lưới về 1 cột, không chữ bị cắt ngang, không thanh cuộn ngang.
- Bật "giảm chuyển động" ở hệ điều hành rồi `Tab` quanh trang: không có gì đổi — vì mặc định đã tĩnh, đây là ca **không** quan sát được khác biệt, và đó là kết quả đúng.
