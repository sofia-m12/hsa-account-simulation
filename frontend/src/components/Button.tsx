import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: LucideIcon;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  icon: Icon,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`.trim()}
      {...rest}
    >
      {Icon && <Icon aria-hidden="true" size={18} strokeWidth={1.75} />}
      {children}
    </button>
  );
}
