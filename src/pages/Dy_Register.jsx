import { Link } from 'react-router-dom';

export default function Dy_Register() {
    return (
        <>
            <div className="Dy_Register_container">
                <div className="register_wrapper">
                    <div className="register_header">
                        <div className="register_header_top">
                            <Link to="/login" className="back_to_login">
                                ← 로그인으로 돌아가기
                            </Link>
                            <h2>회원가입</h2>
                        </div>
                        <p>Dypocrypha에 오신 것을 환영합니다</p>
                    </div>

                    <form className="Dy_Register_form" method="post">
                        {/* 기본 정보 섹션 */}
                        <div className="form_section">
                            <h3>기본 정보</h3>
                            <div className="Register_id_input">
                                <label htmlFor="user_id">아이디</label>
                                <input type="text" id="user_id" placeholder="아이디를 입력하세요" />
                            </div>
                            <div className="Register_pw_input">
                                <label htmlFor="user_pw">비밀번호</label>
                                <input type="password" id="user_pw" placeholder="비밀번호를 입력하세요" />
                            </div>
                            <div className="Register_nickname_input">
                                <label htmlFor="user_nickname">닉네임</label>
                                <input type="text" id="user_nickname" placeholder="닉네임을 입력하세요" />
                            </div>
                        </div>

                        {/* 개인 정보 섹션 */}
                        <div className="form_section">
                            <h3>개인 정보</h3>
                            <div className="Register_gender_input">
                                <label>성별</label>
                                <div className="gender_options">
                                    <label>
                                        <input type="radio" name="gender" value="male" />
                                        <span>남성</span>
                                    </label>
                                    <label>
                                        <input type="radio" name="gender" value="female" />
                                        <span>여성</span>
                                    </label>
                                    <label>
                                        <input type="radio" name="gender" value="other" />
                                        <span>기타</span>
                                    </label>
                                </div>
                            </div>
                            <div className="Register_birth_input">
                                <label htmlFor="user_birth">생년월일</label>
                                <input type="date" id="user_birth" />
                            </div>
                        </div>

                        {/* 연락처 정보 섹션 */}
                        <div className="form_section">
                            <h3>연락처 정보</h3>
                            <div className="Register_email_input">
                                <label htmlFor="user_email">이메일</label>
                                <div className="input_with_button">
                                    <input type="email" id="user_email" placeholder="이메일 주소를 입력하세요" />
                                    <button type="button" className="verify_btn">인증코드 발송</button>
                                </div>
                            </div>

                            <div className="Register_email_verify_input">
                                <label htmlFor="email_verify">이메일 인증</label>
                                <div className="input_with_button">
                                    <input type="text" id="email_verify" placeholder="인증코드를 입력하세요" />
                                    <button type="button" className="verify_btn">인증하기</button>
                                </div>
                            </div>

                            <div className="Register_TelNo_input">
                                <label htmlFor="user_phone">전화번호</label>
                                <div className="input_with_button">
                                    <input type="tel" id="user_phone" placeholder="전화번호를 입력하세요" />
                                </div>
                            </div>
                        </div>

                        {/* 약관 동의 섹션 */}
                        <div className="form_section">
                            <h3>약관 동의</h3>
                            <div className="Register_email_consent">
                                <label className="consent_label">
                                    <input type="checkbox" name="email_consent" />
                                    <span>이메일 수신 동의 (선택사항)</span>
                                </label>
                                <p className="consent_description">마케팅 정보 및 이벤트 소식을 이메일로 받아보시겠습니까?</p>
                            </div>
                        </div>

                        <div className="Register_submit_button">
                            <button type="submit">회원가입</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}