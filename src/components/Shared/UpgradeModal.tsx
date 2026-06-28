import React from 'react';
import { X, Zap, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, featureName }) => {
    if (!isOpen) return null;

    const handleUpgrade = () => {
        // Redirect to Professional plan checkout
        window.location.href = '/#pricing';
    };

    const proFeatures = [
        'Gestão Financeira Completa',
        'Relatórios com Inteligência Artificial',
        'Marketing & CRM Integrado',
        'Clientes Ilimitados',
        'Suporte Prioritário',
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="p-0 overflow-hidden sm:max-w-md bg-white dark:bg-slate-900 border-0 shadow-2xl flex flex-col gap-0 [&>button]:text-white [&>button]:top-4 [&>button]:right-4">
                <DialogTitle className="sr-only">Upgrade Profissional</DialogTitle>
                <DialogDescription className="sr-only">Desbloqueie todo o potencial do TeraNexus com o plano Profissional.</DialogDescription>

                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white relative">

                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Recurso Exclusivo</h2>
                            <p className="text-sm text-primary-100">Plano Profissional</p>
                        </div>
                    </div>

                    {featureName && (
                        <p className="text-sm text-primary-100 mt-2">
                            <strong>{featureName}</strong> está disponível apenas no plano Profissional.
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                        Desbloqueie todo o potencial do TeraNexus
                    </h3>

                    <ul className="space-y-3 mb-6">
                        {proFeatures.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                                <span className="text-sm font-medium">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-4 mb-6 border border-primary-100 dark:border-primary-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold">Plano Profissional</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">R$ 97<span className="text-sm font-normal text-slate-500">/único</span></p>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                    <Zap size={12} /> Mais Popular
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Continuar no Iniciante
                        </Button>
                        <Button
                            onClick={handleUpgrade}
                            className="flex-1 h-12 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
                        >
                            Fazer Upgrade <ArrowRight size={16} />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UpgradeModal;
