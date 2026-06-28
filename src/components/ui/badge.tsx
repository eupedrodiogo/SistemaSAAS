import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
        success:
          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        warning:
          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        destructive:
          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        info:
          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        outline:
          'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/**
 * Retorna a variante de Badge adequada para um dado status de paciente/transação.
 */
export function getStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    ativo: 'success',
    active: 'success',
    pago: 'success',
    recebido: 'success',
    concluido: 'success',
    concluído: 'success',
    completed: 'success',
    pendente: 'warning',
    'em pausa': 'warning',
    agendado: 'warning',
    scheduled: 'warning',
    inativo: 'destructive',
    cancelado: 'destructive',
    cancelled: 'destructive',
    canceled: 'destructive',
    leads: 'info',
    lead: 'info',
  };
  return map[status.toLowerCase()] ?? 'default';
}

export { Badge, badgeVariants };
