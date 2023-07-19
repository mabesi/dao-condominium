import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { Topic, addTopic, editTopic, getTopic, Profile, Status, Category, hasManagerPermissions, openVoting, closeVoting, vote, Vote, getVotes, Options, transfer } from '../../services/Web3Service';
import Loader from '../../components/Loader';
import TopicCategory from '../../components/TopicCategory';
import TopicFiles from './TopicFiles';
import { ethers } from 'ethers';

function TopicPage() {

    const navigate = useNavigate();
    let { title } = useParams();
    const [message, setMessage] = useState<String>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [topic, setTopic] = useState<Topic>({} as Topic);
    const [votes, setVotes] = useState<Vote[]>([]);

    useEffect(() => {

        if (title) {
            
            setIsLoading(true);

            getTopic(title)
                .then(topic => {

                    // Trecho usado para simular toópico aprovado
                    // const newT = {...topic};
                    // newT.status = Status.APPROVED;
                    // newT.endDate = Date.now();
                    // setTopic(newT);

                    setTopic(topic);
                    if (topic.status === Status.VOTING)
                        return getVotes(topic.title);
                    else
                        setIsLoading(false);
                })
                .then(votes => {
                    setVotes(votes || []);
                    setIsLoading(false);
                })
                .catch(err => {
                    setMessage(err.message);
                    setIsLoading(false);
                });            
        } else {
            topic.responsible = localStorage.getItem("account") || "";
        }

    }, [title]);

    function onTopicChange(evt: React.ChangeEvent<HTMLInputElement>) {
        setTopic(prevState => ({...prevState, [evt.target.id]: evt.target.value}));
    }

    function btnSaveClick() {
        
        if (topic) {
            
            setMessage("Saving the topic informations. Wait...");

            if (!title){

                addTopic(topic)
                    .then(tx => navigate("/topics?tx=" + tx.hash))
                    .catch(err => setMessage(err.message));

            } else {

                editTopic(title, topic.description, topic.amount, topic.responsible)
                    .then(tx => navigate("/topics?tx=" + tx.hash))
                    .catch(err => setMessage(err.message));
            }
        }
    }

    function getDate(timestamp: number) {
        const dateMs = timestamp * 1000;
        if (!dateMs) return "";
        return new Date(dateMs).toDateString();
    }

    // function getNextPaymentClass() {
    //     let className = "input-group input-group-outline ";
    //     const dateMs = Topic.nextPayment * 1000;
    //     if (!dateMs || dateMs < Date.now())
    //         return className + "is-invalid";
    //     else
    //         return className + "is-valid";
    // }

    function getStatus() : string {
        switch (topic.status) {
            case Status.APPROVED: return "Approved";
            case Status.DENIED: return "Denied";
            case Status.DELETED: return "Deleted";
            case Status.SPENT: return "Spent";
            case Status.VOTING: return "Voting";
            default: return "Idle";

        }
    }

    function showResponsible() : boolean {
        const category = parseInt(`${topic.category}`);
        return [Category.SPENT, Category.CHANGE_MANAGER].includes(category);
    }

    function showAmount() : boolean {
        const category = parseInt(`${topic.category}`);
        return [Category.SPENT, Category.CHANGE_QUOTA].includes(category);
    }

    function isClosed() : boolean {
        const status = parseInt(`${topic.status || 0}`);
        return [Status.APPROVED, Status.DENIED, Status.DELETED, Status.SPENT].includes(status);
    }

    function getAmount() {
        return topic.amount ? topic.amount.toString() : "0";
    }

    function descriptionIsDisabled() {
        return !!title && (topic.status !== Status.IDLE || !hasManagerPermissions());
    }

    function isDisabled() {
        return !!title && (topic.status !== Status.IDLE || !hasManagerPermissions());
    }

    function btnOpenVoteClick() {
        if (topic && title) {
            setMessage("Connecting to MetaMask. Wait...");
            openVoting(title)
                .then(tx => navigate("/topics?tx=" + tx.hash))
                .catch(err => setMessage(err.message));  
        }
    }

    function btnCloseVoteClick() {
        if (topic && title) {
            setMessage("Connecting to MetaMask. Wait...");
            closeVoting(title)
                .then(tx => navigate("/topics?tx=" + tx.hash))
                .catch(err => setMessage(err.message));
        }
    }

    function showVoting() {
        return ![Status.DELETED, Status.IDLE].includes(topic.status || Status.DELETED) && votes && votes.length;
    }

    function alreadyVoted() {
        return votes && votes.length && votes.find(v => v.resident.toUpperCase() === (localStorage.getItem("account") || "").toUpperCase());
    }

    function btnVoteClick(option: Options) {

        if (title && topic && topic.status === Status.VOTING) {

            setMessage("Connecting to MetaMask. Wait...");

            let text = "";

            switch(option) {
                case Options.YES: text = "YES"; break;
                case Options.NO: text = "NO"; break;
                default: text = "ABSTENTION";
            }
            
            if (window.confirm(`Are you sure to vote as ${text}?`)) {
                vote(title, option)
                .then(tx => navigate("/topics?tx=" + tx.hash))
                .catch(err => setMessage(err.message));  
            } else {
                setMessage("");
            }

        }        
    }

    function btnTransferClick() {

        if (title && topic && topic.status === Status.APPROVED ) {
            setMessage("Connecting to MetaMask. Wait...");
            if (window.confirm(`Are you sure to transfer ${ethers.utils.formatEther(topic.amount)} ETH for ${topic.responsible}?`)) {
                transfer(title, topic.amount)
                    .then(tx => navigate("/topics?tx=" + tx.hash))
                    .catch(err => setMessage(err.message));
            } else {
                setMessage("");
            }
        }
    }

    return (
        <>
            <Sidebar />
            <main className="main-content position-relative max-height-vh-100 h-100 border-radius-lg ">
                <div className="container-fluid py-4">
                <div className="row">
                    <div className="col-12">
                    <div className="card my-4">
                        <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
                        <div className="bg-gradient-primary shadow-primary border-radius-lg pt-4 pb-3">
                            <h6 className="text-white text-capitalize ps-3">
                                <i className="material-icons opacity-10 me-2" >interests</i>
                                {title ? "Edit " : "New "}Topic
                            </h6>
                        </div>
                        </div>
                        <div className="card-body px-0 pb-2">
                            {
                                isLoading ? <Loader /> : <></>
                            }
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="title">Title:</label>
                                        <div className="input-group input-group-outline">
                                            <input type="text" className="form-control" id="title" value={topic.title || ""} onChange={onTopicChange} disabled={!!title} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="description">Description:</label>
                                        <div className="input-group input-group-outline">
                                            <input type="text" className="form-control" id="description" value={topic.description || ""} onChange={onTopicChange}  disabled={isDisabled()} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {
                                title
                                ? (
                                    <div className="row ms-3">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label htmlFor="status">Status:</label>
                                                <div className="input-group input-group-outline">
                                                    <input type="text" className="form-control" id="status" value={getStatus()} disabled={true}  />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                                : <></>
                            }
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="category">Category:</label>
                                        <div className="input-group input-group-outline">
                                            <TopicCategory value={topic.category} onChange={onTopicChange} disabled={!!title} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {
                                showResponsible()
                                ? (
                                    <div className="row ms-3">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label htmlFor="responsible">Responsible:</label>
                                                <div className="input-group input-group-outline">
                                                    <input type="text" className="form-control" id="responsible" value={topic.responsible || ""} placeholder="0x00..." onChange={onTopicChange} disabled={isDisabled()} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                                : <></>
                            }
                            {
                                showAmount()
                                ? (
                                    <div className="row ms-3">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label htmlFor="amount">Amount (wei):</label>
                                                <div className="input-group input-group-outline">
                                                    <input type="number" className="form-control" id="amount" value={getAmount()} onChange={onTopicChange} disabled={isDisabled()} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                                : <></>
                            }
                            {
                                title
                                ? (
                                    <div className="row ms-3">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label htmlFor="createdDate">Created Date:</label>
                                                <div className="input-group input-group-outline">
                                                    <input type="text" className="form-control" id="createdDate" value={getDate(topic.createdDate || 0)} disabled={true} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                                : <></>
                            }
                            {
                                isClosed() || topic.status === Status.VOTING
                                ? (
                                    <div className="row ms-3">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label htmlFor="startDate">Start Date:</label>
                                                <div className="input-group input-group-outline">
                                                    <input type="text" className="form-control" id="startDate" value={getDate(topic.startDate || 0)} disabled={true} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                                : <></>
                            }
                            {
                                isClosed()
                                ? (
                                    <div className="row ms-3">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label htmlFor="endDate">End Date:</label>
                                                <div className="input-group input-group-outline">
                                                    <input type="text" className="form-control" id="endDate" value={getDate(topic.endDate || 0)} disabled={true} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                                : <></>
                            }
                            {
                                showVoting()
                                ? (
                                    <div className="row ms-3">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label htmlFor="voting">Voting:</label>
                                                <div className="input-group input-group-outline">
                                                    <input type="text" className="form-control" id="voting" value={`${votes.length} votes (${votes.filter(v => v.option === Options.YES).length} YES)`} disabled={true} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                                : <></>
                            }
                                    <div className="row ms-3">
                                        <div className="col-md-12 mb-3">
                                            {
                                                !title || (hasManagerPermissions() && topic.status === Status.IDLE)
                                                ? (
                                                    <button className="btn bg-gradient-dark me-2" onClick={btnSaveClick}>
                                                        <i className="material-icons opacity-10 me-2" >save</i>
                                                        Save Topic
                                                    </button>
                                                )
                                                : <></>
                                            }
                                            {
                                                (hasManagerPermissions() && topic.status === Status.IDLE)
                                                ? (
                                                    <button className="btn btn-success me-2" onClick={btnOpenVoteClick}>
                                                        <i className="material-icons opacity-10 me-2" >lock_open</i>
                                                        Open Voting
                                                    </button>
                                                )
                                                : <></>
                                            }
                                            {
                                                (hasManagerPermissions() && topic.status === Status.VOTING)
                                                ? (
                                                    <button className="btn btn-danger me-2" onClick={btnCloseVoteClick}>
                                                        <i className="material-icons opacity-10 me-2" >lock</i>
                                                        Close Voting
                                                    </button>
                                                )
                                                : <></>
                                            }
                                            {
                                                (!hasManagerPermissions() && topic.status === Status.VOTING && !alreadyVoted())
                                                ? (
                                                    <>
                                                        <button className="btn btn-success me-2" onClick={() => btnVoteClick(Options.YES)}>
                                                            <i className="material-icons opacity-10 me-2" >thumb_up</i>
                                                            Vote Yes
                                                        </button>
                                                        <button className="btn btn-warning me-2" onClick={() => btnVoteClick(Options.ABSTENTION)}>
                                                            <i className="material-icons opacity-10 me-2" >thumb_up_down</i>
                                                            Abstention
                                                        </button>
                                                        <button className="btn btn-danger me-2" onClick={() => btnVoteClick(Options.NO)}>
                                                            <i className="material-icons opacity-10 me-2" >thumb_down</i>
                                                            Vote No
                                                        </button>
                                                    </>
                                                )
                                                : <></>
                                            }
                                            {
                                                (hasManagerPermissions() && topic.status === Status.APPROVED && topic.category === Category.SPENT)
                                                ? (
                                                    <>
                                                        <button className="btn bg-gradient-dark me-2" onClick={btnTransferClick}>
                                                            <i className="material-icons opacity-10 me-2" >payments</i>
                                                            Transfer Payment
                                                        </button>
                                                    </>
                                                )
                                                : <></>
                                            }
                                            <p className="text-danger">
                                                {message}
                                            </p>
                                        </div>
                                    </div>
                        </div>
                    </div>
                    </div>
                </div>
                {
                    title
                    ? <TopicFiles title={title} status={topic.status} />
                    : <></>
                }
                <Footer />
                </div>
            </main>
        </>
    )
}

export default TopicPage;