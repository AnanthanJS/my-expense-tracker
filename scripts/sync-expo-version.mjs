import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, 'package.json');
const appJsonPath = path.join(rootDir, 'app.json');
const nextVersion = process.argv[2];

if (!nextVersion) {
  console.error('Usage: npm run sync:expo-version -- <semver>');
  process.exit(1);
}

const updateJsonFile = (filePath, mutator) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  mutator(parsed);
  fs.writeFileSync(filePath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
};

updateJsonFile(packageJsonPath, (pkg) => {
  pkg.version = nextVersion;
});

updateJsonFile(appJsonPath, (appConfig) => {
  if (!appConfig.expo) {
    throw new Error('Expected app.json to contain an expo key.');
  }

  appConfig.expo.version = nextVersion;
});

console.log(`Synced package.json and app.json to version ${nextVersion}`);
