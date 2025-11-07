import { Link } from 'react-router-dom';
import '../css/MainHome.css';

export default function MainHome() {

    return (
        <>
            <div className="main-home-container">
                <div className="main-upper-section-wrapper">
                    <div className="recently-posted-section">
                        {/* 추후 여긴 모든 게시판 통합 최신 글 표시 */}
                        <span className="recently-post-header">
                            <h2>최근 게시글</h2>
                        </span>
                        <hr/>
                        <table>
                            <tr>
                                <th>No.</th>
                                <th>제목</th>
                                <th>작성자</th>
                                <th>작성일</th>
                                <th>조회수</th>
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
                            <tr>
                                <td>1</td>
                                <td>임시 게시글 제목 1</td>
                                <td>작성자1</td>
                                <td>2024-01-01</td>
                                <td>100</td>
                            </tr>
                        </table>
                    </div>
                    <div className="youtube-newer-iframe-container">

                    </div>
                </div>
            </div>
        </>
    )
}