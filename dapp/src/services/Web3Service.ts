import { ethers } from 'ethers';
import ABI from './ABI.json';

export enum Profile {
    RESIDENT = 0,
    COUNSELOR = 1,
    MANAGER = 2
}

export type LoginResult = {
    account: string;
    profile: Profile;
}

export type Resident = {
    wallet: string;
    residence: number;
    isCounselor: boolean;
    isManager: boolean;
    nextPayment: number;
}

export type ResidentPage = {
    residents: Resident[];
    total: number;
}

const ADAPTER_ADDRESS = `${process.env.REACT_APP_ADAPTER_ADDRESS}`;

function getProfile() : Profile {
    const profile = localStorage.getItem("profile") || "0";
    return parseInt(profile);
}

function getProvider(): ethers.providers.Web3Provider {
    if (!window.ethereum) throw new Error("No MetaMask found");
    return new ethers.providers.Web3Provider(window.ethereum);
}

function getContract(provider?: ethers.providers.Web3Provider) : ethers.Contract {
    if (!provider) provider = getProvider();
    return new ethers.Contract(ADAPTER_ADDRESS, ABI, provider);
}

function getContractSigner(provider?: ethers.providers.Web3Provider) : ethers.Contract {
    if (!provider) provider = getProvider();
    const signer = provider.getSigner(localStorage.getItem("account") || undefined);
    const contract =  new ethers.Contract(ADAPTER_ADDRESS, ABI, provider);
    return contract.connect(signer);
}

export function isResident() : boolean {
    return parseInt(localStorage.getItem("profile") || "0") === Profile.RESIDENT;
}

export function isManager() : boolean {
    return parseInt(localStorage.getItem("profile") || "0") === Profile.MANAGER;
}

export async function doLogin() : Promise<LoginResult> {

    const provider = getProvider();
    const accounts = await provider.send("eth_requestAccounts", []);

    if (!accounts || !accounts.length) throw new Error("Wallet not found/allowed");

    const cc = getContract(provider);
    const resident = (await cc.getResident(accounts[0])) as Resident;

    let isManager = resident.isManager;

    if (!isManager && resident.residence > 0) {
        if (resident.isCounselor)
            localStorage.setItem("profile", `${Profile.COUNSELOR}`);
        else
            localStorage.setItem("profile", `${Profile.RESIDENT}`);
    } else if (!isManager && !resident.residence) {
        const manager = await cc.getManager() as string;
        isManager = accounts[0].toLowerCase() === manager.toLowerCase();
    }

    if (isManager) 
       localStorage.setItem("profile", `${Profile.MANAGER}`);
    else if (localStorage.getItem("profile") === null)
        throw new Error("Unauthorized");

    localStorage.setItem("account", accounts[0]);

    return {
        account: accounts[0],
        profile: parseInt(localStorage.getItem("profile") || "0")
    } as LoginResult;
}

export function doLogout() {
    localStorage.removeItem("account");
    localStorage.removeItem("profile");
}

export async function getAddress() : Promise<string> {
    const cc = getContract();
    const contractAddress = await cc.getAddress() as string;
    return contractAddress;
}

export async function getResident(wallet: string) : Promise<Resident> {
    const cc = getContract();
    return cc.getResident(wallet) as Resident;
}

export async function getResidents(page: number = 1, pageSize: number = 10) : Promise<ResidentPage> {
    const cc = getContract();
    const result = await cc.getResidents(page, pageSize) as ResidentPage;
    const residents = result.residents.filter(r => r.residence).sort((a,b) => {
        if (a.residence > b.residence)
            return 1;
        else
            return -1
    });
    return {
        residents,
        total: result.total
    } as ResidentPage;
}

export async function upgrade(contractAddress: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = getContractSigner();
    return (await cc.upgrade(contractAddress)) as ethers.Transaction;
}

export async function addResident(wallet: string, residenceId: number) : Promise<ethers.Transaction> {
    if (getProfile() === Profile.RESIDENT) throw new Error(`You do not have permission.`);
    const cc = getContractSigner();
    return (await cc.addResident(wallet, residenceId)) as ethers.Transaction;
}

export async function removeResident(wallet: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = getContractSigner();
    return (await cc.removeResident(wallet)) as ethers.Transaction;
}

export async function setCounselor(wallet: string, isEntering: boolean) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = getContractSigner();
    return (await cc.setCounselor(wallet, isEntering)) as ethers.Transaction;
}