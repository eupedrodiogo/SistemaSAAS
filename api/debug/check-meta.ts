
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const vars = {
        META_WHATSAPP_TOKEN: process.env.META_WHATSAPP_TOKEN ? 'Set (starts with ' + process.env.META_WHATSAPP_TOKEN.substring(0, 5) + '...)' : 'MISSING',
        META_PHONE_ID: process.env.META_PHONE_ID ? 'Set (' + process.env.META_PHONE_ID + ')' : 'MISSING',
        NODE_VERSION: process.version,
    };

    // Try a simpler ping to Meta to verify token validity
    let apiStatus = 'Not Tested';
    if (process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_ID) {
        try {
            // Just check phone number info (GET request)
            const response = await fetch(`https://graph.facebook.com/v21.0/${process.env.META_PHONE_ID}`, {
                headers: { 'Authorization': `Bearer ${process.env.META_WHATSAPP_TOKEN}` }
            });
            const data = await response.json();
            apiStatus = response.ok ? 'Valid (Phone ID Metadata Accessible)' : `Invalid (${JSON.stringify(data)})`;
        } catch (e: any) {
            apiStatus = `Error: ${e.message}`;
        }
    }

    return res.status(200).json({
        environment: vars,
        api_check: apiStatus
    });
}
