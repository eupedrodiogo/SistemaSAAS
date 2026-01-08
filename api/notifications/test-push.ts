import { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { supabase } from '../../lib/supabase';
import { verifyAuth } from '../utils/auth';

// Configure VAPID keys
// In production, these should be environment variables
const PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BJ7-wfrZYbt4dQE2E5SCIS5BExiOgZ0jwQ30U7JpZM25hghTidUkyaCZmC0uegvJgIiCwyGBBlj1n1s9YxrNRYI';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'aeIr6STjS0JYGvV7QqLx3YPVAYaklOAONE79aWY9TPI';

webpush.setVapidDetails(
    'mailto:contato@trgnexus.com.br',
    PUBLIC_KEY,
    PRIVATE_KEY
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await verifyAuth(req, res);
        if (!user) return;

        // Get all subscriptions for this user
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            return res.status(500).json({ error: 'Error fetching subscriptions' });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return res.status(404).json({ error: 'No subscriptions found for this user' });
        }

        const payload = JSON.stringify({
            title: 'Teste de Notificação',
            body: 'Seu sistema de notificações push está funcionando perfeitamente!',
            data: {
                url: '/dashboard'
            }
        });

        const results = await Promise.all(
            subscriptions.map(sub =>
                webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }, payload).catch(err => {
                    console.error('Error sending push to endpoint:', sub.endpoint, err);
                    return { error: err };
                })
            )
        );

        return res.status(200).json({ success: true, results });
    } catch (error: any) {
        console.error('Test push error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
