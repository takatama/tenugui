import React from "react";
import { STATUS_BADGE_STYLES } from "../../lib/itemStyles";

interface StatusBadgeProps {
  status?: "purchased" | "unpurchased";
  position?: keyof typeof STATUS_BADGE_STYLES.position;
  className?: string;
}

export function StatusBadge({ 
  status, 
  position = "topRight", 
  className = "" 
}: StatusBadgeProps) {
  if (status !== "unpurchased") {
    return null;
  }

  const positionStyle = STATUS_BADGE_STYLES.position[position];

  return (
    <div className={`${positionStyle} ${STATUS_BADGE_STYLES.base} ${className}`}>
      {STATUS_BADGE_STYLES.unpurchased}
    </div>
  );
}
