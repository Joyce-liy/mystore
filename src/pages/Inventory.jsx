import React, { useState, useEffect } from 'react';
import { Plus, Minus, AlertTriangle } from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import '../styles/inventory.css';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("designation", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(items);
      setLoading(false);
    }, (error) => {
      console.error("Erreur Firestore:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStock = async (id, currentStock, amount) => {
    const newStock = Math.max(0, (Number(currentStock) || 0) + amount);
    const itemRef = doc(db, "sales", id);

    try {
      await updateDoc(itemRef, {
        stock: newStock,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error("Erreur de mise à jour:", error);
      alert("Erreur : Impossible de modifier le stock.");
    }
  };

  if (loading) return <div className="loader">Chargement de l'inventaire…</div>;

  return (
    <div className="inventory-container">
      <h2>Gestion du Stock</h2>

      <div className="table-responsive">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Article</th>
              <th>Prix d'Achat</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const alertLevel = item.alertLevel || 5;
              const isLowStock = item.stock <= alertLevel;

              return (
                <tr key={item.id} className={isLowStock ? 'low-stock' : ''}>
                  <td>{item.designation || "Sans nom"}</td>
                  <td>{(item.prixAchat || 0).toLocaleString()} F</td>
                  <td>
                    <span className={isLowStock ? 'danger-text font-bold' : ''}>
                      {item.stock}
                    </span>
                    {isLowStock && (
                      <AlertTriangle
                        color="#f59e0b"
                        size={14}
                        style={{ marginLeft: '8px', verticalAlign: 'middle' }}
                      />
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-stock plus"
                        onClick={() => handleUpdateStock(item.id, item.stock, 1)}
                        title="Ajouter au stock"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        className="btn-stock minus"
                        onClick={() => handleUpdateStock(item.id, item.stock, -1)}
                        title="Retirer du stock"
                      >
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

      {inventory.length === 0 && (
        <p className="empty-msg">Aucun article en stock.</p>
      )}
    </div>
  );
};

export default Inventory;