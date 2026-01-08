import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { verifyAuth } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: 'Missing subscription data' });
    }

    try {
        const user = await verifyAuth(req, res);
        if (!user) return; // verifyAuth handles the 401 response

        // UPSERT the subscription
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            }, {
                onConflict: 'endpoint'
            });

        if (error) {
            console.error('Error saving subscription:', error);
            return res.status(500).json({ error: 'Database error while saving subscription' });
        }

        return res.status(200).json({ success: true, message: 'Subscription saved successfully' });
    } catch (error: any) {
        console.error('Push subscription error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
