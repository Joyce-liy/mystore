import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, FileText, FileSpreadsheet, Camera, Tag, Ruler } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import imageCompression from 'browser-image-compression';
import { db, auth } from '../firebase/firebaseConfig';
import {
  collection, addDoc, onSnapshot, query, orderBy,
  deleteDoc, doc, getDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import SavedSalesList from '../components/SavedSalesList';
import { sendAppNotification } from '../utils/notifications';
import '../styles/sales.css';

const formatDate = (date) => {
  const d = date || new Date();
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
};

const filterByPeriod = (sales, period) => {
  if (period === 'tout') return sales;
  const now = new Date();
  return sales.filter(s => {
    if (!s.createdAt) return true;
    const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
    if (isNaN(date.getTime())) return true;
    if (period === 'semaine') { const w = new Date(now); w.setDate(now.getDate()-7); return date >= w; }
    if (period === 'mois') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    return true;
  });
};

const emptyRow = () => ({
  id: Date.now(), designation: '', prixAchat: '', prixVente: '',
  transport: '', marque: '', taille: '', photo: null, isUpdate: false
});

const downloadBlob = (blob, filename) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const a = document.createElement('a');
    a.href = reader.result; a.download = filename;
    a.style.display = 'none'; document.body.appendChild(a);
    a.click(); document.body.removeChild(a);
  };
  reader.readAsDataURL(blob);
};

