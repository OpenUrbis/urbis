const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// SSL Certs paths (relative to this script: ../)
const keyPath = path.join(__dirname, '../conta.urbis.prefeitura.sp.gov.br-key.pem');
const certPath = path.join(__dirname, '../conta.urbis.prefeitura.sp.gov.br.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('Error: SSL certificates not found in apps/accounts root.');
  console.error('Please generate them first (conta.urbis.prefeitura.sp.gov.br.pem and key).');
  process.exit(1);
}

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

// Configuration
// Default to redirect mode, but allow switching to proxy via args or env
const args = process.argv.slice(2);
const isProxyMode = true || process.env.PROXY_MODE === 'true' || args.includes('--proxy');
const MODE = isProxyMode ? 'proxy' : 'redirect';

const TARGET_HOST = 'localhost';
const TARGET_PORT = 4200;
const TARGET_URL = `http://${TARGET_HOST}:${TARGET_PORT}`;

const server = https.createServer(options, (req, res) => {
  if (MODE === 'proxy') {
    // Proxy request to target
    const proxyOptions = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${TARGET_HOST}:${TARGET_PORT}`, // Override Host header to please Dev Server
      },
    };

    const proxyReq = http.request(proxyOptions, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error(`[Proxy Error] ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Bad Gateway: Could not connect to target server.');
      }
    });

    req.pipe(proxyReq, { end: true });
    console.log(`[Proxy] ${req.method} https://conta.urbis.prefeitura.sp.gov.br${req.url} -> ${TARGET_URL}${req.url}`);

  } else {
    // Redirect to localhost:4200 preserving path and query
    const target = `${TARGET_URL}${req.url}`;
    console.log(`[Redirect] https://conta.urbis.prefeitura.sp.gov.br${req.url} -> ${target}`);
    
    res.writeHead(302, { 'Location': target });
    res.end();
  }
});

const PORT = 443;
server.listen(PORT, () => {
  console.log('---------------------------------------------------');
  console.log(`Secure Server running on https://conta.urbis.prefeitura.sp.gov.br`);
  console.log(`Mode: ${MODE.toUpperCase()}`);
  console.log(`Target: ${TARGET_URL}`);
  if (MODE === 'redirect') {
    console.log('Tip: Use --proxy argument or PROXY_MODE=true env to switch to proxy mode');
  }
  console.log('---------------------------------------------------');
});
