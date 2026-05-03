/**
 * Configuration module for EPTA Package
 * Uses env-config.ts which is generated at build time from .env
 */

import { ENV } from "./env-config";

// Load environment configuration
const getConfig = () => {
  const config = {
    // API URL from generated env-config (or fallback)
    apiUrl: ENV.EPTA_API_URL || "http://localhost:3000/api",
  };

  return config;
};

export const config = getConfig();

/**
 * Get the configured API URL
 * This is the default URL used by EptaApp if no URL is explicitly provided
 */
export function getDefaultApiUrl(): string {
  return config.apiUrl;
}

/**
 * Override the default API URL
 */
export function setDefaultApiUrl(url: string): void {
  (config as any).apiUrl = url;
}
