# KHQR Webhook

A Cloudflare Worker service that handles KHQR (Khmer QR) payment notifications via webhooks.

## Features

- **Transaction Tracking**: Monitor KHQR payment transactions in real-time
- **Webhook Notifications**: Receive payment status updates through configurable webhooks
- **Automatic Retries**: Built-in retry mechanism for failed webhook deliveries
- **API Documentation**: Interactive OpenAPI documentation available at `/reference`
- **Secure Authentication**: API key-based authentication for all endpoints
- **Transaction Status**: Support for success, failed, and expired transaction states

## Prerequisites

- Node.js or Bun Runtime (Latest version recommended)
- Cloudflare Workers account
- Bakong registered email for KHQR integration

## Environment Variables

The following environment variables need to be set:

- `BAKONG_REGISTERED_EMAIL`: Your registered Bakong email. if you don't have one, you can register one [here](https://api-bakong.nbc.gov.kh/register)
- `TIMEOUT_IN_MINUTES`: Transaction timeout duration (default: 5)
- `WEBHOOK_SECRET_KEY`: Secret key for webhook signature verification
- `API_KEY`: API key for endpoint authentication

## Installation

1. Clone the repository and install dependencies:

```bash
bun install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```
