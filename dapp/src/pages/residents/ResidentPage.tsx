import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import SwitchInput from '../../components/SwitchInput';
import { Resident, addResident, hasResidentPermissions, hasManagerPermissions, doLogout, getResident, setCounselor, Profile } from '../../services/Web3Service';
import { ApiResident, getApiResident, addApiResident, updateApiResident } from '../../services/ApiService';
import Loader from '../../components/Loader';
import { ethers } from 'ethers';

function ResidentPage() {

    const navigate = useNavigate();
    let { wallet } = useParams();
    const [message, setMessage] = useState<String>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [resident, setResident] = useState<Resident>({} as Resident);
    const [apiResident, setApiResident] = useState<ApiResident>({} as ApiResident);

    useEffect(() => {
        if (hasResidentPermissions()) {
            doLogout();
            navigate("/");
        }

        if (wallet) {
            
            setIsLoading(true);

            const blockchainPromise = getResident(wallet);
            const backendPromise = getApiResident(wallet);

            Promise.all([blockchainPromise, backendPromise])
                .then(results => {
                    setResident(results[0]);
                    setApiResident(results[1]);
                    console.log(results[0]);
                    setIsLoading(false);
                })
                .catch(err => {
                    setMessage(err.message);
                    setIsLoading(false);
                });            
        }

    }, [wallet]);

    function onResidentChange(evt: React.ChangeEvent<HTMLInputElement>) {
        setResident(prevState => ({...prevState, [evt.target.id]: evt.target.value}));
    }

    function onApiResidentChange(evt: React.ChangeEvent<HTMLInputElement>) {
        setApiResident(prevState => ({...prevState, [evt.target.id]: evt.target.value}));
    }

    function btnSaveClick() {
        
        if (resident) {
            
            setMessage("Connecting to wallet. Wait...");

            if (!wallet){

                const promiseBlockchain = addResident(resident.wallet, ethers.toNumber(resident.residence));
                // deveria ser apenas se a inclusão na blockchain ocorrer com sucesso
                const promiseBackend = addApiResident({...apiResident, profile: Profile.RESIDENT, wallet: resident.wallet});

                Promise.all([promiseBlockchain,promiseBackend])
                    .then(results => navigate("/residents?tx=" + results[0].hash))
                    .catch(err => setMessage(err.message));

            } else {

                const promises = [];
                const profile = resident.isCounselor ? Profile.COUNSELOR : Profile.RESIDENT;
                if (apiResident.profile !== profile) {
                    promises.push(setCounselor(resident.wallet, resident.isCounselor));
                }

                promises.push(updateApiResident(wallet, {...apiResident, profile, wallet}));
                
                Promise.all(promises)
                    .then(results => navigate("/residents?tx=" + wallet))
                    //.then(results => navigate("/residents/" + wallet)) // será o correto?
                    .catch(err => setMessage(err.message));
            }
        }
    }

    function getNextPayment() {
        if (!resident.nextPayment) return "Never Payed";
        const dateMs = ethers.toNumber(resident.nextPayment) * 1000;
        const text = !dateMs ? "Never Payed" : new Date(dateMs).toDateString();
        return text;
    }

    function getNextPaymentClass() {
        let className = "input-group input-group-outline ";
        if (!resident.nextPayment) return className + "is-invalid";
        const dateMs = ethers.toNumber(resident.nextPayment) * 1000;
        if (!dateMs || dateMs < Date.now())
            return className + "is-invalid";
        else
            return className + "is-valid";
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
                                <i className="material-icons opacity-10 me-2" >group</i>
                                {wallet ? "Edit " : "New "}Resident
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
                                        <label htmlFor="wallet">Wallet Address:</label>
                                        <div className="input-group input-group-outline">
                                            <input type="text" className="form-control" id="wallet" value={resident.wallet || ""} placeholder="0x00" onChange={onResidentChange} disabled={!!wallet} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="residence">Residence Id (block + apartment):</label>
                                        <div className="input-group input-group-outline">
                                            <input type="number" className="form-control" id="residence" value={ethers.toNumber(resident.residence || 0)} placeholder="1100" onChange={onResidentChange}  disabled={!!wallet} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="name">Name:</label>
                                        <div className="input-group input-group-outline">
                                            <input type="text" className="form-control" id="name" value={apiResident.name || ""} onChange={onApiResidentChange}  />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="phone">Phone:</label>
                                        <div className="input-group input-group-outline">
                                            <input type="text" className="form-control" id="phone" value={apiResident.phone || ""} placeholder="+55xx999998888" onChange={onApiResidentChange}  />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row ms-3">
                                <div className="col-md-6 mb-3">
                                    <div className="form-group">
                                        <label htmlFor="email">E-mail:</label>
                                        <div className="input-group input-group-outline">
                                            <input type="text" className="form-control" id="email" value={apiResident.email || ""} placeholder="email@domain.com" onChange={onApiResidentChange}  />
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
                                hasManagerPermissions() && wallet
                                ? (
                                    <div className="row ms-3">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <SwitchInput id='isCounselor' isChecked={resident.isCounselor} text='Is Counselor?' onChange={onResidentChange} />
                                            </div>
                                        </div>
                                    </div>
                                )
                                : <></>
                            }
                            <div className="row ms-3">
                                <div className="col-md-12 mb-3">
                                    <button className="btn bg-gradient-dark me-2" onClick={btnSaveClick}>
                                        <i className="material-icons opacity-10 me-2" >save</i>
                                        Save Resident
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

export default ResidentPage;