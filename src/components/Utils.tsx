import CryptoJS from 'crypto-js';
const secretKey = import.meta.env.SECRET_KEY;

export function encrypt(data: string) {
  return CryptoJS.AES.encrypt(data, secretKey).toString();
}
export function decrypt(encrypted: string) {
  const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
export function customThrottle<T>(
    fn: (...args: any[]) => T,
    delay: number,
    validationFn: (...args: any[]) => boolean,
    validationDelay: number
  ): (...args: any[]) => T {
    let lastCallTime = 0;
    let lastResult: T;
    let lastArgs: any[] = [];
  
    return function (...args: any[]): T {
      const now = Date.now();
      const isValidation = validationFn(...args);
      const currentDelay = isValidation ? validationDelay : delay;
  
      if (now - lastCallTime >= currentDelay || !lastResult) {
        lastCallTime = now;
        lastArgs = args;
        lastResult = fn(...args);
      }
  
      return lastResult;
    };
  }
  