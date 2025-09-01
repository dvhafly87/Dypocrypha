import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dy_logo from '../_img/Only_logo_rmbg.png';
export default function Dy_sidebar() {

    const [isSelected, setIsSelected] = useState();
    useEffect(() => {
        const savedState = localStorage.getItem('isSelected');
        if (savedState) {
            setIsSelected(JSON.parse(savedState));
        }
    }, []);

    const handleSelected = (item) => {
        console.log(item);
        setIsSelected(item);
        localStorage.setItem('isSelected', JSON.stringify(item));
    }

    const clickToNavigate = () => {
        navigate(localStorage.getItem('isSelected')
    }

    return (
        <>
            <header className="Dy_Header">
                <div className="header-left">
                    <span className="logo-container">
                        <img className="Dy_logo" src={Dy_logo} alt="Dypocrypha_logo" />
                        <p className="Dy_logo_text">Dypocrypha</p>
                    </span>
                    <span className="Dy_guidebar_link_container">
                        {/* <Link to="/" onClick={() => handleSelected('Home')}>Home</Link>
                        <Link to="/test2" onClick={() => handleSelected('Test2')}>Test Function2</Link>
                        <Link to="/funiture1" onClick={() => handleSelected("Funiture1")}>Test Function3</Link>
                        <Link to="/funiture1" onClick={() => handleSelected("Funiture2")}>Test Function4</Link> */}
                        <Link onClick={() => clickToNavigate('Home')}>Home</Link>
                        <Link onClick={() => handleSelected('Test2')}>Test Function2</Link>
                        <Link onClick={() => handleSelected("Funiture1")}>Test Function3</Link>
                        <Link onClick={() => handleSelected("Funiture2")}>Test Function4</Link>
                    </span>
                </div>
                <span className="Dy_login_button">
                    <Link type="button" to="/test2" onClick={() => handleSelected('Login')}>Login</Link>
                </span>
            </header >
        </>
    )
}