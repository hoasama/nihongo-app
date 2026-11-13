# Dữ liệu nguồn cho ETL (không commit)

Thư mục này chứa các file dữ liệu gốc để sinh `seed.sqlite`. **Không commit** các file này
(đã nằm trong `.gitignore`) vì dung lượng lớn và có ràng buộc giấy phép riêng.

## Cách chạy

- Build thử với dữ liệu mẫu (fixtures, không cần tải gì):
  ```powershell
  $env:SEED_SAMPLE='1'; npm run build:seed
  ```
- Build đầy đủ: tải các file dưới đây vào thư mục này rồi:
  ```powershell
  npm run build:seed
  ```

## Các file cần tải

| File đặt vào đây | Nguồn | Giấy phép |
|-----------------|-------|-----------|
| `JMdict_e.xml` | JMdict (bản English-only) — http://www.edrdg.org/jmdict/edict_doc.html (giải nén `JMdict_e.gz`) | CC BY-SA 4.0 — © EDRDG |
| `kanjidic2.xml` | KANJIDIC2 — http://www.edrdg.org/kanjidic/kanjidic2.xml.gz (giải nén) | CC BY-SA 4.0 — © EDRDG |
| `sentences.csv` | Tatoeba exports — https://tatoeba.org/downloads (`sentences.csv`, tab-separated: id⟶lang⟶text) | CC BY 2.0 FR |
| `jlpt-lists.json` | List từ vựng/kanji N5–N4 cộng đồng, gộp theo định dạng dưới | Theo repo nguồn |

### Định dạng `jlpt-lists.json`

```json
{
  "vocab": { "N5": ["食べる", "..."], "N4": ["..."] },
  "kanji": { "N5": ["日", "..."], "N4": ["..."] }
}
```

## Giấy phép & ghi công

- JMdict / KANJIDIC2 là tài sản của **Electronic Dictionary Research and Development Group (EDRDG)**,
  dùng theo giấy phép **CC BY-SA 4.0**. App phải hiển thị ghi công (xem màn "Nguồn dữ liệu").
- Câu ví dụ từ **Tatoeba** theo **CC BY 2.0 FR**.
- JLPT **không công bố danh sách chính thức**; list dùng ở đây là của cộng đồng, có thể sai số nhỏ.
