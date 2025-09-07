
export default function Dy_login() {
    return (
        <>
            <div className="Dy_login_container">
                <div className="Dy_RyLoWrapper">
                    <div className="do_login_container">
                        <form>
                            <p>
                                you already have an account?
                                login here
                            </p>
                            <div className="Dy_login_id_container">
                                <label for="id_input">ID</label>
                                <input className="id_input" type="text" placeholder="ID" />
                            </div>
                            <div className="Dy_login_pw_container">
                                <label for="pw_input">Password</label>
                                <input className="pw_input" type="password" placeholder="Password" />
                            </div>
                            <div className="Dy_login_button_container">
                                <button className="login_button" type="submit">Login</button>
                            </div>
                        </form>
                    </div>
                    <div className="go_register_container">
                        <p>Don't have an account?</p>
                        <a href="/register">Register</a>
                        <div className="account_help_buttons">
                            <a href="/find-id" className="find_id_button">Find ID</a>
                            <a href="/reset-password" className="reset_password_button">Reset Password</a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}