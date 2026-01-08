import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Check, Loader2, Send, Clock, ShieldAlert, Laptop, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ValidatorSurvey() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // State for form data
    const [formData, setFormData] = useState({
        video_platform: [] as string[],
        record_method: [] as string[],
        pain_point: [] as string[],
        ai_interest: '',
        digital_notebook_interest: '',
        time_spent_weekly: '', // Novo
        security_concern: '',  // Novo
        tech_level: '',        // Novo
        suggestions: '',
        contact: ''
    });

    // Helper for checkboxes
    const handleCheckbox = (field: keyof typeof formData, value: string) => {
        setFormData(prev => {
            const current = prev[field] as string[];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(item => item !== value) };
            }
            return { ...prev, [field]: [...current, value] };
        });
    };

    // Helper for radios
    const handleRadio = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('validation_responses')
                .insert([{
                    ...formData, // Spread all fields, including new ones
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
            setSuccess(true);
        } catch (error) {
            console.error('Error saving response:', error);
            alert('Erro ao enviar resposta. Verifique se você rodou o script de atualização do banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/20 text-center space-y-6 animate-fade-in shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/30 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
                    <Check className="w-12 h-12 text-emerald-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Obrigado!</h2>
                    <p className="text-slate-400">
                        Seus insights ajudam a construir uma ferramenta feita por quem entende suas dores. Entrarei em contato em breve.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/ajuda')}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-700"
                >
                    Voltar ao Início
                </button>
            </div>
        );
    }

    // Card Component for consistent styling
    const QuestionCard = ({ title, icon: Icon, children }: { title: string, icon?: any, children: React.ReactNode }) => (
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 p-6 rounded-2xl hover:border-slate-700/80 transition-all duration-300 hover:shadow-lg group">
            <div className="flex items-center gap-3 mb-4">
                {Icon && <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors text-slate-400"><Icon size={20} /></div>}
                <h3 className="text-lg font-semibold text-slate-200 group-hover:text-white transition-colors">{title}</h3>
            </div>
            <div className="space-y-3 pl-1">
                {children}
            </div>
        </div>
    );

    // Option Item Component
    const OptionItem = ({ selected, onClick, type = 'radio', label }: { selected: boolean, onClick: () => void, type?: 'radio' | 'checkbox', label: string }) => (
        <label
            className={`
        flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 group relative overflow-hidden
        ${selected
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-600'}
      `}
        >
            <input
                type={type}
                checked={selected}
                onChange={onClick}
                className="hidden" // Hide default input
            />
            <div className={`
        w-5 h-5 rounded flex items-center justify-center border transition-colors
        ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-slate-900 group-hover:border-slate-500'}
        ${type === 'radio' ? 'rounded-full' : 'rounded-md'}
      `}>
                {selected && <Check size={12} className="text-white" />}
            </div>
            <span className="font-medium z-10">{label}</span>
            {selected && <div className="absolute inset-0 bg-emerald-500/5 z-0" />}
        </label>
    );

    return (
        <div className="max-w-2xl w-full mx-auto space-y-8 animate-slide-up pb-20">

            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white flex items-center gap-2 transition-colors px-3 py-1 rounded-lg hover:bg-slate-800">
                    <ArrowLeft size={16} /> Voltar
                </button>
                <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">BETA SURVEY v2.0</span>
            </div>

            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Pesquisa de Desenvolvimento</h1>
                <p className="text-slate-400 text-lg">Ajude a construir o sistema que <span className="text-emerald-400 font-semibold">você</span> gostaria de usar.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* NOVAS PERGUNTAS */}

                <QuestionCard title="Quanto tempo você gasta por semana com 'papelada' e organização?" icon={Clock}>
                    {['Menos de 1 hora (Sou Ninja 🥷)', 'Entre 1 a 3 horas (Razoável)', 'De 3 a 5 horas (Gasto muito)', 'Mais de 5 horas (Socorro! 🤯)'].map(opt => (
                        <OptionItem
                            key={opt}
                            label={opt}
                            selected={formData.time_spent_weekly === opt}
                            onClick={() => handleRadio('time_spent_weekly', opt)}
                        />
                    ))}
                </QuestionCard>

                <QuestionCard title="Você sente segurança jurídica guardando fichas onde guarda hoje?" icon={ShieldAlert}>
                    {['Sim, me sinto 100% seguro', 'Tenho receio de perder anotações', 'Sinto que não está adequado à LGPD', 'Não sei dizer'].map(opt => (
                        <OptionItem
                            key={opt}
                            label={opt}
                            selected={formData.security_concern === opt}
                            onClick={() => handleRadio('security_concern', opt)}
                        />
                    ))}
                </QuestionCard>

                {/* PERGUNTAS ANTIGAS (Refinadas) */}

                <QuestionCard title="Qual plataforma de vídeo/agenda você usa hoje?" icon={Laptop}>
                    {['WhatsApp Vídeo', 'Zoom', 'Google Meet', 'Agenda de Papel', 'Google Agenda', 'Outros'].map(opt => (
                        <OptionItem
                            key={opt}
                            label={opt}
                            type="checkbox"
                            selected={formData.video_platform.includes(opt)}
                            onClick={() => handleCheckbox('video_platform', opt)}
                        />
                    ))}
                </QuestionCard>

                <QuestionCard title="Onde registra a evolução/dados do paciente?">
                    {['Papel / Cadernos', 'Word / Google Docs (Arquivos soltos)', 'Prontuário Excel / Planilhas', 'Software pago de terceiros'].map(opt => (
                        <OptionItem
                            key={opt}
                            label={opt}
                            type="checkbox"
                            selected={formData.record_method.includes(opt)}
                            onClick={() => handleCheckbox('record_method', opt)}
                        />
                    ))}
                </QuestionCard>

                <QuestionCard title="Qual sua maior dor hoje na parte 'Burocrática'?">
                    {['Perder anotações antigas', 'Não lembrar o que conversou na última sessão', 'Falta de tempo para documentar', 'Cobrar e organizar pagamentos', 'Medo de fiscalização/LGPD'].map(opt => (
                        <OptionItem
                            key={opt}
                            label={opt}
                            type="checkbox"
                            selected={formData.pain_point.includes(opt)}
                            onClick={() => handleCheckbox('pain_point', opt)}
                        />
                    ))}
                </QuestionCard>

                {/* Validating Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuestionCard title="Assistente IA organizadora?">
                        <p className="text-sm text-slate-500 mb-3">Resumo automático e insights pré-sessão.</p>
                        {['Sim, testaria', 'Não, tenho receio', 'Talvez'].map(opt => (
                            <OptionItem key={opt} label={opt} selected={formData.ai_interest === opt} onClick={() => handleRadio('ai_interest', opt)} />
                        ))}
                    </QuestionCard>

                    <QuestionCard title="Caderno Digital Inteligente?">
                        <p className="text-sm text-slate-500 mb-3">Histórico na tela antes do paciente falar.</p>
                        {['Sim, preciso disso', 'Não vejo valor', 'Gosto do papel'].map(opt => (
                            <OptionItem key={opt} label={opt} selected={formData.digital_notebook_interest === opt} onClick={() => handleRadio('digital_notebook_interest', opt)} />
                        ))}
                    </QuestionCard>
                </div>

                <QuestionCard title="Para finalizar: Seu Contato">
                    <p className="text-sm text-slate-500 mb-4">Caso queira ser um dos primeiros a testar (sem spam, prometo).</p>
                    <input
                        type="text"
                        required
                        value={formData.contact}
                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                        className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="Seu melhor Email ou WhatsApp..."
                    />
                </QuestionCard>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg rounded-xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12"></div>
                        {loading ? <Loader2 className="animate-spin" /> : <>Enviar Minhas Respostas <ChevronRight size={24} /></>}
                    </button>
                    <p className="text-center text-slate-600 text-xs mt-4">Seus dados são usados apenas para esta pesquisa de desenvolvimento.</p>
                </div>

            </form>
        </div>
    );
}
