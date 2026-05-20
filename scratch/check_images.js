const https = require('https');

const urls = [
  'https://drive.google.com/thumbnail?id=1DFaJNeUyqnzdAiJmZ7R_rDRCXhf4nvig&sz=w1000',
  'https://drive.google.com/thumbnail?id=1nsbhh59uK845nJFcIJuxIzm5hlMvJc0W&sz=w1000',
  'https://drive.google.com/thumbnail?id=1HjGLLeRGo64KkYL1mgh17Fc5VsrGqs-Q&sz=w1000' // Cow Ghee (working)
];

urls.forEach((url, i) => {
  https.get(url, (res) => {
    console.log(`URL ${i}: status = ${res.statusCode}`);
    if (res.headers.location) {
      console.log(`URL ${i}: redirect -> ${res.headers.location}`);
    }
  }).on('error', (e) => {
    console.error(`URL ${i} error: ${e.message}`);
  });
});
