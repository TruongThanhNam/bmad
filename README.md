# Ghi chú hàng ngày

Ứng dụng ghi chú tĩnh, không backend, không tài khoản, không đồng bộ. Dữ liệu nằm trong
IndexedDB của trình duyệt, gắn với origin của trang.

Không bundler, không transpile, không thư viện chạy lúc runtime. `package.json` tồn tại
**chỉ** để chạy test.

## Chạy cục bộ

App phải được phục vụ qua một HTTP server ở `localhost`:

```sh
python -m http.server 8080
# hoặc
npx --yes http-server -p 8080 .
```

Rồi mở `http://localhost:8080/`.

**Cục bộ chạy ở `/`, sản xuất chạy ở `/bmad/`.** Hai điều rút ra:

- Đường dẫn tuyệt đối từ gốc như `/app/style.css` **chạy được ở localhost nhưng 404 trên sản
  xuất**, vì trên GitHub Pages gốc site là `truongthanhnam.github.io`, không phải `/bmad/`. Luôn
  dùng đường dẫn tương đối (`app/style.css`) trong `index.html` và trong mã.
- `http://localhost:8080` và `https://truongthanhnam.github.io` là **hai origin khác nhau**, nên
  IndexedDB và `localStorage` của chúng **không bao giờ dùng chung**. Ghi chú gõ lúc phát triển
  không xuất hiện trên bản sản xuất, và ngược lại. Đổi cả cổng của server cục bộ cũng là đổi origin.

### Cấm mở bằng `file://`

**Không mở `index.html` trực tiếp từ đĩa.** `file://` không phải secure context: ES module bị
chặn và `crypto.randomUUID()` không tồn tại, nên trang sẽ hỏng. Đây là hành vi dự kiến, không
phải lỗi — luôn dùng HTTP server ở `localhost` như trên.

## Origin — KHÔNG ĐƯỢC ĐỔI

Origin sản xuất là **`https://truongthanhnam.github.io/bmad/`** (repo `TruongThanhNam/bmad`,
nhánh `main`, thư mục gốc).

Dữ liệu IndexedDB và `localStorage` gắn chặt vào origin **và đường dẫn** này. **Đổi tên miền
hoặc đổi đường dẫn là mất toàn bộ ghi chú** — trình duyệt sẽ coi đó là một site khác và không
có cách nào lấy lại dữ liệu cũ ngoài file sao lưu do người dùng tự xuất. Đừng đổi tên repo,
đừng chuyển sang custom domain, đừng chuyển sang phục vụ từ thư mục con khác.

## Chạy test

```sh
npm install
npm test        # vitest run
npm run test:watch
```

## Checklist deploy

1. **Bump `APP_VERSION`** — bắt buộc ở **mọi** lần deploy. Đây là cách tab đang mở bản cũ biết
   mình cũ và vào chế độ chỉ đọc thay vì ghi đè dữ liệu do mã mới viết. Bỏ bước này là chấp nhận
   rủi ro mất dữ liệu.
   Hằng số nằm ở [`app/core/limits.js`](./app/core/limits.js) — sửa tay giá trị `APP_VERSION`
   ở đó. Trường `version` trong `package.json` **không được app dùng** (nó chỉ phục vụ npm) —
   đừng bump nó thay.
2. `npm test` — toàn bộ pass.
3. Chạy hết danh sách thử tay `app/adapters/` bên dưới.
4. Commit và push lên nhánh `main`.
5. Mở `https://truongthanhnam.github.io/bmad/` và kiểm: Console sạch, và sau khi trang tải
   ổn định thì tab Network không ghi nhận thêm request nào.

Không có CI, không staging, không rollback tự động. Đường lui là `git revert` cộng một lần
bump `APP_VERSION` nữa.

### Bật GitHub Pages (làm một lần)

Việc này làm bằng tay trong repo, không có tự động hóa nào:

1. Repo `TruongThanhNam/bmad` → **Settings** → **Pages**.
2. *Source*: **Deploy from a branch**.
3. *Branch*: **`main`**, folder **`/` (root)** → **Save**.
4. Đợi vài phút rồi mở `https://truongthanhnam.github.io/bmad/`.

Đúng ba lựa chọn đó là những gì làm nên origin sản xuất ở trên. Đổi nhánh hay đổi folder là đổi
đường dẫn, và theo mục *Origin* là mất toàn bộ ghi chú.

### Vì sao có `.nojekyll`

GitHub Pages mặc định đẩy nội dung qua Jekyll trước khi phục vụ. Repo này chứa nhiều markdown
planning trong `_bmad-output/` — Jekyll có thể build lỗi vì chúng, và mặc định nó cũng bỏ qua mọi
file/thư mục bắt đầu bằng `_`. File rỗng `.nojekyll` ở gốc tắt hẳn Jekyll, nên site được phục vụ
**nguyên trạng** đúng như cây thư mục trong repo. Đừng xóa nó.

## Danh sách thử tay cho `app/adapters/`

`app/adapters/` không có test tự động — chúng mỏng theo thiết kế và bằng chứng duy nhất là
danh sách thử tay dưới đây. Các story sau bổ sung thêm mục vào danh sách này.

**Mục 37 (hai tab song song, Story 7.1) chạy được bằng máy một phần qua `npm run thu-bo-cuc`** (khối
"Story 7.1" ở cuối bộ đo, xem mục "Bố cục bốn tầng" bên dưới).

**Mục 10-13 (bản nháp) và mục 22-23 (chốt, sửa, xóa) chạy được bằng máy:**

```bash
npm run thu-tay
```

Lệnh này tự dựng một HTTP server tĩnh và lái một **Edge/Chrome thật** ở chế độ headless qua
CDP, trên một hồ sơ tạm — không cài thêm gói nào, không đụng dữ liệu trình duyệt của bạn. Cần
Edge hoặc Chrome; nằm chỗ khác thì đặt `GHICHU_BROWSER` trỏ tới tệp thực thi. Mất khoảng một
phút, phần lớn là chờ hết `DRAFT_STALE_MS`. Thoát khác `0` nếu có mục nào hỏng.

Nó **không** phá luật "adapter không có test tự động": lý do gốc của luật đó là tránh dựng một
trình duyệt **giả**, mà một kho giả thì nghiệm thu được mọi thứ trừ đúng thứ cần nghiệm thu —
tính nguyên tử của một giao dịch thật, và hành vi thật của kho phạm vi phiên qua một lần tải
lại. Bộ đo này không giả lập gì cả. Nó cũng không nằm trong `npm test` (`vitest.config.js` chỉ
gom `test/**/*.test.js`), vì nó cần một trình duyệt trên máy.

Các mục còn lại vẫn phải làm tay theo mô tả bên dưới.

Chạy hết danh sách trên một HTTP server ở `localhost` (không phải `file://`), với DevTools mở.
Trong Console, `store` không được export ra `window` — dùng ô nhập của giao diện khi đã có, và
trước đó thì gọi qua `import('./app/main.js')` trong Console.

### `app/adapters/indexeddb.js` — kho ghi chú bền

1. **Schema đúng ngay lần mở đầu tiên.** Xóa sạch dữ liệu của origin, tải lại trang, thêm một
   ghi chú. DevTools → Application → IndexedDB: phải thấy kho `ghichu` ở **version 1**, có
   object store `notes` (keyPath `id`) mang index `localDate`, **và** object store `drafts`
   (keyPath `tabId`) — `drafts` rỗng ở story này, nhưng nó phải có mặt.
2. **Bản ghi đúng năm trường.** Mở một bản ghi trong `notes`: đúng `id · createdAt · localDate
   · text · textFolded`, không hơn. `localDate` bằng 10 ký tự đầu của `createdAt`, và
   `createdAt` mang offset tại chỗ (`+07:00`), **không** phải `Z`.
3. **Ghi chú sống qua lần tải lại.** Thêm hai ghi chú, tải lại trang: cả hai còn đó, mẩu mới
   nhất ở trên. Đóng hẳn tab rồi mở lại: vẫn còn.
4. **Xóa store rồi tải lại thì không vỡ.** DevTools → Application → IndexedDB → xóa kho
   `ghichu`, rồi tải lại trang: trang lên bình thường với danh sách rỗng, Console sạch, và kho
   được dựng lại đúng schema ở bước 1.
5. **Hết dung lượng thì thấy dải băng, không im lặng.** DevTools → Application → Storage →
   đặt hạn mức xuống mức rất thấp (hoặc thêm ghi chú rất dài cho tới khi vượt), rồi thêm một
   ghi chú: phải thấy **dải băng** câu "Không lưu được — trình duyệt hết dung lượng…", và mẩu
   giấy mới **không** xuất hiện trong danh sách. Đây là nửa cứng của FR-19: ghi hỏng thì không
   bao giờ giả vờ đã lưu.
