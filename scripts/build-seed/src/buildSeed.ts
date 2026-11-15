import { DatabaseSync } from "node:sqlite";
import { readFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { toRomaji } from "wanakana";
import { parseJmdictEntry } from "./parseJmdict";
import { parseKanjidicChar } from "./parseKanjidic";
import { parseTatoeba } from "./parseTatoeba";
import { buildLevelIndex, type JlptLists } from "./jlptLevels";

const here = dirname(fileURLToPath(import.meta.url));
const base = join(here, ".."); // scripts/build-seed
const SAMPLE = process.env.SEED_SAMPLE === "1";

const fx = (f: string) => join(base, "tests/fixtures", f);
const raw = (f: string) => join(base, "raw", f);

const paths = {
  schema: join(here, "schema.sql"),
  out: join(base, "seed.sqlite"),
  grammar: join(base, "content/grammar-n5.json"),
  jmdict: SAMPLE ? fx("jmdict-sample.xml") : raw("JMdict_e.xml"),
  kanjidic: SAMPLE ? fx("kanjidic-sample.xml") : raw("kanjidic2.xml"),
  tatoeba: SAMPLE ? fx("sentences-sample.csv") : raw("sentences.csv"),
  jlpt: SAMPLE ? fx("jlpt-sample.json") : raw("jlpt-lists.json"),
};

function readIf(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

interface JlptData {
  vocab: JlptLists;
  kanji: JlptLists;
}
interface GrammarItem {
  title: string;
  jlpt_level: string;
  structure?: string;
  meaning_vi?: string;
  explanation_vi?: string;
  examples?: { jp: string; vi: string }[];
}

function main() {
  if (existsSync(paths.out)) rmSync(paths.out);
  const db = new DatabaseSync(paths.out);
  db.exec(readFileSync(paths.schema, "utf8"));

  // node:sqlite không có db.transaction() — tự bọc BEGIN/COMMIT.
  const tx = (fn: () => void) => {
    db.exec("BEGIN");
    try {
      fn();
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };

  const jlptRaw = readIf(paths.jlpt);
  const jlpt: JlptData = jlptRaw
    ? (JSON.parse(jlptRaw) as JlptData)
    : { vocab: {}, kanji: {} };
  const vocabLevel = buildLevelIndex(jlpt.vocab);
  const kanjiLevel = buildLevelIndex(jlpt.kanji);

  const stats = {
    words: 0,
    senses: 0,
    kanji: 0,
    sentences: 0,
    grammar: 0,
    links: 0,
  };

  // --- Words + senses + FTS ---
  const insWord = db.prepare(
    "INSERT INTO words (headword, reading_kana, reading_romaji, jlpt_level) VALUES (?,?,?,?)",
  );
  const insSense = db.prepare(
    "INSERT INTO senses (word_id, part_of_speech, gloss_en, order_idx) VALUES (?,?,?,?)",
  );
  const insFts = db.prepare(
    "INSERT INTO words_fts (headword, reading_kana, reading_romaji, gloss_en, gloss_vi, word_id) VALUES (?,?,?,?,?,?)",
  );
  const wordIdByHeadword = new Map<string, number>();
  const jmdictXml = readIf(paths.jmdict);
  if (jmdictXml) {
    const words = parseJmdictEntry(jmdictXml);
    tx(() => {
      for (const w of words) {
        const romaji = toRomaji(w.reading_kana);
        const level = vocabLevel.get(w.headword) ?? null;
        const id = Number(
          insWord.run(w.headword, w.reading_kana, romaji, level)
            .lastInsertRowid,
        );
        wordIdByHeadword.set(w.headword, id);
        stats.words++;
        const glossEn: string[] = [];
        w.senses.forEach((s, i) => {
          insSense.run(id, s.part_of_speech, s.gloss_en, i);
          glossEn.push(s.gloss_en);
          stats.senses++;
        });
        insFts.run(
          w.headword,
          w.reading_kana,
          romaji,
          glossEn.join("; "),
          null,
          id,
        );
      }
    });
  }

  // --- Kanji ---
  const insKanji = db.prepare(
    "INSERT OR IGNORE INTO kanji (literal, grade, jlpt_level, stroke_count, radical, on_readings, kun_readings, meaning_en, freq_rank) VALUES (?,?,?,?,?,?,?,?,?)",
  );
  const kanjiIdByLiteral = new Map<string, number>();
  const kanjiXml = readIf(paths.kanjidic);
  if (kanjiXml) {
    const kanji = parseKanjidicChar(kanjiXml);
    tx(() => {
      for (const k of kanji) {
        const level = kanjiLevel.get(k.literal) ?? null;
        const info = insKanji.run(
          k.literal,
          k.grade,
          level,
          k.stroke_count,
          k.radical,
          k.on_readings,
          k.kun_readings,
          k.meaning_en,
          k.freq_rank,
        );
        if (info.changes > 0) {
          kanjiIdByLiteral.set(k.literal, Number(info.lastInsertRowid));
          stats.kanji++;
        }
      }
    });
  }

  // --- kanji_words: liên kết kanji ↔ từ chứa nó ---
  const insLink = db.prepare(
    "INSERT OR IGNORE INTO kanji_words (kanji_id, word_id) VALUES (?,?)",
  );
  tx(() => {
    for (const [headword, wordId] of wordIdByHeadword) {
      const seen = new Set<string>();
      for (const ch of headword) {
        if (seen.has(ch)) continue;
        seen.add(ch);
        const kanjiId = kanjiIdByLiteral.get(ch);
        if (kanjiId) {
          insLink.run(kanjiId, wordId);
          stats.links++;
        }
      }
    }
  });

  // --- Sentences ---
  const insSentence = db.prepare(
    "INSERT INTO sentences (jp_text, translation_en, source) VALUES (?,?,?)",
  );
  const tatoeba = readIf(paths.tatoeba);
  if (tatoeba) {
    const sentences = parseTatoeba(tatoeba);
    tx(() => {
      for (const s of sentences) {
        insSentence.run(s.jp_text, s.translation_en, s.source);
        stats.sentences++;
      }
    });
  }

  // --- Grammar (biên soạn) ---
  const insGrammar = db.prepare(
    "INSERT INTO grammar (title, jlpt_level, structure, meaning_vi, explanation_vi, examples_json) VALUES (?,?,?,?,?,?)",
  );
  const grammarRaw = readIf(paths.grammar);
  if (grammarRaw) {
    const items = JSON.parse(grammarRaw) as GrammarItem[];
    tx(() => {
      for (const g of items) {
        insGrammar.run(
          g.title,
          g.jlpt_level,
          g.structure ?? null,
          g.meaning_vi ?? null,
          g.explanation_vi ?? null,
          JSON.stringify(g.examples ?? []),
        );
        stats.grammar++;
      }
    });
  }

  db.exec("VACUUM");
  db.close();

  console.log(`seed.sqlite build xong (${SAMPLE ? "SAMPLE" : "FULL"}):`, stats);
  console.log("→", paths.out);
}

main();
