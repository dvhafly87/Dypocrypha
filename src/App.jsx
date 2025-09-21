import './css/App.css';

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import GuideBar from './components/Dy_guidebar.jsx';
import Dy_Home from './pages/Dy_home.jsx';
import Dy_login from './pages/Dy_login.jsx';
import Dy_funiture1 from './pages/Dy_Funiture1.jsx';
import Dy_funiture2 from './pages/Dy_Funiture2.jsx';
import Dy_funiture3 from './pages/Dy_Funiture3.jsx';
import Dy_register from './pages/Dy_Register.jsx';

function AppContent() {
  const location = useLocation();
  const shouldShowHeader = location.pathname !== '/register';

  return (
    <div>
      {shouldShowHeader && <GuideBar />}
      <main>
        <Routes>
          <Route path="/" element={<Dy_Home />} />
          <Route path="/login" element={<Dy_login />} />
          <Route path="/funiture1" element={<Dy_funiture1 />} />
          <Route path="/funiture2" element={<Dy_funiture2 />} />
          <Route path="/funiture3" element={<Dy_funiture3 />} />
          <Route path="/register" element={<Dy_register />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

