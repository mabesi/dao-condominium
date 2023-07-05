import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Topics from './pages/Topics';

function Router() {

    type Props = {
        children: JSX.Element
    }

    function PrivateRoute({ children } : Props) {
        const isAuth = localStorage.getItem("account") !== null;
        return isAuth ? children : <Navigate to="/" />;
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
            </Routes>
        </BrowserRouter>
    )
}

export default Router;