import React, { useState, useEffect } from 'react';
import { Film, Download, Play, Calendar, Clock, FileVideo } from 'lucide-react';

interface Recording {
    id: string;
    patient_id: number;
    url: string;
    filename: string;
    size: string;
    duration: string;
    created_at: string;
    phase: string;
    type: string;
}

interface RecordingGalleryProps {
    patientId: string | number;
    userType: 'client' | 'therapist';
    className?: string;
}

const RecordingGallery: React.FC<RecordingGalleryProps> = ({ patientId, userType, className = '' }) => {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!patientId) return;

        const fetchRecordings = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/recordings?patientId=${patientId}`);
                if (!response.ok) throw new Error('Falha ao carregar gravações');
                const data = await response.json();
                setRecordings(data);
            } catch (err) {
                console.error(err);
                setError('Não foi possível carregar as gravações.');
            } finally {
                setLoading(false);
            }
        };

        fetchRecordings();
    }, [patientId]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center p-12 ${className}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-6 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 ${className}`}>
                {error}
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Film className="text-primary-500" />
                    {userType === 'client' ? 'Minhas Gravações' : 'Gravações da Sessão'}
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                    {recordings.length} arquivos
                </span>
            </div>

            {recordings.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <FileVideo size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Nenhuma gravação encontrada.</p>
                    <p className="text-slate-400 text-sm mt-1">As gravações das sessões aparecerão aqui.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recordings.map((rec) => (
                        <div key={rec.id} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden group hover:shadow-lg hover:border-primary-500/50 transition-all duration-300">
                            {/* Video Preview */}
                            <div className="aspect-video bg-slate-900 relative">
                                <video
                                    src={rec.url}
                                    className="w-full h-full object-cover"
                                    controls
                                    preload="metadata"
                                />
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                                            <Calendar size={12} />
                                            {new Date(rec.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                                            <Clock size={12} />
                                            {rec.duration || '00:00'} • {rec.size || '0 MB'}
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-700">
                                        {rec.phase || 'Sessão'}
                                    </span>
                                </div>

                                <a
                                    href={rec.url}
                                    download={rec.filename}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-all group-hover:bg-primary-500 group-hover:text-white"
                                >
                                    <Download size={14} /> Baixar Gravação
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecordingGallery;
