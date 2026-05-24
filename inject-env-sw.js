// inject-env-sw.js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Charger les variables du fichier .env
dotenv.config();

const swPath = path.resolve('dist/firebase-messaging-sw.js');

if (fs.existsSync(swPath)) {
  let content = fs.readFileSync(swPath, 'utf8');

  const replacements = {
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
    VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
    VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || ''
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    content = content.replaceAll(placeholder, value);
  });

  fs.writeFileSync(swPath, content);
  console.log('✅ Clés injectées avec succès dans le Service Worker (dist)!');
} else {
  console.error('❌ Service Worker non trouvé dans dist/');
}