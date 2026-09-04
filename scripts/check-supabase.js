const { createClient } = require('@supabase/supabase-js');
const client = createClient('https://fdpemolavetvusapcuek.supabase.co', 'sb_publishable_4o7htNVJGMhJM5CKqmcW_w_Axkngprq');

async function check() {
  const { data, error } = await client.from('work_orders').select('id, work_order_number, title, hotel_name');
  if (error) {
    console.error('Supabase error:', error);
    return;
  }
  console.log('Work orders count in Supabase:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log(JSON.stringify(data, null, 2));
  }
}
check();
