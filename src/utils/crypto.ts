// @ts-expect-error - js-ascon no tiene tipos TypeScript
import JsAscon from 'js-ascon';

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