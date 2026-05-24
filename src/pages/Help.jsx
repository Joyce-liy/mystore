import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ShoppingCart, Package, Download, Moon, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/help.css';

const Help = () => {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState(null);

  const helpData = [
    { id: 1, icon: <ShoppingCart size={18} />, title: t('help_sales_title'),     content: t('help_sales_content')     },
    { id: 2, icon: <Package      size={18} />, title: t('help_inventory_title'), content: t('help_inventory_content') },
    { id: 3, icon: <Download     size={18} />, title: t('help_export_title'),    content: t('help_export_content')    },
    { id: 4, icon: <Moon         size={18} />, title: t('help_theme_title'),     content: t('help_theme_content')     },
  ];

  return (
    <div className="help-page-container">
      <div className="help-header">
        <HelpCircle size={40} />
        <h1>{t('help_center_title')}</h1>
        <p>{t('help_center_sub')}</p>
      </div>

      <div className="help-content">
        {helpData.map(item => (
          <div key={item.id} className={`help-card ${openSection === item.id ? 'active' : ''}`}>
            <div className="help-card-header" onClick={() => setOpenSection(openSection === item.id ? null : item.id)}>
              <div className="title-wrapper">
                {item.icon}
                <span>{item.title}</span>
              </div>
              {openSection === item.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </div>
            {openSection === item.id && (
              <div className="help-card-body"><p>{item.content}</p></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Help;