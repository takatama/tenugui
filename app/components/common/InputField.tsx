import type { ReactNode } from "react";
import { getInputClasses } from "../../lib/styles";

interface InputFieldProps {
  label?: string;
  id?: string;
  name?: string;
  type?: "text" | "url" | "email" | "password" | "number";
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  labelClassName?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  rightElement?: ReactNode;
}

export function InputField({
  label,
  id,
  name,
  type = "text",
  value,
  placeholder,
  required = false,
  disabled = false,
  size = "md",
  className = "",
  labelClassName = "",
  onChange,
  onKeyPress,
  rightElement,
}: InputFieldProps) {
  const inputClasses = getInputClasses(size, className);
  const containerClasses = rightElement ? "flex gap-2 items-center" : "";

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className={`block font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <div className={containerClasses}>
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onChange={onChange}
          onKeyPress={onKeyPress}
          className={
            rightElement ? `${inputClasses} flex-1` : `${inputClasses} w-full`
          }
        />
        {rightElement}
      </div>
    </div>
  );
}
