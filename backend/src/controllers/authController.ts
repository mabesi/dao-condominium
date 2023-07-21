import { Request, Response, NextFunction } from 'express';
import residentRepository from '../repositories/residentRepository';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import { Profile } from '../models/resident';

export type LoginData = {
    wallet: string;
    timestamp: number;
    secret: string;
    managerSecret?: string;
}

const JWT_SECRET = `${process.env.JWT_SECRET}`;
const JWT_EXPIRES = parseInt(`${process.env.JWT_EXPIRES}`);

export async function doLogin(req: Request, res: Response, next: NextFunction) {

    const data = req.body as LoginData;
    if (data.timestamp < (Date.now() - (30 * 1000)))
        return res.status(401).send(`Timestamp too old`);

    const message = `Authenticating to Condominium: Timestamp: ${data.timestamp}`;
    const signer = ethers.verifyMessage(message, data.secret);

    if (signer.toUpperCase() === data.wallet.toUpperCase()) {
        
        const resident = await residentRepository.getResident(data.wallet);
        
        if (!resident) {
            if (data.managerSecret) {
                const managerMessage = `Authenticating the manager to Condominium. Timestamp: ${data.timestamp}`;
                const managerSigner = ethers.verifyMessage(managerMessage, data.managerSecret);
                if (managerSigner.toUpperCase() === data.wallet.toUpperCase()) {
                    const token = jwt.sign({ ...data, profile: Profile.MANAGER }, JWT_SECRET, {
                        expiresIn: JWT_EXPIRES
                    })
                    console.log('Manager logado com sucesso!!!');
                    return res.json({ token });
                }
            }
            return res.status(401).send(`Resident not found.`);
        }
        const token = jwt.sign({ ...data, profile: resident.profile}, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        return res.json({ token });
    }

    return res.status(401).send(`Wallet and secret doesn't match.`)
}

export default {
    doLogin
}