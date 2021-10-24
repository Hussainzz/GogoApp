import React from 'react'
import { useSelector} from 'react-redux'
import CenteredLoader from './common/CenteredLoader';
import GoGoAppsList from './common/GoGoAppsList';
import NavBarComponent from './common/NavBarComponent';

const Dashboard = () => {
    const {name} = useSelector(state => state.currentUser);

  
    return (
        <div>
            {name ?
            <>
                <NavBarComponent name={name.split(' ')[0]}/>
                <GoGoAppsList/>
               
            
            </>
            :<CenteredLoader/>}
       
        </div>
    )
}

export default Dashboard
