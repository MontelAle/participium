import { cn } from '@/lib/utils';
import { StatCardProps } from '@/types/ui';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: StatCardProps) => (
  <div className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-base font-medium text-muted-foreground tracking-wide">
          {title}
        </p>
        <div className="text-4xl font-bold tracking-tight">{value}</div>
      </div>
      <div
        className={cn(
          'flex h-15 w-15 items-center justify-center rounded-full transition-colors',
          bgColor,
        )}
      >
        <Icon className={cn('h-6 w-6', color)} />
      </div>
    </div>

    <div
      className={cn(
        'absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-10 blur-2xl',
        color.replaceAll('text-', 'bg-'),
      )}
    />
  </div>
);
