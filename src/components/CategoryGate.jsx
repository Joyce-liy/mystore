import React from 'react';
import { usePacket } from '../contexts/PacketContext';
import { useCategory } from '../contexts/CategoryContext';
import PacketCategoryModal from '../pages/PacketCategoryModal';

// À monter UNE FOIS au niveau racine de l'app (dans App.jsx, à l'intérieur des
// deux providers), pas à l'intérieur d'une page précise. Comme currentPacket
// et currentCategory sont globaux (Context + localStorage), ce composant
// détecte automatiquement le besoin de choisir une catégorie, peu importe
// que le packet ait été choisi depuis PacketsGrid, PacketSwitcherModal, ou
// n'importe quel autre point d'entrée futur.
const CategoryGate = () => {
  const { currentPacket } = usePacket();
  const { currentCategory } = useCategory();

  if (currentPacket && !currentCategory) {
    return <PacketCategoryModal />;
  }
  return null;
};

export default CategoryGate;