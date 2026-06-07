import React, { useRef, useState, useEffect } from 'react';
import {
    VideoIcon, VideoOff, Mic, MicOff, Radio, Square, Save, Users, PlayCircle, MessageSquare, Send, X,
    Maximize2,
    Minimize2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useAdaptiveVideo } from '../../hooks/useAdaptiveVideo';
import { DraggablePip } from './DraggablePip';

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
    remoteVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
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
    messages: { id: string, sender: 'me' | 'remote', text: string, timestamp: number }[];
    
    onSendMessage: (text: string) => void;

    onToggleMic: () => void;
    onToggleVideo: () => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onSaveRecording: () => void;
    isProtocolCollapsed?: boolean;
    onToggleProtocol?: () => void;
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
    messages,
    onSendMessage,
    onToggleMic,
    onToggleVideo,
    onStartRecording,
    onStopRecording,
    onSaveRecording,
    isProtocolCollapsed = false,
    onToggleProtocol
}) => {
    const [isChatOpen, setIsChatOpen] = React.useState(false);
    const [chatText, setChatText] = React.useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Adaptive video: detects remote aspect ratio and adjusts layout automatically
    const adaptiveRemote = useAdaptiveVideo(remoteVideoRef as React.RefObject<HTMLVideoElement | null>, remoteStream);

    const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 5000);
    };

    useEffect(() => {
        resetControlsTimeout();
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const handleVideoContainerClick = () => {
        if (!showControls) {
            resetControlsTimeout();
        } else {
            setShowControls(false);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        }
    };

    React.useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isChatOpen]);

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            videoContainerRef.current?.requestFullscreen?.().catch(console.error);
        } else {
            document.exitFullscreen?.();
        }
    };

    if (!isVideoActive) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div 
            ref={videoContainerRef} 
            onClick={handleVideoContainerClick}
            onMouseMove={() => showControls || resetControlsTimeout()}
            className={`bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-700 relative flex flex-col transition-all duration-300 w-full min-h-[45vh] sm:aspect-video lg:min-h-0 lg:aspect-auto lg:flex-1 cursor-pointer`}
        >
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

            <div 
                onClick={(e) => { e.stopPropagation(); resetControlsTimeout(); }}
                className={`absolute bottom-4 w-[95%] max-w-fit left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2 sm:gap-3 bg-slate-950/80 backdrop-blur-md p-2 sm:p-2 rounded-2xl border border-white/10 shadow-lg transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <button onClick={onToggleMic} className={`p-3 rounded-xl transition-all ${isMicMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                    {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button onClick={onToggleVideo} className={`p-3 rounded-xl transition-all ${isVideoMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                    {isVideoMuted ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                </button>
                <div className="w-px h-8 bg-white/10 mx-1"></div>
                <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-3 rounded-xl transition-all relative ${isChatOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`} title="Chat P2P">
                    <MessageSquare size={20} />
                    {messages.length > 0 && !isChatOpen && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-slate-900"></span>
                    )}
                </button>
                <button onClick={toggleFullScreen} className={`p-3 rounded-xl transition-all bg-slate-800 text-white hover:bg-slate-700`} title="Tela Cheia">
                    {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                {onToggleProtocol && (
                    <button 
                        onClick={onToggleProtocol} 
                        className={`p-3 rounded-xl transition-all ${isProtocolCollapsed ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`} 
                        title={isProtocolCollapsed ? "Mostrar Roteiro Clínico" : "Ocultar Roteiro Clínico"}
                    >
                        {isProtocolCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                )}
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

            {/* Immersive Video Area */}
            <div className="relative w-full flex-1 bg-slate-950 flex items-center justify-center group overflow-hidden">
                
                {/* Chat Drawer Overlay */}
                {isChatOpen && (
                    <div className="fixed inset-x-0 bottom-0 z-50 h-[75vh] flex flex-col bg-slate-900/85 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] rounded-t-3xl transition-transform animate-slide-up
                                    md:absolute md:inset-auto md:bottom-24 md:left-1/2 md:-translate-x-1/2 md:w-[380px] md:h-[450px] md:rounded-3xl md:border md:shadow-2xl">
                        {/* Barra de puxar no Mobile */}
                        <div className="md:hidden w-full flex justify-center pt-4 pb-2">
                            <div className="w-12 h-1.5 bg-slate-600/50 rounded-full"></div>
                        </div>
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-transparent">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <MessageSquare size={18} className="text-indigo-400" /> Chat Interno
                            </h4>
                            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3" ref={chatContainerRef}>
                            {messages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-70">
                                    <MessageSquare size={40} className="mb-2" />
                                    <p className="text-xs italic text-center">Nenhuma mensagem ainda.</p>
                                </div>
                            ) : (
                                messages.map(m => (
                                    <div key={m.id} className={`flex flex-col max-w-[85%] ${m.sender === 'me' ? 'self-end items-end' : 'self-start items-start'}`}>
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-md ${m.sender === 'me' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'}`}>
                                            {m.text}
                                        </div>
                                        <span className="text-[10px] text-slate-500 mt-1 px-1 font-medium">
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-slate-900/50 border-t border-white/5 rounded-b-3xl">
                            <form 
                                onSubmit={(e) => { 
                                    e.preventDefault(); 
                                    if(chatText.trim()) { 
                                        onSendMessage(chatText.trim()); 
                                        setChatText(''); 
                                    }
                                }} 
                                className="flex gap-2"
                            >
                                <input 
                                    type="text" 
                                    value={chatText}
                                    onChange={e => setChatText(e.target.value)}
                                    placeholder="Mensagem..." 
                                    className="flex-1 bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:bg-slate-900 shadow-inner transition-all"
                                />
                                <button type="submit" disabled={!chatText.trim()} className="p-3 bg-indigo-600 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all">
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Main View: Remote (Patient) — position absolute garante contain sem interferência do flex */}
                <div
                    className="absolute inset-0 z-0"
                    style={{ backgroundColor: '#020617' }}
                >
                    {remoteStream ? (
                        <video 
                            ref={(el) => {
                                if (el && remoteStream && el.srcObject !== remoteStream) {
                                    el.srcObject = remoteStream;
                                    el.play().catch(() => {});
                                }
                                remoteVideoRef.current = el;
                            }} 
                            autoPlay 
                            playsInline 
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                display: 'block',
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 border-4 border-slate-700/50 shadow-xl transition-all">
                                <Users size={40} className="text-slate-400" />
                            </div>
                            <h3 className="text-slate-300 font-bold text-lg mb-1">Aguardando Cliente...</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`}></span>
                                {connectionStatus === 'connecting' ? 'Conectando...' : 'Aguardando conexão'}
                            </p>
                        </div>
                    )}
                    
                    {/* Patient Name Tag */}
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg flex items-center gap-2 z-10 transition-opacity">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-xs font-bold text-white tracking-wide">{patientName || "Cliente"}</span>
                         {remoteStream && adaptiveRemote.orientation !== 'unknown' && (
                             <span className="ml-1 text-[9px] font-mono text-slate-400 uppercase opacity-60">
                                 {adaptiveRemote.orientation === 'portrait' ? '📱' : adaptiveRemote.orientation === 'landscape' ? '🖥️' : ''}
                             </span>
                         )}
                    </div>
                </div>

                {/* PIP View: Local (Therapist) */}
                <DraggablePip 
                    containerRef={videoContainerRef}
                    className={`absolute z-10 aspect-[3/4] md:aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 transition-shadow duration-300 hover:shadow-black/50 ${isFullScreen ? 'w-32 md:w-64' : 'w-24 sm:w-28 md:w-48'}`}
                    defaultPosition={{ top: '1rem', right: '1rem' }}
                >
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`} />
                    {isVideoMuted && <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-900"><VideoOff size={24} /></div>}
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-sm pointer-events-none">Você</div>
                </DraggablePip>
            </div>
        </div>
    );
};
