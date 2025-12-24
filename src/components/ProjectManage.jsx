import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import API from '../config/apiConfig.js';
import '../css/ProjectManage.css';

export default function ProjectManage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [projectBasic, setProjectBasic] = useState([]);
    const [projectMember, setProjectMember] = useState([]);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');

    const getMemberGradeLabel = (grade) => {
    return grade === 'L' ? '관리자' : '팀원';
};

const getMemberStatLabel = (stat) => {
    const statMap = {
        'H': '대기',
        'I': '참여중'
    };
    return statMap[stat] || '알 수 없음';
};

const getMemberStatColor = (stat) => {
    const colorMap = {
        'H': '#f59e0b',
        'I': '#10b981'
    };
    return colorMap[stat] || '#6b7280';
};

// 3. 팀원 추가 핸들러
const handleAddMember = async () => {
    if (!newMemberName.trim()) {
        addToast('팀원 이름을 입력해주세요.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API.API_BASE_URL}/project/member/add`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: projectId,
                memberName: newMemberName
            })
        });

        if (response.ok) {
            addToast('팀원이 추가되었습니다.', 'success');
            setNewMemberName('');
            setShowAddMemberModal(false);
            // 프로젝트 정보 다시 불러오기
            window.location.reload();
        } else {
            addToast('팀원 추가에 실패했습니다.', 'error');
        }
    } catch (error) {
        addToast('팀원 추가 중 오류가 발생했습니다.', 'error');
    }
};

// 4. 팀원 삭제 핸들러
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

            if (response.ok) {
                addToast('팀원이 제거되었습니다.', 'success');
                window.location.reload();
            } else {
                addToast('팀원 제거에 실패했습니다.', 'error');
            }
        } catch (error) {
            addToast('팀원 제거 중 오류가 발생했습니다.', 'error');
        }
    }
};


    const statusMenuRef = useRef(null);
    //status-dropdown 닫기---------------------------------------------------------------
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
    // ------------------------------------------------------------------------------------

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
                    window.location.href = '/';
                }

                const result = await response.json();

                if (result.projectOneInfoStatus) {
                    if (result.projectOneInfobasic != null) {
                        setProjectBasic(result.projectOneInfobasic);
                    } else {
                        setProjectBasic([]);
                    }
                    //팀원 정보 엔티티 => 리스트로 넣음
                    if (result.projectMemberInformation != null) {
                        setProjectMember(result.projectMemberInformation);
                    } else {
                        setProjectMember([]);
                    }
                } else {
                    const toastData = {
                        status: 'warning',
                        message: result.projectOneInfoMessage
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    window.location.href = '/';
                }

            } catch (error) {
                const toastData = {
                    status: 'error',
                    message: '프로젝트 페이지 useEffect API 에러'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                window.location.href = '/';
            }
        };
        getThisProjectInformation();
    }, []);

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
        // 상태 변경 API 호출 로직
        try {
            const response = await fetch(`${API.API_BASE_URL}/project/status/update`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId,
                    status: newStatus
                })
            });

            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: '현재 서버가 실행중이 아니라 프로젝트 상태 변경이 불가능합니다 나중에 다시 시도해주십시오.'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                window.location.href = '/';
            }


        } catch (error) {
            const toastData = {
                status: 'warning',
                message: '에러 발생' + error.message
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            window.location.href = '/';
        }
        setShowStatusMenu(false);
    };

    const handleDeleteProject = async () => {
        if (window.confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
            // 삭제 API 호출 로직
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/delete`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: projectId
                    })
                });

                if (response.ok) {
                    addToast('프로젝트가 삭제되었습니다.', 'success');
                    navigate('/');
                }
            } catch (error) {
                addToast('프로젝트 삭제에 실패했습니다.', 'error');
            }
        }
    };

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
                            <button
                                className="project-delete-btn"
                                onClick={handleDeleteProject}
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
                <div className="project-manage-content-area">
                    <div className="project-manage-summary-area">
                        <section className="summary-section">
                            <h3>프로젝트 개요</h3>
                            <p className="summary-text">
                                {projectBasic.summary || '프로젝트 설명이 없습니다.'}
                            </p>
                        </section>

                        <div className="summary-divider" />

                        <section className="summary-section inline">
                            <div>
                                <span className="summary-label">카테고리</span>
                                <span className="summary-value">{projectBasic.pjCategory}</span>
                            </div>

                            <div>
                                <span className="summary-label">상태</span>
                                <span
                                    className="summary-status"
                                    style={{ color: getStatusColor(projectBasic.status) }}
                                >
                                    {getStatusLabel(projectBasic.status)}
                                </span>
                            </div>
                        </section>

                        <div className="summary-divider" />

                        <section className="summary-section">
                            <h3>사용 스킬 / 툴</h3>
                            <div className="skill-inline">
                                {projectBasic.skillStack?.split(',').map((skill, idx) => (
                                    <span key={idx} className="skill-badge">
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* 프로젝트 인원수 컨테이너  */}
                    <div className="project-manage-teamValue-area">
                        <div className="project-manage-teamValue">
                            {projectBasic.teamValue ? "팀 프로젝트" : "개인 프로젝트"}
                        </div>

                        <div className="project-manage-teamName">
                            {projectBasic.teamValue ? projectBasic.teamName : projectBasic.starter}
                        </div>

                        <div>
                            {/* 이제 여기다가 팀원 정보 표시 물론 없으면 없다고 하고 팀원추가 기능 만들거임  */}

                            {/* package com.dypocrypha.entity; 멤버 엔티티는 이럼
                            import jakarta.persistence.*;
                            import lombok.Getter;
                            import lombok.NoArgsConstructor;
                            import lombok.AccessLevel;

                            @Entity
                            @Getter
                            @NoArgsConstructor(access = AccessLevel.PROTECTED)
                            @Table(name = "dy_project_member")
                            public class ProjectMemberEntity {

                                @Id
                                @GeneratedValue(strategy = GenerationType.IDENTITY)
                                @Column(name = "dy_pj_team_member_id")
                                private Long id;

                                //프로젝트 메인 테이블의 아이디
                                @Column(name = "dy_pj_main_id", nullable = false, length = 255)
                                private Long pjMainId;

                                //프로젝트에 참여하는 팀원의 이름
                                @Column(name = "dy_pj_team_member_name", nullable = false, length = 255)
                                private String pjMemberName;

                                //프로젝트의 상태 개인 / 팀 || 개인 이면 L 1명 starter가 프로젝트 관리자로 표시됨 {P 개인, T 팀 프로젝트}
                                @Column(name = "dy_pj_project_status", nullable = false, length = 1)
                                private String pjStatus;

                                //현재 멤버 참여 상태 {H 대기 or 중단, I 참여 중}
                                @Column(name = "dy_pj_team_member_stat", nullable = false, length = 1)
                                private String pjMemberStat;

                                //현재 참여한 멤버의 등급 권한 {L 관리자, M 팀원}
                                @Column(name = "dy_pj_team_member_grade", nullable = false, length = 1)
                                private String pjMemberGrade;

                                private ProjectMemberEntity (Long pjMainId, String pjMemberName, String pjStatus, String pjMemberStat, String pjMemberGrade){
                                    this.pjMainId = pjMainId;
                                    this.pjMemberName = pjMemberName;
                                    this.pjStatus = pjStatus;
                                    this.pjMemberStat = pjMemberStat;
                                    this.pjMemberGrade = pjMemberGrade;
                                }

                                public static ProjectMemberEntity create (Long pjMainId, String pjMemberName, String pjStatus, String pjMemberStat, String pjMemberGrade) {
                                    return new ProjectMemberEntity(pjMainId, pjMemberName, pjStatus, pjMemberStat, pjMemberGrade);
                                }
                            } */}

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
