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

Nó **không** đo được phóng trình duyệt: CDP không đặt được mức zoom thật (`width` của
`Emulation.setDeviceMetricsOverride` đã tính bằng điểm ảnh CSS, `deviceScaleFactor` chỉ đổi mật
độ điểm ảnh vật lý). Phóng 200% vì thế vẫn là mục thử tay số 18 bên dưới.

Lưu ý con số: `~900px` trong spec là cách nói ước lượng cho "cửa sổ vừa". Số học của token đặt
ranh giới 3↔2 cột ở đúng **828px** (`3×260 + 2×8 + 2×16`), nên 900px thật sự vẫn là 3 cột. Bộ
đo lấy mẫu ở 800px và ghim riêng ranh giới 828px — đổi `--note-min-col`, `--grid-gap` hay
`--page-gutter` là thấy nó lệch ngay.

Hai mục còn lại phải làm bằng mắt:

18. **Phóng 200% vẫn dùng được.** Ở cửa sổ cỡ thường, `Ctrl` + `+` tới 200%: lưới về **1 cột**,
    không chữ nào bị cắt ngang, không thanh cuộn ngang, và trang **vẫn không** có thanh cuộn
    dọc ngoài — chỉ tầng lưới cuộn. Ba tầng kia đứng yên khi lăn chuột trong lưới.
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
