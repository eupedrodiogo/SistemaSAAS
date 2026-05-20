import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendMetaWhatsApp, WHATSAPP_TEMPLATES } from './notifications';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

export const dailyReminders = functions.pubsub
    .schedule('0 9 * * *') // Every day at 9:00 AM
    .timeZone('America/Sao_Paulo')
    .onRun(async (context) => {
        console.log('Running daily reminders...');

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Format: DD/MM/YYYY
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const year = tomorrow.getFullYear();
        const tomorrowStr = `${day}/${month}/${year}`;

        console.log(`Target Date: ${tomorrowStr}`);

        try {
            const snapshot = await db.collection('appointments')
                .where('status', '==', 'scheduled')
                .where('date', '==', tomorrowStr)
                .where('reminder_sent', '==', false)
                .get();

            if (snapshot.empty) {
                console.log('No appointments to remind.');
                return null;
            }

            console.log(`Found ${snapshot.size} appointments.`);

            for (const doc of snapshot.docs) {
                const appt = doc.data();

                // Fetch patient details (now in separate collection 'patients' or embedded?)
                // Assuming patientId is in the appointment
                const patientId = appt.patient_id;
                if (!patientId) continue;

                const patientDoc = await db.collection('patients').doc(patientId).get();
                if (!patientDoc.exists) continue;

                const patient = patientDoc.data();
                const pName = patient?.name;
                const pPhone = patient?.phone;

                if (pName && pPhone) {
                    console.log(`Sending reminder to ${pName} (${pPhone})...`);
                    const result = await sendMetaWhatsApp(pPhone, WHATSAPP_TEMPLATES.SESSION_REMINDER_15MIN(pName));

                    if (result.success) {
                        await doc.ref.update({ reminder_sent: true });
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error in dailyReminders:', error);
            return null;
        }
    });
