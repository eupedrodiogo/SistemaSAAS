

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Ativo' | 'Inativo' | 'Em Pausa';
  nextSession?: string;
  lastSession?: string;
  notes?: string;
  /** @deprecated Campo estático legado — use total_invested via patient_financial_summary */
  totalInvested?: number;
  /** SSoT: calculado dinamicamente via View patient_financial_summary */
  total_invested?: number;
  pending_amount?: number;
}

export interface SessionStats {
  month: string;
  sessions: number;
  anxietyAvg: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  date: string;
  time: string;
  status: 'Agendado' | 'Concluído' | 'Cancelado' | 'scheduled' | 'pending_payment' | 'completed' | 'cancelled';
  type: 'Anamnese' | 'Cronológico' | 'Reprocessamento' | 'Somático' | 'Temático' | 'Futuro' | 'Potencialização';
  sessionData?: SessionData;
}

export interface SessionData {
  price?: number; // Valor cobrado na sessão
  // Fases Dual (Emocional / Físico)
  somaticMentalHistory?: number[];
  somaticPhysicalHistory?: number[];
  thematicMentalHistory?: number[];
  thematicPhysicalHistory?: number[];
  futureMentalHistory?: number[];
  futurePhysicalHistory?: number[];
  potentializationMentalHistory?: number[];
  potentializationPhysicalHistory?: number[]; // Positive SUD
  notes?: string;
  [key: string]: any;
}

export interface BlockedTime {
  id: string;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for recurring, can be undefined for specific dates
  date?: string; // YYYY-MM-DD for specific date blocks
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  label: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'alert' | 'success' | 'info';
}

// Re-export Enums
// Re-export Enums
export { AppView, TherapistPlan } from './src/enums';
import { AppView } from './src/enums';



export interface NavItem {
  id: AppView;
  label: string;
  icon: any;
}

export interface ClientIntakeData {
  // Dados Pessoais
  nome?: string;
  name?: string;
  dataNascimento?: string;
  rg?: string;
  cpf?: string;
  endereco?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  celular?: string;
  phone?: string;
  email?: string;
  profissao?: string;
  empresa?: string;
  estadoCivil?: string;
  religiao?: string;
  escolaridade?: string;

  // Queixa Principal
  complaint?: string; // Mapped from queixaPrincipal

  // Fase 01 - Vida Pessoal
  motivoDivorcio?: string;
  numeroFilhos?: string;
  relacaoFilhos?: string;
  relacaoParceiro?: string;
  sentimentoCasa?: string;
  sentimentoTrabalho?: string;
  pertenceFamilia?: string;
  pertenceSocial?: string;
  frustracoes?: string;

  // Saúde e Hábitos
  history?: string; // General history or specific field? The form has 'traumas', 'fobias', etc. We'll map 'history' to a summary or keep it for legacy.
  sexualidade?: string;
  traumas?: string;
  fobias?: string;
  drogas?: string;
  alcool?: string;
  insonia?: string;
  doresCabeca?: string;
  ideiasSuicidas?: string;
  medications?: string; // Mapped from medicacao
  nivelStress?: string;

  // Fase 02 - Mental
  pensamentosSi?: string;
  pensamentosCorpo?: string;
  pensamentosCompetencia?: string;
  visaoFuturo?: string;
  felicidade?: string;
  mudanca?: string;

  // Fase 03 - Infância
  criadoPais?: string;
  relacaoPai?: string;
  relacaoMae?: string;
  paisAgressivos?: string;
  paisAlcool?: string;
  relacaoEntrePais?: string;
  crencaRelacionamento?: string;
  magoaInfancia?: string;
  medoInfancia?: string;

  // Fase 04 - Emocional
  maioresMedosHoje?: string;
  papelVida?: string;
  dominanteSubmisso?: string;
  raivaRancor?: string;
  sentimentoCulpa?: string;

  // Tabela de Sentimentos
  int_raiva?: string;
  int_medo?: string;
  int_culpa?: string;
  int_tristeza?: string;
  int_ansiedade?: string;
  int_solidão?: string;
  int_desanimo?: string;
  int_angustia?: string;

  // Legacy/Extra
  goals?: string;
  previousTherapy?: string;
  familyHistory?: string;
  traumaHistory?: string;
  resources?: string;

  // Novos Campos Anamnese (Wizard)
  transtornos?: { name: string; level: number }[]; // Lista de transtornos selecionados
  doresFisicas?: { name: string; level: number }[]; // Lista de dores/doenças físicas
  temasFuturo?: { name: string; level: number }[]; // Temas de medo/angústia sobre o futuro
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string; // Instagram, Indicação, Google
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
  potentialValue: number;
  lastContact: string;
}