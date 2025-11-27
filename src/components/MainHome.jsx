import { Link } from 'react-router-dom';
import {useState, useEffect} from 'react';
import {useToast} from '../components/ToastContext.jsx';

import '../css/MainHome.css';

import ProjectSlider from '../components/ProjectSlider.jsx'
import DOAI from '../img/doge.jpeg';
import DoBanner from '../img/dogae.jpeg';

export default function MainHome() {
    const { addToast } = useToast();

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

    return (
        <>
            <div className="main-home-container">
                <div className="main-upper-section-wrapper">
                    <ProjectSlider />
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