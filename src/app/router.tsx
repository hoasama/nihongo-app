import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./Layout";
import { DictionaryPage } from "../features/dictionary/DictionaryPage";
import { WordDetail } from "../features/dictionary/WordDetail";
import { KanjiPage } from "../features/kanji/KanjiPage";
import { KanjiDetail } from "../features/kanji/KanjiDetail";
import { GrammarPage } from "../features/grammar/GrammarPage";
import { GrammarDetail } from "../features/grammar/GrammarDetail";
import { SavedPage } from "../features/saved/SavedPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { AboutPage } from "../features/about/AboutPage";

const rootRoute = createRootRoute({ component: Layout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DictionaryPage,
});
const wordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/word/$id",
  component: WordDetail,
});
const kanjiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kanji",
  component: KanjiPage,
});
const kanjiDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kanji/$id",
  component: KanjiDetail,
});
const grammarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/grammar",
  component: GrammarPage,
});
const grammarDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/grammar/$id",
  component: GrammarDetail,
});
const savedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/saved",
  component: SavedPage,
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  wordRoute,
  kanjiRoute,
  kanjiDetailRoute,
  grammarRoute,
  grammarDetailRoute,
  savedRoute,
  settingsRoute,
  aboutRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
