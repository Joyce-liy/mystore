import React, { useState } from 'react';
import {
  HelpCircle,
  ShoppingCart,
  Package,
  Download,
  Moon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import '../styles/help.css';

const Help = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  const helpData = [
    {
      id: 1,
      icon: <ShoppingCart size={18} />,
      title: "Gestion des Ventes",
      content: "Pour enregistrer une vente, allez dans l'onglet 'Ventes'. Si vous êtes Admin, vous pouvez créer un nouvel article. Si vous êtes Vendeur, vous devez modifier un article existant 'En attente' pour y ajouter le prix de vente final."
    },
    {
      id: 2,
      icon: <Package size={18} />,
      title: "Suivi de l'Inventaire",
      content: "L'inventaire affiche vos produits, leur prix d'achat et le stock actuel. Utilisez les boutons (+) et (-) pour ajuster les quantités. Une icône orange apparaît quand le stock est inférieur à 5 unités."
    },
    {
      id: 3,
      icon: <Download size={18} />,
      title: "Exports Excel et PDF",
      content: "En bas de la page des Ventes, vous trouverez deux boutons. 'Excel' génère un tableur complet, tandis que 'PDF' crée un rapport visuel propre pour l'impression."
    },
    {
      id: 4,
      icon: <Moon size={18} />,
      title: "Mode Sombre / Clair",
      content: "Vous pouvez changer l'apparence du site en cliquant sur l'icône Soleil/Lune dans la barre en haut à droite. Votre choix est sauvegardé automatiquement."
    }
  ];

  return (
    <div className="help-page-container">
      <div className="help-header">
        <HelpCircle size={40} />
        <h1>Centre d'Aide & Support</h1>
        <p>Bienvenue sur votre assistant MyStore. Trouvez ici les réponses à vos questions.</p>
      </div>

      <div className="help-content">
        {helpData.map((item) => (
          <div key={item.id} className={`help-card ${openSection === item.id ? 'active' : ''}`}>
            <div className="help-card-header" onClick={() => toggleSection(item.id)}>
              <div className="title-wrapper">
                {item.icon}
                <span>{item.title}</span>
              </div>
              {openSection === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {openSection === item.id && (
              <div className="help-card-body">
                <p>{item.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Help;