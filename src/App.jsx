import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header.jsx'
import MainHome from './components/MainHome.jsx'
import Login from './components/AccountService.jsx'
import TestComponents from './components/test.jsx'
import TestComponents2 from './components/test2.jsx'

import './css/App.css'

export default function App() {
  return (
    <>
      <Router>
        <Header />

        <Routes>
          <Route path="/" element={<MainHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/test" element={<TestComponents />} />
          <Route path="/test2" element={<TestComponents2 />} />
        </Routes>
      </Router>
    </>
  )
}