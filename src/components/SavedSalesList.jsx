import React, { useState } from 'react';
import { Trash2, Edit3, X } from 'lucide-react';

const SavedSalesList = ({ savedSales, onDelete, onEdit }) => {
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
      <h3>Tableau des Ventes Enregistrées</h3>
      <div className="table-responsive">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Photo</th>
              <th>Article</th>
              <th>Marque</th>
              <th>Taille</th>
              <th>Achat</th>
              <th>Vente</th>
              <th>Transport</th>
              <th>Profit</th>
              <th>Statut</th>
              <th>Actions</th>
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
                      alt="Article"
                      className="product-thumbnail clickable"
                      onClick={() => setSelectedPhoto(sale.photo)}
                      style={{ cursor: 'pointer' }}
                    />
                  ) : (
                    <div className="photo-placeholder">Pas de photo</div>
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
                    {sale.status === 'termine' ? 'Vendu' : 'À vendre'}
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
                    title="Saisir le prix de vente"
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
                      padding: '5px'
                    }}
                    title="Supprimer"
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