6. **Kho hỏng thì cũng thấy dải băng.** Mở trang ở hai tab, rồi tạm sửa `PHIEN_BAN_KHO` lên
   `2` và tải lại một tab: tab đó bị `blocked` và phải hiện dải băng lỗi kho, không phải một
   trang trắng. Hoàn tác thay đổi sau khi thử.

### `app/adapters/localstorage.js` — kho cấu hình và danh tính tab

7. **`localStorage` chỉ mang khóa `ghichu.*`, và không mang ghi chú nào.** DevTools →
   Application → Local Storage: nhiều nhất ba khóa `ghichu.theme`, `ghichu.lastBackupAt`,
   `ghichu.persistDenied`. Không khóa nào khác, và **không** nội dung ghi chú nào ở đây — ghi
   chú chỉ sống trong IndexedDB.
8. **Danh tính tab thuộc phạm vi phiên.** Session Storage phải có đúng một khóa `ghichu.tabId`
   mang một UUID. Mở cùng trang ở một tab **mới**: tab đó có `tabId` **khác**. Tải lại tab cũ:
   `tabId` của nó **không đổi**.
9. **Khóa lạ là lỗi lập trình, không phải một lần ghi im lặng.** Trong Console:
   `(await import('./app/adapters/localstorage.js')).taoSessionStore().read('mau')` phải ném
   `TypeError` nêu cả ba khóa hợp lệ.

### `app/adapters/indexeddb.js` — bản nháp riêng từng tab

Bốn bước khởi động bản nháp (AD-3) chạy trong **một** giao dịch, và tính nguyên tử đó chỉ
nghiệm thu được trên kho thật. Từ Story 2.2 thì **gõ thẳng vào ô soạn thảo** ở tầng 1 — không
cần Console nữa; `store.datBanNhap` vẫn là đường duy nhất phía dưới, ô soạn thảo chỉ là chỗ
gọi nó. Đợi hơn `AUTOSAVE_MS` (400 ms) sau phím cuối thì bản nháp mới thật sự xuống kho.

10. **Bản nháp sống qua lần tải lại.** Gõ vài chữ vào bản nháp, đợi hơn một giây, rồi tải lại
    trang. DevTools → Application → IndexedDB → `ghichu` → `drafts`: đúng **một** bản ghi mang
    đúng ba trường `tabId · text · heartbeat`, `tabId` bằng `ghichu.tabId` trong Session
    Storage, và sau khi tải lại `store.state.draft.text` mang lại đúng chữ cũ. Local Storage
    **không** chứa bản nháp nào.

    Tải lại **ngay** (trong vòng `DRAFT_STALE_MS`) cũng phải cho kết quả đó, và `ghichu.tabId`
    **không được đổi**. Đây là ca mà bản đầu hỏng: quy tắc cũ đọc `heartbeat` để đoán "có tab
    khác đang sống", mà sau một lần tải lại thì nhịp tim còn mới tinh chính là của tab này ở
    kiếp trước — nên nó tự coi mình là tab nhân đôi và bỏ rơi bản nháp của chính mình.
11. **Nhân đôi tab thì không ai lấy mất bản nháp của ai.** Với tab đang gõ dở còn mở, nhân đôi
    tab (chuột phải lên tab → *Duplicate*). Tab mới: `ghichu.tabId` trong Session Storage phải
    **khác** tab cũ, ô bản nháp của nó **rỗng**, và bản ghi `drafts` của tab cũ còn **nguyên
    chữ**. Đây là nửa cứng của FR-20 — tab khác không bao giờ lấy mất bản nháp đang gõ.

    Phân biệt bước 10 với bước 11 là một **khóa sống** (`navigator.locks`), không phải nhịp
    tim: tab gốc giữ khóa `ghichu.tab.<tabId>` suốt đời nó, nên tab nhân đôi xin không được và
    biết chắc có người còn sống; còn tab vừa tải lại thì xin được, vì trình duyệt đã nhả khóa
    lúc tài liệu cũ biến mất. Xem khóa đang giữ trong Console bằng `await navigator.locks.query()`.
12. **Bản bỏ rơi nhận lại được, đúng một lần.** Gõ dở ở một tab, **đợi hơn một giây** cho hẹn
    tự lưu `AUTOSAVE_MS` nổ và bản nháp thật sự xuống kho (đóng sớm hơn thì chưa có gì để
    nhận, và bước này hỏng vì một lý do không liên quan tới thứ nó kiểm), rồi **đóng hẳn** tab
    đó. Đợi
    quá `DRAFT_STALE_MS` (30 giây) cho nhịp tim chết hẳn, rồi mở trang ở một tab mới: bản nháp
    cũ hiện lại, và trong `drafts` nó đã đổi sang `tabId` của tab mới — bản ghi cũ biến mất,
    tổng số bản ghi **không tăng**. Mở thêm một tab thứ ba ngay sau đó: tab này nhận chữ
    **rỗng**, vì bản kia đã có chủ.
13. **Nhịp tim đập đều và bản rỗng được dọn.** Để một tab mở với bản nháp có chữ: mỗi
    `DRAFT_BEAT_MS` (10 giây), `heartbeat` của bản ghi đó phải nhích lên (làm mới bảng
    `drafts` trong DevTools để thấy). Đặt tay một bản ghi có `text` rỗng vào `drafts`, tải lại
    trang: bản rỗng đó biến mất.
22. **Chốt bản nháp: hai kho đổi trong MỘT giao dịch, và bản nháp không hồi sinh.** Gõ vài
    chữ rồi bấm `Ctrl+Enter` **ngay** (trong vòng `AUTOSAVE_MS`, tức trước khi hẹn tự lưu của
    phím cuối nổ), rồi đợi vài giây và tải lại trang. DevTools → Application → IndexedDB →
    `ghichu`: `notes` có đúng **một** bản ghi mang chữ đó (đúng năm trường của AD-13), và
    **không** bản ghi `drafts` nào còn mang chữ đó — ô soạn thảo trống sau khi tải lại.

    Đây là nửa cứng của AD-8: nếu ghi chú xuống được kho mà bản nháp không bị làm rỗng trong
    **cùng** giao dịch, lần khởi động sau nhận lại đúng chữ vừa thành ghi chú — một bản nháp
    **ma**, và cú `Ctrl+Enter` kế tiếp sinh ra một mẩu trùng nội dung.

    Nhịp **gõ-chốt-gõ-chốt không rời bàn phím** cũng phải làm bằng tay: gõ `một`, `Ctrl+Enter`,
    gõ `hai` ngay lập tức, `Ctrl+Enter` lần nữa. Ô phải trống lại sau mỗi lần chốt, **con trỏ
    không rời ô** (gõ tiếp được ngay, không click), không một chỉ báo nào hiện ra, và trong
    `notes` có đúng **hai** bản ghi với `id` khác nhau — không mẩu nào trùng nội dung.

### `index.html` — theme không nháy lúc tải

"Không nháy" là một tính chất của **lần vẽ đầu tiên**, và không máy nào trong `npm test` chứng
kiến được nó: `test/token-style.test.js` chỉ kiểm được rằng script theme là đồng bộ, nội
tuyến, nằm trong `<head>` và đứng trước `<link rel="stylesheet">` — bốn tính chất cộng lại thì
*kéo theo* kết luận, nhưng khung hình đầu tiên thì phải xem bằng mắt.

14. **Theme đã chọn thì không có khung hình sáng nào.** DevTools → Application → Local Storage →
    đặt `ghichu.theme` = `dark`, rồi tải lại trang. Nền phải tối **ngay từ đầu**: mở
    DevTools → Performance → ghi một lần tải (`Ctrl+Shift+E`) → xem dải **Screenshots**, khung
    hình đầu tiên có pixel đã là nền tối, không một khung nào sáng. Đổi key sang `light` và lặp
    lại: nền sáng ngay từ khung đầu. Trong Console, `document.documentElement.dataset.theme` phải
    khớp giá trị key.
15. **Chưa từng chọn thì theo hệ điều hành.** Xóa hẳn key `ghichu.theme` rồi tải lại: theme khớp
    nền hệ thống. Đảo cài đặt Windows (Settings → Personalization → Colors → *Choose your mode*)
    — hoặc nhanh hơn: DevTools → ⋮ → *More tools* → **Rendering** → *Emulate CSS
    `prefers-color-scheme`* → `dark`/`light` — rồi tải lại: theme đảo theo. Sau cả hai lần,
    Local Storage **vẫn không có** key `ghichu.theme`: script không bao giờ ghi giá trị suy ra từ
    hệ điều hành xuống kho, vì "vắng mặt" phải giữ nghĩa "chưa chọn" cho nút bật/tắt của Epic 3.
16. **Giá trị rác rơi về hệ điều hành và không bị sửa chữa.** Đặt `ghichu.theme` = `DARK` (hoa),
    rồi `xanh`, rồi chuỗi rỗng. Mỗi lần tải lại: theme khớp nền hệ thống, **Console sạch** (không
    lỗi, không cảnh báo), và Local Storage **vẫn còn nguyên** đúng giá trị rác đó — script đọc,
    không ghi. Thử thêm ở **cửa sổ InPrivate** với cài đặt chặn cookie/site data: trang vẫn lên
    bình thường, vẫn có `data-theme`, không có lỗi nào trong Console.
17. **Không webfont, không request nào.** Tải lại với tab Network mở, xóa bộ lọc: chỉ có
    `index.html`, `app/style.css` và các module dưới `app/`, **cộng một `/favicon.ico` 404** —
    trình duyệt tự xin favicon dù trang không tham chiếu nó, nên dòng đó là bình thường và
    không tính là vi phạm. Không `fonts.googleapis.com`, không CDN, không ảnh nào khác. Sau khi
    trang ổn định, Network **không** ghi nhận thêm request nào. Kiểm phông
    thật đang dùng: DevTools → Elements → chọn `<body>` → Computed → **Rendered Fonts** phải là
    một phông hệ thống (`Segoe UI Variable Text` hoặc `Segoe UI`).

### Bố cục bốn tầng và ô soạn thảo — `index.html` + `app/style.css`

Phần lớn bố cục đã **chạy được bằng máy**:

```bash
npm run thu-bo-cuc
```

Cùng cơ chế với `npm run thu-tay` (HTTP server tĩnh + Edge/Chrome thật qua CDP, hồ sơ tạm,
không cài thêm gói nào) và cũng **không** nằm trong `npm test`, vì nó cần một trình duyệt trên
máy. Mất vài giây. Nó bơm ô tạm vào lưới rồi đo: số cột ở 1600/800/500px, ranh giới 3↔2 cột ở
828px, trần 3 cột ở 2560px, khe lưới `8px` và lề trang `16px`, ô ngày rộng đúng `118px`, "chỉ
tầng lưới cuộn", lưới rỗng vẫn đẩy chân trang xuống đáy, khung nhìn thấp vẫn giữ được lưới và
chân trang, và **mọi màu đo được đều đổi giữa hai theme**. Thoát khác `0` nếu có mục nào hỏng.

Từ Story 2.2 nó đo thêm ô soạn thảo: `autofocus` có mặt và **phần tử đang nhận bàn phím lúc
trang vừa tải chính là ô soạn thảo**, ô không mang `maxlength`, ô rỗng cao đúng `92px` với
padding `12px/16px`, nội dung 12 dòng làm ô cao thêm mà **không** có thanh cuộn trong ô và
trang vẫn không cuộn, xóa hết chữ thì ô **co lại** đúng `92px`, focus làm viền đổi màu và ring
hiện ra, và bóng lõm khác rỗng ở **cả hai** theme.

Từ Story 2.4 nó chốt **bốn ghi chú thật** qua đúng đường của người dùng (gõ vào ô rồi
`Ctrl+Enter`, chờ lưới vẽ xong chứ không chờ một khoảng cố định) rồi đo ba thứ: ba ô đầu nằm
trên **một hàng ngang** với tọa độ trái **tăng dần** và mẩu chốt sau cùng **trái nhất**; ô thứ
tư **xuống hàng mới và quay về cột đầu** — nửa "hết hàng xuống hàng, không masonry" mà ba ô ở
lưới ba cột không bao giờ chạm tới; và một mẩu **hai đoạn cao hơn** mẩu một dòng, tức
`white-space: pre-wrap` thật sự có hiệu lực. Vitest không thấy được cả ba: nó đọc `textContent`,
mà `textContent` giữ `\n` bất kể CSS, và thứ tự DOM đúng bất kể grid xếp thế nào. Đo xong — kể
cả khi một phép đo ném ở giữa — nó **xóa đúng những mẩu nó vừa tạo** (theo `id` đã gom, trong
`finally`), nên bộ đo trả kho về y như trước và không đụng tới ghi chú thật nào.

Từ Story 2.5 nó chốt thêm **bốn mẩu giấy thật** — ba mẩu chín dòng và một đoạn dài **không hề
xuống dòng** — rồi đo năm thứ mà Vitest không với tới, vì cả năm là hình học của layout đã tính:
mọi mẩu **thu gọn cao bằng nhau** (kể cả đoạn dài một-dòng-logic, thứ mà phép đếm dòng của JS cố
tình không thấy và chỉ trần CSS cắt); mẩu nhiều dòng mang `còn N dòng ▾` đúng số còn đoạn dài thì
**không** và cũng **không** vào thứ tự Tab; click một mẩu bị cắt **mở tại chỗ**, dòng đổi
`thu lại ▴` và **hàng dưới bị đẩy xuống**; click mẩu thứ hai thì **cả hai** cùng mở; click một
mẩu không bị cắt thì **không một thứ gì đổi**. Rồi nó **tải lại trang thật** và đo lần cuối: mọi
mẩu về **thu gọn**, `expandedIds` rỗng, và không khóa nào trong `localStorage` mang dấu vết
trạng thái mở — đó là cách "chỉ RAM" được chứng minh chứ không chỉ được hứa. Dọn dẹp theo `id`
trong `finally`, y như khối của Story 2.4.

Từ Story 2.6 nó đo thêm ba thứ mà Vitest không với tới. **Tiêu đề tab thật**: sau khi kho trả
lời, `document.title` đúng dạng `{số} - Ghi chú hàng ngày` với số là ghi chú **của hôm nay**; rồi
nó chốt một mẩu thật và tiêu đề đổi **ngay ở lượt vẽ đó**, số tăng đúng một (nửa mà một `main.js`
quên nối view thứ hai vẫn đi qua toàn bộ suite Vitest mà xanh). **Trạng thái rỗng trên DOM thật**:
hai view được nối vào một store rỗng dựng tại chỗ — kho của bạn không bị đụng tới — và vùng lưới
phải **không một node nào, không một ký tự nào**, tiêu đề **bỏ hẳn tiền tố số**; `luoi.test.js`
chỉ nhìn thấy những gì `veMau` dựng, nên một lời nhắn gắn thẳng vào `.luoi` chỉ chết ở đây. Và
**NFR-1**: nó bơm **2.000 bản ghi** thẳng vào IndexedDB bằng một giao dịch riêng (2.000 lần
`chotGhiChu` là 2.000 giao dịch), ngày **trải ra quá khứ** chứ không dồn vào hôm nay — vì tính
chất đang đo chính là *chiều dài lưới không phụ thuộc tổng số ghi chú* — rồi tải lại trang và đo
bằng đồng hồ **trong tab**, tính từ lúc điều hướng tới lúc **gõ được thật**: con trỏ đã ở trong ô
*và* bộ nghe `input` của `o-soan.js` đã gắn xong. Trần là **2 giây**. Dọn theo `id` đã bơm trong
`finally`, rồi tải lại để các khối sau không thừa hưởng 2.000 bản ghi.

Nó **không** đo được phóng trình duyệt: CDP không đặt được mức zoom thật (`width` của
`Emulation.setDeviceMetricsOverride` đã tính bằng điểm ảnh CSS, `deviceScaleFactor` chỉ đổi mật
độ điểm ảnh vật lý). Từ Story 3.4 nó đo phần **tương đương reflow** của mục 18: phóng 200% chia
đôi khung nhìn CSS mà **không** đổi cỡ chữ, nên `550×400` (200% của một cửa sổ 1100×800) dựng lại
đúng hình đó. Ba ghi chú **thật** được chốt qua đúng đường của người dùng — không phải ô giả không
chữ như mẫu 500px — rồi đo: lưới về **1 cột**, không cuộn ngang và không phần tử nào của bốn tầng
vượt 550px, trang **không** cuộn dọc mà **chỉ tầng lưới** cuộn, và **không phần tử mang chữ nào**
có `scrollWidth > clientWidth + 1` (trừ `.o-soan` và `.tang-luoi`, hai vùng cuộn đã ghim). Con số
`+ 1` là chủ ý: một điểm ảnh lẻ là phần dư của phép làm tròn bố cục, không phải một chữ bị cắt —
đừng "sửa" mã cho khớp một câu văn thiếu nó. Lưu ý số học: ranh giới 2↔1 cột là đúng **560px**, nên 200%
trên một cửa sổ 1280 rộng cho 640px và ở đó lưới vẫn còn 2 cột — đó là hành vi đã ghim.

