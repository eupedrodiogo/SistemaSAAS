import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, ChevronDown, Zap } from 'lucide-react';
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
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95 animate-fade-in group"
      >
        <Sparkles size={24} className="group-hover:animate-spin-slow" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
      </button>
    );
  }

  return (
    <div className={`fixed z-[90] bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 flex flex-col ${isMinimized ? 'bottom-6 right-6 w-72 h-16' : 'bottom-6 right-6 w-full max-w-[380px] h-[550px]'}`}>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between cursor-pointer shrink-0" onClick={() => !isMinimized && setIsMinimized(true)}>
        <div className="flex items-center gap-2 text-white"><Bot size={20} /><div><h3 className="font-bold text-sm">Nexus AI Copilot</h3><span className="text-[10px] opacity-80 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Online</span></div></div>
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
        </>
      )}
    </div>
  );
};

export default AiAssistant;