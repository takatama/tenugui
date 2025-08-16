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
    return (
      <span className={classes}>
        {tag}
        <button
          type="button"
          onClick={onRemove}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors ml-1"
          title={`「${tag}」を削除`}
        >
          ×
        </button>
      </span>
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
