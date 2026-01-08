import React, { useEffect, useState } from 'react';
import ClientLayout from './ClientLayout';
import { BookOpen, Download, PlayCircle, Wind, FileText } from 'lucide-react';

const ClientResources: React.FC = () => {
    return (
        <ClientLayout activePage="resources">
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Materiais e Recursos</h1>
                    <p className="text-slate-500">Ferramentas de apoio para sua jornada.</p>
                </div>

                {/* Safety Mechanism Highlight */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-red-100 dark:border-red-900/30">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl text-red-600 dark:text-red-400">
                            <Wind size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mecanismo de Segurança</h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-2xl">
                                Utilize este recurso sempre que sentir desconforto intenso, ansiedade ou necessidade de se recentrar.
                            </p>
                            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-red-500/20">
                                <PlayCircle size={18} />
                                Iniciar Áudio Guiado
                            </button>
                        </div>
                    </div>
                </div>

                {/* Downloads Grid */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-primary-500" />
                        Guias e Leituras
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group cursor-pointer">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-primary-500 transition-colors">
                                        <BookOpen size={20} />
                                    </div>
                                    <Download size={16} className="text-slate-400 group-hover:text-primary-500" />
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Guia do Cliente TRG Vol. {i}</h4>
                                <p className="text-xs text-slate-500">PDF • 2.4 MB</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
};

export default ClientResources;
