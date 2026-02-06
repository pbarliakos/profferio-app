const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware'); // ✅ ΝΕΟ

const app = express();

// ✅ Ρύθμιση Proxy: Ό,τι ξεκινάει από /api, στείλ' το στο Backend (5000)
app.use(
  '/api',
  createProxyMiddleware({
    target: 'http://localhost:5000', // Πού είναι το backend σου
    changeOrigin: true,
  })
);

// Δείχνουμε τον φάκελο build για τα στατικά αρχεία
app.use(express.static(path.join(__dirname, 'build')));

// Για οποιοδήποτε άλλο URL, στέλνουμε το React app
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Ξεκινάμε
app.listen(3000, '127.0.0.1', () => {
  console.log('Frontend is running on 127.0.0.1:3000');
});