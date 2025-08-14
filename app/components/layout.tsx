import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div>
      <header className="bg-white border-b border-gray-200">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* サイトタイトル */}
          <Link
            to="/"
            className="text-2xl font-bold text-gray-800 tracking-tight"
          >
            わたしの手ぬぐい帖
          </Link>

          {/* ナビゲーションリンク */}
          <div className="flex space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              ホーム
            </Link>
            <Link
              to="/items"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              手ぬぐい一覧
            </Link>
            <Link
              to="/items/new"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              手ぬぐい追加
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
