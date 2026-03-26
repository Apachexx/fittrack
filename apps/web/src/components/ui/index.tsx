import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

// ─── Button ────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/25 active:scale-[0.97]',
  secondary:
    'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 hover:border-white/20 active:scale-[0.97]',
  ghost:
    'hover:bg-white/5 text-gray-400 hover:text-gray-100 active:scale-[0.97]',
  danger:
    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 active:scale-[0.97]',
  outline:
    'border border-orange-500/40 hover:border-orange-500 text-orange-400 hover:bg-orange-500/10 active:scale-[0.97]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

// ─── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100',
            'placeholder:text-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40',
            'transition-all duration-150',
            'hover:border-white/20',
            icon && 'pl-10',
            error && 'border-red-500/40 focus:ring-red-500/40',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ─── Card ──────────────────────────────────────────────────────────────────
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ glass, hover, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border p-6',
        glass
          ? 'bg-white/[0.03] backdrop-blur-xl border-white/10'
          : 'bg-gray-900/80 border-white/[0.06]',
        hover && 'hover:border-white/20 hover:bg-gray-900 transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

// ─── Badge ─────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'orange';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-white/5 text-gray-400 border-white/10',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

// ─── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' }[size];
  return (
    <div className={cn('border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin', s)} />
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-white/[0.06]" />;
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-white/[0.06]" />
      <span className="text-xs text-gray-600">{label}</span>
      <hr className="flex-1 border-white/[0.06]" />
    </div>
  );
}
