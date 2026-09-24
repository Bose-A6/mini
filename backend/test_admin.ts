async function testAdmin() {
  const r1 = await (await fetch('http://localhost:4000/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'wrong_pass' })
  })).json();
  console.log('1. Wrong passcode response:', JSON.stringify(r1));

  const r2 = await (await fetch('http://localhost:4000/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'admin@426' })
  })).json();
  console.log('2. Correct passcode response:', JSON.stringify(r2));
}

testAdmin().catch(console.error);
