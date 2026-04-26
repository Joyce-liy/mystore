import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        translation: {
          // Menu & General
          "dashboard": "Tableau de bord",
          "sales": "Ventes",
          "inventory": "Inventaire",
          "customers": "Clients",
          "settings": "Paramètres",
          "logout": "Se déconnecter",
          "logout_confirm": "Êtes-vous sûr de vouloir vous déconnecter ?",
          
          // Page Ventes (Sales)
          "add_sale": "Ajouter une vente",
          "designation": "Désignation",
          "buy_price": "Prix d'achat",
          "sell_price": "Prix de vente",
          "transport": "Transport",
          "brand": "Marque",
          "size": "Taille",
          "profit": "Bénéfice",
          "save": "Enregistrer",
          "history": "Historique des ventes",
          "all": "Tout",
          "month": "mois",
          "week": " semaine",
          "loading": "Enregistrement...",
          "confirm_update": "Confirmer la modification"
          
        }
      },
      en: {
        translation: {
          // Menu & General
          "dashboard": "Dashboard",
          "sales": "Sales",
          "inventory": "Inventory",
          "customers": "Customers",
          "settings": "Settings",
          "logout": "Logout",
          "logout_confirm": "Are you sure you want to log out ?",
          
          // Sales Page
          "add_sale": "Add New Sale",
          "designation": "Item Name",
          "buy_price": "Buy Price",
          "sell_price": "Sell Price",
          "transport": "Shipping",
          "brand": "Brand",
          "size": "Size",
          "profit": "Profit",
          "save": "Save Sale",
          "history": "Sales History",
          "all": "All",
          "month": "This Month",
          "week": "This Week",
          "loading": "Saving...",
          "confirm_update": "Confirm Changes"
        }
      }
    },
    lng: "fr",
    fallbackLng: "fr",
    interpolation: { escapeValue: false }
  });

export default i18n;