import { CKEditor } from '@ckeditor/ckeditor5-react';
import React, { useState, useEffect, useRef} from 'react';
import {useToast} from '../components/ToastContext.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '../css/BoardWriter.css';

import API from '../config/apiConfig.js';

const extractUploadedImages = (html) => {
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const filenames = [];
    let match;
  
    while ((match = imgRegex.exec(html)) !== null) {
      const url = match[1];
      const filename = url.split('/').pop();
      filenames.push(filename);
    }
  
    return filenames;
  };

  function CustomUploadAdapter(loader, addToast) {
    return {
      upload: async () => {
        try {
          const file = await loader.file;
          const formData = new FormData();
          formData.append('image', file);

          const response = await fetch(`${API.API_BASE_URL}/api/upload/image`, {
            method: 'POST',
            credentials: 'include',
            body: formData
          });

          // 413 상태 코드 특별 처리
          if (response.status === 413) {
            addToast("파일 크기가 너무 큽니다. 더 작은 파일을 선택해주세요.", "error");
            return Promise.reject();
          }

          const data = await response.json();

          if (!data.success) {
            addToast(data.message || "이미지 업로드에 실패했습니다.", "error");
            return Promise.reject();
          }

          return {
            default: `${API.API_BASE_URL}${data.url}`
          };
          
        } catch (error) {
          if (error instanceof TypeError) {
            addToast("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.", "error");
          }
          return Promise.reject();
        }
      },
    };
  }

function CustomUploadAdapterPlugin(editor) {
  const addToast = editor.config.get('addToast');

  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return CustomUploadAdapter(loader, addToast);
  };
}



export default function BoardWrite() { 
  const { addToast } = useToast();   
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const editorRef = useRef(null);

  const handleSubmit = async () => {
    const editorContent = editorRef.current ? editorRef.current.getData() : '';

    if (!title.trim()) {
      addToast("제목을 입력해주세요.", "warning");
      return;
    }
    if (!editorContent.trim() || editorContent === '<p>&nbsp;</p>') {
      addToast("내용을 입력해주세요.", "warning");
      return;
    }
    
    const MAX_IMAGES = 20;
    const imageTagRegex = /<img\b[^>]*>/gi;
    const imageTags = editorContent.match(imageTagRegex);
    const imageCount = imageTags ? imageTags.length : 0;

    if (imageCount > MAX_IMAGES) {
      addToast(`이미지는 최대 ${MAX_IMAGES}개까지만 등록할 수 있습니다. 현재: ${imageCount}개`, "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        boardInputtitle: title.trim(),
        boardInputcontent: editorContent,
        boardInputId: boardId,
        boardInputisPinned: isPinned,
        boardInputisAnonymous: isAnonymous
      };
      
      const response = await fetch(`${API.API_BASE_URL}/board/postwrite`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });
      
      if(!response.ok) {
        const toastData = {
            status: 'warning',
            message: "서버 통신 불가"
          };
          localStorage.setItem('redirectToast', JSON.stringify(toastData));
          navigate('/');
          return;
      }

      const result = await response.json();

      if(result.boardPostWriteStatus){
        addToast(result.boardPostWriteMessage, "success")
        navigate(-1);
      } else {
        const toastData = {
            status: 'warning',
            message: result.boardPostWriteMessage
        };
        localStorage.setItem('redirectToast', JSON.stringify(toastData));
        navigate('/board');
        return;
      }
    } catch (error) {
        const toastData = {
            status: 'warning',
            message: "서버 통신 불가"
          };
          localStorage.setItem('redirectToast', JSON.stringify(toastData));
          setIsSubmitting(false);
          navigate('/');
          return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    const editorContent = editorRef.current ? editorRef.current.getData() : '';
    
    if (title.trim() || (editorContent.trim() && editorContent !== '<p>&nbsp;</p>')) {
      if (!window.confirm("작성 내용이 있습니다. 정말 취소하시겠습니까?"))
        return;
  
      const filenames = extractUploadedImages(editorContent);
  
      if (filenames.length > 0) {
        await fetch(`${API.API_BASE_URL}/api/upload/deleteAll`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ filenames })
        });
      }
  
      navigate(-1);
    } else {
      navigate(-1);
    }
  };

    useEffect(() => {
      const LoginChecker = async () => {
        try {
          const response = await fetch(`${API.API_BASE_URL}/member/login/checker`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
  
          if(!response.ok){
            const toastData = {
              status: 'warning',
              message: "서버 통신 불가"
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
            return;
          }
          const result = await response.json();

          if(!result.isLogined){
            const toastData = {
                status: 'warning',
                message: "로그인이 필요합니다."
              };
              localStorage.setItem('redirectToast', JSON.stringify(toastData));
              navigate('/');
              return;
          }
  
        } catch (error) {
          const toastData = {
            status: 'warning',
            message: "게시판 조회 불가"
          };
          localStorage.setItem('redirectToast', JSON.stringify(toastData));
          navigate('/');
        }
      };
      
      LoginChecker();
    }, []);
      
  return (
    <div className="board-write-container">
      <div className="board-write-header">
        <h2>게시글 작성</h2>
      </div>
      
      <div className="board-writemain-container">
        <div className="input-group">
          <label htmlFor="post-title" className="input-label">제목</label>
          <input 
            id="post-title"
            type="text"
            placeholder="제목을 입력하세요"
            autoComplete='off'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            disabled={isSubmitting}
          />
          <span className="char-count">{title.length}/100</span>
        </div>

        {/* 옵션 영역 */}
        <div className="options-group">
          <div className="option-item">
            <input
              type="checkbox"
              id="pinned-option"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              disabled={isSubmitting}
            />
            <label htmlFor="pinned-option" className="option-label">
              <svg className="option-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" fill="currentColor"/>
              </svg>
              <span className="option-text">게시글 고정</span>
              <span className="option-description">게시판 상단에 고정됩니다</span>
            </label>
          </div>

          <div className="option-item">
            <input
              type="checkbox"
              id="anonymous-option"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              disabled={isSubmitting}
            />
            <label htmlFor="anonymous-option" className="option-label">
              <svg className="option-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" fill="currentColor" opacity="0.3"/>
              </svg>
              <span className="option-text">익명으로 작성</span>
              <span className="option-description">작성자가 익명으로 표시됩니다</span>
            </label>
          </div>
        </div>

        <div className="editor-group">
          <label className="input-label">내용</label>
          <CKEditor
            editor={ClassicEditor}
            onReady={(editor) => {
              editorRef.current = editor;
            }}
            disabled={isSubmitting}
            config={{
              addToast: addToast,
              extraPlugins: [CustomUploadAdapterPlugin],
              placeholder: "내용을 입력하세요...",
              toolbar: [
                'heading', '|',
                'bold', 'italic', 'link', '|',
                'bulletedList', 'numberedList', '|',
                'blockQuote', 'insertTable', '|',
                'imageUpload', '|',
                'undo', 'redo'
              ],
              image: {
                toolbar: [
                  'imageTextAlternative', '|',
                  'imageStyle:inline',
                  'imageStyle:block',
                  'imageStyle:side'
                ],
                styles: [
                  'inline', 'block', 'side'
                ]
              },
              table: {
                contentToolbar: [
                  'tableColumn', 'tableRow', 'mergeTableCells'
                ]
              }
            }}
          />
        </div>

        <div className="button-group">
          <button
            className="btn-cancel"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}