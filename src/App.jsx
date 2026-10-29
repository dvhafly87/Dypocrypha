import { createBrowserRouter, createRoutesFromElements, RouterProvider, Outlet, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ToastContext.jsx';

import Header from './components/Header.jsx';
import ThemeController from './components/ThemeController.jsx';
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

import MyPage from './components/MyPage.jsx';

import MyContent from './components/MyPage/MyContent.jsx';
import MyPassword from './components/MyPage/MyPasswordChange.jsx';
import MyPasswordCheck from './components/MyPage/MyPasswordCheck.jsx';
import MyProfile from './components/MyPage/MyProfile.jsx';
import MyWithdraw from './components/MyPage/MyWithDraw.jsx';

import PlayerProvider from './components/ToolBar/PlayerProvider.jsx';
import QuickToolbar from './components/ToolBar/QuickToolbar.jsx';

import './css/App.css'

function EditorRoute({ component: Component }) {
  const location = useLocation();
  return <Component key={location.pathname} />;
}
function ApplicationLayout() {
  return <ToastProvider><AuthProvider><Header /><Outlet /></AuthProvider></ToastProvider>;
}
const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<ApplicationLayout />}>

                <Route path="/" element={<MainHome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/boards" element={<Board />} />
                <Route path="/boardsPost/:boardName/:boardId/:postId" element={<BoardPost />} />
                <Route path="/boardsWriter/:boardId" element={<EditorRoute component={BoardWriter} />} />
                <Route path="/boardsEdit/:boardId/:postId" element={<EditorRoute component={PostEdit} />} />

                <Route path="/privatewriter/:boardId" element={<EditorRoute component={PrivateWriter} />} />
                <Route path="/privatePost/:boardName/:boardId/:postId" element={<PrivatePost />} />
                <Route path="/privateEdit/:boardId/:postId" element={<EditorRoute component={PrivEdit} />} />

                <Route path="/resetPassword" element={<ResetPassword />} />
                <Route path="/token" element={<TokenWrapper />} />




                <Route path="/projects" element={<ProjectHome />} />
                <Route path="/projects/manage/:projectId" element={<ProjectManage />} />
                <Route path="/projects/report/update/:reportId/:projectId" element={<ReportEditor />} />
                <Route path="/projects/complete/report/:projectId" element={<ProjectReport />} />

                <Route path="/archives" element={<Archive />} />
                <Route path="/archives/fileSelect/:fileUuid" element={<ArchiveContent />} />
                <Route path="/archives/upload" element={<ArchiveUpload />} />

                <Route path="/all/search/:searchAllKey" element={<SearchAllFunction />} />

                <Route path="/mypage" element={<MyPage />}>
                  <Route path="profile" element={<MyProfile />} />
                  <Route path="password" element={<MyPasswordCheck />} />
                  <Route path="password/change" element={<MyPassword />} />
                  <Route path="content" element={<MyContent />} />
                  <Route path="withdraw" element={<MyWithdraw />} />
                </Route>
              
  </Route>
), { basename: import.meta.env.VITE_ROUTER_BASE || '/' });
export default function App() {
  return <><ThemeController /><RouterProvider router={router} /></>;
}
