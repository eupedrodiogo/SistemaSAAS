import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, ChevronDown, Zap, ChevronLeft } from 'lucide-react';
import { AppView } from 'types';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  type?: 'text' | 'suggestion';
}

interface AiAssistantProps {
  currentView?: AppView;
}

// TRG Knowledge Base deprecated in favor of Real AI (Gemini)
// const TRG_KNOWLEDGE_BASE = ...

const CONTEXT_SUGGESTIONS: Record<string, string[]> = {
  'dashboard': ['Como aumentar minha retenção?', 'Previsão de receita', 'Dicas de produtividade'],
  'therapy': ['Script para bloqueio emocional', 'O que fazer se o SUD não baixar?', 'Encerrar sessão com segurança'],
  'marketing': ['Ideia de post para ansiedade', 'Script de vendas WhatsApp', 'Como captar mais pacientes'],
  'financial': ['Como calcular meu ROI?', 'Estratégia de precificação', 'Reduzir inadimplência'],
  'agenda': ['Otimizar agenda', 'Lembretes automáticos', 'Confirmar consultas'],
  'patients': ['Como fidelizar pacientes?', 'Modelo de prontuário', 'Anamnese eficiente'],
  'reports': ['Como interpretar o gráfico SUD?', 'Modelo de laudo técnico', 'Estatísticas de evolução'],
  'settings': ['Configurar backup', 'Segurança de dados', 'Personalizar perfil']
};

