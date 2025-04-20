import { Buffer } from 'buffer';
import forge from 'node-forge';

const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const buffer = Buffer.from(str, 'utf-8');
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

const arrayBufferToString = (buffer: ArrayBuffer): string => {
  return Buffer.from(buffer).toString('utf-8');
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const buffer = Buffer.from(base64, 'base64');
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  return Buffer.from(buffer).toString('base64');
};

const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateKeyPair = async (): Promise<{
  publicKey: string;
  privateKey: string;
}> => {
  try {
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 });
    
    const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
    const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);

    return {
      publicKey: forge.util.encode64(publicKey),
      privateKey: forge.util.encode64(privateKey),
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
};

export const importPublicKey = async (base64Key: string): Promise<forge.pki.rsa.PublicKey> => {
  try {
    const pem = forge.util.decode64(base64Key);
    return forge.pki.publicKeyFromPem(pem);
  } catch (error) {
    console.error('Error importing public key:', error);
    throw error;
  }
};

export const importPrivateKey = async (base64Key: string): Promise<forge.pki.rsa.PrivateKey> => {
  try {
    const pem = forge.util.decode64(base64Key);
    return forge.pki.privateKeyFromPem(pem);
  } catch (error) {
    console.error('Error importing private key:', error);
    throw error;
  }
};

const generateKeyFromPublicKey = (publicKey: string): string => {
  return publicKey.substring(0, 32).padEnd(32, '0');
};

export const encryptMessage = async (
  message: string,
  recipientPublicKey: string
): Promise<string> => {
  try {
    const publicKey = await importPublicKey(recipientPublicKey);
    
    // Convert message to bytes
    const messageBytes = forge.util.encodeUtf8(message);
    
    // Encrypt using RSA-OAEP
    const encrypted = publicKey.encrypt(messageBytes, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });
    
    return forge.util.encode64(encrypted);
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw error;
  }
};

export const decryptMessage = async (
  encryptedMessage: string,
  privateKey: string
): Promise<string> => {
  try {
    const privateKeyObj = await importPrivateKey(privateKey);
    const encrypted = forge.util.decode64(encryptedMessage);
    
    // Decrypt using RSA-OAEP
    const decrypted = privateKeyObj.decrypt(encrypted, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });
    
    // Convert bytes back to string
    return forge.util.decodeUtf8(decrypted);
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw error;
  }
}; 