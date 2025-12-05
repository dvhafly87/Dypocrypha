import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './components/ToastContext.jsx';

import Header from './components/Header.jsx'
import MainHome from './components/MainHome.jsx'
import Login from './components/AccountService.jsx'
import Register from './components/Register.jsx'
import Board from './components/Board.jsx'
import TestComponents2 from './components/test2.jsx'
import ResetPassword from './components/ResetPassword.jsx'
import BoardWriter from './util/BoardWriterFileUpload.jsx';
import BoardPost from './components/Board-Post-Content.jsx'


import TokenWrapper from './Accesswrapper/ResetTokenWrapper.jsx'

import './css/App.css'

export default function App() {
  return (
    <>
      <Router>
          <ToastProvider>
            <AuthProvider>
                <Header />
                <Routes>
                  <Route path="/" element={<MainHome />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/board" element={<Board />} />
                  <Route path="/test2" element={<TestComponents2 />} />
                  <Route path="/resetPassword" element={<ResetPassword />} />
                  <Route path="/token" element={<TokenWrapper />} />
                  <Route path="/boardwriter/:boardId" element={<BoardWriter />} />
                  <Route path="/boardPost/:boardId/:postId" element={<BoardPost />} />
                </Routes>
            </AuthProvider>
          </ToastProvider>
      </Router>
    </>
  )
}