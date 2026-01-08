import Stripe from 'stripe';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Try to load from .env and .env.local
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
    console.error("Error: STRIPE_SECRET_KEY not found in environment.");
    // Check if we can find it in VITE_... vars just in case, but usually it's secret
    process.exit(1);
}

const stripe = new Stripe(key);
const webhookUrl = 'https://trgnexus.vercel.app/api/webhook';

async function setup() {
    try {
        console.log("Checking existing webhooks...");
        const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });

        // Filter for our specific URL
        const existing = webhooks.data.filter(w => w.url === webhookUrl && w.status === 'enabled');

        if (existing.length > 0) {
            console.log(`Found ${existing.length} existing webhook(s) for this URL.`);
            console.log("We cannot retrieve the secret for existing webhooks.");
            console.log("Creating a NEW one to ensure we have the secret...");
        }

        console.log("Creating new webhook endpoint...");
        const endpoint = await stripe.webhookEndpoints.create({
            url: webhookUrl,
            enabled_events: ['payment_intent.succeeded'],
        });

        console.log("Webhook created successfully!");
        console.log(`WEBHOOK_ID=${endpoint.id}`);
        console.log(`WEBHOOK_SECRET=${endpoint.secret}`);

        // Save to a temp file so we can read it in the next step if needed, or just parse output
        fs.writeFileSync('webhook_secret.txt', endpoint.secret);

    } catch (err) {
        console.error("Error creating webhook:", err.message);
        process.exit(1);
    }
}

setup();
