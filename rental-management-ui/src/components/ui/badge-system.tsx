import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import {
    getAvailabilityStatusValue,
    getAvailabilityStatusBadgeClass,
    getRentStatusValue,
    getRentStatusBadgeClass,
    getPropertyTypeValue,
    getRoomTypeValue,
    getCurrencyValue,
    AvailabilityStatus,
    RentStatus
} from "../../constants"

// Badge variants for different use cases
const badgeVariants = cva(
    "inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
                success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
                warning: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
                error: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
                available: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
                unavailable: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
                pending: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                rented: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
                sold: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
                maintenance: "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200",
            },
            size: {
                default: "h-6 px-2.5 py-0.5 text-xs",
                sm: "h-5 px-2 py-0.5 text-xs",
                lg: "h-7 px-3 py-1 text-sm",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    icon?: React.ReactNode
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant, size, icon, children, ...props }, ref) => {
        return (
            <div
                className={cn(badgeVariants({ variant, size }), className)}
                ref={ref}
                {...props}
            >
                {icon && <span className="mr-1">{icon}</span>}
                {children}
            </div>
        )
    }
)
Badge.displayName = "Badge"

// Specialized badge components for common use cases
export const StatusBadge: React.FC<{
    status: number | string
    category: 'availability' | 'rent'
    className?: string
}> = ({ status, category, className }) => {
    const getStatusConfig = (status: number | string, category: string) => {
        const statusNum = typeof status === 'string' ? parseInt(status) : Number(status)

        switch (category) {
            case 'availability':
                return {
                    text: getAvailabilityStatusValue(statusNum),
                    variant: getAvailabilityStatusBadgeClass(statusNum) as any
                }
            case 'rent':
                return {
                    text: getRentStatusValue(statusNum),
                    variant: getRentStatusBadgeClass(statusNum) as any
                }
            default:
                return { text: 'Unknown', variant: 'outline' as const }
        }
    }

    const config = getStatusConfig(status, category)

    return (
        <Badge variant={config.variant} className={className}>
            {config.text}
        </Badge>
    )
}

export const TypeBadge: React.FC<{
    type: number | string
    category: 'property' | 'room' | 'currency'
    className?: string
}> = ({ type, category, className }) => {
    const getTypeText = (type: number | string, category: string) => {
        const typeNum = typeof type === 'string' ? parseInt(type) : Number(type)

        switch (category) {
            case 'property':
                return getPropertyTypeValue(typeNum)
            case 'room':
                return getRoomTypeValue(typeNum)
            case 'currency':
                return getCurrencyValue(typeNum)
            default:
                return 'Unknown'
        }
    }

    return (
        <Badge variant="secondary" className={className}>
            {getTypeText(type, category)}
        </Badge>
    )
}

export { Badge, badgeVariants }
export type { BadgeProps } 