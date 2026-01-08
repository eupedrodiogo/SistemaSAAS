import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

// --- 1. Definição da Estrutura das Perguntas (Baseado no PDF) ---

interface FieldOption {
    label: string;
    value: string;
}

interface FormField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'radio' | 'intensity_scale';
    options?: FieldOption[]; // Para selects ou radios
    placeholder?: string;
    width?: 'full' | 'half' | 'third'; // Para layout
}

interface FormSection {
    title: string;
    description?: string;
    fields: FormField[];
}

// Mapeamento completo do PDF MODELO-ANAMNESE-FORMACAO-TERAPEUTAS
const anamnesisSections: FormSection[] = [
    {
        title: "Dados Pessoais",
        description: "Informações básicas de identificação.",
        fields: [
            { id: 'nome', label: 'Nome Completo', type: 'text', width: 'full' },
            { id: 'dataNascimento', label: 'Data de Nascimento', type: 'text', width: 'third' },
            { id: 'rg', label: 'RG', type: 'text', width: 'third' },
            { id: 'cpf', label: 'CPF', type: 'text', width: 'third' },
            { id: 'endereco', label: 'Endereço', type: 'text', width: 'full' },
            { id: 'bairro', label: 'Bairro', type: 'text', width: 'half' },
            { id: 'cep', label: 'CEP', type: 'text', width: 'half' },
            { id: 'cidade', label: 'Cidade', type: 'text', width: 'half' },
            { id: 'uf', label: 'UF', type: 'text', width: 'half' },
            { id: 'telefone', label: 'Telefone Residencial', type: 'text', width: 'half' },
            { id: 'celular', label: 'Celular', type: 'text', width: 'half' },
            { id: 'email', label: 'E-mail', type: 'text', width: 'full' },
            { id: 'profissao', label: 'Profissão', type: 'text', width: 'half' },
            { id: 'empresa', label: 'Empresa', type: 'text', width: 'half' },
            {
                id: 'estadoCivil', label: 'Estado Civil', type: 'select', width: 'third', options: [
                    { label: 'Solteiro(a)', value: 'solteiro' },
                    { label: 'Casado(a)', value: 'casado' },
                    { label: 'Divorciado(a)', value: 'divorciado' },
                    { label: 'Viúvo(a)', value: 'viuvo' }
                ]
            },
            { id: 'religiao', label: 'Religião', type: 'text', width: 'third' },
            { id: 'escolaridade', label: 'Escolaridade', type: 'text', width: 'third' },
        ]
    },
    {
        title: "Queixa Principal",
        description: "O motivo da sua consulta.",
        fields: [
            { id: 'queixaPrincipal', label: 'O que te trouxe até aqui?', type: 'textarea', width: 'full', placeholder: 'Descreva detalhadamente...' }
        ]
    },
    {
        title: "Fase 01 - Vida Pessoal",
        description: "Contexto familiar e social.",
        fields: [
            { id: 'motivoDivorcio', label: 'Se é divorciada(o), por qual motivo e como se sente?', type: 'textarea', width: 'full' },
            { id: 'numeroFilhos', label: 'Número de filhos', type: 'text', width: 'half' },
            { id: 'relacaoFilhos', label: 'Como é o relacionamento com seus filhos?', type: 'textarea', width: 'full' },
            { id: 'relacaoParceiro', label: 'Como se sente no relacionamento com parceiro(a)?', type: 'textarea', width: 'full' },
            { id: 'sentimentoCasa', label: 'Como se sente em sua casa (contexto familiar)?', type: 'textarea', width: 'full' },
            { id: 'sentimentoTrabalho', label: 'Como se sente no seu trabalho?', type: 'textarea', width: 'full' },
            { id: 'pertenceFamilia', label: 'Sente-se pertencendo ao Contexto Familiar? Por quê?', type: 'textarea', width: 'full' },
            { id: 'pertenceSocial', label: 'Sente-se pertencendo ao Contexto Social? Por quê?', type: 'textarea', width: 'full' },
            { id: 'frustracoes', label: 'Sente frustração em relação a Pais, Irmãos, Filhos ou Profissão?', type: 'textarea', width: 'full' },
        ]
    },
    {
        title: "Saúde e Hábitos",
        description: "Histórico de saúde e hábitos diários.",
        fields: [
            { id: 'sexualidade', label: 'Como avalia sua vida sexual? (Traumática, Normal, Boa, Satisfatória)', type: 'text', width: 'full' },
            { id: 'traumas', label: 'Algum trauma? Se sim, qual?', type: 'textarea', width: 'full' },
            { id: 'fobias', label: 'Alguma fobia ou medo específico?', type: 'textarea', width: 'full' },
            { id: 'drogas', label: 'Usa drogas? Quais?', type: 'text', width: 'full' },
            { id: 'alcool', label: 'Usa bebidas alcoólicas? Frequência?', type: 'text', width: 'full' },
            { id: 'insonia', label: 'Tem insônia? Frequência?', type: 'text', width: 'full' },
            { id: 'doresCabeca', label: 'Dores de cabeça? Frequência?', type: 'text', width: 'full' },
            { id: 'ideiasSuicidas', label: 'Tem ideias suicidas?', type: 'select', width: 'half', options: [{ label: 'Sim', value: 'sim' }, { label: 'Não', value: 'nao' }] },
            { id: 'medicacao', label: 'Toma alguma medicação? Qual?', type: 'text', width: 'full' },
            {
                id: 'nivelStress', label: 'Nível de Stress', type: 'select', width: 'full', options: [
                    { label: 'Alto', value: 'alto' }, { label: 'Médio', value: 'medio' }, { label: 'Baixo', value: 'baixo' }
                ]
            },
        ]
    },
    {
        title: "Fase 02 - Mental",
        description: "Crenças e autoimagem.",
        fields: [
            { id: 'pensamentosSi', label: 'Pensamentos sobre si mesmo (Positivos/Negativos)', type: 'textarea', width: 'full' },
            { id: 'pensamentosCorpo', label: 'Em relação à aparência física', type: 'textarea', width: 'full' },
            { id: 'pensamentosCompetencia', label: 'Em relação à competência profissional', type: 'textarea', width: 'full' },
            { id: 'visaoFuturo', label: 'Visão sobre o seu futuro', type: 'textarea', width: 'full' },
            { id: 'felicidade', label: 'Você se considera feliz? Por quê?', type: 'textarea', width: 'full' },
            { id: 'mudanca', label: 'Se pudesse mudar algo em você, o que mudaria?', type: 'textarea', width: 'full' },
        ]
    },
    {
        title: "Fase 03 - Infância",
        description: "Relação com pais e criação.",
        fields: [
            { id: 'criadoPais', label: 'Foi criado pelos pais?', type: 'select', width: 'third', options: [{ label: 'Sim', value: 'sim' }, { label: 'Não', value: 'nao' }] },
            { id: 'relacaoPai', label: 'Como é/era a relação com o Pai?', type: 'textarea', width: 'full' },
            { id: 'relacaoMae', label: 'Como é/era a relação com a Mãe?', type: 'textarea', width: 'full' },
            { id: 'paisAgressivos', label: 'Seus pais foram agressivos?', type: 'select', width: 'half', options: [{ label: 'Sim', value: 'sim' }, { label: 'Não', value: 'nao' }] },
            { id: 'paisAlcool', label: 'Pais usavam álcool/drogas?', type: 'select', width: 'half', options: [{ label: 'Sim', value: 'sim' }, { label: 'Não', value: 'nao' }] },
            { id: 'relacaoEntrePais', label: 'Relacionamento entre os pais (Excelente a Péssimo)', type: 'text', width: 'full' },
            { id: 'crencaRelacionamento', label: 'Qual crença adquiriu sobre relacionamentos observando seus pais?', type: 'textarea', width: 'full' },
            { id: 'magoaInfancia', label: 'Algo que o magoou muito na infância?', type: 'textarea', width: 'full' },
            { id: 'medoInfancia', label: 'Quando criança tinha medo de quê?', type: 'text', width: 'full' },
        ]
    },
    {
        title: "Fase 04 - Emocional",
        description: "Padrões emocionais atuais.",
        fields: [
            { id: 'maioresMedosHoje', label: 'Quais são seus maiores medos hoje?', type: 'textarea', width: 'full' },
            { id: 'papelVida', label: 'Na vida, age mais como Vítima ou Responsável?', type: 'select', width: 'full', options: [{ label: 'Vítima', value: 'vitima' }, { label: 'Responsável', value: 'responsavel' }] },
            { id: 'dominanteSubmisso', label: 'Prefere ser Dominante ou Submisso?', type: 'select', width: 'full', options: [{ label: 'Dominante', value: 'dominante' }, { label: 'Submisso', value: 'submisso' }] },
            { id: 'raivaRancor', label: 'Sente raiva ou rancor de alguém? Quem?', type: 'text', width: 'full' },
            { id: 'sentimentoCulpa', label: 'Existe algo que o faz sentir-se culpado?', type: 'textarea', width: 'full' },
        ]
    },
    {
        title: "Tabela de Sentimentos",
        description: "Classifique a intensidade dos sentimentos hoje.",
        fields: [
            // Gerando a tabela baseada no source 307 e 310
            { id: 'int_raiva', label: 'Raiva', type: 'intensity_scale', width: 'full' },
            { id: 'int_medo', label: 'Medo', type: 'intensity_scale', width: 'full' },
            { id: 'int_culpa', label: 'Culpa', type: 'intensity_scale', width: 'full' },
            { id: 'int_tristeza', label: 'Tristeza', type: 'intensity_scale', width: 'full' },
            { id: 'int_ansiedade', label: 'Ansiedade', type: 'intensity_scale', width: 'full' },
            { id: 'int_solidão', label: 'Solidão', type: 'intensity_scale', width: 'full' },
            { id: 'int_desanimo', label: 'Desânimo', type: 'intensity_scale', width: 'full' },
            { id: 'int_angustia', label: 'Angústia', type: 'intensity_scale', width: 'full' },
        ]
    }
];

