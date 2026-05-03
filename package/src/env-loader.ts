/**
 * Environment loader
 * This module attempts to load environment variables from .env file
 * Works in both Node.js and Browser environments
 */

// Try to load from .env file in Node.js environments
if (typeof process !== "undefined" && process.env) {
  // In Node.js, if dotenv is available, it would have been loaded by the user's application
  // We'll just use what's already in process.env
  
  // If running in Node.js without dotenv, try to read from inline process.env
  // (This requires the user to set EPTA_API_URL in their .env or environment)
}

// Export a function to manually load environment variables
export function loadEnvironment(envVariables: Record<string, string>): void {
  for (const [key, value] of Object.entries(envVariables)) {
    if (typeof process !== "undefined" && process.env) {
      process.env[key] = value;
    }
    
    if (typeof globalThis !== "undefined") {
      (globalThis as any)[`__${key}__`] = value;
    }
  }
}
