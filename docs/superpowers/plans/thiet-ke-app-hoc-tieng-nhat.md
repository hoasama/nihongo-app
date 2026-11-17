# Thiết kế app desktop học tiếng Nhật

> Stack: Electron + Vue 3 + Vite + TypeScript · SQLite (better-sqlite3) · Ant Design Vue
> Mục tiêu: học song song với khóa Riki (N5 → N4), app tập trung vào ghi nhớ, thực hành và theo dõi tiến độ.

## Bố cục tổng thể

```
┌──────────────┬──────────────────────────────────────┐
│ 🏠 Hôm nay    │                                      │
│ 🗺 Lộ trình   │                                      │
│ 🔁 Ôn tập     │          Nội dung từng mục           │
│ ✍️ Luyện tập  │                                      │
│ 📚 Kho từ     │                                      │
│ 📊 Thống kê   │                                      │
│ ⚙️ Cài đặt    │                                      │
└──────────────┴──────────────────────────────────────┘
```

---

## 1. 🏠 Hôm nay (Dashboard)

Màn hình mở ra mỗi ngày, trả lời câu hỏi: **"Hôm nay cần làm gì?"**

- Số thẻ cần ôn hôm nay + nút **Bắt đầu ôn**
- Bài Riki tiếp theo + nút mở bài (trong app hoặc trên Chrome)
- Streak, số phút đã học hôm nay
- Đếm ngược tới ngày thi JLPT
- Điểm yếu gần đây (lấy từ Nhật ký lỗi sai)

---

## 2. 🗺 Lộ trình (bám theo khóa Riki)

- Dạng cây: **Giai đoạn → Bài**
- Trạng thái mỗi bài: `chưa học` / `đang học` / `hoàn thành`
- Chi tiết một bài:
  - Từ vựng, ngữ pháp, kanji của bài (dán vào → AI chuẩn hóa thành dữ liệu → duyệt lại)
  - Ghi chú tự do (Markdown)
  - Nút **Hoàn thành bài**: đưa toàn bộ nội dung bài vào lịch ôn SRS
- Bài hiện tại là mốc **"đã học tới đâu"**, để AI giới hạn phạm vi khi tạo bài tập

---

## 3. 🔁 Ôn tập — mục đích: NHỚ

Thẻ SRS cho các đơn vị kiến thức nhỏ, có đáp án cố định. **Gồm cả từ vựng, kanji và ngữ pháp.**

| Loại | Dạng thẻ |
|---|---|
| Từ vựng | từ ↔ nghĩa, nghe ↔ từ, nghĩa → gõ từ (IME) |
| Kanji | chữ ↔ âm đọc, nghĩa |
| Ngữ pháp | mẫu ↔ ý nghĩa + cấu trúc, điền chỗ trống (cloze) với câu ví dụ cố định |

- Lịch ôn dùng thuật toán **FSRS** (`ts-fsrs`)
- Lọc ôn theo bài hoặc theo loại
- Phím tắt `1-2-3-4` để chấm điểm nhanh
- Thời lượng gợi ý: 10–15 phút mỗi ngày

---

## 4. ✍️ Luyện tập — mục đích: DÙNG

Áp dụng kiến thức vào câu cụ thể; **mỗi lần làm là một đề mới**, trộn cả từ vựng và ngữ pháp.

- **Chia động từ**: drill thể て / ない / た / khả năng / bị động…
- **Bài tập AI theo bài**: chọn bài, AI tạo câu hỏi chỉ trong phạm vi đã học
- **Đề kiểm tra chương**: format JLPT N4 (文字・語彙・文法), có chấm điểm và giải thích
- **Nhật ký lỗi sai**: câu sai trong app + câu tự ghi lại từ test Riki; AI phân loại điểm yếu và tạo bài luyện riêng

### Liên kết giữa Ôn tập và Luyện tập

```
Luyện tập: làm sai câu dùng 〜てもいい
        │
        ▼
Thẻ SRS "〜てもいいです" bị đưa lịch ôn về sớm hơn
        + câu sai được ghi vào Nhật ký lỗi sai
```

> Ví dụ với `〜てもいいです`:
> - **Ôn tập**: mặt trước `〜てもいいです` → mặt sau "được phép làm…", cấu trúc `V て + もいいです`
> - **Luyện tập**: 「ここで写真を（撮る）＿＿か。」 → chia động từ cho đúng

---

## 5. 📚 Kho từ

- 3 tab: **Từ vựng / Ngữ pháp / Kanji**
- Tìm kiếm, lọc theo bài
- Mỗi mục gồm:
  - Furigana
  - Nghĩa (lấy từ **JMdict**, không lấy từ AI)
  - Ví dụ (AI tạo, gắn nhãn "AI tạo")
  - Phát âm (Web Speech API, giọng ja-JP)
  - Trạng thái nhớ (mới / đang học / đã thuộc)
- Kanji: animation thứ tự nét (**KanjiVG**)

---

## 6. 📊 Thống kê

- Heatmap ngày học
- Tỉ lệ nhớ (retention)
- Số từ đã thuộc theo cấp N5 / N4
- Tiến độ khóa Riki theo %
- Dự báo số thẻ cần ôn trong 7 ngày tới

---

## 7. ⚙️ Cài đặt

- API key cho AI (lưu bằng `safeStorage` của Electron)
- Giờ nhắc ôn
- Phím tắt (Quick Capture, mở app…)
- Ngày thi JLPT mục tiêu
- Giới hạn số thẻ mới mỗi ngày
- Backup / khôi phục database
