interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "green" | "orange" | "red" | "violet" | "muted";
  className?: string;
}

const variantClasses = {
  default: "bg-beige text-fg",
  green: "bg-green/10 text-green",
  orange: "bg-orange/10 text-orange",
  red: "bg-red/10 text-red",
  violet: "bg-violet/10 text-violet",
  muted: "bg-beige text-muted",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        rounded-full text-xs font-sans font-medium
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
