import React, { useState } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'
      }`}
  >
    <div
      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'
        }`}
    />
  </button>
);

const weekDays = [
  { val: 'monday', label: 'Segunda-feira' },
  { val: 'tuesday', label: 'Terça-feira' },
  { val: 'wednesday', label: 'Quarta-feira' },
  { val: 'thursday', label: 'Quinta-feira' },
  { val: 'friday', label: 'Sexta-feira' },
  { val: 'saturday', label: 'Sábado' },
  { val: 'sunday', label: 'Domingo' }
];

interface ScheduleTabProps {
  availability: any[];
  setAvailability: React.Dispatch<React.SetStateAction<any[]>>;
  blockedTimes: any[];
  setBlockedTimes: React.Dispatch<React.SetStateAction<any[]>>;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  availability,
  setAvailability,
  blockedTimes,
  setBlockedTimes
}) => {
  const [newBlock, setNewBlock] = useState({ day: 'monday', start: '12:00', end: '13:00', label: 'Almoço' });

  const addBlockedTime = () => {
    if (!newBlock.start || !newBlock.end || !newBlock.label) return;
    setBlockedTimes([...blockedTimes, { id: Date.now().toString(), dayOfWeek: newBlock.day, startTime: newBlock.start, endTime: newBlock.end, label: newBlock.label }]);
    setNewBlock({ day: 'monday', start: '12:00', end: '13:00', label: '' });
  };

  const removeBlockedTime = (id: string) => {
    setBlockedTimes(blockedTimes.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HORÁRIOS DE ATENDIMENTO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Horários de Atendimento</h3>
          <p className="text-sm text-slate-500">Defina seus dias e horários padrão de trabalho.</p>
        </div>
        <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {availability.map((avail, index) => {
            const dayName = weekDays.find(d => d.val === avail.dayOfWeek)?.label;
            return (
              <div key={avail.dayOfWeek} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4 w-full md:w-1/3">
                  <ToggleSwitch 
                    checked={avail.isActive} 
                    onChange={() => {
                      const newAvail = [...availability];
                      newAvail[index].isActive = !newAvail[index].isActive;
                      setAvailability(newAvail);
                    }} 
                  />
                  <span className={`font-medium ${avail.isActive ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                    {dayName}
                  </span>
                </div>
                
                <div className={`flex items-center gap-3 transition-opacity ${avail.isActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Início</span>
                    <input
                      type="time"
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                      value={avail.startTime}
                      onChange={(e) => {
                        const newAvail = [...availability];
                        newAvail[index].startTime = e.target.value;
                        setAvailability(newAvail);
                      }}
                    />
                  </div>
                  <span className="text-slate-400 mt-5">até</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fim</span>
                    <input
                      type="time"
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                      value={avail.endTime}
                      onChange={(e) => {
                        const newAvail = [...availability];
                        newAvail[index].endTime = e.target.value;
                        setAvailability(newAvail);
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Bloqueios de Agenda</h3>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Adicionar Novo Bloqueio</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
              value={newBlock.day}
              onChange={(e) => setNewBlock({ ...newBlock, day: e.target.value })}
            >
              {weekDays.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="time"
                className="flex-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                value={newBlock.start}
                onChange={(e) => setNewBlock({ ...newBlock, start: e.target.value })}
              />
              <span className="text-slate-400">-</span>
              <input
                type="time"
                className="flex-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                value={newBlock.end}
                onChange={(e) => setNewBlock({ ...newBlock, end: e.target.value })}
              />
            </div>
            <input
              type="text"
              placeholder="Rótulo (ex: Almoço)"
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
              value={newBlock.label}
              onChange={(e) => setNewBlock({ ...newBlock, label: e.target.value })}
            />
            <button
              onClick={addBlockedTime}
              className="bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Adicionar
            </button>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Bloqueios Ativos</h4>
          <div className="space-y-2">
            {blockedTimes.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum horário bloqueado.</p>}
            {blockedTimes.map(block => (
              <div key={block.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{weekDays.find(d => d.val === block.dayOfWeek)?.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{block.startTime} às {block.endTime} • {block.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeBlockedTime(block.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
