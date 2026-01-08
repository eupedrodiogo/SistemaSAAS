import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import { PartnerMatcher } from '../PartnerMatcher';

interface ScheduleStepProps {
    data: any;
    onUpdate: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
}

interface TimeSlot {
    id: string;
    time: string;
    available: boolean;
}

const ScheduleStep: React.FC<ScheduleStepProps> = ({ data, onUpdate, onNext, onBack }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPartnerMatcherOpen, setIsPartnerMatcherOpen] = useState(false);

    useEffect(() => {
        const fetchAvailability = async () => {
            setIsLoading(true);
            try {
                // Format date as YYYY-MM-DD for the API
                const dateStr = selectedDate.toISOString().split('T')[0];
                const therapistQuery = data.therapistId ? `&therapistId=${data.therapistId}` : '';
                const response = await fetch(`/api/availability?date=${dateStr}${therapistQuery}`);
                if (response.ok) {
                    const data = await response.json();
                    setAvailableSlots(data.slots);
                } else {
                    console.error('Failed to fetch availability');
                }
            } catch (error) {
                console.error('Error fetching availability:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvailability();
    }, [selectedDate]);

    const handleSlotSelect = (time: string) => {
        // Store the full ISO string for the date to maintain compatibility
        onUpdate({ ...data, date: selectedDate.toISOString(), time });
    };

    const handleNext = () => {
        if (data.date && data.time) {
            onNext();
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Escolha o Horário</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Selecione o melhor momento para sua sessão.</p>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Calendar Mock */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <CalendarIcon size={20} className="text-primary-500" />
                            {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const newDate = new Date(selectedDate);
                                    newDate.setMonth(newDate.getMonth() - 1);
                                    setSelectedDate(newDate);
                                }}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => {
                                    const newDate = new Date(selectedDate);
                                    newDate.setMonth(newDate.getMonth() + 1);
                                    setSelectedDate(newDate);
                                }}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center mb-2">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                            <span key={d} className="text-xs font-bold text-slate-400">{d}</span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {(() => {
                            const year = selectedDate.getFullYear();
                            const month = selectedDate.getMonth();

                            // Get days in month
                            const daysInMonth = new Date(year, month + 1, 0).getDate();

                            // Get starting weekday of the month (0 = Sunday, 1 = Monday, etc.)
                            const firstDayOfMonth = new Date(year, month, 1).getDay();

                            // Create array for empty slots
                            const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => (
                                <div key={`empty-${i}`} />
                            ));

                            // Create array for days
                            const days = Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const isSelected = day === selectedDate.getDate();
                                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                                const isPast = new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0));

                                return (
                                    <button
                                        key={day}
                                        disabled={isPast}
                                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                                            ${isSelected
                                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                                : isPast
                                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }
                                            ${isToday && !isSelected ? 'ring-2 ring-primary-500/50' : ''}
                                        `}
                                        onClick={() => {
                                            const newDate = new Date(selectedDate);
                                            newDate.setDate(day);
                                            setSelectedDate(newDate);
                                        }}
                                    >
                                        {day}
                                    </button>
                                );
                            });

                            return [...emptySlots, ...days];
                        })()}
                    </div>
                </div>

                {/* Time Slots */}
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-primary-500" />
                        Horários Disponíveis
                    </h3>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                            <p className="text-slate-500 text-sm">Buscando horários...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {availableSlots.map(slot => (
                                <button
                                    key={slot.id}
                                    disabled={!slot.available}
                                    onClick={() => handleSlotSelect(slot.time)}
                                    className={`p-4 rounded-xl border transition-all text-center relative overflow-hidden
                      ${!slot.available
                                            ? 'bg-slate-100 dark:bg-slate-800/50 border-transparent text-slate-400 cursor-not-allowed opacity-60'
                                            : data.time === slot.time
                                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 text-slate-700 dark:text-white'
                                        }
                    `}
                                >
                                    <span className="font-bold text-lg">{slot.time}</span>
                                    {!slot.available && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-[1px]">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Ocupado</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Partner Matcher Trigger */}
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">Não encontrou um horário?</h4>
                                <p className="text-xs text-indigo-700 dark:text-indigo-300">Nossa rede de parceiros certificados pode ter disponibilidade.</p>
                            </div>
                            <button
                                onClick={() => setIsPartnerMatcherOpen(true)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                <Users size={16} />
                                Encontrar Parceiro
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-8 max-w-md mx-auto">
                <button
                    onClick={onBack}
                    className="w-1/3 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                >
                    Voltar
                </button>
                <button
                    onClick={handleNext}
                    disabled={!data.date || !data.time}
                    className="flex-1 py-4 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                >
                    Continuar
                </button>
            </div>

            {isPartnerMatcherOpen && (
                <PartnerMatcher
                    sourceTherapistId={data.therapistId}
                    onClose={() => setIsPartnerMatcherOpen(false)}
                    onSelectPartner={(partnerId) => {
                        window.location.href = `/agendar/${partnerId}`;
                    }}
                />
            )}
        </div>
    );
};

export default ScheduleStep;
