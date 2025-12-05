import { CKEditor } from '@ckeditor/ckeditor5-react';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '../css/BoardWriter.css';

import API from '../config/apiConfig.js';

function Base64UploadAdapter(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return {
      upload: () => {
        return loader.file.then(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({ default: reader.result });
              };
              reader.onerror = (error) => {
                reject(error);
              };
              reader.readAsDataURL(file);
            })
        );
      },
      abort: () => {},
    };
  };
}

export default function BoardWrite() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!content.trim() || content === '<p>&nbsp;</p>') {
      alert("내용을 입력해주세요.");
      return;
    }
    const MAX_IMAGES = 20;

    // <img ...> 태그를 찾는 정규 표현식 (Base64 인코딩된 이미지 포함)
    const imageTagRegex = /<img\b[^>]*>/gi;
    const imageTags = content.match(imageTagRegex);
    const imageCount = imageTags ? imageTags.length : 0;

    if (imageCount > MAX_IMAGES) {
      alert(`이미지는 최대 ${MAX_IMAGES}개까지만 등록할 수 있습니다. 현재: ${imageCount}개`);
      return; // 등록 프로세스를 중단합니다.
    }

    setIsSubmitting(true);
    
    try {
      const postData = {
        boardInputtitle: title.trim(),
        boardInputcontent: content,
        boardInputId: boardId,
      };

      console.log("등록할 데이터:", postData);
      
      const response = await fetch(`${API.API_BASE_URL}/board/postwrite`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });
      
      alert("게시글이 등록되었습니다!");
      navigate(-1);
    } catch (error) {
      console.error("등록 중 오류:", error);
      alert("게시글 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || (content.trim() && content !== '<p>&nbsp;</p>')) {
      if (window.confirm("작성 중인 내용이 있습니다. 정말 취소하시겠습니까?")) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            disabled={isSubmitting}
          />
          <span className="char-count">{title.length}/100</span>
        </div>

        <div className="editor-group">
          <label className="input-label">내용</label>
          <CKEditor
            editor={ClassicEditor}
            data={content}
            onChange={(event, editor) => {
              const data = editor.getData();
              setContent(data);
            }}
            disabled={isSubmitting}
            config={{
              extraPlugins: [Base64UploadAdapter],
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