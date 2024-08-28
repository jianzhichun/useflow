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
  