import { VercelRequest, VercelResponse } from '@vercel/node';

// Root level
import appointments from '../src/api-handlers/appointments';
import availability from '../src/api-handlers/availability';
import blockedSlots from '../src/api-handlers/blocked-slots';
import booking from '../src/api-handlers/booking';
import clientPortal from '../src/api-handlers/client-portal';
import dashboard from '../src/api-handlers/dashboard';
import feedback from '../src/api-handlers/feedback';
import financials from '../src/api-handlers/financials';
import fixBooking from '../src/api-handlers/fix-booking';
import manualConfirm from '../src/api-handlers/manual-confirm';
import notifications from '../src/api-handlers/notifications';
import patientDetails from '../src/api-handlers/patient-details';
import patients from '../src/api-handlers/patients';
import payments from '../src/api-handlers/payments';
import recordings from '../src/api-handlers/recordings';
import reports from '../src/api-handlers/reports';
import setupSud from '../src/api-handlers/setup_sud';
import sud from '../src/api-handlers/sud';
import testWhatsapp from '../src/api-handlers/test-whatsapp';
import webhook from '../src/api-handlers/webhook';
import asaas from '../src/api-handlers/asaas';

// ai
import aiChat from '../src/api-handlers/ai/chat';
import aiOptimize from '../src/api-handlers/ai/optimize';
import aiReport from '../src/api-handlers/ai/report';

// auth
import authLogin from '../src/api-handlers/auth/login';
import authRegisterComplete from '../src/api-handlers/auth/register-complete';
import authRequestPasswordReset from '../src/api-handlers/auth/request-password-reset';

// client-auth
import clientAuthRegister from '../src/api-handlers/client-auth/register';

// cron
import cronKeepAlive from '../src/api-handlers/cron/keep-alive';
import cronReminders from '../src/api-handlers/cron/reminders';
import cronReminders24h from '../src/api-handlers/cron/reminders-24h';

// debug
import debugCheckMeta from '../src/api-handlers/debug/check-meta';

// emails
import emailsAnamnese from '../src/api-handlers/emails/anamnese';
import emailsTemplates from '../src/api-handlers/emails/templates';
import emailsWelcome from '../src/api-handlers/emails/welcome';

// network
import networkMatch from '../src/api-handlers/network/match';
import networkReferral from '../src/api-handlers/network/referral';

// notifications
import notificationsManual from '../src/api-handlers/notifications/manual';
import notificationsRegisterWelcome from '../src/api-handlers/notifications/register-welcome';
import notificationsSubscribe from '../src/api-handlers/notifications/subscribe';
import notificationsTemplates from '../src/api-handlers/notifications/templates';
import notificationsTestPush from '../src/api-handlers/notifications/test-push';

// public
import publicTherapists from '../src/api-handlers/public/therapists';

// system
import systemAddSessionDataColumn from '../src/api-handlers/system/add_session_data_column';
import systemAddPasswordHash from '../src/api-handlers/system/add_password_hash';
import systemMigrateReminders from '../src/api-handlers/system/migrate-reminders';
import systemSimpleTest from '../src/api-handlers/system/simple-test';
import systemTestWhatsapp from '../src/api-handlers/system/test-whatsapp';
import systemTestZapi from '../src/api-handlers/system/test-zapi';
import systemSendEmailLink from '../src/api-handlers/system/send-email-link';
import systemMigratePixColumns from '../src/api-handlers/system/migrate-pix-columns';

// pix
import pixCreateCharge from '../src/api-handlers/pix/create-charge';
import pixCheckStatus from '../src/api-handlers/pix/check-status';
import pixWebhook from '../src/api-handlers/pix/webhook';
import pixProcessCard from '../src/api-handlers/pix/process-card';

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
        case 'asaas': return asaas(req, res);

        case 'ai/chat': return aiChat(req, res);
        case 'ai/optimize': return aiOptimize(req, res);
        case 'ai/report': return aiReport(req, res);

        case 'auth/login': return authLogin(req, res);
        case 'auth/register-complete': return authRegisterComplete(req, res);
        case 'auth/request-password-reset': return authRequestPasswordReset(req, res);

        case 'client-auth/register': return clientAuthRegister(req, res);

        case 'cron/keep-alive': return cronKeepAlive(req, res);
        case 'cron/reminders': return cronReminders(req, res);
        case 'cron/reminders-24h': return cronReminders24h(req, res);

        case 'debug/check-meta': return debugCheckMeta(req, res);

        case 'emails/anamnese': return emailsAnamnese(req, res);
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
        case 'system/add_password_hash': return systemAddPasswordHash(req, res);
        case 'system/migrate-reminders': return systemMigrateReminders(req, res);
        case 'system/simple-test': return systemSimpleTest(req, res);
        case 'system/test-whatsapp': return systemTestWhatsapp(req, res);
        case 'system/test-zapi': return systemTestZapi(req, res);
        case 'system/send-email-link': return systemSendEmailLink(req, res);
        case 'system/migrate-pix-columns': return systemMigratePixColumns(req, res);

        case 'pix/create-charge': return pixCreateCharge(req, res);
        case 'pix/check-status': return pixCheckStatus(req, res);
        case 'pix/webhook': return pixWebhook(req, res);
        case 'pix/process-card': return pixProcessCard(req, res);

        default:
            res.status(404).json({ error: `Route not found: /api/${cleanUrl}` });
    }
}
