// components/ui/Toggle.tsx

import * as Switch from '@radix-ui/react-switch';

interface ToggleProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export function Toggle({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  'aria-label': ariaLabel,
}: ToggleProps) {
  return (
    <Switch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 focus-visible:ring-offset-2
        focus-visible:ring-offset-ivory-50
        ${checked ? 'bg-brass-600 shadow-inner' : 'bg-ink-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Switch.Thumb
        className={`
          block w-5 h-5 bg-ivory-50 rounded-full shadow-key transition-transform duration-200
          ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'}
        `}
      />
    </Switch.Root>
  );
}
