import { useMemo } from 'react';
import clsx from 'clsx';

export default function Avatar({
  src,
  name,
  size = 'md',
  status,
  className,
  onClick,
}) {
  const initials = useMemo(() => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusColors = {
    online: 'bg-online',
    offline: 'bg-offline',
    away: 'bg-away',
    busy: 'bg-busy',
  };

  const statusSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  return (
    <div
      className={clsx(
        'relative rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-accent-blue/20 to-accent-purple/20',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:ring-2 hover:ring-accent-blue/50 transition-all',
        className
      )}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={clsx(
          'w-full h-full items-center justify-center text-gray-400 font-medium',
          src && 'hidden'
        )}
      >
        {initials}
      </div>
      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-dark-primary',
            statusColors[status],
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}