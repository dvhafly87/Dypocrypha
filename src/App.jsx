import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext.jsx';

import Header from './components/Header.jsx'
import MainHome from './components/MainHome.jsx'
import Login from './components/AccountService.jsx'
import Register from './components/Register.jsx'
import TestComponents from './components/test.jsx'
import TestComponents2 from './components/test2.jsx'

import './css/App.css'

export default function App() {
  return (
    <>
    <ToastProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<MainHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/test" element={<TestComponents />} />
          <Route path="/test2" element={<TestComponents2 />} />
        </Routes>
      </Router>
    </ToastProvider>
    </>
  )
}