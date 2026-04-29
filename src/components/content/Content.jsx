import './content.scss';
import game1 from '../../images/game1.png';

const Content = () => {
    return (
        <div className='content'>
            <div className='content-left'>
                <h1>Unlock Your Potential, Techniques for
                    Improving Your Gaming Performance</h1>
                <p>From mastering advanced gameplay mechanics to sharpening reflexes and
                    decision-making abilities, this book offers invaluable insights and
                    strategies for gamers of all levels.</p>
                <div className='content-buttons'>
                    <button>Shop Now</button>
                    <button>Discover</button>
                </div>
            </div>
            <div className='countent-right'>
                <img src={game1} alt="game1" />
            </div>
        </div>
    )
}

export default Content