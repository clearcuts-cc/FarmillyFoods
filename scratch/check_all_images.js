const https = require('https');
const url = require('url');

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dHJldXNlcHhpbG5mcWZmd2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzA5OTUsImV4cCI6MjA5MDQ0Njk5NX0.AXaOi_ax6esifM7DzwVjNXQrm3XLNPnzT_0yQWm6ahY';

const options = {
  hostname: 'jztreusepxilnfqffwka.supabase.co',
  path: '/rest/v1/products?select=id,name,image_url,is_active&is_active=eq.true',
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
      checkImages(json);
    } catch (e) {
      console.log("Error parsing JSON: " + e.message);
    }
  });
});

function checkUrl(targetUrl, productName, callback) {
  if (!targetUrl || targetUrl.startsWith('assets/') || !targetUrl.startsWith('http')) {
    callback(productName, targetUrl, 'local/asset');
    return;
  }

  const parsed = url.parse(targetUrl);
  https.get({
    hostname: parsed.hostname,
    path: parsed.path,
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  }, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      // Follow one redirect
      const redirectUrl = res.headers.location;
      if (redirectUrl.includes('ServiceLogin') || redirectUrl.includes('accounts.google.com')) {
        callback(productName, targetUrl, 'restricted (redirects to google login)');
      } else {
        const parsedRedirect = url.parse(redirectUrl);
        https.get({
          hostname: parsedRedirect.hostname,
          path: parsedRedirect.path,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        }, (res2) => {
          if (res2.statusCode === 302 || res2.statusCode === 301) {
            const redirectUrl2 = res2.headers.location;
            if (redirectUrl2.includes('ServiceLogin') || redirectUrl2.includes('accounts.google.com')) {
              callback(productName, targetUrl, 'restricted (redirects to google login)');
            } else {
              callback(productName, targetUrl, `redirected twice to ${redirectUrl2.substring(0, 50)}...`);
            }
          } else {
            callback(productName, targetUrl, `status ${res2.statusCode} (${res2.headers['content-type']})`);
          }
        }).on('error', (e) => {
          callback(productName, targetUrl, `error following redirect: ${e.message}`);
        });
      }
    } else {
      callback(productName, targetUrl, `status ${res.statusCode} (${res.headers['content-type']})`);
    }
  }).on('error', (e) => {
    callback(productName, targetUrl, `error: ${e.message}`);
  });
}

function checkImages(products) {
  let pending = products.length;
  products.forEach(p => {
    checkUrl(p.image_url, p.name, (name, imgUrl, status) => {
      console.log(`Product: ${name}`);
      console.log(`  URL: ${imgUrl}`);
      console.log(`  Status: ${status}`);
      console.log('-------------------------------');
      pending--;
      if (pending === 0) {
        console.log("All images checked.");
      }
    });
  });
}
