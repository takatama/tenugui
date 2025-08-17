import React from "react";
import { STATUS_BADGE_STYLES } from "../../lib/itemStyles";
import type { ItemStatus } from "../../types/status";
import { isUnpurchased } from "../../types/status";

interface StatusBadgeProps {
  status?: ItemStatus;
  position?: keyof typeof STATUS_BADGE_STYLES.position;
  className?: string;
}

export function StatusBadge({
  status,
  position = "topRight",
  className = "",
}: StatusBadgeProps) {
  if (!isUnpurchased(status)) {
    return null;
  }

  const positionStyle = STATUS_BADGE_STYLES.position[position];

  return (
    <div
      className={`${positionStyle} ${STATUS_BADGE_STYLES.base} ${className}`}
    >
      {STATUS_BADGE_STYLES.unpurchased}
    </div>
  );
}
