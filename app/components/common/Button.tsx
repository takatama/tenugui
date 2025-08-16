import type { ReactNode } from "react";
import { getButtonClasses } from "../../lib/styles";

interface ButtonProps {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  "aria-label"?: string;
  "aria-expanded"?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  icon,
  iconPosition = "left",
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
}: ButtonProps) {
  const buttonClasses = getButtonClasses(
    variant,
    size,
    `${disabled || loading ? "cursor-not-allowed opacity-50" : ""} ${className}`
  );

  const loadingSpinner = (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );

  // アイコンのみの場合
  if (!children && icon) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={buttonClasses}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
      >
        {loading ? loadingSpinner : icon}
      </button>
    );
  }

  const content = (
    <>
      {loading && iconPosition === "left" && loadingSpinner}
      {!loading && icon && iconPosition === "left" && icon}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === "right" && icon}
      {loading && iconPosition === "right" && loadingSpinner}
    </>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
    >
      <div className="flex items-center justify-center gap-2">{content}</div>
    </button>
  );
}
