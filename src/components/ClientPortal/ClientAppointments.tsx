import React from 'react';
import ClientLayout from './ClientLayout';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, CheckCircle, XCircle } from 'lucide-react';
import { useClientData } from './ClientContext';
import { AddToCalendar } from '../AddToCalendar';

const ClientAppointments: React.FC = () => {
    const { appointments, patient } = useClientData();

    return (
        <ClientLayout activePage="appointments">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meus Agendamentos</h1>
                    <Link to="/agendar" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-sm transition-colors">
                        + Novo Agendamento
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Data & Hora</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Terapeuta</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            Nenhum agendamento encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((appt) => (
                                        <tr key={appt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{new Date(appt.date).toLocaleDateString('pt-BR')}</p>
                                                        <p className="text-slate-500">{appt.time}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {patient?.therapist_name || 'Seu Terapeuta'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {appt.status === 'Agendado' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                        <Clock size={12} /> Agendado
                                                    </span>
                                                )}
                                                {appt.status === 'Concluído' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        <CheckCircle size={12} /> Concluído
                                                    </span>
                                                )}
                                                {appt.status === 'Cancelado' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        <XCircle size={12} /> Cancelado
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {appt.status === 'Agendado' && (
                                                        <>
                                                            <AddToCalendar
                                                                title={`Sessão TRG: ${patient?.therapist_name || 'Terapeuta'}`}
                                                                date={appt.date}
                                                                time={appt.time}
                                                                description="Sessão de TRG agendada via TeraNexus."
                                                            />
                                                            <Link to={`/sessao-cliente/${appt.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-colors">
                                                                <Video size={14} /> Entrar
                                                            </Link>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
};

export default ClientAppointments;