// --- 2. O Componente React ---

interface AnamnesisStepProps {
    data: any;
    onUpdate: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
}

const AnamnesisStep: React.FC<AnamnesisStepProps> = ({ data, onUpdate, onNext, onBack }) => {
    // Estado para controlar quais secções estão abertas (tipo acordeão) para não poluir a tela
    const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({ 0: true });

    // Pre-fill data from RegisterStep (name -> nome, email -> email, phone -> celular)
    useEffect(() => {
        const updates: any = {};

        // Map name to nome (if nome is empty and name exists)
        if (data.name && !data.nome) {
            updates.nome = data.name;
        }

        // Map phone to celular (if celular is empty and phone exists)
        if (data.phone && !data.celular) {
            updates.celular = data.phone;
        }

        // Email uses same key, but ensure it's mapped
        if (data.email && !data.email) {
            updates.email = data.email;
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
            onUpdate({ ...data, ...updates });
        }
    }, []); // Run only once on mount

    const toggleSection = (index: number) => {
        setOpenSections(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleChange = (id: string, value: string) => {
        onUpdate({ ...data, [id]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    // Renderiza o input correto baseado no tipo definido no array
    const renderField = (field: FormField) => {
        const value = data[field.id] || '';
        const baseClasses = "w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all";

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={`${baseClasses} min-h-[100px]`}
                        placeholder={field.placeholder}
                    />
                );
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={baseClasses}
                    >
                        <option value="">Selecione...</option>
                        {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            case 'intensity_scale':
                return (
                    <div className="flex flex-wrap gap-2 items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</span>
                        <div className="flex gap-4">
                            {['Nenhuma', 'Pouca', 'Média', 'Muita'].map((level) => (
                                <label key={level} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={field.id}
                                        value={level}
                                        checked={value === level}
                                        onChange={(e) => handleChange(field.id, e.target.value)}
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">{level}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            default: // text
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={baseClasses}
                        placeholder={field.placeholder}
                    />
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-600 dark:text-primary-400">
                    <FileText size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ficha de Anamnese</h2>
                    <p className="text-slate-500 dark:text-slate-400">Preencha os dados com calma. Todas as informações são confidenciais. <strong>Não é obrigatório o preenchimento de todos os campos.</strong></p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {anamnesisSections.map((section, index) => (
                    <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">

                        {/* Cabeçalho da Seção (Clicável para expandir/recolher) */}
                        <button
                            type="button"
                            onClick={() => toggleSection(index)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <div className="text-left">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{section.title}</h3>
                                {section.description && <p className="text-sm text-slate-500 dark:text-slate-400">{section.description}</p>}
                            </div>
                            {openSections[index] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {/* Corpo da Seção */}
                        {openSections[index] && (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                                {section.fields.map((field) => {
                                    // Cálculo de largura do grid do Tailwind
                                    const colSpan = field.width === 'third' ? 'md:col-span-4' :
                                        field.width === 'half' ? 'md:col-span-6' :
                                            'md:col-span-12';

                                    return (
                                        <div key={field.id} className={`${colSpan} col-span-12`}>
                                            {field.type !== 'intensity_scale' && (
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    {field.label}
                                                </label>
                                            )}
                                            {renderField(field)}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}

                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm p-4 border-t border-slate-200 dark:border-slate-800 z-10">
                    <button
                        type="button"
                        onClick={onBack}
                        className="w-1/3 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                    >
                        Voltar
                    </button>
                    <button
                        type="submit"
                        className="flex-1 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                    >
                        Salvar e Continuar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AnamnesisStep;
