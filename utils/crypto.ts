import { Buffer } from 'buffer';

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
    const publicKey = generateRandomString(32);
    
    const privateKey = generateRandomString(32);

    return { publicKey, privateKey };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
};

export const importPublicKey = async (base64Key: string): Promise<string> => {
  try {
    return base64Key;
  } catch (error) {
    console.error('Error importing public key:', error);
    throw error;
  }
};

export const importPrivateKey = async (base64Key: string): Promise<string> => {
  try {
    return base64Key;
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
    const messageBuffer = stringToArrayBuffer(message);
    const keyBuffer = stringToArrayBuffer(recipientPublicKey);
    
    const encryptedBuffer = new ArrayBuffer(messageBuffer.byteLength);
    const encryptedView = new Uint8Array(encryptedBuffer);
    const messageView = new Uint8Array(messageBuffer);
    const keyView = new Uint8Array(keyBuffer);
    
    for (let i = 0; i < messageBuffer.byteLength; i++) {
      const keyByte = keyView[i % keyBuffer.byteLength];
      const messageByte = messageView[i];
      
      let encryptedByte = messageByte ^ keyByte;
      
      encryptedByte = (encryptedByte + keyByte) % 256;
      
      encryptedView[i] = encryptedByte;
    }
    
    return arrayBufferToBase64(encryptedBuffer);
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
    const encryptedBuffer = base64ToArrayBuffer(encryptedMessage);
    const keyBuffer = stringToArrayBuffer(privateKey);
    
    const decryptedBuffer = new ArrayBuffer(encryptedBuffer.byteLength);
    const decryptedView = new Uint8Array(decryptedBuffer);
    const encryptedView = new Uint8Array(encryptedBuffer);
    const keyView = new Uint8Array(keyBuffer);
    
    for (let i = 0; i < encryptedBuffer.byteLength; i++) {
      const keyByte = keyView[i % keyBuffer.byteLength];
      const encryptedByte = encryptedView[i];
      
      let decryptedByte = (encryptedByte - keyByte + 256) % 256;
      
      decryptedByte = decryptedByte ^ keyByte;
      
      decryptedView[i] = decryptedByte;
    }
    
    return arrayBufferToString(decryptedBuffer);
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw error;
  }
}; 