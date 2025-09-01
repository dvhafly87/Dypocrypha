import './css/App.css';

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import GuideBar from './components/Dy_guidebar.jsx';
import Dy_Home from './pages/Dy_home.jsx';
import Dy_login from './pages/Dy_login.jsx';
import Dy_funiture1 from './pages/Dy_Funiture1.jsx';
import Dy_funiture2 from './pages/Dy_Funitrue2.jsx';

export default function App() {
  return (
    <Router>
      <div>
        <GuideBar />
        <main>
          <Routes>
            <Route path="/" element={<Dy_Home />} />
            <Route path="/test2" element={<Dy_login />} />
            <Route path="/funiture1" element={<Dy_funiture1 />} />
            <Route path="/funiture2" element={<Dy_funiture2 />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

