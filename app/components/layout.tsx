import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { HamburgerMenu } from "./HamburgerMenu";

export default function Layout() {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <div>
      {/* シンプルなヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* サイトタイトル */}
          <Link
            to="/"
            className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight"
          >
            わたしの手ぬぐい帖
          </Link>

          {/* ハンバーガーメニュー */}
          <HamburgerMenu
            user={user}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
          />
        </nav>
      </header>

      <main className="container mx-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
