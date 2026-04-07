import { Express } from 'express';
import request from 'supertest';

let app: Express;
let addressService: { request: jest.Mock, count: jest.Mock };

beforeEach(() => {
    jest.resetModules();
    jest.mock('./services/address.service', () => ({
        __esModule: true,
        default: {
            request: jest.fn(),
            count: jest.fn(),
        }
    }));
    app = require('./app').default;
    addressService = require('./services/address.service').default;
});

afterEach(() => {
    jest.resetAllMocks();
});

describe('200 OK', () => {

    it('POST /address/request returns 200 with a valid body', async () => {
        addressService.request.mockResolvedValue([{ city: 'New York' }]);

        const res = await request(app)
            .post('/address/request')
            .send({ city: 'New York' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
        expect(res.body.event).toBe('READ');
        expect(res.body.body).toBeDefined();
    });

    it('POST /address/count returns 200 with a valid body', async () => {
        addressService.count.mockResolvedValue({ count: 2 });

        const res = await request(app)
            .post('/address/count')
            .send({ city: 'New York' });

        expect(res.status).toBe(200);
        expect(res.body.body).toEqual({ count: 2 });
    });
});

describe('400 Bad Request', () => {

    it('returns 400 for a POST to a route that does not exist', async () => {
        const res = await request(app)
            .post('/nonexistent')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for a GET to a route that does not exist', async () => {
        const res = await request(app).get('/nonexistent');

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 when hitting the root path', async () => {
        const res = await request(app)
            .post('/')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for a valid endpoint with an invalid sub-route', async () => {
        const res = await request(app)
            .post('/address/doesnotexist')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 when the downstream service rejects on /address/request', async () => {
        addressService.request.mockRejectedValue(new Error('bad input'));

        const res = await request(app)
            .post('/address/request')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('FAILED');
    });

    it('returns 400 when the downstream service rejects on /address/count', async () => {
        addressService.count.mockRejectedValue(new Error('bad input'));

        const res = await request(app)
            .post('/address/count')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('FAILED');
    });

    it('returns 400 for a GET to /address/request', async () => {
        const res = await request(app).get('/address/request');

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for a PUT to /address/request', async () => {
        const res = await request(app)
            .put('/address/request')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for a DELETE to /address/request', async () => {
        const res = await request(app).delete('/address/request');

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});

describe('Never 500', () => {

    it('does not return 500 for invalid routes', async () => {
        const res = await request(app).post('/fakeroute').send({});

        expect(res.status).not.toBe(500);
    });

    it('does not return 500 when the downstream service fails', async () => {
        addressService.request.mockRejectedValue(new Error('network error'));

        const res = await request(app)
            .post('/address/request')
            .send({ city: 'New York' });

        expect(res.status).not.toBe(500);
    });
});
