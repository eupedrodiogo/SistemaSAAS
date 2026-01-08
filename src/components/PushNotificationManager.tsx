import React, { useState, useEffect } from 'react';
import { Bell, X, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

const PushNotificationManager: React.FC = () => {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
        typeof window !== 'undefined' ? Notification.permission : 'default'
    );
    const [isVisible, setIsVisible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Only show if browser supports notifications and permission is not yet granted or denied
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                // Delay showing the prompt to be less intrusive
                const timer = setTimeout(() => setIsVisible(true), 1500);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const subscribeUserToPush = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;

            // Check if subscription already exists
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                // Subscribe the user
                const response = await fetch('/logo.svg'); // placeholder to ensure public key is available or just use the hardcoded one
                const vapidPublicKey = 'BJ7-wfrZYbt4dQE2E5SCIS5BExiOgZ0jwQ30U7JpZM25hghTidUkyaCZmC0uegvJgIiCwyGBBlj1n1s9YxrNRYI';

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: vapidPublicKey
                });
            }

            // Send subscription to backend
            const authResponse = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sb-access-token') || ''}`
                },
                body: JSON.stringify({ subscription })
            });

            if (!authResponse.ok) {
                throw new Error('Failed to save subscription on backend');
            }
        } catch (error) {
            console.error('Error subscribing to push:', error);
        }
    };

    const requestPermission = async () => {
        setIsProcessing(true);
        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);
            if (permission === 'granted') {
                await subscribeUserToPush();
                setTimeout(() => setIsVisible(false), 2000);
            } else {
                setIsVisible(false);
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            setIsVisible(false);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="relative mb-8 animate-slide-up group">
            {/* Decoration */}
            <div className="absolute -top-4 -right-4 p-8 opacity-10 blur-2xl bg-primary-500 rounded-full animate-pulse group-hover:scale-110 transition-transform"></div>

            <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-primary-500/5 group-hover:shadow-primary-500/10 transition-all duration-500">
                {/* Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400"></div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="hidden sm:flex relative shrink-0">
                            <div className="absolute inset-0 bg-primary-500/20 blur-lg rounded-full animate-pulse"></div>
                            <div className="relative p-4 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl border border-primary-100 dark:border-primary-800/50">
                                {permissionStatus === 'granted' ? (
                                    <CheckCircle2 size={24} className="animate-bounce" />
                                ) : (
                                    <Bell size={24} className="animate-wiggle" />
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    Ative as Notificações
                                    <Sparkles size={16} className="text-amber-400" />
                                </h3>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg leading-relaxed">
                                Fique por dentro de tudo! Receba alertas instantâneos sempre que um paciente agendar uma sessão ou houver atualizações importantes no seu painel.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                            onClick={() => setIsVisible(false)}
                            className="px-5 py-2.5 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
                        >
                            Agora não
                        </button>
                        <button
                            disabled={isProcessing || permissionStatus === 'granted'}
                            onClick={requestPermission}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                                ${permissionStatus === 'granted'
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                    : 'bg-primary-600 text-white shadow-primary-500/20 hover:bg-primary-700'
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Processando...</span>
                                </>
                            ) : permissionStatus === 'granted' ? (
                                <>
                                    <CheckCircle2 size={18} />
                                    <span>Ativado!</span>
                                </>
                            ) : (
                                <>
                                    <Shield size={18} />
                                    <span>Ativar Notificações</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Close Button Mobile */}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PushNotificationManager;
