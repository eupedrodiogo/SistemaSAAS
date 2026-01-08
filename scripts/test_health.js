import fetch from 'node-fetch';

async function testHealth() {
    try {
        console.log("Sending request to https://traeegnimsqa.vercel.app/api/health...");
        const response = await fetch('https://traeegnimsqa.vercel.app/api/health');

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log("Response Body:", text);

    } catch (error) {
        console.error("Request failed:", error);
    }
}

testHealth();
