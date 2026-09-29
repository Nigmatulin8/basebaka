import { X, type LucideIcon } from 'lucide-react'
import { type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'

type InputProps = {
  icon?: LucideIcon
  onClear?: () => void
} & ComponentProps<'input'>

export function Input({ icon: Icon, onClear, ...props }: InputProps) {
  const { t } = useTranslation()

  return (
    <div className="flex w-full rounded-lg border border-line px-2 items-center">
      {Icon && <Icon width={14} />}

      <input
        {...props}
        className="min-w-0 flex-1 border-0 bg-transparent outline-none mx-1.5 h-8 text-sm"
      />

      {onClear && (
        <button type="button" onClick={onClear} aria-label={t('common.clear')}>
          <X width={14} className="cursor-pointer" />
        </button>
      )}
    </div>
  )
}
