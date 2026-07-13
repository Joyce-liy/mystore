import React, { useState, useEffect, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { usePacket } from '../contexts/PacketContext';
import PacketOrphanAssignModal from '../pages/PacketOrphanAssignModal';
import '../styles/packets.css';

const PacketsGrid = () => {
  const { t } = useTranslation();
  const { currentPacket, selectPacket } = usePacket();
  const [packets, setPackets] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
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
      if (!map[s.packetId]) map[s.packetId] = { count: 0, valeur: 0 };
      map[s.packetId].count += 1;
      map[s.packetId].valeur += Number(s.prixAchat) || 0;
    });
    return map;
  }, [sales]);

  const orphanCount = useMemo(() => sales.filter(s => !s.packetId).length, [sales]);

  if (loading) return <div className="loader">{t('packets_loading')}</div>;

  return (
    <div className="packets-section">
      <div className="packets-header">
        <h2>{t('packets_title')}</h2>
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
          const stat = statsByPacket[p.id] || { count: 0, valeur: 0 };
          const isActive = currentPacket?.id === p.id;
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