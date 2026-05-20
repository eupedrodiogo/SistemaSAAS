"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyReminders = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("./notifications");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.dailyReminders = functions.pubsub
    .schedule('0 9 * * *')
    .timeZone('America/Sao_Paulo')
    .onRun(async (context) => {
    console.log('Running daily reminders...');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
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
            const patientId = appt.patient_id;
            if (!patientId)
                continue;
            const patientDoc = await db.collection('patients').doc(patientId).get();
            if (!patientDoc.exists)
                continue;
            const patient = patientDoc.data();
            const pName = patient?.name;
            const pPhone = patient?.phone;
            if (pName && pPhone) {
                console.log(`Sending reminder to ${pName} (${pPhone})...`);
                const result = await (0, notifications_1.sendMetaWhatsApp)(pPhone, notifications_1.WHATSAPP_TEMPLATES.SESSION_REMINDER_15MIN(pName));
                if (result.success) {
                    await doc.ref.update({ reminder_sent: true });
                }
            }
        }
        return null;
    }
    catch (error) {
        console.error('Error in dailyReminders:', error);
        return null;
    }
});
//# sourceMappingURL=reminders.js.map