import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Correction import PDF
import ExcelJS from 'exceljs';
import { db, auth } from '../firebase/firebaseConfig';
import { 
  collection, addDoc, onSnapshot, query, orderBy, 
  deleteDoc, doc, getDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import SavedSalesList from '../components/SavedSalesList';
import '../styles/sales.css';

const Sales = () => {
  const [sales, setSales] = useState([{ id: Date.now(), designation: '', prixAchat: '', prixVente: '', transport: '', isUpdate: false }]);
  const [savedSales, setSavedSales] = useState([]);
  const [userRole, setUserRole] = useState('vendeur');
  const [loading, setLoading] = useState(false);
  
  const prixVenteRef = useRef(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) setUserRole(userDoc.data().role);
      }
    };
    fetchRole();

    const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSavedSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (id, field, value) => {
    setSales(sales.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSection = () => {
    if (userRole !== 'admin') return;
    setSales([...sales, { id: Date.now(), designation: '', prixAchat: '', prixVente: '', transport: '', isUpdate: false }]);
  };

  const removeSection = (id) => {
    if (sales.length > 1) setSales(sales.filter(s => s.id !== id));
  };

  const handleEditRequest = (saleFromList) => {
    setSales([{ ...saleFromList, isUpdate: true }]);
    setTimeout(() => {
      if(prixVenteRef.current) prixVenteRef.current.focus();
    }, 100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      for (const s of sales) {
        const amountVente = Number(s.prixVente) || 0;
        const amountAchat = Number(s.prixAchat) || 0;
        const amountTrans = Number(s.transport) || 0;
        const calcProfit = amountVente - amountAchat - amountTrans;

        if (s.isUpdate) {
          const saleRef = doc(db, "sales", s.id);
          const updateData = {
            prixVente: amountVente,
            profit: calcProfit,
            status: amountVente > 0 ? 'termine' : 'en_attente',
            vendeurId: auth.currentUser.uid,
            dateVente: serverTimestamp()
          };

          if (userRole === 'admin') {
            updateData.designation = s.designation;
            updateData.prixAchat = amountAchat;
            updateData.transport = amountTrans;
          }
          await updateDoc(saleRef, updateData);
        } 
        else if (userRole === 'admin' && s.designation) {
          await addDoc(collection(db, "sales"), {
            designation: s.designation,
            prixAchat: amountAchat,
            prixVente: amountVente,
            transport: amountTrans,
            profit: calcProfit,
            status: amountVente > 0 ? 'termine' : 'en_attente',
            vendeurId: auth.currentUser.uid,
            createdAt: serverTimestamp()
          });
        }
      }
      setSales([{ id: Date.now(), designation: '', prixAchat: '', prixVente: '', transport: '', isUpdate: false }]);
      alert("Enregistré avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur réseau ou permission.");
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (id) => {
    if (userRole !== 'admin') return;
    if (window.confirm("Supprimer cette fiche ?")) await deleteDoc(doc(db, "sales", id));
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventes');
    worksheet.columns = [
      { header: 'Article', key: 'designation', width: 25 },
      { header: 'Achat', key: 'prixAchat', width: 15 },
      { header: 'Vente', key: 'prixVente', width: 15 },
      { header: 'Profit', key: 'profit', width: 15 }
    ];
    worksheet.addRows(savedSales);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Ventes_MyStore.xlsx'; a.click();
  };

  // --- CORRECTION PDF ---
 const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Titre
      doc.setFontSize(18);
      doc.text("Rapport MyStore - Ventes", 14, 15);
      
      // On s'assure que les données sont des nombres propres pour le PDF
      const tableRows = savedSales.map(s => [
        s.designation || 'Sans nom',
        `${s.prixAchat || 0} F`,  // Formatage simple sans caractères spéciaux
        `${s.prixVente || 0} F`,
        `${s.profit || 0} F`
      ]);

      autoTable(doc, {
        head: [['Article', 'Achat (F)', 'Vente (F)', 'Profit (F)']],
        body: tableRows,
        startY: 25,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { font: "helvetica", fontSize: 10 }, // Forcer une police standard
      });

      doc.save("Ventes_MyStore.pdf");
    } catch (error) {
      console.error("Erreur PDF:", error);
      alert("Erreur lors de la génération du PDF.");
    }
  };

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h1 className="page-title">
           {sales[0]?.isUpdate ? "🛒 Finalisation de la Vente" : `Gestion des Ventes (${userRole})`}
        </h1>
        {userRole === 'admin' && !sales[0]?.isUpdate && (
          <button className="btn-add" onClick={addSection}><Plus size={20} /> Nouvel Article</button>
        )}
      </div>

      <div className="sales-list">
        {sales.map((sale) => (
          <div key={sale.id} className={`sale-row-card shadow-sm ${sale.isUpdate ? 'editing-mode' : ''}`}>
            <div className="input-group">
                <label>Article</label>
                <input 
                  type="text" 
                  placeholder="Désignation" 
                  value={sale.designation} 
                  disabled={userRole !== 'admin' && sale.isUpdate} 
                  onChange={(e) => handleInputChange(sale.id, 'designation', e.target.value)} 
                />
            </div>
            <div className="input-group">
                <label>Achat</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={sale.prixAchat} 
                  disabled={userRole !== 'admin'} 
                  onChange={(e) => handleInputChange(sale.id, 'prixAchat', e.target.value)} 
                />
            </div>
            <div className="input-group">
                <label>Vente</label>
                <input 
                  ref={prixVenteRef} 
                  type="number" 
                  placeholder="0" 
                  className="highlight-input"
                  value={sale.prixVente} 
                  onChange={(e) => handleInputChange(sale.id, 'prixVente', e.target.value)} 
                />
            </div>
            <div className="input-group">
                <label>Transport</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={sale.transport} 
                  disabled={userRole !== 'admin'} 
                  onChange={(e) => handleInputChange(sale.id, 'transport', e.target.value)} 
                />
            </div>

            {!sale.isUpdate && userRole === 'admin' && (
              <button className="btn-icon delete" onClick={() => removeSection(sale.id)}><Trash2 size={18} /></button>
            )}
            
            {sale.isUpdate && (
                <button className="btn-cancel" onClick={() => setSales([{ id: Date.now(), designation: '', prixAchat: '', prixVente: '', transport: '', isUpdate: false }])}>
                  Annuler
                </button>
            )}
          </div>
        ))}
      </div>

      <div className="sales-footer">
        <div className="export-actions">
           <button className="btn-export excel" onClick={exportToExcel}><FileSpreadsheet size={16}/> Excel</button>
           <button className="btn-export pdf" onClick={exportToPDF}><FileText size={16}/> PDF</button>
        </div>
        <button className="btn-save" onClick={handleSave} disabled={loading}>
          <Save size={20} /> {loading ? "Patientez..." : sales[0]?.isUpdate ? "Confirmer la Vente" : "Enregistrer"}
        </button>
      </div>

      <SavedSalesList 
        savedSales={savedSales} 
        onDelete={deleteSale} 
        onEdit={handleEditRequest} 
      />
    </div>
  );
};

export default Sales;