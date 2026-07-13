import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import '../styles/packets.css';

const PacketOrphanAssignModal = ({ packetId, packetName, onClose }) => {
  const { t } = useTranslation();
  const [orphans, setOrphans] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sales'), snap => {
      setOrphans(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.packetId));
    });
    return () => unsub();
  }, []);

  const toggle = (id) => setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);

  const handleAssign = async () => {
    if (selected.length === 0) return;
    const batch = writeBatch(db);
    selected.forEach(id => batch.update(doc(db, 'sales', id), { packetId }));
    await batch.commit();
    onClose();
  };

  return (
    <div className="packet-modal-overlay" onClick={onClose}>
      <div className="packet-modal packet-assign-modal" onClick={e => e.stopPropagation()}>
        <div className="packet-modal-head">
          <h3>{t('packets_assign_to', { name: packetName })}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        {orphans.length === 0 ? (
          <p className="empty-msg">{t('packets_no_orphans')}</p>
        ) : (
          <>
            <div className="packet-assign-list">
              {orphans.map(s => (
                <label key={s.id} className="packet-assign-row">
                  <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                  <span>{s.designation || t('sales_no_name')}</span>
                  <span className="packet-assign-price">{(s.prixAchat || 0).toLocaleString()} F</span>
                </label>
              ))}
            </div>
            <div className="packet-modal-foot">
              <button className="packet-btn-ghost" onClick={onClose}>{t('sales_cancel')}</button>
              <button className="packet-btn-primary" disabled={selected.length === 0} onClick={handleAssign}>
                {t('packets_assign_button', { count: selected.length })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PacketOrphanAssignModal;