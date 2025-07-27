import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

export interface EntityCardItem {
    id: number;
    title: string;
    subtitle?: string;
    viewUrl: string;
    editUrl?: string;
    badges?: Array<{
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }>;
    details: Array<{
        icon: React.ReactNode;
        label: string;
        value: string | number;
    }>;
    footerActions?: Array<{
        label: string;
        icon: React.ReactNode;
        url: string;
    }>;
    footerAction?: {
        label: string;
        icon: React.ReactNode;
        url: string;
    };
    footerStatus?: {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
    };
}

interface EntityCardProps {
    item: EntityCardItem;
    className?: string;
}

const EntityCard: React.FC<EntityCardProps> = ({
    item,
    className
}) => {
    return (
        <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 ${className || ''}`}>
            {/* Header */}
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                            {item.title}
                        </CardTitle>
                        {item.subtitle && (
                            <CardDescription className="text-sm text-gray-600">
                                {item.subtitle}
                            </CardDescription>
                        )}
                        {item.badges && item.badges.length > 0 && (
                            <div className="flex gap-2 mt-2">
                                {item.badges.map((badge, index) => (
                                    <span
                                        key={index}
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.variant === 'default' ? 'bg-blue-100 text-blue-800' :
                                            badge.variant === 'secondary' ? 'bg-gray-100 text-gray-800' :
                                                badge.variant === 'destructive' ? 'bg-red-100 text-red-800' :
                                                    'bg-white text-gray-800 border border-gray-300'
                                            }`}
                                    >
                                        {badge.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-1">
                        <Link
                            to={item.viewUrl}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </Link>
                        {item.editUrl && (
                            <Link
                                to={item.editUrl}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                title="Edit"
                            >
                                <Edit className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="space-y-0">
                {/* Details */}
                <div className="space-y-0">
                    {item.details.map((detail, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between text-sm text-gray-600 py-3"
                        >
                            <div className="flex items-center">
                                <span className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0">
                                    {detail.icon}
                                </span>
                                <span>{detail.label}</span>
                            </div>
                            <span className="font-medium text-gray-900">{detail.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {item.footerStatus && (
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.footerStatus.variant === 'default' ? 'bg-blue-100 text-blue-800' :
                                        item.footerStatus.variant === 'secondary' ? 'bg-gray-100 text-gray-800' :
                                            item.footerStatus.variant === 'destructive' ? 'bg-red-100 text-red-800' :
                                                'bg-white text-gray-800 border border-gray-300'
                                    }`}
                            >
                                {item.footerStatus.label}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        {item.footerActions && item.footerActions.map((action, index) => (
                            <Link
                                key={index}
                                to={action.url}
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {action.icon}
                                {action.label}
                            </Link>
                        ))}
                        {item.footerAction && (
                            <Link
                                to={item.footerAction.url}
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {item.footerAction.icon}
                                {item.footerAction.label}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default EntityCard; 