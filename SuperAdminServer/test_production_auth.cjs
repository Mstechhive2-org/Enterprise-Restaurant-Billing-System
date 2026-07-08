const fetch = require('node-fetch');

async function test() {
  const loginUrl = 'https://enterprise-restaurant-billing-system.onrender.com/api/auth/login';
  console.log("Attempting to log in as mm_admin...");
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'mm_admin', password: 'mm_admin123' })
  });
  
  console.log("Login status:", loginRes.status);
  const loginData = await loginRes.json();
  console.log("Login response data:", JSON.stringify(loginData, null, 2));
  
  if (loginRes.status !== 200) {
    console.log("Login failed!");
    return;
  }
  
  const token = loginData.accessToken;
  const db = loginData.databaseName;
  
  console.log("\nAttempting to query /bills/open with the received token...");
  const billsRes = await fetch('https://enterprise-restaurant-billing-system.onrender.com/api/bills/open', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-DB': db
    }
  });
  
  console.log("Bills status:", billsRes.status);
  const billsData = await billsRes.json();
  console.log("Bills response:", JSON.stringify(billsData, null, 2));
}

test().catch(err => console.error(err));
