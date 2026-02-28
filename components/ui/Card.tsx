interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover }: CardProps) {
  return (
    <div className={`${hover ? "card-hover" : "card"} ${className}`}>
      {children}
    </div>
  );
}
