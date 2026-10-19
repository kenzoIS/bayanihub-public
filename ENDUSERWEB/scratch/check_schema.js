const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zswdzqhtjetwlisipjny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzd2R6cWh0amV0d2xpc2lwam55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0NDY4MywiZXhwIjoyMDg4ODIwNjgzfQ.z8P0fzCuiclX9yu9iAtm-mKOvan6WBwAWFAZrguaj2Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: vApp } = await supabase.from('volunteer_applications').select('*').limit(1);
  const { data: dApp } = await supabase.from('donations').select('*').limit(1);
  const { data: qr } = await supabase.from('qr_codes').select('*').limit(1);
  console.log("vApp:", vApp);
  console.log("dApp:", dApp);
  console.log("qr:", qr);
}
check();
