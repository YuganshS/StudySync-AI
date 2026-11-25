import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  iconClassName?: string
}

export function BrandLogo({ className, iconClassName }: BrandLogoProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2a358c] to-[#3a4a9f] text-white shadow-md',
        className
      )}
    >
      <GraduationCap className={cn('h-1/2 w-1/2', iconClassName)} />
    </div>
  )
}
