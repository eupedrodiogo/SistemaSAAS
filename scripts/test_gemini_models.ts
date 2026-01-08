
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No GEMINI_API_KEY found in .env.local');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // There isn't a direct listModels on genAI instance in some SDK versions, but let's try via the model manager if accessible or just try to invoke a model.
        // Actually, the SDK doesn't expose listModels in the high-level class easily.
        // We will try to just run a simple test with 'gemini-1.5-flash' and 'gemini-1.5-pro' and print which one works.

        console.log('Testing gemini-1.5-flash...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            await model.generateContent("Test");
            console.log('SUCCESS: gemini-1.5-flash is available.');
        } catch (e: any) {
            console.log('FAILED: gemini-1.5-flash', e.message);
        }

        console.log('Testing gemini-pro...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            await model.generateContent("Test");
            console.log('SUCCESS: gemini-pro is available.');
        } catch (e: any) {
            console.log('FAILED: gemini-pro', e.message);
        }

        console.log('Testing gemini-1.0-pro...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            await model.generateContent("Test");
            console.log('SUCCESS: gemini-1.0-pro is available.');
        } catch (e: any) {
            console.log('FAILED: gemini-1.0-pro', e.message);
        }

    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
