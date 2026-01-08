
import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

async function listNumbers() {
    console.log("Fetching Incoming Phone Numbers...");
    try {
        const numbers = await client.incomingPhoneNumbers.list({ limit: 20 });
        if (numbers.length === 0) {
            console.log("No purchased numbers found.");
        }
        numbers.forEach(n => {
            console.log(`- ${n.phoneNumber} (${n.friendlyName})`);
        });

        console.log("\nFetching WhatsApp Senders...");
        // Note: 'senders' endpoint might be different depending on API version, 
        // typically handled via Messaging Services, but let's try to check basic numbers first.
    } catch (err: any) {
        console.error("Error fetching numbers:", err.message);
    }
}

listNumbers();
