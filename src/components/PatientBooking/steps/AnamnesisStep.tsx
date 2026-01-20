import React, { useState, useEffect } from 'react';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    User,
    FileText,
    Brain,
    Activity,
    CalendarClock
} from 'lucide-react';
import { ClientIntakeData } from '../../../../types';

// --- Listas de Opções (Baseadas nos Prints + Expansão TRG) ---

const DISORDERS_LIST = [
    "Abandono", "Aborto", "Abuso Sexual", "Adoção", "Agressividade",
    "Alcoolismo", "Alopécia", "Anorexia", "Ansiedade", "Apatia",
    "Automutilação", "Baixa Autoestima", "Bulimia", "Burnout", "Ciúmes",
    "Compulsão Alimentar", "Compulsão por Compras", "Culpa", "Dependência Emocional",
    "Dependência Química", "Depressão", "Disfunção Sexual", "Divórcio",
    "Estresse", "Estupro", "Fobias", "Insegurança", "Insônia", "Irritabilidade",
    "Luto", "Medos", "Nervosismo", "Obesidade", "Obsessão", "Pânico",
    "Paranoia", "Pensamentos Suicidas", "Procrastinação", "Prostituição",
    "Rejeição", "Separação", "Síndrome do Pânico", "TDAH", "Timidez",
    "TOC", "Traição", "Traumas", "Vergonha", "Vícios"
].sort();

const PHYSICAL_LIST = [
    "Alergias", "Artrite", "Asma", "Bronquite", "Câncer",
    "Cistite", "Colesterol Alto", "Cólicas", "Dermatite", "Diabetes",
    "Doenças Autoimune", "Doenças Cardíacas", "Doenças na Pele",
    "Dor Crônica", "Dores nas Articulações", "Dores nas Costas",
    "Enxaqueca", "Fibromialgia", "Gastrite", "Hipertensão",
    "Labirintite", "Obesidade", "Problemas Intestinais",
    "Problemas Respiratórios", "Psoríase", "Rinite", "Sinusite",
    "Tireoide", "Úlcera"
].sort();

const FUTURE_LIST = [
    "Abandono", "Dependência Física", "Doenças", "Escassez", "Falência Financeira",
    "Ficar sozinho(a)", "Fracasso", "Incapacidade", "Morte", "Perda de Autonomia",
    "Perda de Entes Queridos", "Pobreza", "Solidão", "Traição", "Velhice"
].sort();

// --- Componente Principal ---

interface AnamnesisStepProps {
    data: ClientIntakeData;
    onUpdate: (data: ClientIntakeData) => void;
    onNext: () => void;
    onBack: () => void;
}

