
import styles from '../styles/Home.module.css'

export default function Nav({accountAddress}) { 

    //Conver AccountAddress into a JSON string for some reason 
 
    return (
        <nav className={styles.nav} >
            <ul className = {styles.navUl}>
                <li>Home</li>
                <div className = {styles.navDiv}>{accountAddress}</div >
            </ul>
          

        </nav>
    )



}