const AiAssistant: React.FC<AiAssistantProps> = ({ currentView = AppView.DASHBOARD }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: 'Olá! Sou seu copiloto TRG. Estou analisando o contexto da sua tela para ajudar.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Drag and Resize states
  const [tabTop, setTabTop] = useState<number | null>(null);
  const tabDragRef = useRef({ isDragging: false, startY: 0, startTop: 0, hasMoved: false });

  const [chatPos, setChatPos] = useState({ x: 0, y: 0 });
  const [chatSize, setChatSize] = useState({ width: 380, height: 550 });
  const chatDragRef = useRef({ isDragging: false, startX: 0, startY: 0, initX: 0, initY: 0 });
  const resizeRef = useRef({ isResizing: false, startX: 0, startY: 0, initW: 0, initH: 0 });

  // Tab dragging
  const onTabPointerDown = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    tabDragRef.current = { isDragging: true, startY: e.clientY, startTop: rect.top + rect.height / 2, hasMoved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onTabPointerMove = (e: React.PointerEvent) => {
    if (!tabDragRef.current.isDragging) return;
    const deltaY = e.clientY - tabDragRef.current.startY;
    if (Math.abs(deltaY) > 5) tabDragRef.current.hasMoved = true;
    if (tabDragRef.current.hasMoved) setTabTop(tabDragRef.current.startTop + deltaY);
  };
  const onTabPointerUp = (e: React.PointerEvent) => {
    if (!tabDragRef.current.isDragging) return;
    tabDragRef.current.isDragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const handleTabClick = (e: React.MouseEvent) => {
    if (tabDragRef.current.hasMoved) return;
    setIsOpen(true);
  };

  // Chat dragging
  const onChatPointerDown = (e: React.PointerEvent) => {
    chatDragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initX: chatPos.x, initY: chatPos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onChatPointerMove = (e: React.PointerEvent) => {
    if (!chatDragRef.current.isDragging) return;
    const dx = e.clientX - chatDragRef.current.startX;
    const dy = e.clientY - chatDragRef.current.startY;
    setChatPos({ x: chatDragRef.current.initX + dx, y: chatDragRef.current.initY + dy });
  };
  const onChatPointerUp = (e: React.PointerEvent) => {
    if (!chatDragRef.current.isDragging) return;
    chatDragRef.current.isDragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Chat resizing
  const onResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    resizeRef.current = { isResizing: true, startX: e.clientX, startY: e.clientY, initW: chatSize.width, initH: chatSize.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!resizeRef.current.isResizing) return;
    e.stopPropagation();
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    setChatSize({ width: Math.max(300, resizeRef.current.initW + dx), height: Math.max(400, resizeRef.current.initH + dy) });
  };
  const onResizePointerUp = (e: React.PointerEvent) => {
    if (!resizeRef.current.isResizing) return;
    e.stopPropagation();
    resizeRef.current.isResizing = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Context Detection
  const [currentContext, setCurrentContext] = useState<string>(currentView);

  useEffect(() => {
    setCurrentContext(currentView);
  }, [currentView]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const textToSend = overrideText || inputValue;
    if (!textToSend.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg], // Send history
          context: currentContext
        })
      });

      if (!response.ok) throw new Error('Falha na comunicação com a IA');

      const data = await response.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: data.reply || 'Desculpe, não consegui processar sua solicitação agora.'
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error('Chat AI Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: '❌ Erro de conexão com o servidor de IA. Tente novamente.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleTabClick}
        onPointerDown={onTabPointerDown}
        onPointerMove={onTabPointerMove}
        onPointerUp={onTabPointerUp}
        onPointerCancel={onTabPointerUp}
        style={{ top: tabTop !== null ? `${tabTop}px` : '50%', touchAction: 'none' }}
        className="fixed right-0 -translate-y-1/2 z-[90] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-r-0 border-slate-200 dark:border-white/10 shadow-[-8px_0_30px_rgba(0,0,0,0.08)] dark:shadow-[-8px_0_30px_rgba(0,0,0,0.4)] rounded-l-[30px] flex flex-col items-center justify-between py-6 px-1 w-[24px] hover:w-[32px] transition-all duration-300 group cursor-grab active:cursor-grabbing overflow-hidden touch-none"
      >
        {/* Glow indicator at the top */}
        <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] mb-6 group-hover:bg-green-500 group-hover:shadow-[0_0_12px_rgba(34,197,94,0.8)] group-hover:animate-pulse transition-all duration-500 relative">
          <span className="absolute inset-0 rounded-full bg-red-500 opacity-50 group-hover:bg-green-500 group-hover:animate-ping"></span>
        </div>
        
        <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-500">
          <ChevronLeft size={18} className="group-hover:-translate-x-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-all duration-300" strokeWidth={2.5} />
          
          <div className="p-2 rounded-[14px] bg-slate-100 dark:bg-slate-800 shadow-inner group-hover:bg-gradient-to-br from-indigo-500 to-purple-600 transition-colors duration-500 relative group-hover:scale-110">
            <Bot size={20} className="text-slate-600 dark:text-slate-300 group-hover:text-white transition-colors duration-500" />
          </div>
          
          {/* Grip dots to simulate a pull handle */}
          <div className="flex flex-col gap-1.5 mt-2 opacity-60 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300">
            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-[90] bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-100 flex flex-col`}
      style={{
        bottom: chatPos.y === 0 ? '24px' : `calc(24px - ${chatPos.y}px)`,
        right: chatPos.x === 0 ? '24px' : `calc(24px - ${chatPos.x}px)`,
        width: isMinimized ? '288px' : `${chatSize.width}px`,
        height: isMinimized ? '64px' : `${chatSize.height}px`,
        maxWidth: '100vw',
        maxHeight: '100vh',
      }}
    >
      <div 
        className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between cursor-grab active:cursor-grabbing shrink-0 touch-none" 
        onClick={() => !isMinimized && setIsMinimized(true)}
        onPointerDown={onChatPointerDown}
        onPointerMove={onChatPointerMove}
        onPointerUp={onChatPointerUp}
        onPointerCancel={onChatPointerUp}
      >
        <div className="flex items-center gap-2 text-white pointer-events-none"><Bot size={20} /><div><h3 className="font-bold text-sm">Nexus AI Copilot</h3><span className="text-[10px] opacity-80 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Online</span></div></div>
        <div className="flex items-center gap-2 text-white/80">
          {isMinimized ? <button onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}><ChevronDown className="transform rotate-180" size={18} /></button> : <button onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}><ChevronDown size={18} /></button>}
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}><X size={18} /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mr-2 shrink-0 text-indigo-600 dark:text-indigo-400"><Bot size={16} /></div>}
                <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'}`}>{msg.text}</div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start"><div className="bg-white dark:bg-slate-800 p-3 rounded-xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex gap-1 ml-10"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div></div></div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
            {(CONTEXT_SUGGESTIONS[currentContext] || CONTEXT_SUGGESTIONS['dashboard']).map((sugg, i) => (
              <button key={i} onClick={() => handleSendMessage(undefined, sugg)} className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-full text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"><Zap size={10} /> {sugg}</button>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="relative">
              <input type="text" placeholder="Digite sua dúvida..." className="w-full pl-4 pr-10 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
              <button type="submit" disabled={!inputValue.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"><Send size={16} /></button>
            </div>
          </form>

          {/* Resize Handle */}
          <div 
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-end justify-end p-1.5 opacity-30 hover:opacity-100 transition-opacity"
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerCancel={onResizePointerUp}
            style={{ touchAction: 'none' }}
          >
            <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-slate-500 rounded-br-sm" />
          </div>
        </>
      )}
    </div>
  );
};

export default AiAssistant;