import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { usePacket } from './PacketContext';
import PacketCategoryModal from '../pages/PacketCategoryModal';

const STORAGE_KEY = 'ms-current-category';

// Suggestions par défaut, proposées pour n'importe quel packet tant qu'elles
// n'ont pas déjà été créées dans Firestore pour ce packet précis.
export const DEFAULT_CATEGORIES = ['chaussures', 'habit', 'electronique'];

const CategoryContext = createContext(null);

// IMPORTANT : CategoryProvider doit être imbriqué à L'INTÉRIEUR de PacketProvider,
// car la catégorie active est un sous-ensemble du packet actuel.
export const CategoryProvider = ({ children }) => {
  const { currentPacket } = usePacket();
  const packetId = currentPacket?.id || null;

  const [currentCategory, setCurrentCategoryState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [packetCategories, setPacketCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Si on change de packet (ou qu'on revient à la vue globale), la catégorie
  // active n'est conservée que si elle appartient bien au nouveau packet.
  // → remise à null : c'est CE null (et lui seul) qui signifie "pas encore
  //   décidé" et qui doit rouvrir la modale via CategoryGate.
  useEffect(() => {
    setCurrentCategoryState(prev => {
      if (!packetId) return null;
      return (prev && prev.packetId === packetId) ? prev : null;
    });
  }, [packetId]);

  useEffect(() => {
    if (currentCategory) localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCategory));
    else localStorage.removeItem(STORAGE_KEY);
  }, [currentCategory]);

  // Catégories déjà créées pour le packet courant (pas d'orderBy combiné pour
  // éviter un index composite Firestore ; tri fait côté client)
  useEffect(() => {
    if (!packetId) { setPacketCategories([]); setLoading(false); return; }
    setLoading(true);
    const unsub = onSnapshot(
      query(collection(db, 'categories'), where('packetId', '==', packetId)),
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
        setPacketCategories(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [packetId]);

  // Fusion : catégories déjà créées pour ce packet + suggestions par défaut
  // (sans doublon, insensible à la casse)
  const availableCategories = useMemo(() => {
    const seen = new Set();
    const list = [];
    packetCategories.forEach(c => {
      const key = (c.nom || '').toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); list.push(c); }
    });
    DEFAULT_CATEGORIES.forEach(nom => {
      const key = nom.toLowerCase();
      if (!seen.has(key)) { seen.add(key); list.push({ id: `default-${nom}`, nom, isDefault: true }); }
    });
    return list;
  }, [packetCategories]);

  // Choisit une catégorie pour le packet courant. La crée dans Firestore si
  // elle n'existe pas encore pour ce packet (cas des suggestions par défaut
  // ou d'un nom tapé manuellement).
  const selectCategory = async (nomRaw) => {
    if (!packetId) return null;
    const nom = (nomRaw || '').trim();
    if (!nom) return null;

    const existing = packetCategories.find(c => c.nom.toLowerCase() === nom.toLowerCase());
    let id = existing?.id;

    if (!existing) {
      try {
        const ref = await addDoc(collection(db, 'categories'), {
          nom,
          packetId,
          createdBy: auth.currentUser?.uid || null,
          createdAt: serverTimestamp()
        });
        id = ref.id;
      } catch (err) {
        console.error('Erreur création catégorie:', err);
        return null;
      }
    }

    const cat = { id, nom, packetId, isAll: false };
    setCurrentCategoryState(cat);
    return cat;
  };

  // "Tous les articles" : on met un OBJET truthy avec isAll=true, PAS null.
  // Pourquoi : CategoryGate affiche la modale dès que
  // `currentPacket && !currentCategory` est vrai. Si on mettait null ici,
  // la modale se rouvrirait instantanément après le clic sur
  // "Tous les articles", empêchant toute navigation visible vers /sales.
  // Ce marqueur permet à Sales.jsx de savoir qu'il ne doit appliquer AUCUN
  // filtre de catégorie, tout en restant "décidé" pour le Gate.
  const clearCategory = () => {
    if (!packetId) { setCurrentCategoryState(null); return; }
    setCurrentCategoryState({ id: null, nom: null, packetId, isAll: true });
  };

  // resetCategory : remet VRAIMENT à null, pour forcer la réouverture de la
  // modale de choix (ex: bouton "Changer" dans PacketsGrid). Ne pas
  // confondre avec clearCategory().
  const resetCategory = () => setCurrentCategoryState(null);

  return (
    <CategoryContext.Provider value={{
      currentCategory,
      selectCategory,
      clearCategory,
      resetCategory,
      availableCategories,
      loading
    }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const CategoryGate = () => {
  const { currentPacket } = usePacket();
  const { currentCategory } = useCategory();

  if (currentPacket && !currentCategory) {
    return <PacketCategoryModal />;
  }

  return null;
};

export const useCategory = () => {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error("useCategory doit être utilisé à l'intérieur d'un CategoryProvider");
  return ctx;
};