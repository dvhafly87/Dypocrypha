import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ToastContext.jsx';

import Header from './components/Header.jsx';
import MainHome from './components/MainHome.jsx';
import Login from './components/AccountService.jsx';
import Register from './components/Register.jsx';
import Board from './components/Board.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import BoardWriter from './util/BoardWriterFileUpload.jsx';

import PrivatePost from './components/Private-Post-Content.jsx';
import BoardPost from './components/Board-Post-Content.jsx';

import PostEdit from './components/Post-Edit.jsx';
import PrivEdit from './components/Priv-Edit.jsx';

import ProjectHome from './components/ProjectHome.jsx';
import ProjectManage from './components/ProjectManage.jsx';
import ProjectReport from './components/ProjectReport';

import PrivateWriter from './util/Private-Board-Content.jsx';
import ReportEditor from './components/ProjectReportEdit.jsx';


import TokenWrapper from './Accesswrapper/ResetTokenWrapper.jsx'

import Archive from './components/Archive.jsx';
import ArchiveUpload from './components/ArchiveUpload.jsx';
import ArchiveContent from './components/UploadFileContent.jsx';

import SearchAllFunction from './components/SearchAllKeyword.jsx';

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
              <Route path="/resetPassword" element={<ResetPassword />} />
              <Route path="/token" element={<TokenWrapper />} />

              <Route path="/boardwriter/:boardId" element={<BoardWriter />} />
              <Route path="/privatewriter/:boardId" element={<PrivateWriter />} />

              <Route path="/boardPost/:boardName/:boardId/:postId" element={<BoardPost />} />
              <Route path="/privatePost/:boardName/:boardId/:postId" element={<PrivatePost />} />

              <Route path="/boardEdit/:boardId/:postId" element={<PostEdit />} />
              <Route path="/privateEdit/:boardId/:postId" element={<PrivEdit />} />

              <Route path="/project" element={<ProjectHome />} />
              <Route path="/project/manage/:projectId" element={<ProjectManage />} />
              <Route path="/project/report/update/:reportId/:projectId" element={<ReportEditor />} />
              <Route path="/project/complete/report/:projectId" element={<ProjectReport />} />

              <Route path="/archive" element={<Archive />}/>
              <Route path="/archive/fileSelect/:fileUuid" element={<ArchiveContent/>} />
              <Route path="/archive/upload" element={<ArchiveUpload />} />

              <Route path="/all/search/:searchAllKey" element={<SearchAllFunction/>}/>

            </Routes>
          </AuthProvider>
        </ToastProvider>
      </Router>
    </>
  )
}