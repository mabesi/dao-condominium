import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { keccak256 } from 'ethers';

export async function getTopicFile(req: Request, res: Response, next: NextFunction) {
    return res.sendStatus(200);    
}

export async function getTopicFiles(req: Request, res: Response, next: NextFunction) {
    return res.sendStatus(200);    
}

export async function addTopicFile(req: Request, res: Response, next: NextFunction) {
    return res.sendStatus(201);    
}

export async function deleteTopicFile(req: Request, res: Response, next: NextFunction) {
    return res.sendStatus(204);    
}

export async function deleteAllTopicFiles(req: Request, res: Response, next: NextFunction) {
    return res.sendStatus(204);    
}

export default {
    getTopicFile,
    getTopicFiles,
    addTopicFile,
    deleteTopicFile,
    deleteAllTopicFiles
}