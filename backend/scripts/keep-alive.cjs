const { createClient } = require('@supabase/supabase-js');
try { require('dotenv').config(); } catch (e) {}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  console.log(`Pinging Supabase at ${supabaseUrl}...`);
  try {
    // A simple query to any existing table keeps the database active
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      // If table doesn't exist or RLS blocks, that's fine, the API request still wakes up the DB.
      console.log('Received response from Supabase (DB is awake). Message:', error.message);
    } else {
      console.log('Successfully pinged Supabase! Project is active.');
    }
  } catch (err) {
    console.error('Failed to ping Supabase:', err.message);
  }
}

keepAlive();
