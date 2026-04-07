// import fetch from 'node-fetch';
const testApi = async () => {
    try {
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password123' })
        });
        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Logged in. Token:', token.substring(0, 10) + '...');
        console.log('Fetching roles...');
        const rolesRes = await fetch('http://localhost:3000/roles', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!rolesRes.ok) {
            console.error('Fetch roles failed:', await rolesRes.text());
            return;
        }
        const rolesData = await rolesRes.json();
        console.log('Roles:', rolesData);
    }
    catch (err) {
        console.error('Error:', err);
    }
};
testApi();
export {};
//# sourceMappingURL=test_api.js.map