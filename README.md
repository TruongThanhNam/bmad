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

**Mục 10-13 (bản nháp) chạy được bằng máy:**

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
nghiệm thu được trên kho thật. Trong Console, gõ bản nháp bằng
`(await import('./app/main.js')).store.datBanNhap('phở bò')` cho tới khi có ô soạn thảo thật
(Story 2.2).

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
