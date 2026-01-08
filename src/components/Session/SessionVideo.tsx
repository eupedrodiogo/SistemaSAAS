
import React from 'react';
import {
    VideoIcon, VideoOff, Mic, MicOff, Radio, Square, Save, Users, PlayCircle
} from 'lucide-react';

interface SessionRecording {
    id: string;
    patientId: string;
    patientName: string;
    date: string;
    duration: string;
    type: 'video' | 'audio';
    phase: string;
    size: string;
    blobUrl?: string;
}

interface SessionVideoProps {
    isVideoActive: boolean;
    videoRef: React.RefObject<HTMLVideoElement>;
    remoteVideoRef: React.RefObject<HTMLVideoElement>;
    stream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMicMuted: boolean;
    isVideoMuted: boolean;
    isRecording: boolean;
    recordingTime: number;
    recordedChunksCount: number;
    connectionStatus: string;
    patientName?: string;
    currentAppointmentId?: string;

    onToggleMic: () => void;
    onToggleVideo: () => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onSaveRecording: () => void;
}

export const SessionVideo: React.FC<SessionVideoProps> = ({
    isVideoActive,
    videoRef,
    remoteVideoRef,
    stream,
    remoteStream,
    isMicMuted,
    isVideoMuted,
    isRecording,
    recordingTime,
    recordedChunksCount,
    connectionStatus,
    patientName,
    currentAppointmentId,
    onToggleMic,
    onToggleVideo,
    onStartRecording,
    onStopRecording,
    onSaveRecording
}) => {
    if (!isVideoActive) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="mb-6 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-700 animate-slide-up relative shrink-0">
            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-20 flex justify-between pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 pointer-events-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Ao Vivo</span>
                </div>
                {isRecording && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-600/90 rounded-lg border border-red-500 pointer-events-auto">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">REC {formatTime(recordingTime)}</span>
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-lg">
                <button onClick={onToggleMic} className={`p-3 rounded-xl transition-all ${isMicMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                    {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button onClick={onToggleVideo} className={`p-3 rounded-xl transition-all ${isVideoMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                    {isVideoMuted ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                </button>
                <div className="w-px h-8 bg-white/10 mx-1"></div>
                {!isRecording ? (
                    <button onClick={onStartRecording} className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-slate-200 text-red-600 rounded-xl font-bold text-sm transition-all shadow-lg">
                        <Radio size={16} /><span className="hidden sm:inline">Gravar</span>
                    </button>
                ) : (
                    <button onClick={onStopRecording} className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white border border-red-500 rounded-xl font-bold text-sm transition-all animate-pulse">
                        <Square size={14} fill="currentColor" /><span className="font-mono">Parar</span>
                    </button>
                )}
                {recordedChunksCount > 0 && !isRecording && (
                    <button onClick={onSaveRecording} className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg font-bold text-sm">
                        <Save size={18} /><span>Salvar</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1 bg-slate-950">
                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group">
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`} />
                    {isVideoMuted && <div className="absolute inset-0 flex items-center justify-center text-slate-500"><VideoOff size={48} /></div>}
                    <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold text-white backdrop-blur-sm pointer-events-none">Você</div>
                    {/* Debug Info */}
                    <div className="absolute top-2 left-2 bg-black/50 text-[10px] text-white p-1 rounded font-mono opacity-50 hover:opacity-100">
                        My: therapist-{currentAppointmentId?.slice(0, 8)}...<br />
                        Target: client-{currentAppointmentId?.slice(0, 8)}...
                    </div>
                </div>
                <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center text-slate-500 border border-slate-700/50">
                    {remoteStream ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-4"><Users size={32} className="text-slate-400" /></div>
                            <h3 className="text-white font-bold mb-1">Aguardando Cliente...</h3>
                            <p className="text-xs text-slate-500">{connectionStatus === 'connecting' ? 'Conectando...' : 'Aguardando conexão'}</p>
                        </>
                    )}
                    <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold text-white backdrop-blur-sm pointer-events-none">{patientName || "Cliente"}</div>
                </div>
            </div>
        </div>
    );
};
