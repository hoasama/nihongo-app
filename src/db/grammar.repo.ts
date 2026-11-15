import type { Queryable } from "./queryable";
import type {
  GrammarDetail,
  GrammarExample,
  GrammarSummary,
} from "../shared/types";

export async function listGrammar(
  db: Queryable,
  level: string,
): Promise<GrammarSummary[]> {
  return db.select<GrammarSummary>(
    `SELECT id, title, jlpt_level, structure FROM grammar
     WHERE jlpt_level = ? ORDER BY id`,
    [level],
  );
}

export async function getGrammarDetail(
  db: Queryable,
  id: number,
): Promise<GrammarDetail | null> {
  const rows = await db.select<
    Omit<GrammarDetail, "examples"> & { examples_json: string | null }
  >(
    `SELECT id, title, jlpt_level, structure, meaning_vi, explanation_vi, examples_json
     FROM grammar WHERE id = ?`,
    [id],
  );
  const g = rows[0];
  if (!g) return null;
  const { examples_json, ...rest } = g;
  let examples: GrammarExample[] = [];
  if (examples_json) {
    try {
      examples = JSON.parse(examples_json) as GrammarExample[];
    } catch {
      examples = [];
    }
  }
  return { ...rest, examples };
}
