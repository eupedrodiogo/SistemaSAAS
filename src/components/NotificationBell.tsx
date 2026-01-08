import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNotifications, Notification } from '../hooks/useNotifications';

interface NotificationBellProps {
    role: 'therapist' | 'client';
    className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ role, className }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(role);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'error': return <AlertCircle size={16} className="text-red-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={className || "relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"}
                title="Notificações"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></div>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Mobile Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="fixed inset-x-4 top-20 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between bg-white/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Notificações</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                >
                                    <Check size={14} />
                                    Marcar todas como lidas
                                </button>
                            )}
                        </div>

                        <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                        <Bell size={32} className="opacity-40" />
                                    </div>
                                    <p className="font-medium">Tudo limpo por aqui!</p>
                                    <p className="text-sm opacity-70 mt-1">Você não tem novas notificações.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer group ${!notification.read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`mt-1 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${!notification.read ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <p className={`text-sm font-semibold ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                                            {notification.time}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className="shrink-0 self-center">
                                                        <div className="w-2.5 h-2.5 bg-primary-500 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm text-center">
                            <button className="text-xs font-bold text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors py-1">
                                Ver histórico completo
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