**Tĩnh tuyệt đối** (Story 3.4, QĐ-1): app không có một `transition`, `animation`, `@keyframes`
hay `:hover` nào, và cũng không có khối `prefers-reduced-motion` rỗng nào "để sẵn" — khi không
có chuyển động nào thì lệnh cấm là vế **mạnh hơn** của AC, không phải vế thay thế.
`test/chuyen-dong-va-tin-hieu.test.js` canh điều đó, cùng với luật "màu không bao giờ là tín hiệu
duy nhất" (`var(--danger)` phải khai vào `DUNG_DANGER` **kèm** chỗ đứng của chữ đi cùng) và lệnh
cấm kéo-thả / menu chuột phải / long-press. Cần chuyển động thì nâng bộ quét một tầng của
`test/token-style.test.js` **trước**.

Lưu ý con số: `~900px` trong spec là cách nói ước lượng cho "cửa sổ vừa". Số học của token đặt
ranh giới 3↔2 cột ở đúng **828px** (`3×260 + 2×8 + 2×16`), nên 900px thật sự vẫn là 3 cột. Bộ
đo lấy mẫu ở 800px và ghim riêng ranh giới 828px — đổi `--note-min-col`, `--grid-gap` hay
`--page-gutter` là thấy nó lệch ngay.

Hai mục còn lại phải làm bằng mắt:

18. **Phóng 200% vẫn dùng được.** Ở cửa sổ cỡ thường, `Ctrl` + `+` tới 200%: lưới về **1 cột**,
    không chữ nào bị cắt ngang, không thanh cuộn ngang, và trang **vẫn không** có thanh cuộn
    dọc ngoài — chỉ tầng lưới cuộn. Ba tầng kia đứng yên khi lăn chuột trong lưới.
    Từ Story 3.4 phép đo **tương đương** đã tự động ở `npm run thu-bo-cuc` (xem trên); mục này
    còn lại là vế **mắt nhìn**: chữ có bị cắt ngang ở chỗ nào bộ đo không gọi tên không, và vòng
    sáng bàn phím ở mức phóng còn là một vòng chứ không phải một vệt nhòe.
19. **Hai theme không lệch khỏi token.** Đổi `ghichu.theme` giữa `light` và `dark` (mục 14),
    nhìn kỹ khay tìm kiếm, ô ngày, icon lịch, hai nút dáng link ở chân trang và nút theme: mọi màu đổi
    theo theme, không một mảng nào giữ nguyên màu của bản kia. Icon lịch ăn theo `currentColor`
    nên nó phải đổi cùng chữ quanh nó. Cái bóng **duy nhất** trong app lúc này là bóng **lõm**
    của ô soạn thảo — nó phải thấy được ở cả hai theme. Từ Story 2.5 có cái bóng thứ hai và
    **chỉ hai**: bóng **nhị** của mẩu giấy, ngược chiều (nhô lên). Chốt một ghi chú rồi nhìn kỹ
    ở **cả hai** theme: nền giấy, dải keo mép trên và bóng nổi đều phải đổi, và chữ vẫn đọc được.

    Tầng 2 và tầng 4 ở story này là **hình dạng, chưa có hành vi**: bấm vào ô tìm, ô ngày,
    `xuất sao lưu`, `nạp lại` hay nút theme thì không có gì xảy ra — kể cả thanh địa chỉ cũng
    **không đổi**, vì hai điều khiển chân trang là `<button>` mang dáng link chứ không phải
    `<a href="#">`. Đó là đúng, không phải lỗi. Nhưng `Tab` qua chúng theo thứ tự trên→dưới
    thì **phải thấy focus ring** ở từng chỗ.

### Ô soạn thảo — hai mục phải làm bằng mắt

`npm run thu-bo-cuc` đo được rằng ô soạn thảo *đang nhận bàn phím*, nhưng nó không thấy được
con trỏ nháy, và nó không đóng được một tab thật.

20. **Con trỏ nằm sẵn trong ô, và chữ đầu tiên vào đúng chỗ.** Mở trang rồi **gõ ngay, không
    click vào đâu cả**: con trỏ phải đang nháy trong ô soạn thảo và ký tự đầu tiên vào ô.
    Placeholder **trống hoàn toàn** — không một chữ mờ nào. Gõ vài dòng: ô cao thêm khít chữ,
    không có thanh cuộn trong ô, và trang **vẫn không** có thanh cuộn dọc ngoài. Gõ tiếp cho
    tới khi ô chạm trần `--composer-max-h` (320px): ô **dừng cao** và **chính nó** bắt đầu
    cuộn, lưới vẫn còn chỗ và chân trang vẫn trong khung nhìn. Dưới ô đúng **một** dòng nhỏ
    `Ctrl+Enter để chốt`. `Enter` **trần** chỉ xuống dòng như mọi `<textarea>`; `Ctrl+Enter`
    thì **chốt** — ô trống lại, con trỏ ở lại, và mẩu vừa chốt **nhô lên ở ô trên-cùng-trái**
    của lưới (mục 22). Ngoài mẩu đó ra, giao diện im lặng tuyệt đối: không nút "Lưu", không
    chữ "đã lưu", không số đếm ký tự ở đâu cả.

    **Suy giảm có ý thức, phải biết trước khi thấy:** dán một bản nháp dài hơn
    `MAX_NOTE_CHARS` (20.000 ký tự) thì chữ **vẫn nằm nguyên** trong ô và trong state — không
    một ký tự nào bị cắt — nhưng nó **lặng lẽ ngừng được ghi xuống kho**, và story này **chưa
    có chỗ nào nói ra điều đó**. Dải băng `TOO_LONG` dừng ở tầng action cho tới Story 3.1.
21. **Đóng tab giữa lúc gõ, mở lại thì chữ trở lại nguyên trạng.** Gõ vài dòng **có xuống
    dòng**, đợi hơn một giây cho hẹn `AUTOSAVE_MS` nổ, rồi **đóng hẳn tab** và mở lại trang
    ngay (trong `DRAFT_STALE_MS`): chữ hiện lại **đủ cả xuống dòng**, ô đã cao đúng theo chữ
    đó, và con trỏ ở **cuối** chữ — gõ tiếp là nối vào câu đang viết dở.

    Ca ngược của nó, khó thấy hơn và là lý do `dongBoTuState` so sánh trước khi gán: mở trang
    rồi **gõ ngay trong giây đầu tiên**, lúc kho còn đang trả lời. Chữ vừa gõ phải **thắng** —
    không bị bản nháp cũ đè lên, và con trỏ không nhảy về cuối giữa lúc đang gõ.

### Lưới ghi chú của hôm nay — hai mục phải làm bằng mắt (Story 2.4)

`npm run thu-bo-cuc` đã chốt ba mẩu thật và đo hình học của lưới, nên ở đây chỉ còn hai thứ nó
không với tới: kho bền qua một lần tải lại, và ranh giới ngày.

22. **Chốt là thấy, và tải lại vẫn thấy.** Gõ `phở` rồi `Ctrl+Enter`: mẩu hiện ra ngay ở ô
    **trên-cùng-trái**, ô soạn thảo trống lại. Chốt thêm hai mẩu: mẩu mới nhất **luôn** ở đầu,
    hai mẩu cũ dịch sang phải **cùng một hàng** (cửa sổ đủ rộng). Từ Story 2.5 mỗi ô là một
    **mẩu giấy** — nền `--paper`, dải keo mép trên, bóng nhị, giờ tạo `HH:mm` bên trái và nút
    `xóa` bên phải — và chữ nhiều dòng giữ nguyên xuống dòng. Mẩu vừa chốt luôn ở dạng **thu
    gọn**. Nút `xóa` ở đây là **hình dạng, chưa có hành vi**: bấm vào nó không xóa gì cả (hộp
    thoại xác nhận và phép xóa thật là Epic 5). Tải lại trang: đúng những mẩu đó hiện lại,
    đúng thứ tự đó. Thu hẹp cửa sổ: lưới rớt 3 → 2 → 1 cột mượt, không breakpoint giật.
