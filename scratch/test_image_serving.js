const http = require('http');

http.get('http://127.0.0.1:8000/assets/multifloral_honey.png', (res) => {
  console.log('multifloral_honey.png status code:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', (e) => {
  console.error('Error contacting local server:', e.message);
});

http.get('http://127.0.0.1:8000/assets/wild_forest_honey.png', (res) => {
  console.log('wild_forest_honey.png status code:', res.statusCode);
}).on('error', (e) => {
  console.error('Error contacting local server:', e.message);
});
