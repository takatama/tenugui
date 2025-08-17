import React from "react";

interface TagDisplayProps {
  tag: string;
  variant?: "default" | "selected" | "filter" | "removable" | "editable";
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function TagDisplay({
  tag,
  variant = "default",
  selected = false,
  onClick,
  onRemove,
  className = "",
}: TagDisplayProps) {
  const baseClasses =
    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors";

  const variantClasses = {
    default: "bg-gray-200 text-gray-700 border border-gray-300",
    selected: "bg-blue-100 text-blue-800",
    filter: selected
      ? "bg-blue-500 text-white border-blue-500"
      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
    removable: "bg-blue-100 text-blue-800",
    editable: "bg-gray-100 text-gray-700 border border-gray-300",
  };

  const hoverClasses = {
    default: onClick ? "hover:bg-gray-300 cursor-pointer" : "",
    selected: onClick ? "hover:bg-blue-200 cursor-pointer" : "",
    filter: !selected ? "hover:bg-gray-200" : "",
    removable: "",
    editable: onClick ? "hover:bg-blue-100 cursor-pointer" : "",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${hoverClasses[variant]} ${className}`;

  if (variant === "removable" && onRemove) {
    // removableバリアントでは、タグ全体をクリック可能にする場合でも
    // ボタンのネストを避けるためにdivを使用し、適切なイベントハンドリングを行う
    return (
      <div
        onClick={onClick}
        className={`${classes} relative pr-8 ${onClick ? "cursor-pointer" : ""}`}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        {tag}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-0.5 transition-colors"
          title={`「${tag}」を削除`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {tag}
      </button>
    );
  }

  return <span className={classes}>{tag}</span>;
}

interface TagListProps {
  tags: string[];
  variant?: "default" | "selected" | "filter" | "removable";
  selectedTags?: Set<string>;
  onTagClick?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  className?: string;
}

export function TagList({
  tags,
  variant = "default",
  selectedTags,
  onTagClick,
  onTagRemove,
  className = "",
}: TagListProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <TagDisplay
          key={tag}
          tag={tag}
          variant={variant}
          selected={selectedTags?.has(tag)}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
          onRemove={onTagRemove ? () => onTagRemove(tag) : undefined}
        />
      ))}
    </div>
  );
}