23. **Chỉ hôm nay mới lên lưới.** DevTools → Application → IndexedDB → `ghichu` → `notes`: sửa
    `createdAt` của một bản ghi sang **ngày hôm qua** rồi tải lại trang. Mẩu đó **không** còn
    trên lưới — nhưng bản ghi **vẫn nguyên** trong kho. Lưới không có ngày nào hiện ra thì
    **trống trơn, không một chữ nào** (trạng thái rỗng có lời nhắn là Story 2.6).

    Ca biên đã nhận có ý thức: để tab mở qua **00:00** rồi chốt một mẩu. Lượt vẽ đó tính lại
    "hôm nay", nên mẩu mới hiện ra và **mọi mẩu hôm qua biến mất cùng lúc** khỏi lưới. Dữ liệu
    vẫn còn trong kho — chúng chỉ ra khỏi khung nhìn. Không có hẹn giờ nửa đêm nào.

### Dải băng thông báo — hai mục phải làm bằng mắt (Story 3.1)

`npm test` đã ghim bảng bảy nguồn, phép gác ưu tiên và lượt vẽ; `npm run thu-bo-cuc` đã ghim
rằng trang không mọc thanh cuộn ngoài. Còn lại đúng hai thứ chỉ mắt trả lời được: hình dạng ở
cả hai bảng màu, và "đẩy xuống chứ không phủ lên".

24. **Một hình dạng cho mọi hàng, và `✕` chỉ ở hàng đóng được.** Mở trang qua HTTP localhost
    (mục 1), rồi ép dải băng sang một hàng ĐÓNG ĐƯỢC bằng đúng đường của người dùng: dán hơn
    20.000 ký tự vào ô soạn thảo (`copy('x'.repeat(20001))` trong Console rồi `Ctrl+V`) và bấm
    `Ctrl+Enter` — hàng 5, `TOO_LONG`.

    Ghi chép có ý thức: dải băng vẽ lại ở lượt vẽ chung, và lượt vẽ chung chạy sau khi **chốt**
    chứ không sau mỗi phím gõ (một lượt vẽ cả lưới mỗi phím là trần 200 ms của NFR-2). Nên gõ
    quá trần mà chưa bấm `Ctrl+Enter` thì `state.banner` đã đổi nhưng dải băng chưa hiện.

    Dải băng hiện ở **đỉnh trang**, nền `--chip-bg`, một đường viền dưới, **không bóng**, chữ
    là **nguyên văn microcopy tiếng Việt** — không bao giờ một chuỗi tiếng Anh của trình duyệt.
    Ba tầng dưới **bị đẩy xuống** chứ không bị phủ, và trang vẫn **không có** thanh cuộn ngoài.
    Bấm `✕`: dải băng biến mất, và vùng đó **không chiếm một điểm ảnh chiều cao** nào.

    Rồi ép một hàng **không đóng được** — DevTools → Application → IndexedDB → xóa kho `ghichu`
    rồi tải lại (mục 4 và 6 làm đúng việc đó): dải băng `DB` hiện ra **không có** nút `✕`. Đây
    cũng là mục kiểm ưu tiên: với `DB` (hàng 3) đang hiện, gõ quá trần như trên — `TOO_LONG`
    (hàng 5) **không** được thay chỗ nó.

25. **Hai theme đều đọc được.** Với dải băng đang hiện, đổi `ghichu.theme` giữa `light` và
    `dark` (mục 14) rồi tải lại: chữ trên `--chip-bg` đọc được ở **cả hai** bảng màu, và dấu
    `✕` (màu `--ink-2`) vẫn thấy rõ. Tab vào nút `✕`: **focus ring còn nguyên** ở cả hai theme.

### Focus ring và thứ tự tab — một mục phải làm bằng mắt (Story 3.2)

`npm test` đã ghim phần quét nguồn (không `tabindex` dương, không listener bàn phím cấp
`document`/`window`, mọi điều khiển đều có một luật `:focus-visible` phủ nó), và
`npm run thu-bo-cuc` đã đo **thật** trong trình duyệt: dãy điểm dừng của `Tab` và `Shift+Tab` ở
cả hai trạng thái dải băng, vòng sáng ở cả hai theme, **tỉ lệ tương phản ≥ 3:1** giữa vòng sáng
và nền thật sau từng điểm dừng, và "click chuột thì không có vòng".

Còn lại là những thứ một tỉ lệ không nói hết: vòng sáng có bị một đường viền hay một cái bóng
sẵn có **nuốt mất** không, có dính vào nét chữ không, và ở mức phóng to thì nó còn là một vòng
hay đã thành một sợi chỉ. Máy chốt được con số; mắt chốt phần còn lại.

26. **`Tab` một vòng qua toàn trang, ở cả hai theme.** Mở trang qua HTTP localhost (mục 1) với
    ít nhất một ghi chú **dài hơn 3 dòng** của hôm nay trên lưới. Con trỏ đã nằm sẵn trong ô
    soạn thảo; bấm `Tab` liên tiếp và đi hết một vòng:

    `ô tìm` → `ô ngày` → từng **mẩu bị cắt** (trái sang phải, đúng thứ tự mắt đọc) →
    `xuất sao lưu` → `nạp lại` → nút theme.

    Ở **mỗi** điểm dừng phải thấy rõ một vòng sáng màu `--focus`, và **không** điểm dừng nào là
    một phần tử vô hình hay không tương tác — mẩu giấy **ngắn** không phải một điểm dừng (nó
    không có hành vi nào), nút `xóa` cũng chưa phải (nó chỉ có hình dạng cho tới Epic 5).
    `Shift+Tab` phải quay lại **đúng đường** vừa đi.

    Rồi ép dải băng sang một hàng **đóng được** (mục 24): `✕` trở thành điểm dừng **đầu tiên**,
    trước cả ô soạn thảo. Ép sang một hàng **không đóng được**: không có điểm dừng nào thêm.

    Đổi `ghichu.theme` giữa `light` và `dark` (mục 14) rồi lặp lại cả vòng: vòng sáng vẫn **đọc
    được trên mọi nền** — kể cả trên mặt giấy `--paper` của mẩu và trên nền bàn `--bg`.

    Cuối cùng, hai phép thử **âm tính**: **click chuột** vào `nạp lại` — **không** vòng sáng nào
    hiện ra (vòng là bản đồ bàn phím, không phải phản hồi chuột); và gõ `/` rồi `Ctrl+K` khi
    tiêu điểm đang ở chân trang — **không có gì xảy ra**, sản phẩm có đúng bốn phím.

### Nút theme và tương phản ở cả hai bảng màu — một mục phải làm bằng mắt (Story 3.3)

> **CẢNH BÁO — cặp `--danger` trên `--chip-bg` ở bản dark ra đúng **4.55:1**.** Nó đạt ngưỡng
> 4.5:1, nên đừng sửa; nhưng biên chỉ còn **0.05**, và mắt không thấy 0.05. **Ai đổi `chip-bg`
> bản dark (hay `danger` bản dark) thì phải tính lại cặp đó *trước khi commit*.**
> `test/theme.test.js` ghim đúng con số `4.55` chính vì thế — nó là cái chuông kêu **trước** khi
> cặp kia kịp tụt xuống dưới ngưỡng. Cùng câu này nằm ở đầu `app/style.css`.

`npm test` đã đo ngưỡng **≥ 4.5:1** cho mọi cặp chữ/nền đang dùng, tính từ chính hai khối token
của `app/style.css`, ở **cả hai** bảng màu — cộng hai lệnh cấm: `--ink-decor` không bao giờ là
`color`, và vai chữ nhỏ nhất (`--font-foot`) không bao giờ mờ hơn `--ink-2`.
`npm run thu-bo-cuc` lật nút **bằng chuột và bằng `Enter`** trong trình duyệt thật rồi đo lại
tương phản của **mọi phần tử mang chữ** với nền thật của nó, ở cả hai theme.

Còn lại là thứ không con số nào nói: lần tải lại có **nháy một khung hình sáng** không.

27. **Lật theme, tải lại, và nhãn đọc đúng chiều.** Mở trang qua HTTP localhost (mục 1). Bấm
    nút ở **góc phải chân trang**: cả trang đổi bảng màu trong **một khung hình**, không hoạt
    ảnh, không nháy; nhãn đổi từ `nền tối` sang `nền sáng` (nó nói nơi *sẽ tới*, không phải nơi
    đang đứng). DevTools → Application → Local Storage: `ghichu.theme` = `dark`.

    Tải lại trang: **khung hình đầu tiên đã tối** — soi kỹ, không được có một khung sáng nào
    chớp qua — và nhãn đọc `nền sáng`.

    Rồi xóa hẳn key `ghichu.theme`, đặt hệ điều hành sang dark, tải lại: trang tối theo hệ
    thống, nhãn đọc `nền sáng`, và key **vẫn vắng mặt** cho tới lần bấm đầu tiên — "chưa chọn"
    không phải một lựa chọn.

    Cuối cùng, `Tab` tới nút rồi bấm `Enter`: lật đúng như bấm chuột, và vòng sáng nhìn rõ ở cả
    hai bảng màu. Bấm bằng **chuột** thì không có vòng nào.

