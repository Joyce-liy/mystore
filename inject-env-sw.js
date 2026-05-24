// inject-env-sw.js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Charger les variables du fichier .env
dotenv.config();

const swPath = path.resolve('dist/firebase-messaging-sw.js');

if (fs.existsSync(swPath)) {
  let content = fs.readFileSync(swPath, 'utf8');

  // Liste des variables à remplacer
  const vars = [
    'AIzaSyDByqRfpCrJLYlUdGTjujTlmcNr83TLQvk',
    'mystore-4d100.firebaseapp.com',
    'mystore-4d100',
    'mystore-4d100.firebasestorage.app',
    '661291967193',
    '1:661291967193:web:668a6ffd38086488d214c8'
  ];
  

VITE_VAPID_PUBLIC_KEY=BNTTuYWr2cOV8Jc8-UpS4BlBQXqNaexTU_FWYR3gL9o0yy8Z8GBzysFaPKD1Yl0udl79PV8Vt17Hd3wkhw6L3mA

  vars.forEach(v => {
    // Remplace le placeholder par la vraie valeur de l'environnement
    content = content.replace(new RegExp(v, 'g'), process.env[v]);
  });

  fs.writeFileSync(swPath, content);
  console.log('✅ Clés injectées avec succès dans le Service Worker (dist)!');
} else {
  console.error('❌ Service Worker non trouvé dans dist/');
}