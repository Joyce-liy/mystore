import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupNotifications } from '../utils/fcm'; // Importation de la fonction FCM
import '../styles/login.css';

const LoginPage = () => {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/', { replace: true });
      }
    });

    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result) return;

        const ref = doc(db, 'users', result.user.uid);
        if (!(await getDoc(ref)).exists()) {
          await setDoc(ref, {
            email: result.user.email,
            role: 'vendeur',
            createdAt: new Date()
          });
        }

        await setupNotifications(result.user.uid);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Google redirect result error:', err);
        setError(err.message || t('login_google_error'));
      }
    };

    checkRedirectResult();
    return () => unsubscribe();
  }, [navigate, t]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await setupNotifications(userCredential.user.uid);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Email login error:', err);
      setError(err.message || t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (err) { 
      console.error('Google redirect error:', err);
      setError(err.message || t('login_google_error')); 
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>{t('login_title')}</h2>
        <p>{t('login_sub')}</p>

        {error && <p className="error-message">{error}</p>}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>{t('login_email')}</label>
            <input
              type="email"
              placeholder="exemple@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>{t('login_password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            <LogIn size={16} /> {t('login_btn')}
          </button>
        </form>

        <div className="divider">ou</div>

        <button className="btn-google" onClick={handleGoogleLogin}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
          {t('login_google')}
        </button>

        <p>{t('login_no_account')} <Link to="/register">{t('login_register')}</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;