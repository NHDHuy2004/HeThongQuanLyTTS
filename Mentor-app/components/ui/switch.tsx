import type { ComponentProps } from 'react'
import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '@/lib/utils'

function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent outline-none transition-colors',
        'focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        'data-[checked=true]:bg-primary data-[unchecked=true]:bg-input',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-5 translate-x-1 rounded-full bg-background shadow-sm transition-transform',
          'data-[checked=true]:translate-x-5 data-[unchecked=true]:translate-x-1',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }