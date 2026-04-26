// src/App.js
import AppRouter from './router/AppRouter';
// 1. Importe ton ThemeProvider (vérifie bien le chemin du fichier)
import { ThemeProvider } from './contexts/ThemeContext'; 


function App() {
  return (
    // 2. Enveloppe toute l'application ici
    <ThemeProvider>
      
        <AppRouter />
      
    </ThemeProvider>
  );
}

export default App;