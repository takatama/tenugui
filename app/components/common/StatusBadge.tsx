import React from "react";
import { STATUS_BADGE_STYLES } from "../../lib/itemStyles";
import type { ItemStatus } from "../../types/status";
import { isUnpurchased } from "../../types/status";

interface StatusBadgeProps {
  status?: ItemStatus;
  position?: keyof typeof STATUS_BADGE_STYLES.position;
  className?: string;
  /** アクセシビリティ用のid属性 */
  id?: string;
}

export function StatusBadge({
  status,
  position = "topRight",
  className = "",
  id,
}: StatusBadgeProps) {
  if (!isUnpurchased(status)) {
    return null;
  }

  const positionStyle = STATUS_BADGE_STYLES.position[position];

  return (
    <div
      id={id}
      className={`${positionStyle} ${STATUS_BADGE_STYLES.base} ${className}`}
      aria-label="未購入"
      role="status"
    >
      {STATUS_BADGE_STYLES.unpurchased}
    </div>
  );
}
