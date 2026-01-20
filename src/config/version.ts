export const APP_VERSION = '1.2.0';

export interface ChangelogItem {
    version: string;
    date: string;
    title: string;
    changes: string[];
}

export const CHANGELOG: ChangelogItem[] = [
    {
        version: '1.2.0',
        date: '13/01/2026',
        title: 'Melhorias na Agenda e Bloqueios',
        changes: [
            '✨ Novo visual para dias bloqueados no calendário (listrado)',
            '📅 Agora é possivel bloquear datas específicas (ex: 24/01) além de dias da semana',
            '📱 Melhor visualização de bloqueios no celular',
            '🐛 Correção no bloqueio de horários'
        ]
    }
];
