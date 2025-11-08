import { Link } from 'react-router-dom';
import {useState, useEffect} from 'react';
import '../css/MainHome.css';

import DOAI from '../img/doge.jpeg';
import DoBanner from '../img/banner.jpeg';

export default function MainHome() {
    return (
        <>
            <div className="main-home-container">
                <div className="main-upper-section-wrapper">
                    <div className="personal-project-slider">
                        <h2>프로젝트</h2>
                        <table>
                            <thead>
                            <tr>
                                <th>프로젝트 명</th>
                                <th>프로젝트 기간</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td rowSpan="4" className="project-image-cell">
                                    <img src={DoBanner} alt="프로젝트 배너" className="project-banner-img" />
                                </td>
                                <td className="project-info-cell">
                                <div className="project-info-row">
                                    <span className="project-info-value">2025.00.00 ~ 2025.00.00</span>
                                </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="project-info-cell">
                                <div className="project-info-row">
                                    <span className="project-info-label">프로젝트 규모</span>
                                    <span className="project-info-value">개인 프로젝트</span>
                                </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="project-info-cell">
                                <div className="project-info-row">
                                    <span className="project-info-label">프로젝트 설명</span>
                                    <span className="project-description">어쨋든 블로그 작업 프로젝트</span>
                                </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="project-info-cell">
                                <div className="project-info-row">
                                    <span className="project-info-label">프로젝트 스택</span>
                                    <div className="stack-tags">
                                    <span className="stack-tag">React</span>
                                    <span className="stack-tag">Spring Boot</span>
                                    <span className="stack-tag">Python</span>
                                    <span className="stack-tag">PostgreSQL</span>
                                    </div>
                                </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div> 
                </div>
                <div className="main-middle-section-wrapper">
                    <div className="recently-posted-section">
                        <span className="recently-post-header">
                            <h2>최근 게시글</h2>
                        </span>
                        <hr/>
                        <table>
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>제목</th>
                                    <th>작성자</th>
                                    <th>작성일</th>
                                    <th>조회수</th>
                                </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>1</td>
                                <td>임시 게시글 제목 1</td>
                                <td>작성자1</td>
                                <td>2024-01-01</td>
                                <td>100</td>
                            </tr>
                            <tr>
                                <td>1</td>
                                <td>임시 게시글 제목 1</td>
                                <td>작성자1</td>
                                <td>2024-01-01</td>
                                <td>100</td>
                            </tr>
                            <tr>
                                <td>1</td>
                                <td>임시 게시글 제목 1</td>
                                <td>작성자1</td>
                                <td>2024-01-01</td>
                                <td>100</td>
                            </tr>
                            <tr>
                                <td>1</td>
                                <td>임시 게시글 제목 1</td>
                                <td>작성자1</td>
                                <td>2024-01-01</td>
                                <td>100</td>
                            </tr>
                            <tr>
                                <td>1</td>
                                <td>임시 게시글 제목 1</td>
                                <td>작성자1</td>
                                <td>2024-01-01</td>
                                <td>100</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="youtube-newer-iframe-container">
                        <h2>최근 채널 업로드 영상</h2>
                        <div className="iframe-wrapper">
                            <iframe
                                src={`https://www.youtube.com/embed/o1c_yLFXCig?si=zHe8lVUM95E-pLEH`}
                                frameBorder="0"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
                <div className="main-lower-section-wrapper">
                    <div className="go-ai-chatbotpage-container">
                        <h2>The Chat bot of Dypocrypha</h2>
                        <img src={DOAI} alt="AI 챗봇 이미지"/>
                        <Link to="/dypoai">대화하기</Link>
                    </div>
                    <div className="archive-container">
                        <h2>아카이브</h2>
                        {/* 아직은 내용이 없고 공간만 잡아놓기 용 */}
                    </div>
                </div>
            </div>
        </>
    )
}