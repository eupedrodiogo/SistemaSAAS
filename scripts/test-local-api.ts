
import fetch from 'node-fetch';

async function testLocalApi() {
    const url = 'http://localhost:3000/api/appointments';
    console.log(`Testing GET ${url}...`);

    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);

        if (res.ok) {
            const data = await res.json();
            console.log('Response data:', JSON.stringify(data, null, 2));
        } else {
            const text = await res.text();
            console.log('Error response body:', text);
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testLocalApi();
