import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import '../styles/notification.css';

const NotificationDropdown = ({ notifications, onClose }) => {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'fr' ? fr : enUS;

  return (
    <div className="notif-dropdown">
      <div className="notif-header">
        <h3>{t('notifications_title', 'Notifications')}</h3>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <p className="notif-empty">
            {t('no_notifications', 'Aucune notification')}
          </p>
        ) : (
          notifications.map((n) => {
            // Sécurité : Remplacer les variables si elles existent encore dans le texte
            let displayMessage = n.message || "";
            if (n.name) displayMessage = displayMessage.replace("{name}", n.name);
            if (n.price) displayMessage = displayMessage.replace("{price}", n.price);

            return (
              <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                <div className="notif-content">
                  <p className="notif-msg-title">{n.title}</p>
                  <p className="notif-msg-body">{displayMessage}</p>
                  <span className="notif-time">
                    {/* Sécurité : Vérifier que createdAt et toDate existent (Firestore Sync) */}
                    {n.createdAt && typeof n.createdAt.toDate === 'function'
                      ? formatDistanceToNow(n.createdAt.toDate(), {
                          addSuffix: true,
                          locale: currentLocale,
                        })
                      : t('just_now', 'À l’instant')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;