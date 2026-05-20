const https = require('https');

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dHJldXNlcHhpbG5mcWZmd2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzA5OTUsImV4cCI6MjA5MDQ0Njk5NX0.AXaOi_ax6esifM7DzwVjNXQrm3XLNPnzT_0yQWm6ahY';

const options = {
  hostname: 'jztreusepxilnfqffwka.supabase.co',
  path: '/rest/v1/products?select=id,name,image_url,image_url_2,image_url_3&name=ilike.*honey*',
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
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.error(e);
    }
  });
});
