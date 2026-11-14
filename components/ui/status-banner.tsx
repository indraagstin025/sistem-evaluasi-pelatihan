'use client';

import {
  CheckCircledIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { cn } from '@/lib/cn';

type BannerTone = 'success' | 'error' | 'warning' | 'info';

interface StatusBannerProps {
  tone: BannerTone;
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const TONE_STYLES: Record<BannerTone, string> = {
  success: 'border-zinc-300 bg-white text-zinc-900',
  error: 'border-zinc-950 bg-zinc-950 text-white',
  warning: 'border-zinc-900 bg-zinc-100 text-zinc-950',
  info: 'border-zinc-200 bg-zinc-50 text-zinc-800',
};

/**
 * Banner status aksesibel dengan hierarki monokrom kontras tinggi dan ikon clean.
 */
export function StatusBanner({
  tone,
  title,
  message,
  onRetry,
  onDismiss,
  className,
}: StatusBannerProps) {
  const isInverted = tone === 'error';
  const Icon =
    tone === 'success'
      ? CheckCircledIcon
      : tone === 'error' || tone === 'warning'
      ? ExclamationTriangleIcon
      : InfoCircledIcon;

  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between',
        TONE_STYLES[tone],
        className
      )}
    >
      <div className="flex items-start gap-2.5 sm:items-center">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" aria-hidden="true" />
        <div className="font-normal leading-relaxed">
          {title && <span className="mr-1.5 font-semibold">{title}:</span>}
          <span>{message}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              isInverted
                ? 'border-zinc-500 bg-zinc-900 text-white hover:bg-zinc-800'
                : 'border-zinc-500 bg-white text-zinc-900 hover:bg-zinc-100'
            )}
          >
            <ReloadIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Muat Ulang
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Tutup pemberitahuan"
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-lg text-current transition',
              isInverted ? 'hover:bg-white/15' : 'hover:bg-black/5'
            )}
          >
            <Cross2Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
