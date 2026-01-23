import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success:
          "border-transparent bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-500/20",
        cancelled:
          "border-transparent bg-gray-200/50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-800/70",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  /**
   * 상태의 유형에 따라 자동으로 variant를 결정합니다.
   * "attendance" | "leave" | "role" | undefined
   */
  statusType?: "attendance" | "leave" | "role"
  /**
   * 상태값 (statusType과 함께 사용 시)
   * 예: PRESENT, PENDING, APPROVED, REJECTED, CANCELLED, ADMIN, USER
   */
  status?: string
  /**
   * 직접 지정되는 표시 텍스트
   */
  label?: React.ReactNode
}

function Badge({
  className,
  variant,
  statusType,
  status,
  label,
  children,
  ...props
}: BadgeProps) {
  // statusType과 status가 전달된 경우 variant를 자동으로 결정
  const computedVariant = statusType && status ? getStatusVariant(status, statusType) : variant

  return (
    <div className={cn(badgeVariants({ variant: computedVariant }), className)} {...props}>
      {label || children || status}
    </div>
  )
}

/**
 * 상태값과 타입에 따라 올바른 뱃지 variant를 결정합니다.
 */
function getStatusVariant(status: string, statusType: string): VariantProps<typeof badgeVariants>["variant"] {
  switch (statusType) {
    case "attendance":
      return status === "PRESENT" ? "success" : "secondary"

    case "leave":
      if (status === "APPROVED") return "success"
      if (status === "PENDING") return "secondary"
      if (status === "CANCELLED") return "cancelled"
      return "destructive" // REJECTED

    case "role":
      return status === "ADMIN" ? "default" : "secondary"

    default:
      return "secondary"
  }
}

export { Badge, badgeVariants }
