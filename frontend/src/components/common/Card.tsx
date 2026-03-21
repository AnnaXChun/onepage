import type { ReactNode, MouseEvent } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
}: CardProps) {
  const baseClasses = 'bg-surface border border-border rounded-2xl';
  const interactiveClasses = hoverable
    ? 'cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-borderLight hover:shadow-lg hover:shadow-black/20'
    : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={[baseClasses, interactiveClasses, clickableClasses, className].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: MouseEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
