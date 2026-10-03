import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";
import { Icon } from "./gallery/Icon";
export default function Layout() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { favorites } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const visibleControls = () =>
      [
        menuButtonRef.current,
        ...Array.from(
          menuRef.current?.querySelectorAll<HTMLElement>(
            "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
          ) || [],
        ),
      ].filter(
        (element): element is HTMLElement =>
          !!element && element.getClientRects().length > 0,
      );
    const firstLink = visibleControls().find(
      (element) => element !== menuButtonRef.current,
    );
    (firstLink || menuButtonRef.current)?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = visibleControls();
      const first = controls[0],
        last = controls[controls.length - 1];
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
    const mobile = window.matchMedia("(max-width: 900px)");
    const resize = () => {
      if (!mobile.matches) setMenuOpen(false);
    };
    document.addEventListener("keydown", keydown);
    mobile.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", keydown);
      mobile.removeEventListener("change", resize);
      document.body.style.overflow = oldOverflow;
      if (previousFocus?.isConnected && previousFocus.getClientRects().length)
        previousFocus.focus({ preventScroll: true });
    };
  }, [menuOpen]);
  const location = useLocation();
  const isFavorites =
    new URLSearchParams(location.search).get("view") === "favorites";
  const closeMenu = () => setMenuOpen(false);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        本文へ移動
      </a>
      <header className="mobile-header">
        <Link
          to="/"
          className="brand"
          onClick={closeMenu}
          tabIndex={menuOpen ? -1 : undefined}
          aria-hidden={menuOpen || undefined}
        >
          <BrandMark />
          <span>
            tenugui<span className="brand-japanese">手ぬぐい帖</span>
          </span>
        </Link>
        <button
          ref={menuButtonRef}
          className="icon-button"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>
      </header>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="メニューを閉じる"
          onClick={closeMenu}
        />
      )}
      <div
        id="sidebar"
        role="complementary"
        ref={menuRef}
        className={`sidebar ${menuOpen ? "is-open" : ""}`}
        style={menuOpen ? { overflowY: "auto" } : undefined}
      >
        <Link to="/" className="brand desktop-brand" onClick={closeMenu}>
          <BrandMark />
          <span>
            tenugui<span className="brand-japanese">手ぬぐい帖</span>
          </span>
        </Link>
        <div className="sidebar-intro">一枚ずつ、私らしい世界。</div>
        <span className="sidebar-label">MY LITTLE MUSEUM</span>
        <nav className="primary-nav" aria-label="メインメニュー">
          <Link
            to="/"
            className={`nav-item ${location.pathname === "/" && !isFavorites ? "active" : ""}`}
            aria-current={
              location.pathname === "/" && !isFavorites ? "page" : undefined
            }
            onClick={closeMenu}
          >
            <Icon name="grid" size={18} />
            コレクション
          </Link>
          <Link
            to="/?view=favorites"
            className={`nav-item ${isFavorites ? "active" : ""}`}
            aria-current={isFavorites ? "page" : undefined}
            onClick={closeMenu}
          >
            <Icon name="heart" size={18} />
            お気に入り<span className="nav-count">{favorites.length}</span>
          </Link>
          <NavLink to="/exhibitions" className="nav-item" onClick={closeMenu}>
            <Icon name="book" size={18} />
            私の展示室
          </NavLink>
        </nav>
        <div className="sidebar-divider" />
        <span className="sidebar-label">COLLECT A LITTLE JOY</span>
        <p className="sidebar-note">
          心にとまった色、柄、季節。
          <br />
          好きなものを、少しずつ。
        </p>
        <Link to="/items/new" className="sidebar-add" onClick={closeMenu}>
          <Icon name="plus" size={17} />
          新しい一枚を迎える
        </Link>
        <div className="sidebar-bottom">
          <div className="sidebar-plant">
            <Icon name="leaf" size={34} />
            <p>好きなものと、暮らす。</p>
            <span>A COLLECTION OF SMALL JOYS</span>
          </div>
          <NavLink
            to="/settings"
            className="nav-item settings-link"
            onClick={closeMenu}
          >
            <Icon name="settings" size={17} />
            コレクションを整える
          </NavLink>
          <div className="profile">
            <div className="profile-avatar">
              {user?.name?.slice(0, 1) || "私"}
            </div>
            <div>
              <span>
                {isLoading
                  ? "手ぬぐい帖"
                  : isAuthenticated
                    ? import.meta.env.DEV
                      ? "私のアトリエ"
                      : user?.name || "私のアトリエ"
                    : "ようこそ、手ぬぐい帖へ"}
              </span>
              <a
                href={
                  isAuthenticated ? "/auth?action=logout" : "/auth?action=login"
                }
              >
                {isAuthenticated ? "ログアウト" : "Googleでログイン"}
              </a>
            </div>
          </div>
        </div>
      </div>
      <div
        className="main-shell"
        inert={menuOpen || undefined}
        aria-hidden={menuOpen || undefined}
      >
        <div className="top-bar">
          <span>
            <Icon name="leaf" size={16} />
            私の小さな美術館
          </span>
          <div>
            <span className="season-note">
              <Icon name="sun" size={16} />
              日々の、小さなよろこび
            </span>
            <Link to="/items/new" className="top-add">
              <Icon name="plus" size={16} />
              一枚を追加
            </Link>
          </div>
        </div>
        <main id="main-content">
          <Outlet />
        </main>
        <footer className="site-footer">
          <span>
            tenugui <span>— 手ぬぐいと、日々をつづる。</span>
          </span>
          <span>Made for the things you love.</span>
        </footer>
      </div>
    </div>
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
