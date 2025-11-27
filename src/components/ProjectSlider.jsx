import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProjectSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);

    // 프로젝트 데이터 배열
    const projects = [
        {
            id: 1,
            title: "블로그 플랫폼 프로젝트",
            period: "2025.01.01 ~ 2025.03.31",
            scale: "개인 프로젝트",
            description: "React와 Spring Boot를 활용한 풀스택 블로그 플랫폼 개발",
            stacks: ["React", "Spring Boot", "Python", "PostgreSQL"],
            banner: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop"
        },
        {
            id: 2,
            title: "AI 챗봇 서비스",
            period: "2024.10.01 ~ 2024.12.31",
            scale: "팀 프로젝트 (3인)",
            description: "OpenAI API를 활용한 인터랙티브 AI 챗봇 개발",
            stacks: ["React", "Node.js", "OpenAI API", "MongoDB"],
            banner: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&h=400&fit=crop"
        },
        {
            id: 3,
            title: "포트폴리오 웹사이트",
            period: "2024.06.01 ~ 2024.08.31",
            scale: "개인 프로젝트",
            description: "모던한 디자인과 인터랙션을 갖춘 개인 포트폴리오 사이트",
            stacks: ["React", "Tailwind CSS", "Framer Motion"],
            banner: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop"
        }
    ];

    const currentProject = projects[currentIndex];

    const goToPrevious = () => {
        setCurrentIndex((prev) => 
            prev === 0 ? projects.length - 1 : prev - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prev) => 
            prev === projects.length - 1 ? 0 : prev + 1
        );
    };

    return (
        <div className="slider-container">
            <style>{`
                .slider-container {
                    width: 100%;
                    max-width: 100%;
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(34, 139, 87, 0.15);
                    transition: all 0.3s ease;
                }

                .slider-container:hover {
                    box-shadow: 0 12px 48px rgba(34, 139, 87, 0.2);
                }

                .slider-header {
                    background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
                    padding: 1.5rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .slider-header h2 {
                    color: white;
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                }

                .slider-controls {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .slider-indicator {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 0.9rem;
                    margin: 0 1rem;
                    font-weight: 500;
                }

                .slider-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                }

                .slider-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }

                .slider-btn:active {
                    transform: scale(0.95);
                }

                .slider-content {
                    display: flex;
                    min-height: 400px;
                }

                .project-image {
                    flex: 1;
                    background-size: cover;
                    background-position: center;
                    position: relative;
                    overflow: hidden;
                    min-height: 400px;
                }

                .project-image::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        to right, 
                        rgba(0,0,0,0) 0%, 
                        rgba(255,255,255,0.05) 100%
                    );
                }

                .project-info {
                    flex: 1;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.2rem;
                    background: #fafafa;
                    overflow-y: auto;
                    max-height: 500px;
                }

                .info-row {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                    padding-bottom: 0.8rem;
                    border-bottom: 1px solid #e0e0e0;
                }

                .info-row:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                    margin-bottom: 0.5rem;
                }

                .info-label {
                    font-size: 0.75rem;
                    color: #757575;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .info-value {
                    font-size: 1rem;
                    color: #1b5e20;
                    font-weight: 600;
                }

                .project-description {
                    font-size: 0.95rem;
                    color: #424242;
                    line-height: 1.6;
                }

                .stack-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 0.3rem;
                }

                .stack-tag {
                    padding: 0.5rem 1rem;
                    background: white;
                    color: #2e7d32;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    border: 1.5px solid #4caf50;
                    transition: all 0.2s ease;
                }

                .stack-tag:hover {
                    background: #e8f5e9;
                    transform: translateY(-2px);
                }

                .dots-container {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 1.2rem;
                    background: #fafafa;
                    border-top: 1px solid #e0e0e0;
                }

                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #c8e6c9;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .dot.active {
                    background: #2e7d32;
                    width: 32px;
                    border-radius: 5px;
                }

                .dot:hover {
                    background: #4caf50;
                }

                /* 반응형 */
                @media (max-width: 900px) {
                    .slider-content {
                        flex-direction: column;
                        min-height: auto;
                    }

                    .project-image {
                        height: 250px;
                        min-height: 250px;
                    }

                    .project-info {
                        padding: 1.5rem;
                        max-height: none;
                        overflow-y: visible;
                    }

                    .slider-indicator {
                        display: none;
                    }
                }

                @media (max-width: 600px) {
                    .slider-header {
                        padding: 1rem 1.5rem;
                    }

                    .slider-header h2 {
                        font-size: 1.25rem;
                    }

                    .project-info {
                        gap: 1rem;
                        padding: 1.2rem;
                    }

                    .info-value {
                        font-size: 0.9rem;
                    }

                    .stack-tag {
                        font-size: 0.8rem;
                        padding: 0.4rem 0.8rem;
                    }

                    .dots-container {
                        padding: 1rem;
                    }
                }
            `}</style>

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

            <div className="slider-content">
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
                    
                    <div className="info-row">
                        <span className="info-label">프로젝트 스택</span>
                        <div className="stack-tags">
                            {currentProject.stacks.map((stack, idx) => (
                                <span key={idx} className="stack-tag">{stack}</span>
                            ))}
                        </div>
                    </div>
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