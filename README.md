# KHQR Webhook

A Node.js service that handles KHQR (Khmer QR) payment notifications via webhooks. This service acts as a bridge between Bakong's KHQR payment system and your application, providing real-time payment status updates and transaction management.

## Features

- **Transaction Tracking**: Monitor KHQR payment transactions in real-time
- **Webhook Notifications**: Receive payment status updates through configurable webhooks
- **Automatic Retries**: Built-in retry mechanism for failed webhook deliveries
- **API Documentation**: Interactive OpenAPI documentation available at `/reference`
- **Secure Authentication**: API key-based authentication for all endpoints
- **Transaction Status**: Support for success, failed, and timeout transaction states
- **Queue Management**: Built-in queue monitoring dashboard at `/queue` available only in development mode
- **Logging System**: Structured logging with pino for better observability
- **Docker Support**: Full containerization support with Docker and Docker Compose

## Prerequisites

Before you begin, ensure you have the following:

- **Runtime Environment**
  - Bun Runtime (v1.2.11 or later recommended)
  - Node.js (Latest LTS version) for development tools
- **Infrastructure**
  - Redis instance (local or cloud)
- **Bakong Integration**
  - Bakong registered email for KHQR integration or token get from Bakong 
- **Development Tools**
  - Git for version control
  - Docker and Docker Compose (optional, for containerized development)

> **Note**: The Bakong auto token renewal feature has known stability issues. While implemented, its reliability cannot be guaranteed due to inconsistencies in the Bakong API. Consider implementing manual token management as a fallback solution.

## Environment Variables

The following environment variables need to be set:

- `NODE_ENV`: Environment mode (`development`, `production`, `test`, or `stage`)
- `PORT`: Server port (default: 3000)
- `REDIS_URL`: Redis connection URL
- `API_KEY`: API key for endpoint authentication. If not set, authentication will be disabled.

You can set these variables in a `.env` file in the root directory of the project.

## Installation

1. Clone the repository and install dependencies:

```bash
bun install
```

2. Set up environment variables:
```bash
cp .env.example .env
```
3. Edit the .env file with your configuration.
4. Start the development server:
```bash
bun run dev
```
5. For production deployment:
```bash
bun run start
```
6. Alternatively, use Docker Compose:
```bash
docker-compose up -d
```

## Deployment
The service is designed to be containerized using Docker and Docker Compose. You can find the Dockerfile and docker-compose.yml files in the project root directory. 

You can use VPS or other PaaS that support Docker to deploy the service. Example: [Fly.io](https://fly.io), [Render](https://render.com/) or [Railway](https://railway.com/) etc.


## API Documentation
The API documentation is available at `/reference`.

## Webhook Send Body

When a transaction is processed, the service sends a webhook to your specified URL with the following JSON payload:

```json
// Success send body
{
  "status": "success",
  "data": {
    "hash": "transaction_hash",
    "fromAccountId": "sender_account_id",
    "toAccountId": "recipient_account_id",
    "currency": "KHR" | "USD",
    "amount": 1000,
    "description": "Transaction description",
    "createdDateMs": 1629384000000,
    "acknowledgedDateMs": 1629384000000
  },
  "md5": "khqr_md5_hash",
  "jobId": "job_id"
}

// Failure send body
{
  "data":  null,
  "status": "failed" | "timeout",
  "md5": "khqr_md5_hash",
  "jobId": "job_id"
}

```
#### Status Values
- `success`: Transaction completed successfully
- `failed`: Transaction failed, Maybe Bakong error
- `timeout`: Transaction timed out or no response received. It timeout after 5 minutes.

#### Data Object
The data field will be null for failed or timeout transactions.

#### Webhook Response
Your webhook endpoint should return a 2xx status code as json to acknowledge receipt. The service will retry failed webhook deliveries up to 5 times with exponential backoff.

## Demo
You can see the demo [here](https://khqr-webhook.fly.dev/reference)

> **Important**: This demo environment is provided for testing and evaluation purposes only. Please do not use it in production environments as it may have limitations in terms of reliability, security, and performance.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
