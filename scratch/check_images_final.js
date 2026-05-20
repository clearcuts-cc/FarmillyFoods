const https = require('https');
const url = require('url');

const urls = [
  'https://drive.google.com/thumbnail?id=1DFaJNeUyqnzdAiJmZ7R_rDRCXhf4nvig&sz=w1000',
  'https://drive.google.com/thumbnail?id=1nsbhh59uK845nJFcIJuxIzm5hlMvJc0W&sz=w1000',
  'https://drive.google.com/thumbnail?id=1HjGLLeRGo64KkYL1mgh17Fc5VsrGqs-Q&sz=w1000'
];

function checkUrl(targetUrl, index) {
  const parsed = url.parse(targetUrl);
  https.get({
    hostname: parsed.hostname,
    path: parsed.path,
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  }, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      console.log(`URL ${index} redirected to ${res.headers.location}`);
      checkUrl(res.headers.location, index);
    } else {
      console.log(`URL ${index} finalized with status ${res.statusCode}, content-type: ${res.headers['content-type']}`);
    }
  }).on('error', (e) => {
    console.error(`URL ${index} error: ${e.message}`);
  });
}

urls.forEach((u, i) => checkUrl(u, i));
