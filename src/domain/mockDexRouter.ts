// 1. Define the shape of our Order and Quote
export interface Order {
    orderId: string;
    type: 'market' | 'limit' | 'sniper'; // We are focusing on 'market'
    side: 'buy' | 'sell';
    amount: number;
    tokenIn: string;
    tokenOut: string;
}

export interface Quote {
    dex: 'raydium' | 'meteora';
    price: number;
    fee: number;
}

export class MockDexRouter {
    // 2. The "Sleep" Helper
    // Real network requests take time. We simulate this delay here.
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 3. Mock Raydium Quote
    async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote> {
        await this.sleep(200); // Simulate network delay (200ms)
        
        // Base price simulation
        const basePrice = 150; 
        
        // Add Variance: Raydium might be slightly more expensive or cheaper
        const variance = (Math.random() * 0.05) - 0.025; // +/- 2.5%
        
        return {
            dex: 'raydium',
            price: basePrice * (1 + variance),
            fee: 0.003
        };
    }

    // 4. Mock Meteora Quote
    async getMeteoraQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote> {
        await this.sleep(200);
        
        const basePrice = 150;
        const variance = (Math.random() * 0.05) - 0.025; 

        return {
            dex: 'meteora',
            price: basePrice * (1 + variance),
            fee: 0.002
        };
    }

    // 5. The Routing Logic
    async routeAndGetQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote> {
        console.log(`[Router] Fetching quotes for ${amount} ${tokenIn} -> ${tokenOut}...`);
        
        // Fetch both quotes in parallel (like a real aggregator)
        const [raydiumQuote, meteoraQuote] = await Promise.all([
            this.getRaydiumQuote(tokenIn, tokenOut, amount),
            this.getMeteoraQuote(tokenIn, tokenOut, amount)
        ]);

        console.log(`[Router] Raydium: $${raydiumQuote.price.toFixed(2)}, Meteora: $${meteoraQuote.price.toFixed(2)}`);

        if (raydiumQuote.price < meteoraQuote.price) {
            console.log(`[Router] Routing to Raydium (Better Price)`);
            return raydiumQuote;
        } else {
            console.log(`[Router] Routing to Meteora (Better Price)`);
            return meteoraQuote;
        }
    }

    // 6. Execute Swap
    async executeSwap(quote: Quote, orderId: string) {
        console.log(`[Executor] Swapping on ${quote.dex} for Order ${orderId}...`);
        
        // Simulate a longer delay for transaction confirmation on Solana (2-3 seconds)
        await this.sleep(2000 + Math.random() * 1000);

        // Mock a transaction hash
        const mockTxHash = "5x" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        return {
            status: 'confirmed',
            txHash: mockTxHash,
            executedPrice: quote.price
        };
    }
}