import { useState, useEffect} from 'react';
import { useToast } from '../components/ToastContext.jsx';

import '../css/Register.css';
import API from '../config/apiConfig.js';

export default function Register() {
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        memberKey: '',
        email: '',
        emailVerifyCode: '',
        nickname: '',
        password: '',
        passwordConfirm: '',
        birthYear: '',
        birthMonth: '',
        birthDay: ''
    });

    const [verification, setVerification] = useState({
        emailSent: false,
        emailVerified: false,
        nicknameChecked: false,
        isLoading: false,
        isEmailValid: true,
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1939 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    useEffect(() => {
        const fetchMemberInfo = async () => {
            const response = await fetch(`${API.API_BASE_URL}/member/register/genmemberId`,{
                method: 'POST',
            });
            const result = await response.json();
            if(!result.memberkeyid){
                addToast("멤버키 생성 실패", "warning");
            } else{
                setFormData(prev => ({
                    ...prev,
                    memberKey: result.memberkeyid
                }));
            }
        };
        fetchMemberInfo();
      }, []); 

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'email') {
            const trimmedValue = value.trim();
            let isValid = true;
            
            if (!trimmedValue) {
                isValid = false;
            } else {
                const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{3,}$/;
                isValid = emailPattern.test(trimmedValue);
            }
    
            setVerification(prev => ({ ...prev, isEmailValid: isValid }));
        }
    };

    const handleEmailVerification = async (e) => {
        e.preventDefault();

        if (!formData.email) {
            addToast('적합한 형식의 이메일을 입력해주세요','warning');
            setVerification(prev => ({ ...prev, isEmailValid: false }));
            return;
        }

        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{3,}$/;
        const isValid = emailPattern.test(formData.email);
        
        if (!isValid) {
            addToast('적합한 형식의 이메일을 입력해주세요','warning');  
            setVerification(prev => ({ ...prev, isEmailValid: false }));
            return;
        }

        setVerification(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await fetch(`${API.API_BASE_URL}/member/email/verification`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    memberRegisterEmail: formData.email
                })
            });

            if(!response.ok){
                addToast('서버 통신 에러: 500', 'warning');
                setVerification(prev => ({ ...prev, isLoading: false }));
                return;
            }

            const result = await response.json();

            if(result.success){
                setVerification(prev => ({ ...prev, emailSent: true, isLoading: false }));
                addToast("인증코드가 발송되었습니다", 'success');
            } else {
                addToast(result.message + "메일 생성 실패 관리자 문의 요망", "warning");
                setVerification(prev => ({ ...prev, isLoading: false }));
            }
        } catch (error) {
            addToast("NetworkError", "warning");
            setVerification(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleEmailVerifyCheck = async (e) => {
        e.preventDefault();
        const verifycodeRule = /^\d{6}$/;
        
        if (!formData.emailVerifyCode) {
            addToast("인증코드를 입력해주세요", "warning");
            return;
        } else if(!verifycodeRule.test(formData.emailVerifyCode)) {
            addToast("인증코드를 입력해주세요", "warning");
            return;
        } else {
            const response = await fetch(`${API.API_BASE_URL}/member/email/verifycationCheck`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    memberRegisterVerifyCheck: formData.emailVerifyCode,
                    memberRegisterKey: formData.memberKey
                })
            });

            if(!response.ok){
                return;
            }

            const result = await response.json();

            if(result.Verificheck){
                setVerification(prev => ({ ...prev, emailVerified: true }));
                addToast("인증 완료되었습니다", "success");
            } else {
                setVerification(prev => ({ ...prev, emailSent: false }));
                setFormData(prev => ({ ...prev, emailVerifyCode: '' }));
                addToast("인증코드가 일치하지 않습니다.", "warning");
                return;
            }
        }
    };

    const handleNicknameCheck = async (e) => {
        e.preventDefault();
        const nicknameRule = /^[a-zA-Z0-9가-힣]{1,20}$/;

        if(!formData.nickname){
            addToast("닉네임을 입력해주세요", "warning");
            return;
        } else if(!nicknameRule.test(formData.nickname)) {
            addToast("닉네임에 한자&특수문자는 사용 불가능합니다", "warning");
            return;
        } else {
            const response = await fetch(`${API.API_BASE_URL}/member/dupcheck/nickname`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({memberRegisterNickName: formData.nickname})
            });

            if(!response.ok){
                return;
            }

            const result = await response.json();

        }

        if (formData.nickname) {
            setVerification(prev => ({ ...prev, nicknameChecked: true }));
            alert('사용 가능한 닉네임입니다.');
        } else {
            alert('닉네임을 입력해주세요.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!verification.emailVerified) {
            alert('이메일 인증을 완료해주세요.');
            return;
        }
        if (!verification.nicknameChecked) {
            alert('닉네임 중복확인을 해주세요.');
            return;
        }

        if (formData.password !== formData.passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) {
            alert('생년월일을 선택해주세요.');
            return;
        }

        // console.log('회원가입 데이터:', formData);
        // alert('회원가입이 완료되었습니다!');
    };

    return (
        <div className="account-service-main-container">
            <div className="account-wrapper register-wrapper">
                <div className="welcome-section">
                    <div className="welcome-content">
                        <div className="logo-circle">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <h1>회원가입</h1>
                        <p>새로운 계정을 만들어보세요</p>
                        <div className="features">
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>간편한 이메일 인증</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>안전한 계정 관리</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>다양한 서비스 이용</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="register-container">
                        <h2>계정 정보 입력</h2>
                        <div className="register-form">
                            <div className="input-group">
                                <label htmlFor="register-email" style={verification.isEmailValid ?  {} : {color: 'red'}}>
                                    {verification.isEmailValid ? '이메일' : '적합한 형식의 이메일을 입력해주세요'}
                                </label>
                                <div className="input-with-button">
                                    <input 
                                        type="email" 
                                        placeholder='example@email.com'
                                        autoComplete="off" 
                                        name="email"
                                        className={verification.isEmailValid ? '' : 'emailValid'}
                                        id="register-email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={verification.emailSent || verification.isLoading}
                                    />
                                    <button 
                                        type="button" 
                                        className="verify-btn"
                                        onClick={handleEmailVerification}
                                        disabled={verification.emailSent || verification.isLoading}
                                    >
                                        {verification.isLoading ? '처리중...' : verification.emailSent ? '발송완료' : '인증'}
                                    </button>
                                </div>
                            </div>

                            {verification.emailSent && (
                                <div className="input-group">
                                    <label htmlFor="register-email-verify">이메일 인증 코드</label>
                                    <div className="input-with-button">
                                        <input 
                                            type="text" 
                                            placeholder="인증 코드 입력" 
                                            autoComplete="off" 
                                            name="emailVerifyCode"
                                            id="register-email-verify"
                                            value={formData.emailVerifyCode}
                                            onChange={handleInputChange}
                                            disabled={verification.emailVerified}
                                        />
                                        <button 
                                            type="button" 
                                            className="verify-btn"
                                            onClick={handleEmailVerifyCheck}
                                            disabled={verification.emailVerified}
                                        >
                                            {verification.emailVerified ? '인증완료' : '확인'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="input-group">
                                <label htmlFor="register-nickname">닉네임</label>
                                <div className="input-with-button">
                                    <input 
                                        type="text" 
                                        placeholder="닉네임" 
                                        autoComplete="off" 
                                        name="nickname"
                                        id="register-nickname"
                                        value={formData.nickname}
                                        onChange={handleInputChange}
                                        disabled={verification.nicknameChecked}
                                    />
                                    <button 
                                        type="button" 
                                        className="verify-btn"
                                        onClick={handleNicknameCheck}
                                        disabled={verification.nicknameChecked}
                                    >
                                        {verification.nicknameChecked ? '확인완료' : '중복확인'}
                                    </button>
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="register-password">비밀번호</label>
                                <input 
                                    type="password" 
                                    placeholder="비밀번호" 
                                    autoComplete="off" 
                                    name="password"
                                    id="register-password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                                <input 
                                    type="password" 
                                    placeholder="비밀번호 확인" 
                                    autoComplete="off" 
                                    name="passwordConfirm"
                                    id="register-password-confirm"
                                    value={formData.passwordConfirm}
                                    onChange={handleInputChange}
                                    style={{ marginTop: '0.5rem' }}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="register-birth-year">생년월일</label>
                                <div className="birthdate-wrapper">
                                    <select 
                                        name="birthYear" 
                                        id="register-birth-year"
                                        value={formData.birthYear}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">년</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                    <select 
                                        name="birthMonth" 
                                        id="register-birth-month"
                                        value={formData.birthMonth}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">월</option>
                                        {months.map(month => (
                                            <option key={month} value={month}>{month}</option>
                                        ))}
                                    </select>
                                    <select 
                                        name="birthDay" 
                                        id="register-birth-day"
                                        value={formData.birthDay}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">일</option>
                                        {days.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button type="button" className="register-btn" onClick={handleSubmit}>
                                회원가입
                            </button>
                        </div>

                        <div className="divider">
                            <span>이미 계정이 있으신가요?</span>
                        </div>

                        <div className="account-services">
                            <a href="/login" className="service-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                    <polyline points="10 17 15 12 10 7"/>
                                    <line x1="15" y1="12" x2="3" y2="12"/>
                                </svg>
                                로그인하기
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}