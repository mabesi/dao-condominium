import { keccak256, toUtf8Bytes } from 'ethers';
import axios from './AxiosConfig';
import { Profile, hasManagerPermissions, hasCounselorPermissions } from './Web3Service';

const API_URL=`${process.env.REACT_APP_API_URL}`;

export type ApiResident = {
    wallet: string;
    name: string;
    profile: Profile;    
    phone?: string;
    email?: string;
}

export async function doApiLogin(wallet: string, timestamp: number, secret: string, managerSecret?: string) {
    const response = await axios.post(`${API_URL}/login`,{ wallet, timestamp, secret, managerSecret });
    return response.data.token;
}

export async function getApiResident(wallet: string) : Promise<ApiResident>{
    const response = await axios.get(`${API_URL}/residents/${wallet}`);
    return response.data as ApiResident;    
}

export async function addApiResident(resident: ApiResident) : Promise<ApiResident>{
    if (!hasCounselorPermissions()) throw new Error(`You do not have permissions.`); 
    const response = await axios.post(`${API_URL}/residents/`, resident);
    return response.data as ApiResident;
}

export async function updateApiResident(wallet: string, resident: ApiResident) : Promise<ApiResident>{
    if (!hasCounselorPermissions()) throw new Error(`You do not have permissions.`); 
    const response = await axios.patch(`${API_URL}/residents/${wallet}`, resident);
    return response.data as ApiResident;
}

export async function deleteApiResident(wallet: string) : Promise<void> {
    if (!hasManagerPermissions()) throw new Error(`You do not have permissions.`); 
    axios.delete(`${API_URL}/residents/${wallet}`);
}

export async function uploadTopicFile(topicTitle: string, file: File) {
    if (!hasCounselorPermissions()) throw new Error(`You do not have permissions.`); 
    const hash = keccak256(toUtf8Bytes(topicTitle));
    const formData = new FormData();
    formData.append("file", file);
    await axios.post(`${API_URL}/topicfiles/${hash}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })
}

export async function getTopicFiles(topicTitle: string) : Promise<string[]> {
    const hash = keccak256(toUtf8Bytes(topicTitle));
    const response = await axios.get(`${API_URL}/topicfiles/${hash}`);
    return response.data as string[];
}

export async function deleteTopicFiles(topicTitle: string, filename: string) : Promise<void> {
    const hash = keccak256(toUtf8Bytes(topicTitle));
    await axios.delete(`${API_URL}/topicfiles/${hash}/${filename}`);
}