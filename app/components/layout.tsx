import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { HamburgerMenu } from "./HamburgerMenu";
import { LOGOUT_URL } from "../lib/cloudflare-auth";

export default function Layout() {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <div>
      {/* シンプルなヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <nav className="container mx-auto px-4 py-3 flex items-center">
          {/* ハンバーガーメニュー */}
          <HamburgerMenu
            user={user}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
          />

          {/* サイトタイトル */}
          <Link
            to="/"
            className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight ml-3 md:ml-0 md:flex-1 md:text-center"
          >
            わたしの手ぬぐい帖
          </Link>

          {/* PCでの展開メニュー */}
          <div className="hidden md:flex items-center space-x-4 xl:space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              手ぬぐい一覧
            </Link>
            {!isLoading &&
              (isAuthenticated ? (
                <>
                  <Link
                    to="/items/new"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    手ぬぐい追加
                  </Link>
                  <Link
                    to="/settings"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    設定
                  </Link>
                  {/* ユーザー情報とログアウト */}
                  {user && (
                    <div className="flex items-center space-x-2 xl:space-x-3 ml-2 xl:ml-4 pl-2 xl:pl-4 border-l border-gray-300">
                      {user.picture && (
                        <img
                          src={user.picture}
                          alt={user.name || user.email}
                          className="w-7 h-7 xl:w-8 xl:h-8 rounded-full"
                        />
                      )}
                      <div className="text-sm hidden lg:block">
                        <div className="font-medium text-gray-900">
                          {user.name || user.email}
                        </div>
                      </div>
                      <a
                        href={LOGOUT_URL}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 xl:px-3 py-1 rounded text-xs xl:text-sm font-medium transition-colors"
                      >
                        ログアウト
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="text-gray-400 cursor-not-allowed">
                    手ぬぐい追加
                  </span>
                  <a
                    href="/auth?action=login"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 xl:px-4 py-1.5 xl:py-2 rounded text-xs xl:text-sm font-medium transition-colors"
                  >
                    Googleでログイン
                  </a>
                </>
              ))}
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
