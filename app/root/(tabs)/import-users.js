const { createClient } = require('@supabase/supabase-js');
const users = require('./users.json'); // Your exported users

const SUPABASE_URL = 'https://opumjgimrzdtywxavguj.supabase.co';
const SERVICE_ROLE_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdW1qZ2ltcnpkdHl3eGF2Z3VqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTgxMjEwNSwiZXhwIjoyMDU1Mzg4MTA1fQ.NAvWKUfuwlcledAZL8RDNA8_a5NujQ27Gy0wiJ8eSNY"; // Get from Supabase project settings

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function importUsers() {
  for (const user of users) {
    const { email, password } = user;
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) {
      console.error(`Failed to import ${email}:`, error.message);
    } else {
      console.log(`Imported: ${email}`);
    }
  }
}

importUsers();