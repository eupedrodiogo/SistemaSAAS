
import { Patient, SessionStats, Appointment, BlockedTime, NotificationItem } from 'types';

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 5);
const lastWeek = new Date(today);
lastWeek.setDate(today.getDate() - 3);

// Mocks cleared for production
export const MOCK_PATIENTS: Patient[] = [];
export const MOCK_STATS: SessionStats[] = [];
export const MOCK_APPOINTMENTS: Appointment[] = [];

export const DEFAULT_BLOCKED_TIMES: BlockedTime[] = [
  { id: '1', dayOfWeek: 1, startTime: '12:00', endTime: '13:00', label: 'Almoço' },
  { id: '2', dayOfWeek: 2, startTime: '12:00', endTime: '13:00', label: 'Almoço' },
  { id: '3', dayOfWeek: 3, startTime: '12:00', endTime: '13:00', label: 'Almoço' },
  { id: '4', dayOfWeek: 4, startTime: '12:00', endTime: '13:00', label: 'Almoço' },
  { id: '5', dayOfWeek: 5, startTime: '12:00', endTime: '13:00', label: 'Almoço' },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [];