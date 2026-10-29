import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiError } from '../util/ResultHandler.js';

import { useToast } from '../components/ToastContext';
import { useAuth } from '../context/AuthContext.jsx';

import API from '../config/apiConfig.js';
import '../css/ProjectManage.css';
import ProjectCalendar from './ProjectCalendar.jsx';
import ProjectLogComposer, {ProjectLogDraftList} from './ProjectLogComposer.jsx';
import { useProjectResources, ProjectDescription, ProjectLinks, ProjectLinkDialog } from './ProjectResources.jsx';
import { formatDate as projectDateKey } from '../util/dateFormat.js';
import { Editor } from '@toast-ui/react-editor';
import { onUploadImage } from '../util/onUploadImage.js';
import { Viewer } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

export default function ProjectManage() {
    const { handleNetworkError } = useApiError();
    const [projectBasic, setProjectBasic] = useState([]);
    const [projectLog, setProjectLog] = useState([]);
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [newMemberRole, setNewMemberRole] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [projectMember, setProjectMember] = useState([]);
    const [teamNameInput, setTeamNameInput] = useState('');
    const [permissionGrade, setPermissionGrade] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [logTitle, setLogTitle] = useState('');
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
    const calendarLogDialogRef = useRef(null);
    const closeCalendarLog = () => {
        setShowCallendarModal(false);
        setSelectedLogId(null);
    };
    useEffect(() => {
        if (!showCallendarModal) return;
        const previousFocus = document.activeElement;
        const bodyOverflow = document.body.style.overflow;
        const htmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        const frame = requestAnimationFrame(() => calendarLogDialogRef.current?.focus());
        const onKey = event => {
            if (event.key === 'Escape') { event.preventDefault(); closeCalendarLog(); return; }
            if (event.key !== 'Tab') return;
            const dialog = calendarLogDialogRef.current;
            const controls = [...(dialog?.querySelectorAll('button:not([disabled]), select:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]') || [])].filter(el => el.getClientRects().length);
            if (!controls.length) { event.preventDefault(); dialog?.focus(); return; }
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = bodyOverflow;
            document.documentElement.style.overflow = htmlOverflow;
            if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        };
    }, [showCallendarModal]);

    const [showEditProjectThumbModal, setShowEditProjectThumbModal] = useState(false);
    const [showCategorySelect, setShowCategorySelect] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showEditSkillTool, setShowEditSkillTool] = useState(false);
    const [showEditLogModal, setShowEditLogModal] = useState(false);

    const { projectId } = useParams();
    const projectResources = useProjectResources(projectId);
    const { addToast } = useToast();
    const { isLogined, loginSuccess, logout, nickname } = useAuth();

    const [pageIndex, setPageIndex] = useState(0);
    const [dashboardIndex, setDashBoardIndex] = useState('overview');
    const [projectReports, setProjectReports] = useState([]);
    const [projectCompleteReports, setProjectCompleteReports] = useState([]);
    //------------------------- PROJECT_REPORT HELPER ---------------------------
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportDetailModal, setShowReportDetailModal] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [reportTitle, setReportTitle] = useState('');
    const [reportVideoFile, setReportVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const reportEditorRef = useRef();

    const [memberSlideIndex, setMemberSlideIndex] = useState(0);
    const memberSlideTimerRef = useRef(null);

    // 슬라이드 타이머 리셋 헬퍼
    const resetMemberSlideTimer = () => {
        if (memberSlideTimerRef.current) clearInterval(memberSlideTimerRef.current);
        memberSlideTimerRef.current = setInterval(() => {
            setMemberSlideIndex(prev =>
                projectMember.length > 0 ? (prev + 1) % projectMember.length : 0
            );
        }, 15000);
    };

    // 자동 슬라이드 시작/정리
    useEffect(() => {
        if (projectMember.length > 1) resetMemberSlideTimer();
        return () => {
            if (memberSlideTimerRef.current) clearInterval(memberSlideTimerRef.current);
        };
    }, [projectMember]);

    // 멤버 변경 시 인덱스 초기화
    useEffect(() => {
        setMemberSlideIndex(0);
    }, [projectMember]);

    // 영상 파일 선택 핸들러
    const handleVideoSelect = (e) => {
        const file = e.target.files[0];

        if (!file) {
            setReportVideoFile(null);
            setVideoPreview(null);
            return;
        }

        // 파일 크기 체크 (예: 100MB)
        if (file.size > 100 * 1024 * 1024) {
            addToast('영상 파일 크기는 100MB를 초과할 수 없습니다.', 'warning');
            e.target.value = '';
            return;
        }

        // 비디오 파일 타입 체크
        if (!file.type.startsWith('video/')) {
            addToast('영상 파일만 업로드 가능합니다.', 'warning');
            e.target.value = '';
            return;
        }

        setReportVideoFile(file);

        // 미리보기 생성
        const reader = new FileReader();
        reader.onloadend = () => {
            setVideoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // 레포트 작성/수정
    const handleSaveReport = async () => {
        if (!reportTitle || reportTitle.trim().length === 0) {
            addToast("레포트 제목을 입력해주세요", "warning");
            return;
        }

        if (reportTitle.length > 50) {
            addToast("레포트 제목은 50자를 초과할 수 없습니다", "warning");
            return;
        }

        const editorInstance = reportEditorRef.current?.getInstance();
        const content = editorInstance?.getMarkdown()?.trim();

        if (!content) {
            addToast("내용을 입력해주세요", "warning");
            return;
        }

        const formData = new FormData();
        formData.append('reportProjectId', projectId);
        formData.append('reportTitle', reportTitle);
        formData.append('reportContent', content);

        if (selectedReportId) {
            formData.append('reportId', selectedReportId);
        }

        if (reportVideoFile) {
            formData.append('reportVideoFile', reportVideoFile);
        }

        try {
            const url = selectedReportId
                ? `${API.API_BASE_URL}/project/report/update`
                : `${API.API_BASE_URL}/project/report/create`;

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.reportSaveStatus) {
                addToast(
                    selectedReportId ? '레포트가 수정되었습니다' : '레포트가 작성되었습니다',
                    'success'
                );
                setShowReportModal(false);
                window.location.reload();
            } else {
                addToast(result.reportSaveMessage || '레포트 저장에 실패했습니다', 'error');
            }
        } catch (error) {
            handleNetworkError(error, "레포트 저장 중 에러가 발생했습니다");
        }
    };

    // 레포트 삭제
    const handleDeleteReport = async (reportId) => {
        try {
            const response = await fetch(`${API.API_BASE_URL}/project/report/delete`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId
                })
            });

            const result = await response.json();
            let toastData;

            if (response.status === 500) {
                toastData = {
                    status: 'error',
                    message: result.reportDeleteMessage || "서버 통신 불가"
                }
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            } else if (response.status === 400 || response.status === 404) {
                toastData = {
                    status: 'error',
                    message: result.reportDeleteMessage
                }
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                logout();
                navigate('/');
                return;
            } else if (response.status === 401) {
                toastData = {
                    status: 'error',
                    message: result.reportDeleteMessage
                }
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/login');
                return;
            } else if (response.status === 403) {
                addToast(result.reportDeleteMessage, "error");
                return;
            } else if (response.ok && result.reportDeleteStatus) {
                toastData = {
                    status: 'success',
                    message: result.reportDeleteMessage
                }
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                window.location.reload();
                return;
            }
        } catch (error) {
            handleNetworkError(error, "레포트 삭제 중 에러가 발생했습니다");
            return;
        }
    };

    //------------------------- PROJECT_REPORT HELPER ---------------------------

    //----------------------------TIMELINE_HELPER-----------------------------------------
    const [expandedDates, setExpandedDates] = useState({});
    const getTimelineData = () => {
        const events = []; // { date, type, payload }

        // ① 프로젝트 시작 이벤트
        if (projectBasic.created) {
            events.push({
                date: projectBasic.created.split('T')[0],
                type: 'milestone-start',
                payload: { datetime: projectBasic.created }
            });
        }

        // ② 프로젝트 종료 이벤트
        if ((projectBasic.status === 'C' || projectBasic.status === 'D') && projectBasic.endDay) {
            events.push({
                date: projectDateKey(projectBasic.endDay),
                type: projectBasic.status === 'C' ? 'milestone-end' : 'milestone-halted',
                payload: { datetime: projectBasic.endDay }
            });
        }

        // ③ 일반 로그 이벤트
        (projectLog || []).forEach(log => {
            events.push({
                date: log.logDailyDate.split('T')[0],
                type: 'log',
                payload: log
            });
        });

        // 날짜별로 그룹화
        const grouped = {};
        events.forEach(ev => {
            if (!grouped[ev.date]) grouped[ev.date] = [];
            grouped[ev.date].push(ev);
        });

        // 날짜 오름차순 정렬 후 배열로 변환
        return Object.keys(grouped)
            .sort((a, b) => a.localeCompare(b))
            .map(date => ({
                date,
                events: grouped[date].sort((a, b) => {
                    // milestone-start 는 항상 첫 번째, milestone-end/halted 는 항상 마지막
                    const order = { 'milestone-start': 0, 'log': 1, 'milestone-end': 2, 'milestone-halted': 2 };
                    return (order[a.type] ?? 1) - (order[b.type] ?? 1);
                })
            }));
    };

    const toggleDateExpand = (dateKey) => {
        setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
    };

    // 날짜 그룹의 기본 전개 상태 : 로그가 있으면 기본 전개
    const isDateExpanded = (dateKey) => {
        if (expandedDates[dateKey] !== undefined) return expandedDates[dateKey];
        return true; // 기본값: 전개 상태
    };
    //----------------------------TIMELINE_HELPER-----------------------------------------
    // 히트맵 데이터 생성 (주 단위 구조)
    const getActivityHeatmapData = () => {
        if (!projectBasic.created || !projectBasic.endDay) {
            return { weeks: [], months: [] };
        }

        const startDate = new Date(projectBasic.created);
        const endDate = new Date();

        // 날짜별 로그 개수 미리 계산
        const logCountByDate = {};
        projectLog.forEach(log => {
            const date = log.logDailyDate.split('T')[0];
            logCountByDate[date] = (logCountByDate[date] || 0) + 1;
        });

        // 시작일을 일요일로 맞추기
        const adjustedStart = new Date(startDate);
        adjustedStart.setDate(adjustedStart.getDate() - adjustedStart.getDay());

        // 주 단위로 데이터 구성
        const weeks = [];
        let currentWeek = [];
        let currentDate = new Date(adjustedStart);
        const months = [];
        let lastMonth = -1;

        while (currentDate <= endDate || currentWeek.length > 0) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const isInRange = currentDate >= startDate && currentDate <= endDate;

            // 월 정보 수집 (각 주의 시작(일요일)에만)
            const monthIndex = currentDate.getMonth();
            if (monthIndex !== lastMonth && currentDate.getDay() === 0 && weeks.length > 0) {
                months.push({
                    name: currentDate.toLocaleDateString('ko-KR', { month: 'short' }),
                    weekIndex: weeks.length
                });
                lastMonth = monthIndex;
            }

            currentWeek.push({
                date: dateStr,
                count: isInRange ? (logCountByDate[dateStr] || 0) : null,
                dayOfWeek: currentDate.getDay(),
                isInRange
            });

            // 토요일이면 주 완성
            if (currentDate.getDay() === 6) {
                weeks.push([...currentWeek]);
                currentWeek = [];
            }

            currentDate.setDate(currentDate.getDate() + 1);

            // 종료 조건
            if (currentDate > endDate && currentWeek.length === 0) break;
        }

        // 마지막 주가 미완성이면 나머지를 null로 채우기
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push({
                    date: null,
                    count: null,
                    dayOfWeek: currentWeek.length,
                    isInRange: false
                });
            }
            weeks.push(currentWeek);
        }

        return { weeks, months };
    };

    // 활동 레벨에 따른 색상 (녹색 테마 유지)
    const getActivityColor = (count) => {
        if (count === null) return 'transparent';
        if (count === 0) return '#ebedf0';
        if (count === 1) return '#9be9a8';
        if (count >= 2 && count < 5) return '#40c463';
        if (count >= 5 && count < 10) return '#30a14e';
        return '#216e39';
    };

    // 실제 작업 일수를 계산하는 함수
    const getActualWorkingDays = () => {
        if (!projectLog || projectLog.length === 0) return 0;

        const uniqueDates = new Set(
            projectLog.map(log => log.logDailyDate.split('T')[0])
        );

        return uniqueDates.size;
    };

    const getWeeklyLogData = () => {
        if (!projectBasic.created || !projectBasic.endDay || !projectLog || projectLog.length === 0) {
            return [];
        }

        const startDate = new Date(projectBasic.created);
        const endDate = new Date(projectBasic.endDay);

        const weeks = [];
        let currentWeekStart = new Date(startDate);
        let weekNumber = 1;

        while (currentWeekStart <= endDate) {
            const currentWeekEnd = new Date(currentWeekStart);
            currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

            const weekEnd = currentWeekEnd > endDate ? endDate : currentWeekEnd;

            weeks.push({
                weekNumber,
                startDate: new Date(currentWeekStart),
                endDate: new Date(weekEnd),
                count: 0
            });

            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            weekNumber++;
        }

        // 각 주차에 로그 수 카운트
        projectLog.forEach(log => {
            const logDate = new Date(log.logDailyDate);

            weeks.forEach(week => {
                // 날짜 비교를 위해 시간 제거
                const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
                const weekStartOnly = new Date(week.startDate.getFullYear(), week.startDate.getMonth(), week.startDate.getDate());
                const weekEndOnly = new Date(week.endDate.getFullYear(), week.endDate.getMonth(), week.endDate.getDate());

                if (logDateOnly >= weekStartOnly && logDateOnly <= weekEndOnly) {
                    week.count++;
                }
            });
        });

        return weeks;
    };

    // 멤버별 로그 분포 계산 함수
    const getMemberLogDistribution = () => {
        if (!projectLog || projectLog.length === 0) {
            return [];
        }

        const memberCount = {};

        projectLog.forEach(log => {
            const creator = log.logCreator;
            memberCount[creator] = (memberCount[creator] || 0) + 1;
        });

        const totalLogs = projectLog.length;

        return Object.entries(memberCount).map(([name, count]) => ({
            name,
            count,
            percentage: ((count / totalLogs) * 100).toFixed(1)
        })).sort((a, b) => b.count - a.count);
    };

    // 색상 팔레트 (멤버별로 다른 색상)
    const getChartColor = (index) => {
        const colors = [
            '#10b981', // green
            '#3b82f6', // blue
            '#f59e0b', // amber
            '#ec4899', // pink
            '#8b5cf6', // purple
            '#ef4444', // red
            '#06b6d4', // cyan
            '#84cc16'  // lime
        ];
        return colors[index % colors.length];
    };

    // 최다 로그 일수 (가장 많은 로그를 작성한 날)
    const getMostLoggedDay = () => {
        if (!projectLog || projectLog.length === 0) return { date: '-', count: 0 };

        const dateCount = {};

        projectLog.forEach(log => {
            const date = log.logDailyDate.split('T')[0];
            dateCount[date] = (dateCount[date] || 0) + 1;
        });

        let maxDate = '';
        let maxCount = 0;

        Object.entries(dateCount).forEach(([date, count]) => {
            if (count > maxCount) {
                maxCount = count;
                maxDate = date;
            }
        });

        return { date: maxDate, count: maxCount };
    };

    // 최다 로그 기록자
    const getMostActiveUser = () => {
        if (!projectLog || projectLog.length === 0) return { name: '-', count: 0 };

        const userCount = {};

        projectLog.forEach(log => {
            const creator = log.logCreator;
            userCount[creator] = (userCount[creator] || 0) + 1;
        });

        let maxUser = '';
        let maxCount = 0;

        Object.entries(userCount).forEach(([user, count]) => {
            if (count > maxCount) {
                maxCount = count;
                maxUser = user;
            }
        });

        return { name: maxUser, count: maxCount };
    };

    // 최다 연속 작업 일수
    const getMaxConsecutiveDays = () => {
        if (!projectLog || projectLog.length === 0) return 0;

        // 로그가 있는 날짜들을 정렬
        const uniqueDates = [...new Set(
            projectLog.map(log => log.logDailyDate.split('T')[0])
        )].sort();

        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currDate = new Date(uniqueDates[i]);

            // 날짜 차이가 1일인지 확인
            const diffTime = currDate - prevDate;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            if (diffDays === 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    };
    const handleChangeDashBoardPage = (e) => {
        const clickpage = e.currentTarget.dataset.page;
        setDashBoardIndex(clickpage);
    }

    const goToNextPage = () => {
        if (pageIndex === 1) {
            return;
        }
        setPageIndex(pageIndex + 1);
    };

    const goToPrevPage = () => {
        if (pageIndex === 0) {
            return;
        }
        setPageIndex(pageIndex - 1);
    };

    const navigate = useNavigate();
    const todayStr = projectDateKey(new Date());

    const categories = ['개발', '디자인', '기획', '학습', '연구', '취미', '기타'];

    const viewerProjectlogEditModal = () => {

        const selectedLog = getSelectedLog();

        if (!selectedLog) {
            addToast("수정할 로그를 선택해주세요", "warning");
            return;
        }

        setLogTitle(selectedLog.logTitle);

        if (editorRef.current) {
            editorRef.current.getInstance()?.setMarkdown(selectedLog.logContent || '');
        }

        setShowEditLogModal(true);
        setShowCallendarModal(false);
    }

    const deleteThisProjectLog = async () => {
        const selectedLog = getSelectedLog();
        if (!isLogined) {
            addToast("로그인이 필요합니다.", "warning");
            return;
        }
        if (!selectedLog) {
            addToast("선택된 로그가 없습니다", "warning");
            return;
        }

        if (selectedLogId === 'created' || selectedLogId === 'ended') {
            addToast("시스템 로그는 삭제할 수 없습니다", "warning");
            return;
        }

        try {
            const response = await fetch(`${API.API_BASE_URL}/project/daily/log/delete`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    logId: selectedLog.logId,
                    logDate: selectedDate,
                    projectId: projectBasic.id
                })
            });
            const result = await response.json();

            if (response.status === 500) {
                const toastData = {
                    status: 'error',
                    message: result.logDeleteMesage || "서버 통신 불가"
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            } else if (response.status === 404 || response.status === 400) {
                const toastData = {
                    status: 'error',
                    message: result.logDeleteMessage || "유효하지 않은 요청입니다"
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            } else if (response.status === 401) {
                const toastData = {
                    status: 'error',
                    message: result.logDeleteMessage
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/login');
                return;
            } else if (response.status === 403) {
                addToast(result.logDeleteMessage, "warning");
                return;
            } else if (response.status === 201) {
                if (result.logDeleteStatus) {
                    setProjectLog(prevLogs =>
                        prevLogs.filter(log => log.logId !== selectedLog.logId)
                    );

                    setSelectedLogId(null);

                    addToast(result.logDeleteMessage || '로그가 삭제되었습니다', 'success');
                    return;
                }
            }
        } catch (error) {
            handleNetworkError(error, "프로젝트 로그 삭제중 에러가 발생했습니다");
        }
    }

    const getFilteredLogs = () => {
        if (!projectLog || projectLog.length === 0) return [];

        return projectLog.filter(log => {
            const logDate = log.logDailyDate.split('T')[0];
            return logDate === selectedDate;
        });
    };

    // 3. 선택된 로그 찾기
    const getSelectedLog = () => {
        const filtered = getFilteredLogs();
        return filtered.find(log => log.logId === selectedLogId);
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
    const MAX_LOG_TITLE = 20;

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
            projectValue: true,
            projectReportValue: false,
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
                setProjectBasic(prev => ({
                    ...prev,
                    summary: summary,
                    skillStack: skillTool,
                    pjCategory: selectCategory
                }));
                addToast("수정되었습니다.", "success");
                return true;
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

    const handleUpdateSkillTool = async () => {
        const success = await updateSubmitProjectInformation();
        if (success) {
            // addToast 제거
            setShowEditSkillTool(false);
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
                setProjectBasic(prev => ({
                    ...prev,
                    pjCategory: category
                }));
                addToast("카테고리가 수정되었습니다.", "success");
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
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
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

    useEffect(() => {
        const isAnyModalOpen =
            showInputCallendarLogModal ||
            showCallendarModal ||
            showEditProjectThumbModal ||
            showAddMemberModal ||
            showEditLogModal ||
            showReportModal ||           // 추가
            showReportDetailModal;       // 추가

        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [
        showInputCallendarLogModal,
        showCallendarModal,
        showEditProjectThumbModal,
        showAddMemberModal,
        showEditLogModal,
        showReportModal,           // 추가
        showReportDetailModal      // 추가
    ]);

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

                    if (result.projectCallendarLog != null) {
                        setProjectLog(result.projectCallendarLog);
                    } else {
                        setProjectLog([]);
                    }

                    if (result.projectReport != null) {
                        setProjectCompleteReports(result.projectReport);
                    } else {
                        setProjectCompleteReports([]);
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

    const getStatusColor = (status, forText = false) => {
        const colorMap = {
            'H': '#6b7280',
            'I': '#3b82f6',
            'C': '#10b981',
            'D': '#ef4444'
        };
        const color = colorMap[status] || '#6b7280';
        return forText ? `var(--theme-text-${color.slice(1)}, ${color})` : color;
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
                    navigate('/projects');
                } else {
                    addToast(result.deleteMessage, "error"); ss
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

        const events = [];

        // 프로젝트 시작 이벤트
        events.push({
            title: '프로젝트 시작',
            date: projectDateKey(projectBasic.created),
            backgroundColor: '#10b981',
            borderColor: '#10b981',
            type: 'project-start'
        });

        // 프로젝트 종료 이벤트
        if ((projectBasic.status === 'C' || projectBasic.status === 'D') && projectBasic.endDay) {
            events.push({
                title: projectBasic.status === 'C' ? '✅ 프로젝트 완료' : '⏸️ 프로젝트 중단',
                date: projectDateKey(projectBasic.endDay),
                backgroundColor: projectBasic.status === 'C' ? '#10b981' : '#ef4444',
                borderColor: projectBasic.status === 'C' ? '#10b981' : '#ef4444',
                type: 'project-end'
            });
        }

        if (projectLog && projectLog.length > 0) {
            projectLog.forEach(log => {
                const dateStr = log.logDailyDate.split('T')[0];

                const shortContent = log.logTitle || '제목 없는 기록';

                events.push({
                    id: `log-${log.logId}`,
                    title: projectBasic.teamValue ? `[${log.logCreator}] ${shortContent}` : `${shortContent}`,
                    date: dateStr,
                    backgroundColor: '#f59e0b',
                    borderColor: '#f59e0b',
                    textColor: '#fff',
                    type: 'project-log',
                    extendedProps: {
                        logId: log.logId,
                        creator: log.logCreator,
                        fullContent: log.logContent
                    }
                });
            });
        }

        setCalendarEvents(events);
    }, [projectBasic, projectLog]);

    return (
        <>
            <div className="page-container" data-index={pageIndex}>
                {pageIndex !== 0 && projectBasic.status === 'C' && (
                    <div className="page-arrow-overlay-left">
                        <button
                            className="page-arrow-hitbox"
                            onClick={goToPrevPage}
                        >
                            <span className="page-arrow-icon">
                                ‹
                            </span>
                        </button>
                    </div>
                )}
                {pageIndex === 0 && (
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
                                        <div className="button-wrapper project-resource-header-actions">
                                            <button className="project-thumb-edit-btn" onClick={() => setShowEditProjectThumbModal(true)}>
                                                프로젝트 썸네일 변경
                                            </button>
                                            <div className="project-resource-management-actions">
                                                <button type="button" className="project-resource-add-btn" onClick={projectResources.openAdd} disabled={projectResources.loading || projectResources.busy || !!projectResources.order || !projectResources.data || (projectResources.data.links?.length || 0) >= 10}>하이퍼링크 추가</button>
                                            <button className="project-delete-btn"
                                                onClick={handleDeleteProject}
                                            >
                                                삭제
                                            </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="project-manage-content-area">
                            <div className="project-manage-summary-area">
                                <ProjectDescription key={projectId} resources={projectResources} fallbackSummary={projectBasic.summary}
                                    canManage={isLogined && loginSuccess && permissionGrade === 'L'}
                                    onSaved={next => { setProjectBasic(prev => ({ ...prev, summary: next.summary })); setSummary(next.summary); }} />

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
                                            style={{ color: getStatusColor(projectBasic.status, true) }}
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
                            <div className="project-manage-side-column">
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
                                    <div className="member-slide-wrapper">
                                        {/* 메인 카드 */}
                                        <div className="member-card">
                                            {(() => {
                                                const member = projectMember[memberSlideIndex];
                                                return (
                                                    <>
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
                                                        {permissionGrade === 'L' && member.pjStatus === 'T' && (
                                                            <div className="member-actions">
                                                                <button
                                                                    className="member-action-btn change-grade"
                                                                    onClick={() => handleChangeGrade(member.id, member.pjMemberGrade)}
                                                                >
                                                                    {member.pjMemberGrade !== 'L' ? "관리자로 변경" : "팀원으로 변경"}
                                                                </button>
                                                                <button
                                                                    className="member-action-btn remove"
                                                                    onClick={() => handleRemoveMember(member.id)}
                                                                >
                                                                    제거
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* 네비게이션 (멤버 2명 이상일 때만) */}
                                        {projectMember.length > 1 && (
                                            <div className="member-slide-nav">
                                                <button
                                                    className="member-slide-btn"
                                                    onClick={() => {
                                                        setMemberSlideIndex(prev =>
                                                            prev === 0 ? projectMember.length - 1 : prev - 1
                                                        );
                                                        resetMemberSlideTimer();
                                                    }}
                                                >
                                                    ‹
                                                </button>

                                                {/* 점 인디케이터 */}
                                                <div className="member-slide-dots">
                                                    {projectMember.map((_, i) => (
                                                        <button
                                                            key={i}
                                                            className={`member-slide-dot ${i === memberSlideIndex ? 'active' : ''}`}
                                                            onClick={() => {
                                                                setMemberSlideIndex(i);
                                                                resetMemberSlideTimer();
                                                            }}
                                                        />
                                                    ))}
                                                </div>

                                                <button
                                                    className="member-slide-btn"
                                                    onClick={() => {
                                                        setMemberSlideIndex(prev =>
                                                            (prev + 1) % projectMember.length
                                                        );
                                                        resetMemberSlideTimer();
                                                    }}
                                                >
                                                    ›
                                                </button>
                                            </div>
                                        )}
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

                                <ProjectLinks resources={projectResources} canManage={isLogined && loginSuccess && permissionGrade === 'L'} />
                            </div>
                            <ProjectLinkDialog resources={projectResources} />

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
                                                placeholder="팀원의 닉네임 또는 이름을 입력해주세요"
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
                        {(showInputCallendarLogModal || showEditLogModal) && !showCallendarModal && isLogined && nickname && (
                            <ProjectLogComposer key={`${nickname}:${projectId}:${selectedDate}:${showEditLogModal ? selectedLogId : 'new'}`}
                                user={nickname} projectId={projectId} projectTitle={projectBasic.title} date={selectedDate}
                                log={showEditLogModal ? getSelectedLog() : null} adapter={adapter}
                                onClose={() => { setShowInputCallendarLogModal(false); setShowEditLogModal(false); setShowCallendarModal(true); }}
                                onSaved={value => {
                                    if (showEditLogModal) {
                                        setProjectLog(logs => logs.map(log => log.logId === value.logId ? {...log, logTitle:value.title, logContent:value.content} : log));
                                        setShowEditLogModal(false);setShowCallendarModal(true);
                                        addToast('기록이 수정되었습니다.', 'success');
                                    } else { window.location.reload(); }
                                }}/>
                        )}
                        {showCallendarModal && (
                            <div className="callendar-modal-overlay calendar-log-overlay" onClick={event => {
                                if (event.target === event.currentTarget) closeCalendarLog();
                            }}>
                                <div className="callendar-date-container" ref={calendarLogDialogRef} role="dialog" aria-modal="true"
                                    aria-labelledby="calendar-log-dialog-title" tabIndex={-1} onClick={e => e.stopPropagation()}>
                                    <div className="project-log-container">
                                        <div className="project-modal-log-header">
                                            <div className="calendar-log-heading">
                                                <span className="calendar-log-project-name">{projectBasic.title}</span>
                                                <h3 id="calendar-log-dialog-title">{selectedDate}</h3>
                                            </div>
                                            <div className="calendar-log-actions">
                                                {isLogined && loginSuccess && selectedDate === todayStr && (
                                                    <button type="button" onClick={() => {
                                                        setShowInputCallendarLogModal(true);
                                                        setLogTitle('');
                                                        setShowCallendarModal(false);
                                                    }}>기록 추가</button>
                                                )}
                                                <button type="button" className="calendar-log-close" aria-label="로그 뷰어 닫기" onClick={closeCalendarLog}>×</button>
                                            </div>
                                        </div>

                                        {/* 로그 뷰어 */}
                                        {(() => {
                                            const filteredLogs = getFilteredLogs();
                                            const selectedLog = getSelectedLog();

                                            // 프로젝트 생성일/종료일 체크
                                            const isCreatedDate = projectDateKey(projectBasic.created) === selectedDate;
                                            const isEndDate = (projectBasic.status === 'D' || projectBasic.status === 'C') &&
                                                projectDateKey(projectBasic.endDay) === selectedDate;

                                            return filteredLogs.length > 0 || isCreatedDate || isEndDate ? (
                                                <div className="project-log-viewer-container">
                                                    <div className="project-log-list-section">
                                                        <label className="calendar-log-select-label" htmlFor="calendar-log-select">
                                                            기록 선택 · {filteredLogs.length + (isCreatedDate ? 1 : 0) + (isEndDate ? 1 : 0)}개
                                                        </label>
                                                        <select id="calendar-log-select" className="calendar-log-select" value={selectedLogId == null ? '' : String(selectedLogId)}
                                                            onChange={event => {
                                                                const value = event.target.value;
                                                                setSelectedLogId(value === 'created' || value === 'ended' ? value : filteredLogs.find(log => String(log.logId) === value)?.logId ?? null);
                                                            }}>
                                                            <option value="" disabled>확인할 기록을 선택해주세요</option>
                                                            {isCreatedDate && <option value="created">시스템 · 프로젝트 시작</option>}
                                                            {isEndDate && <option value="ended">시스템 · {projectBasic.status === 'C' ? '프로젝트 완료' : '프로젝트 중단'}</option>}
                                                            {filteredLogs.map(log => <option key={log.logId} value={String(log.logId)}>{log.logTitle}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* 우측: 로그 상세 내용 */}
                                                    <div className="project-log-content-section">
                                                        {selectedLog ? (
                                                            <div className="project-log-detail">
                                                                <div className="log-detail-header">
                                                                    <div className="log-header-wrapper">
                                                                        <h4>{selectedLog.logTitle}</h4>
                                                                        {isLogined && loginSuccess && (
                                                                            <div className="log-active-button-wrapper">
                                                                                <button type="button" aria-label="로그 수정" title="수정" onClick={() => viewerProjectlogEditModal()}>
                                                                                    <svg
                                                                                        className="edit-log-btn"
                                                                                        width="16"
                                                                                        height="16"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                    >
                                                                                        <path
                                                                                            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                                                                                            stroke="currentColor"
                                                                                            stroke-width="1.8"
                                                                                            stroke-linejoin="round"
                                                                                        />
                                                                                        <path
                                                                                            d="M14.06 4.94l3.75 3.75"
                                                                                            stroke="currentColor"
                                                                                            stroke-width="1.8"
                                                                                            stroke-linecap="round"
                                                                                        />
                                                                                    </svg>
                                                                                    <p className="btn-edit-com">
                                                                                        수정
                                                                                    </p>
                                                                                </button>
                                                                                <button type="button" aria-label="로그 삭제" title="삭제" onClick={() => deleteThisProjectLog()}>
                                                                                    <svg
                                                                                        className="delete-log-btn"
                                                                                        width="16"
                                                                                        height="16"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                    >
                                                                                        <path
                                                                                            d="M4 7h16"
                                                                                            stroke="currentColor"
                                                                                            stroke-width="1.8"
                                                                                            stroke-linecap="round"
                                                                                        />
                                                                                        <path
                                                                                            d="M9 7V4h6v3"
                                                                                            stroke="currentColor"
                                                                                            stroke-width="1.8"
                                                                                            stroke-linejoin="round"
                                                                                        />
                                                                                        <rect
                                                                                            x="6"
                                                                                            y="7"
                                                                                            width="12"
                                                                                            height="13"
                                                                                            rx="2"
                                                                                            stroke="currentColor"
                                                                                            stroke-width="1.8"
                                                                                        />
                                                                                        <path
                                                                                            d="M10 11v6M14 11v6"
                                                                                            stroke="currentColor"
                                                                                            stroke-width="1.8"
                                                                                            stroke-linecap="round"
                                                                                        />
                                                                                    </svg>
                                                                                    <p className="btn-delete-com">
                                                                                        삭제
                                                                                    </p>
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="log-detail-meta">
                                                                        <span className="log-detail-creator">작성자: {selectedLog.logCreator}</span>
                                                                        <span className="log-detail-datetime">
                                                                            {new Date(selectedLog.createdDate).toLocaleString('ko-KR', {
                                                                                year: 'numeric',
                                                                                month: '2-digit',
                                                                                day: '2-digit',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="log-detail-content">
                                                                    <div className="log-content-text">
                                                                        <Viewer
                                                                            key={selectedLog.logId}
                                                                            initialValue={selectedLog.logContent || ''}
                                                                            customHTMLRenderer={{
                                                                                listItem(node, { entering }) {
                                                                                    return {
                                                                                        type: entering ? 'openTag' : 'closeTag',
                                                                                        tagName: 'li',
                                                                                        outerNewLine: true,
                                                                                    };
                                                                                },
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : selectedLogId === 'created' ? (
                                                            <div className="project-log-detail">
                                                                <div className="log-detail-header">
                                                                    <h4>프로젝트 생성일</h4>
                                                                    <div className="log-detail-meta">
                                                                        <span className="log-detail-datetime">
                                                                            {new Date(projectBasic.created).toLocaleString('ko-KR', {
                                                                                year: 'numeric',
                                                                                month: '2-digit',
                                                                                day: '2-digit',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="log-detail-content">
                                                                    <div className="special-log-content">
                                                                        <div className="special-log-icon">🎉</div>
                                                                        <h3>{projectBasic.title}</h3>
                                                                        <p>
                                                                            <strong>{selectedDate}</strong>에 프로젝트가 시작되었습니다.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : selectedLogId === 'ended' ? (
                                                            <div className="project-log-detail">
                                                                <div className="log-detail-header">
                                                                    <h4>{projectBasic.status === 'C' ? '프로젝트 완료일' : '프로젝트 중단일'}</h4>
                                                                    <div className="log-detail-meta">
                                                                        <span className="log-detail-datetime">
                                                                            {new Date(projectBasic.endDay).toLocaleString('ko-KR', {
                                                                                year: 'numeric',
                                                                                month: '2-digit',
                                                                                day: '2-digit',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="log-detail-content">
                                                                    <div className="special-log-content">
                                                                        <div className="special-log-icon">
                                                                            {projectBasic.status === 'C' ? '✅' : '⏸️'}
                                                                        </div>
                                                                        <h3>{projectBasic.title}</h3>
                                                                        <p>
                                                                            <strong>{selectedDate}</strong>에 프로젝트가
                                                                            {projectBasic.status === 'C' ? ' 성공적으로 완료' : ' 중단'}되었습니다.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="project-log-empty-state">
                                                                <svg
                                                                    width="64"
                                                                    height="64"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="1.5"
                                                                >
                                                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                <p>로그를 선택해주세요</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="project-log-empty-container">
                                                    <svg
                                                        width="80"
                                                        height="80"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                    >
                                                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <h4>프로젝트 로그 없음</h4>
                                                    <p>현재 선택된 날짜에 등록된 로그가 없습니다.</p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="project-calendar-section">
                            {isLogined&&nickname&&<ProjectLogDraftList user={nickname} projectId={projectId}
                                refreshKey={String(showInputCallendarLogModal)+String(showEditLogModal)}
                                onResume={date=>{setSelectedDate(date);setSelectedLogId(null);setShowCallendarModal(false);setShowEditLogModal(false);setShowInputCallendarLogModal(true);}}/>}

                            {projectBasic.created && projectBasic.status !== 'D' && (
                                <ProjectCalendar key={`${projectBasic.id}-${projectBasic.status}`} project={projectBasic} events={calendarEvents} onSelect={(date, logId) => {
                                    const logs = projectLog.filter(log => log.logDailyDate.split('T')[0] === date);
                                    const fallback = logs[0]?.logId ?? (projectDateKey(projectBasic.created) === date ? 'created' :
                                        (projectBasic.status === 'C' && projectDateKey(projectBasic.endDay) === date ? 'ended' : null));
                                    setSelectedDate(date);
                                    setSelectedLogId(logId ?? fallback);
                                    setShowCallendarModal(true);
                                    setShowEditLogModal(false);
                                }} />
                            )}
                        </div>
                    </div>
                )}
                {pageIndex === 1 && projectBasic.status === 'C' && (
                    <div className="project-complete-report-container">
                        <div className="project-complete-report-header">
                            <div className="project-complete-report-main-information">
                                <h1>{projectBasic.title} 프로젝트</h1>
                                <button
                                    className={`rpbtn ${dashboardIndex === 'report' ? 'rpbtn-visible' : 'rpbtn-hidden'}`}
                                    onClick={() => navigate(`/projects/complete/report/${projectId}`)}
                                >
                                    레포트 추가
                                </button>
                            </div>
                            <br />
                            <div className="project-complete-report-sub-information">
                                <span class="sub-info-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock">
                                        <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span className="sub-info-cm">
                                        총 {getProjectDays(projectBasic)} 일
                                    </span>
                                </span>
                                <span class="sub-info-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text">
                                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                        <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                                        <path d="M10 9H8"></path>
                                        <path d="M16 13H8"></path>
                                        <path d="M16 17H8"></path>
                                    </svg>
                                    <span className="sub-info-cm">
                                        {projectLog.length}개의 로그
                                    </span>
                                </span>
                                <span class="sub-info-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                    <span className="sub-info-cm">
                                        {projectMember.length}명 참여
                                    </span>
                                </span>
                            </div>
                            <div className="project-complete-report-sub-header">
                                <span className={dashboardIndex === 'overview' ? "selected-sub-menu active" : "selected-sub-menu"}
                                    data-page="overview"
                                    onClick={handleChangeDashBoardPage}>개요</span>
                                <span className={dashboardIndex === 'timeline' ? "selected-sub-menu active" : "selected-sub-menu"}
                                    data-page="timeline"
                                    onClick={handleChangeDashBoardPage}>타임라인</span>
                                {/* <span className={dashboardIndex === 'insight' ? "selected-sub-menu active" : "selected-sub-menu"}
                                    data-page="insight"
                                    onClick={handleChangeDashBoardPage}>인사이트</span> */}
                                <span className={dashboardIndex === 'report' ? "selected-sub-menu active" : "selected-sub-menu"}
                                    data-page="report"
                                    onClick={handleChangeDashBoardPage}>레포트</span>
                            </div>
                        </div>
                        {dashboardIndex === 'report' && projectBasic.status === 'C' && (
                            <div className="report-section-container">
                                {/* 헤더 */}
                                <div className="timeline-section-header">
                                    <h4>프로젝트 기술서</h4>
                                    <span className="timeline-summary-badge">
                                        총 {projectCompleteReports.length}개의 레포트
                                    </span>
                                </div>

                                <div className="timeline-section-divider" />

                                {/* 레포트 카드 그리드 */}
                                {projectCompleteReports.length > 0 ? (
                                    <div className="report-cards-grid">
                                        {projectCompleteReports.map((report) => (
                                            <div
                                                key={report.reportId}
                                                className="report-card"
                                                onClick={() => {
                                                    setSelectedReportId(report.reportId);
                                                    setShowReportDetailModal(true);
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setSelectedReportId(report.reportId);
                                                        setShowReportDetailModal(true);
                                                    }
                                                }}
                                            >
                                                {/* 카드 헤더 */}
                                                <div className="report-card-header">
                                                    <h3 className="report-card-title">
                                                        {report.reportTitle}
                                                    </h3>
                                                    <div className="report-card-actions">
                                                        {permissionGrade === 'L' && (
                                                            <>
                                                                <button
                                                                    className="report-action-btn edit"
                                                                    onClick={(e) => {
                                                                        navigate(`/projects/report/update/${report.reportId}/${projectId}`)
                                                                    }}
                                                                    aria-label="레포트 수정"
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                                                                        <path d="M14.06 4.94l3.75 3.75" strokeLinecap="round" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    className="report-action-btn delete"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteReport(report.reportId);
                                                                    }}
                                                                    aria-label="레포트 삭제"
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M4 7h16" strokeLinecap="round" />
                                                                        <path d="M9 7V4h6v3" strokeLinejoin="round" />
                                                                        <rect x="6" y="7" width="12" height="13" rx="2" />
                                                                        <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 카드 본문 미리보기 - Viewer 사용 */}
                                                <div className="report-card-preview-viewer">
                                                    <Viewer
                                                        key={`preview-${report.reportId}`}
                                                        initialValue={report.reportContent?.substring(0, 200) || '내용 없음'}
                                                        customHTMLRenderer={{
                                                            listItem(node, { entering }) {
                                                                return {
                                                                    type: entering ? 'openTag' : 'closeTag',
                                                                    tagName: 'li',
                                                                    outerNewLine: true,
                                                                };
                                                            },
                                                        }}
                                                    />
                                                    {report.reportContent?.length > 200 && (
                                                        <div className="report-preview-fade">...</div>
                                                    )}
                                                </div>

                                                {/* 카드 푸터 */}
                                                <div className="report-card-footer">
                                                    <span className="report-card-date">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                                        </svg>
                                                        {new Date(report.reportCreated).toLocaleDateString('ko-KR', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit'
                                                        })}
                                                    </span>
                                                    <span className="report-card-more">자세히 보기 →</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="timeline-empty">
                                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p>작성된 레포트가 없습니다</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 레포트 상세보기 모달 */}
                        {showReportDetailModal && selectedReportId && (
                            <div
                                className="project-modal-overlay"
                                onClick={() => {
                                    setShowReportDetailModal(false);
                                    setSelectedReportId(null);
                                }}
                            >
                                <div
                                    className="callendar-input-log-modal"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ maxWidth: '1000px' }}
                                >
                                    {(() => {
                                        const report = projectCompleteReports.find(r => r.reportId === selectedReportId);
                                        if (!report) return null;

                                        return (
                                            <>
                                                <div className="callendar-log-input-header">
                                                    <h4>{report.reportTitle}</h4>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary, #6b7280)', marginTop: '8px' }}>
                                                        작성일: {new Date(report.reportCreated).toLocaleDateString('ko-KR', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit'
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="log-detail-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                                    <Viewer
                                                        key={`detail-${report.reportId}`}
                                                        initialValue={report.reportContent || ''}
                                                        customHTMLRenderer={{
                                                            listItem(node, { entering }) {
                                                                return {
                                                                    type: entering ? 'openTag' : 'closeTag',
                                                                    tagName: 'li',
                                                                    outerNewLine: true,
                                                                };
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                        {dashboardIndex === 'insight' && projectBasic.status === 'C' && (
                            <div className="insight-section-container">
                                <h3>준비중</h3>
                            </div>
                        )}
                        {dashboardIndex === 'timeline' && projectBasic.status === 'C' && (
                            <div className="timeline-section-container">
                                <div className="timeline-section-header">
                                    <h4>프로젝트 타임라인</h4>
                                    <span className="timeline-summary-badge">
                                        총 {getTimelineData().length}개 날짜 · {projectLog.length}개 로그
                                    </span>
                                </div>

                                <div className="timeline-section-divider" />

                                <div className="timeline-section-content">
                                    {getTimelineData().map((group, groupIdx) => {
                                        const expanded = isDateExpanded(group.date);
                                        const logCount = group.events.filter(e => e.type === 'log').length;
                                        const hasMilestone = group.events.some(e => e.type !== 'log');
                                        const isFirst = groupIdx === 0;
                                        const isLast = groupIdx === getTimelineData().length - 1;

                                        return (
                                            <div key={group.date} className="timeline-event">
                                                {/* 수직선 위의 원형 노드 */}
                                                <div className={`timeline-dot ${hasMilestone ? 'milestone' : ''}`}>
                                                    <div className="timeline-dot-inner" />
                                                </div>

                                                {/* 날짜 그룹 카드 */}
                                                <div className="timeline-card">
                                                    {/* 날짜 헤더 (클릭으로 접기/펼기) */}
                                                    <button
                                                        className="timeline-date-header"
                                                        onClick={() => logCount > 0 && toggleDateExpand(group.date)}
                                                        aria-expanded={expanded}
                                                    >
                                                        <div className="timeline-date-left">
                                                            <span className="timeline-date-label">
                                                                {new Date(group.date + 'T00:00:00').toLocaleDateString('ko-KR', {
                                                                    year: 'numeric',
                                                                    month: '2-digit',
                                                                    day: '2-digit',
                                                                    weekday: 'short'
                                                                })}
                                                            </span>
                                                            {logCount > 0 && (
                                                                <span className="timeline-log-count-badge">{logCount}개</span>
                                                            )}
                                                        </div>
                                                        {logCount > 0 && (
                                                            <span className={`timeline-toggle-arrow ${expanded ? 'expanded' : ''}`}>
                                                                ▼
                                                            </span>
                                                        )}
                                                    </button>

                                                    {/* 이벤트 목록 (접기/펼기 적용) */}
                                                    <div className={`timeline-events-list ${expanded ? 'expanded' : 'collapsed'}`}>
                                                        {group.events.map((ev, evIdx) => {
                                                            /* ── milestone-start ── */
                                                            if (ev.type === 'milestone-start') {
                                                                return (
                                                                    <div key={`ms-start-${group.date}`} className="timeline-milestone milestone-start">
                                                                        <div className="timeline-milestone-icon">🎉</div>
                                                                        <div className="timeline-milestone-body">
                                                                            <span className="timeline-milestone-title">프로젝트 시작</span>
                                                                            <span className="timeline-milestone-time">
                                                                                {new Date(ev.payload.datetime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            /* ── milestone-end ── */
                                                            if (ev.type === 'milestone-end') {
                                                                return (
                                                                    <div key={`ms-end-${group.date}`} className="timeline-milestone milestone-end">
                                                                        <div className="timeline-milestone-icon">✅</div>
                                                                        <div className="timeline-milestone-body">
                                                                            <span className="timeline-milestone-title">프로젝트 완료</span>
                                                                            <span className="timeline-milestone-time">
                                                                                {new Date(ev.payload.datetime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            /* ── milestone-halted ── */
                                                            if (ev.type === 'milestone-halted') {
                                                                return (
                                                                    <div key={`ms-halt-${group.date}`} className="timeline-milestone milestone-halted">
                                                                        <div className="timeline-milestone-icon">⏸️</div>
                                                                        <div className="timeline-milestone-body">
                                                                            <span className="timeline-milestone-title">프로젝트 중단</span>
                                                                            <span className="timeline-milestone-time">
                                                                                {new Date(ev.payload.datetime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            /* ── 일반 로그 ── */
                                                            const log = ev.payload;
                                                            return (
                                                                <div
                                                                    key={log.logId}
                                                                    className="timeline-log-card timeline-log-card--clickable"
                                                                    onClick={() => {
                                                                        setPageIndex(0);
                                                                        setSelectedDate(group.date);
                                                                        setSelectedLogId(log.logId);
                                                                        setShowCallendarModal(true);
                                                                        setShowEditLogModal(false);
                                                                    }}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                                            e.preventDefault();
                                                                            setSelectedDate(group.date);
                                                                            setSelectedLogId(log.logId);
                                                                            setShowCallendarModal(true);
                                                                            setShowEditLogModal(false);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="timeline-log-card-header">
                                                                        <span className="timeline-log-card-title">
                                                                            {log.logTitle.length > 28
                                                                                ? log.logTitle.substring(0, 28) + '…'
                                                                                : log.logTitle}
                                                                        </span>
                                                                        <span className="timeline-log-card-time">
                                                                            {log.createdDate && new Date(log.createdDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="timeline-log-card-meta">
                                                                        <span className="timeline-log-card-creator">
                                                                            👤 {log.logCreator}
                                                                        </span>
                                                                        {projectBasic.teamValue && (
                                                                            <span className="timeline-log-card-role">
                                                                                {projectMember.find(m => m.pjMemberName === log.logCreator)?.pjMemberRole || '기타'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* 타임라인 데이터가 비어있는 경우 */}
                                    {getTimelineData().length === 0 && (
                                        <div className="timeline-empty">
                                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            <p>타임라인 데이터가 없습니다</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {dashboardIndex === 'overview' && projectBasic.status === 'C' && (
                            <div className="overview-section-container">
                                <div className="overview-card-wrapper">
                                    <div className="overview-card">
                                        <h3>로그 기록 일수</h3>
                                        <p className="card-value">{getActualWorkingDays()}일</p>
                                        <p className="card-description">
                                            전체 {getProjectDays(projectBasic)}일 중 기록
                                        </p>
                                    </div>

                                    <div className="overview-card">
                                        <h3>최다 로그 일수</h3>
                                        <p className="card-value">{getMostLoggedDay().count}개</p>
                                        <p className="card-description">
                                            {getMostLoggedDay().date}
                                        </p>
                                    </div>

                                    <div className="overview-card">
                                        <h3>최다 로그 기록자</h3>
                                        <p className="card-value">{getMostActiveUser().name}</p>
                                        <p className="card-description">
                                            총 {getMostActiveUser().count}개 작성
                                        </p>
                                    </div>

                                    <div className="overview-card">
                                        <h3>최다 연속 작업 일수</h3>
                                        <p className="card-value">{getMaxConsecutiveDays()}일</p>
                                        <p className="card-description">
                                            연속 기록 달성
                                        </p>
                                    </div>
                                </div>

                                {/* 중단: 차트 영역 */}
                                <div className="overview-charts-section">
                                    {/* 멤버별 로그 분포 원형 차트 */}
                                    <div className="chart-container pie-chart-container">
                                        <div className="chart-header">
                                            <h3>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="9" cy="7" r="4"></circle>
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                </svg>
                                                멤버별 로그 분포
                                            </h3>
                                        </div>

                                        <div className="pie-chart-wrapper">
                                            {/* 원형 차트 - conic-gradient 방식 */}
                                            <div className="pie-chart-circle">
                                                {(() => {
                                                    const distribution = getMemberLogDistribution();
                                                    let accumulatedPercent = 0;

                                                    const gradientStops = distribution.map((member, index) => {
                                                        const color = getChartColor(index);
                                                        const startPercent = accumulatedPercent;
                                                        const endPercent = accumulatedPercent + parseFloat(member.percentage);
                                                        accumulatedPercent = endPercent;

                                                        return `${color} ${startPercent}% ${endPercent}%`;
                                                    }).join(', ');

                                                    return (
                                                        <div
                                                            className="pie-chart-visual"
                                                            style={{
                                                                background: `conic-gradient(${gradientStops})`
                                                            }}
                                                        >
                                                            <div className="pie-chart-center"></div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* 범례 */}
                                            <div className="pie-chart-legend">
                                                {getMemberLogDistribution().map((member, index) => (
                                                    <div key={member.name} className="legend-item">
                                                        <span
                                                            className="legend-color"
                                                            style={{ backgroundColor: getChartColor(index) }}
                                                        ></span>
                                                        <span className="legend-name">{member.name}</span>
                                                        <span className="legend-value">
                                                            {member.count}개 ({member.percentage}%)
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* 주차별 로그 막대 그래프 */}
                                    <div className="chart-container bar-chart-container">
                                        <div className="chart-header">
                                            <h3>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="12" y1="20" x2="12" y2="10"></line>
                                                    <line x1="18" y1="20" x2="18" y2="4"></line>
                                                    <line x1="6" y1="20" x2="6" y2="16"></line>
                                                </svg>
                                                주차별 로그 기록
                                            </h3>
                                        </div>

                                        <div className="bar-chart-wrapper">
                                            {getWeeklyLogData().map((week, index) => {
                                                const maxCount = Math.max(...getWeeklyLogData().map(w => w.count));
                                                const heightPercent = maxCount > 0 ? (week.count / maxCount) * 100 : 0;

                                                return (
                                                    <div key={week.weekNumber} className="bar-item">
                                                        <div
                                                            className="bar"
                                                            style={{ height: `${heightPercent}%` }}
                                                            data-count={week.count}
                                                        >
                                                            <span className="bar-tooltip">{week.count}개</span>
                                                        </div>
                                                        <span className="bar-label">
                                                            {week.weekNumber}주차
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {/* 하단: GitHub 스타일 활동 히트맵 */}
                                <div className="activity-heatmap-section">
                                    <div className="chart-header">
                                        <h3>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            프로젝트 활동 기록
                                        </h3>
                                        <div className="heatmap-legend">
                                            <span className="legend-label">적음</span>
                                            <div className="legend-colors">
                                                <span className="legend-box" style={{ backgroundColor: '#ebedf0' }} title="활동 없음"></span>
                                                <span className="legend-box" style={{ backgroundColor: '#9be9a8' }} title="1개"></span>
                                                <span className="legend-box" style={{ backgroundColor: '#40c463' }} title="2-4개"></span>
                                                <span className="legend-box" style={{ backgroundColor: '#30a14e' }} title="5-9개"></span>
                                                <span className="legend-box" style={{ backgroundColor: '#216e39' }} title="10개 이상"></span>
                                            </div>
                                            <span className="legend-label">많음</span>
                                        </div>
                                    </div>

                                    {(() => {
                                        const { weeks, months } = getActivityHeatmapData();

                                        if (weeks.length === 0) {
                                            return (
                                                <div className="heatmap-empty">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                    </svg>
                                                    <p>프로젝트 기간 정보가 없습니다</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="heatmap-wrapper">
                                                <div className="heatmap-scroll-container">
                                                    <div className="heatmap-content">
                                                        <div className="heatmap-main">
                                                            {/* 요일 레이블 */}
                                                            <div className="heatmap-weekdays">
                                                                <span>일</span>
                                                                <span>월</span>
                                                                <span>화</span>
                                                                <span>수</span>
                                                                <span>목</span>
                                                                <span>금</span>
                                                                <span>토</span>
                                                            </div>

                                                            {/* 히트맵 그리드 */}
                                                            <div className="heatmap-grid">
                                                                {weeks.map((week, weekIndex) => (
                                                                    <div key={`week-${weekIndex}`} className="heatmap-week">
                                                                        {week.map((day, dayIndex) => {
                                                                            if (!day.isInRange || day.count === null) {
                                                                                return (
                                                                                    <div
                                                                                        key={`${weekIndex}-${dayIndex}`}
                                                                                        className="heatmap-day empty"
                                                                                    ></div>
                                                                                );
                                                                            }

                                                                            return (
                                                                                <div
                                                                                    key={day.date}
                                                                                    className="heatmap-day heatmap-day--clickable"
                                                                                    style={{ backgroundColor: getActivityColor(day.count) }}
                                                                                    data-date={day.date}
                                                                                    data-count={day.count}
                                                                                    role="gridcell"
                                                                                    aria-label={`${day.date}: ${day.count}개 로그. 클릭하여 상세 확인`}
                                                                                    tabIndex={0}
                                                                                    onClick={() => {
                                                                                        setPageIndex(0);
                                                                                        setSelectedDate(day.date);
                                                                                        setSelectedLogId(null);
                                                                                        setShowCallendarModal(true);
                                                                                        setShowEditLogModal(false);
                                                                                    }}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                                                            e.preventDefault();
                                                                                            setSelectedDate(day.date);
                                                                                            setSelectedLogId(null);
                                                                                            setShowCallendarModal(true);
                                                                                            setShowEditLogModal(false);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <span className="heatmap-tooltip">
                                                                                        {new Date(day.date).toLocaleDateString('ko-KR', {
                                                                                            year: 'numeric',
                                                                                            month: '2-digit',
                                                                                            day: '2-digit',
                                                                                            weekday: 'short'
                                                                                        })} · 로그 {day.count}개
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 스크롤 힌트 */}
                                                    {weeks.length > 20 && (
                                                        <div className="heatmap-scroll-hint">
                                                            ← 좌우로 스크롤하여 전체 기록을 확인하세요 →
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 통계 요약 */}
                                                <div className="heatmap-stats">
                                                    <div className="heatmap-stat-item">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                                        </svg>
                                                        <div className="stat-content">
                                                            <span className="stat-label">총 작업일</span>
                                                            <span className="stat-value">{getActualWorkingDays()}일</span>
                                                        </div>
                                                    </div>
                                                    <div className="heatmap-stat-item">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                            <polyline points="14 2 14 8 20 8"></polyline>
                                                            <line x1="12" y1="18" x2="12" y2="12"></line>
                                                            <line x1="9" y1="15" x2="15" y2="15"></line>
                                                        </svg>
                                                        <div className="stat-content">
                                                            <span className="stat-label">총 로그</span>
                                                            <span className="stat-value">{projectLog.length}개</span>
                                                        </div>
                                                    </div>
                                                    <div className="heatmap-stat-item">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="12" y1="1" x2="12" y2="23"></line>
                                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                                        </svg>
                                                        <div className="stat-content">
                                                            <span className="stat-label">일평균</span>
                                                            <span className="stat-value">
                                                                {(projectLog.length / Math.max(getProjectDays(projectBasic), 1)).toFixed(1)}개
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="heatmap-stat-item">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                                        </svg>
                                                        <div className="stat-content">
                                                            <span className="stat-label">최다 기록일</span>
                                                            <span className="stat-value">{getMostLoggedDay().count}개</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {projectBasic.status === 'C' && pageIndex !== 1 && (
                    <div className="page-arrow-overlay">
                        <button
                            className="page-arrow-hitbox"
                            aria-label="다음 페이지"
                            onClick={goToNextPage}
                        >
                            <span className="page-arrow-icon">›</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}