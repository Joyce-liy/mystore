import React, { useState } from 'react';
import { X, Plus, Check, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePacket } from '../contexts/PacketContext';
import { useCategory } from '../contexts/CategoryContext';
import '../styles/packets.css';

// S'affiche automatiquement (voir PacketsGrid) dès qu'un packet est sélectionné
// mais qu'aucune catégorie active ne lui correspond encore. Bloquante : on ne
// peut pas saisir d'article tant qu'une catégorie n'a pas été choisie ou créée.
const PacketCategoryModal = ({ onClose }) => {
  const { t } = useTranslation();
  const { currentPacket, clearPacket } = usePacket();
  const { availableCategories, selectCategory, loading, clearCategory } = useCategory();
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [saving, setSaving] = useState(false);

  if (!currentPacket) return null;

  const handlePick = async (nom) => {
    if (saving) return;
    setSaving(true);
    const selected = await selectCategory(nom);
    setSaving(false);
    if (selected && onClose) onClose();
  };

  const handleCustomConfirm = async () => {
    const nom = customValue.trim();
    if (!nom || saving) return;
    setSaving(true);
    const selected = await selectCategory(nom);
    setSaving(false);
    setShowCustom(false);
    setCustomValue('');
    if (selected && onClose) onClose();
  };

  return (
    <div className="packet-modal-overlay">
      <div className="packet-modal" onClick={e => e.stopPropagation()}>
        <div className="packet-modal-head">
          <h3>
            {t('category_choose_for_packet', {
              name: currentPacket.nom,
              defaultValue: `Catégorie pour "${currentPacket.nom}"`
            })}
          </h3>
          <button
            onClick={() => {
              clearCategory();
              clearPacket();
              onClose?.();
            }}
            title={t('sales_cancel')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="packet-modal-body">
          <p className="empty-msg" style={{ marginTop: 0 }}>
            {t('category_choose_help', 'Choisissez une catégorie existante ou créez-en une nouvelle pour ce packet.')}
          </p>

          {!showCustom ? (
            <>
              {loading ? (
                <div className="loader">{t('packets_loading')}</div>
              ) : (
                <div className="packets-grid">
                  {availableCategories.map(c => (
                    <div
                      key={c.id}
                      className="packet-card"
                      onClick={() => handlePick(c.nom)}
                      style={{ opacity: saving ? 0.6 : 1, pointerEvents: saving ? 'none' : 'auto' }}
                    >
                      <div className="packet-card-icon"><Tag size={20} /></div>
                      <h3>{c.nom}</h3>
                    </div>
                  ))}
                </div>
              )}
              <button className="packet-switcher-new" onClick={() => setShowCustom(true)} disabled={saving}>
                <Plus size={15} /> {t('category_new', 'Nouvelle catégorie')}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                autoFocus
                placeholder={t('category_new_placeholder', 'Nom de la catégorie')}
                value={customValue}
                onChange={e => setCustomValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCustomConfirm(); } }}
                style={{ flex: 1 }}
              />
              <button className="packet-btn-primary" onClick={handleCustomConfirm} disabled={saving}>
                <Check size={15} />
              </button>
              <button className="packet-btn-ghost" onClick={() => setShowCustom(false)}>
                {t('sales_cancel')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PacketCategoryModal;