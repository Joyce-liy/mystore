import React, { useState, useEffect } from 'react';
import { Trash2, Edit3, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../contexts/CurrencyContext';
import '../styles/multi_photo.css';

// Retourne toujours un tableau de photos, compatible avec les anciens
// articles qui n'avaient qu'un seul champ "photo" (string)
const getPhotos = (sale) => {
  if (Array.isArray(sale.photos) && sale.photos.length > 0) return sale.photos;
  if (sale.photo) return [sale.photo];
  return [];
};

const SavedSalesList = ({ savedSales, onDelete, onEdit }) => {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [lightbox, setLightbox] = useState(null); // { photos: [], index: 0 }

  const openLightbox = (photos, index = 0) => setLightbox({ photos, index });
  const closeLightbox = () => setLightbox(null);
  const nextPhoto = () => setLightbox(l => l ? { ...l, index: (l.index + 1) % l.photos.length } : l);
  const prevPhoto = () => setLightbox(l => l ? { ...l, index: (l.index - 1 + l.photos.length) % l.photos.length } : l);

  // Navigation clavier quand la visionneuse est ouverte
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  // Fonction interne pour formater les anciennes dates si dateFormatee n'existe pas encore
  const formatExistingDate = (firebaseDate) => {
    if (!firebaseDate) return '-';
    const d = firebaseDate.toDate ? firebaseDate.toDate() : new Date(firebaseDate);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="saved-sales-container">
      <h3>{t('saved_sales_title')}</h3>
      <div className="table-responsive">
        <table className="sales-table">
          <thead>
            <tr>
              <th>{t('sales_col_date')}</th>
              <th>{t('sales_photo')}</th>
              <th>{t('sales_col_item')}</th>
              <th>{t('sales_index', 'Indice')}</th>
              <th>{t('sales_brand')}</th>
              <th>{t('sales_size')}</th>
              <th>{t('sales_buy_price')}</th>
              <th>{t('sales_sell_price')}</th>
              <th>{t('sales_transport')}</th>
              <th>{t('sales_profit')}</th>
              <th>{t('sales_observation', 'Observations')}</th>
              <th>{t('saved_sales_status')}</th>
              <th>{t('saved_sales_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {savedSales.map((sale) => (
              <tr key={sale.id} className={sale.status === 'en_attente' ? 'row-pending' : 'row-completed'}>
                {/* Colonne Date ajoutée */}
                <td style={{ fontSize: '12px', whiteSpace: 'nowrap', color: '#64748b' }}>
                  {sale.dateFormatee || formatExistingDate(sale.createdAt)}
                </td>
                
                <td className="photo-cell">
                  {(() => {
                    const photos = getPhotos(sale);
                    if (photos.length === 0) {
                      return <div className="photo-placeholder">{t('saved_sales_no_photo')}</div>;
                    }
                    return (
                      <div className="photo-stack" onClick={() => openLightbox(photos, 0)} title={t('sales_view_photos', 'Voir les photos')}>
                        {photos.slice(0, 3).map((p, idx) => (
                          <img key={idx} src={p} alt="" className="photo-stack-img" style={{ zIndex: 10 - idx }} />
                        ))}
                        {photos.length > 1 && <span className="photo-stack-count">{photos.length}</span>}
                      </div>
                    );
                  })()}
                </td>
                <td>{sale.designation}</td>
                <td style={{ fontWeight: 600, color: '#334155' }}>{sale.indice || '-'}</td>
                <td>{sale.marque || '-'}</td>
                <td>{sale.taille || '-'}</td>
                <td>{formatAmount(sale.prixAchat)}</td>
                <td>{formatAmount(sale.prixVente || 0)}</td>
                <td>{formatAmount(sale.transport || 0)}</td>
                <td className={`profit-cell ${sale.profit > 0 ? 'text-success' : 'text-danger'}`}>
                  {formatAmount(sale.profit || 0)}
                </td>
                <td
                  title={sale.observation || ''}
                  style={{
                    maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis', color: sale.observation ? 'inherit' : '#94a3b8'
                  }}
                >
                  {sale.observation || '-'}
                </td>
                <td>
                  <span className={`badge ${sale.status || 'en_attente'}`}>
                    {sale.status === 'termine'
                      ? t('saved_sales_status_sold')
                      : t('saved_sales_status_pending')}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    onClick={() => onEdit(sale)}
                    className="btn-icon edit-green"
                    style={{
                      color: '#10b981',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      marginRight: '10px'
                    }}
                    title={t('saved_sales_action_edit')}
                  >
                    <Edit3 size={18} />
                  </button>

                  <button
                    onClick={() => onDelete(sale.id)}
                    className="btn-icon delete"
                    style={{
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '19px'
                    }}
                    title={t('saved_sales_action_delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lightbox && (
        <div className="photo-modal" onClick={closeLightbox}>
          <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={closeLightbox} title="Fermer">
              <X size={24} />
            </button>

            {lightbox.photos.length > 1 && (
              <button className="photo-modal-nav prev" onClick={prevPhoto} title="Précédente">
                <ChevronLeft size={28} />
              </button>
            )}

            <img src={lightbox.photos[lightbox.index]} alt="Agrandie" className="photo-modal-image" />

            {lightbox.photos.length > 1 && (
              <button className="photo-modal-nav next" onClick={nextPhoto} title="Suivante">
                <ChevronRight size={28} />
              </button>
            )}

            {lightbox.photos.length > 1 && (
              <div className="photo-modal-counter">{lightbox.index + 1} / {lightbox.photos.length}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedSalesList;