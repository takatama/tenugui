import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";
import { Icon } from "./gallery/Icon";
import "./layout-refinement.css";

export default function Layout() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { favorites } = useFavorites();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isFavorites =
    location.pathname === "/" &&
    new URLSearchParams(location.search).get("view") === "favorites";
  const collectionActive = location.pathname === "/" && !isFavorites;
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    let previousY = Math.max(0, window.scrollY);
    setHeaderHidden(false);
    const onScroll = () => {
      // Clamp rubber-band scrolling on mobile to the actual page bounds.
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.min(maxY, Math.max(0, window.scrollY));
      if (y !== previousY) {
        setHeaderHidden(y > (headerRef.current?.offsetHeight ?? 82) && y > previousY);
        previousY = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.key]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.key]);

  useEffect(() => {
    if (!menuOpen) return;
    // The header becomes inert while open, so remember the opener explicitly.
    const previousFocus = menuButtonRef.current;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const visibleControls = () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ) || [],
      ).filter((element) => element.getClientRects().length > 0);
    visibleControls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = visibleControls();
      const first = controls[0];
      const last = controls[controls.length - 1];
      const current = document.activeElement;
      if (!first || !last) return;
      if (
        event.shiftKey &&
        (current === first || !controls.includes(current as HTMLElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (current === last || !controls.includes(current as HTMLElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = oldOverflow;
      if (previousFocus?.isConnected && previousFocus.getClientRects().length)
        previousFocus.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        tabIndex={menuOpen ? -1 : undefined}
        aria-hidden={menuOpen || undefined}
      >
        本文へ移動
      </a>
      <header
        ref={headerRef}
        className={`shell-header${headerHidden && !menuOpen ? " shell-header-hidden" : ""}`}
        inert={menuOpen || undefined}
        aria-hidden={menuOpen || undefined}
      >
        <div className="shell-header-inner">
          <Link to="/" className="brand shell-brand">
            <BrandMark />
            <span>
              tenugui<span className="brand-japanese">手ぬぐい帖</span>
            </span>
          </Link>
          <nav className="header-navigation" aria-label="コレクション">
            <CollectionLinks
              collectionActive={collectionActive}
              favoritesActive={isFavorites}
              favoritesCount={favorites.length}
            />
          </nav>
          <button
            ref={menuButtonRef}
            className="icon-button shell-menu-trigger"
            type="button"
            aria-label="メニューを開く"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="collection-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </header>
      {menuOpen && (
        <>
          <button
            className="collection-menu-backdrop"
            type="button"
            tabIndex={-1}
            aria-label="メニューを閉じる"
            aria-hidden="true"
            onClick={closeMenu}
          />
          <div
            id="collection-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="collection-menu-title"
            ref={menuRef}
            className="collection-menu"
          >
            <div className="collection-menu-heading">
              <span id="collection-menu-title">手ぬぐい帖</span>
              <button
                className="icon-button"
                type="button"
                aria-label="メニューを閉じる"
                onClick={closeMenu}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <p className="collection-menu-note">好きなものと、暮らす。</p>
            <nav className="drawer-navigation" aria-label="メインメニュー">
              <CollectionLinks
                collectionActive={collectionActive}
                favoritesActive={isFavorites}
                favoritesCount={favorites.length}
                onNavigate={closeMenu}
              />
              <Link
                to="/items/new"
                className="nav-item drawer-add"
                onClick={closeMenu}
              >
                <Icon name="plus" size={19} />
                一枚を追加
              </Link>
            </nav>
            <div className="drawer-secondary">
              <NavLink
                to="/exhibitions"
                className="drawer-secondary-link"
                onClick={closeMenu}
              >
                <Icon name="book" size={18} />
                <span>
                  展示をつくる
                  <small>選んで並べたいときに</small>
                </span>
                <Icon name="chevron" size={15} />
              </NavLink>
              <NavLink
                to="/settings"
                className="drawer-secondary-link"
                onClick={closeMenu}
              >
                <Icon name="settings" size={18} />
                <span>設定とバックアップ</span>
                <Icon name="chevron" size={15} />
              </NavLink>
            </div>
            <div className="drawer-account">
              <span>
                {isLoading
                  ? "手ぬぐい帖"
                  : isAuthenticated
                    ? import.meta.env.DEV
                      ? "私の手ぬぐい帖"
                      : user?.name || "私の手ぬぐい帖"
                    : "あなたの好きな一枚を、ここに。"}
              </span>
              <a
                href={
                  isAuthenticated ? "/auth?action=logout" : "/auth?action=login"
                }
              >
                {isAuthenticated ? "ログアウト" : "Googleでログイン"}
                <Icon name="arrow" size={16} />
              </a>
            </div>
          </div>
        </>
      )}
      <div
        className="main-shell"
        inert={menuOpen || undefined}
        aria-hidden={menuOpen || undefined}
      >
        <main id="main-content">
          <Outlet />
        </main>
        <footer className="site-footer">
          <span>
            tenugui <span>— 好きな一枚と、日々を。</span>
          </span>
          <span>Collected with love.</span>
        </footer>
      </div>
    </div>
  );
}

function CollectionLinks({
  collectionActive,
  favoritesActive,
  favoritesCount,
  onNavigate,
}: {
  collectionActive: boolean;
  favoritesActive: boolean;
  favoritesCount: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link
        to="/"
        className={`nav-item ${collectionActive ? "active" : ""}`}
        aria-current={collectionActive ? "page" : undefined}
        onClick={onNavigate}
      >
        <Icon name="grid" size={17} />
        コレクション
      </Link>
      <Link
        to="/?view=favorites"
        className={`nav-item ${favoritesActive ? "active" : ""}`}
        aria-current={favoritesActive ? "page" : undefined}
        onClick={onNavigate}
      >
        <Icon name="heart" size={17} />
        お気に入り
        {favoritesCount > 0 && (
          <span className="nav-count">{favoritesCount}</span>
        )}
      </Link>
    </>
  );
}

function BrandMark() {
  return (
    <svg
      width="32"
      height="44"
      viewBox="0 0 32 44"
      fill="none"
      aria-hidden="true"
    >
      <path d="M6 4h20v35H6z" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M10 0v44M22 0v44M6 10c5-5 15-5 20 0M6 18c5-5 15-5 20 0M6 26c5-5 15-5 20 0M6 34c5-5 15-5 20 0"
        stroke="currentColor"
        strokeWidth=".8"
      />
      <path d="M3 4h26" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
