import { VercelRequest, VercelResponse } from '@vercel/node';

// Statically import all handlers from the hidden endpoints directory
import aiChat from './_endpoints/ai/chat';
import aiReport from './_endpoints/ai/report';
import aiOptimize from './_endpoints/ai/optimize';
import authRequestReset from './_endpoints/auth/request-password-reset';
import blockedSlots from './_endpoints/blocked-slots';
import booking from './_endpoints/booking';
import clientAuthRegister from './_endpoints/client-auth/register';
import clientPortal from './_endpoints/client-portal';
import createPaymentIntent from './_endpoints/create-payment-intent';
import dashboard from './_endpoints/dashboard';
import emailsWelcome from './_endpoints/emails/welcome';
import feedback from './_endpoints/feedback';
import financials from './_endpoints/financials';
import manualConfirm from './_endpoints/manual-confirm';
import notifications from './_endpoints/notifications';
import patientDetails from './_endpoints/patient-details';
import payments from './_endpoints/payments';
import recordings from './_endpoints/recordings';
import reports from './_endpoints/reports';
import sud from './_endpoints/sud';
import webhook from './_endpoints/webhook';
import cronReminders from './_endpoints/cron/reminders';
import cronKeepAlive from './_endpoints/cron/keep-alive';
import notificationsManual from './_endpoints/notifications/manual';
import appointments from './_endpoints/appointments';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Extract path relative to /api/
    const url = req.url || '';
    const cleanUrl = url.split('?')[0].replace(/^\/api\//, '').replace(/\/$/, '');

    console.log(`[API Router] Clean URL: ${cleanUrl}`);

    switch (cleanUrl) {
        case 'ai/chat': return aiChat(req, res);
        case 'ai/report': return aiReport(req, res);
        case 'ai/optimize': return aiOptimize(req, res);
        case 'auth/request-password-reset': return authRequestReset(req, res);
        case 'appointments': return appointments(req, res);
        case 'blocked-slots': return blockedSlots(req, res);
        case 'booking': return booking(req, res);
        case 'client-auth/register': return clientAuthRegister(req, res);
        case 'client-portal': return clientPortal(req, res);
        case 'create-payment-intent': return createPaymentIntent(req, res);
        case 'dashboard': return dashboard(req, res);
        case 'emails/welcome': return emailsWelcome(req, res);
        case 'feedback': return feedback(req, res);
        case 'financials': return financials(req, res);
        case 'manual-confirm': return manualConfirm(req, res);
        case 'notifications': return notifications(req, res);
        case 'notifications/manual': return notificationsManual(req, res);
        case 'patient-details': return patientDetails(req, res);
        case 'payments': return payments(req, res);
        case 'recordings': return recordings(req, res);
        case 'reports': return reports(req, res);
        case 'sud': return sud(req, res);
        case 'webhook': return webhook(req, res);
        case 'cron/reminders': return cronReminders(req, res);
        case 'cron/keep-alive': return cronKeepAlive(req, res);
        default:
            res.status(404).json({ error: `Route not found: /api/${cleanUrl}` });
    }
}
