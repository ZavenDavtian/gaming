import './header.scss';
import logo from '../../images/logo.png';
import person from '../../images/person-outline.png';
import shopping from '../../images/shopping-cart-outline.png';

const Header = () => {
  return (
    <header className='header'>
        <img src={logo} alt="logo" />
        <div className='menu'>
            <span>Home</span>
            <span>Pricing</span>
            <span>About</span>
            <span>Contact</span>
            <span>Gallrey</span>
        </div>
        <div>
            <img src={person} alt="person" />
            <img src={shopping} alt="shopping" />
        </div>
    </header>
  )

}

export default Header