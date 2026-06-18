import React from 'react';
import { LayoutDashboard, Calendar, Users, BrainCircuit, Menu } from 'lucide-react';
import { AppView } from 'types';

interface MobileBottomNavProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onOpenMore: () => void;
  hasAccess: (view: AppView) => boolean;
  isMoreOpen?: boolean;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onChangeView,
  onOpenMore,
  hasAccess,
  isMoreOpen = false
}) => {
  const mainItems = [
    { id: AppView.DASHBOARD, label: 'Início', icon: LayoutDashboard },
    { id: AppView.AGENDA, label: 'Agenda', icon: Calendar },
    { id: AppView.PATIENTS, label: 'Clientes', icon: Users },
    { id: AppView.THERAPY, label: 'Sessão', icon: BrainCircuit },
  ];

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isLocked = !hasAccess(item.id);

          return (
            <button
              key={item.id}
              onClick={() => {
                if (!isLocked) {
                  onChangeView(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-xl transition-all duration-200 relative
                ${isActive && !isLocked
                  ? 'text-primary-600 dark:text-primary-400'
                  : isLocked
                    ? 'text-slate-400/50 cursor-not-allowed'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }
              `}
            >
              {/* Active Indicator Bubble */}
              {isActive && !isLocked && (
                <span className="absolute inset-0 bg-primary-50 dark:bg-primary-900/30 rounded-xl -z-10 animate-in fade-in zoom-in duration-200" />
              )}
              
              <Icon 
                size={isActive ? 24 : 22} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-200 ${isActive && !isLocked ? 'scale-110 mb-0.5' : ''}`}
              />
              <span className={`text-[10px] font-medium leading-none transition-all duration-200 ${isActive && !isLocked ? 'opacity-100' : 'opacity-80'}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More/Menu Button */}
        <button
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-xl transition-all duration-200 relative
            ${isMoreOpen
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }
          `}
        >
          {isMoreOpen && (
             <span className="absolute inset-0 bg-primary-50 dark:bg-primary-900/30 rounded-xl -z-10 animate-in fade-in zoom-in duration-200" />
          )}
          <Menu size={isMoreOpen ? 24 : 22} strokeWidth={isMoreOpen ? 2.5 : 2} className={`transition-all duration-200 ${isMoreOpen ? 'scale-110 mb-0.5' : ''}`} />
          <span className={`text-[10px] font-medium leading-none transition-all duration-200 ${isMoreOpen ? 'opacity-100' : 'opacity-80'}`}>
            Menu
          </span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
