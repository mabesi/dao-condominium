//import React from 'react';
import { useEffect, useState } from 'react';
//import { useLocation, useNavigate } from 'react-router-dom';
//import x from './x';

import { Status } from "../../services/Web3Service";
import Loader from "../../components/Loader";
import TopicFileRow from './TopicFileRow';

type Props = {
    title: string;
    status?: Status;
}

function TopicFiles(props: Props) {

    //const navigate = useNavigate();
    //const [message, setMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [files, setFiles] = useState<string[]>(["image01.jpg","document.pdf"]);

    //function useQuery() {
    //    return new URLSearchParams(useLocation().search);
    //}
    //const query = useQuery();

    //useEffect(() => {
    //
    //},[]);

    function onDeleteTopicFile(filename: string) {
        alert(filename);
    }

    return (
        <div className="row">
            <div className="col-12">
            <div className="card my-4">
                <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
                <div className="bg-gradient-primary shadow-primary border-radius-lg pt-4 pb-3">
                    <h6 className="text-white text-capitalize ps-3">
                        <i className="material-icons opacity-10 me-2" >cloud_upload</i>
                        Files
                    </h6>
                </div>
                </div>

                <div className="card-body px-0 pb-2">
                    {
                        isLoading ? <Loader />: <></>
                    }
                    <div className="table-responsive p-0">
                        <table className="table align-items-center mb-0">
                        <thead>
                            <tr>
                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">File Name</th>
                            <th className="text-secondary opacity-7"></th>
                            </tr>
                        </thead>
                        <tbody>

                            {
                                files && files.length
                                ? files.map(file => <TopicFileRow key={file} filename={file} topicTitle={props.title} status={props.status} onDelete={() => onDeleteTopicFile(file)} />)
                                : <></>
                            }
                            
                        </tbody>
                        </table>
                    </div>
                    <div className="row ms-2">
                        <div className="col-md-12 mb-3">
                            <a className="btn bg-gradient-dark me-2"  href="/topics/new" >
                                <i className="material-icons opacity-10 me-2" >add</i>
                                Upload File
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}

export default TopicFiles;