import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { useAuthStore } from './store/authStore';
import { socket } from './socket';
import './index.css'


function App() {
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      socket.auth = { token };
      socket.connect();
    } else {
      socket.disconnect();
    }
    
    return () => {
      socket.disconnect();
    };
  }, [token]);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!token ? <Auth /> : <Navigate to="/" />} />
        <Route path="/" element={token ? <Dashboard /> : <Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}

export default App;
