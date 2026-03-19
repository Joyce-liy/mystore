import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig'; 
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import '../styles/login.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/'); 
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // --- VERIFICATION / CREATION DU PROFIL FIRESTORE ---
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Si c'est sa première fois, on crée son profil "vendeur"
        await setDoc(userDocRef, {
          email: user.email,
          role: "vendeur",
          createdAt: new Date()
        });
      }
      
      navigate('/');
    } catch (err) {
      setError("Erreur lors de la connexion Google.");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Connexion</h2>
        <p>Accédez à votre espace MyStore</p>
        
        {error && <p className="error-message" style={{color: 'red', fontSize: '14px'}}>{error}</p>}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="exemple@mail.com" required />
          </div>
          <div className="input-group">
            <label>Mot de passe</label>
            <input type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary">
            <LogIn size={18} /> Se connecter
          </button>
        </form>

        <div className="divider">ou</div>

        <button className="btn-google" onClick={handleGoogleLogin}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google logo" />
          Continuer avec Google
        </button>

        <p style={{marginTop: '20px', fontSize: '14px'}}>
          Pas de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;