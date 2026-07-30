import React, { useState, useEffect } from 'react';
import { X, Filter, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import '../styles/packets.css';

const PacketOrphanAssignModal = ({ packetId, packetName, onClose }) => {
  const { t } = useTranslation();
  const [orphans, setOrphans] = useState([]);
  const [selected, setSelected] = useState([]);
  const [filterCat, setFilterCat] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sales'), snap => {
      setOrphans(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.packetId));
    });
    return () => unsub();
  }, []);

  const toggle = (id) => setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);

  // Catégories réellement présentes parmi les orphelins (dérivées des données,
  // pas d'une liste prédéfinie séparée)
  const availableCats = [...new Set(orphans.map(s => s.categorie).filter(Boolean))];
  const filtered = filterCat ? orphans.filter(s => (s.categorie || '') === filterCat) : orphans;
  const allChecked = filtered.length > 0 && filtered.every(s => selected.includes(s.id));

  const toggleAll = () => {
    const visible = filtered.map(s => s.id);
    const checked = visible.every(id => selected.includes(id));
    setSelected(checked ? selected.filter(id => !visible.includes(id)) : [...new Set([...selected, ...visible])]);
  };

  const handleAssign = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      selected.forEach(id => batch.update(doc(db, 'sales', id), { packetId }));
      await batch.commit();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="packet-modal-overlay" onClick={onClose}>
      <div className="packet-modal packet-assign-modal" onClick={e => e.stopPropagation()}>
        <div className="packet-modal-head">
          <h3>{t('packets_assign_to', { name: packetName })}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {availableCats.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 10px' }}>
            <Filter size={13} />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">{t('packets_all_categories', 'Toutes catégories')} ({orphans.length})</option>
              {availableCats.map(cat => {
                const n = orphans.filter(s => s.categorie === cat).length;
                return <option key={cat} value={cat}>{cat} ({n})</option>;
              })}
            </select>
          </div>
        )}

        {orphans.length === 0 ? (
          <p className="empty-msg">{t('packets_no_orphans')}</p>
        ) : filtered.length === 0 ? (
          <p className="empty-msg">{t('packets_no_orphans_category', 'Aucun article dans cette catégorie.')}</p>
        ) : (
          <>
            <label className="packet-assign-row" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: 8 }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              <span style={{ fontWeight: 600 }}>{t('packets_select_all', 'Tout sélectionner')} ({filtered.length})</span>
            </label>

            <div className="packet-assign-list">
              {filtered.map(s => (
                <label key={s.id} className="packet-assign-row">
                  <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                  <span>{s.designation || t('sales_no_name')}</span>
                  {s.categorie && <span className="pk-badge pk-badge--sm">{s.categorie}</span>}
                  <span className="packet-assign-price">{(s.prixAchat || 0).toLocaleString()} F</span>
                </label>
              ))}
            </div>
            <div className="packet-modal-foot">
              <button className="packet-btn-ghost" onClick={onClose}>{t('sales_cancel')}</button>
              <button className="packet-btn-primary" disabled={selected.length === 0 || saving} onClick={handleAssign}>
                {saving ? t('packets_assigning', 'Assignation…') : t('packets_assign_button', { count: selected.length })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PacketOrphanAssignModal;