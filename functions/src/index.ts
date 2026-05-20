import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp();
}

export { dailyReminders } from './reminders';
