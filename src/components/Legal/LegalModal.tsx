import React, { useState } from 'react';
import { X, Shield, FileText, Check } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
    if (!isOpen) return null;

    const content = {
        terms: {
            title: 'Termos de Uso',
            icon: <FileText className="text-primary-500" size={24} />,
            sections: [
                {
                    title: '1. Aceitação dos Termos',
                    text: 'Ao acessar e usar a plataforma TeraNexus, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.'
                },
                {
                    title: '2. Descrição do Serviço',
                    text: 'O TeraNexus é uma plataforma de gestão para terapeutas, oferecendo ferramentas de agendamento, prontuários eletrônicos e gestão financeira. Reservamo-nos o direito de modificar ou descontinuar o serviço a qualquer momento.'
                },
                {
                    title: '3. Responsabilidades do Usuário',
                    text: 'Você é responsável por manter a confidencialidade de sua conta e senha, e por todas as atividades que ocorram sob sua conta. Você concorda em usar a plataforma apenas para fins lícitos e de acordo com as normas éticas da sua profissão.'
                },
                {
                    title: '4. Propriedade Intelectual',
                    text: 'Todo o conteúdo, marcas, logotipos e software da TeraNexus são de propriedade exclusiva da nossa empresa e protegidos por leis de direitos autorais.'
                }
            ]
        },
        privacy: {
            title: 'Política de Privacidade',
            icon: <Shield className="text-primary-500" size={24} />,
            sections: [
                {
                    title: '1. Coleta de Dados',
                    text: 'Coletamos informações que você fornece ao se cadastrar, como nome, email e WhatsApp. Também coletamos dados sobre o uso da plataforma para melhorar nossos serviços.'
                },
                {
                    title: '2. Uso das Informações',
                    text: 'Seus dados são utilizados para gerenciar sua conta, processar pagamentos e enviar comunicações importantes. Em hipótese alguma vendemos seus dados a terceiros.'
                },
                {
                    title: '3. Segurança dos Dados',
                    text: 'Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou alteração. Prontuários de clientes são tratados com sigilo absoluto.'
                },
                {
                    title: '4. Seus Direitos',
                    text: 'Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento através das configurações da sua conta ou entrando em contato conosco.'
                }
            ]
        }
    };

    const active = content[type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-800">
                <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-700"></div>

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                            {active.icon}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-none">{active.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider font-bold">TeraNexus Legal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 py-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-8">
                        {active.sections.map((section, idx) => (
                            <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                    {section.title}
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {section.text}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                <Check size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Compromisso com a Ética</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Seus dados são protegidos por criptografia de nível bancário e conformidade com a LGPD.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
