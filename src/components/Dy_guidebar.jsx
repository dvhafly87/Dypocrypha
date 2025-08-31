import { Link } from 'react-router-dom';
import Dy_logo from '../_img/Only_logo_rmbg.png';
export default function Dy_sidebar() {
    return (
        <>
            <header className="Dy_Header">
                <div className="header-left">
                    <span className="logo-container">
                        <img className="Dy_logo" src={Dy_logo} alt="Dypocrypha_logo" />
                        <p className="Dy_logo_text">Dypocrypha</p>
                    </span>
                    <span className="Dy_guidebar_link_container">
                        <Link to="/">Home</Link>
                        <Link to="/test2">Test2</Link>
                    </span>
                </div>
                <span className="Dy_login_button">
                    <Link type="button" to="/test2">Login</Link>
                </span>
            </header >
        </>
    )
}