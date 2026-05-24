// src/utils/fcm.js
import { getToken } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, messaging } from '../firebase/firebaseConfig';

export const setupNotifications = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, { 
        vapidKey: import.meta.env.VITE_VAPID_PUBLIC_KEY 
      });

      if (token) {
        // On utilise updateDoc pour ajouter le token au profil utilisateur
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { fcmToken: token });
        console.log("Token FCM enregistré !");
      }
    }
  } catch (error) {
    console.error("Erreur lors de la configuration FCM:", error);
  }
};