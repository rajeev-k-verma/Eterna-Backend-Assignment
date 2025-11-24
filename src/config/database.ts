// src/config/database.ts
import { Pool } from 'pg';

// 1. Connection Config (Docker vs Cloud)
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || 'postgresql://user:password@localhost:5432/orderbook_db'
});

// 2. Initialize Table (Run this on server start)
export const initDB = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                order_id VARCHAR(50) PRIMARY KEY,
                token_in VARCHAR(10),
                token_out VARCHAR(10),
                amount DECIMAL,
                status VARCHAR(20),
                tx_hash VARCHAR(100),
                price DECIMAL,
                error_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('[Database] Orders table initialized');
    } catch (err) {
        console.error('[Database] Init failed', err);
    } finally {
        client.release();
    }
};

// 3. Helper to save an order
export const saveOrder = async (order: any, result: any, status: string, error?: string) => {
    const query = `
        INSERT INTO orders (order_id, token_in, token_out, amount, status, tx_hash, price, error_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (order_id) DO UPDATE 
        SET status = $5, tx_hash = $6, price = $7, error_reason = $8;
    `;
    
    const values = [
        order.orderId,
        order.tokenIn,
        order.tokenOut,
        order.amount,
        status,
        result?.txHash || null,
        result?.executedPrice || null,
        error || null
    ];

    await pool.query(query, values);
};