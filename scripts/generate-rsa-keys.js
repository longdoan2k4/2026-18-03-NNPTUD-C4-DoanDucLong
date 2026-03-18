const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const keyDir = path.join(__dirname, '..', 'keys');
const privateKeyPath = path.join(keyDir, 'jwtRS256.key');
const publicKeyPath = path.join(keyDir, 'jwtRS256.key.pub');

if (!fs.existsSync(keyDir)) {
  fs.mkdirSync(keyDir, { recursive: true });
}

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

fs.writeFileSync(privateKeyPath, privateKey, { encoding: 'utf8' });
fs.writeFileSync(publicKeyPath, publicKey, { encoding: 'utf8' });

console.log('Generated RSA key pair:');
console.log(privateKeyPath);
console.log(publicKeyPath);
