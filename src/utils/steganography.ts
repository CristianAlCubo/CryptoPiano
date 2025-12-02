export const embedMessageInWav = async (wavBlob: Blob, message: string | Uint8Array): Promise<Blob> => {
  const arrayBuffer = await wavBlob.arrayBuffer();
  const view = new DataView(arrayBuffer);
  
  const messageBytes = typeof message === 'string' 
    ? new TextEncoder().encode(message) 
    : message;
  const messageLength = messageBytes.length;
  
  if (messageLength === 0) {
    return wavBlob;
  }
  
  const dataStartOffset = 44;
  const maxDataSize = (arrayBuffer.byteLength - dataStartOffset) / 2;
  const requiredSamples = messageLength * 8 + 32;
  
  if (requiredSamples > maxDataSize) {
    throw new Error('El mensaje es demasiado largo para el audio disponible');
  }
  
  let sampleOffset = dataStartOffset;
  
  const writeLength = (length: number) => {
    for (let i = 0; i < 32; i++) {
      const sample = view.getInt16(sampleOffset, true);
      const bit = (length >> i) & 1;
      const modifiedSample = (sample & 0xFFFE) | bit;
      view.setInt16(sampleOffset, modifiedSample, true);
      sampleOffset += 2;
    }
  };
  
  writeLength(messageLength);
  
  for (let byteIndex = 0; byteIndex < messageLength; byteIndex++) {
    const byte = messageBytes[byteIndex];
    for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
      const sample = view.getInt16(sampleOffset, true);
      const bit = (byte >> bitIndex) & 1;
      const modifiedSample = (sample & 0xFFFE) | bit;
      view.setInt16(sampleOffset, modifiedSample, true);
      sampleOffset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

export const extractMessageFromWav = async (wavBlob: Blob, asBytes: boolean = false): Promise<string | Uint8Array | null> => {
  const arrayBuffer = await wavBlob.arrayBuffer();
  const view = new DataView(arrayBuffer);
  
  const dataStartOffset = 44;
  let sampleOffset = dataStartOffset;
  
  const readLength = (): number => {
    let length = 0;
    for (let i = 0; i < 32; i++) {
      const sample = view.getInt16(sampleOffset, true);
      const bit = sample & 1;
      length |= (bit << i);
      sampleOffset += 2;
    }
    return length;
  };
  
  const messageLength = readLength();
  
  if (messageLength === 0 || messageLength > 1000000) {
    return null;
  }
  
  const messageBytes = new Uint8Array(messageLength);
  
  for (let byteIndex = 0; byteIndex < messageLength; byteIndex++) {
    let byte = 0;
    for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
      const sample = view.getInt16(sampleOffset, true);
      const bit = sample & 1;
      byte |= (bit << bitIndex);
      sampleOffset += 2;
    }
    messageBytes[byteIndex] = byte;
  }
  
  if (asBytes) {
    return messageBytes;
  }
  
  try {
    return new TextDecoder().decode(messageBytes);
  } catch {
    return null;
  }
};

