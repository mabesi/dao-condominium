//import React from 'react';
//import { useEffect, useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Category, Status, Topic, isManager } from '../../services/Web3Service';

type Props = {
    data: Topic;
    onDelete: Function;
}

function TopicRow(props: Props) {

    //const navigate = useNavigate();
    //const [message, setMessage] = useState<string>("");
    //const [isLoading, setIsLoading] = useState<boolean>(false);

    //useEffect(() => {
    //
    //},[]);

    /**
     * props:
     * - data
     * - onDelete
     */
    function getDate() {
        if (!props.data.createdDate) return "";
        const dateMs = props.data.createdDate * 1000;
        return (
            <p className={"text-xs mb-0 ms-3 "} >
                {new Date(dateMs).toDateString()}
            </p>
        )
    }

    function btnDeleteClick() {
        if (window.confirm("Are you sure to delete this topic?"))
            props.onDelete(props.data.title);
    }

    function getCategory() {
        let text = "";
        switch (props.data.category) {
            case Category.DECISION: text = "Decision"; break;
            case Category.SPENT: text = "Spent"; break;
            case Category.CHANGE_QUOTA: text = "Change Quota"; break;
            case Category.CHANGE_MANAGER: text = "Change Manager"; break;
        }        
        return <p className='text-xs mb-0 ms-3'>{text}</p>;
    }

    function getStatus() {
        let text = "", className = "";
        switch (props.data.status) {
            case Status.APPROVED: {
                text = "Approved";
                className = "badge bg-success py-1 ms-3";
                break;
            }
            case Status.DENIED: {
                text = "Denied";
                className = "badge bg-danger py-1 ms-3";
                break;
            }
            case Status.DELETED: {
                text = "Deleted";
                className = "badge bg-danger py-1 ms-3";
                break;
            }
            case Status.SPENT: {
                text = "Spent";
                className = "badge bg-success py-1 ms-3";
                break;
            }
            case Status.VOTING: {
                text = "Voting";
                className = "badge bg-warning py-1 ms-3";
                break;
            }
            default: {
                text = "Idle";
                className = "badge bg-secondary py-1 ms-3";
                break;
            }
        }
        return <span className={className}>{text}</span>;
    }

    return (
        <tr>
            <td>
                <div className="d-flex px-3 py-1">
                    <div className="d-flex flex-column justify-content-center">
                        <h6 className="mb-0 text-sm">{props.data.title}</h6>
                    </div>
                </div>
            </td>
            <td>
               {getCategory()}
            </td>
            <td>
               {getStatus()}
            </td>
            <td>
               {getDate()}
            </td>
            <td>
                <a href={"/topics/edit/" + props.data.title} className="btn btn-info btn-sm me-1" >
                    <i className='material-icons text-sm' >visibility</i>
                </a>
                {
                    isManager() && props.data.status === Status.IDLE
                    ? (
                        <>
                            <a href="#" className="btn btn-danger btn-sm me-1" onClick={btnDeleteClick} >
                                <i className='material-icons text-sm' >delete</i>
                            </a>
                        </>
                    )
                    : <></>
                }
            </td>
        </tr>
    )
}

export default TopicRow;