import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Filter, Tag, Phone, Mail, Clock, MessageCircle, MoreVertical, Briefcase, Edit2, DollarSign, Trash2, Calendar } from 'lucide-react';
import { Patient } from 'types';

const CLIENT_TAGS = ['VIP', 'Particular', 'Convênio', 'Indicação', 'Corporativo'];

interface PatientsGridProps {
  patients: Patient[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilter: 'Todos' | 'Ativo' | 'Inativo' | 'Leads';
  setActiveFilter: (filter: 'Todos' | 'Ativo' | 'Inativo' | 'Leads') => void;
  handleAddNewClient: () => void;
  handleViewRecord: (id: string) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleWhatsApp: (patient: Patient) => void;
  onNavigateToAgenda?: (patientId: string, patientName?: string) => void;
}

export const PatientsGrid: React.FC<PatientsGridProps> = ({
  patients,
  searchTerm,
  setSearchTerm,
  activeFilter,
  setActiveFilter,
  handleAddNewClient,
  handleViewRecord,
  handleEdit,
  handleDelete,
  handleWhatsApp,
  onNavigateToAgenda
}) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    patientId: string | null;
  }>({ visible: false, x: 0, y: 0, patientId: null });

  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleClick, true);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleClick, true);
    };
  }, [contextMenu]);

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'Todos' ||
      (activeFilter === 'Ativo' ? ['Ativo', 'active', 'ativo'].includes(p.status?.toLowerCase() || '') :
       activeFilter === 'Leads' ? p.status === 'Em Pausa' : 
       p.status === activeFilter);
    return matchesSearch && matchesFilter;
  });

  const handleContextMenu = (e: React.MouseEvent, patientId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      patientId
    });
  };

  const handleTouchStart = (e: React.TouchEvent, patientId: string) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    isLongPress.current = false;

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setContextMenu({
        visible: true,
        x,
        y,
        patientId
      });
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Base de contatos, histórico clínico e financeiro.</p>
        </div>
        <button 
          onClick={handleAddNewClient}
          className="w-full sm:w-auto bg-primary-600 dark:bg-secondary-600 hover:bg-primary-700 dark:hover:bg-secondary-700 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-primary-500/20 dark:shadow-secondary-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={20} />
          <span className="font-medium">Novo Cliente</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar clientes, emails, telefones..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 dark:focus:ring-secondary-500 focus:border-transparent outline-none transition-all text-sm text-slate-800 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter size={18} className="text-slate-400 shrink-0" />
          {['Todos', 'Ativo', 'Leads', 'Inativo'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`
                   px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border
                   ${activeFilter === filter
                  ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
               `}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPatients.map((client) => (
          <div
            key={client.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative select-none cursor-pointer hover:border-primary-200 dark:hover:border-slate-700 flex flex-col md:flex-row gap-5"
            onClick={() => handleViewRecord(client.id)}
            onContextMenu={(e) => handleContextMenu(e, client.id)}
            onTouchStart={(e) => handleTouchStart(e, client.id)}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xl shrink-0 group-hover:bg-primary-50 dark:group-hover:bg-slate-800 group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors border-2 border-transparent group-hover:border-primary-100 dark:group-hover:border-slate-700">
                {client.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors">{client.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        ['ativo', 'active'].includes(client.status?.toLowerCase() || '') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        client.status === 'Em Pausa' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                        {['ativo', 'active'].includes(client.status?.toLowerCase() || '') ? 'Ativo' : client.status}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                        <Tag size={10} />
                        {CLIENT_TAGS[Math.floor(Math.random() * CLIENT_TAGS.length)]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 md:hidden">
                    <button
                      className="p-2 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                      onClick={(e) => { e.stopPropagation(); handleWhatsApp(client); }}
                    >
                      <MessageCircle size={20} />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({ visible: true, x: e.clientX - 150, y: e.clientY + 10, patientId: client.id });
                      }}
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Phone size={14} className="shrink-0" />
                    {client.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Clock size={14} className="shrink-0" />
                    Última: {client.lastSession ? new Date(client.lastSession).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end justify-between border-l border-slate-100 dark:border-slate-800 pl-5 shrink-0 min-w-[180px]">
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase">Investimento Total</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.total_invested ?? 0)}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(client.id); }}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-600 hover:border-primary-200 dark:hover:border-secondary-600 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
                  title="Editar Cliente"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigateToAgenda && onNavigateToAgenda(client.id, client.name); }}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-600 hover:border-primary-200 dark:hover:border-secondary-600 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
                  title="Agendar Sessão"
                >
                  <Calendar size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); /* Handle Bill */ }}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-green-600 hover:border-green-200 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-slate-800 transition-colors"
                  title="Novo Lançamento Financeiro"
                >
                  <DollarSign size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleWhatsApp(client); }}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-green-600 hover:border-green-200 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-slate-800 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredPatients.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Nenhum cliente encontrado.</p>
            <p className="text-sm opacity-60">Tente ajustar os filtros ou adicione um novo.</p>
          </div>
        )}
      </div>

      {contextMenu.visible && contextMenu.patientId && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 py-1 min-w-[180px] animate-fade-in overflow-hidden"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
        >
          <button onClick={() => handleViewRecord(contextMenu.patientId!)} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-secondary-400 flex items-center gap-3 transition-colors">
            <Briefcase size={16} /> Ver Ficha Completa
          </button>
          <button onClick={() => handleEdit(contextMenu.patientId!)} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-secondary-400 flex items-center gap-3 transition-colors">
            <Edit2 size={16} /> Editar Dados
          </button>
          <button className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-green-600 flex items-center gap-3 transition-colors">
            <DollarSign size={16} /> Registrar Pagamento
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
          <button onClick={() => { handleDelete(contextMenu.patientId!); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors">
            <Trash2 size={16} /> Arquivar Cliente
          </button>
        </div>
      )}
    </div>
  );
};
