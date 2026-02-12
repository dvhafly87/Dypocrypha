import React, { useEffect, useState } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../config/apiConfig.js';
import '../css/ProjectSlider.css';

export default function ProjectSlider() {
    const { addToast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [projects, setProjects] = useState([]);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const getProjectInformation = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/list/mainhome`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    addToast('프로젝트 정보를 불러오는데 실패했습니다', 'error');
                    return;
                }

                const result = await response.json();

                if (result.getMainHomeProjectListStatus && result.getMainHomeProjectListData) {
                    const formattedProjects = result.getMainHomeProjectListData.map(project => ({
                        id: project.id,
                        title: project.title,
                        period: formatPeriod(project.created, project.endDay),
                        scale: project.teamValue
                            ? `팀 프로젝트${project.teamName ? ` (${project.teamName})` : ''}`
                            : '개인 프로젝트',
                        description: project.summary || '프로젝트 설명이 없습니다.',
                        stacks: project.skillStack
                            ? project.skillStack.split(',').map(s => s.trim()).filter(Boolean)
                            : [],
                        banner: project.projectThumb
                            ? `${API.API_BASE_URL}/projectThumb/${project.projectThumb}`
                            : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop',
                        starter: project.starter,
                        category: project.pjCategory,
                        status: project.status
                    }));

                    setProjects(formattedProjects);
                } else {
                    setProjects([]);
                }

            } catch (error) {
                console.error('프로젝트 정보를 불러오는 중 오류 발생:', error);
                addToast('프로젝트 정보를 불러오는 중 오류가 발생했습니다', 'error');
            }
        };

        getProjectInformation();
    }, []);

    const formatPeriod = (created, endDay) => {
        if (!created || !endDay) return '기간 정보 없음';

        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}.${month}.${day}`;
        };

        return `${formatDate(created)} ~ ${formatDate(endDay)}`;
    };

    const currentProject = projects[currentIndex];

    const goToPrevious = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => prev === 0 ? projects.length - 1 : prev - 1);
            setIsTransitioning(false);
        }, 300);
    };

    const goToNext = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => prev === projects.length - 1 ? 0 : prev + 1);
            setIsTransitioning(false);
        }, 300);
    };

    // 30초마다 자동 슬라이드
    useEffect(() => {
        if (projects.length <= 1) return; // 프로젝트가 1개 이하면 자동 슬라이드 불필요

        const autoSlideInterval = setInterval(() => {
            goToNext();
        }, 15000);

        return () => clearInterval(autoSlideInterval); // 클린업
    }, [projects.length]); // projects.length가 변경될 때만 재설정

    // 프로젝트 없음
    if (projects.length === 0) {
        return (
            <div className="slider-container no-projects">
                <div className="slider-header">
                    <h2>프로젝트</h2>
                </div>
                <p className="no-projects-message">완료된 프로젝트가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="slider-container">
            <div className="slider-header">
                <h2>프로젝트</h2>
                <div className="slider-controls">
                    <button
                        className="slider-btn"
                        onClick={goToPrevious}
                        aria-label="이전 프로젝트"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="slider-indicator">
                        {currentIndex + 1} / {projects.length}
                    </span>
                    <button
                        className="slider-btn"
                        onClick={goToNext}
                        aria-label="다음 프로젝트"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className={`slider-content ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
                <div
                    className="project-image"
                    style={{ backgroundImage: `url(${currentProject.banner})` }}
                />
                <div className="project-info">
                    <div className="info-row">
                        <span className="info-label">프로젝트명</span>
                        <span className="info-value">{currentProject.title}</span>
                    </div>

                    <div className="info-row">
                        <span className="info-label">프로젝트 기간</span>
                        <span className="info-value">{currentProject.period}</span>
                    </div>

                    <div className="info-row">
                        <span className="info-label">프로젝트 규모</span>
                        <span className="info-value">{currentProject.scale}</span>
                    </div>

                    <div className="info-row">
                        <span className="info-label">프로젝트 설명</span>
                        <span className="project-description">
                            {currentProject.description}
                        </span>
                    </div>

                    {currentProject.stacks && currentProject.stacks.length > 0 && (
                        <div className="info-row">
                            <span className="info-label">프로젝트 스택</span>
                            <div className="stack-tags">
                                {currentProject.stacks.map((stack, idx) => (
                                    <span key={idx} className="stack-tag">{stack}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="dots-container">
                {projects.map((_, idx) => (
                    <div
                        key={idx}
                        className={`dot ${idx === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(idx)}
                    />
                ))}
            </div>
        </div>
    );
}