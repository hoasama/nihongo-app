export function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-xl font-semibold">Nguồn dữ liệu & ghi công</h2>
      <p className="mb-4 text-slate-600 dark:text-slate-300">
        Nihongo là app học tiếng Nhật cá nhân, chạy offline. Dữ liệu từ các dự án
        mở sau đây:
      </p>
      <ul className="space-y-3 text-sm">
        <li>
          <strong>JMdict</strong> (từ điển Nhật–Anh) & <strong>KANJIDIC2</strong>{" "}
          (kanji) — © Electronic Dictionary Research and Development Group
          (EDRDG), dùng theo giấy phép <em>CC BY-SA 4.0</em>.
        </li>
        <li>
          <strong>Tatoeba</strong> (câu ví dụ) — giấy phép <em>CC BY 2.0 FR</em>.
        </li>
        <li>
          Phân cấp <strong>JLPT N5/N4</strong> dựa trên dữ liệu KANJIDIC2 và
          danh sách cộng đồng. JLPT không công bố danh sách chính thức nên có thể
          có sai số nhỏ.
        </li>
        <li>
          Ngữ pháp N5/N4 được biên soạn tham khảo giáo trình Minna no Nihongo &
          Marugoto.
        </li>
      </ul>
    </div>
  );
}
