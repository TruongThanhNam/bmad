---
title: "Addendum: Ghi chú hàng ngày"
status: final
created: 2026-09-08
updated: 2026-09-08
parent: brief.md
---

# Addendum — Ghi chú hàng ngày

Chi tiết bối cảnh không đủ chỗ trong [`brief.md`](./brief.md) (mục tiêu 1-2 trang), nhưng cần cho
PRD và Architecture về sau. Đây là bằng chứng đứng sau ba quyết định trong brief: **loại
always-on-top**, **chọn local-first**, và **đưa export vào MVP**.

> ⚠️ **Ràng buộc quan trọng nhất trong tài liệu này:** always-on-top chỉ app native làm được — trình
> duyệt không cho. Đây là ràng buộc trực tiếp lên lựa chọn form-factor web, cần biết trước mọi quyết
> định về tính năng.

## Khoảng trống trên thị trường

Đây là mục PRD sẽ dùng; các mục còn lại là bằng chứng cho nó. Tất cả dựa trên phàn nàn và đánh giá
tìm được, không phải suy đoán.

1. **Persistence đáng tin.** Chủ đề lớn nhất trên Microsoft Q&A là ghi chú lặng lẽ biến mất sau
   update hoặc đổi tài khoản — xem bảng *Phàn nàn* bên dưới, dòng 1.
2. **Tốc độ.** Người dùng nói thẳng bản dựng lại trong OneNote phản bội tiền đề "nhỏ và nhanh" —
   bảng *Phàn nàn*, dòng 2.
3. **Local-first, không cần tài khoản.** Microsoft bắt buộc tài khoản để sync; cả một hệ sinh thái
   extension tồn tại chính vì người ta muốn dữ liệu ở lại máy mình.
