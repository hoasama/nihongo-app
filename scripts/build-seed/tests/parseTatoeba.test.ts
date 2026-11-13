// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseTatoeba } from "../src/parseTatoeba";
import { assignLevel } from "../src/jlptLevels";

describe("parseTatoeba", () => {
  it("chỉ lấy dòng tiếng Nhật (jpn), đọc đúng jp_text", () => {
    const csv = ["1\tjpn\t私は学生です。", "2\teng\tI am a student."].join(
      "\n",
    );
    const recs = parseTatoeba(csv);
    expect(recs).toHaveLength(1);
    expect(recs[0].jp_text).toBe("私は学生です。");
    expect(recs[0].source).toBe("tatoeba:1");
  });
});

describe("assignLevel", () => {
  const lists = { N5: ["日", "食べる"], N4: ["持つ"] };
  it("trả cấp đúng khi có trong list", () => {
    expect(assignLevel("日", lists)).toBe("N5");
    expect(assignLevel("持つ", lists)).toBe("N4");
  });
  it("trả null khi không có trong list", () => {
    expect(assignLevel("難しい", lists)).toBeNull();
  });
});
