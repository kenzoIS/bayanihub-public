const url = 'https://zswdzqhtjetwlisipjny.supabase.co/rest/v1';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzd2R6cWh0amV0d2xpc2lwam55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0NDY4MywiZXhwIjoyMDg4ODIwNjgzfQ.z8P0fzCuiclX9yu9iAtm-mKOvan6WBwAWFAZrguaj2Q';

async function check() {
  const [vApp, dApp, qr] = await Promise.all([
    fetch(`${url}/volunteer_applications?select=*&limit=1`, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }).then(r => r.json()),
    fetch(`${url}/donations?select=*&limit=1`, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }).then(r => r.json()),
    fetch(`${url}/qr_codes?select=*&limit=1`, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }).then(r => r.json())
  ]);
  console.log("vApp:", vApp);
  console.log("dApp:", dApp);
  console.log("qr:", qr);
}
check();