28. **Hai nhịp click, và con trỏ rơi đúng chỗ bấm.** Mở trang qua HTTP localhost (mục 1). Chốt
    một ghi chú **NGẮN** (một dòng) và một ghi chú **DÀI** (bảy, tám dòng có xuống dòng thật).

    *Mẩu ngắn:* click một lần vào giữa một từ trong thân mẩu. Mẩu **vào chế độ sửa ngay** — thân
    mẩu thành một ô gõ được, nền sáng hơn nền giấy, con trỏ nháy **đúng chỗ vừa bấm** (không ở
    đầu, không ở cuối). Giờ hiển thị ở đầu mẩu **không đổi**, và mẩu **không nhảy vị trí**.

    *Mẩu dài:* click một lần — nó **chỉ mở rộng** (dòng cuối đổi thành `thu lại ▴`), **chưa** vào
    chế độ sửa. Click lần thứ hai vào giữa một từ — bây giờ mới vào chế độ sửa, và con trỏ vẫn
    rơi đúng chỗ bấm. `caretPositionFromPoint` không kiểm được bằng test tự động, nên mục này là
    người canh duy nhất của nó.

    *Bấm ra ngoài thân mẩu:* click vào **dòng giờ** ở đầu mẩu (ví dụ `09:05`) của một mẩu ngắn.
    Nó vẫn vào chế độ sửa, nhưng con trỏ phải ở **cuối chữ** — không ở một chỗ tính theo `09:05`
    rồi áp vào toàn văn.

    *Bàn phím:* `Tab` tới một mẩu (mọi mẩu nay là một điểm dừng) rồi bấm `Enter` hay phím cách:
    vào chế độ sửa, con trỏ ở **cuối chữ**. Trong ô sửa, `Enter` **xuống dòng** như một ô gõ
    bình thường — nó không bị ăn mất.

    *Đổi bề rộng cửa sổ khi ô sửa đang mở:* để ô sửa mở với một ghi chú đủ dài để ngắt dòng, rồi
    **kéo hẹp cửa sổ lại** (hay `Ctrl` + `+` tới 150%). Cùng một chữ nay chiếm nhiều dòng hơn:
    ô phải **cao thêm ngay**, không được cắt mất dòng cuối. Kéo rộng lại: ô **co lại** khít chữ.
    Ô sửa là `overflow: hidden` cộng một chiều cao do JS ghim — nó **không bao giờ** được mọc ra
    một thanh cuộn của riêng nó (trang chỉ có hai vùng cuộn: tầng lưới và ô soạn thảo).

29. **Sửa tại chỗ: chữ xuống kho, giờ không đổi, và mẩu thu lại khi rời.** Tiếp mục 28. Trong ô
    sửa của một mẩu, gõ thêm vài chữ rồi **ngồi yên hơn một giây**. Không có một chỉ báo nào hiện
    ra (không "đang lưu", không "đã lưu", không đếm ký tự) — đó là thiết kế. Nhìn lưới: chữ mới
    **có mặt** mà không phải bấm thêm gì.

    Bấm ra chỗ trống ngoài mẩu: ô sửa đóng lại, mẩu **thu gọn** về ba dòng, và giờ hiển thị vẫn
    y nguyên. Tải lại trang: chữ vừa sửa còn đó, mẩu **vẫn ở đúng vị trí cũ** trên lưới.

    *Hai mẩu liên tiếp:* vào chế độ sửa mẩu A, gõ vài chữ, rồi **bấm thẳng sang mẩu B** (một cú
    bấm, không phải hai) và gõ vào B ngay. Đợi hai giây rồi tải lại: **cả hai** mẩu giữ đúng chữ
    của mình. Đây là ca mà một số đếm tự lưu dùng chung làm mất chữ của A trong im lặng.

    *Mở lại ngay:* gõ vào một mẩu rồi bấm ra ngoài và bấm vào lại **thật nhanh** (dưới nửa giây):
    ô sửa mở ra với **chữ vừa gõ**, không phải chữ cũ.

    *`Tab` ra khỏi ô sửa:* đang sửa, bấm `Tab`. Ô sửa đóng, và vòng sáng phải nằm ở **điểm dừng
    kế tiếp** — không biến mất về đầu trang.

    *Quá trần:* dán hơn 20.000 ký tự vào ô sửa. Dải băng hiện ra **ngay**, đọc đúng
    `Ghi chú này đã đạt 20.000 ký tự — không nhận thêm.` — **không** có mệnh đề `Ctrl+Enter`
    (mệnh đề đó chỉ đúng ở ô soạn thảo). Chữ vừa dán **vẫn còn** trong ô. Gõ một câu hợp lệ
    **trước** rồi mới dán quá trần: đợi hai giây, tải lại — câu hợp lệ ấy phải có trong ghi chú,
    nó không được bị lần dán bị từ chối nuốt mất.

    *Ô sửa ở bản dark.* Đổi `ghichu.theme` sang `dark` (mục 14) rồi mở lại một ô sửa. Ba thứ
    phải đọc được ngay bằng mắt, cùng cách mục 25 soi dải băng: chữ trong ô **rõ** trên nền
    `--surface` của nó (ô sửa sáng hơn nền giấy ở cả hai bảng màu — nó là *chỗ đang gõ*), đường
    viền `--rule` **thấy được** nên ô không lẫn vào mẩu, và vòng sáng khi ô nhận tiêu điểm lấy
    màu `--focus` — nhìn rõ trên nền tối. Lật lại `light` và soi đúng ba thứ đó. Bóng lõm đổi
    theo theme (`--shadow-inset`), nên ở bản dark nó phải là một vệt **tối**, không phải một
    vệt xám nổi lên trên nền sẫm.

30. **Xóa sạch chữ rồi rời mẩu — mẩu biến mất, không hỏi gì.** Mở một mẩu ở chế độ sửa, chọn hết
    chữ trong ô (`Ctrl+A`) và xóa sạch (ô sửa rỗng hoàn toàn). Bấm ra chỗ trống ngoài mẩu (hoặc
    `Tab` ra khỏi ô): mẩu **biến khỏi lưới ngay**, không nhấp nháy, không hộp thoại xác nhận,
    không dải băng "đã xóa" — im lặng tuyệt đối. Tải lại trang: mẩu đó **không còn** trong danh
    sách.

    *Chỉ khoảng trắng:* lặp lại nhưng thay vì xóa hết, gõ vài dấu cách vào ô rồi rời mẩu — kết quả
    phải **y hệt**: mẩu biến mất.

    *Rời mẩu còn chữ:* mở một mẩu khác, xóa bớt (không xóa hết, còn ít nhất một ký tự) rồi rời —
    mẩu phải **còn nguyên** trên lưới, thu gọn về ba dòng như mục 29, không bị xóa.

    *Xóa thất bại (`QUOTA`/`DB`):* như mục 5, DevTools → Application → Storage → đặt hạn mức
    xuống mức rất thấp để ép hết dung lượng. Mở một mẩu đã có, xóa sạch chữ trong ô rồi rời mẩu:
    vì xóa không ghi được, mẩu đó phải **còn nguyên trên lưới** (không biến mất), và phải thấy
    dải băng lỗi đã có (câu "Không lưu được — trình duyệt hết dung lượng…"). Hoàn tác hạn mức sau
    khi thử.

### Xóa qua hộp thoại xác nhận — một mục phải làm bằng mắt (Story 5.3)

