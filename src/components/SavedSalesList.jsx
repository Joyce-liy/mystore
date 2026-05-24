import React, { useState } from 'react';
import { Trash2, Edit3, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SavedSalesList = ({ savedSales, onDelete, onEdit }) => {
  const { t } = useTranslation();
  const [selectedPhoto, setSelectedPhoto] = useState(null);

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
              <th>{t('sales_brand')}</th>
              <th>{t('sales_size')}</th>
              <th>{t('sales_buy_price')}</th>
              <th>{t('sales_sell_price')}</th>
              <th>{t('sales_transport')}</th>
              <th>{t('sales_profit')}</th>
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
                  {sale.photo ? (
                    <img
                      src={sale.photo}
                      alt={t('sales_photo')}
                      className="product-thumbnail clickable"
                      onClick={() => setSelectedPhoto(sale.photo)}
                      style={{ cursor: 'pointer' }}
                    />
                  ) : (
                    <div className="photo-placeholder">{t('saved_sales_no_photo')}</div>
                  )}
                </td>
                <td>{sale.designation}</td>
                <td>{sale.marque || '-'}</td>
                <td>{sale.taille || '-'}</td>
                <td>{sale.prixAchat} F</td>
                <td>{sale.prixVente || 0} F</td>
                <td>{sale.transport} F</td>
                <td className={`profit-cell ${sale.profit > 0 ? 'text-success' : 'text-danger'}`}>
                  {sale.profit || 0} F
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

      {selectedPhoto && (
        <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="photo-modal-close"
              onClick={() => setSelectedPhoto(null)}
              title="Fermer"
            >
              <X size={24} />
            </button>
            <img src={selectedPhoto} alt="Agrandie" className="photo-modal-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedSalesList;