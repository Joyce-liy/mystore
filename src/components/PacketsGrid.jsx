import React, { useState, useEffect, useMemo } from 'react';
import { Package, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { usePacket } from '../contexts/PacketContext';
import { useCategory } from '../contexts/CategoryContext';
import PacketOrphanAssignModal from '../pages/PacketOrphanAssignModal';
import '../styles/packets.css';

const PacketsGrid = () => {
  const { t }      = useTranslation();
  const navigate   = useNavigate();
  const { currentPacket, selectPacket } = usePacket();
  // ← AJOUT : resetCategory (distinct de clearCategory, voir CategoryContext.jsx)
  const { currentCategory, clearCategory, selectCategory, resetCategory } = useCategory();
  const [packets,    setPackets]    = useState([]);
  const [sales,      setSales]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showAssign, setShowAssign] = useState(false);

  useEffect(() => {
    const unsubP = onSnapshot(query(collection(db, 'packets'), orderBy('createdAt', 'desc')), snap => {
      setPackets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    const unsubS = onSnapshot(collection(db, 'sales'), snap => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubP(); unsubS(); };
  }, []);

  const statsByPacket = useMemo(() => {
    const map = {};
    sales.forEach(s => {
      if (!s.packetId) return;
      if (!map[s.packetId]) map[s.packetId] = { count: 0, valeur: 0, categories: {} };
      map[s.packetId].count += 1;
      map[s.packetId].valeur += Number(s.prixAchat) || 0;
      if (s.categorie) {
        map[s.packetId].categories[s.categorie] = (map[s.packetId].categories[s.categorie] || 0) + 1;
      }
    });
    return map;
  }, [sales]);

  const orphanCount = useMemo(() => sales.filter(s => !s.packetId).length, [sales]);

  // clic chip catégorie → sélectionne + navigue vers /sales
  const handleCatChipClick = async (e, cat) => {
    e.stopPropagation();
    await selectCategory(cat);
    navigate('/sales');
  };

  if (loading) return <div className="loader">{t('packets_loading')}</div>;

  return (
    <div className="packets-section">
      <div className="packets-header">
        <h2>{t('packets_title')}</h2>

        {/* Bandeau catégorie active — gère aussi l'état "Tous les articles" (isAll) */}
        {currentPacket && currentCategory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>
              {currentCategory.isAll
                ? t('category_all_active', 'Vue : Tous les articles')
                : t('category_active_label', { name: currentCategory.nom, defaultValue: `Catégorie active : ${currentCategory.nom}` })}
            </span>
            {/* ← CORRIGÉ : resetCategory (pas clearCategory) pour forcer
                la réouverture de la modale — sinon cliquer "Changer" pendant
                qu'on est déjà en mode "Tous les articles" ne ferait rien,
                clearCategory remettant le même état isAll. */}
            <button className="packet-btn-ghost" style={{ padding: '2px 10px', fontSize: '0.8rem' }} onClick={resetCategory}>
              {t('category_change', 'Changer')}
            </button>
          </div>
        )}
      </div>

      {orphanCount > 0 && (
        currentPacket ? (
          <div className="packets-orphan-banner clickable" onClick={() => setShowAssign(true)}>
            {t('packets_orphan_banner_assign', { count: orphanCount, name: currentPacket.nom })}
          </div>
        ) : (
          <div className="packets-orphan-banner">
            {t('packets_orphan_banner', { count: orphanCount })}
          </div>
        )
      )}

      <div className="packets-grid">
        <div
          className={`packet-card packet-card-global ${!currentPacket ? 'selected' : ''}`}
          onClick={() => selectPacket(null)}
        >
          <div className="packet-card-icon"><Package size={20} /></div>
          <h3>{t('packets_global_view')}</h3>
          <p className="packet-card-date">{t('packets_global_view_sub')}</p>
        </div>

        {packets.map(p => {
          const stat     = statsByPacket[p.id] || { count: 0, valeur: 0, categories: {} };
          const isActive = currentPacket?.id === p.id;
          const topCats  = Object.entries(stat.categories).sort((a, b) => b[1] - a[1]).slice(0, 3);

          return (
            <div
              key={p.id}
              className={`packet-card ${isActive ? 'selected' : ''}`}
              onClick={() => selectPacket(p)}
            >
              <div className="packet-card-icon"><Package size={20} /></div>
              <h3>{p.nom}</h3>
              <p className="packet-card-date">{p.dateArrivage || '-'}</p>
              <div className="packet-card-stats">
                <span>{t('packets_card_articles', { count: stat.count })}</span>
                <span>{stat.valeur.toLocaleString()} F</span>
              </div>

              {/* Chips catégories — clic navigue vers /sales filtré */}
              {topCats.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {topCats.map(([cat, n]) => {
                    const isCurrentCat = isActive && !currentCategory?.isAll && currentCategory?.nom === cat;
                    return (
                      <span
                        key={cat}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: '0.72rem', padding: '2px 8px', borderRadius: 999,
                          background: isCurrentCat ? '#3b6ef8' : 'rgba(0,0,0,0.06)',
                          color: isCurrentCat ? '#fff' : 'inherit',
                          cursor: isActive ? 'pointer' : 'default',
                          transition: 'background 0.12s',
                        }}
                        onClick={e => {
                          if (isActive) handleCatChipClick(e, cat);
                          else e.stopPropagation();
                        }}
                        title={isActive
                          ? t('category_switch_to', { name: cat, defaultValue: `Voir les articles "${cat}"` })
                          : cat}
                      >
                        <Tag size={10} /> {cat} <strong>{n}</strong>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {packets.length === 0 && <p className="empty-msg">{t('packets_empty')}</p>}

      {showAssign && currentPacket && (
        <PacketOrphanAssignModal
          packetId={currentPacket.id}
          packetName={currentPacket.nom}
          onClose={() => setShowAssign(false)}
        />
      )}
    </div>
  );
};

export default PacketsGrid;