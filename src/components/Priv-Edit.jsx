import { CKEditor } from '@ckeditor/ckeditor5-react';
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/ToastContext.jsx';
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

export default function PrivPostEdit() {
  const { addToast } = useToast();
  const { boardId, postId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [postData, setPostData] = useState(null);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [initialContent, setInitialContent] = useState("");

  const editorRef = useRef(null);

  // 게시글 데이터 불러오기
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API.API_BASE_URL}/private/postcontent/call`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callingContentBoardId: boardId,
            calliingContentPostId: postId,
          })
        });

        if (!response.ok) {
          const toastData = {
            status: 'warning',
            message: "서버 통신 불가"
          };
          localStorage.setItem('redirectToast', JSON.stringify(toastData));
          navigate('/');
          return;
        }

        const result = await response.json();

        if (result.boardPostContentStatus) {
          const data = result.boardPostContentData;
          setPostData(data);
          setTitle(data.postTitle || "");
          setInitialContent(data.postContent || "");
          setIsPinned(data.postIsPinned || false);
          setIsAnonymous(data.postAnonymous != null);
        } else {
          const toastData = {
            status: 'error',
            message: result.boardPostContentMessage
          };
          localStorage.setItem('redirectToast', JSON.stringify(toastData));
          navigate('/board');
          return;
        }

      } catch (error) {
        const toastData = {
          status: 'error',
          message: "게시글 조회 에러"
        };
        localStorage.setItem('redirectToast', JSON.stringify(toastData));
        navigate('/board');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostData();
  }, [boardId, postId, navigate]);

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
      const updateData = {
        updateBoardId: boardId,
        updatePostId: postId,
        updateTitle: title.trim(),
        updateContent: editorContent,
        updateisPinned: isPinned,
        updateisAnonymous: isAnonymous
      };

      const response = await fetch(`${API.API_BASE_URL}/private/post/update`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        addToast("서버 통신 오류", "error");
        return;
      }

      const result = await response.json();

      if (result.updatePostStatus) {
        addToast(result.updatePostMessage || "게시글이 수정되었습니다.", "success");
        navigate(`/board`);
      } else {
        addToast(result.updatePostMessage || "게시글 수정에 실패했습니다.", "error");
      }
    } catch (error) {
      addToast("게시글 수정 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    const editorContent = editorRef.current ? editorRef.current.getData() : '';

    const hasChanges =
      title !== (postData?.postTitle || "") ||
      editorContent !== initialContent ||
      isPinned !== (postData?.postIsPinned || false) ||
      isAnonymous !== (postData?.postAnonymous != null);

    if (hasChanges) {
      if (!window.confirm("변경사항이 있습니다. 정말 취소하시겠습니까?")) {
        return;
      }

      // 새로 업로드된 이미지 삭제
      const initialImages = extractUploadedImages(initialContent);
      const currentImages = extractUploadedImages(editorContent);
      const newImages = currentImages.filter(img => !initialImages.includes(img));

      if (newImages.length > 0) {
        await fetch(`${API.API_BASE_URL}/api/upload/deleteAll`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ filenames: newImages })
        });
      }
    }

    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="board-write-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="board-write-container">
        <div className="loading-spinner">
          <p>게시글을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="board-write-container">
      <div className="board-write-header">
        <h2>게시글 수정</h2>
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
                <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" fill="currentColor" />
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
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor" />
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" fill="currentColor" opacity="0.3" />
              </svg>
              <span className="option-text">익명으로 작성</span>
              <span className="option-description">작성자가 익명으로 표시됩니다</span>
            </label>
          </div>
        </div>

        {/* 1. 데이터 로딩이 끝났을 때만 에디터를 렌더링합니다 */}
        {!isLoading && postData && (
          <div className="editor-group">
            <label className="input-label">내용</label>
            <CKEditor
              editor={ClassicEditor}

              // 2. data={initialContent} 속성은 제거! (사용자님이 하신 방식)

              onReady={(editor) => {
                editorRef.current = editor;

                // 3. 로딩이 끝난 후 렌더링되므로 initialContent는 무조건 존재합니다.
                // 여기서 딱 한 번만 데이터를 넣어줍니다.
                if (initialContent) {
                  editor.setData(initialContent);
                }
              }}

              disabled={isSubmitting}
              config={{
                addToast: addToast,
                extraPlugins: [CustomUploadAdapterPlugin],
                placeholder: "내용을 입력하세요...",
                toolbar: [
                  'heading', '|',
                  'bold', 'italic', 'strikethrough', 'link', '|',
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
        )}

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
            {isSubmitting ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}