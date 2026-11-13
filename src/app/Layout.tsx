import { Link, Outlet } from "@tanstack/react-router";

const NAV = [
  { to: "/", label: "Tra từ", exact: true },
  { to: "/kanji", label: "Kanji", exact: false },
  { to: "/grammar", label: "Ngữ pháp", exact: false },
  { to: "/saved", label: "Đã lưu", exact: false },
  { to: "/settings", label: "Cài đặt", exact: false },
] as const;

export function Layout() {
  return (
    <div className="flex h-full text-slate-900 dark:text-slate-100">
      <aside className="w-48 shrink-0 border-r border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-4 px-2 text-lg font-bold">日本語</h1>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="rounded px-2 py-1.5 text-sm hover:bg-slate-200 dark:hover:bg-slate-800"
              activeProps={{
                className:
                  "rounded px-2 py-1.5 text-sm bg-slate-200 font-medium dark:bg-slate-800",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-white p-6 dark:bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
}
