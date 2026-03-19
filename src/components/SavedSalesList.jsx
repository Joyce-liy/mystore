import React from 'react';
import { Trash2, Edit3 } from 'lucide-react';

const SavedSalesList = ({ savedSales, onDelete, onEdit }) => {
  return (
    <div className="saved-sales-container">
      <h3>Tableau des Ventes Enregistrées</h3>
      <div className="table-responsive">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Article</th>
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
                <td>{sale.designation}</td>
                <td>{sale.prixAchat} F</td>
                <td>{sale.prixVente || 0} F</td>
                <td>{sale.transport} F</td>
                <td className={`profit-cell ${sale.profit > 0 ? 'text-success' : 'text-danger'}`}>
                  {sale.profit || 0} F
                </td>
                <td>
                  {/* Correction ici : gère le cas où sale.status n'existe pas encore */}
                  <span className={`badge ${sale.status || 'en_attente'}`}>
                    {sale.status === 'termine' ? 'Vendu' : 'À vendre'}
                  </span>
                </td>
                <td className="actions-cell">
                  {/* BOUTON EDIT : Vert, sans bordure, style icône seule */}
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

                  {/* BOUTON DELETE : Rouge, sans bordure */}
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
    </div>
  );
};

export default SavedSalesList;