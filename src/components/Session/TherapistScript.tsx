
import React, { useState } from 'react';
import { MessageSquare, Edit2 } from 'lucide-react';

interface TherapistScriptProps {
    children?: React.ReactNode;
    /** Título simples (usado quando não há headerSlot) */
    title?: string;
    /**
     * Slot para substituir completamente o cabeçalho do card.
     * Quando fornecido, o `title` padrão é suprimido.
     */
    headerSlot?: React.ReactNode;
    editable?: boolean;
    onEdit?: (text: string) => void;
}

export const TherapistScript: React.FC<TherapistScriptProps> = ({
    children,
    title,
    headerSlot,
    editable,
    onEdit,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(typeof children === 'string' ? children : '');

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg group transition-all hover:shadow-xl">

            {/* ── Cabeçalho ─────────────────────────────────────────── */}
            {headerSlot ? (
                // Slot externo (ex: AgeRangeController)
                headerSlot
            ) : (
                // Cabeçalho padrão simples
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-b border-slate-700">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                        <MessageSquare size={14} />
                        {title || 'Script do Terapeuta'}
                    </div>
                    {editable && (
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-400"
                            aria-label="Editar script"
                        >
                            <Edit2 size={12} />
                        </button>
                    )}
                </div>
            )}

            {/* ── Corpo do script ───────────────────────────────────── */}
            <div className="px-4 py-4 border-l-4 border-indigo-500">
                {isEditing && editable && onEdit ? (
                    <textarea
                        className="w-full p-2 text-sm border rounded bg-slate-900 text-white border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            onEdit(e.target.value);
                        }}
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                        rows={4}
                    />
                ) : (
                    <p className="text-sm text-slate-300 italic leading-relaxed whitespace-pre-line">
                        "{text || children}"
                    </p>
                )}
            </div>
        </div>
    );
};
