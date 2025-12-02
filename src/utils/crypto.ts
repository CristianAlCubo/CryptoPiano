// @ts-expect-error - js-ascon no tiene tipos TypeScript
import JsAscon from 'js-ascon';
import { 
  DilithiumKeyPair, 
  DilithiumLevel,
  DilithiumPrivateKey,
  DilithiumPublicKey,
  DilithiumSignature
} from '@asanrom/dilithium';

// ====================================
// ========     CIFRADO        ========
// ====================================

export interface EncryptedData {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  tag: Uint8Array;
}

export interface PasswordEncryptedData {
  encryptedData: EncryptedData;
  salt: Uint8Array;
}

const KEY_LENGTH = 16;
const NONCE_LENGTH = 16;
const SALT_LENGTH = 16;
const INTEGRITY_MARKER = new TextEncoder().encode('CRYPTOPIANO_V1');

const getRandomUintArray = (length: number): Uint8Array => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(length));
  }
  throw new Error('crypto.getRandomValues is not available');
};

const encrypt = (
  key: Uint8Array,
  plaintext: Uint8Array,
  associatedData: string | Uint8Array = ''
): EncryptedData => {
  const nonce = getRandomUintArray(NONCE_LENGTH);
  const ad = typeof associatedData === 'string' 
    ? new TextEncoder().encode(associatedData)
    : associatedData;
  
  const ciphertextWithTag = JsAscon.encrypt(
    key,
    nonce,
    ad,
    plaintext,
    'Ascon-AEAD128'
  );
  
  const tag = ciphertextWithTag.slice(-16);
  const ciphertext = ciphertextWithTag.slice(0, -16);
  
  return { ciphertext, nonce, tag };
};

const decrypt = (
  key: Uint8Array,
  encryptedData: EncryptedData,
  associatedData: string | Uint8Array = ''
): Uint8Array | null => {
  try {
    const ad = typeof associatedData === 'string' 
      ? new TextEncoder().encode(associatedData)
      : associatedData;
    
    const ciphertextWithTag = JsAscon.concatByteArrays(encryptedData.ciphertext, encryptedData.tag);
    const result = JsAscon.decrypt(
      key,
      encryptedData.nonce,
      ad,
      ciphertextWithTag,
      'Ascon-AEAD128'
    );
    
    if (!result) {
      return null;
    }
    
    return result;
  } catch {
    return null;
  }
};

const deriveKeyFromPassword = (
  password: string,
  salt: Uint8Array
): Uint8Array => {
  const passwordBytes = new TextEncoder().encode(password);
  const combined = JsAscon.concatByteArrays(passwordBytes, salt);
  return JsAscon.hash(combined, 'Ascon-XOF128', KEY_LENGTH);
};

export const encryptWithPassword = (
  password: string,
  data: Uint8Array,
  associatedData: string | Uint8Array = ''
): PasswordEncryptedData => {
  const salt = getRandomUintArray(SALT_LENGTH);
  const key = deriveKeyFromPassword(password, salt);
  
  const dataWithMarker = JsAscon.concatByteArrays(INTEGRITY_MARKER, data);
  const encryptedData = encrypt(key, dataWithMarker, associatedData);
  
  return { encryptedData, salt };
};

export const decryptWithPassword = (
  password: string,
  encryptedData: EncryptedData,
  salt: Uint8Array,
  associatedData: string | Uint8Array = ''
): Uint8Array | null => {
  const key = deriveKeyFromPassword(password, salt);
  const decrypted = decrypt(key, encryptedData, associatedData);
  
  if (!decrypted || decrypted.length < INTEGRITY_MARKER.length) {
    return null;
  }
  
  const marker = decrypted.slice(0, INTEGRITY_MARKER.length);
  const isValid = marker.every((byte, index) => byte === INTEGRITY_MARKER[index]);
  
  if (!isValid) {
    return null;
  }
  
  return decrypted.slice(INTEGRITY_MARKER.length);
};

