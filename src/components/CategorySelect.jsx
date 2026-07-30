import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategory } from '../contexts/CategoryContext';

// Dropdown réutilisable de sélection de catégorie, scopé au packet actif
// (via useCategory -> availableCategories). Inclut une option "Autre..."
// qui ouvre un champ texte libre ; la nouvelle valeur est mémorisée dans
// Firestore pour ce packet via selectCategory, donc elle réapparaîtra dans
// la liste la prochaine fois.
//
// Usage : <CategorySelect value={nomCategorie} onChange={setNomCategorie} />
// Si onSelect n'est pas fourni, le composant appelle selectCategory() lui-même
// (ce qui rend aussi la catégorie "active" globalement). Pour juste changer
// la catégorie d'UN article sans toucher à currentCategory, passe onChange
// seul et gère toi-même la sauvegarde de l'article.
const CategorySelect = ({ value, onChange, disabled }) => {
  const { t } = useTranslation();
  const { availableCategories, selectCategory } = useCategory();
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const isKnown = !value || availableCategories.some(c => c.nom.toLowerCase() === value.toLowerCase());

  const handleSelectChange = (e) => {
    const v = e.target.value;
    if (v === '__other__') {
      setShowCustom(true);
      setCustomValue('');
    } else {
      setShowCustom(false);
      onChange(v);
    }
  };

  const handleCustomConfirm = async () => {
    const nom = customValue.trim();
    if (!nom) return;
    // Crée la catégorie pour le packet actif si elle n'existe pas encore
    await selectCategory(nom);
    onChange(nom);
    setShowCustom(false);
  };

  if (showCustom) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          autoFocus
          placeholder={t('category_new_placeholder', 'Nouvelle catégorie')}
          value={customValue}
          onChange={e => setCustomValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCustomConfirm(); } }}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={handleCustomConfirm}>{t('category_add', 'Ajouter')}</button>
        <button type="button" onClick={() => setShowCustom(false)}>{t('sales_cancel')}</button>
      </div>
    );
  }

  return (
    <select value={isKnown ? (value || '') : '__other__'} onChange={handleSelectChange} disabled={disabled}>
      <option value="">{t('category_none', 'Aucune catégorie')}</option>
      {availableCategories.map(c => (
        <option key={c.id} value={c.nom}>{c.nom}</option>
      ))}
      {!isKnown && <option value={value}>{value}</option>}
      <option value="__other__">{t('category_other', 'Autre...')}</option>
    </select>
  );
};

export default CategorySelect;