import { VercelRequest, VercelResponse } from '@vercel/node';

// Root level
import appointments from './_endpoints/appointments';
import availability from './_endpoints/availability';
import blockedSlots from './_endpoints/blocked-slots';
import booking from './_endpoints/booking';
import clientPortal from './_endpoints/client-portal';
import dashboard from './_endpoints/dashboard';
import feedback from './_endpoints/feedback';
import financials from './_endpoints/financials';
import fixBooking from './_endpoints/fix-booking';
import manualConfirm from './_endpoints/manual-confirm';
import notifications from './_endpoints/notifications';
import patientDetails from './_endpoints/patient-details';
import patients from './_endpoints/patients';
import payments from './_endpoints/payments';
import recordings from './_endpoints/recordings';
import reports from './_endpoints/reports';
import setupSud from './_endpoints/setup_sud';
import sud from './_endpoints/sud';
import testWhatsapp from './_endpoints/test-whatsapp';
import webhook from './_endpoints/webhook';

// ai
import aiChat from './_endpoints/ai/chat';
import aiOptimize from './_endpoints/ai/optimize';
import aiReport from './_endpoints/ai/report';

// auth
import authLogin from './_endpoints/auth/login';
import authRegisterComplete from './_endpoints/auth/register-complete';
import authRequestPasswordReset from './_endpoints/auth/request-password-reset';

// client-auth
import clientAuthRegister from './_endpoints/client-auth/register';

// cron
import cronKeepAlive from './_endpoints/cron/keep-alive';
import cronReminders from './_endpoints/cron/reminders';

// debug
import debugCheckMeta from './_endpoints/debug/check-meta';

// emails
import emailsTemplates from './_endpoints/emails/templates';
import emailsWelcome from './_endpoints/emails/welcome';

// network
import networkMatch from './_endpoints/network/match';
import networkReferral from './_endpoints/network/referral';

// notifications
import notificationsManual from './_endpoints/notifications/manual';
import notificationsRegisterWelcome from './_endpoints/notifications/register-welcome';
import notificationsSubscribe from './_endpoints/notifications/subscribe';
import notificationsTemplates from './_endpoints/notifications/templates';
import notificationsTestPush from './_endpoints/notifications/test-push';

// public
import publicTherapists from './_endpoints/public/therapists';

// system
import systemAddSessionDataColumn from './_endpoints/system/add_session_data_column';
import systemMigrateReminders from './_endpoints/system/migrate-reminders';
import systemSimpleTest from './_endpoints/system/simple-test';
import systemTestWhatsapp from './_endpoints/system/test-whatsapp';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const url = req.url || '';
    const cleanUrl = url.split('?')[0].replace(/^\/api\//, '').replace(/\/$/, '');
    
    console.log(`[API Router] Clean URL: ${cleanUrl}`);

    switch (cleanUrl) {
        case 'appointments': return appointments(req, res);
        case 'availability': return availability(req, res);
        case 'blocked-slots': return blockedSlots(req, res);
        case 'booking': return booking(req, res);
        case 'client-portal': return clientPortal(req, res);
        case 'dashboard': return dashboard(req, res);
        case 'feedback': return feedback(req, res);
        case 'financials': return financials(req, res);
        case 'fix-booking': return fixBooking(req, res);
        case 'manual-confirm': return manualConfirm(req, res);
        case 'notifications': return notifications(req, res);
        case 'patient-details': return patientDetails(req, res);
        case 'patients': return patients(req, res);
        case 'payments': return payments(req, res);
        case 'recordings': return recordings(req, res);
        case 'reports': return reports(req, res);
        case 'setup_sud': return setupSud(req, res);
        case 'sud': return sud(req, res);
        case 'test-whatsapp': return testWhatsapp(req, res);
        case 'webhook': return webhook(req, res);

        case 'ai/chat': return aiChat(req, res);
        case 'ai/optimize': return aiOptimize(req, res);
        case 'ai/report': return aiReport(req, res);

        case 'auth/login': return authLogin(req, res);
        case 'auth/register-complete': return authRegisterComplete(req, res);
        case 'auth/request-password-reset': return authRequestPasswordReset(req, res);

        case 'client-auth/register': return clientAuthRegister(req, res);

        case 'cron/keep-alive': return cronKeepAlive(req, res);
        case 'cron/reminders': return cronReminders(req, res);

        case 'debug/check-meta': return debugCheckMeta(req, res);

        case 'emails/templates': return emailsTemplates(req, res);
        case 'emails/welcome': return emailsWelcome(req, res);

        case 'network/match': return networkMatch(req, res);
        case 'network/referral': return networkReferral(req, res);

        case 'notifications/manual': return notificationsManual(req, res);
        case 'notifications/register-welcome': return notificationsRegisterWelcome(req, res);
        case 'notifications/subscribe': return notificationsSubscribe(req, res);
        case 'notifications/templates': return notificationsTemplates(req, res);
        case 'notifications/test-push': return notificationsTestPush(req, res);

        case 'public/therapists': return publicTherapists(req, res);

        case 'system/add_session_data_column': return systemAddSessionDataColumn(req, res);
        case 'system/migrate-reminders': return systemMigrateReminders(req, res);
        case 'system/simple-test': return systemSimpleTest(req, res);
        case 'system/test-whatsapp': return systemTestWhatsapp(req, res);

        default:
            res.status(404).json({ error: `Route not found: /api/${cleanUrl}` });
    }
}
