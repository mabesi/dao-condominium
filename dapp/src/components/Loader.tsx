//import React from 'react';
//import { useEffect, useState } from 'react';
//import { useNavigate } from 'react-router-dom';
//import x from './x';

function Loader() {

    //const navigate = useNavigate();
    //const [message, setMessage] = useState<string>("");
    //const [isLoading, setIsLoading] = useState<boolean>(false);

    //useEffect(() => {
    //
    //},[]);

    return (
        <div className="row ms-3">
            <div className="col-md-6 mb-3">
                <p>
                    <i className="material-icons opacity-10 me-2" >hourglass_empty</i>
                    Loading...
                </p>
            </div>
        </div>
    )
}

export default Loader;