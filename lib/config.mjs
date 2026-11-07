import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dotenvPath = path.join(ROOT, '.env');
if (fs.existsSync(dotenvPath)) {
  for (const line of fs.readFileSync(dotenvPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      let value = match[2];
      if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  }
}
export const config = {
  port: Number(process.env.PORT || '3100'),
  host: process.env.HOST || '127.0.0.1',
  paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
  paypalSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  negativeTesting: process.env.ENABLE_NEGATIVE_TESTING === 'true',
  aiKey: process.env.OPENAI_API_KEY || '',
  aiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  chromePath: process.env.CHROME_PATH || '',
};
export const paypalConfigured = () => Boolean(config.paypalClientId && config.paypalSecret);
export const aiConfigured = () => Boolean(config.aiKey);
export const isLoopback = host => ['127.0.0.1', 'localhost', '::1'].includes(host);