export const serializeEncryptedData = (data: PasswordEncryptedData): Uint8Array => {
  const { encryptedData, salt } = data;
  const ciphertextLength = encryptedData.ciphertext.length;
  
  const totalLength = 4 + SALT_LENGTH + NONCE_LENGTH + 16 + 4 + ciphertextLength;
  const result = new Uint8Array(totalLength);
  const view = new DataView(result.buffer);
  
  let offset = 0;
  
  view.setUint32(offset, SALT_LENGTH, true);
  offset += 4;
  
  result.set(salt, offset);
  offset += SALT_LENGTH;
  
  result.set(encryptedData.nonce, offset);
  offset += NONCE_LENGTH;
  
  result.set(encryptedData.tag, offset);
  offset += 16;
  
  view.setUint32(offset, ciphertextLength, true);
  offset += 4;
  
  result.set(encryptedData.ciphertext, offset);
  
  return result;
};

export const deserializeEncryptedData = (data: Uint8Array): PasswordEncryptedData | null => {
  try {
    const view = new DataView(data.buffer);
    let offset = 0;
    
    const saltLength = view.getUint32(offset, true);
    offset += 4;
    
    if (saltLength !== SALT_LENGTH) {
      return null;
    }
    
    const salt = data.slice(offset, offset + SALT_LENGTH);
    offset += SALT_LENGTH;
    
    const nonce = data.slice(offset, offset + NONCE_LENGTH);
    offset += NONCE_LENGTH;
    
    const tag = data.slice(offset, offset + 16);
    offset += 16;
    
    const ciphertextLength = view.getUint32(offset, true);
    offset += 4;
    
    if (offset + ciphertextLength > data.length) {
      return null;
    }
    
    const ciphertext = data.slice(offset, offset + ciphertextLength);
    
    return {
      encryptedData: { ciphertext, nonce, tag },
      salt
    };
  } catch {
    return null;
  }
};

// ====================================
// ========     FIRMA DIGITAL  ========
// ====================================

