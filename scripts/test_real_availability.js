import fetch from 'node-fetch';

const BASE_URL = 'https://traeegnimsqa.vercel.app/api';
const DATE = '2025-12-30';
const TIME = '10:00';

async function testRealAvailability() {
    try {
        console.log(`1. Checking availability for ${DATE}...`);
        const res1 = await fetch(`${BASE_URL}/availability?date=${DATE}`);
        const data1 = await res1.json();
        const slotBefore = data1.slots.find(s => s.time === TIME);
        console.log(`Slot ${TIME} available?`, slotBefore.available);

        if (!slotBefore.available) {
            console.log("Slot already occupied. Skipping booking test or choose another date.");
            // Proceed anyway to see if it remains occupied
        } else {
            console.log(`2. Booking slot ${TIME} for ${DATE}...`);
            const bookingPayload = {
                name: "Availability Tester",
                email: "test_avail@example.com",
                phone: "11999999999",
                date: DATE,
                time: TIME,
                queixaPrincipal: "Teste de disponibilidade"
            };

            const resBooking = await fetch(`${BASE_URL}/booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload)
            });
            const bookingData = await resBooking.json();
            console.log("Booking response:", bookingData);
        }

        console.log(`3. Checking availability for ${DATE} again...`);
        const res2 = await fetch(`${BASE_URL}/availability?date=${DATE}`);
        const data2 = await res2.json();
        const slotAfter = data2.slots.find(s => s.time === TIME);
        console.log(`Slot ${TIME} available?`, slotAfter.available);

        if (slotAfter.available === false) {
            console.log("SUCCESS: Slot is now unavailable.");
        } else {
            console.error("FAILURE: Slot is still available!");
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testRealAvailability();
