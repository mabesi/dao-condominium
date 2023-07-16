import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import SwitchInput from '../../components/SwitchInput';
import { Topic, addTopic, isResident, isManager, doLogout, getTopic, Profile } from '../../services/Web3Service';
import Loader from '../../components/Loader';

function TopicPage() {

    const navigate = useNavigate();
    let { title } = useParams();
    const [message, setMessage] = useState<String>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [topic, setTopic] = useState<Topic>({} as Topic);

    useEffect(() => {

        if (title) {
            
            setIsLoading(true);

            getTopic(title)
                .then(topic => {
                    setTopic(topic);
                    setIsLoading(false);
                })
                .catch(err => {
                    setMessage(err.message);
                    setIsLoading(false);
                });            
        }

    }, [title]);

    function onTopicChange(evt: React.ChangeEvent<HTMLInputElement>) {
        setTopic(prevState => ({...prevState, [evt.target.id]: evt.target.value}));
    }

    function btnSaveClick() {
        
        if (topic) {
            
            setMessage("Connecting to wallet. Wait...");

            // if (!title){

            //     const promiseBlockchain = addTopic(Topic.wallet, Topic.residence);
            //     // deveria ser apenas se a inclusão na blockchain ocorrer com sucesso
            //     const promiseBackend = addApiTopic({...apiTopic, profile: Profile.Topic, wallet: Topic.wallet});

            //     Promise.all([promiseBlockchain,promiseBackend])
            //         .then(results => navigate("/Topics?tx=" + results[0].hash))
            //         .catch(err => setMessage(err.message));

            // } else {

            //     const promises = [];
            //     const profile = Topic.isCounselor ? Profile.COUNSELOR : Profile.Topic;
            //     if (apiTopic.profile !== profile) {
            //         promises.push(setCounselor(Topic.wallet, Topic.isCounselor));
            //     }

            //     promises.push(updateApiTopic(wallet, {...apiTopic, profile, wallet}));
                
            //     Promise.all(promises)
            //         .then(results => navigate("/Topics?tx=" + wallet))
            //         //.then(results => navigate("/Topics/" + wallet)) // será o correto?
            //         .catch(err => setMessage(err.message));
            // }
        }
    }

    // function getNextPayment() {
    //     const dateMs = Topic.nextPayment * 1000;
    //     const text = !dateMs ? "Never Payed" : new Date(dateMs).toDateString();
    //     return text;
    // }

    // function getNextPaymentClass() {
    //     let className = "input-group input-group-outline ";
    //     const dateMs = Topic.nextPayment * 1000;
    //     if (!dateMs || dateMs < Date.now())
    //         return className + "is-invalid";
    //     else
    //         return className + "is-valid";
    // }

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
                            {/* <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="wallet">Wallet Address:</label>
                                        <div className="input-group input-group-outline">
                                            <input type="text" className="form-control" id="wallet" value={Topic.wallet || ""} placeholder="0x00" onChange={onTopicChange} disabled={!!wallet} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="residence">Residence Id (block + apartment):</label>
                                        <div className="input-group input-group-outline">
                                            <input type="number" className="form-control" id="residence" value={Topic.residence || ""} placeholder="1101" onChange={onTopicChange}  disabled={!!wallet} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="name">Name:</label>
                                        <div className="input-group input-group-outline">
                                            <input type="text" className="form-control" id="name" value={apiTopic.name || ""} onChange={onApiTopicChange}  />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="phone">Phone:</label>
                                        <div className="input-group input-group-outline">
                                            <input type="text" className="form-control" id="phone" value={apiTopic.phone || ""} placeholder="+55xx999998888" onChange={onApiTopicChange}  />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="email">E-mail:</label>
                                        <div className="input-group input-group-outline">
                                            <input type="text" className="form-control" id="email" value={apiTopic.email || ""} placeholder="email@domain.com" onChange={onApiTopicChange}  />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {
                                wallet
                                ? (
                                    <div className="row ms-3">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label htmlFor="nextPayment">Next Payment:</label>
                                                <div className={getNextPaymentClass()}>
                                                    <input type="text" className="form-control" id="nextPayment" value={getNextPayment()} disabled={true} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                                : <></>
                            }
 
                            {
                                isManager() && wallet
                                ? (
                                    <div className="row ms-3">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <SwitchInput id='isCounselor' isChecked={Topic.isCounselor} text='Is Counselor?' onChange={onTopicChange} />
                                            </div>
                                        </div>
                                    </div>
                                )
                                : <></>
                            } */}
                            <div className="row ms-3">
                                <div className="col-md-12 mb-3">
                                    <button className="btn bg-gradient-dark me-2" onClick={btnSaveClick}>
                                        <i className="material-icons opacity-10 me-2" >save</i>
                                        Save Topic
                                    </button>
                                    <span className="text-danger">
                                        {message}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                
                <Footer />
                </div>
            </main>
        </>
    )
}

export default TopicPage;