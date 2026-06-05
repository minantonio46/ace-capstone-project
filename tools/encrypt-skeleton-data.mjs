import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAGIC = Buffer.from('SKEL1', 'ascii');
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, '..');
const sourceDir = path.join(projectDir, 'skeleton-source');
const outputDir = path.join(projectDir, 'src', 'main', 'resources', 'encrypted-skeleton');
const keyFile = path.join(projectDir, '.skeleton-encryption-key');

function decodeKey(encodedKey, source) {
  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) {
    throw new Error(`${source} must contain a Base64-encoded 32-byte key.`);
  }
  return key;
}

function loadKey() {
  const envKey = process.env.SKELETON_ENCRYPTION_KEY?.trim();
  if (envKey) {
    return decodeKey(envKey, 'SKELETON_ENCRYPTION_KEY');
  }

  if (!fs.existsSync(keyFile)) {
    const generatedKey = crypto.randomBytes(32).toString('base64');
    fs.writeFileSync(keyFile, `${generatedKey}\n`, { encoding: 'utf8', flag: 'wx' });
    console.log(`Created local key file: ${keyFile}`);
  }

  return decodeKey(fs.readFileSync(keyFile, 'utf8').trim(), keyFile);
}

function encryptJson(plainText, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, {
    authTagLength: TAG_LENGTH,
  });
  const ciphertext = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([MAGIC, iv, ciphertext, tag]);
}

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Source directory does not exist: ${sourceDir}`);
}

const jsonFiles = fs.readdirSync(sourceDir)
  .filter((name) => name.toLowerCase().endsWith('.json'))
  .sort();

if (jsonFiles.length === 0) {
  throw new Error(`No JSON files found in ${sourceDir}`);
}

const key = loadKey();
fs.mkdirSync(outputDir, { recursive: true });

for (const fileName of jsonFiles) {
  const inputPath = path.join(sourceDir, fileName);
  const plainText = fs.readFileSync(inputPath, 'utf8');

  JSON.parse(plainText);

  const outputName = `${path.basename(fileName, '.json')}.json.enc`;
  const outputPath = path.join(outputDir, outputName);
  fs.writeFileSync(outputPath, encryptJson(plainText, key));
  console.log(`Encrypted ${fileName} -> ${path.relative(projectDir, outputPath)}`);
}
