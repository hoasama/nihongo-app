import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./Layout";
import { DictionaryPage } from "../features/dictionary/DictionaryPage";
import { WordDetail } from "../features/dictionary/WordDetail";

const rootRoute = createRootRoute({ component: Layout });

// Placeholder screens — thay bằng feature pages ở các Task sau.
function Placeholder({ title }: { title: string }) {
  return <h2 className="text-xl font-semibold">{title}</h2>;
}

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
  component: () => <Placeholder title="Kanji" />,
});
const grammarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/grammar",
  component: () => <Placeholder title="Ngữ pháp" />,
});
const savedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/saved",
  component: () => <Placeholder title="Đã lưu" />,
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => <Placeholder title="Cài đặt" />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  wordRoute,
  kanjiRoute,
  grammarRoute,
  savedRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
