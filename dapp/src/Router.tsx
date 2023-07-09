import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Topics from './pages/Topics';
import Transfer from './pages/Transfer';
import Settings from './pages/Settings';
import { Profile, doLogout } from './services/Web3Service';

function Router() {

    type Props = {
        children: JSX.Element
    }

    function PrivateRoute({ children } : Props) {
        const isAuth = localStorage.getItem("account") !== null;
        return isAuth ? children : <Navigate to="/" />;
    }

    function ManagerRoute({ children } : Props) {
        
        const isAuth = localStorage.getItem("account") !== null;
        const isManager = parseInt(localStorage.getItem("profile") || "0") === Profile.MANAGER;
        
        if (isAuth && isManager)
            return children;
        else {
            doLogout();
            return <Navigate to="/" />;
        }
    }

    function CouncilRoute({ children } : Props) {
        
        const isAuth = localStorage.getItem("account") !== null;
        const isResident = parseInt(localStorage.getItem("profile") || "0") === Profile.RESIDENT;
        
        if (isAuth && !isResident)
            return children;
        else {
            doLogout();
            return <Navigate to="/" />;
        }
    }

    function ResidentRoute({ children } : Props) {
        
        const isAuth = localStorage.getItem("account") !== null;
        const isResident = parseInt(localStorage.getItem("profile") || "0") === Profile.RESIDENT;
        
        if (isAuth && isResident)
            return children;
        else {
            doLogout();
            return <Navigate to="/" />;
        }
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login />} />
                <Route path='/topics' element={
                    <PrivateRoute>
                        <Topics />
                    </PrivateRoute>
                } />
                <Route path='/transfer' element={
                    <ManagerRoute>
                        <Transfer />
                    </ManagerRoute>
                } />
                <Route path='/settings' element={
                    <ManagerRoute>
                        <Settings />
                    </ManagerRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}

export default Router;