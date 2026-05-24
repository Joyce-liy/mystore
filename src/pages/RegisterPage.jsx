import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import '../styles/login.css';

const RegisterPage = () => {
  const navigate    = useNavigate();
  const { t }       = useTranslation();
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const data = new FormData(e.currentTarget);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.get('email'), data.get('password'));
      await setDoc(doc(db, 'users', cred.user.uid), { email: cred.user.email, role: 'vendeur', createdAt: new Date() });
      navigate('/');
    } catch (err) {
      const map = {
        'auth/weak-password':       t('register_error_weak'),
        'auth/email-already-in-use': t('register_error_exists'),
        'auth/invalid-email':       t('register_error_invalid'),
      };
      setError(map[err.code] || t('register_error_default'));
    } finally { setLoading(false); }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>{t('register_title')}</h2>
        <p>{t('register_sub')}</p>

        {error && <p className="error-message">{error}</p>}

        <form className="login-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label>{t('login_email')}</label>
            <input name="email" type="email" placeholder="exemple@mail.com" required />
          </div>
          <div className="input-group">
            <label>{t('login_password')}</label>
            <input name="password" type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('register_loading') : t('register_btn')}
          </button>
        </form>

        <p>{t('register_has_account')} <Link to="/login">{t('register_login')}</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;