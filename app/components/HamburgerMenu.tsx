import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { CloudflareUser } from "../lib/cloudflare-auth";
import { LOGOUT_URL } from "../lib/cloudflare-auth";
import { Button } from "./common/Button";
import {
  HamburgerIcon,
  CloseIcon,
  ListIcon,
  PlusIcon,
  SettingsIcon,
  LogoutIcon,
  LoginIcon,
} from "./common/Icons";
import { spacing } from "../lib/styles";

interface HamburgerMenuProps {
  user: CloudflareUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function HamburgerMenu({
  user,
  isAuthenticated,
  isLoading,
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // ESCキーでメニューを閉じる + メニュー外クリックで閉じる
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      // メニューが開いている間はボディのスクロールを無効にする
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <div className="md:hidden relative">
      {/* ハンバーガーメニューボタン */}
      <Button
        variant="ghost"
        size="md"
        onClick={toggleMenu}
        className="p-2"
        icon={isOpen ? <CloseIcon size="lg" /> : <HamburgerIcon size="lg" />}
        aria-label="メニューを開く"
        aria-expanded={isOpen}
      />

      {/* メニューコンテンツ */}
      <div
        ref={menuRef}
        className={`fixed top-0 left-0 h-full w-full max-w-sm bg-white shadow-2xl border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">メニュー</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMenu}
              icon={<CloseIcon size="md" />}
              aria-label="メニューを閉じる"
            />
          </div>

          {/* ユーザー情報セクション */}
          {!isLoading && isAuthenticated && user && (
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center space-x-3">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name || user.email}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    {user.name || user.email}
                  </div>
                  <div className="text-xs text-blue-600">
                    編集権限でログイン中
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ナビゲーションメニュー */}
          <nav className="flex-1 p-4">
            <div className={spacing.menu}>
              <Link
                to="/"
                onClick={closeMenu}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <ListIcon size="md" className="mr-3 text-gray-400" />
                手ぬぐい一覧
              </Link>

              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/items/new"
                        onClick={closeMenu}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      >
                        <PlusIcon size="md" className="mr-3 text-gray-400" />
                        手ぬぐい追加
                      </Link>
                      <Link
                        to="/settings"
                        onClick={closeMenu}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      >
                        <SettingsIcon
                          size="md"
                          className="mr-3 text-gray-400"
                        />
                        設定
                      </Link>
                    </>
                  ) : (
                    <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                      <PlusIcon size="md" className="mr-3 text-gray-300" />
                      手ぬぐい追加（ログインが必要）
                    </div>
                  )}
                </>
              )}
            </div>
          </nav>

          {/* フッターエリア */}
          <div className="border-t border-gray-200 p-4">
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    icon={<LogoutIcon size="sm" />}
                    onClick={() => (window.location.href = LOGOUT_URL)}
                  >
                    ログアウト
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    icon={<LoginIcon size="sm" />}
                    onClick={() =>
                      (window.location.href = "/auth?action=login")
                    }
                  >
                    Googleでログイン
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
