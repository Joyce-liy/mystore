import React, { useState, useEffect, useMemo } from 'react';
import { Search, Package, X, Plus, Trash2, Eye, Pencil, Calendar, Truck, StickyNote, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebase/firebaseConfig';
import {
  collection, onSnapshot, addDoc, updateDoc,
  query, orderBy, serverTimestamp, deleteDoc, doc
} from 'firebase/firestore';
import { usePacket } from '../contexts/PacketContext';
import '../styles/packets.css';

/* ══════════════════════════════════════
   Sous-modal : Voir / Éditer un packet
══════════════════════════════════════ */
const PacketDetailModal = ({ packet, mode, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [nom,           setNom]           = useState(packet.nom || '');
  const [dateEnvoye,    setDateEnvoye]    = useState(packet.dateEnvoye    || '');
  const [dateReception, setDateReception] = useState(packet.dateReception || '');
  const [transportCost, setTransportCost] = useState(packet.transportCost != null ? String(packet.transportCost) : '');
  const [observation,   setObservation]   = useState(packet.observation   || '');
  const [saving,        setSaving]        = useState(false);
  const [editMode,      setEditMode]      = useState(mode === 'edit');

  const handleSave = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'packets', packet.id), {
        nom:          nom.trim(),
        dateEnvoye:   dateEnvoye    || null,
        dateReception: dateReception || null,
        transportCost: transportCost ? Number(transportCost) : null,
        observation:  observation.trim() || null,
      });
      onSaved({ ...packet, nom: nom.trim(), dateEnvoye, dateReception, transportCost, observation });
      setEditMode(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="psw-detail-overlay" onClick={onClose}>
      <div className="psw-detail-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="psw-detail-head">
          <div className="psw-detail-head-left">
            <div className="psw-detail-icon"><Package size={18} /></div>
            <h3>{editMode ? t('packets_edit', 'Modifier le packet') : packet.nom}</h3>
          </div>
          <div className="psw-detail-head-actions">
            {!editMode && (
              <button className="psw-action-btn psw-edit" onClick={() => setEditMode(true)} title={t('packets_edit', 'Modifier')}>
                <Pencil size={14} />
              </button>
            )}
            <button className="psw-action-btn psw-close" onClick={onClose} title="Fermer">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="psw-detail-body">
          {editMode ? (
            /* ── Mode édition ── */
            <>
              <div className="psw-detail-field">
                <label>{t('packets_field_name', 'Nom du packet')}</label>
                <input autoFocus type="text" value={nom} onChange={e => setNom(e.target.value)} />
              </div>
              <div className="psw-detail-row2">
                <div className="psw-detail-field">
                  <label><Calendar size={11} /> {t('packets_field_date_envoye', "Date d'envoi")}</label>
                  <input type="date" value={dateEnvoye} onChange={e => setDateEnvoye(e.target.value)} />
                </div>
                <div className="psw-detail-field">
                  <label><Calendar size={11} /> {t('packets_field_date_reception', 'Date de réception')}</label>
                  <input type="date" value={dateReception} onChange={e => setDateReception(e.target.value)} />
                </div>
              </div>
              <div className="psw-detail-field">
                <label><Truck size={11} /> {t('packets_field_transport_cost', 'Coût de transport')}</label>
                <input type="number" min="0" step="0.01" value={transportCost}
                  placeholder="Montant en F"
                  onChange={e => setTransportCost(e.target.value)} />
              </div>
              <div className="psw-detail-field">
                <label><StickyNote size={11} /> {t('packets_field_observation', 'Observation')}</label>
                <textarea rows={3} value={observation}
                  placeholder={t('packets_obs_placeholder', 'Notes, fournisseur, conditions…')}
                  onChange={e => setObservation(e.target.value)} />
              </div>
              <div className="psw-detail-foot">
                <button className="psw-btn-ghost" onClick={() => setEditMode(false)}>
                  {t('sales_cancel', 'Annuler')}
                </button>
                <button className="psw-btn-primary" onClick={handleSave} disabled={!nom.trim() || saving}>
                  <Check size={14} /> {saving ? '…' : t('packets_save', 'Enregistrer')}
                </button>
              </div>
            </>
          ) : (
            /* ── Mode lecture ── */
            <>
              <div className="psw-info-grid">
                <div className="psw-info-item">
                  <span className="psw-info-label"><Calendar size={11} /> {t('packets_field_date_envoye', "Date d'envoi")}</span>
                  <span className="psw-info-value">{packet.dateEnvoye || '—'}</span>
                </div>
                <div className="psw-info-item">
                  <span className="psw-info-label"><Calendar size={11} /> {t('packets_field_date_reception', 'Date de réception')}</span>
                  <span className="psw-info-value">{packet.dateReception || '—'}</span>
                </div>
                <div className="psw-info-item">
                  <span className="psw-info-label"><Truck size={11} /> {t('packets_field_transport_cost', 'Transport')}</span>
                  <span className="psw-info-value">
                    {packet.transportCost != null ? `${Number(packet.transportCost).toLocaleString()} F` : '—'}
                  </span>
                </div>
              </div>
              {packet.observation && (
                <div className="psw-info-obs">
                  <div className="psw-info-obs-label"><StickyNote size={11} /> Observation</div>
                  <p>{packet.observation}</p>
                </div>
              )}
              {!packet.dateEnvoye && !packet.dateReception && !packet.transportCost && !packet.observation && (
                <p className="psw-info-empty">Aucune information supplémentaire.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   Modal principal : Switcher
══════════════════════════════════════ */
const PacketSwitcherModal = ({ onClose }) => {
  const { t } = useTranslation();
  const { currentPacket, selectPacket } = usePacket();

  const [packets,    setPackets]    = useState([]);
  const [search,     setSearch]     = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [detailPacket, setDetailPacket] = useState(null); // { packet, mode }
  const [deletingId, setDeletingId] = useState(null);

  // Champs création
  const [nom,           setNom]           = useState('');
  const [dateEnvoye,    setDateEnvoye]    = useState('');
  const [dateReception, setDateReception] = useState('');
  const [transportCost, setTransportCost] = useState('');
  const [observation,   setObservation]   = useState('');
  const [creating,      setCreating]      = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'packets'), orderBy('createdAt', 'desc')),
      snap => setPackets(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return packets;
    return packets.filter(p => (p.nom || '').toLowerCase().includes(s));
  }, [packets, search]);

  const handleSelect = (p) => { selectPacket(p); onClose(); };

  const handleDelete = async (packetId, e) => {
    e.stopPropagation();
    if (!window.confirm(t('packets_delete_confirm', 'Supprimer ce packet ?'))) return;
    setDeletingId(packetId);
    try {
      await deleteDoc(doc(db, 'packets', packetId));
      if (currentPacket?.id === packetId) selectPacket(null);
    } catch (err) {
      console.error(err);
      alert(t('packets_delete_error', 'Impossible de supprimer le packet.'));
    } finally { setDeletingId(null); }
  };

  const handleCreate = async () => {
    if (!nom.trim() || !auth.currentUser) return;
    setCreating(true);
    try {
      const ref = await addDoc(collection(db, 'packets'), {
        nom:          nom.trim(),
        dateEnvoye:   dateEnvoye    || null,
        dateReception: dateReception || null,
        transportCost: transportCost ? Number(transportCost) : null,
        observation:  observation.trim() || null,
        status:       'ouvert',
        createdBy:    auth.currentUser.uid,
        createdAt:    serverTimestamp(),
      });
      selectPacket({ id: ref.id, nom: nom.trim() });
      onClose();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const resetCreate = () => {
    setShowCreate(false);
    setNom(''); setDateEnvoye(''); setDateReception(''); setTransportCost(''); setObservation('');
  };

  return (
    <>
      <div className="packet-switcher-overlay" onClick={onClose}>
        <div className="packet-switcher" onClick={e => e.stopPropagation()}>

          {!showCreate ? (
            <>
              {/* ── Barre de recherche ── */}
              <div className="packet-switcher-search">
                <Search size={15} color="#94a3b8" />
                <input autoFocus type="text"
                  placeholder={t('packets_switcher_search', 'Rechercher des Paquets')}
                  value={search} onChange={e => setSearch(e.target.value)} />
                <button className="packet-switcher-close" onClick={onClose}><X size={16} /></button>
              </div>

              {/* ── Liste ── */}
              <div className="packet-switcher-list">

                {/* Vue globale */}
                <div
                  className={`packet-switcher-row ${!currentPacket ? 'active' : ''}`}
                  onClick={() => handleSelect(null)}
                >
                  <div className="psw-row-icon psw-row-icon--global">
                    <Package size={18} />
                  </div>
                  <div className="psw-row-body">
                    <div className="packet-switcher-row-title">{t('packets_global_view', 'Vue Globale')}</div>
                    <div className="packet-switcher-row-sub">{t('packets_global_view_sub', 'Voir tous les paquets')}</div>
                  </div>
                </div>

                {/* Packets */}
                {filtered.map(p => (
                  <div key={p.id}
                    className={`packet-switcher-row ${currentPacket?.id === p.id ? 'active' : ''}`}
                  >
                    {/* Zone cliquable pour sélectionner */}
                    <div className="psw-row-icon" onClick={() => handleSelect(p)}>
                      <Package size={18} />
                    </div>
                    <div className="psw-row-body" onClick={() => handleSelect(p)}>
                      <div className="packet-switcher-row-title">{p.nom}</div>
                      <div className="packet-switcher-row-sub">
                        {p.dateEnvoye
                          ? `Envoyé : ${p.dateEnvoye}`
                          : p.dateReception
                          ? `Reçu : ${p.dateReception}`
                          : '—'}
                      </div>
                      {p.observation && (
                        <div className="psw-row-obs">{p.observation}</div>
                      )}
                    </div>

                    {/* ── Actions ── */}
                    <div className="psw-row-actions" onClick={e => e.stopPropagation()}>
                      {/* Œil : voir */}
                      <button
                        className="psw-action-btn psw-view"
                        title={t('packets_view', 'Voir les infos')}
                        onClick={() => setDetailPacket({ packet: p, mode: 'view' })}
                      >
                        <Eye size={14} />
                      </button>
                      {/* Crayon : éditer */}
                      <button
                        className="psw-action-btn psw-edit"
                        title={t('packets_edit', 'Modifier')}
                        onClick={() => setDetailPacket({ packet: p, mode: 'edit' })}
                      >
                        <Pencil size={14} />
                      </button>
                      {/* Poubelle : supprimer */}
                      <button
                        className="psw-action-btn psw-delete"
                        title={t('packets_delete', 'Supprimer')}
                        disabled={deletingId === p.id}
                        onClick={e => handleDelete(p.id, e)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <p className="empty-msg">{t('packets_empty', 'Aucun packet trouvé')}</p>
                )}
              </div>

              {/* Bouton nouveau */}
              <button className="packet-switcher-new" onClick={() => setShowCreate(true)}>
                <Plus size={15} /> {t('packets_new', 'Nouveau Paquet')}
              </button>
            </>

          ) : (
            /* ── Formulaire création ── */
            <div className="packet-switcher-create">
              <div className="packet-modal-head">
                <h3>{t('packets_new', 'Nouveau Paquet')}</h3>
                <button onClick={resetCreate}><X size={18} /></button>
              </div>
              <div className="packet-modal-body">
                <label>{t('packets_field_name', 'Nom du packet')}</label>
                <input type="text" value={nom} autoFocus
                  onChange={e => setNom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()} />

                <div className="psw-form-row2">
                  <div>
                    <label>{t('packets_field_date_envoye', "Date d'envoi")}</label>
                    <input type="date" value={dateEnvoye} onChange={e => setDateEnvoye(e.target.value)} />
                  </div>
                  <div>
                    <label>{t('packets_field_date_reception', 'Date de réception')}</label>
                    <input type="date" value={dateReception} onChange={e => setDateReception(e.target.value)} />
                  </div>
                </div>

                <label>{t('packets_field_transport_cost', 'Coût de transport')}</label>
                <input type="number" min="0" step="0.01" value={transportCost}
                  placeholder="Montant en F"
                  onChange={e => setTransportCost(e.target.value)} />

                <label>{t('packets_field_observation', 'Observation')}</label>
                <textarea value={observation} rows={3}
                  placeholder={t('packets_obs_placeholder', 'Notes, fournisseur, conditions…')}
                  onChange={e => setObservation(e.target.value)} />
              </div>
              <div className="packet-modal-foot">
                <button className="packet-btn-ghost" onClick={resetCreate}>{t('sales_cancel', 'Annuler')}</button>
                <button className="packet-btn-primary" onClick={handleCreate} disabled={!nom.trim() || creating}>
                  {creating ? '…' : t('packets_create', 'Créer')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sous-modal detail/edit ── */}
      {detailPacket && (
        <PacketDetailModal
          packet={detailPacket.packet}
          mode={detailPacket.mode}
          onClose={() => setDetailPacket(null)}
          onSaved={(updated) => {
            setPackets(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
            setDetailPacket(null);
          }}
        />
      )}
    </>
  );
};

export default PacketSwitcherModal;