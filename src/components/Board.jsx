import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import BoardPost from '../components/Board-Content.jsx';
import BoardAccessWrapper from '../Accesswrapper/BoardAccessWrapper.jsx';

import API from '../config/apiConfig.js';
import SIC from '../img/sic.jpg';

import '../css/BoardMain.css';

const storageWithExpiry = {
  setItem: (key, value) => {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + (2 * 60 * 60 * 1000)
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  getItem: (key) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = new Date();

      if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch (e) {
      return itemStr;
    }
  },

  removeItem: (key) => {
    localStorage.removeItem(key);
  }
};

export default function BoardMain() {
  const BOARD_ID_KEY = 'selectedBoardId';
  const BOARD_NAME_KEY = 'selectedBoardName';
  const BOARD_PTD_KEY = 'selectedBoardPtd';
  const BOARD_DEC_KEY = 'selectedBoardDec';
  const navigate = useNavigate();
  const [boardChoice, setBoardChoice] = useState();
  const [boardChoiceName, setBoardChoiceName] = useState();
  const [boardChoiceProtect, setBoardChoiceProtect] = useState(false);
  const [boardChoiceDescription, setBoardChoiceDescription] = useState();
  const [boardList, setBoardList] = useState([]);
  const [filteredBoardList, setFilteredBoardList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();
  const { isLogined } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [boardPassword, setBoardPassword] = useState('');

  const [isNarrowScreen, setIsNarrowScreen] = useState(window.innerWidth <= 1300);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    const storedToastData = localStorage.getItem('redirectToast');
    if (storedToastData) {
      try {
        const toastData = JSON.parse(storedToastData);
        addToast(toastData.message, toastData.status);
        localStorage.removeItem('redirectToast');
      } catch (error) {
        console.error("Failed to parse redirectToast from localStorage:", error);
        localStorage.removeItem('redirectToast');
      }
    }
  }, [addToast]);

  useEffect(() => {
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth <= 1300);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const boardListCalling = async () => {
      try {

        const response = await fetch(`${API.API_BASE_URL}/board/listcalling`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
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

        if (result.boardListresult) {
          setBoardList(result.boardList);
          setFilteredBoardList(result.boardList);

          const savedBoardId = storageWithExpiry.getItem(BOARD_ID_KEY);
          const savedBoardName = storageWithExpiry.getItem(BOARD_NAME_KEY);
          const savedBoardPtd = storageWithExpiry.getItem(BOARD_PTD_KEY);
          const savedBoardDec = storageWithExpiry.getItem(BOARD_DEC_KEY);

          if (savedBoardId) {
            setBoardChoice(parseInt(savedBoardId, 10));
            setBoardChoiceName(savedBoardName);
            setBoardChoiceDescription(savedBoardDec || '');

            let protectValue = false;
            if (savedBoardPtd === 'true' || savedBoardPtd === '1') {
              protectValue = true;
            } else if (savedBoardPtd === 'false' || savedBoardPtd === '0') {
              protectValue = false;
            } else {
              protectValue = parseInt(savedBoardPtd, 10) === 1;
            }
            setBoardChoiceProtect(protectValue);
          }
        } else {
          const toastData = {
            status: 'warning',
            message: "게시판 조회 에러"
          };
          localStorage.setItem('redirectToast', JSON.stringify(toastData));
          navigate('/');
        }
      } catch (error) {
        console.error('에러 발생:', error);
        const toastData = {
          status: 'warning',
          message: "게시판 조회 불가"
        };
        localStorage.setItem('redirectToast', JSON.stringify(toastData));
        navigate('/');
      }
    };
    boardListCalling();
  }, [navigate, addToast]);

  // 검색 필터링 로직
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBoardList(boardList);
    } else {
      const filtered = boardList.filter(board =>
        board.boardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (board.boardDescription && board.boardDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
        board.boardCreator.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBoardList(filtered);
    }
  }, [searchQuery, boardList]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (filteredBoardList.length === 0) {
      addToast("검색 결과가 없습니다", "warning");
    } else if (filteredBoardList.length === 1) {
      const board = filteredBoardList[0];
      boardChoicer(board.boardPriId, board.boardName, board.boardProtected, board.boardDec);
      addToast(`"${board.boardName}" 게시판으로 이동합니다`, "success");
    } else {
      addToast(`${filteredBoardList.length}개의 게시판을 찾았습니다`, "success");
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setFilteredBoardList(boardList);
  };

  const addNewBoard = () => {
    if (!isLogined) {
      addToast("로그인이 필요합니다", "warning");
    } else {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBoardName('');
    setBoardDescription('');
    setIsPasswordProtected(false);
    setBoardPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(`${API.API_BASE_URL}/board/newBoard`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addBoardName: boardName,
        addBoardDescription: boardDescription,
        addBoardProtected: isPasswordProtected,
        addBoardPassword: boardPassword
      })
    });

    if (!response.ok) {
      const toastData = {
        status: 'warning',
        message: "서버 통신 불가"
      };
      localStorage.setItem('redirectToast', JSON.stringify(toastData));
      navigate('/');
    }

    const result = await response.json();

    if (result.boardStatus) {
      addToast(result.boardMessage, "success");
      closeModal();
      const listResponse = await fetch(`${API.API_BASE_URL}/board/listcalling`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const listResult = await listResponse.json();
      if (listResult.boardListresult) {
        setBoardList(listResult.boardList);
        setFilteredBoardList(listResult.boardList);
      }
    } else {
      addToast(result.boardMessage, "warning");
      closeModal();
    }
  };

  const openDeleteModal = (board, e) => {
    e.stopPropagation();
    if (!isLogined) {
      addToast("로그인이 필요합니다", "warning");
      return;
    }
    setBoardToDelete(board);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBoardToDelete(null);
    setDeletePassword('');
  };

  const boardChoicer = (id, name, ptd, dec) => {
    let newId, newName, newPtd, newDec;

    if (id === boardChoice) {
      newId = null;
      newName = null;
      newPtd = null;
      newDec = null;
    } else {
      newId = id;
      newName = name;
      newPtd = ptd;
      newDec = dec;
    }

    setBoardChoice(newId);
    setBoardChoiceName(newName);
    setBoardChoiceProtect(newPtd);
    setBoardChoiceDescription(newDec);

    if (newId !== null) {
      storageWithExpiry.setItem(BOARD_ID_KEY, newId.toString());
      storageWithExpiry.setItem(BOARD_NAME_KEY, newName);
      storageWithExpiry.setItem(BOARD_PTD_KEY, newPtd.toString());
      storageWithExpiry.setItem(BOARD_DEC_KEY, newDec || '');  // ← 추가
    } else {
      storageWithExpiry.removeItem(BOARD_ID_KEY);
      storageWithExpiry.removeItem(BOARD_NAME_KEY);
      storageWithExpiry.removeItem(BOARD_PTD_KEY);
      storageWithExpiry.removeItem(BOARD_DEC_KEY);  // ← 추가
    }

    if (window.innerWidth <= 600 && id !== null) {
      setTimeout(() => {
        document.querySelector('.board-main-container-choice')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    let response;

    if (boardToDelete.boardProtected) {
      response = await fetch(`${API.API_BASE_URL}/private/deleteBoard`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deleteBoardId: boardToDelete.boardPriId,
          deleteBoardName: boardToDelete.boardName,
          deleteBoardCreator: boardToDelete.boardCreator,
          deleteBoardProtected: boardToDelete.boardProtected,
          deleteBoardPassword: deletePassword
        })
      });
    } else {
      response = await fetch(`${API.API_BASE_URL}/board/deleteBoard`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deleteBoardId: boardToDelete.boardPriId,
          deleteBoardName: boardToDelete.boardName,
          deleteBoardCreator: boardToDelete.boardCreator,
          deleteBoardProtected: boardToDelete.boardProtected,
          deleteBoardPassword: deletePassword
        })
      });
    }

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

    if (result.deleteStatus) {
      addToast(result.deleteMessage, "success");

      storageWithExpiry.removeItem(BOARD_ID_KEY);
      storageWithExpiry.removeItem(BOARD_NAME_KEY);
      storageWithExpiry.removeItem(BOARD_PTD_KEY);
      storageWithExpiry.removeItem(BOARD_DEC_KEY);


      setBoardChoice(null);
      setBoardChoiceName(null);
      setBoardChoiceProtect(false);
      setBoardChoiceDescription(null);

      closeDeleteModal();
      const listResponse = await fetch(`${API.API_BASE_URL}/board/listcalling`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const listResult = await listResponse.json();
      if (listResult.boardListresult) {
        setBoardList(listResult.boardList);
        setFilteredBoardList(listResult.boardList);
      }
    } else {
      closeDeleteModal();
      addToast(result.deleteMessage, "warning");
      return;
    }
  };

  const getBoardDisplayName = (name) => {
    if (isNarrowScreen && name.length > 5) {
      return name.substring(0, 4) + "...";
    }
    return name;
  };

  return (
    <div className="board-wrapper">
      <div className="board-side-container">
        <div className="sidebar-header">
          <h2>게시판</h2>
        </div>
        <div className="sidebar-actions">
          <div className="board-search-container">
            <form className="board-search-form" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="게시판 검색"
                name="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="board-search-clear"
                  onClick={handleSearchClear}
                  title="검색어 지우기"
                >
                  ×
                </button>
              )}
              <button type="submit" className="board-search-button" title="검색">
                <img src={SIC} alt="검색" className="search-icon" />
              </button>
            </form>
            {searchQuery && (
              <div className="search-result-info">
                {filteredBoardList.length}개 발견
              </div>
            )}
          </div>
          <button className="sidebar-actions-button" onClick={addNewBoard}>
            + 새 게시판 생성
          </button>
        </div>

        <div className="sidebar-boardList">
          {filteredBoardList.length > 0 ? (
            filteredBoardList.map((board) => (
              <div
                key={board.boardPriId}
                className={boardChoice == board.boardPriId ? "board-list-item item-activate" : "board-list-item"}
                onClick={() => boardChoicer(board.boardPriId, board.boardName, board.boardProtected, board.boardDec)}
              >
                <div className="board-list-content">
                  <div className="board-list-header">
                    <div className="board-title-wrapper">
                      {board.boardProtected && (
                        <span className="lock-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </span>
                      )}
                      <span className="board-name" title={board.boardName}>
                        {getBoardDisplayName(board.boardName)}
                      </span>
                    </div>
                    {isLogined && board.boardPriId !== 1 && board.boardName !== '자유게시판' && (
                      <button
                        className="delete-board-button"
                        onClick={(e) => openDeleteModal(board, e)}
                        title="게시판 삭제"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                  {board.boardDescription && (
                    <span className="board-description">{board.boardDescription}</span>
                  )}
                  <span className="board-meta">
                    by {board.boardCreator}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-board-container">
              <div className="no-board-icon">
                {searchQuery ? '🔍' : '📋'}
              </div>
              <div className="no-board-result">
                <p className="no-board-message">
                  {searchQuery ? '검색 결과가 없습니다' : '등록된 게시판이 없습니다'}
                </p>
                <p className="no-board-submessage">
                  {searchQuery ? '다른 검색어를 입력해 보세요' : '새 게시판을 생성해 보세요!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={boardChoice == null ? "board-main-container" : "board-main-container-choice"}>
        {boardChoice == null
          ?
          <>
            <div className="board-main-placeholder">
              <h3>게시판을 선택해주세요</h3>
              <p>왼쪽 사이드바에서 게시판을 선택하거나 새로운 게시판을 생성하세요.</p>
            </div>
          </>
          :
          boardChoiceProtect ?
            <>
              <div>
                <BoardAccessWrapper
                  boardId={boardChoice}
                  boardName={boardChoiceName}
                  boardDescription={boardChoiceDescription}
                />
              </div>
            </>
            :
            <>
              <div>
                <BoardPost
                  boardId={boardChoice}
                  boardName={boardChoiceName}
                  boardDescription={boardChoiceDescription}
                />
              </div>
            </>
        }
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>새 게시판 생성</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="boardName">게시판 이름 *</label>
                  <input
                    type="text"
                    id="boardName"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="게시판 이름을 입력하세요"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="boardDescription">게시판 설명</label>
                  <textarea
                    id="boardDescription"
                    value={boardDescription}
                    onChange={(e) => setBoardDescription(e.target.value)}
                    placeholder="게시판 설명을 입력하세요 (선택사항)"
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="isPasswordProtected"
                      checked={isPasswordProtected}
                      onChange={(e) => {
                        setIsPasswordProtected(e.target.checked);
                        if (!e.target.checked) {
                          setBoardPassword('');
                        }
                      }}
                    />
                    <label htmlFor="isPasswordProtected" className="checkbox-label">
                      비밀번호 보호 사용
                    </label>
                  </div>
                </div>
                {isPasswordProtected && (
                  <div className="form-group password-input-group">
                    <label htmlFor="boardPassword">게시판 비밀번호 *</label>
                    <input
                      type="password"
                      id="boardPassword"
                      value={boardPassword}
                      onChange={(e) => setBoardPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      required
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" className="btn-submit">
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header delete-modal-header">
              <h2>게시판 삭제</h2>
              <button className="modal-close" onClick={closeDeleteModal}>×</button>
            </div>
            <form onSubmit={handleDelete}>
              <div className="modal-body">
                {boardToDelete?.boardPriId === 1 || boardToDelete?.boardName === '자유게시판' ? (
                  <div className="delete-warning delete-disabled">
                    <div className="warning-icon">🚫</div>
                    <p className="warning-message">
                      "<strong>{boardToDelete?.boardName}</strong>" 게시판은 기본 게시판으로 삭제할 수 없습니다.
                    </p>
                    <p className="warning-submessage">
                      이 게시판은 시스템에서 보호되는 게시판입니다.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="delete-warning">
                      <div className="warning-icon">⚠️</div>
                      <p className="warning-message">
                        정말로 "<strong>{boardToDelete?.boardName}</strong>" 게시판을 삭제하시겠습니까?
                      </p>
                      <p className="warning-submessage">
                        이 작업은 되돌릴 수 없으며, 게시판의 모든 게시글이 함께 삭제됩니다.
                      </p>
                    </div>
                    {boardToDelete?.boardProtected && (
                      <div className="form-group">
                        <label htmlFor="deletePassword">게시판 비밀번호 *</label>
                        <input
                          type="password"
                          id="deletePassword"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="비밀번호를 입력하세요"
                          required
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeDeleteModal}>
                  {boardToDelete?.boardPriId === 1 || boardToDelete?.boardName === '자유게시판' ? '확인' : '취소'}
                </button>
                {!(boardToDelete?.boardPriId === 1 || boardToDelete?.boardName === '자유게시판') && (
                  <button type="submit" className="btn-delete">
                    삭제하기
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}