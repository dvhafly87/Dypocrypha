import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../context/AuthContext.jsx';
import API from '../config/apiConfig.js';
import '../css/ProjectManage.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Editor } from '@toast-ui/react-editor';
import { onUploadImage } from '../util/onUploadImage.js';
import '@toast-ui/editor/dist/toastui-editor.css';

export default function ProjectManage() {
    const [projectBasic, setProjectBasic] = useState([]);
    const [projectLog, setProjectLog] = useState([]);
    const [newMemberRole, setNewMemberRole] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [projectMember, setProjectMember] = useState([]);
    const [teamNameInput, setTeamNameInput] = useState('');
    const [permissionGrade, setPermissionGrade] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberGrade, setNewMemberGrade] = useState('M');
    const [newProjectThumb, setNewProjectThumb] = useState(null);
    const [thumbPreview, setThumbPreview] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const editorRef = useRef();
    const [summary, setSummary] = useState('');
    const [skillTool, setSkillTool] = useState('');
    const [selectCategory, setSelectCategory] = useState('');

    const [clickEnd, setClickEnd] = useState(false);
    const [clickCreated, setClickCreated] = useState(false);
    const [showInputCallendarLogModal, setShowInputCallendarLogModal] = useState(false);
    const [showCallendarModal, setShowCallendarModal] = useState(false);
    const [showEditProjectThumbModal, setShowEditProjectThumbModal] = useState(false);
    const [showCategorySelect, setShowCategorySelect] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showEditSummary, setShowEditSummary] = useState(false);
    const [showEditSkillTool, setShowEditSkillTool] = useState(false);

    const { projectId } = useParams();
    const { addToast } = useToast();
    const { isLogined, loginSuccess } = useAuth();
    const navigate = useNavigate();

    const today = new Date();
    const todayStr =
        `${today.getFullYear()}-` +
        `${String(today.getMonth() + 1).padStart(2, '0')}-` +
        `${String(today.getDate()).padStart(2, '0')}`;

    const categories = ['개발', '디자인', '기획', '학습', '연구', '취미', '기타'];

    const exitLogInputModal = () => {
        setShowCallendarModal(true);
        setShowInputCallendarLogModal(false);
    }

    const inputNewDailyLog = async () => {
        if (!loginSuccess || !isLogined) {
            const toastData = {
                status: 'error',
                message: "로그인이 필요한 기능입니다"
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/login');
            return;
        }

        const editorInstance = editorRef.current?.getInstance();
        const content = editorInstance?.getMarkdown()?.trim();

        if (!content) {
            addToast("내용을 입력해 주십시오", "error");
            return;
        }

        //str
        if (!selectedDate) {
            addToast("날짜를 선택해 주십시오", "error");
            return;
        }

        if (!projectBasic?.id) {
            addToast("프로젝트 정보가 올바르지 않습니다", "error");
            return;
        }

        //projectBasic = useState([]) 형태

        try {

            const response = await fetch(`${API.API_BASE_URL}/project/daily/log`, {
                method: 'POST',
                credentials: 'include', //쿠키값 전송
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    logProjectId: projectBasic.id,
                    logProjectDate: selectedDate,
                    logProjectContent: content
                })
            });

            if (response.status === 500) {
                const toastData = {
                    status: 'error',
                    message: result.logSavedMessage != null ? result.logSavedMessage : "서버 통신 불각"
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            }

            const result = await response.json();

            if (response.status === 404 || response.status === 400) {
                const toastData = {
                    status: 'error',
                    message: result?.logSavedMessage || "요청을 처리할 수 없습니다"
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            } else if (response.status === 401) {
                const toastData = {
                    status: 'error',
                    message: result.logSavedMessage
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/login'); //로그인 페이지로
            } else if (response.status === 403) {
                addToast(result.logSavedMessage, "warning");
                return;
            } else if(response.status === 201) {
                  const toastData = {
                    status: 'success',
                    message: result.logSavedMessage != null ? result.logSavedMessage : "저장되었습니다"
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                window.location.reload();
            }

        } catch (error) {
            const toastData = {
                status: 'error',
                message: "프로젝트 로그 기록중 에러 발생"
            };
            console.error(error);
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
            return;
        }
    };


    // 파일 선택 시 미리보기 처리
    const handleFileSelect = (e) => {
        const file = e.target.files[0];

        if (!file) {
            setNewProjectThumb(null);
            setThumbPreview(null);
            return;
        }

        // 파일 유효성 검사
        if (file.size > 10 * 1024 * 1024) {
            addToast('파일 크기는 10MB를 초과할 수 없습니다.', 'warning');
            e.target.value = '';
            return;
        }

        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            addToast('지원되는 파일 형식은 PNG, JPEG, JPG 입니다.', 'warning');
            e.target.value = '';
            return;
        }

        // 파일 저장
        setNewProjectThumb(file);

        // 미리보기 생성
        const reader = new FileReader();
        reader.onloadend = () => {
            setThumbPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProjectThumb = async () => {
        if (!newProjectThumb) {
            addToast('변경할 파일을 선택해주세요.', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('projectThumbFile', newProjectThumb);

        try {
            const response = await fetch(`${API.API_BASE_URL}/project/thumb/update`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: '서버 통신 불가'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            }

            const result = await response.json();

            if (result.updateThumbStatus) {
                addToast('프로젝트 썸네일이 변경되었습니다.', 'success');
                setShowEditProjectThumbModal(false);
                setNewProjectThumb(null);
                setThumbPreview(null);
                window.location.reload();
            } else {
                addToast(result.updateThumbMessage, "error");
            }
        } catch (error) {
            const toastData = {
                status: 'warning',
                message: '서버 통신 불가'
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
        }
    };

    const adapter = async (blob, callback) => {
        const uploader = onUploadImage({
            blob,
            onSuccess: ({ default: url }) => {
                callback(url, 'image'); // string URL만 넘김
            },
            onError: (err) => {
                console.error(err);
                addToast(err.message, 'error');
            }
        });

        await uploader.upload();
    };


    // 프로젝트 정보(개요, 스킬/툴, 카테고리) 수정 공통 함수
    const updateSubmitProjectInformation = async () => {
        try {
            const response = await fetch(`${API.API_BASE_URL}/project/info/update`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updateProjectId: projectId,
                    updateProjectSkillTool: skillTool,
                    updateProjectCategory: selectCategory,
                    updateProjectSummary: summary
                })
            });

            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: '서버 통신 불가'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            }

            const result = await response.json();

            if (result.updateProjectInformationStatus) {
                window.location.reload();
            } else {
                addToast(result.updateProjectInformationMessage, "error");
            }
        } catch (error) {
            const toastData = {
                status: 'warning',
                message: '서버 통신 불가'
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
        }
    };

    // 개요 수정 핸들러
    const handleUpdateSummary = async () => {
        const success = await updateSubmitProjectInformation();
        if (success) {
            addToast('프로젝트 개요가 수정되었습니다.', 'success');
            setShowEditSummary(false);
            window.location.reload();
        }
    };

    // 스킬/툴 수정 핸들러
    const handleUpdateSkillTool = async () => {
        const success = await updateSubmitProjectInformation();
        if (success) {
            addToast('스킬/툴이 수정되었습니다.', 'success');
            setShowEditSkillTool(false);
            window.location.reload();
        }
    };

    // 카테고리 수정 핸들러
    const handleUpdateCategory = async (category) => {
        setSelectCategory(category);
        setShowCategorySelect(false);

        // 카테고리만 업데이트하기 위해 임시로 설정
        const tempSummary = summary;
        const tempSkillTool = skillTool;

        try {
            const response = await fetch(`${API.API_BASE_URL}/project/info/update`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updateProjectId: projectId,
                    updateProjectSkillTool: tempSkillTool,
                    updateProjectCategory: category,
                    updateProjectSummary: tempSummary
                })
            });

            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: '서버 통신 불가'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            }

            const result = await response.json();

            if (result.updateProjectInformationStatus) {
                window.location.reload();
            } else {
                addToast(result.updateProjectInformationMessage, "error");
            }
        } catch (error) {
            const toastData = {
                status: 'warning',
                message: '서버 통신 불가'
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
        }
    };

    const getDurationDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;

        const start = new Date(startDate);
        const end = new Date(endDate);

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const diffTime = end - start;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const getProjectDays = (project) => {
        if (!project?.created) return 0;

        if (project.status === 'I') {
            return getDurationDays(project.created, new Date());
        }

        if (project.status === 'C' || project.status === 'D') {
            return getDurationDays(project.created, project.endDay);
        }

        return 0;
    };

    const getMemberGradeLabel = (grade) => {
        return grade === 'L' ? '관리자' : '팀원';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const handleChangeGrade = async (memberId, currentGrade) => {
        const newGrade = currentGrade === 'L' ? 'M' : 'L';
        const gradeLabel = newGrade === 'L' ? '관리자' : '팀원';

        if (window.confirm(`이 팀원의 역할을 ${gradeLabel}로 변경하시겠습니까?`)) {
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/member/grade/update`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        memberId: memberId,
                        newGrade: newGrade
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

                if (result.updateMemberGradeStatus) {
                    const toastData = {
                        status: 'success',
                        message: "변경되었습니다."
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    window.location.reload();
                } else {
                    addToast(result.updateMemberGradeMessage, "error");
                    return;
                }

            } catch (error) {
                const toastData = {
                    status: 'warning',
                    message: "서버 통신 불가"
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            }
        }
    };

    const navigatedLoginPage = () => {
        const toastData = {
            status: 'warning',
            message: "로그인이 필요합니다."
        };
        localStorage.setItem('redirectToast', JSON.stringify(toastData));
        navigate("/login");
    };

    const handleAddMember = async () => {
        if (!projectBasic.teamValue) {
            if (!teamNameInput.trim()) {
                addToast('팀 이름을 입력해주세요.', 'warning');
                return;
            }
            if (!newMemberName.trim()) {
                addToast('팀원 이름을 입력해주세요.', 'warning');
                return;
            }

            try {
                const finalRole = newMemberRole === '직접입력' ? customRole : newMemberRole;

                const addMemberResponse = await fetch(`${API.API_BASE_URL}/project/member/add`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: projectId,
                        projectMemberName: newMemberName,
                        projectMemberGrade: newMemberGrade,
                        projectTeamName: teamNameInput,
                        projectTeamMemberRole: finalRole
                    })
                });

                if (!addMemberResponse.ok) {
                    const toastData = {
                        status: 'warning',
                        message: "서버 통신 불가"
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/');
                    return;
                }

                const result = await addMemberResponse.json();

                if (result.insertAddStatus) {
                    addToast('팀 프로젝트로 전환되고 팀원이 추가되었습니다.', 'success');
                    setNewMemberName('');
                    setNewMemberGrade('M');
                    setNewMemberRole('');
                    setCustomRole('');
                    setTeamNameInput('');
                    setShowAddMemberModal(false);
                    window.location.reload();
                } else {
                    addToast('팀원 추가에 실패했습니다.', 'error');
                }
            } catch (error) {
                addToast('처리 중 오류가 발생했습니다.', 'error');
            }
        } else {
            if (!newMemberName.trim()) {
                addToast('팀원 이름을 입력해주세요.', 'warning');
                return;
            }

            try {
                const finalRole = newMemberRole === '직접입력' ? customRole : newMemberRole;

                const response = await fetch(`${API.API_BASE_URL}/project/member/add`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: projectId,
                        projectMemberName: newMemberName,
                        projectMemberGrade: newMemberGrade,
                        projectTeamName: teamNameInput,
                        projectTeamMemberRole: finalRole
                    })
                });
                const result = await response.json();

                if (result.insertAddStatus) {
                    addToast('팀원이 추가되었습니다.', 'success');
                    setNewMemberName('');
                    setNewMemberGrade('M');
                    setNewMemberRole('');
                    setCustomRole('');
                    setShowAddMemberModal(false);
                    window.location.reload();
                } else {
                    addToast(result.insertAddMessage, 'error');
                }
            } catch (error) {
                addToast('팀원 추가 중 오류가 발생했습니다.', 'error');
            }
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (window.confirm('이 팀원을 제거하시겠습니까?')) {
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/member/remove`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        memberId: memberId
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

                if (result.removeMemberStatus) {
                    const toastData = {
                        status: 'success',
                        message: "삭제되었습니다."
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    window.location.reload();
                } else {
                    addToast(result.removeProjectMemberMessage, "error");
                }
            } catch (error) {
                const toastData = {
                    status: 'warning',
                    message: "서버 통신 불가 fetch 에러"
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            }
        }
    };

    const statusMenuRef = useRef(null);

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
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setShowStatusMenu(false);
            }
        };

        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                showStatusMenu &&
                statusMenuRef.current &&
                !statusMenuRef.current.contains(e.target)
            ) {
                setShowStatusMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showStatusMenu]);

    useEffect(() => {
        const fetchPermission = async () => {
            if (!isLogined || !loginSuccess) return;

            try {
                const res = await fetch(`${API.API_BASE_URL}/project/member/permission/check`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId })
                });

                const result = await res.json();

                if (result.permissionCheckStatus) {
                    setPermissionGrade(result.permissionGrade);
                } else {
                    setPermissionGrade('');
                }
            } catch {
                setPermissionGrade('');
            }
        };

        fetchPermission();
    }, [projectId, isLogined, loginSuccess]);

    useEffect(() => {
        const getThisProjectInformation = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/info/id`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        callProjectId: projectId
                    })
                });

                if (!response.ok) {
                    const toastData = {
                        status: 'warning',
                        message: '프로젝트 목록을 불러올 수 없습니다.'
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/');
                }

                const result = await response.json();

                if (result.projectOneInfoStatus) {
                    if (result.projectOneInfobasic != null) {
                        setProjectBasic(result.projectOneInfobasic);
                    } else {
                        setProjectBasic([]);
                    }

                    if (result.projectMemberInformation != null) {
                        setProjectMember(result.projectMemberInformation);
                    } else {
                        setProjectMember([]);
                    }

                    if (result.projectLogEntities != null) {
                        setProjectLog(result.projectLogEntities);
                    } else {
                        setProjectLog([]);
                    }

                } else {
                    const toastData = {
                        status: 'warning',
                        message: result.projectOneInfoMessage
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/');
                }

            } catch (error) {
                const toastData = {
                    status: 'error',
                    message: '프로젝트 페이지 useEffect API 에러'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            }
        };
        getThisProjectInformation();
    }, []);

    // projectBasic 로드 후 state 초기화
    useEffect(() => {
        if (projectBasic && Object.keys(projectBasic).length > 0) {
            setSummary(projectBasic.summary || '');
            setSkillTool(projectBasic.skillStack || '');
            setSelectCategory(projectBasic.pjCategory || '');
        }
    }, [projectBasic]);

    const getStatusLabel = (status) => {
        const statusMap = {
            'H': '대기',
            'I': '진행중',
            'C': '완료',
            'D': '중단'
        };
        return statusMap[status] || '알 수 없음';
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'H': '#6b7280',
            'I': '#3b82f6',
            'C': '#10b981',
            'D': '#ef4444'
        };
        return colorMap[status] || '#6b7280';
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const response = await fetch(`${API.API_BASE_URL}/project/status/update`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId,
                    projectStatus: newStatus
                })
            });

            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: '현재 서버가 실행중이 아니라 프로젝트 상태 변경이 불가능합니다 나중에 다시 시도해주십시오.'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            }

            const result = await response.json();

            if (result.updateReturnStatus) {
                setProjectBasic(prev => ({
                    ...prev,
                    status: newStatus
                }));

                addToast('프로젝트 상태가 변경되었습니다.', 'success');
                setShowStatusMenu(false);
            } else {
                addToast(result.updateReturnMessage, "error");
            }
        } catch (error) {
            const toastData = {
                status: 'warning',
                message: '에러 발생' + error.message
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
        }
        setShowStatusMenu(false);
    };

    const handleDeleteProject = async () => {

        if (!loginSuccess || !isLogined) {
            addToast("로그인이 필요합니다.", "error");
            return;
        }

        if (projectBasic.status === 'H') {
            addToast("진행되지 않은 프로젝트는 삭제하실 수 없습니다", "error");
            return;
        }

        if (permissionGrade !== 'L') {
            addToast("프로젝트 삭제 권한이 없습니다.", "error");
            return;
        }

        if (window.confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/delete`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: projectId
                    })
                });

                if (!response.ok) {
                    const toastData = {
                        status: 'warning',
                        message: '현재 서버에 문제가 생겨 프로젝트의 삭제가 불가능합니다 잠시후 다시 시도해주십시오'
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/');
                }

                const result = await response.json();

                if (result.deleteStatus) {
                    const toastData = {
                        status: 'success',
                        message: '삭제되었습니다.'
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/project');
                } else {
                    addToast(result.deleteMessage, "error");
                    return;
                }

            } catch (error) {
                const toastData = {
                    status: 'warning',
                    message: '현재 서버에 문제가 생겨 프로젝트의 삭제가 불가능합니다 잠시후 다시 시도해주십시오'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            }
        }
    };

    const [calendarEvents, setCalendarEvents] = useState([]);

    useEffect(() => {
        if (!projectBasic.created) return;
        if (projectBasic.status === 'C' || projectBasic.status === 'D') {
            setCalendarEvents([
                {
                    title: '프로젝트 시작',
                    date: projectBasic.created,
                    color: '#10b981'
                },
                ...(projectBasic.endDay ? [{
                    title: '프로젝트 종료',
                    date: projectBasic.endDay,
                    color: '#3b82f6'
                }] : [])
            ]);
        } else {
            setCalendarEvents([
                {
                    title: '프로젝트 시작',
                    date: projectBasic.created,
                    color: '#10b981'
                }
            ])
        }
    }, [projectBasic]);

    return (
        <>
            <div className="project-manage-container">
                <div className="project-manage-header">
                    <div className="project-manage-thumb-wrapper">
                        {projectBasic.projectThumb ?
                            <img
                                className="project-manage-thumbnail"
                                src={`${API.API_BASE_URL}/projectThumb/${projectBasic.projectThumb}`}
                                alt="프로젝트 썸네일"
                            />
                            :
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="gray"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                        }

                        <div className="project-manage-overlay">
                            <div className="project-manage-info">
                                <h1 className="project-title">{projectBasic.title}</h1>
                                <div className="project-status-wrapper" ref={statusMenuRef}>
                                    <button
                                        className="project-status-badge"
                                        style={{ backgroundColor: getStatusColor(projectBasic.status) }}
                                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                                    >
                                        {getStatusLabel(projectBasic.status)}
                                        <span className="status-arrow">▼</span>
                                    </button>

                                    {showStatusMenu && (
                                        <div className="status-dropdown">
                                            <button onClick={() => handleStatusChange('I')}>진행중</button>
                                            <button onClick={() => handleStatusChange('C')}>완료</button>
                                            <button onClick={() => handleStatusChange('D')}>중단</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {permissionGrade === 'L' && (
                                <div className="button-wrapper">
                                    <button className="project-thumb-edit-btn" onClick={() => setShowEditProjectThumbModal(true)}>
                                        프로젝트 썸네일 변경
                                    </button>
                                    <button className="project-delete-btn"
                                        onClick={handleDeleteProject}
                                    >
                                        삭제
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="project-manage-content-area">
                    <div className="project-manage-summary-area">
                        <section className="summary-section">
                            <h3>프로젝트 개요</h3>
                            {showEditSummary ? (
                                <p className="summary-text">
                                    <textarea
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        autoComplete="off"
                                        placeholder={projectBasic.summary || '프로젝트 설명을 입력해주세요'}
                                    />
                                    <button onClick={handleUpdateSummary}>수정</button>
                                    <button onClick={() => {
                                        setSummary(projectBasic.summary || '');
                                        setShowEditSummary(false);
                                    }}>취소</button>
                                </p>
                            ) : (
                                <p className="summary-text">
                                    {projectBasic.summary || '프로젝트 설명이 없습니다.'}
                                    {permissionGrade === 'L' && (
                                        <button onClick={() => setShowEditSummary(true)}>수정하기</button>
                                    )}
                                </p>
                            )}
                        </section>

                        <div className="summary-divider" />

                        <section className="summary-section inline">
                            <div className="category-select-wrapper">
                                <span className="summary-label">카테고리</span>

                                <div className="category-select">
                                    <span className="summary-value">
                                        {projectBasic.pjCategory}
                                    </span>

                                    {permissionGrade === 'L' && (
                                        <button
                                            className="category-update-select-button"
                                            onClick={() => setShowCategorySelect(!showCategorySelect)}
                                        >
                                            ▼
                                        </button>
                                    )}

                                    {showCategorySelect && (
                                        <ul className="category-dropdown">
                                            {categories
                                                .filter(category => category !== projectBasic.pjCategory)
                                                .map(category => (
                                                    <li
                                                        key={category}
                                                        onClick={() => handleUpdateCategory(category)}
                                                    >
                                                        {category}
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div>
                                <span className="summary-label">상태</span>
                                <span
                                    className="summary-status"
                                    style={{ color: getStatusColor(projectBasic.status) }}
                                >
                                    {getStatusLabel(projectBasic.status)}
                                    <span className="status-duration">
                                        {projectBasic.status === 'I' && ` · ${getProjectDays(projectBasic)}일째`}
                                        {projectBasic.status === 'C' && ` · 총 ${getProjectDays(projectBasic)}일`}
                                        {projectBasic.status === 'D' && ` · ${getProjectDays(projectBasic)}일 만에 중단`}
                                    </span>
                                </span>
                            </div>
                        </section>

                        <div className="summary-divider" />

                        <section className="summary-section">
                            <h3>사용 스킬 / 툴</h3>
                            {showEditSkillTool ? (
                                <div className="skill-inline">
                                    <input
                                        value={skillTool}
                                        onChange={(e) => setSkillTool(e.target.value)}
                                        autoComplete="off"
                                        placeholder={projectBasic.skillStack}
                                    />
                                    <button onClick={handleUpdateSkillTool}>수정</button>
                                    <button onClick={() => {
                                        setSkillTool(projectBasic.skillStack || '');
                                        setShowEditSkillTool(false);
                                    }}>취소</button>
                                </div>
                            ) : (
                                <div className="skill-inline">
                                    {projectBasic.skillStack?.split(',').map((skill, idx) => (
                                        <span key={idx} className="skill-badge">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                    {permissionGrade === 'L' && (
                                        <button onClick={() => setShowEditSkillTool(true)}>수정하기</button>
                                    )}
                                </div>
                            )}
                        </section>

                        <div className="summary-divider" />

                        <section className="summary-section">
                            <h3>진행 기간</h3>

                            {projectBasic.status === "I" && (
                                <div className="project-duration-container">
                                    {formatDate(projectBasic.created)} ~
                                </div>
                            )}

                            {(projectBasic.status === "D" || projectBasic.status === "C") && (
                                <div className="project-duration-container">
                                    {formatDate(projectBasic.created)} ~ {formatDate(projectBasic.endDay)}
                                </div>
                            )}
                        </section>
                    </div>
                    <div className="project-manage-teamValue-area">
                        <div className="project-manage-teamValue">
                            {projectBasic.teamValue ? "팀 프로젝트" : "개인 프로젝트"}
                        </div>

                        <div className="team-info-section">
                            <span className="team-info-label">
                                {projectBasic.teamValue ? "팀명" : "진행자"}
                            </span>
                            <div className="project-manage-teamName">
                                {projectBasic.teamValue ? projectBasic.teamName : projectBasic.starter}
                            </div>
                        </div>

                        {projectMember.length > 0 && (
                            <div className={permissionGrade === 'L' ? "team-member-information" : "team-member-information-non-leader"}>
                                {projectMember.map(member => (
                                    <div key={member.id} className="member-card"
                                        style={projectBasic.teamValue
                                            && member.pjMemberName === projectBasic.starter ?
                                            {
                                                display: 'none',
                                                visibility: 'hidden'
                                            }
                                            :
                                            {

                                            }
                                        }>
                                        <div className="member-name">{member.pjMemberName}</div>
                                        <div className="member-detail-wrapper">
                                            <div className="member-detail">
                                                <span className="member-detail-label">권한:</span>
                                                <span className="member-grade-badge">
                                                    {getMemberGradeLabel(member.pjMemberGrade)}
                                                </span>
                                            </div>
                                            {member.pjMemberRole && (
                                                <div className="member-detail">
                                                    <span className="member-detail-label">담당:</span>
                                                    <span className="member-role-badge">
                                                        {member.pjMemberRole}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="member-actions">
                                            {permissionGrade === 'L' && member.pjStatus === 'T' && (
                                                <button
                                                    className="member-action-btn change-grade"
                                                    onClick={() => handleChangeGrade(member.id, member.pjMemberGrade)}
                                                >
                                                    {member.pjMemberGrade !== 'L' ? "관리자로 변경" : "팀원으로 변경"}
                                                </button>
                                            )}

                                            {permissionGrade === 'L' && member.pjStatus === 'T' && (
                                                <button
                                                    className="member-action-btn remove"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                >
                                                    제거
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isLogined && loginSuccess ?
                            <button
                                className="add-member-btn"
                                onClick={() => {
                                    if (!isLogined || !loginSuccess) {
                                        navigatedLoginPage();
                                        return;
                                    }
                                    setShowAddMemberModal(true);
                                }}
                            >
                                {projectBasic.teamValue ? "+ 팀원 추가" : "팀 프로젝트 전환"}
                            </button>
                            :
                            <button
                                className="non-log-add-member-btn"
                                disabled
                            >
                                로그인 후 이용가능합니다
                            </button>
                        }
                    </div>

                    {showAddMemberModal && (
                        <div className="project-modal-overlay" onClick={() => setShowAddMemberModal(false)}>
                            <div className="project-modal-content" onClick={(e) => e.stopPropagation()}>
                                <h3 className="project-modal-title">팀원 추가</h3>

                                {!projectBasic.teamValue && (
                                    <>
                                        <div className="project-modal-notice">
                                            개인 프로젝트에서 팀원을 추가하면 팀 프로젝트로 전환됩니다.
                                        </div>

                                        <div className="project-modal-input-group">
                                            <label className="project-modal-label">팀 이름</label>
                                            <input
                                                type="text"
                                                className="project-modal-input"
                                                placeholder="팀 이름을 입력하세요"
                                                value={teamNameInput}
                                                onChange={(e) => setTeamNameInput(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="project-modal-input-group">
                                    <label className="project-modal-label">팀원 이름</label>
                                    <input
                                        type="text"
                                        className="project-modal-input"
                                        placeholder="팀원 이름을 입력하세요"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                    />
                                </div>

                                <div className="project-modal-input-group">
                                    <label className="project-modal-label">권한</label>
                                    <select
                                        className="project-modal-input"
                                        value={newMemberGrade}
                                        onChange={(e) => setNewMemberGrade(e.target.value)}
                                    >
                                        <option value="M">팀원</option>
                                        <option value="L">관리자</option>
                                    </select>
                                </div>

                                <div className="project-modal-input-group">
                                    <label className="project-modal-label">담당 역할</label>
                                    <select
                                        className="project-modal-input"
                                        value={newMemberRole}
                                        onChange={(e) => {
                                            setNewMemberRole(e.target.value);
                                            if (e.target.value !== '직접입력') {
                                                setCustomRole('');
                                            }
                                        }}
                                    >
                                        <option value="">역할 선택</option>
                                        <option value="프론트엔드">프론트엔드</option>
                                        <option value="백엔드">백엔드</option>
                                        <option value="디자인">디자인</option>
                                        <option value="기획">기획</option>
                                        <option value="직접입력">직접 입력</option>
                                    </select>

                                    {newMemberRole === '직접입력' && (
                                        <input
                                            type="text"
                                            className="project-modal-input"
                                            style={{ marginTop: '8px' }}
                                            placeholder="역할을 입력하세요"
                                            value={customRole}
                                            onChange={(e) => setCustomRole(e.target.value)}
                                        />
                                    )}
                                </div>

                                <div className="project-modal-actions">
                                    <button
                                        className="project-modal-btn cancel"
                                        onClick={() => {
                                            setShowAddMemberModal(false);
                                            setNewMemberName('');
                                            setNewMemberGrade('M');
                                            setNewMemberRole('');
                                            setCustomRole('');
                                            setTeamNameInput('');
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        className="project-modal-btn confirm"
                                        onClick={handleAddMember}
                                    >
                                        추가
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {showEditProjectThumbModal && (
                    <div className="project-thumb-edit-modal-overlay" onClick={() => {
                        setShowEditProjectThumbModal(false);
                        setNewProjectThumb(null);
                        setThumbPreview(null);
                    }}>
                        <div className="project-thumb-edit-modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3 className="project-thumb-edit-modal-title">프로젝트 썸네일 변경</h3>

                            <div className="project-thumb-preview-section">
                                <label className="project-thumb-preview-label">
                                    {thumbPreview ? '새 썸네일 미리보기' : '현재 썸네일'}
                                </label>
                                <div className="project-thumb-preview">
                                    {thumbPreview ? (
                                        <img
                                            className="project-thumb-image"
                                            src={thumbPreview}
                                            alt="새 썸네일 미리보기"
                                        />
                                    ) : projectBasic.projectThumb ? (
                                        <img
                                            className="project-thumb-image"
                                            src={`${API.API_BASE_URL}/projectThumb/${projectBasic.projectThumb}`}
                                            alt="현재 썸네일"
                                        />
                                    ) : (
                                        <div className="project-thumb-placeholder">
                                            <svg
                                                width="48"
                                                height="48"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="gray"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                            <span>썸네일 없음</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="project-thumb-upload-section">
                                <label className="project-thumb-upload-label">
                                    새 썸네일 업로드
                                    <span className="file-format-info">(PNG, JPEG, JPG / 최대 10MB)</span>
                                </label>
                                <div className="file-input-wrapper">
                                    <input
                                        type="file"
                                        id="projectThumbFile"
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleFileSelect}
                                        className="file-input-hidden"
                                    />
                                    <label htmlFor="projectThumbFile" className="file-input-label">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        {newProjectThumb ? newProjectThumb.name : '파일 선택'}
                                    </label>
                                </div>
                            </div>

                            <div className="project-thumb-edit-modal-actions">
                                <button
                                    className="project-thumb-edit-modal-btn cancel"
                                    onClick={() => {
                                        setShowEditProjectThumbModal(false);
                                        setNewProjectThumb(null);
                                        setThumbPreview(null);
                                    }}
                                >
                                    취소
                                </button>
                                <button
                                    className="project-thumb-edit-modal-btn confirm"
                                    onClick={handleUpdateProjectThumb}
                                >
                                    변경
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showInputCallendarLogModal && isLogined && loginSuccess && !showCallendarModal && (
                    <div className="callendar-input-log-modal">
                        <div className="callendar-log-input-header">
                            <h4>프로젝트 {projectBasic.title} - {selectedDate} 기록</h4>
                        </div>

                        <div className="callendar-log-input-main-container">
                            <Editor
                                ref={editorRef}
                                initialValue=""
                                initialEditType="markdown"
                                previewStyle="vertical"
                                height="500px"
                                hooks={{
                                    addImageBlobHook: adapter
                                }}
                                useCommandShortcut={true}
                            />
                            <div className="log-input-button-wrapper">
                                <button
                                    onClick={() => exitLogInputModal()}
                                >
                                    취소
                                </button>
                                <button onClick={() => inputNewDailyLog()}> 등록 </button>
                            </div>
                        </div>
                    </div>
                )}
                {showCallendarModal && (
                    <div className="callendar-modal-overlay">
                        <div className="callendar-date-container">
                            <div className="project-log-container">
                                <div className="project-modal-log-header">
                                    <h3>
                                        {projectBasic.title} - {selectedDate}
                                    </h3>
                                    {isLogined && loginSuccess && selectedDate === todayStr ?
                                        <button
                                            onClick={() => {
                                                if (!isLogined || !loginSuccess) {
                                                    navigatedLoginPage();
                                                    return;
                                                }
                                                setShowInputCallendarLogModal(true);
                                                setShowCallendarModal(false);
                                            }}
                                        >
                                            +
                                        </button>
                                        :
                                        <button
                                            disabled
                                        >
                                            +
                                        </button>
                                    }
                                </div>
                                <div className="project-modal-log-bottom-wrapper">
                                    <div className="project-daily-log-slider">
                                        {/* 생성일자로 클릭시 상단부에 고정으로 클릭 카드 하나 추가 */}
                                        {projectBasic.created.split('T')[0] === selectedDate && (
                                            <span className="project-log-click-card" onClick={() => setClickCreated(true)}>
                                                + 프로젝트 생성일
                                            </span>
                                        )}
                                        {(projectBasic.status === 'D' || projectBasic.status === 'C') && projectBasic.endDay.split('T')[0] === selectedDate && (
                                            <span className="project-log-click-card" onClick={() => setClickEnd(true)}>
                                                프로젝트 종료일
                                            </span>
                                        )}
                                        로그 슬라이더 영역 여기에 삼항연산자로 <p />
                                        로그가 있으면 로그를 상하단 슬라이더 형식으로 표시 <p />
                                        없으면 로그 없음 문구 표시할거임<p />
                                    </div>
                                    <div className="project-log-view-container">
                                        {/* 시작일 일치로 생성된 카드를 클릭했을때 보여지는 */}
                                        {clickCreated && (
                                            <div className="click-log-content">
                                                <div className="click-log-header">
                                                    <h3>{projectBasic.title}</h3>
                                                    <p className="start-date-text">
                                                        <strong>{selectedDate}</strong>에 프로젝트가 시작되었습니다.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {clickEnd && (
                                            <div className="click-log-content">
                                                <div className="click-log-header">
                                                    <h3>{projectBasic.title}</h3>
                                                    <p className="start-date-text">
                                                        <strong>{selectedDate}</strong>에 프로젝트가 성공적으로 종료되었습니다.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="project-calendar-section">
                    {projectBasic.created && projectBasic.status === 'C' && (
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            initialDate={projectBasic.created}
                            locale="ko"
                            headerToolbar={{
                                left: 'prev',
                                center: 'title',
                                right: 'next'
                            }}
                            events={calendarEvents}
                            height="auto"
                            dateClick={(info) => {
                                // info.dateStr;
                                setSelectedDate(info.dateStr);
                                setShowCallendarModal(true);
                                setClickCreated(false);
                                setClickEnd(false);
                            }}
                            eventClick={(info) => {
                                // // info.event.startStr에 해당 이벤트의 날짜 정보가 들어있습니다.
                                // setSelectedDate(info.event.startStr.split('T')[0]); // 시간 정보 제외 날짜만 추출
                                // setShowCallendarModal(true);
                            }}
                        />
                    )}
                    {projectBasic.status !== 'C' && projectBasic.status !== 'D' && (
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale="ko"
                            headerToolbar={{
                                left: 'prev',
                                center: 'title',
                                right: 'next'
                            }}
                            events={calendarEvents}
                            height="auto"
                            dateClick={(info) => {
                                // info.dateStr;
                                setSelectedDate(info.dateStr);
                                setShowCallendarModal(true);
                                setClickCreated(false);
                                setClickEnd(false);
                            }}
                            eventClick={(info) => {
                                // // info.event.startStr에 해당 이벤트의 날짜 정보가 들어있습니다.
                                // setSelectedDate(info.event.startStr.split('T')[0]); // 시간 정보 제외 날짜만 추출
                                // setShowCallendarModal(true);
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    );
}