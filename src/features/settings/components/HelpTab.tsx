import React from 'react';
import { Search, BookOpen, LifeBuoy, ChevronDown, AlertCircle, Send } from 'lucide-react';

interface HelpTabProps {
  helpView: 'home' | 'guide' | 'article' | 'ticket';
  setHelpView: React.Dispatch<React.SetStateAction<'home' | 'guide' | 'article' | 'ticket'>>;
  helpSearch: string;
  setHelpSearch: React.Dispatch<React.SetStateAction<string>>;
  selectedArticle: any;
  setSelectedArticle: React.Dispatch<React.SetStateAction<any>>;
  guideSection: string;
  setGuideSection: React.Dispatch<React.SetStateAction<string>>;
  supportForm: any;
  setSupportForm: React.Dispatch<React.SetStateAction<any>>;
  handleSendSupport: () => void;
  HELP_ARTICLES: any[];
  SYSTEM_GUIDE: any;
}

export const HelpTab: React.FC<HelpTabProps> = ({
  helpView, setHelpView,
  helpSearch, setHelpSearch,
  selectedArticle, setSelectedArticle,
  guideSection, setGuideSection,
  supportForm, setSupportForm,
  handleSendSupport,
  HELP_ARTICLES, SYSTEM_GUIDE
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* --- Home View --- */}
      {helpView === 'home' && (
        <div className="space-y-6">
          {/* Search Banner */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl p-8 text-center shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-lg mx-auto">
              <h2 className="text-2xl font-bold text-white mb-2">Central de Conhecimento</h2>
              <p className="text-slate-300 mb-6 text-sm">Como podemos ajudar você hoje?</p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar tutoriais, guias ou dúvidas..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:outline-none transition-all"
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                />
              </div>
            </div>
            {/* Decorative Circles */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary-500/20 rounded-full blur-2xl"></div>
          </div>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary-200 dark:hover:border-secondary-700 transition-all group cursor-pointer flex items-center gap-4"
              onClick={() => setHelpView('guide')}
            >
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-800 dark:text-white">Manual do Usuário</h4>
                <p className="text-sm text-slate-500 mt-1">Guia passo a passo do sistema.</p>
              </div>
            </div>

            <div
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-700 transition-all group cursor-pointer flex items-center gap-4"
              onClick={() => setHelpView('ticket')}
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <LifeBuoy size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-800 dark:text-white">Suporte Técnico</h4>
                <p className="text-sm text-slate-500 mt-1">Abra um chamado para nossa equipe.</p>
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Dúvidas Frequentes</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {HELP_ARTICLES.filter(a => a.title.toLowerCase().includes(helpSearch.toLowerCase())).map((article) => (
                <div
                  key={article.id}
                  className="p-6 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors cursor-pointer flex items-start gap-4"
                  onClick={() => { setSelectedArticle(article); setHelpView('article'); }}
                >
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 shrink-0">
                    <article.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        {article.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-base">{article.title}</h4>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{article.description}</p>
                  </div>
                  <div className="self-center text-slate-300">
                    <ChevronDown className="transform -rotate-90" size={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- System Guide View --- */}
      {helpView === 'guide' && (
        <div className="flex flex-col h-[600px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center gap-3">
              <button onClick={() => setHelpView('home')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500">
                <ChevronDown className="transform rotate-90" size={20} />
              </button>
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Manual do Usuário</h3>
                <p className="text-xs text-slate-500">Guia completo do sistema TeraNexus</p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Guide Sidebar */}
            <div className="w-64 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-4 space-y-1 bg-slate-50/30 dark:bg-slate-900">
              {Object.values(SYSTEM_GUIDE).map((section: any) => (
                <button
                  key={section.id}
                  onClick={() => setGuideSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${guideSection === section.id
                    ? 'bg-primary-100 text-primary-700 dark:bg-secondary-900/30 dark:text-secondary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <section.icon size={18} />
                  {section.title}
                </button>
              ))}
            </div>

            {/* Guide Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {Object.values(SYSTEM_GUIDE).map((section: any) => (
                guideSection === section.id && (
                  <div key={section.id} className="animate-fade-in max-w-2xl">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <section.icon size={32} className="text-slate-700 dark:text-slate-200" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{section.title}</h2>
                    </div>
                    <div className="prose dark:prose-invert">
                      {section.content}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Article View --- */}
      {helpView === 'article' && selectedArticle && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button onClick={() => setHelpView('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
              <ChevronDown className="transform rotate-90" size={20} />
            </button>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Voltar para Central</span>
          </div>
          <div className="p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-primary-600 dark:text-primary-400">
                <selectedArticle.icon size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{selectedArticle.title}</h1>
                <p className="text-slate-500">{selectedArticle.description}</p>
              </div>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">{selectedArticle.content}</p>

              {/* Placeholder for more structured content */}
              <div className="my-8 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-xl border-l-4 border-primary-500">
                <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle size={18} /> Dica Pro
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Para mais detalhes, assista aos nossos tutoriais em vídeo na página anterior ou entre em contato com o suporte.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Ticket View --- */}
      {helpView === 'ticket' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button onClick={() => setHelpView('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
              <ChevronDown className="transform rotate-90" size={20} />
            </button>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Voltar</span>
          </div>
          <div className="p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Abrir Chamado de Suporte</h2>
            <p className="text-slate-500 mb-8 text-sm">Descreva seu problema ou dúvida. Nossa equipe responderá em até 24h úteis.</p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Categoria</label>
                  <select
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                    value={supportForm.category}
                    onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                  >
                    <option value="duvida">Dúvida de Uso</option>
                    <option value="bug">Reportar Erro (Bug)</option>
                    <option value="financeiro">Financeiro / Cobrança</option>
                    <option value="sugestao">Sugestão de Melhoria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Prioridade</label>
                  <select
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                    value={supportForm.priority}
                    onChange={(e) => setSupportForm({ ...supportForm, priority: e.target.value })}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta (Sistema Parado)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Assunto</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                  placeholder="Resumo do problema..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Mensagem Detalhada</label>
                <textarea
                  rows={6}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none resize-none"
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                  placeholder="Descreva o que aconteceu, passos para reproduzir, etc."
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex gap-3 text-sm text-blue-800 dark:text-blue-200">
                <LifeBuoy className="shrink-0" size={20} />
                <p>Ao enviar este ticket, você concorda em compartilhar logs técnicos do seu navegador para ajudar no diagnóstico.</p>
              </div>

              <button
                onClick={handleSendSupport}
                className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                <Send size={18} /> Enviar Ticket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
