import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tag, Plus, Check, X, Layers } from 'lucide-react';
import { usePacket } from '../contexts/PacketContext';
import { useCategory } from '../contexts/CategoryContext';

const CAT_EMOJI = {
  chaussures:   '👟',
  habit:        '👕',
  electronique: '📱',
  accessoires:  '👜',
  sacs:         '🎒',
  sport:        '⚽',
};
const getEmoji = (nom) => CAT_EMOJI[(nom || '').toLowerCase()] || '🏷️';

const PacketCategoryModal = () => {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const { currentPacket, clearPacket } = usePacket();
  const { availableCategories, selectCategory, clearCategory, loading } = useCategory();

  const [showNew,   setShowNew]   = useState(false);
  const [newNom,    setNewNom]    = useState('');
  const [selecting, setSelecting] = useState(null);

  // Sélectionner une catégorie précise → navigate /sales filtré
  const handleSelect = async (nom) => {
    if (selecting) return;
    setSelecting(nom);
    await selectCategory(nom);
    setSelecting(null);
    navigate('/sales');
  };

  // ← "Tous les articles" : clearCategory → navigate /sales sans filtre catégorie
  const handleAllArticles = () => {
    clearCategory();   // currentCategory = null → Sales montre tout le packet
    navigate('/sales');
  };

  const handleNewConfirm = async () => {
    const nom = newNom.trim();
    if (!nom || selecting) return;
    setSelecting('__new__');
    await selectCategory(nom);
    setSelecting(null);
    setShowNew(false);
    setNewNom('');
    navigate('/sales');
  };

  /* styles réutilisés */
  const cardBase = {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px',
    border: '1.5px solid var(--border, rgba(0,0,0,0.08))',
    borderRadius: 12, cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.12s', width: '100%', fontFamily: 'inherit',
    background: 'var(--bg-subtle, #f8fafc)',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card, #fff)',
        borderRadius: 20, width: '100%', maxWidth: 480,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
        border: '1px solid var(--border, rgba(0,0,0,0.07))',
        animation: 'catModalIn 0.18s ease',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-heading, #0f172a)' }}>
                {t('category_choose_title', `Catégorie pour "${currentPacket?.nom}"`)}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                {t('category_choose_sub', 'Choisissez une catégorie existante ou créez-en une nouvelle pour ce packet.')}
              </p>
            </div>
            <button
              onClick={() => clearPacket()}
              style={{
                background: 'rgba(0,0,0,0.05)', border: 'none',
                borderRadius: 8, padding: 6, cursor: 'pointer',
                color: '#64748b', display: 'flex', alignItems: 'center', flexShrink: 0,
              }}
              title="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Liste ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* ── "Tous les articles" en premier ── */}
            <button
              onClick={handleAllArticles}
              style={{
                ...cardBase,
                background: 'rgba(100,116,139,0.06)',
                border: '1.5px solid rgba(100,116,139,0.18)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#64748b';
                e.currentTarget.style.background = 'rgba(100,116,139,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(100,116,139,0.18)';
                e.currentTarget.style.background = 'rgba(100,116,139,0.06)';
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'rgba(100,116,139,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Layers size={20} color="#64748b" />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading, #0f172a)' }}>
                  {t('category_all', 'Tous les articles')}
                </span>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {t('category_all_sub', 'Voir tous les articles de ce packet')}
                </div>
              </div>
            </button>

            {/* Séparateur */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              margin: '2px 0', color: '#cbd5e1', fontSize: 11,
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              {t('category_or_choose', 'ou choisir une catégorie')}
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* ── Catégories disponibles ── */}
            {loading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>Chargement…</p>
            ) : (
              availableCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleSelect(cat.nom)}
                  disabled={!!selecting}
                  style={{
                    ...cardBase,
                    background: selecting === cat.nom ? 'rgba(59,110,248,0.1)' : 'var(--bg-subtle, #f8fafc)',
                    border: selecting === cat.nom
                      ? '1.5px solid #3b6ef8'
                      : '1.5px solid var(--border, rgba(0,0,0,0.08))',
                    cursor: selecting ? 'wait' : 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!selecting) {
                      e.currentTarget.style.borderColor = '#3b6ef8';
                      e.currentTarget.style.background = 'rgba(59,110,248,0.05)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (selecting !== cat.nom) {
                      e.currentTarget.style.borderColor = 'var(--border, rgba(0,0,0,0.08))';
                      e.currentTarget.style.background = 'var(--bg-subtle, #f8fafc)';
                    }
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(59,110,248,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    {getEmoji(cat.nom)}
                  </div>
                  <span style={{
                    flex: 1, fontSize: 15, fontWeight: 600,
                    color: 'var(--text-heading, #0f172a)', textTransform: 'capitalize',
                  }}>
                    {cat.nom}
                  </span>
                  {selecting === cat.nom && (
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2px solid rgba(59,110,248,0.2)',
                      borderTopColor: '#3b6ef8',
                      animation: 'catSpin 0.6s linear infinite',
                      flexShrink: 0,
                    }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Nouvelle catégorie ── */}
        <div style={{
          padding: '12px 16px 16px',
          borderTop: '1px solid var(--border, rgba(0,0,0,0.08))',
          flexShrink: 0,
        }}>
          {!showNew ? (
            <button
              onClick={() => setShowNew(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 7, width: '100%', padding: '11px',
                background: 'none',
                border: '1.5px dashed rgba(59,110,248,0.35)',
                borderRadius: 12, cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: '#3b6ef8',
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,110,248,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Plus size={15} /> {t('category_new', 'Nouvelle catégorie')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                autoFocus type="text" value={newNom}
                placeholder={t('category_new_placeholder', 'Ex: Parfums, Bijoux…')}
                onChange={e => setNewNom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNewConfirm()}
                style={{
                  flex: 1, border: '1.5px solid #3b6ef8', borderRadius: 9,
                  padding: '9px 12px', fontSize: 14, fontFamily: 'inherit',
                  background: 'var(--bg-subtle, #f8fafc)',
                  color: 'var(--text-main, #1e293b)', outline: 'none',
                  boxShadow: '0 0 0 3px rgba(59,110,248,0.1)',
                }}
              />
              <button
                onClick={handleNewConfirm}
                disabled={!newNom.trim() || !!selecting}
                style={{
                  background: '#3b6ef8', color: '#fff', border: 'none',
                  borderRadius: 9, padding: '9px 14px', cursor: 'pointer',
                  fontSize: 14, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5,
                  opacity: !newNom.trim() ? 0.5 : 1,
                }}
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => { setShowNew(false); setNewNom(''); }}
                style={{
                  background: 'rgba(0,0,0,0.06)', color: '#64748b',
                  border: 'none', borderRadius: 9, padding: '9px 12px',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes catModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes catSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PacketCategoryModal;