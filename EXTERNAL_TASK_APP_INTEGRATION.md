# External Task App Integration Guide

This document explains how to integrate the external task application (task.obliumtoken.com) with the main Oblium application via webhooks.

## Overview

The external task app can award points to users by sending webhook requests to the main Oblium app. The system enforces daily claim limits that reset at 12:00 AM California time (America/Los_Angeles timezone).

## Webhook Endpoint

**URL:** `https://www.obliumtoken.com/api/webhooks/external-task`

**Method:** `POST`

**Content-Type:** `application/json`

## Request Format

### Headers

\`\`\`
Content-Type: application/json
x-webhook-signature: <HMAC_SHA256_SIGNATURE>
\`\`\`

### Payload

\`\`\`json
{
  "userId": "user-uuid-from-oblium",
  "taskIdentifier": "daily-check-in",
  "points": 500,
  "taskData": {
    "taskName": "Daily Check-In",
    "description": "User checked in today",
    "completedAt": "2025-01-16T10:00:00Z"
  },
  "timestamp": "2025-01-16T10:00:00Z"
}
\`\`\`

### Required Fields

- **userId** (string, UUID): The user's unique ID from Oblium
- **taskIdentifier** (string, 1-100 chars): Unique identifier for the task (e.g., "daily-check-in", "survey-complete")
- **points** (number, 1-100000): Points to award for completing the task

### Optional Fields

- **taskData** (object): Additional metadata about the task completion
- **timestamp** (string, ISO 8601): When the task was completed

## Security - HMAC Signature

All webhook requests MUST include an HMAC SHA256 signature for security.

### Generating the Signature

\`\`\`javascript
const crypto = require('crypto');

const payload = JSON.stringify({
  userId: "abc-123",
  taskIdentifier: "daily-check-in",
  points: 500,
  taskData: { taskName: "Daily Check-In" },
  timestamp: new Date().toISOString()
});

const signature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

// Include in request headers
const headers = {
  'Content-Type': 'application/json',
  'x-webhook-signature': signature
};
\`\`\`

**Important:** Use the same `WEBHOOK_SECRET` environment variable configured in both applications.

## Response Format

### Success Response (200 OK)

\`\`\`json
{
  "success": true,
  "message": "Points awarded successfully!",
  "data": {
    "claimId": "claim-uuid",
    "pointsAwarded": 500,
    "totalPoints": 15000,
    "userId": "user-uuid",
    "taskIdentifier": "daily-check-in"
  }
}
\`\`\`

### Already Claimed Today (200 OK)

\`\`\`json
{
  "success": false,
  "message": "Task already claimed today. Come back tomorrow!",
  "errorId": "ERR-123456789-abcdef"
}
\`\`\`

### Error Response (4xx/5xx)

\`\`\`json
{
  "error": "Error message",
  "details": "Additional error details",
  "errorId": "ERR-123456789-abcdef"
}
\`\`\`

## Daily Claim System

### How It Works

1. Each task can be claimed **once per day** per user
2. The daily reset happens at **12:00 AM California time** (America/Los_Angeles timezone)
3. Users in different timezones all reset at the same moment (12 AM Pacific)
4. Task claims are tracked by `(userId, taskIdentifier, claimDate)` combination

### Example Timeline

- **11:59 PM PT on Jan 15**: User completes task → Success
- **12:00 AM PT on Jan 16**: Daily limit resets
- **12:01 AM PT on Jan 16**: Same user can claim again → Success
- **1:00 AM PT on Jan 16**: User tries again → "Already claimed today"

## Task Identifiers

Use descriptive, unique identifiers for different tasks:

- `daily-check-in`
- `watch-video-ad`
- `complete-survey`
- `social-share`
- `referral-bonus`
- `achievement-unlock`

Each identifier tracks its own daily claim status independently.

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | userId, taskIdentifier, or points not provided |
| 400 | Invalid user ID format | userId is not a valid UUID |
| 400 | Invalid points amount | Points must be 1-100000 |
| 400 | Invalid task identifier | Identifier must be 1-100 characters |
| 401 | Invalid signature | HMAC signature doesn't match |
| 404 | User not found | No user exists with provided userId |
| 500 | Server configuration error | Missing environment variables |
| 500 | Failed to process task claim | Database error occurred |

## Example Integration Code

### Node.js/Express Example

\`\`\`javascript
const crypto = require('crypto');
const axios = require('axios');

async function awardTaskPoints(userId, taskIdentifier, points, taskData = {}) {
  const payload = {
    userId,
    taskIdentifier,
    points,
    taskData,
    timestamp: new Date().toISOString()
  };

  const body = JSON.stringify(payload);
  
  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  try {
    const response = await axios.post(
      'https://www.obliumtoken.com/api/webhooks/external-task',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signature
        }
      }
    );

    if (response.data.success) {
      console.log(`Awarded ${response.data.data.pointsAwarded} points to user ${userId}`);
      console.log(`User now has ${response.data.data.totalPoints} total points`);
      return response.data;
    } else {
      console.log(`Claim failed: ${response.data.message}`);
      return response.data;
    }
  } catch (error) {
    console.error('Webhook failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
awardTaskPoints(
  'f5ed2686-ec12-49b4-94c1-e0971a3dcc1e',
  'daily-check-in',
  500,
  { taskName: 'Daily Check-In', completedAt: new Date().toISOString() }
);
\`\`\`

## Testing

### Test Endpoint

For development/testing, you can test the webhook endpoint directly:

\`\`\`bash
curl -X POST https://www.obliumtoken.com/api/webhooks/external-task \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: YOUR_SIGNATURE" \
  -d '{
    "userId": "f5ed2686-ec12-49b4-94c1-e0971a3dcc1e",
    "taskIdentifier": "test-task",
    "points": 100,
    "taskData": {"test": true},
    "timestamp": "2025-01-16T10:00:00Z"
  }'
\`\`\`

### Verify Daily Reset

To verify the California timezone reset is working:

1. Make a claim at 11:59 PM PT → Should succeed
2. Wait until 12:00 AM PT
3. Make same claim at 12:01 AM PT → Should succeed again
4. Make same claim at 12:02 AM PT → Should fail (already claimed)

## Support

For issues or questions about the webhook integration, check the error logs with the provided `errorId` or contact the Oblium development team.