const Sales = () => {
  const { t, i18n } = useTranslation();
  const [sales, setSales]               = useState([emptyRow()]);
  const [savedSales, setSavedSales]     = useState([]);
  const [userRole, setUserRole]         = useState('vendeur');
  const [loading, setLoading]           = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('tout');
  const prixVenteRef = useRef(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) setUserRole(userDoc.data().role);
      }
    };
    fetchRole();
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, snap => {
      setSavedSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error('Sales snapshot error:', error);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (id, field, value) =>
    setSales(sales.map(s => s.id === id ? { ...s, [field]: value } : s));

  const handlePhotoChange = async (id, file) => {
    if (!file) return;
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.05, maxWidthOrHeight: 1920, useWebWorker: true });
      const reader = new FileReader();
      reader.onload = e => handleInputChange(id, 'photo', e.target.result);
      reader.readAsDataURL(compressed);
    } catch (err) { console.error('Erreur compression photo:', err); }
  };

  const addSection    = () => { if (userRole === 'admin') setSales([...sales, emptyRow()]); };
  const removeSection = id => { if (sales.length > 1) setSales(sales.filter(s => s.id !== id)); };

  const handleEditRequest = sale => {
    setSales([{ ...sale, isUpdate: true }]);
    setTimeout(() => { if (prixVenteRef.current) prixVenteRef.current.focus(); }, 100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      for (const s of sales) {
        const v  = Number(s.prixVente) || 0;
        const a  = Number(s.prixAchat) || 0;
        const tr = Number(s.transport) || 0;
        const profit = v - a - tr;
        const nom = s.designation || t('sales_no_name');

        // ── CAS 1 : Mise à jour d'un article existant ──
        if (s.isUpdate) {
          const data = {
            prixVente: v, profit,
            status: v > 0 ? 'termine' : 'en_attente',
            vendeurId: auth.currentUser.uid,
            dateVente: serverTimestamp()
          };
          if (userRole === 'admin') {
            Object.assign(data, {
              designation: s.designation, prixAchat: a, transport: tr,
              marque: s.marque || '', taille: s.taille || '',
              ...(s.photo ? { photo: s.photo } : {})
            });
          }
          await updateDoc(doc(db, 'sales', s.id), data);

          // NOTIFICATION : logique selon le rôle
          if (userRole === 'vendeur' && v > 0) {
            // Le vendeur vient de confirmer une vente → notifie l'ADMIN
            await sendAppNotification(
              'admin',
              t('notif_sale_title'),
              t('notif_sale_body', { name: nom, price: v.toLocaleString() }),
              'vente'
            );
          } else if (userRole === 'admin' && v > 0) {
            // L'admin a modifié un article avec un prix de vente → notifie les VENDEURS
            await sendAppNotification(
              'vendeur',
              t('notif_article_updated_title'),
              t('notif_article_updated_body', { name: nom }),
              'article'
            );
          }

        // ── CAS 2 : Ajout d'un nouvel article (admin uniquement) ──
        } else if (userRole === 'admin' && s.designation) {
          await addDoc(collection(db, 'sales'), {
            designation: s.designation, prixAchat: a, prixVente: v, transport: tr, profit,
            marque: s.marque || '', taille: s.taille || '', photo: s.photo || null,
            status: v > 0 ? 'termine' : 'en_attente',
            vendeurId: auth.currentUser.uid,
            createdAt: serverTimestamp(), dateFormatee: formatDate()
          });

          if (v > 0) {
            // Article ajouté déjà vendu → notifie l'admin lui-même (historique)
            await sendAppNotification(
              'admin',
              t('notif_sale_title'),
              t('notif_sale_body', { name: nom, price: v.toLocaleString() }),
              'vente'
            );
          } else {
            // Article ajouté en attente → notifie les VENDEURS qu'un article est dispo
            await sendAppNotification(
              'vendeur',
              t('notif_article_title'),
              t('notif_article_body', { name: nom }),
              'article'
            );
          }
        }
      }

      setSales([emptyRow()]);
      alert(t('sales_saved_ok'));
    } catch (err) {
      console.error(err);
      alert(t('sales_save_error'));
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async id => {
    if (userRole !== 'admin') return;
    if (window.confirm(t('sales_delete_confirm'))) await deleteDoc(doc(db, 'sales', id));
  };

  const filteredSales = filterByPeriod(savedSales, filterPeriod);

  const exportToExcel = async () => {
    if (filteredSales.length === 0) { alert(t('sales_no_data')); return; }
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(t('sales_excel_sheet'));
      ws.columns = [
        { header: t('sales_col_date'),   key: 'displayDate', width: 15 },
        { header: t('sales_col_item'),   key: 'designation', width: 25 },
        { header: t('sales_col_brand'),  key: 'marque',      width: 15 },
        { header: t('sales_col_size'),   key: 'taille',      width: 12 },
        { header: t('sales_col_buy'),    key: 'prixAchat',   width: 15 },
        { header: t('sales_col_sell'),   key: 'prixVente',   width: 15 },
        { header: t('sales_col_profit'), key: 'profit',      width: 15 },
      ];
      ws.addRows(filteredSales.map(s => ({
        displayDate: s.dateFormatee || (s.createdAt?.toDate ? formatDate(s.createdAt.toDate()) : '-'),
        designation: s.designation || t('sales_no_name'),
        marque: s.marque || '', taille: s.taille || '',
        prixAchat: Number(s.prixAchat) || 0,
        prixVente: Number(s.prixVente) || 0,
        profit:    Number(s.profit)    || 0
      })));
      const blob = new Blob([await wb.xlsx.writeBuffer()], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      downloadBlob(blob, `Ventes_MyStore_${Date.now()}.xlsx`);
    } catch (err) { console.error('Erreur Excel:', err); alert(`Erreur Excel: ${err.message}`); }
  };

  const exportToPDF = () => {
    if (filteredSales.length === 0) { alert(t('sales_no_data')); return; }
    try {
      const pdfDoc = new jsPDF('p', 'pt', 'a4');
      pdfDoc.text(t('sales_report_title'), 40, 40);
      autoTable(pdfDoc, {
        head: [[
          t('sales_col_date'), t('sales_col_item'), t('sales_col_brand'),
          t('sales_col_size'), t('sales_col_buy'),  t('sales_col_sell'), t('sales_col_profit')
        ]],
        body: filteredSales.map(s => [
          s.dateFormatee || (s.createdAt?.toDate ? formatDate(s.createdAt.toDate()) : '-'),
          s.designation || t('sales_no_name'), s.marque || '—', s.taille || '—',
          `${(Number(s.prixAchat) || 0).toLocaleString()} F`,
          `${(Number(s.prixVente) || 0).toLocaleString()} F`,
          `${(Number(s.profit)    || 0).toLocaleString()} F`
        ]),
        startY: 60, headStyles: { fillColor: [15, 23, 42] }
      });
      downloadBlob(pdfDoc.output('blob'), `Ventes_MyStore_${Date.now()}.pdf`);
    } catch (err) { console.error('Erreur PDF:', err); alert(`Erreur PDF: ${err.message}`); }
  };

  return (
    <div className="ms-root">
      <div className="ms-main">
        <header className="ms-topbar">
          <h1 className="ms-topbar-title">
            {sales[0]?.isUpdate ? t('sales_finalize') : t('sales_title')}
          </h1>
          {userRole === 'admin' && !sales[0]?.isUpdate && (
            <button className="ms-btn-primary" onClick={addSection}>
              <Plus size={15} /> {t('sales_new_item')}
            </button>
          )}
        </header>

        <div className="ms-content">
          {sales.map((sale, i) => {
            const liveProfit = (Number(sale.prixVente)||0) - (Number(sale.prixAchat)||0) - (Number(sale.transport)||0);
            return (
              <div key={sale.id} className={`ms-card ${sale.isUpdate ? 'update' : ''}`}>
                <div className="ms-card-head">
                  <span className="ms-card-tag">{t('sales_article')} {i + 1}</span>
                  {sale.isUpdate && <span className="ms-update-pill">{t('sales_update_pill')}</span>}
                  <div style={{ flex: 1 }} />
                  {!sale.isUpdate && userRole === 'admin' && sales.length > 1 && (
                    <button className="ms-icon-btn danger" onClick={() => removeSection(sale.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="ms-card-body">
                  <div className="ms-photo-wrap">
                    {sale.photo ? (
                      <div className="ms-photo-preview">
                        <img src={sale.photo} alt="article" />
                        {userRole === 'admin' && (
                          <button className="ms-photo-del" onClick={() => handleInputChange(sale.id, 'photo', null)}>✕</button>
                        )}
                      </div>
                    ) : (
                      <label htmlFor={`p-${sale.id}`} className="ms-photo-empty">
                        <Camera size={22} /><span>{t('sales_photo')}</span>
                      </label>
                    )}
                    <input id={`p-${sale.id}`} type="file" accept="image/*" className="ms-hidden"
                      disabled={userRole !== 'admin' && !sale.isUpdate}
                      onChange={e => handlePhotoChange(sale.id, e.target.files[0])} />
                  </div>

                  <div className="ms-grid">
                    <div className="ms-field col-2">
                      <label>{t('sales_designation')}</label>
                      <input type="text" value={sale.designation}
                        disabled={userRole !== 'admin' && !sale.isUpdate}
                        onChange={e => handleInputChange(sale.id, 'designation', e.target.value)} />
                    </div>
                    <div className="ms-field">
                      <label><Tag size={11} /> {t('sales_brand')}</label>
                      <input type="text" value={sale.marque} disabled={userRole !== 'admin'}
                        onChange={e => handleInputChange(sale.id, 'marque', e.target.value)} />
                    </div>
                    <div className="ms-field">
                      <label><Ruler size={11} /> {t('sales_size')}</label>
                      <input type="text" value={sale.taille} disabled={userRole !== 'admin'}
                        onChange={e => handleInputChange(sale.id, 'taille', e.target.value)} />
                    </div>
                    <div className="ms-field">
                      <label>{t('sales_buy_price')}</label>
                      <input type="number" value={sale.prixAchat} disabled={userRole !== 'admin'}
                        onChange={e => handleInputChange(sale.id, 'prixAchat', e.target.value)} />
                    </div>
                    <div className="ms-field">
                      <label>{t('sales_sell_price')}</label>
                      <input ref={prixVenteRef} type="number" value={sale.prixVente}
                        onChange={e => handleInputChange(sale.id, 'prixVente', e.target.value)} />
                    </div>
                    <div className="ms-field">
                      <label>{t('sales_transport')}</label>
                      <input type="number" value={sale.transport} disabled={userRole !== 'admin'}
                        onChange={e => handleInputChange(sale.id, 'transport', e.target.value)} />
                    </div>
                    <div className="ms-field">
                      <label>{t('sales_profit')}</label>
                      <div className={`ms-profit-pill ${liveProfit < 0 ? 'neg' : 'pos'}`}>
                        {liveProfit.toLocaleString()} F
                      </div>
                    </div>
                  </div>
                </div>

                {sale.isUpdate && (
                  <div className="ms-card-foot">
                    <button className="ms-btn-ghost" onClick={() => setSales([emptyRow()])}>
                      {t('sales_cancel')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="ms-action-bar">
            <div className="ms-export-row">
              <button className="ms-btn-export excel" onClick={exportToExcel}>
                <FileSpreadsheet size={14} /> {t('sales_export_excel')}
              </button>
              <button className="ms-btn-export pdf" onClick={exportToPDF}>
                <FileText size={14} /> {t('sales_export_pdf')}
              </button>
            </div>
            <button className="ms-btn-save" onClick={handleSave} disabled={loading}>
              <Save size={15} />
              {loading ? t('sales_saving') : sales[0]?.isUpdate ? t('sales_confirm') : t('sales_save')}
            </button>
          </div>

          <section className="ms-history">
            <div className="ms-history-head">
              <h2 className="ms-section-title">{t('sales_history')}</h2>
              <div className="ms-tabs">
                {[
                  ['tout',    t('sales_filter_all')],
                  ['mois',    t('sales_filter_month')],
                  ['semaine', t('sales_filter_week')]
                ].map(([v, l]) => (
                  <button key={v}
                    className={`ms-tab ${filterPeriod === v ? 'active' : ''}`}
                    onClick={() => setFilterPeriod(v)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <SavedSalesList
              savedSales={filteredSales}
              onDelete={deleteSale}
              onEdit={handleEditRequest}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Sales;