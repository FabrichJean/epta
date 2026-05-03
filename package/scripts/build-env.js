#!/usr/bin/env node

/**
 * Build script to inject environment variables into the compiled code
 * This reads from .env and creates env-config.ts with the actual values
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file
const envPath = path.join(__dirname, "..", ".env");
let envContent = "";

try {
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }
} catch (err) {
  console.warn("Warning: Could not read .env file");
}

// Parse .env file
const envVars = {};
const lines = envContent.split("\n");

for (const line of lines) {
  const trimmed = line.trim();
  
  // Skip comments and empty lines
  if (!trimmed || trimmed.startsWith("#")) {
    continue;
  }

  const [key, ...valueParts] = trimmed.split("=");
  if (key) {
    const value = valueParts.join("=").trim();
    // Remove quotes if present
    envVars[key.trim()] = value.replace(/^["']|["']$/g, "");
  }
}

// Create environment configuration code
const envConfig = `
/**
 * Auto-generated environment configuration
 * This file is generated at build time from .env
 */

export const ENV = {
  EPTA_API_URL: "${envVars.EPTA_API_URL || "http://localhost:3000/api"}",
};
`;

// Write to src/env-config.ts
const envConfigPath = path.join(__dirname, "..", "src", "env-config.ts");

try {
  fs.writeFileSync(envConfigPath, envConfig, "utf-8");
  console.log("✓ Environment configuration generated:", envConfigPath);
  console.log(`  EPTA_API_URL=${envVars.EPTA_API_URL || "http://localhost:3000/api"}`);
} catch (err) {
  console.error("Error writing env-config.ts:", err);
  process.exit(1);
}
