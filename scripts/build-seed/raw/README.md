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
| `openjlpt-n5.json`, `openjlpt-n4.json` | OpenJLPT **vocab** theo cấp — https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/vocab/n5.json (và `n4.json`). Cấp JLPT + câu ví dụ (Tatoeba) + furigana cho từ vựng. | CC BY-SA 4.0 (ví dụ: Tatoeba CC BY) |
| `openjlpt-kanji-n5.json`, `openjlpt-kanji-n4.json` | OpenJLPT **kanji** theo cấp — https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/kanji/n5.json (và `n4.json`). Cấp JLPT cho kanji (thay KANJIDIC2 old-jlpt). | CC BY-SA 4.0 |

Tải nhanh OpenJLPT:
```powershell
curl -o scripts/build-seed/raw/openjlpt-n5.json https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/vocab/n5.json
curl -o scripts/build-seed/raw/openjlpt-n4.json https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/vocab/n4.json
curl -o scripts/build-seed/raw/openjlpt-kanji-n5.json https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/kanji/n5.json
curl -o scripts/build-seed/raw/openjlpt-kanji-n4.json https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/kanji/n4.json
```

## Giấy phép & ghi công

- JMdict / KANJIDIC2 là tài sản của **Electronic Dictionary Research and Development Group (EDRDG)**,
  dùng theo giấy phép **CC BY-SA 4.0**. App phải hiển thị ghi công (xem màn "Nguồn dữ liệu").
- **OpenJLPT** (evanclan/OpenJLPT) theo **CC BY-SA 4.0**; câu ví dụ gốc từ **Tatoeba** (**CC BY 2.0 FR**).
- JLPT **không công bố danh sách chính thức**; list dùng ở đây là của cộng đồng, có thể sai số nhỏ.
