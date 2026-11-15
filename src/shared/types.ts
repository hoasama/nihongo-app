export type JlptLevel = "N5" | "N4";
export type ItemType = "word" | "kanji" | "grammar";

export interface WordSummary {
  id: number;
  headword: string;
  reading_kana: string;
  jlpt_level: string | null;
  is_common: number;
}

export interface Sense {
  part_of_speech: string | null;
  gloss_en: string | null;
  gloss_vi: string | null;
}

export interface Sentence {
  id: number;
  jp_text: string;
  translation_en: string | null;
}

export interface WordDetail extends WordSummary {
  reading_romaji: string | null;
  senses: Sense[];
  sentences: Sentence[];
}

export interface KanjiSummary {
  id: number;
  literal: string;
  meaning_en: string | null;
  jlpt_level: string | null;
  stroke_count: number | null;
}

export interface KanjiDetail extends KanjiSummary {
  grade: number | null;
  radical: string | null;
  on_readings: string | null;
  kun_readings: string | null;
  meaning_vi: string | null;
  words: WordSummary[];
}

export interface GrammarSummary {
  id: number;
  title: string;
  jlpt_level: string;
  structure: string | null;
}

export interface GrammarExample {
  jp: string;
  vi: string;
}

export interface GrammarDetail extends GrammarSummary {
  meaning_vi: string | null;
  explanation_vi: string | null;
  examples: GrammarExample[];
}

export interface Bookmark {
  id: number;
  item_type: ItemType;
  item_id: number;
  created_at: string;
}