const AnamnesisStep: React.FC<AnamnesisStepProps> = ({ data, onUpdate, onNext, onBack }) => {
    const [currentStep, setCurrentStep] = useState(0);

    // Initial Data Mapping
    useEffect(() => {
        const updates: any = {};
        if (data['name'] && !data.nome) updates.nome = data['name'];
        if (data['phone'] && !data.celular) updates.celular = data['phone'];
        if (data['email'] && !data.email) updates.email = data['email'];

        if (Object.keys(updates).length > 0) {
            onUpdate({ ...data, ...updates });
        }
    }, []);

    const handleChange = (field: keyof ClientIntakeData, value: any) => {
        onUpdate({ ...data, [field]: value });
    };


    const handleCheckboxChange = (listName: 'transtornos' | 'doresFisicas' | 'temasFuturo', item: string) => {
        const currentList = data[listName] || [];
        const exists = currentList.find(i => i.name === item);

        let newList;
        if (exists) {
            newList = currentList.filter(i => i.name !== item);
        } else {
            newList = [...currentList, { name: item, level: 5 }]; // Default level 5
        }
        handleChange(listName, newList);
    };

    const handleLevelChange = (listName: 'transtornos' | 'doresFisicas' | 'temasFuturo', item: string, level: number) => {
        const currentList = data[listName] || [];
        const newList = currentList.map(i => i.name === item ? { ...i, level } : i);
        handleChange(listName, newList);
    };

    const LevelSelector = ({ listName, item, currentLevel }: { listName: 'transtornos' | 'doresFisicas' | 'temasFuturo', item: string, currentLevel: number }) => {
        const getLevelColor = (level: number) => {
            if (level <= 3) return 'bg-emerald-500 border-emerald-600 shadow-emerald-500/30';
            if (level <= 6) return 'bg-amber-500 border-amber-600 shadow-amber-500/30';
            return 'bg-rose-500 border-rose-600 shadow-rose-500/30';
        };

        return (
            <div className="mt-3 pl-0 sm:pl-4 animate-fade-in w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Nível de Desconforto
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentLevel <= 3 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                            currentLevel <= 6 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                            }`}>
                            {currentLevel} - {currentLevel <= 3 ? 'Leve' : currentLevel <= 6 ? 'Moderado' : 'Intenso'}
                        </span>
                    </div>

                    <div className="flex justify-between gap-1">
                        {Array.from({ length: 11 }, (_, i) => i).map(num => {
                            const isSelected = currentLevel === num;
                            return (
                                <button
                                    key={num}
                                    onClick={() => handleLevelChange(listName, item, num)}
                                    className={`
                                        flex-1 h-9 rounded-md text-xs font-bold transition-all duration-200 flex items-center justify-center
                                        ${isSelected
                                            ? `${getLevelColor(num)} text-white transform scale-105 shadow-md ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-opacity-60`
                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-primary-200'}
                                    `}
                                    type="button"
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-between px-1 mt-1 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        <span>Leve (0-3)</span>
                        <span>Moderado (4-6)</span>
                        <span>Intenso (7-10)</span>
                    </div>
                </div>
            </div>
        );
    };

    const steps = [
        {
            title: "Dados Pessoais",
            subtitle: "Identificação básica",
            icon: <User className="w-5 h-5" />,
            isComplete: !!data.nome && !!data.celular
        },
        {
            title: "Queixa Principal",
            subtitle: "Motivo da consulta",
            icon: <FileText className="w-5 h-5" />,
            isComplete: !!data.complaint
        },
        {
            title: "Transtornos",
            subtitle: "Emocionais e Mentais",
            icon: <Brain className="w-5 h-5" />,
            isComplete: (data.transtornos?.length || 0) > 0
        },
        {
            title: "Corpo Físico",
            subtitle: "Dores e Doenças",
            icon: <Activity className="w-5 h-5" />,
            isComplete: false // Optional
        },
        {
            title: "Futuro",
            subtitle: "Medos e Angústias",
            icon: <CalendarClock className="w-5 h-5" />,
            isComplete: false // Optional
        }
    ];

    // Persistence: Restore step from localStorage
    useEffect(() => {
        const savedStep = localStorage.getItem('anamnesis_step_index');
        if (savedStep) {
            const stepIndex = parseInt(savedStep);
            if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < steps.length) {
                setCurrentStep(stepIndex);
            }
        }
    }, []);

    // Persistence: Save step to localStorage
    useEffect(() => {
        localStorage.setItem('anamnesis_step_index', currentStep.toString());
    }, [currentStep]);

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            // Clear persistence when finishing the wizard
            localStorage.removeItem('anamnesis_step_index');
            onNext();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo(0, 0);
        } else {
            onBack();
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* Header / Progress Wizard */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-10 rounded-full"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-500 -z-10 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}></div>

                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;

                        return (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10
                                        ${isCompleted
                                            ? 'bg-primary-500 border-primary-500 text-white'
                                            : isCurrent
                                                ? 'bg-white dark:bg-slate-800 border-primary-500 text-primary-600'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400'
                                        }`}
                                >
                                    {isCompleted ? <Check size={20} /> : <span className="font-bold text-sm">{index + 1}</span>}
                                </div>
                                <span className={`hidden md:block mt-2 text-xs font-medium transition-colors ${isCurrent ? 'text-primary-600' : 'text-slate-500'}`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{steps[currentStep].title}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{steps[currentStep].subtitle}</p>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 min-h-[400px]">

                {/* DO NOT REMOVE: Form content logic */}
                {currentStep === 0 && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={data.nome || ''}
                                    onChange={e => handleChange('nome', e.target.value)}
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Nascimento</label>
                                <input
                                    type="text"
                                    placeholder="DD/MM/AAAA"
                                    value={data.dataNascimento || ''}
                                    onChange={e => handleChange('dataNascimento', e.target.value)}
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Celular / WhatsApp</label>
                                <input
                                    type="text"
                                    value={data.celular || ''}
                                    onChange={e => handleChange('celular', e.target.value)}
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Profissão</label>
                                <input
                                    type="text"
                                    value={data.profissao || ''}
                                    onChange={e => handleChange('profissao', e.target.value)}
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">O que te trouxe até aqui?</h3>
                        <p className="text-sm text-slate-500 mb-4">Descreva em poucas palavras o principal motivo de buscar a terapia.</p>
                        <textarea
                            value={data.complaint || ''}
                            onChange={e => handleChange('complaint', e.target.value)}
                            className="w-full h-40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                            placeholder="Ex: Tenho sentido muita ansiedade ultimamente..."
                        />
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="animate-fade-in">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl mb-6 text-sm">
                            <span className="font-bold">Você possui algum desses transtornos?</span>
                            <br />
                            Dentre os temas listados abaixo, selecione aqueles que você deseja tratar na terapia.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {DISORDERS_LIST.map(item => {
                                const selectedItem = (data.transtornos || []).find(i => i.name === item);
                                const isSelected = !!selectedItem;
                                return (
                                    <div key={item}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-center
                                        ${isSelected
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        onClick={() => handleCheckboxChange('transtornos', item)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0
                                                ${isSelected
                                                    ? 'bg-primary-500 border-primary-500 text-white'
                                                    : 'border-slate-300 dark:border-slate-600'
                                                }`}
                                            >
                                                {isSelected && <Check size={14} />}
                                            </div>
                                            <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                        </div>
                                        {isSelected && (
                                            <LevelSelector listName="transtornos" item={item} currentLevel={selectedItem.level} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="animate-fade-in">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl mb-6 text-sm">
                            <span className="font-bold">Você possui alguma dor, doença ou desconforto no corpo físico?</span>
                            <br />
                            Selecione tudo que se aplica.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {PHYSICAL_LIST.map(item => {
                                const selectedItem = (data.doresFisicas || []).find(i => i.name === item);
                                const isSelected = !!selectedItem;
                                return (
                                    <div key={item}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-center
                                        ${isSelected
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        onClick={() => handleCheckboxChange('doresFisicas', item)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0
                                                ${isSelected
                                                    ? 'bg-primary-500 border-primary-500 text-white'
                                                    : 'border-slate-300 dark:border-slate-600'
                                                }`}
                                            >
                                                {isSelected && <Check size={14} />}
                                            </div>
                                            <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                        </div>
                                        {isSelected && (
                                            <LevelSelector listName="doresFisicas" item={item} currentLevel={selectedItem.level} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="animate-fade-in">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl mb-6 text-sm">
                            <span className="font-bold">Em relação ao futuro, algum desses temas te trazem medo, angústia ou desconforto?</span>
                            <br />
                            Selecione os principais gatilhos.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {FUTURE_LIST.map(item => {
                                const selectedItem = (data.temasFuturo || []).find(i => i.name === item);
                                const isSelected = !!selectedItem;
                                return (
                                    <div key={item}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-center
                                        ${isSelected
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        onClick={() => handleCheckboxChange('temasFuturo', item)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0
                                                ${isSelected
                                                    ? 'bg-primary-500 border-primary-500 text-white'
                                                    : 'border-slate-300 dark:border-slate-600'
                                                }`}
                                            >
                                                {isSelected && <Check size={14} />}
                                            </div>
                                            <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                        </div>
                                        {isSelected && (
                                            <LevelSelector listName="temasFuturo" item={item} currentLevel={selectedItem.level} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex justify-center z-50">
                <div className="flex gap-4 w-full max-w-3xl">
                    <button
                        onClick={prevStep}
                        className="px-6 py-4 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2"
                    >
                        <ChevronLeft size={20} />
                        Voltar
                    </button>

                    <button
                        onClick={nextStep}
                        className="flex-1 px-6 py-4 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-500 transition shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
                    >
                        {currentStep === steps.length - 1 ? (
                            <>Concluir <Check size={20} /></>
                        ) : (
                            <>Avançar <ChevronRight size={20} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnamnesisStep;
