import { MockDexRouter } from '../domain/mockDexRouter';

describe('MockDexRouter Logic', () => {
    let router: MockDexRouter;

    beforeEach(() => {
        router = new MockDexRouter();
    });

    // Test 1: Does it return a valid quote from Raydium?
    test('should fetch a quote from Raydium', async () => {
        const quote = await router.getRaydiumQuote('SOL', 'USDC', 1);
        expect(quote.dex).toBe('raydium');
        expect(quote.price).toBeGreaterThan(0);
    });

    // Test 2: Does it return a valid quote from Meteora?
    test('should fetch a quote from Meteora', async () => {
        const quote = await router.getMeteoraQuote('SOL', 'USDC', 1);
        expect(quote.dex).toBe('meteora');
        expect(quote.price).toBeGreaterThan(0);
    });

    // Test 3: Does it actually pick the lower price?
    test('should route to the DEX with the lower price (Buy Order)', async () => {
        // We will "spy" on the methods to force specific prices
        // This ensures the test is deterministic (not random)
        jest.spyOn(router, 'getRaydiumQuote').mockResolvedValue({
            dex: 'raydium', price: 150, fee: 0.1
        });
        jest.spyOn(router, 'getMeteoraQuote').mockResolvedValue({
            dex: 'meteora', price: 155, fee: 0.1
        });

        const bestQuote = await router.routeAndGetQuote('SOL', 'USDC', 1);
        
        // Since Raydium (150) < Meteora (155), it should pick Raydium
        expect(bestQuote.dex).toBe('raydium');
        expect(bestQuote.price).toBe(150);
    });

    // Test 4: Does the swap execution return a hash?
    test('should return a transaction hash on execution', async () => {
        const mockQuote = { dex: 'raydium', price: 150, fee: 0.1 } as any;
        const result = await router.executeSwap(mockQuote, 'test-order');
        
        expect(result.status).toBe('confirmed');
        expect(result.txHash).toBeDefined();
        expect(result.txHash).toContain('5x');
    });

    // Test 7: The "Reverse" Scenario (Meteora is cheaper)
    test('should route to Meteora when it offers a better price', async () => {
        // Force Raydium to be EXPENSIVE (160)
        jest.spyOn(router, 'getRaydiumQuote').mockResolvedValue({
            dex: 'raydium', price: 160, fee: 0.1
        });
        // Force Meteora to be CHEAP (155)
        jest.spyOn(router, 'getMeteoraQuote').mockResolvedValue({
            dex: 'meteora', price: 155, fee: 0.1
        });

        const bestQuote = await router.routeAndGetQuote('SOL', 'USDC', 1);
        
        expect(bestQuote.dex).toBe('meteora');
        expect(bestQuote.price).toBe(155);
    });

    // Test 8: Data Integrity
    test('should always return a quote with a defined fee', async () => {
        const quote = await router.getRaydiumQuote('SOL', 'USDC', 1);
        expect(quote.fee).toBeDefined();
        expect(typeof quote.fee).toBe('number');
    });
});