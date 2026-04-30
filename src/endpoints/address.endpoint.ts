import { NextFunction, Request, Response } from 'express';
import baseEndpoint from './base.endpoint';
import addressService from '../services/address.service';
import responseWrapper from '../services/response.service';

import { RESPONSE_STATUS_OK, RESPONSE_STATUS_FAIL, RESPONSE_EVENT_READ } from '../constants/generic.constants';

/**
 * Express endpoint handler for all `/address/*` subroutes.
 * Delegates business logic to `addressService` and wraps all responses
 * using `responseWrapper` for a consistent envelope shape.
 *
 * Successful responses return HTTP 200 with `status: "OK"`.
 * Failed responses return HTTP 400 with `status: "FAIL"`.
 *
 * Subroutes handled:
 * - `POST /address/request`  -- raw upstream address lookup
 * - `POST /address/format`   -- formatted address lookup
 * - `POST /address/count`    -- count of matching records
 * - `POST /address/distance` -- Haversine distance between two coordinates
 * - `POST /address/zipcode`  -- city name lookup by ZIP code
 */
class AddressEndpoint extends baseEndpoint {
    /**
     * Entry point for all POST requests to `/address/*`.
     * Delegates to the appropriate private handler via `executeSubRoute`.
     */
    public post(req: Request, res: Response, next: NextFunction) : void {
        super.executeSubRoute(addressEndpoint, req, res, next);
    }

    private count_post(req: Request, res: Response, _next: NextFunction) : void {
        addressService.count(req)
            .then((response) => {
                res.status(200).send(responseWrapper(RESPONSE_STATUS_OK, RESPONSE_EVENT_READ, response));
            }).catch((err) => {
                res.status(400).send(responseWrapper(RESPONSE_STATUS_FAIL, RESPONSE_EVENT_READ, err));
            });
    }

    private request_post(req: Request, res: Response, _next: NextFunction) : void {
        addressService.request(req)
            .then((response) => {
                res.status(200).send(responseWrapper(RESPONSE_STATUS_OK, RESPONSE_EVENT_READ, response));
            }).catch((err) => {
                res.status(400).send(responseWrapper(RESPONSE_STATUS_FAIL, RESPONSE_EVENT_READ, err));
            });
    }


    private format_post(req: Request, res: Response, _next: NextFunction) : void {
        addressService.format(req)
            .then((response) => {
                res.status(200).send(responseWrapper(RESPONSE_STATUS_OK, RESPONSE_EVENT_READ, response));
            }).catch((err) => {
                res.status(400).send(responseWrapper(RESPONSE_STATUS_FAIL, RESPONSE_EVENT_READ, err));
            });
    }

    
    private distance_post(req: Request, res: Response, _next: NextFunction) : void {
        addressService.distance(req)
            .then((response) => {
                res.status(200).send(responseWrapper(RESPONSE_STATUS_OK, RESPONSE_EVENT_READ, response));
            }).catch((err) => {
                res.status(400).send(responseWrapper(RESPONSE_STATUS_FAIL, RESPONSE_EVENT_READ, err));
            });
    }

    //renny: handles POST /address/zipcode
    private zipcode_post(req: Request, res: Response, _next: NextFunction) : void {
        addressService.zipcode(req)
            .then((response) => {
                res.status(200).send(responseWrapper(RESPONSE_STATUS_OK, RESPONSE_EVENT_READ, response));
            }).catch((err) => {
                res.status(400).send(responseWrapper(RESPONSE_STATUS_FAIL, RESPONSE_EVENT_READ, err));
            });
    }
}

const addressEndpoint = new AddressEndpoint();

const getRoute = addressEndpoint.get;
const postRoute = addressEndpoint.post;
const putRoute = addressEndpoint.put;
const deleteRoute = addressEndpoint.delete;

export { getRoute, postRoute, putRoute, deleteRoute };