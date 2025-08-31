import './css/App.css';

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SideBar from './components/Dy_guidebar.jsx';
import Dy_Home from './pages/Dy_home.jsx';
import Dy_login from './pages/Dy_login.jsx';

export default function App() {
  return (
    <Router>
      <div>
        <SideBar />
        <main>
          <Routes>
            <Route path="/" element={<Dy_Home />} />
            <Route path="/test2" element={<Dy_login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

