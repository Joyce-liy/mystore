import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, UserCircle, Globe, Layers, ArrowLeftRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { usePacket } from '../../contexts/PacketContext';
import { useCategory } from '../../contexts/CategoryContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import {
  collection, query, where, orderBy,
  onSnapshot, getDoc, doc, writeBatch
} from 'firebase/firestore';
import NotificationDropdown from '../NotificationDropdown';
import PacketSwitcherModal from '../PacketSwitcherModal';
import '../../styles/layout.css';

const Header = () => {
  const { t, i18n }             = useTranslation();
  const location                = useLocation();
  const navigate                = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { currentPacket, clearPacket } = usePacket();
  const { clearCategory } = useCategory();
  const { currency, toggleCurrency } = useCurrency();

  const [showSwitcher,  setShowSwitcher]  = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const getLang = () => (i18n.language ? i18n.language.split('-')[0].toLowerCase() : 'fr');
  const [currentLang, setCurrentLang] = useState(getLang);

  useEffect(() => {
    const onLangChanged = (lng) => setCurrentLang(lng.split('-')[0].toLowerCase());
    i18n.on('languageChanged', onLangChanged);
    return () => i18n.off('languageChanged', onLangChanged);
  }, [i18n]);

  const unsubRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initNotifs = async () => {
      // On utilise l'ID de l'utilisateur pour stabiliser le hook
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (!isMounted) return;

        const role = userSnap.exists() ? userSnap.data().role : 'vendeur';

        const q = query(
          collection(db, 'notifications'),
          where('to', '==', role),
          orderBy('createdAt', 'desc')
        );

        if (unsubRef.current) unsubRef.current();

        unsubRef.current = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setNotifications(list);
          setUnreadCount(list.filter(n => !n.read).length);
        }, (error) => {
          // Cette erreur disparaîtra dès que l'index Firestore sera "Actif"
          console.error('Erreur notifications Firestore:', error);
        });
      } catch (err) {
        console.error("Erreur d'initialisation:", err);
      }
    };

    initNotifs();

    return () => {
      isMounted = false;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [auth.currentUser?.uid]); // Utilisation de l'UID pour éviter les re-renders inutiles

  const handleOpenNotifs = async () => {
    const opening = !showNotifs;
    setShowNotifs(opening);

    if (opening) {
      const unread = notifications.filter(n => !n.read);
      if (unread.length === 0) return;
      try {
        const batch = writeBatch(db);
        unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
        await batch.commit();
      } catch (err) {
        console.error('Erreur markAsRead:', err);
      }
    }
  };

  const menuItems = [
    { label: t('dashboard'),  path: '/'           },
    { label: t('statistics'), path: '/statistics' },
    { label: t('sales'),      path: '/sales'      },
    { label: t('inventory'),  path: '/inventory'  },
    { label: t('customers'),  path: '/customers'  },
    { label: t('settings'),   path: '/settings'   },
  ];

  const currentPage = menuItems.find(item => item.path === location.pathname);
  const title       = currentPage ? currentPage.label : t('dashboard');

  const handleLogout = async () => {
    if (!window.confirm(t('logout_confirm'))) return;

    try {
      clearPacket();
      clearCategory();
      await signOut(auth);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  const toggleLanguage = () => {
    const next = currentLang === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
    localStorage.setItem('i18nextLng', next);
  };

  return (
    <header className="header">
      <div className="header-title">{title}</div>
      <div className="header-actions">
        <button className="packet-switch-pill" onClick={() => setShowSwitcher(true)}>
          <Layers size={14} />
          <span>{currentPacket ? currentPacket.nom : t('packets_global_view')}</span>
        </button>
        <div className="lang-wrapper">
          <button className="lang-select-btn" onClick={toggleLanguage}>
            <Globe size={14} className="icon-globe" />
            <span className="lang-text">{currentLang.toUpperCase()}</span>
          </button>
        </div>
        <button
          className="lang-select-btn currency-toggle-btn"
          onClick={toggleCurrency}
          title={t('currency_toggle', { defaultValue: currency === 'XOF' ? 'Afficher en Euros' : 'Afficher en Francs CFA' })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, visibility: 'visible', opacity: 1 }}
        >
          <ArrowLeftRight size={14} className="icon-globe" />
          <span className="lang-text">{currency}</span>
        </button>
        <button onClick={toggleTheme} className="action-btn theme-btn">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="notification-container">
          <button className="action-btn notification-wrapper" onClick={handleOpenNotifs}>
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <NotificationDropdown
              notifications={notifications}
              onClose={() => setShowNotifs(false)}
            />
          )}
        </div>
        <div className="user-profile-trigger" onClick={handleLogout}>
          <UserCircle size={28} strokeWidth={1.5} />
        </div>
      </div>

      {showSwitcher && <PacketSwitcherModal onClose={() => setShowSwitcher(false)} />}
    </header>
  );
};

export default Header;