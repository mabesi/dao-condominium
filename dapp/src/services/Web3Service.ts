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
    nextPayment: number;
}

export type ResidentPage = {
    residents: Resident[];
    total: ethers.BigNumber;
}

export type Topic = {
    title: string;
    description: string;
    category: Category;
    amount: ethers.BigNumber;
    responsible: string;
    status?: Status;
    createdDate?: number;
    startDate?: number;
    endDate?: number;
}

export type TopicPage = {
    topics: Topic[];
    total: ethers.BigNumber;
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

    // Assinar mensagem para autenticação no backend
    const signer = provider.getSigner();
    const timestamp = Date.now();
    const message = `Authenticating to Condominium: Timestamp: ${timestamp}`;
    const secret = await signer.signMessage(message);

    // Enviar secret para backend e receber o token
    const token = await doApiLogin(accounts[0], secret, timestamp);
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

export async function getTopic(title: string) : Promise<Topic> {
    const cc = getContract();
    return cc.getTopic(title) as Topic;
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
    topic.amount = ethers.BigNumber.from(topic.amount || 0);
    const cc = getContractSigner();
    return (await cc.addTopic(topic.title, topic.description, topic.category, topic.amount, topic.responsible)) as ethers.Transaction;
}

export async function editTopic(topicToEdit: string, description: string, amount: ethers.BigNumber, responsible: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    amount = ethers.BigNumber.from(amount || 0);
    const cc = getContractSigner();
    return (await cc.editTopic(topicToEdit, description, amount, responsible)) as ethers.Transaction;
}

export async function removeTopic(title: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = getContractSigner();
    return (await cc.removeTopic(title)) as ethers.Transaction;
}

export async function upgrade(contractAddress: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = getContractSigner();
    return (await cc.upgrade(contractAddress)) as ethers.Transaction;
}
    
export async function setCounselor(wallet: string, isEntering: boolean) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = getContractSigner();
    return (await cc.setCounselor(wallet, isEntering)) as ethers.Transaction;
}

export async function openVoting(topicTitle: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = getContractSigner();
    return (await cc.openVoting(topicTitle)) as ethers.Transaction;
}

export async function closeVoting(topicTitle: string) : Promise<ethers.Transaction> {
    if (getProfile() !== Profile.MANAGER) throw new Error(`You do not have permission.`);
    const cc = getContractSigner();
    return (await cc.closeVoting(topicTitle)) as ethers.Transaction;
}

export async function getQuota() : Promise<ethers.BigNumber> {
    const cc = getContract();
    return cc.getQuota() as ethers.BigNumber;
}

export async function payQuota(residenceId: number, value: ethers.BigNumber) : Promise<ethers.Transaction> {
    // Verificação de perfil com problema: e se o counselor ou o manager forem resident?
    if (getProfile() !== Profile.RESIDENT) throw new Error(`You do not have permission.`);
    const cc = getContractSigner();
    return (await cc.payQuota(residenceId, { value })) as ethers.Transaction;
}