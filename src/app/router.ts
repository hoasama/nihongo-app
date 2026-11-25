import { createRouter, createWebHashHistory } from "vue-router";
import DictionaryPage from "../features/dictionary/DictionaryPage.vue";
import WordDetail from "../features/dictionary/WordDetail.vue";
import KanjiPage from "../features/kanji/KanjiPage.vue";
import KanjiDetail from "../features/kanji/KanjiDetail.vue";
import GrammarPage from "../features/grammar/GrammarPage.vue";
import GrammarDetail from "../features/grammar/GrammarDetail.vue";
import SavedPage from "../features/saved/SavedPage.vue";
import SettingsPage from "../features/settings/SettingsPage.vue";
import AboutPage from "../features/about/AboutPage.vue";
import SrsDecksPage from "../features/srs/SrsDecksPage.vue";
import StudySession from "../features/srs/StudySession.vue";
import ReadingPage from "../features/reading/ReadingPage.vue";

// hash history vì Electron load qua file:// (history thường không chạy với file://)
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: DictionaryPage },
    { path: "/word/:id", component: WordDetail },
    { path: "/kanji", component: KanjiPage },
    { path: "/kanji/:id", component: KanjiDetail },
    { path: "/grammar", component: GrammarPage },
    { path: "/grammar/:id", component: GrammarDetail },
    { path: "/review/session/:deckId", component: StudySession },
    { path: "/review/:category?", component: SrsDecksPage },
    { path: "/read", component: ReadingPage },
    { path: "/saved", component: SavedPage },
    { path: "/settings", component: SettingsPage },
    { path: "/about", component: AboutPage },
  ],
});
