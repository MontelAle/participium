import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActionButtonProps } from '@/types/ui';

export const ActionButton = ({
  label,
  onClick,
  icon: Icon,
  className,
  disabled = false,
}: ActionButtonProps) => {
  return (
    <Button
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-12 rounded-lg shadow-md transition-transform active:scale-95 cursor-pointer',
        className,
      )}
    >
      <Icon className="mr-2 h-5 w-5" />
      {label}
    </Button>
  );
};
