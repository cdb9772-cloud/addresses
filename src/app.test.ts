import request from 'supertest';
import app from './app';
import addressService from './services/address.service';

jest.mock('./services/address.service', () => ({
    __esModule: true,
    default: {
        request: jest.fn(),
        count: jest.fn(),
    }
}));

afterEach(() => {
    jest.resetAllMocks();
});

describe('200 OK', () => {

    it('POST /address/request returns 200 with a valid body', async () => {
        (addressService.request as jest.Mock).mockResolvedValue([{ city: 'New York' }]);

        const res = await request(app)
            .post('/address/request')
            .send({ city: 'New York' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
        expect(res.body.event).toBe('READ');
        expect(res.body.body).toBeDefined();
    });

    it('POST /address/count returns 200 with a valid body', async () => {
        (addressService.count as jest.Mock).mockResolvedValue({ count: 2 });

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
        (addressService.request as jest.Mock).mockRejectedValue(new Error('bad input'));

        const res = await request(app)
            .post('/address/request')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('FAILED');
    });

    it('returns 400 when the downstream service rejects on /address/count', async () => {
        (addressService.count as jest.Mock).mockRejectedValue(new Error('bad input'));

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

describe('Not 500', () => {

    it('does not return 500 for invalid routes', async () => {
        const res = await request(app).post('/fakeroute').send({});

        expect(res.status).not.toBe(500);
    });

    it('does not return 500 when the downstream service fails', async () => {
        (addressService.request as jest.Mock).mockRejectedValue(new Error('network error'));

        const res = await request(app)
            .post('/address/request')
            .send({ city: 'New York' });

        expect(res.status).not.toBe(500);
    });
});