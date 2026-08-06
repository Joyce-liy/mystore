import React from 'react';
import { usePacket } from '../contexts/PacketContext';
import { useCategory } from '../contexts/CategoryContext';
import PacketCategoryModal from '../pages/PacketCategoryModal';

// Monté UNE FOIS dans App.jsx à l'intérieur des deux providers.
// Détecte automatiquement quand un packet est actif sans catégorie
// et affiche la modale de choix — qui navigue vers /sales après sélection.
//
// NOTE : `currentCategory` vaut soit null (pas encore décidé → modale),
// soit un objet { nom, id, packetId } pour une catégorie précise,
// soit un objet { isAll: true, ... } pour "Tous les articles".
// Les deux derniers cas sont truthy, donc la modale ne s'affiche pas.
const CategoryGate = () => {
  const { currentPacket } = usePacket();
  const { currentCategory } = useCategory();

  if (currentPacket && !currentCategory) {
    return <PacketCategoryModal />;
  }
  return null;
};

export default CategoryGate;