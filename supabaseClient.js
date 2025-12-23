const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dtvbtyaoahmqbdlsmchn.supabase.co';
const supabaseKey = 'sb_secret_Gbo94d0gFV4KGbHzJx5c9A_aZaGXWRy'; // Use secret key for server-side

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
