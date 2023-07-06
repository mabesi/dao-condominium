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

const ADAPTER_ADDRESS = `${process.env.REACT_APP_ADAPTER_ADDRESS}`;

function getProvider(): ethers.providers.Web3Provider {
    if (!window.ethereum) throw new Error("No MetaMask found");
    return new ethers.providers.Web3Provider(window.ethereum);
}

function getContract(provider?: ethers.providers.Web3Provider) : ethers.Contract {
    if (!provider) provider = getProvider();
    return new ethers.Contract(ADAPTER_ADDRESS, ABI, provider);
}

export async function doLogin() : Promise<LoginResult> {

    const provider = getProvider();
    const accounts = await provider.send("eth_requestAccounts", []);

    if (!accounts || !accounts.length) throw new Error("Wallet not found/allowed");

    const cc = getContract(provider);
    const manager = (await cc.getManager()) as string;
    const isManager = accounts[0].toLowerCase() === manager.toLowerCase();

    if (isManager) 
       localStorage.setItem("profile", `${Profile.MANAGER}`);
    else
       localStorage.setItem("profile", `${Profile.RESIDENT}`);
    
    localStorage.setItem("account", accounts[0].toLowerCase());

    return {
        account: accounts[0],
        profile: parseInt(localStorage.getItem("profile") || "0")
    } as LoginResult;
}

export function doLogout() {
    localStorage.removeItem("account");
    localStorage.removeItem("profile");
}