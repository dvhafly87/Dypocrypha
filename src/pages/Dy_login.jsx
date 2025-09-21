import { Link } from 'react-router-dom';

export default function Dy_login() {
    return (
        <>
            <div className="login_container">
                <div className="login_container_wrapper">
                    <span className="login_form">
                        <p className="login_form_header">Login</p>
                        <form>
                            <input type="text" placeholder="ID" /><p />
                            <input type="password" placeholder="Password" /><p />
                            <button type="submit">로그인</button>
                        </form>
                    </span>
                    <span className="account_form">
                        <p className="account_form_header">Account Service</p>
                        <div className="account_form_link">
                            <li>
                                <Link to="/register">회원 가입</Link>
                            </li>
                            <p />
                            <li>
                                <Link to="/id_find">아이디 찾기</Link>
                            </li>
                            <p />
                            <li>
                                <Link to="/pw_reset">비밀번호 재설정</Link>
                            </li>
                        </div>
                    </span>
                </div>
            </div>
        </>
    )
}