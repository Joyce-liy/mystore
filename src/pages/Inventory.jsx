import React, { useState, useEffect } from 'react';
import { Plus, Minus, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { usePacket } from '../contexts/PacketContext';
import { useCategory } from '../contexts/CategoryContext';
import { useCurrency } from '../contexts/CurrencyContext';
import '../styles/inventory.css';

const Inventory = () => {
  const { t } = useTranslation();
  const { currentPacket } = usePacket();
  const packetId = currentPacket?.id || null;
  const { currentCategory } = useCategory();
  const categoryId = currentCategory?.id || null;
  const { formatAmount } = useCurrency();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const q = packetId
      ? (categoryId
          ? query(collection(db, 'sales'), where('packetId', '==', packetId), where('categorieId', '==', categoryId))
          : query(collection(db, 'sales'), where('packetId', '==', packetId)))
      : query(collection(db, 'sales'), orderBy('designation', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (packetId) list.sort((a, b) => (a.designation || '').localeCompare(b.designation || ''));
      setInventory(list);
      setLoading(false);
    }, (error) => { console.error('Erreur Firestore:', error); setLoading(false); });
    return () => unsubscribe();
  }, [packetId, categoryId]);

  const handleUpdateStock = async (id, currentStock, amount) => {
    const newStock = Math.max(0, (Number(currentStock)||0) + amount);
    try {
      await updateDoc(doc(db, 'sales', id), { stock: newStock, lastUpdated: serverTimestamp() });
    } catch (error) { console.error(error); alert(t('inventory_error')); }
  };

  if (loading) return <div className="loader">{t('inventory_loading')}</div>;

  if (currentPacket && !currentCategory) {
    return (
      <div className="inventory-container">
        <p className="empty-msg">{t('inventory_category_required', 'Choisissez une catégorie pour ce packet avant de consulter l\'inventaire.')}</p>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <h2>{t('inventory_title')}</h2>

      <div className="table-responsive">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>{t('inventory_col_item')}</th>
              <th>{t('inventory_col_category', 'Catégorie')}</th>
              <th>{t('inventory_col_price')}</th>
              <th>{t('inventory_col_stock')}</th>
              <th>{t('inventory_col_action')}</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const alertLevel = item.alertLevel || 5;
              const isLowStock = item.stock <= alertLevel;
              return (
                <tr key={item.id} className={isLowStock ? 'low-stock' : ''}>
                  <td>{item.designation || t('sales_no_name')}</td>
                  <td>{item.categorie || '—'}</td>
                  <td>{formatAmount(item.prixAchat)}</td>
                  <td>
                    <span className={isLowStock ? 'danger-text font-bold' : ''}>{item.stock}</span>
                    {isLowStock && <AlertTriangle color="#f59e0b" size={14} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-stock plus" title={t('inventory_add')}
                        onClick={() => handleUpdateStock(item.id, item.stock, 1)}>
                        <Plus size={14} />
                      </button>
                      <button className="btn-stock minus" title={t('inventory_remove')}
                        onClick={() => handleUpdateStock(item.id, item.stock, -1)}>
                        <Minus size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inventory.length === 0 && <p className="empty-msg">{t('inventory_empty')}</p>}
    </div>
  );
};

export default Inventory;