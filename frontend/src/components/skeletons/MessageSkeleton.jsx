import clsx from 'clsx';

export default function MessageSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 skeleton rounded" />
              <div className="h-3 w-12 skeleton rounded" />
            </div>
            <div className={clsx('h-10 skeleton rounded-xl', i % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
          </div>
        </div>
      ))}
    </div>
  );
}