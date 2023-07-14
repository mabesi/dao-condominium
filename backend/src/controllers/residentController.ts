import express, { Request, Response, NextFunction } from 'express';
import Resident from '../models/resident';
import residentRepository from '../repositories/residentRepository';

export async function getResident(req: Request, res: Response, next: NextFunction) {

    const wallet = req.params.wallet;
    const resident = await residentRepository.getResident(wallet);

    if (!resident) return res.sendStatus(404);

    return res.json(resident);
}

export default {
    getResident
}