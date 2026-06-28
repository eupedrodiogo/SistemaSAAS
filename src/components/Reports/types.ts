export interface Report {
  id: string;
  title: string;
  type: string;
  content: string;
  created_at: string;
  status: string;
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  nextSession?: string;
  avatar?: string;
}

export interface SessionRecord {
  id: string;
  sessionNumber: number;
  date: string;
  durationSeconds: number;
  patientName: string;
  observation: string;
  transcript: string;
  sudLevels: Record<string, number>;
  ageRange?: string;
  mentalHistory?: Record<string, number[]>;
  physicalHistory?: Record<string, number[]>;
  cycleNotes?: Record<string, Record<string, string>>;
  phaseNotes?: Record<string, Record<string, string>>;
  somaticHistory?: number[];
  thematicHistory?: number[];
  futureHistory?: number[];
  potentializationHistory?: number[];
}

// Helper to avoid timezone shifts when parsing YYYY-MM-DD strings
export const parseSafeDate = (dateStr: string | undefined | Date): Date => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  if (dateStr.length === 10) return new Date(`${dateStr}T12:00:00`);
  return new Date(dateStr);
};