export interface DilithiumKeyPairData {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface DilithiumSignatureData {
  signature: Uint8Array;
  message: Uint8Array;
}

export type DilithiumSecurityLevel = 2 | 3 | 5;

const DEFAULT_DILITHIUM_LEVEL: DilithiumSecurityLevel = 3;

export const generateDilithiumKeyPair = (
  level: DilithiumSecurityLevel = DEFAULT_DILITHIUM_LEVEL
): DilithiumKeyPairData => {
  try {
    const dilithiumLevel = DilithiumLevel.get(level);
    const keyPair = DilithiumKeyPair.generate(dilithiumLevel);
    
    const publicKey = keyPair.getPublicKey().getBytes();
    const privateKey = keyPair.getPrivateKey().getBytes();
    
    return {
      publicKey,
      privateKey
    };
  } catch (error) {
    console.error('Error al generar par de claves Dilithium:', error);
    throw new Error('Error al generar par de claves Dilithium');
  }
};

export const signMessage = (
  message: Uint8Array,
  privateKeyBytes: Uint8Array,
  level: DilithiumSecurityLevel = DEFAULT_DILITHIUM_LEVEL
): Uint8Array => {
  try {
    const dilithiumLevel = DilithiumLevel.get(level);
    const privateKey = DilithiumPrivateKey.fromBytes(privateKeyBytes, dilithiumLevel);
    
    const signature = privateKey.sign(message);
    
    return signature.getBytes();
  } catch (error) {
    console.error('Error al firmar mensaje:', error);
    throw new Error('Error al firmar mensaje con Dilithium');
  }
};

export const verifySignature = (
  message: Uint8Array,
  signatureBytes: Uint8Array,
  publicKeyBytes: Uint8Array,
  level: DilithiumSecurityLevel = DEFAULT_DILITHIUM_LEVEL
): boolean => {
  try {
    const dilithiumLevel = DilithiumLevel.get(level);
    const publicKey = DilithiumPublicKey.fromBytes(publicKeyBytes, dilithiumLevel);
    const signature = DilithiumSignature.fromBytes(signatureBytes, dilithiumLevel);
    
    return publicKey.verifySignature(message, signature);
  } catch (error) {
    console.error('Error al verificar firma:', error);
    return false;
  }
};

export const serializeDilithiumKeyPair = (keyPair: DilithiumKeyPairData): Uint8Array => {
  const publicKeyLength = keyPair.publicKey.length;
  const privateKeyLength = keyPair.privateKey.length;
  
  const totalLength = 4 + publicKeyLength + 4 + privateKeyLength;
  const result = new Uint8Array(totalLength);
  const view = new DataView(result.buffer);
  
  let offset = 0;
  
  view.setUint32(offset, publicKeyLength, true);
  offset += 4;
  
  result.set(keyPair.publicKey, offset);
  offset += publicKeyLength;
  
  view.setUint32(offset, privateKeyLength, true);
  offset += 4;
  
  result.set(keyPair.privateKey, offset);
  
  return result;
};

export const deserializeDilithiumKeyPair = (data: Uint8Array): DilithiumKeyPairData | null => {
  try {
    const view = new DataView(data.buffer);
    let offset = 0;
    
    const publicKeyLength = view.getUint32(offset, true);
    offset += 4;
    
    if (offset + publicKeyLength > data.length) {
      return null;
    }
    
    const publicKey = data.slice(offset, offset + publicKeyLength);
    offset += publicKeyLength;
    
    const privateKeyLength = view.getUint32(offset, true);
    offset += 4;
    
    if (offset + privateKeyLength > data.length) {
      return null;
    }
    
    const privateKey = data.slice(offset, offset + privateKeyLength);
    
    return {
      publicKey,
      privateKey
    };
  } catch {
    return null;
  }
};

export const serializeDilithiumSignature = (signature: DilithiumSignatureData): Uint8Array => {
  const signatureLength = signature.signature.length;
  const messageLength = signature.message.length;
  
  const totalLength = 4 + signatureLength + 4 + messageLength;
  const result = new Uint8Array(totalLength);
  const view = new DataView(result.buffer);
  
  let offset = 0;
  
  view.setUint32(offset, signatureLength, true);
  offset += 4;
  
  result.set(signature.signature, offset);
  offset += signatureLength;
  
  view.setUint32(offset, messageLength, true);
  offset += 4;
  
  result.set(signature.message, offset);
  
  return result;
};

export const deserializeDilithiumSignature = (data: Uint8Array): DilithiumSignatureData | null => {
  try {
    const view = new DataView(data.buffer);
    let offset = 0;
    
    const signatureLength = view.getUint32(offset, true);
    offset += 4;
    
    if (offset + signatureLength > data.length) {
      return null;
    }
    
    const signature = data.slice(offset, offset + signatureLength);
    offset += signatureLength;
    
    const messageLength = view.getUint32(offset, true);
    offset += 4;
    
    if (offset + messageLength > data.length) {
      return null;
    }
    
    const message = data.slice(offset, offset + messageLength);
    
    return {
      signature,
      message
    };
  } catch {
    return null;
  }
};

// ====================================
// ========  MENSAJE FIRMADO    ========
// ====================================

export interface SignedMessageData {
  message: Uint8Array;
  signature: Uint8Array;
}

export const createSignedMessage = (
  message: Uint8Array,
  privateKeyBytes: Uint8Array,
  level: DilithiumSecurityLevel = DEFAULT_DILITHIUM_LEVEL
): SignedMessageData => {
  const signature = signMessage(message, privateKeyBytes, level);
  return {
    message,
    signature
  };
};

export const serializeSignedMessage = (signedMessage: SignedMessageData): Uint8Array => {
  const messageLength = signedMessage.message.length;
  const signatureLength = signedMessage.signature.length;
  
  const totalLength = 4 + messageLength + 4 + signatureLength;
  const result = new Uint8Array(totalLength);
  const view = new DataView(result.buffer);
  
  let offset = 0;
  
  view.setUint32(offset, messageLength, true);
  offset += 4;
  
  result.set(signedMessage.message, offset);
  offset += messageLength;
  
  view.setUint32(offset, signatureLength, true);
  offset += 4;
  
  result.set(signedMessage.signature, offset);
  
  return result;
};

export const deserializeSignedMessage = (data: Uint8Array): SignedMessageData | null => {
  try {
    const view = new DataView(data.buffer);
    let offset = 0;
    
    const messageLength = view.getUint32(offset, true);
    offset += 4;
    
    if (offset + messageLength > data.length) {
      return null;
    }
    
    const message = data.slice(offset, offset + messageLength);
    offset += messageLength;
    
    const signatureLength = view.getUint32(offset, true);
    offset += 4;
    
    if (offset + signatureLength > data.length) {
      return null;
    }
    
    const signature = data.slice(offset, offset + signatureLength);
    
    return {
      message,
      signature
    };
  } catch {
    return null;
  }
};