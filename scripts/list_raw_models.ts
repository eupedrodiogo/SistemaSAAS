
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No API Key');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('Available Text Generation Models:');
            data.models
                .filter((m: any) => m.supportedGenerationMethods.includes('generateContent') && m.name.includes('gemini'))
                .forEach((m: any) => {
                    console.log(`- ${m.name}`);
                });
        } else {
            console.error('No models found or error:', data);
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

checkModels();
