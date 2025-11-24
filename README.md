# Solana Order Execution Engine (Mock)

## Tech Stack
* **Runtime:** Node.js + TypeScript
* **Server:** Fastify (Chosen for low overhead and native WebSocket support)
* **Queue:** BullMQ + Redis (Handles concurrency and retries)
* **Database:** PostgreSQL (Order history)
* **Testing:** Jest (11 Unit/Integration tests)

## Design Decisions
1.  **Why Market Orders?**
    I chose Market Orders because they represent the core use case of a DEX: immediate execution at the best available price. This allowed me to focus on the *routing logic* and *speed* rather than complex order book management.
    * *Extension Plan:* To add Limit Orders, I would introduce a "price watcher" worker that periodically checks prices and triggers the execution queue only when the target price is hit.

2.  **Architecture:**
    * **API Layer:** Accepts HTTP requests and upgrades to WebSockets for live streaming.
    * **Queue Layer:** Decouples the user request from the heavy execution logic. If 1000 orders come in, the API stays fast while the Workers process them at a steady rate (10 concurrent).

## How to Run

1.  **Start Infrastructure (Docker)**
    ```bash
    docker-compose up -d
    ```

2.  **Install & Run**
    ```bash
    npm install
    npm run dev
    ```

3.  **Run Tests**
    ```bash
    npm test
    ```

## API Usage

**POST** `/orders/execute`
```json
{
  "amount": 10,
  "tokenIn": "SOL",
  "tokenOut": "USDC"
}