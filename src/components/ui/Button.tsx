"use client";

import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost" | "icon";
type Size = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 border border-transparent focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  secondary:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-300 focus:ring-offset-1",
  danger:
    "border border-red-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-400 focus:ring-2 focus:ring-red-300 focus:ring-offset-1",
  success:
    "border border-green-300 bg-white text-green-600 hover:bg-green-50 hover:border-green-400 focus:ring-2 focus:ring-green-300 focus:ring-offset-1",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 focus:ring-offset-1",
  icon: "bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 focus:ring-offset-1",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
};

const iconOnlyStyle = "p-2 rounded-lg";

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "sm",
      icon,
      fullWidth,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isIconOnly = variant === "icon" && !children;
    const base =
      "inline-flex items-center justify-center gap-1.5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
    const iconClass = isIconOnly ? iconOnlyStyle : sizeStyles[size];
    const width = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${base} ${iconClass} ${variantStyles[variant]} ${width} ${className}`}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
