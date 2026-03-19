import React, { useState } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { useNavigate, Link } from 'react-router-dom';
import '../styles/login.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Utilisation de FormData pour éviter les erreurs d'index e.target[0]
    const data = new FormData(e.currentTarget);
    const email = data.get('email');
    const password = data.get('password');

    try {
      // 1. Création dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Création du profil dans Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "vendeur",
        createdAt: new Date()
      });

      navigate('/');
    } catch (err) {
      console.error("Code erreur Firebase :", err.code);
      
      // Gestion précise des messages d'erreur
      switch (err.code) {
        case 'auth/weak-password':
          setError("Le mot de passe est trop court (6 caractères minimum).");
          break;
        case 'auth/email-already-in-use':
          setError("Cet email est déjà utilisé par un autre compte.");
          break;
        case 'auth/invalid-email':
          setError("Le format de l'email n'est pas valide.");
          break;
        default:
          setError("Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Créer un compte</h2>
        <p>Rejoignez MyStore aujourd'hui</p>
        
        {error && <p className="error-box" style={{color: 'white', background: '#ef4444', padding: '10px', borderRadius: '5px', fontSize: '13px', marginBottom: '15px'}}>{error}</p>}
        
        <form className="login-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label>Email</label>
            <input 
              name="email" 
              type="email" 
              placeholder="votre@email.com" 
              required 
            />
          </div>
          <div className="input-group">
            <label>Mot de passe</label>
            <input 
              name="password" 
              type="password" 
              placeholder="Minimum 6 caractères" 
              required 
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Chargement..." : "S'inscrire"}
          </button>
        </form>
        
        <p style={{marginTop: '20px', fontSize: '14px'}}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;