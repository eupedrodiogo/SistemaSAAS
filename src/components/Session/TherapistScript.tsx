
import React, { useState } from 'react';
import { MessageSquare, Edit2 } from 'lucide-react';

interface TherapistScriptProps {
    children?: React.ReactNode;
    title?: string;
    editable?: boolean;
    onEdit?: (text: string) => void;
}

export const TherapistScript: React.FC<TherapistScriptProps> = ({ children, title, editable, onEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(typeof children === 'string' ? children : '');

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-primary-500 dark:border-secondary-500 rounded-r-xl p-4 my-4 shadow-sm group transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-primary-700 dark:text-secondary-400 font-bold text-xs uppercase tracking-wider">
                    <MessageSquare size={14} />
                    {title || "Script do Terapeuta"}
                </div>
                {editable && (
                    <button onClick={() => setIsEditing(!isEditing)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary-600">
                        <Edit2 size={12} />
                    </button>
                )}
            </div>
            {isEditing && editable && onEdit ? (
                <textarea className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-700" value={text} onChange={(e) => { setText(e.target.value); onEdit(e.target.value); }} onBlur={() => setIsEditing(false)} autoFocus />
            ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed whitespace-pre-line">"{text || children}"</p>
            )}
        </div>
    );
};
