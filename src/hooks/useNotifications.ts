import { useState, useEffect, useCallback } from 'react';

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    created_at?: string;
}

export const useNotifications = (role: 'therapist' | 'client') => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const getUserId = () => {
        if (role === 'therapist') {
            const stored = localStorage.getItem('therapist');
            return stored ? JSON.parse(stored).id : null;
        } else {
            return localStorage.getItem('client_portal_id');
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Agora mesmo';
        if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)} h`;
        return `Há ${Math.floor(diffInSeconds / 86400)} dias`;
    };

    const fetchNotifications = useCallback(async () => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const response = await fetch(`/api/notifications?role=${role}&userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                const formattedNotifications = data.notifications.map((n: any) => ({
                    ...n,
                    time: formatTimeAgo(n.created_at)
                }));
                setNotifications(formattedNotifications);
                setUnreadCount(formattedNotifications.filter((n: any) => !n.read).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [role]);

    useEffect(() => {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markAsRead', id })
            });
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        const userId = getUserId();
        if (!userId) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markAllAsRead', role, userId })
            });
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    };
};
