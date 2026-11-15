// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { makeTestDb, type TestDb } from "./makeTestDb";
import { listGrammar, getGrammarDetail } from "../grammar.repo";

function seed(t: TestDb) {
  t.raw.exec(`INSERT INTO grammar (id, title, jlpt_level, structure, meaning_vi, explanation_vi, examples_json) VALUES
    (1,'〜です','N5','N＋です','là','giải thích','[{"jp":"学生です","vi":"là học sinh"}]'),
    (2,'〜ました','N4','V-ました','đã làm','gt2','[]')`);
}

describe("grammar.repo", () => {
  let t: TestDb;
  beforeEach(() => {
    t = makeTestDb();
    seed(t);
  });

  it("listGrammar lọc theo cấp", async () => {
    const n5 = await listGrammar(t.q, "N5");
    expect(n5.map((g) => g.title)).toEqual(["〜です"]);
  });

  it("getGrammarDetail parse examples_json", async () => {
    const d = await getGrammarDetail(t.q, 1);
    expect(d?.meaning_vi).toBe("là");
    expect(d?.examples).toHaveLength(1);
    expect(d?.examples[0].jp).toBe("学生です");
  });

  it("getGrammarDetail trả null khi không có", async () => {
    expect(await getGrammarDetail(t.q, 999)).toBeNull();
  });
});
