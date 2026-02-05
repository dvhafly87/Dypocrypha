import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@toast-ui/react-editor';
import { useToast } from '../components/ToastContext';
import '@toast-ui/editor/dist/toastui-editor.css';
import { onUploadImage } from '../util/onUploadImage.js';
import API from '../config/apiConfig.js';

import '../css/ProjectReport.css';

export default function ProjectReport() {
    const { projectId } = useParams();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const editorRef = useRef();

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

            // 절대 URL 사용
            const videoUrl = `${API.API_BASE_URL}${data.url}`;

            // 현재 마크다운 가져오기
            const currentContent = editor.getMarkdown();

            // HTML 추가
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

    // 레포트 제출
    const handleSubmit = () => {
        const editor = editorRef.current.getInstance();
        const content = editor.getMarkdown();

        // 서버로 레포트 제출
        fetch('/api/project/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectId,
                content
            })
        })
            .then(response => response.json())
            .then(data => {
                addToast('레포트가 성공적으로 제출되었습니다.', 'success');
                navigate(`/project/${projectId}`);
            })
            .catch(error => {
                console.error('Submit failed:', error);
                addToast('레포트 제출에 실패했습니다.', 'error');
            });
    };

    return (
        <div className="report-insert-container">
            <div className="report-header">
                <h2>프로젝트 레포트 작성</h2>
            </div>

            <div className="report-editor-section">
                <div className="video-upload-section">
                    <label htmlFor="video-upload" className="video-upload-btn">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23 19C23 20.1046 22.1046 21 21 21H3C1.89543 21 1 20.1046 1 19V8C1 6.89543 1.89543 6 3 6H7L9 3H15L17 6H21C22.1046 6 23 6.89543 23 8V19Z" stroke="black" stroke-width="2" stroke-linejoin="round" />
                            <circle cx="12" cy="13" r="4" stroke="black" stroke-width="2" />
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
                        // 'wysiwyg' 버튼을 제외한 툴바
                    ]}
                    hooks={{
                        addImageBlobHook: adapter
                    }}
                    useCommandShortcut={true}
                    customHTMLSanitizer={(html) => html}
                    hideModeSwitch={true}  // ← 핵심!
                />
                <div className="report-actions">
                    <button className="btn-cancel" onClick={() => navigate(-1)}>
                        취소
                    </button>
                    <button className="btn-submit" onClick={handleSubmit}>
                        레포트 제출
                    </button>
                </div>
            </div>
        </div>
    );
}