import { ethers } from 'ethers';

function getProvider(): ethers.providers.Web3Provider {
    if (!window.ethereum) throw new Error("No MetaMask found");
    return new ethers.providers.Web3Provider(window.ethereum);
}

export async function doLogin() : Promise<string> {

    const provider = getProvider();
    const accounts = await provider.send("eth_requestAccounts", []);

    if (!accounts || !accounts.length) throw new Error("Wallet not found/allowed");

    localStorage.setItem("account", accounts[0]);
    return accounts[0];
}