import { ethers } from 'ethers';
import ABI from './ABI.json';
import { doApiLogin } from './ApiService';

export enum Profile {
    RESIDENT = 0,
    COUNSELOR = 1,
    MANAGER = 2
}

export enum Options {
    EMPTY = 0,
    YES = 1,
    NO = 2,
    ABSTENTION = 3
}

export enum Status {
    IDLE = 0,
    VOTING = 1,
    APPROVED = 2,
    DENIED = 3,
    DELETED = 4,
    SPENT = 5
}

export enum Category {
    DECISION = 0,
    SPENT = 1,
    CHANGE_QUOTA = 2,
    CHANGE_MANAGER = 3
}

export type LoginResult = {
    account: string;
    profile: Profile;
    token: string;
}

export type Resident = {
    wallet: string;
    residence: number;
    isCounselor: boolean;
    isManager: boolean;
    nextPayment: ethers.BigNumberish;
}

export type ResidentPage = {
    residents: Resident[];
    total: ethers.BigNumberish;
}

export type Topic = {
    title: string;
    description: string;
    category: Category;
    amount: ethers.BigNumberish;
    responsible: string;
    status?: Status;
    createdDate?: ethers.BigNumberish;
    startDate?: ethers.BigNumberish;
    endDate?: ethers.BigNumberish;
}

export type TopicPage = {
    topics: Topic[];
    total: ethers.BigNumberish;
}

export type Vote = {
    resident: string;
    residence: number;
    timestamp: ethers.BigNumberish;
    option: Options;
}

const ADAPTER_ADDRESS = `${process.env.REACT_APP_ADAPTER_ADDRESS}`;

function getProfile() : Profile {
    const profile = localStorage.getItem("profile") || "0";
    return parseInt(profile);
}

function getProvider(): ethers.BrowserProvider {
    if (!window.ethereum)
        throw new Error("No MetaMask found");
    return new ethers.BrowserProvider(window.ethereum);
}

function getContract(provider?: ethers.BrowserProvider) : ethers.Contract {
    if (!provider)
        provider = getProvider();
    return new ethers.Contract(ADAPTER_ADDRESS, ABI as ethers.InterfaceAbi, provider);
}

async function getContractSigner(provider?: ethers.BrowserProvider) : Promise<ethers.Contract> {
    if (!provider)
        provider = getProvider();
    const signer = await provider.getSigner(localStorage.getItem("account") || undefined);
    const contract =  new ethers.Contract(ADAPTER_ADDRESS, ABI as ethers.InterfaceAbi, provider);
    return contract.connect(signer) as ethers.Contract;
}

export function hasResidentPermissions() : boolean {
    return parseInt(localStorage.getItem("profile") || "0") === Profile.RESIDENT;
}

export function hasCounselorPermissions() : boolean {
    return parseInt(localStorage.getItem("profile") || "0") !== Profile.RESIDENT;
}

export function hasManagerPermissions() : boolean {
    return parseInt(localStorage.getItem("profile") || "0") === Profile.MANAGER;
}