4. **Cấu trúc nhẹ — giữa "phẳng lì" và "quá nặng".** Google Keep bị chê không có thư mục hay lồng
   cấp, không có rich text hay bảng ([Capterra](https://www.capterra.com/p/233847/Google-Keep/reviews/),
   [Cloudwards](https://www.cloudwards.net/google-keep-review/)); Sticky Notes bị chê không có tag
   hay notebook. Notion và Obsidian giải quyết cấu trúc nhưng đánh mất tốc độ gõ.
5. **Always-on-top trên web.** Xem callout ở đầu tài liệu. Các app desktop lấy tính năng này làm
   điểm bán (Noticky, Pinny Notes) tồn tại chính vì trình duyệt không làm được.

## Microsoft Sticky Notes — trạng thái hiện tại

**Không còn là app độc lập.** Từ 08/2024, Microsoft thay app UWP (đời 2016) bằng bản Win32 dựng lại,
nay nằm **bên trong OneNote**. Cả bản cũ và bản mới có thể cùng xuất hiện trong Start menu — riêng
chuyện này đã bị người dùng phàn nàn là gây nhầm lẫn.

- Nguồn: [TechCommunity](https://techcommunity.microsoft.com/blog/microsoft365insiderblog/introducing-the-new-sticky-notes-app-on-windows/4223819) ·
  [Windows Central](https://www.windowscentral.com/software-apps/windows-11/how-to-troubleshoot-the-new-sticky-notes-app-on-windows-11)

**Tính năng hiện có**

- Pin-to-desktop / always-on-top
- Nút screenshot: chụp vùng màn hình và ghi lại app hoặc URL nguồn
- Contextual surfacing: note gắn với một app sẽ tự nổi lên khi app đó chạy
- Tìm kiếm; OCR trích xuất text
- Sync khi đăng nhập tài khoản Microsoft

Nguồn: [Windows Central](https://www.windowscentral.com/software-apps/the-sticky-notes-app-just-got-the-biggest-update-since-microsoft-shipped-windows-11) ·
[itechguides](https://www.itechguides.com/the-new-sticky-notes-app-in-windows-11-is-here-heres-whats-new/)

**Nơi chạy**

| Nền tảng | Trạng thái |
|---|---|
| Windows | Qua OneNote |
| Web | `onenote.com/stickynotes`, và trong Outlook web / Outlook.com Notes |
| Mobile | Chỉ bên trong OneNote hoặc Outlook cho iOS/Android |

Nguồn: [MS Support](https://support.microsoft.com/en-us/windows/apps/stickynotes/see-your-sticky-notes-on-other-devices-and-the-web) ·
[Outlook web notes](https://support.microsoft.com/en-us/windows/apps/stickynotes/create-edit-and-view-sticky-notes-in-outlook-com-or-outlook-on-the-web)

**Phàn nàn được ghi nhận nhiều nhất**

| Vấn đề | Bằng chứng |
|---|---|
| **Mất dữ liệu / sync hỏng** — chủ đề ồn ào nhất | Microsoft Q&A 2025: [ghi chú biến mất](https://learn.microsoft.com/en-us/answers/questions/5454982/all-my-sticky-notes-are-gone-what-happened), [update xóa mất ghi chú](https://learn.microsoft.com/en-us/answers/questions/5820567/microsoft-update-deleted-my-sticky-notes-looking-t), [sync trên Android lỗi mà không báo](https://learn.microsoft.com/en-us/answers/questions/5664429/unable-to-view-sticky-notes-on-my-android-device-a). Trích user: *"the app will not load the data locally, it is always loading the incorrect data from the cloud"*; một người *"mất một nửa số notes"* và không khôi phục được |
| **Chậm và lag hơn bản cũ** | [Neowin: "users are not happy"](https://www.neowin.net/news/microsoft-released-the-new-sticky-notes-app-for-everyone-and-users-are-not-happy/) · [Windows Latest](https://www.windowslatest.com/2024/08/09/the-new-sticky-notes-preview-rolls-out-on-windows-11-with-mixed-reviews/) |
| **Bị bundle, không gỡ riêng được** — muốn bỏ thì phải gỡ cả OneNote/Office | Neowin |
| **Không có tag, notebook hay phân cấp; format tối thiểu; buộc tài khoản Microsoft; Windows-centric** | [SaaSHub](https://www.saashub.com/compare-microsoft-sticky-notes-vs-notepad) |
| **Dấu hiệu bị bỏ bê** — Store listing "What's New" vẫn ghi 2020 trong khi support nói vẫn đang phát triển | [MS Q&A thread](https://learn.microsoft.com/en-us/answers/questions/5339451/sticky-notes-whats-new-at-microsoft-store-etc) |

## Hướng đi của Microsoft trong 2026

Microsoft dồn lực vào OneNote và Copilot: Copilot Notebooks GA khoảng 01/2026, multimodal Capture
trên Windows dự kiến 07/2026. Sticky Notes là một tính năng bên trong đó, không phải một dòng sản
phẩm độc lập ([windowsforum](https://windowsforum.com/threads/onenote-windows-multimodal-capture-for-copilot-notebooks-arrives-july-2026.432252/)).

*Chưa xác nhận được* có đợt phát hành tính năng nào riêng cho Sticky Notes trong 2026.

## Đối thủ trên web

> Bảng này ở mức định hướng, không phải kết quả tra cứu có dẫn nguồn từng dòng. Nguồn tổng hợp:
> [ClickUp roundup](https://clickup.com/blog/online-sticky-notes/) và các listing trên Chrome Web Store.

| Sản phẩm | Định vị |
|---|---|
| **Google Keep** | Capture nhanh không ma sát; màu, nhãn, ghim, nhắc nhở, sync realtime. Vẫn là chuẩn so sánh |
| **Notion** | Workspace nền database; mạnh nhưng nặng, setup lâu, chậm khi nhiều dữ liệu, phụ thuộc online |
| **Obsidian** | Markdown local + backlinks; không có web app thật; khó học |
| **Apple Notes** | Mạnh trong hệ sinh thái Apple, truy cập web qua iCloud.com *(chưa verify riêng)* |
| **Miro / Padlet / Stormboard / Lino / IdeaBoardz** | Canvas cộng tác; IdeaBoardz và Lino dùng được mà không cần login |
| **Extension stickies** (Tab Sticky Notes, Simple Sticky Notes, AlwaysOnTopNotes) | HTML tĩnh + IndexedDB, dữ liệu không rời máy |
| **Memos** | Open-source self-hosted, markdown-native — xem `usememos/memos` ở bảng dưới |

**Đáng chú ý:** không có sản phẩm nào trong bảng này đặt cược vào việc *từ chối* tính năng. Tất cả
đều lớn dần lên theo thời gian.

## Dự án open-source đã có

Tra qua GitHub API, 09/2026.

| Repo | Stars | Ghi chú |
|---|---|---|
| `usememos/memos` | 62.836 | Go, self-hosted quick capture — người khổng lồ của mảng này |
| `Cvaniak/NoteSH` | 489 | Sticky notes trên terminal |
| `fabiospampinato/noty` | 345 | TypeScript, bỏ hoang từ 2019 |
| `zonetti/zonote` | 315 | Electron, markdown + tabs |
| `ericerkz/kept` | 179 | Google Keep clone self-hosted, TypeScript, đang active |
| `ychisbest/AnyNote` | 158 | Sticky notes self-hosted, Dart |
| `pinussilvestrus/postit-js` | 97 | Post-it board trên web, đang active |
| `sarfraznawaz2005/HTML5Sticky` | 59 | Sticky notes web, bỏ hoang từ 2020 |

**Đáng chú ý:** không tìm thấy app sticky-note **thuần web**, nhiều sao, đang được bảo trì. Lượng
sao tập trung ở công cụ terminal hoặc desktop, hoặc ở note hub tổng quát như memos.

## Giới hạn của đợt tra cứu này

Reddit chặn fetcher, nên không có trích dẫn subreddit trực tiếp. Bằng chứng user-voice ở trên đến từ
Microsoft Q&A, Neowin, Windows Latest, Capterra và SaaSHub.
