import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

class BaseEndpoint {
    private readonly extensions = new Map<string, string>([
        ["dev", ".ts"],
        ["prod", ".js"]
    ]);

    public constructor() { }

    public get(_req: Request, _res: Response, _next: NextFunction) {
        throw new createHttpError.BadRequest();
    }

    public post(_req: Request, _res: Response, _next: NextFunction) {
        throw new createHttpError.BadRequest();
    }

    public put(_req: Request, _res: Response, _next: NextFunction) {
        throw new createHttpError.BadRequest();
    }

    public delete(_req: Request, _res: Response, _next: NextFunction) {
        throw new createHttpError.BadRequest();
    }

    public executeSubRoute(endPointMethod: any, req: Request, res: Response, next: NextFunction) {
        let subRoute = req.originalUrl.split('/')[2];
        subRoute = `${subRoute}_${req.method.toLowerCase()}`

        const temp = endPointMethod[subRoute as keyof typeof endPointMethod];
        if (!temp) {
            throw new createHttpError.BadRequest();
        }

        temp(req, res, next);
    }
}

export default BaseEndpoint;