export async function doLogin() : Promise<LoginResult> {

    const provider = getProvider();
    const accounts = await provider.send("eth_requestAccounts", []);

    if (!accounts || !accounts.length) throw new Error("Wallet not found/allowed");

    const cc = getContract(provider);
    const resident = (await cc.getResident(accounts[0])) as Resident;

    let isManager = resident.isManager;

    if (!isManager && ethers.toNumber(resident.residence) > 0) {
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

    // Assinar mensagem para autenticação no backend
    const signer = await provider.getSigner();
    const timestamp = Date.now();
    const message = `Authenticating to Condominium: Timestamp: ${timestamp}`;
    const secret = await signer.signMessage(message);

    let managerSecret = undefined;

    if (isManager) {
        const managerMessage = `Authenticating the manager to Condominium. Timestamp: ${timestamp}`;
        managerSecret = await signer.signMessage(managerMessage);
    }
    
    const token = await doApiLogin(accounts[0], timestamp, secret, managerSecret );
    
    // Salvar o token no localStorage
    localStorage.setItem("token", token);


    return {
        account: accounts[0],
        profile: parseInt(localStorage.getItem("profile") || "0"),
        token: token
    } as LoginResult;
}

export function doLogout() {
    localStorage.removeItem("account");
    localStorage.removeItem("profile");
    localStorage.removeItem("token");
}

export async function getImplementationAddress() : Promise<string> {
    const cc = getContract();
    return await cc.getImplementationAddress();
}

// export async function getResident(wallet: string) : Promise<Resident> {
//     const cc = getContract();
//     return await cc.getResident(wallet) as Promise<Resident>;
// }

export async function getResidents(page: number = 1, pageSize: number = 10) : Promise<ResidentPage> {
    const cc = getContract();
    const result = await cc.getResidents(page, pageSize) as ResidentPage;
    const residents = [...result.residents].filter(r => r.residence).sort((a,b) => ethers.toNumber(a.residence) - ethers.toNumber(b.residence));
    return {
        residents,
        total: result.total
    } as ResidentPage;
}

export async function addResident(wallet: string, residenceId: number) : Promise<ethers.Transaction> {
    if (getProfile() === Profile.RESIDENT) throw new Error(`You do not have permission.`);
    const cc = await getContractSigner();
    return (await cc.addResident(wallet, residenceId)) as Promise<ethers.Transaction>;
}

export async function removeResident(wallet: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = await getContractSigner();
    return (await cc.removeResident(wallet)) as Promise<ethers.Transaction>;
}

export async function getTopic(title: string) : Promise<Topic> {
    const cc = getContract();
    return cc.getTopic(title) as Promise<Topic>;
}

export async function getTopics(page: number = 1, pageSize: number = 10) : Promise<TopicPage> {
    const cc = getContract();
    const result = await cc.getTopics(page, pageSize) as TopicPage;
    const topics = result.topics.filter(t => t.title);
    return {
        topics,
        total: result.total
    } as TopicPage;
}

export async function addTopic(topic: Topic) : Promise<ethers.Transaction> {
    topic.amount = ethers.toBigInt(topic.amount || 0);
    const cc = await getContractSigner();
    return (await cc.addTopic(topic.title, topic.description, topic.category, topic.amount, topic.responsible)) as Promise<ethers.Transaction>;
}

export async function editTopic(topicToEdit: string, description: string, amount: ethers.BigNumberish, responsible: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    amount = ethers.toBigInt(amount || 0);
    const cc = await getContractSigner();
    return (await cc.editTopic(topicToEdit, description, amount, responsible)) as Promise<ethers.Transaction>;
}

export async function removeTopic(title: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = await getContractSigner();
    return (await cc.removeTopic(title)) as Promise<ethers.Transaction>;
}

export async function upgrade(contractAddress: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = await getContractSigner();
    return (await cc.upgrade(contractAddress)) as Promise<ethers.Transaction>;
}
    
export async function setCounselor(wallet: string, isEntering: boolean) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = await getContractSigner();
    return (await cc.setCounselor(wallet, isEntering)) as Promise<ethers.Transaction>;
}

export async function openVoting(topicTitle: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = await getContractSigner();
    return (await cc.openVoting(topicTitle)) as Promise<ethers.Transaction>;
}

export async function closeVoting(topicTitle: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = await getContractSigner();
    return (await cc.closeVoting(topicTitle)) as Promise<ethers.Transaction>;
}

export async function getVotes(topicTitle: string) : Promise<Vote[]> {
    const cc = getContract();
    return cc.getVotes(topicTitle) as Promise<Vote[]>;
}

export async function vote(topicTitle: string, option: Options) : Promise<ethers.Transaction> {
    const cc = await getContractSigner();
    return (await cc.vote(topicTitle, option)) as Promise<ethers.Transaction>;
}

export async function getQuota() : Promise<ethers.BigNumberish> {
    const cc = getContract();
    return await cc.getQuota() as ethers.BigNumberish
}

export async function getResident(wallet: string) : Promise<Resident> {
    const cc = getContract();
    return await cc.getResident(wallet) as Promise<Resident>;
}

export async function payQuota(residenceId: ethers.BigNumberish, value: ethers.BigNumberish) : Promise<ethers.Transaction> {
    // Verificação de perfil com problema: e se o counselor ou o manager forem resident?
    if (getProfile() !== Profile.RESIDENT) throw new Error(`You do not have permission.`);
    const cc = await getContractSigner();
    return (await cc.payQuota(residenceId, { value })) as Promise<ethers.Transaction>;
}

export async function transfer(topicTitle: string, amount: ethers.BigNumberish) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = await getContractSigner();
    return await cc.transfer(topicTitle, amount) as Promise<ethers.Transaction>;
}

export async function getBalance(address?: string) : Promise<string> {
    if (!address) address = await getImplementationAddress();
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
}
