// src/utils/notifications.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const sendAppNotification = async (toRole, title, message, type) => {
  try {
    // S'assurer que le message est déjà formaté avant l'envoi
    await addDoc(collection(db, "notifications"), {
      to: toRole,
      title: title,
      message: message, // Doit être "L'article Lait a été vendu" et non "... {name} ..."
      type: type,
      read: false,
      createdAt: serverTimestamp(),
    });
    console.log("Notification envoyée avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification:", error);
  }
};