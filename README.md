# Solana Order Execution Engine (Mock)

## Tech Stack

* Node.js + TypeScript
* Fastify (HTTP + WebSocket server)
* BullMQ + Redis (job queue, concurrency control)
* PostgreSQL (order history storage)
* Jest (unit and integration tests)

## Design Decisions

### 1. Market Orders

Market Orders were chosen because they represent the simplest and most common DEX use-case: immediate execution at the best available price.
This allows the project to focus on routing and execution logic rather than implementing a full limit order book.

*Future extension:* Limit Orders can be added by creating a price-watcher worker that monitors market prices and triggers execution when the target price is reached.

### 2. System Architecture

* **API Layer:** Handles HTTP requests and upgrades connections to WebSockets for real-time order status streaming.
* **Queue Layer:** Separates request reception from heavy processing work. Incoming orders are queued, and the worker executes them at a fixed concurrency level to maintain stability.

---

# Deployment

Service URL:

```
https://eterna-backend-assignment-abt5.onrender.com
```

### WebSocket Endpoint

Use this endpoint to receive live status updates for an order:

```
wss://eterna-backend-assignment-abt5.onrender.com/ws/orders?orderId=<order_id>
```

Example:

```
wss://eterna-backend-assignment-abt5.onrender.com/ws/orders?orderId=order-1764010399102
```

The WebSocket will stream messages corresponding to order states such as `pending`, `routing`, `submitted`, and `confirmed`.

---

# Local Development

### 1. Start Services (Redis + PostgreSQL)

```
docker-compose up -d
```

### 2. Install Dependencies and Start the Server

```
npm install
npm run dev
```

### 3. Run Test Suite

```
npm test
```

---

# API Usage

### Submit an Order

**POST** `/orders/execute`

Request body:

```json
{
  "amount": 10,
  "tokenIn": "SOL",
  "tokenOut": "USDC"
}
```

Example response:

```json
{
  "status": "queued",
  "orderId": "order-<timestamp>",
  "message": "Order received and processing started."
}
```
