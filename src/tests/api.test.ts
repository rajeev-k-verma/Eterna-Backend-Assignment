import Fastify from 'fastify';
import { orderRoutes } from '../routes/orderRoutes';
import websocket from '@fastify/websocket';
import supertest from 'supertest';

// Mock the queue so we don't actually need Redis running for unit tests
jest.mock('../infrastructure/queue', () => ({
    orderQueue: {
        add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    },
    queueEvents: {
        on: jest.fn(),
        off: jest.fn()
    }
}));

describe('API Endpoints', () => {
    let server: any;
    let request: any;

    beforeAll(async () => {
        server = Fastify();
        server.register(websocket);
        server.register(orderRoutes);
        await server.ready();
        request = supertest(server.server);
    });

    afterAll(async () => {
        await server.close();
    });

    // Test 5: Valid Order Submission
    test('POST /orders/execute should return 200 and orderId', async () => {
        const response = await request
            .post('/orders/execute')
            .send({
                amount: 10,
                tokenIn: 'SOL',
                tokenOut: 'USDC'
            });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('queued');
        expect(response.body.orderId).toBeDefined();
    });

    // Test 6: Check for Missing Data (Optional validation logic)
    test('POST /orders/execute handles empty body safely', async () => {
        const response = await request.post('/orders/execute').send({});
        expect(response.status).toBe(200); // Or 400 if you add validation later
        expect(response.body.orderId).toBeDefined();
    });

    // Test 9: Default Values (Token Names)
    test('POST /orders/execute uses default tokens if not provided', async () => {
        const addSpy = jest.spyOn(require('../infrastructure/queue').orderQueue, 'add');
        
        await request.post('/orders/execute').send({ amount: 5 }); // Sending MINIMAL data

        // Check if the defaults were applied in the arguments passed to the queue
        expect(addSpy).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ 
                tokenIn: 'SOL', 
                tokenOut: 'USDC' 
            }),
            expect.anything()
        );
    });

    // Test 10: Default Values (Order Side)
    test('POST /orders/execute defaults side to "buy"', async () => {
        const addSpy = jest.spyOn(require('../infrastructure/queue').orderQueue, 'add');
        
        await request.post('/orders/execute').send({ amount: 5 });

        expect(addSpy).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ side: 'buy' }),
            expect.anything()
        );
    });

    // Test 11: ID Format
    test('generated orderId should follow the correct format', async () => {
        const response = await request.post('/orders/execute').send({ amount: 1 });
        expect(response.body.orderId).toMatch(/^order-\d+/); // Regex: starts with "order-" followed by numbers
    });
});