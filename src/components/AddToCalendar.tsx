import React, { useState } from 'react';
import { Calendar, Download, ExternalLink, Check, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AddToCalendarProps {
    title: string;
    date: string; // DD/MM/YYYY or YYYY-MM-DD
    time: string; // HH:mm
    description?: string;
    location?: string;
    className?: string;
}

export const AddToCalendar: React.FC<AddToCalendarProps> = ({
    title,
    date,
    time,
    description = '',
    location = 'Sessão Online',
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Parse date for URLs
    const parseDate = () => {
        let year, month, day;
        if (date.includes('T')) {
            const d = new Date(date);
            year = d.getFullYear();
            month = String(d.getMonth() + 1).padStart(2, '0');
            day = String(d.getDate()).padStart(2, '0');
        } else if (date.includes('/')) {
            const parts = date.split('/');
            day = parts[0].padStart(2, '0');
            month = parts[1].padStart(2, '0');
            year = parts[2];
        } else {
            const parts = date.split('-');
            year = parts[0];
            month = parts[1].padStart(2, '0');
            day = parts[2].split('T')[0].padStart(2, '0'); // Safety split
        }
        const timeParts = time.split(':');
        const hh = timeParts[0].padStart(2, '0');
        const mm = timeParts[1].padStart(2, '0');

        const start = new Date(`${year}-${month}-${day}T${hh}:${mm}:00`);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1h

        const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        return { start: format(start), end: format(end) };
    };

    const { start, end } = parseDate();

    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

    const generateICS = () => {
        const uid = `${Date.now()}@teranexus.com`;
        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TeraNexus//NONSGML v1.0//EN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${now}`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
            `LOCATION:${location}`,
            'STATUS:CONFIRMED',
            'BEGIN:VALARM',
            'TRIGGER:-PT15M',
            'ACTION:DISPLAY',
            'DESCRIPTION:Lembrete de Sessão',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'sessao-trg.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={cn("relative inline-block text-left", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 group shadow-lg"
            >
                <Calendar className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Adicionar à Agenda</span>
                <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-2 space-y-1">
                            <a
                                href={googleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-xl transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ExternalLink className="w-4 h-4 text-red-400" />
                                </div>
                                <span>Google Calendar</span>
                            </a>

                            <button
                                onClick={() => {
                                    generateICS();
                                    setIsOpen(false);
                                }}
                                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-xl transition-colors group text-left"
                            >
                                <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Download className="w-4 h-4 text-sky-400" />
                                </div>
                                <span>Outlook / Apple Mail</span>
                            </button>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${title} - ${date} às ${time}`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-xl transition-colors group text-left"
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Calendar className="w-4 h-4 text-emerald-400" />}
                                </div>
                                <span>{copied ? 'Copiado!' : 'Copiar Detalhes'}</span>
                            </button>
                        </div>

                        <div className="bg-white/5 p-2 text-[10px] text-slate-500 text-center">
                            Sincronização Segura TeraNexus
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