31. **Xóa một ghi chú: hỏi một lần, rồi mất hẳn.** Mở trang qua HTTP localhost (mục 1) với ít
    nhất hai ghi chú đã chốt.

    *Nút `xóa` luôn có mặt.* Nhìn một mẩu bất kỳ: chữ `xóa` hiện sẵn ở góc phải đầu mẩu, không
    phải chờ rê chuột qua. `Tab` vào lưới: thứ tự là **thân mẩu rồi nút `xóa`** của chính mẩu
    đó, và vòng sáng quanh nút nhìn rõ.

    *Mở hộp thoại.* Bấm `xóa` (chuột, hay `Enter` khi nút đang nhận tiêu điểm). Nền mờ đi, hộp
    thoại **căn giữa cả chiều dọc lẫn chiều ngang**, đọc đúng ba dòng: `Xóa ghi chú này?`,
    `Không có thùng rác và không hoàn tác được.`, rồi hai lựa chọn `hủy` · `xóa`. Mẩu bên dưới
    **không** mở rộng, **không** vào chế độ sửa. Hộp hiện ra trong **một khung hình** — không
    mờ dần, không trượt vào.

    *Tiêu điểm mở ở `hủy`.* Bấm `Enter` ngay: hộp đóng, **không mất gì cả**. Mở lại rồi bấm
    `Tab` năm, sáu lần: vòng sáng chỉ đi lại giữa hai nút, **không bao giờ** thoát ra nền —
    thử cả `Shift+Tab`.

    *Ba đường hủy đều trả tiêu điểm về đúng chỗ.* Mở hộp cho mẩu thứ hai trên lưới rồi lần lượt:
    bấm `hủy`; bấm `Esc`; bấm vào **vùng mờ** ngoài hộp. Sau mỗi lần, hộp đóng, không ghi chú
    nào mất, và vòng sáng phải nằm lại đúng **nút `xóa` của mẩu vừa hỏi** — không rơi về đầu
    trang. (`Esc` khi không có hộp nào mở: không có gì xảy ra.)

    *Chọn `xóa`.* Mở hộp rồi bấm `xóa`: hộp đóng và mẩu **biến khỏi lưới ngay**, không nhấp
    nháy, không dải băng "đã xóa" — im lặng tuyệt đối, đúng như mục 30. Tải lại trang: mẩu đó
    **không còn**.

    *Mẩu đang sửa.* Mở một mẩu ở chế độ sửa rồi bấm thẳng nút `xóa` của chính nó: ô sửa đóng
    (`blur` chạy trước) và hộp thoại mở cho đúng mẩu đó. Lặp lại nhưng **xóa sạch chữ** trong ô
    trước khi bấm `xóa`: mẩu tự biến mất theo mục 30, và hộp thoại **không** mở ra — không hỏi
    về một thứ không còn tồn tại.

    *Xóa thất bại (`QUOTA`/`DB`).* Như mục 5, DevTools → Application → Storage → đặt hạn mức
    xuống mức rất thấp để ép hết dung lượng. Mở hộp thoại cho một mẩu rồi chọn `xóa`: hộp
    **vẫn đóng**, nhưng mẩu phải **còn nguyên trên lưới**, và dải băng lỗi đã có hiện ra
    ("Không lưu được — trình duyệt hết dung lượng…"). Không có mã lỗi mới và không có loại dải
    băng mới cho việc này. Hoàn tác hạn mức sau khi thử.

    *Cả hai theme.* Lặp toàn bộ mục này ở bản dark (mục 14). Ba thứ phải đọc được ngay bằng
    mắt: **vùng mờ thấy rõ** là một lớp phủ (ở bản dark nó đậm hơn — `--overlay` có giá trị
    riêng, vì nền dark đã tối sẵn); **bóng của hộp** tách nó khỏi nền (bóng đen đậm ở dark, bóng
    nâu ở light) và nó là **bóng sâu duy nhất** trong cả sản phẩm; và chữ `xóa` màu `--danger`
    **đọc rõ** trên nền `--surface` của hộp.

### Tìm bằng chữ trên toàn bộ dữ liệu — một mục phải làm bằng mắt (Story 6.1)

32. **Gõ không dấu, tìm ra ghi chú hôm qua, và xóa chữ là về hôm nay.** Mở trang qua HTTP
    localhost (mục 1) với ít nhất một ghi chú **của hôm qua** chứa `Phân quyền` (nạp một file sao
    lưu qua chân trang là cách nhanh nhất) và vài ghi chú của hôm nay.

    *Ô tìm luôn hiện.* Tầng 2 có nhãn `tìm`, ô mang placeholder `từ khóa`, khay nền `--chip-bg`.

    *Gõ không dấu.* Bấm vào ô tìm và gõ `phan quyen` từng ký tự: lưới lọc lại **ở mỗi phím**,
    không cần `Enter`. Mẩu hôm qua hiện ra, chữ `Phân quyền` được **tô nền** đúng chỗ, và mốc của
    mọi mẩu trong kết quả đổi thành `dd/MM/yyyy HH:mm`, mới nhất trên cùng. Gõ `PHAN`: vẫn khớp,
    tô đúng bốn ký tự gốc. Một mẩu có chữ lặp lại (`ab ab`, gõ `ab`) được tô **cả hai** chỗ.

    *Không khớp.* Gõ `zzz`: lưới chỉ còn đúng một dòng `Không có ghi chú nào khớp.`

    *Xóa hết chữ.* Xóa sạch ô: lưới về khung nhìn hôm nay, mốc về `HH:mm`, không còn chỗ nào được
    tô. Nếu hôm nay chưa có ghi chú nào thì lưới **trống trơn, không một chữ** (Story 2.6).

    *Sửa tại chỗ trong kết quả.* Tìm lại mẩu hôm qua, click vào nó: nó vào chế độ sửa y hệt mục
    29, sửa một chữ rồi rời — chữ mới xuống kho, tải lại trang vẫn còn.

    *Chốt khi đang tìm.* Gõ một từ khóa, rồi viết một ghi chú ở ô soạn và `Ctrl+Enter`: điều kiện
    bị xóa, ô tìm **về rỗng**, lưới về hôm nay với mẩu vừa chốt ở đầu.

    *Cả hai theme.* Lặp phần tô ở bản dark (mục 14): chữ trên nền tô `--hl` phải đọc rõ.

### Lọc theo một ngày cụ thể — một mục phải làm bằng mắt (Story 6.2)

33. **Gõ một ngày, gõ sai thấy lỗi, chọn bằng lịch, và xóa ô là về hôm nay.** Mở trang qua HTTP
    localhost (mục 1) với ghi chú của ít nhất hai ngày khác nhau (nạp một file sao lưu qua chân
    trang), trong đó có một ngày cũ, ví dụ `03/09/2026`.

    *Ô ngày.* Bên phải khay: nhãn `ngày`, ô rộng 118px chữ monospace placeholder `dd/MM/yyyy`, và
    icon lịch 16px nét `--ink-2`. `Tab` từ ô ngày: tiêu điểm tới **nút lịch** (có vòng sáng), rồi
    mới tới mẩu giấy đầu tiên.

    *Gõ ngày.* Gõ `03/09/2026`: lưới chỉ còn ghi chú của ngày đó, mốc dạng `dd/MM/yyyy HH:mm`.

    *Gõ sai.* Xóa bớt thành `03/09/20`: lưới **đứng yên**, chưa có lỗi. Rời ô (`Tab`): viền ô
    thành `--danger` và dưới khay hiện `Ngày phải viết dd/MM/yyyy, ví dụ 03/09/2026.`; lưới vẫn
    đứng yên. Gõ `31/02/2026`: lỗi bật ngay khi đủ 10 ký tự, lưới đứng yên. Sửa lại thành một ngày
    hợp lệ: lỗi tắt ngay, lưới lọc theo ngày mới.

    *Picker.* Bấm icon lịch: picker gốc của trình duyệt mở. Chọn một ngày: ô hiện đúng
    `dd/MM/yyyy`, lưới lọc theo ngày đó, picker đóng, không còn lỗi.

    *Giao với từ khóa.* Gõ thêm một từ khóa ở ô tìm: lưới chỉ còn mẩu khớp chữ **và** đúng ngày.

    *Xóa ô.* Xóa sạch ô ngày (và ô tìm): lưới về khung nhìn hôm nay, mốc về `HH:mm`, lỗi tắt.

    *Sửa tại chỗ trong kết quả lọc ngày.* Lọc một ngày cũ, click một mẩu: sửa một chữ rồi rời —
    chữ mới xuống kho, tải lại trang vẫn còn.

    *Chốt khi đang lọc ngày.* Đang lọc ngày, chốt một ghi chú bằng `Ctrl+Enter`: ô ngày **về
    rỗng**, lỗi (nếu có) tắt, lưới về hôm nay.

    *Cả hai theme.* Lặp phần gõ sai ở bản dark (mục 14): viền đỏ thấy rõ, chữ lỗi đọc rõ.

### Hàng chip điều kiện và đường về — một mục phải làm bằng mắt (Story 6.3)

