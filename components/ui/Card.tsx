interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface rounded-card shadow-card p-6
        ${onClick ? "cursor-pointer hover:shadow-md transition-shadow duration-150" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
