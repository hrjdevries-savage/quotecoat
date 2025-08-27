export function b64ToFile(base64: string, name: string, type = 'application/octet-stream'): File {
  const byteStr = atob(base64);
  const len = byteStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = byteStr.charCodeAt(i);
  return new File([bytes], name, { type });
}