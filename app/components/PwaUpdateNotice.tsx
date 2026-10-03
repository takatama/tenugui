import { usePwaUpdates } from "../hooks/usePwaUpdates";
import "./pwa-update-notice.css";

export function PwaUpdateNotice() {
  const update = usePwaUpdates();
  if (!update.available) return null;
  return (
    <aside className="pwa-update-notice" aria-label="アプリの更新">
      <div className="pwa-update-copy" role="status" aria-live="polite">
        <p className="pwa-update-title">{update.applying ? "更新しています…" : "更新できます"}</p>
        <p className="pwa-update-detail">{update.error || (update.blocked
          ? "入力や操作が終わってから更新できます。記録を保存してください。"
          : "新しい手ぬぐい帖を用意しました。更新すると画面を読み込み直します。")}</p>
      </div>
      <div className="pwa-update-actions">
        <button className="pwa-update-apply" onClick={update.apply} disabled={update.applying || update.blocked}>更新する</button>
        <button className="pwa-update-later" onClick={update.dismiss} disabled={update.applying}>あとで</button>
      </div>
    </aside>
  );
}
