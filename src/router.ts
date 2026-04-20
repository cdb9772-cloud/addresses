/* eslint-disable @typescript-eslint/no-require-imports */
import fs from 'fs';
import express, { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { ENV } from './constants/environment-vars.constants';

const router = express.Router();

router.get('*', (req: Request, res: Response, next: NextFunction) => {
    try {
        (require(getEndpointControllerPath(req))).getRoute(req, res, next);
    } catch (err) {
        next(err);
    }
});

router.post('*', (req: Request, res: Response, next: NextFunction) => {
    try {
        (require(getEndpointControllerPath(req))).postRoute(req, res, next); }
    catch (err) {
        next(err); }
});

router.put('*', (req: Request, res: Response, next: NextFunction) => {
    try { (require(getEndpointControllerPath(req))).putRoute(req, res, next); } 
    catch (err) {
        next(err); }
});

router.delete('*', (req: Request, res: Response, next: NextFunction) => {
    try {
        (require(getEndpointControllerPath(req))).deleteRoute(req, res, next); }
        catch (err) {
        next(err); }
});

function getEndpointControllerPath(req: Request): string {
    const paths = req.baseUrl.split('/');

    const ext = (ENV === 'dev') ? 'ts' : 'js';
    const route = `${__dirname}/endpoints/${paths[1]}.endpoint.${ext}`;
    if (paths.length === 1 || !fs.existsSync(route) || paths[1] == 'base') {
        throw new createHttpError.BadRequest();
    }

    return route;
}

export default router;