34. **Thấy mình đang lọc theo gì, và về hôm nay trong một thao tác.** Mở trang qua HTTP localhost
    (mục 1) với dữ liệu như mục 32–33 (bốn ghi chú chứa `Phân quyền` ở nhiều ngày, một trong đó
    ngày `03/09/2026`). Đi theo UJ-2 bước 4–8 của EXPERIENCE.md.

    *Mặc định.* Chưa gõ gì: **không** hàng chip dưới khay, ô soạn thảo **không** placeholder.

    *Chỉ từ khóa.* Gõ `phan quyen` ở ô tìm: dưới khay hiện chip `phan quyen` (đúng chữ đã gõ, bo
    tròn, nền `--chip-bg`), `4 ghi chú` chữ nhạt, và `về hôm nay` gạch chân bị đẩy sát phải. Ô
    soạn thảo hiện placeholder `gõ vào đây sẽ bỏ mọi điều kiện lọc`. Click chip: không có gì xảy ra.

    *Cả hai.* Gõ thêm `03/09/2026` ở ô ngày: hàng đổi thành `phan quyen` · `03/09/2026` (chữ
    monospace) · `1 ghi chú`; lưới là phép giao.

    *Không khớp.* Đổi ngày thành một ngày không có ghi chú nào: chip ghi `0 ghi chú`, lưới hiện
    `Không có ghi chú nào khớp.`, và `về hôm nay` **vẫn còn**.

    *Thứ tự Tab.* Từ nút lịch nhấn `Tab`: tiêu điểm tới `về hôm nay` (có vòng sáng), rồi mới tới
    mẩu giấy đầu tiên. Chip không bao giờ nhận tiêu điểm.

    *Về hôm nay.* Nhấn `Enter` trên nút (hoặc click): ô tìm và ô ngày về rỗng, lỗi ngày (nếu có)
    tắt, hàng chip biến mất, placeholder của ô soạn biến mất, lưới về hôm nay, và **tiêu điểm ở ô
    soạn thảo**.

    *Gõ vào ô soạn KHÔNG bỏ điều kiện — cách hiểu đã chốt.* Đang lọc, gõ vài chữ vào ô soạn: điều
    kiện **còn nguyên** (chip vẫn đó). Điều kiện chỉ bị bỏ khi **chốt thật** bằng `Ctrl+Enter`
    (Story 2.3, AD-15): dòng "gõ vào ô soạn thảo" trong bảng sáu dòng được hiểu là "chốt từ ô soạn
    thảo", và placeholder cảnh báo nói trước điều đó.

    *Tải lại.* Đang lọc, tải lại trang: về khung nhìn mặc định, không hàng chip — điều kiện không
    bao giờ xuống kho.

    *Cả hai theme.* Lặp phần hàng chip và phần `0 ghi chú` ở bản dark (mục 14): chữ chip, số kết
    quả và `về hôm nay` đều đọc rõ.

35. **Trần 50 kết quả: thấy đủ để biết phải thu hẹp.** Mở trang qua HTTP localhost (mục 1), nạp
    một file sao lưu có ít nhất 63 ghi chú chứa `Phân` (rải nhiều ngày). Gõ `phan` ở ô tìm.

    *Vượt trần.* Lưới hiện đúng 50 mẩu mới nhất; dưới mẩu cuối là một dòng chữ nhạt trải hết bề
    ngang: `Hiện 50 ghi chú đầu, còn nhiều hơn. Thêm bộ lọc ngày hoặc gõ thêm chữ để thu hẹp.`
    Dòng không bấm được, không nhận tiêu điểm khi nhấn `Tab`. Hàng chip ghi `63 ghi chú` (số thật,
    không phải 50).

    *Thu hẹp.* Gõ thêm chữ hoặc một ngày cho tới khi còn ≤ 50 khớp: dòng biến mất; chip ghi đúng số.
    Không khớp gì: chỉ còn `Không có ghi chú nào khớp.`, không dòng "còn nhiều hơn".

    *Tiêu đề tab.* Tiêu đề vẫn đếm số ghi chú HÔM NAY, không bị trần cắt.

    *Tốc độ.* Mỗi phím gõ lọc lại không thấy trễ (2.000 ghi chú ≤ 200 ms, `npm test` ghim).

    *Cả hai theme.* Lặp ở bản dark (mục 14): dòng "còn nhiều hơn" đọc rõ.


### Tiêu điểm sau mỗi lượt vẽ lại — một mục phải làm bằng mắt (Story 7.0)

36. **Bàn phím không bao giờ rơi về đầu trang, và không bị giật về thân mẩu.** Mở trang qua HTTP
    localhost (mục 1) với ít nhất ba ghi chú ngắn đã chốt hôm nay. `npm run thu-bo-cuc` đã lái
    bốn đường dưới đây bằng phím thật; mục này là lần nhìn bằng mắt vòng sáng nằm ở đâu.

    *Shift+Tab sang `xóa`.* `Tab` tới một mẩu, `Enter` để vào chế độ sửa, rồi `Shift+Tab`: ô sửa
    đóng, và vòng sáng nằm trên **nút `xóa` của chính mẩu đó** — không nhảy về thân mẩu. Nhấn
    `Enter` ngay: hộp thoại xóa mở ra hỏi về mẩu đó (không phải ô sửa mở lại). `Esc` để đóng:
    vòng sáng lại nằm trên nút `xóa` ấy.

    *Tab ra mẩu kế.* Vào chế độ sửa một mẩu rồi nhấn `Tab`: vòng sáng nằm trên **thân mẩu kế
    tiếp**, và `Tab` thêm lần nữa đi tới nút `xóa` của mẩu đó — không bắt đầu lại từ đầu trang.

    *Rời ô sửa rỗng.* Vào chế độ sửa, xóa sạch chữ, rồi `Shift+Tab`: mẩu biến mất (mục 30), và
    con trỏ nháy trong **ô soạn thảo** — không mất hẳn tiêu điểm (nhấn `Tab` một lần: tiêu điểm
    tới ô tìm, không phải điểm dừng đầu trang).

    *Sửa một kết quả tìm tới hết khớp.* Gõ một chữ ở ô tìm sao cho còn đúng một mẩu khớp. Vào chế
    độ sửa mẩu đó, thay hết chữ bằng một câu không còn chứa từ khóa, đợi một giây: mẩu **vẫn đứng
    yên** trong lúc đang gõ. `Shift+Tab`: mẩu biến khỏi lưới, lưới đọc `Không có ghi chú nào
    khớp.`, và con trỏ ở **ô soạn thảo**. Xóa ô tìm: mẩu đã sửa hiện lại ở khung nhìn hôm nay với
    chữ mới.

    *Cả hai theme.* Lặp ở bản dark (mục 14): vòng sáng trên nút `xóa` nhìn rõ.

### Hai tab song song — kênh `ghichu` (Story 7.1)

37. **Tab kia thấy ngay, không F5, và không nói gì.** Mở trang ở **hai tab** cùng origin (mục 1).
    `npm run thu-bo-cuc` đã lái hai tab thật qua CDP: chốt / sửa / xóa lan sang, theme lan sang,
    bản nháp tab kia nguyên vẹn, và dải băng khi mẩu đang sửa bị xóa. **Chỉ làm tay** (bộ đo
    không lái): mốc sao lưu lan sang, tiêu điểm giữ nguyên khi có tin đến, và nút `✕` của dải
    băng bấm qua giao diện. Các bước còn lại là lần nhìn bằng mắt.

    *Chốt, sửa, xóa.* Chốt một ghi chú ở tab A: tab B hiện mẩu mới và tiêu đề tab của B tăng một,
    không dải băng nào. Sửa mẩu đó ở A, đợi một giây: B hiện chữ mới. Xóa ở A: mẩu biến khỏi B.

    *Bản nháp.* Gõ dở vào ô soạn của B (đừng chốt), rồi chốt một ghi chú ở A: ô soạn của B còn
    nguyên chữ, con trỏ vẫn ở đó.

    *Theme và mốc sao lưu.* Lật theme ở A: B đổi màu và nhãn nút. Xuất sao lưu ở A: dòng nhắc sao
    lưu ở chân trang của B đổi theo.

    *Tiêu điểm.* Ở B, `Tab` tới nút `xóa` của một mẩu (hay tới nút `về hôm nay` khi đang tìm), rồi
    chốt một ghi chú ở A: vòng sáng ở B vẫn nằm trên đúng nút đó, không rơi về đầu trang.

    *Mẩu đang sửa bị xóa ở tab khác.* Ở A vào chế độ sửa một mẩu và gõ thêm vài chữ. Ở B xóa đúng
    mẩu đó. A hiện dải băng `Ghi chú này vừa bị xóa ở tab khác. Chép chữ ra trước khi rời ô sửa
    nếu còn cần.`, ô sửa còn nguyên chữ. Rời ô sửa (`Tab`): mẩu biến mất, con trỏ ở ô soạn thảo,
    và tải lại B thì mẩu **không** sống lại. Nút `✕` đóng được dải băng.
