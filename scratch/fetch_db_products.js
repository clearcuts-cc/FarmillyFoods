const https = require('https');

const supabaseUrl = 'https://jztreusepxilnfqffwka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dHJldXNlcHhpbG5mcWZmd2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzA5OTUsImV4cCI6MjA5MDQ0Njk5NX0.AXaOi_ax6esifM7DzwVjNXQrm3XLNPnzT_0yQWm6ahY';

const options = {
  hostname: 'jztreusepxilnfqffwka.supabase.co',
  path: '/rest/v1/products?select=id,name,category_id,product_variants(id,label,price,quantity_kg)&is_active=eq.true&name=ilike.*custom*',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log("Error parsing JSON: " + e.message);
      console.log(data);
    }
  });
}).on('error', (err) => {
  console.error("HTTP error: " + err.message);
});
