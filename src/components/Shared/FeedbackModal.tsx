
import React, { useState } from 'react';
import { X, Star, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    userType: 'therapist' | 'patient';
    userId?: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, userType, userId }) => {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [category, setCategory] = useState<string>('satisfaction');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Por favor, selecione uma avaliação de 1 a 5 estrelas.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    therapistId: userType === 'therapist' ? userId : null,
                    patientId: userType === 'patient' ? userId : null,
                    userType,
                    rating,
                    category,
                    comment,
                    metadata: {
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    }
                }),
            });

            if (!response.ok) {
                throw new Error('Falha ao enviar feedback');
            }

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset state
                setRating(0);
                setComment('');
                setCategory('satisfaction');
                setIsSuccess(false);
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao enviar seu feedback.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = [
        { id: 'satisfaction', label: 'Satisfação Geral' },
        { id: 'suggestion', label: 'Sugestão' },
        { id: 'bug', label: 'Relatar Problema' },
        { id: 'compliment', label: 'Elogio' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sua Opinião Importa</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Ajude-nos a melhorar o TeraNexus</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {isSuccess ? (
                        <div className="py-8 flex flex-col items-center text-center animate-in zoom-in duration-300">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                                <CheckCircle2 size={40} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Obrigado pelo seu Feedback!</h4>
                            <p className="text-slate-600 dark:text-slate-400">Suas sugestões são fundamentais para nossa evolução.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Rating */}
                            <div className="flex flex-col items-center gap-3">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                                    Como você avalia sua experiência?
                                </p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                            className="p-1 transition-transform active:scale-90"
                                        >
                                            <Star
                                                size={32}
                                                className={`transition-colors ${(hoverRating || rating) >= star
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-slate-300 dark:text-slate-700'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div className="grid grid-cols-2 gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${category === cat.id
                                            ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-400'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Comment */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Conte-nos mais (opcional)
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Suas sugestões, críticas ou elogios..."
                                    className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Enviar Feedback
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
