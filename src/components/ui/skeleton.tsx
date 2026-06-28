import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-100 dark:bg-slate-800', className)}
      {...props}
    />
  );
}

/**
 * SkeletonSessionCard – placeholder para um item do histórico de sessões.
 * Formato: ícone quadrado (12x12) + duas linhas de texto à direita.
 */
function SkeletonSessionCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 p-5',
        className,
      )}
    >
      <div className="flex gap-4">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonSessionCard };
