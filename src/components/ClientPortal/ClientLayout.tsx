import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, User, LogOut, ShieldCheck, Menu, X, Video, Film, MessageSquareHeart } from 'lucide-react';
import FeedbackModal from '../Shared/FeedbackModal';


interface ClientLayoutProps {
    children: React.ReactNode;
    activePage: 'dashboard' | 'appointments' | 'resources' | 'profile' | 'session' | 'recordings';
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children, activePage }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    useEffect(() => {
        const storedId = localStorage.getItem('client_portal_id');
        if (!storedId) {
            window.location.href = '/portal-paciente/login';
        } else {
            setPatientId(storedId);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('client_portal_id');
        localStorage.removeItem('client_portal_email');
        window.location.href = '/portal-paciente/login';
    };

    const menuItems = [
        { id: 'dashboard', label: 'Início', icon: LayoutDashboard, path: '/portal-paciente/dashboard' },
        { id: 'appointments', label: 'Meus Agendamentos', icon: Calendar, path: '/portal-paciente/agendamentos' },
        { id: 'session', label: 'Sessão ao Vivo', icon: Video, path: '/sessao-cliente' },
        { id: 'recordings', label: 'Minhas Gravações', icon: Film, path: '/portal-paciente/gravacoes' },
        { id: 'resources', label: 'Materiais e Recursos', icon: BookOpen, path: '/portal-paciente/recursos' },
        { id: 'profile', label: 'Meu Perfil', icon: User, path: '/portal-paciente/perfil' },
    ];

    if (!patientId) return null; // Prevent flash of content before redirect

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100">




            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-50 transition-all duration-300">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-600/20">
                        <ShieldCheck size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">TRG<span className="text-primary-600">Nexus</span></span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 z-40 flex flex-col pt-16 lg:pt-0`}>
                <div className="h-16 hidden lg:flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">TRG<span className="text-primary-600">Nexus</span></span>
                    </div>
                </div>

                <div className="p-4">
                    <div className="mb-6 px-4 py-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/30 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">Bem-vindo(a)</p>
                            <p className="font-bold text-slate-800 dark:text-white truncate">Cliente</p>
                        </div>

                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activePage === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button
                        onClick={() => setIsFeedbackOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                    >
                        <MessageSquareHeart size={20} />
                        Avaliar Sistema
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                        <LogOut size={20} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 pt-16 lg:pt-0 overflow-y-auto">
                <div className={activePage === 'session' ? 'h-full' : 'p-4 md:p-8 max-w-[1600px] mx-auto'}>
                    {children}
                </div>
            </main>

            {/* Overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            {/* Feedback Modal */}
            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                userType="patient"
                userId={patientId || undefined}
            />
        </div>
    );
};

export default ClientLayout;
