const fetch = globalThis.fetch;
async function test() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
        });
        const loginJson = await loginRes.json();
        if (!loginJson.data) {
             console.log("LOGIN FAILED:", loginJson);
             return;
        }
        
        const dashRes = await fetch('http://localhost:5000/api/dashboard/advanced?range=7days', {
            headers: { 'Authorization': `Bearer ${loginJson.data.token}` }
        });
        const text = await dashRes.text();
        console.log("DASHBOARD RESPONSE STATUS:", dashRes.status);
        console.log("DASHBOARD RESPONSE BODY:", text);
    } catch(e) {
        console.error("FETCH ERROR:", e);
    }
}
test();
