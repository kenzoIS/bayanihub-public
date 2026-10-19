
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

async function checkBuckets() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing env vars');
    return;
  }

  const supabase = createClient(url, key);

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Error listing buckets:', error.message);
    return;
  }

  console.log('Existing buckets:', buckets.map(b => b.name));

  const required = ['volunteer-documents', 'identity-documents'];
  for (const bucket of required) {
    if (!buckets.find(b => b.name === bucket)) {
      console.log(`Creating bucket: ${bucket}`);
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
        fileSizeLimit: 10485760 // 10MB
      });
      if (createError) {
        console.error(`Error creating bucket ${bucket}:`, createError.message);
      } else {
        console.log(`Bucket ${bucket} created successfully.`);
      }
    }
  }
}

checkBuckets();
