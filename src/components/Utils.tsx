import CryptoJS from 'crypto-js';
const secretKey = "d1b8c25a0bca82bfc5a923b8a0f3b4f93f8c5d7d3e3e2e7e18dbf9e3a839a8f4";

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
  