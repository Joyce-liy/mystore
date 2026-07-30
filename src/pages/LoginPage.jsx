import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import {
  signInWithEmailAndPassword,
  signInWithPopup,        // ← FIX : popup au lieu de redirect
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupNotifications } from '../utils/fcm';
import '../styles/login.css';

const LoginPage = () => {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // FIX : onAuthStateChanged séparé, avec un flag pour ignorer
  // la navigation pendant qu'une connexion Google est en cours
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/', { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);
  // FIX : plus de getRedirectResult ici — il n'est plus nécessaire avec popup

  // ── Connexion email/mot de passe ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await setupNotifications(userCredential.user.uid);
      // navigate géré par onAuthStateChanged
    } catch (err) {
      console.error('Email login error:', err);
      setError(t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  // ── Connexion Google (popup) ──
  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result   = await signInWithPopup(auth, provider);

      // Créer le doc Firestore si premier login
      const ref     = doc(db, 'users', result.user.uid);
      const snap    = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          email:     result.user.email,
          role:      'vendeur',
          createdAt: new Date(),
        });
      }

      await setupNotifications(result.user.uid);
      // navigate géré par onAuthStateChanged
    } catch (err) {
      console.error('Google login error:', err);
      // Ignorer l'erreur si l'utilisateur a fermé la popup
      if (err.code !== 'auth/popup-closed-by-user' &&
          err.code !== 'auth/cancelled-popup-request') {
        setError(t('login_google_error'));
      }
    } finally {
      setGoogleLoading(false);
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
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>{t('login_password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            <LogIn size={16} />
            {loading ? '…' : t('login_btn')}
          </button>
        </form>

        <div className="divider">ou</div>

        <button
          className="btn-google"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading
            ? <span style={{ fontSize: '0.85rem' }}>Connexion…</span>
            : <>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  alt="Google"
                />
                {t('login_google')}
              </>
          }
        </button>

        <p>{t('login_no_account')} <Link to="/register">{t('login_register')}</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;