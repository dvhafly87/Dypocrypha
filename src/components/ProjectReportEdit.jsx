import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@toast-ui/react-editor';
import { useToast } from '../components/ToastContext';
import '@toast-ui/editor/dist/toastui-editor.css';
import { onUploadImage } from '../util/onUploadImage.js';
import { useAuth } from '../context/AuthContext.jsx';
import API from '../config/apiConfig.js';

import '../css/ReportEdit.css';

export default function ReportEditor() {
    const { reportId, projectId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { logout } = useAuth();
    const editorRef = useRef();

    const [reportTitle, setReportTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── 이미지 업로드 어댑터 (등록 페이지와 동일) ────────
    const adapter = async (blob, callback) => {
        const uploader = onUploadImage({
            blob,
            projectValue: false,
            projectReportValue: true,
            onSuccess: ({ default: url }) => {
                callback(url, 'image');
            },
            onError: (err) => {
                console.error(err);
                addToast(err.message, 'error');
            }
        });
        await uploader.upload();
    };

    // ── 영상 업로드 (등록 페이지와 동일 방식 - 에디터에 삽입) ──
    const handleVideoUpload = async (e) => {
        e.preventDefault();
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            addToast('동영상 파일만 업로드 가능합니다', 'error');
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            addToast('파일 크기는 100MB를 초과할 수 없습니다', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('video', file);
        formData.append('projectId', projectId);

        try {
            const response = await fetch(`${API.API_BASE_URL}/api/upload/video`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                addToast('동영상 업로드에 실패했습니다.', 'error');
                return;
            }

            const data = await response.json();
            const editor = editorRef.current.getInstance();
            const videoUrl = `${API.API_BASE_URL}${data.url}`;
            const currentContent = editor.getMarkdown();
            const videoHtml = `

<video controls width="100%" style="max-width: 800px;">
  <source src="${videoUrl}" type="${file.type}">
  Your browser does not support the video tag.
</video>

`;
            editor.setMarkdown(currentContent + videoHtml);
            addToast('동영상이 업로드되었습니다.', 'success');

        } catch (error) {
            console.error('Video upload failed:', error);
            addToast('동영상 업로드에 실패했습니다.', 'error');
        }
    };

    // ── 기존 레포트 데이터 불러오기 ───────────────────────
    useEffect(() => {
        if (!reportId || !projectId) {
            setLoading(false);
            return;
        }

        const fetchReportData = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/report/edit`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId, reportId })
                });

                const result = await response.json();

                if (response.status === 500) {
                    const toastData = { status: 'error', message: result.reportEditMessage || '서버 통신 불가' };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/');
                    return;
                }
                if (response.status === 400 || response.status === 404 || response.status === 403) {
                    const toastData = { status: 'error', message: result.reportEditMessage || '유효하지 않은 요청입니다' };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    logout();
                    navigate('/');
                    return;
                }
                if (response.status === 401) {
                    const toastData = { status: 'error', message: '로그인이 필요합니다.' };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/login');
                    return;
                }
                if (response.status === 200 && result.reportEditStatus && result.MainReport) {
                    const report = result.MainReport;
                    setReportTitle(report.reportTitle || '');
                    // 에디터 마운트 후 내용 세팅
                    setTimeout(() => {
                        editorRef.current
                            ?.getInstance()
                            ?.setMarkdown(report.reportContent || '');
                    }, 0);
                }
            } catch (error) {
                console.error('Fetch report error:', error);
                const toastData = { status: 'error', message: '네트워크 오류가 발생했습니다' };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [reportId, projectId]);

    // ── 수정 제출 ─────────────────────────────────────────
    const handleSubmit = async () => {
        if (!reportTitle || reportTitle.trim().length === 0) {
            addToast('제목을 입력해주세요', 'error');
            return;
        }
        if (reportTitle.length > 50) {
            addToast('제목은 50자를 초과할 수 없습니다', 'error');
            return;
        }

        const editor = editorRef.current.getInstance();
        const content = editor.getMarkdown();

        if (!content) {
            addToast('내용을 입력해주세요', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API.API_BASE_URL}/project/report/update`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId,
                    projectId,
                    reportTitle,
                    content
                })
            });

            const result = await response.json();

            if (response.status === 500) {
                const toastData = { status: 'error', message: result.reportUpdateMessage || '서버 통신 불가' };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            } else if (response.status === 400 || response.status === 404) {
                addToast(result.reportUpdateMessage || '수정에 실패했습니다.', 'error');
                return;
            } else if (response.status === 401) {
                const toastData = { status: 'warning', message: result.reportUpdateMessage || '로그인이 필요한 서비스입니다.' };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/login');
                return;
            } else if (response.status === 403) {
                addToast(result.reportUpdateMessage || '권한이 없습니다.', 'error');
                return;
            } else if (response.ok && result.reportUpdateStatus) {
                const toastData = { status: 'success', message: result.reportUpdateMessage || '수정되었습니다' };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate(`/project/manage/${projectId}`);
                return;
            } 
        } catch (error) {
            addToast('레포트 수정 중 오류가 발생했습니다.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── 로딩 중 ───────────────────────────────────────────
    if (loading) {
        return (
            <div className="report-insert-container">
                <div className="report-editor-loading">
                    <div className="loading-spinner" />
                    <p>레포트 정보를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    // ── 렌더링 ────────────────────────────────────────────
    return (
        <div className="report-insert-container">
            {/* 헤더 - 등록 페이지와 동일 구조 */}
            <div className="report-header">
                <h2>프로젝트 레포트 수정</h2>
            </div>

            {/* 에디터 섹션 - 등록 페이지와 동일 구조 */}
            <div className="report-editor-section">

                {/* 영상 업로드 - 등록 페이지와 동일 */}
                <div className="video-upload-section">
                    <label htmlFor="video-upload" className="video-upload-btn">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23 19C23 20.1046 22.1046 21 21 21H3C1.89543 21 1 20.1046 1 19V8C1 6.89543 1.89543 6 3 6H7L9 3H15L17 6H21C22.1046 6 23 6.89543 23 8V19Z" stroke="black" strokeWidth="2" strokeLinejoin="round" />
                            <circle cx="12" cy="13" r="4" stroke="black" strokeWidth="2" />
                            <circle cx="19" cy="9" r="1" fill="black" />
                        </svg>
                    </label>
                    <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        style={{ display: 'none' }}
                    />
                    <span className="upload-info">동영상을 업로드하면 에디터에 자동으로 삽입됩니다.</span>
                </div>

                {/* 제목 입력 */}
                <input
                    type="text"
                    className="report-title-input"
                    placeholder="제목을 입력하세요 ... "
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    maxLength={50}
                />

                {/* 마크다운 에디터 */}
                <Editor
                    ref={editorRef}
                    initialValue=""
                    initialEditType="markdown"
                    previewStyle="vertical"
                    height="600px"
                    toolbarItems={[
                        ['heading', 'bold', 'italic', 'strike'],
                        ['hr', 'quote'],
                        ['ul', 'ol', 'task', 'indent', 'outdent'],
                        ['table', 'image', 'link'],
                        ['code', 'codeblock']
                    ]}
                    hooks={{ addImageBlobHook: adapter }}
                    useCommandShortcut={true}
                    customHTMLSanitizer={(html) => html}
                    hideModeSwitch={true}
                />

                {/* 하단 버튼 - 등록 페이지와 동일 위치/구조 */}
                <div className="report-actions">
                    <button className="btn-cancel" onClick={() => navigate(-1)} disabled={isSubmitting}>
                        취소
                    </button>
                    <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? '수정 중...' : '레포트 수정'}
                    </button>
                </div>
            </div>
        </div>
    );
}