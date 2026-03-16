'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

export interface IUserDisplayProps {
  value?: string | string[];
  size?: 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
  userId?: string;
  user_id?: string;
}

const sizeClasses = {
  small: { avatar: 'w-4 h-4', text: 'text-xs', icon: 'w-3 h-3' },
  medium: { avatar: 'w-5 h-5', text: 'text-sm', icon: 'w-3.5 h-3.5' },
  large: { avatar: 'w-6 h-6', text: 'text-base', icon: 'w-4 h-4' },
};

export const UserDisplay: React.FC<IUserDisplayProps> = ({
  userId,
  user_id,
  value,
  size = 'medium',
  className,
  style,
  showLabel = true,
}) => {
  // Extract user IDs from the various input formats
  const userIds = React.useMemo(() => {
    if (value) {
      if (Array.isArray(value)) return value.filter(Boolean);
      return [value].filter(Boolean);
    }
    if (userId) return [userId];
    if (user_id) return [user_id];
    return [];
  }, [value, userId, user_id]);

  if (!userIds.length) return null;

  const s = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={cn('flex flex-wrap gap-1', className)} style={style}>
      {userIds.map((uid) => (
        <div
          key={uid}
          className={cn(
            'flex min-w-0 items-center gap-1 rounded-full bg-muted',
            showLabel ? 'py-0.5 pr-1.5 pl-0.5' : '',
          )}
        >
          <div
            className={cn(
              'rounded-full bg-muted-foreground/20 flex items-center justify-center flex-shrink-0',
              s.avatar,
            )}
          >
            <User className={cn('text-muted-foreground', s.icon)} />
          </div>
          {showLabel && (
            <span className={cn('truncate text-card-foreground', s.text)}>
              {uid}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export type { IUserDisplayProps as UserWithAvatarProps };
