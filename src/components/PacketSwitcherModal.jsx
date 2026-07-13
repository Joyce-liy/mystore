import React, { useState, useEffect, useMemo } from 'react';
import { Search, Package, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { usePacket } from '../contexts/PacketContext';
import '../styles/packets.css';

const PacketSwitcherModal = ({ onClose }) => {
  const { t } = useTranslation();
  const { currentPacket, selectPacket } = usePacket();
  const [packets, setPackets] = useState([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [nom, setNom] = useState('');
  const [dateArrivage, setDateArrivage] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'packets'), orderBy('createdAt', 'desc')), snap => {
      setPackets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return packets;
    return packets.filter(p => (p.nom || '').toLowerCase().includes(s));
  }, [packets, search]);

  const handleSelect = (p) => {
    selectPacket(p);
    onClose();
  };

  const handleCreate = async () => {
    if (!nom.trim() || !auth.currentUser) return;
    const ref = await addDoc(collection(db, 'packets'), {
      nom: nom.trim(),
      dateArrivage: dateArrivage || null,
      status: 'ouvert',
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
    selectPacket({ id: ref.id, nom: nom.trim() });
    onClose();
  };

  return (
    <div className="packet-switcher-overlay" onClick={onClose}>
      <div className="packet-switcher" onClick={e => e.stopPropagation()}>
        {!showCreate ? (
          <>
            <div className="packet-switcher-search">
              <Search size={16} />
              <input
                autoFocus
                type="text"
                placeholder={t('packets_switcher_search')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="packet-switcher-close" onClick={onClose}><X size={16} /></button>
            </div>

            <div className="packet-switcher-list">
              <div
                className={`packet-switcher-row ${!currentPacket ? 'active' : ''}`}
                onClick={() => handleSelect(null)}
              >
                <Package size={18} />
                <div>
                  <div className="packet-switcher-row-title">{t('packets_global_view')}</div>
                  <div className="packet-switcher-row-sub">{t('packets_global_view_sub')}</div>
                </div>
              </div>

              {filtered.map(p => (
                <div
                  key={p.id}
                  className={`packet-switcher-row ${currentPacket?.id === p.id ? 'active' : ''}`}
                  onClick={() => handleSelect(p)}
                >
                  <Package size={18} />
                  <div>
                    <div className="packet-switcher-row-title">{p.nom}</div>
                    <div className="packet-switcher-row-sub">{p.dateArrivage || '-'}</div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && <p className="empty-msg">{t('packets_empty')}</p>}
            </div>

            <button className="packet-switcher-new" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> {t('packets_new')}
            </button>
          </>
        ) : (
          <div className="packet-switcher-create">
            <div className="packet-modal-head">
              <h3>{t('packets_new')}</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="packet-modal-body">
              <label>{t('packets_field_name')}</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} autoFocus />
              <label>{t('packets_field_date')}</label>
              <input type="date" value={dateArrivage} onChange={e => setDateArrivage(e.target.value)} />
            </div>
            <div className="packet-modal-foot">
              <button className="packet-btn-ghost" onClick={() => setShowCreate(false)}>{t('sales_cancel')}</button>
              <button className="packet-btn-primary" onClick={handleCreate}>{t('packets_create')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PacketSwitcherModal;