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

    const data = new FormData(e.currentTarget);
    const email = data.get('email');
    const password = data.get('password');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "vendeur",
        createdAt: new Date()
      });

      navigate('/');
    } catch (err) {
      console.error("Code erreur Firebase :", err.code);
      switch (err.code) {
        case 'auth/weak-password':
          setError("Le mot de passe est trop faible (min. 6 caractères)");
          break;
        case 'auth/email-already-in-use':
          setError("Cet email est déjà utilisé");
          break;
        case 'auth/invalid-email':
          setError("Email invalide");
          break;
        default:
          setError("Erreur lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Inscription</h2>
        <p>Créez votre compte gratuitement</p>

        {error && <p className="error-message">{error}</p>}

        <form className="login-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="exemple@mail.com"
              required
            />
          </div>
          <div className="input-group">
            <label>Mot de passe</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Inscription en cours…" : "Créer mon compte"}
          </button>
        </form>

        <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;