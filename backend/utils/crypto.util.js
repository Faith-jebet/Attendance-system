const crypto = require('crypto');


function generateKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048
  });

  return {
    publicKey: publicKey.export({ type: 'pkcs1', format: 'pem' }),
    privateKey: privateKey.export({ type: 'pkcs1', format: 'pem' })
  };
}


function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Sign a hash using a private key
 */
function signHash(hash, privateKey) {
  if (!privateKey) throw new Error('Private key required for signing');
  const sign = crypto.createSign('SHA256');
  sign.update(hash);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

/**
 * Verify a signature using a public key
 */
function verifySignature(hash, signature, publicKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(hash);
  verify.end();
  return verify.verify(publicKey, signature, 'base64');
}

module.exports = {
  generateKeys,
  hashData,
  signHash,
  verifySignature
};
