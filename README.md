# Logistics Backend API 🚚

## Overview

This project provides a robust and scalable backend for a logistics platform, built with TypeScript, Node.js, and Express. It leverages MongoDB with Mongoose for data persistence, implements secure authentication using JWT and Argon2, and integrates real-time features with Socket.io and Redis for efficient session and notification management.

## Features

- **Secure Authentication & Authorization**: Implements comprehensive user registration, login, email verification, password reset flows, and JWT-based access/refresh token management with Argon2 for password hashing. Supports Client, Driver, and Admin roles.
- **Driver Management**: Facilitates driver applications, admin approval/rejection workflows, driver profile updates (including truck images via Cloudinary), and management of driver-specific news/posts.
- **Real-time Trip Coordination**: Enables clients to request trips, drivers to accept/reject them, and provides real-time driver location tracking for active trips using Socket.io and GeoJSON capabilities.
- **User & Driver Profiles**: Allows users to manage their profiles, including updating profile pictures, and provides dedicated endpoints for fetching client and driver-specific details.
- **Notifications**: Integrated notification system for status updates (e.g., driver application status, trip status) with real-time delivery via WebSockets.
- **Dynamic Content Management**: Drivers can create and manage news articles related to their services, accessible via SEO-friendly slugs.
- **Robust Error Handling & Validation**: Centralized error handling middleware and Joi-based request validation ensure data integrity and a stable API.
- **Scalable Infrastructure**: Utilizes Redis for efficient caching and session management, reducing database load and enhancing responsiveness.

## Getting Started

### Environment Variables

To run this project, you will need to set up the following environment variables in a `.env` file in the root directory:

```env
MONGOURL=mongodb+srv://<username>:<password>@cluster.mongodb.net/transport-app?retryWrites=true&w=majority
PORT=3001
JWT_SEC=<your_jwt_secret_string>
FRONTEND_URL=http://localhost:3000
ACCESS_TOKEN_SECRET=<your_access_token_secret_string>
REFRESH_TOKEN_SECRET=<your_refresh_token_secret_string>
HMAC_VERIFICATION_CODE_SECRET=<your_hmac_secret_string_for_otps>
CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUD_API_KEY=<your_cloudinary_api_key>
CLOUD_API_SECRET=<your_cloudinary_api_secret>
REDIS_URL=redis://localhost:6379 # Or your Upstash Redis URL
EMAIL_USER=<email_service_api_username> # (For external email service, e.g., sendgrid or custom service credentials)
EMAIL_PASS=<email_service_api_password> # (For external email service)
SERVER_URL=http://localhost:3001 # Or your deployed backend URL
```

**Note:** `EMAIL_USER` and `EMAIL_PASS` are for an external email sending service that this application integrates with. Replace placeholders with actual secure values.

## Usage

This API serves as the backend for a logistics application, allowing clients to book trips and drivers to manage their services.

**1. User Registration and Login:**
Clients and drivers can register and log in to the system. Upon successful login, access and refresh tokens are provided via HTTP-only cookies for secure, authenticated requests.

**2. Client Functionality:**
Clients can search for available drivers, request trips, track the real-time location of their accepted trips, and view their trip history.

**3. Driver Functionality:**
Drivers can submit applications to become verified, manage their truck details and images, accept or reject trip requests, update their live location during trips, and create news posts for other drivers. They also receive notifications regarding their application status and trip requests.

**4. Admin Functionality:**
Admins have elevated privileges to review and approve/reject driver applications and manage users.

**Example Request Flow (Client Booking a Trip):**

- **Authenticate as Client:**
  Perform a `POST /auth/v1/login` request. The backend will set `accessToken` and `refreshToken` cookies.

- **Browse Drivers:**
  A client application would typically fetch a list of available drivers using `GET /authenticated/v1/all_driver`.

- **Request a Trip:**
  Once a driver is selected, the client sends a `POST /usertrips/trips` request, including the driver's ID and trip details.
  The driver receives a notification and can accept or reject the trip.

- **Track Trip:**
  If the trip is accepted, the client can then track the driver's location using `POST /usertrips/trip/track` with the provided `trackingId`.

**Socket.io for Real-time Updates:**

The application uses Socket.io to provide real-time updates for notifications and driver status.
When a user connects to the frontend, they should `emit('register', userId)` to join their personal room.
The server will then emit events like `driver_status_update` to this room.

```javascript
// Example frontend Socket.io connection and registration
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", { withCredentials: true }); // Use your backend URL

socket.on("connect", () => {
  console.log("Connected to socket server");
  const userId = "YOUR_USER_MONGO_ID"; // Replace with the authenticated user's _id
  socket.emit("register", userId);
});

socket.on("driver_status_update", (notification) => {
  console.log("Received driver status update:", notification);
  // Display notification to the user
});

socket.on("disconnect", () => {
  console.log("Disconnected from socket server");
});
```

## API Documentation

### Base URL

`http://localhost:3001` (or your deployed server URL)

All authenticated requests require `accessToken` and `refreshToken` cookies to be sent with the request.

### Endpoints

#### Authentication Routes (`/auth/v1`)

#### POST /auth/v1/signup

**Description**: Registers a new user (client or driver).
**Request**:

```json
{
  "full_name": "Jane Doe",
  "email": "jane.doe@example.com",
  "userName": "janedoe",
  "password": "StrongPassword123",
  "confirmPassword": "StrongPassword123",
  "address": "456 Oak Ave",
  "country": "Nigeria",
  "role": "client"
}
```

**Response**:

```json
{
  "success": true,
  "statuscode": 201,
  "message": "User registered successfully. Check your email for verification.",
  "data": {
    "username": "janedoe",
    "email": "jane.doe@example.com",
    "isVerified": false
  }
}
```

**Errors**:

- `409 Conflict`: User already exists
- `404 Not Found`: Passwords do not match
- `400 Bad Request`: Validation errors (e.g., `full_name is required`)

#### POST /auth/v1/login

**Description**: Authenticates a user and issues access/refresh tokens.
**Request**:

```json
{
  "Email_Username": "janedoe",
  "password": "StrongPassword123"
}
```

**Response**: (Sets `accessToken` and `refreshToken` as HTTP-only cookies)

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Login successful",
  "data": {
    "userId": "FFMTABC123",
    "full_name": "jane doe",
    "address": "456 Oak Ave",
    "country": "Nigeria",
    "role": "client",
    "MemberSince": "15/July/2024 10:30:00 PM",
    "email": "jane.doe@example.com",
    "userName": "janedoe",
    "isAdmin": false
  }
}
```

**Errors**:

- `404 Not Found`: User not found
- `400 Bad Request`: Incorrect password
- `401 Unauthorized`: Verification link expired, a new one sent.
- `409 Conflict`: Email not verified.

#### GET /auth/v1/verify-email

**Description**: Verifies a user's email address using a token received via email.
**Request**: Query parameter `token`

```
GET /auth/v1/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Email verified successfully!"
}
```

**Errors**:

- `400 Bad Request`: Verification token is required
- `404 Not Found`: User not found, or verification link has expired
- `409 Conflict`: User already verified

#### GET /auth/v1/refresh-token

**Description**: Refreshes an expired access token using the refresh token.
**Request**: (Automatically sends `refreshToken` cookie)

```
GET /auth/v1/refresh-token
```

**Response**: (Sets new `accessToken` as HTTP-only cookie)

```json
{
  "success": true,
  "statuscode": 200,
  "message": "New access token issued"
}
```

**Errors**:

- `401 Unauthorized`: No refresh token provided
- `404 Not Found`: User not found or token expired
- `403 Forbidden`: Invalid refresh token

#### POST /auth/v1/forgetpassword

**Description**: Initiates password reset by sending an OTP to the user's email.
**Request**:

```json
{
  "email": "jane.doe@example.com"
}
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Password reset code sent to your email. the code will expire in the next 20mins",
  "data": "jane.doe@example.com"
}
```

**Errors**:

- `400 Bad Request`: User not found invalid email or username
- `400 Bad Request`: Validation errors (e.g., `email is required`)

#### POST /auth/v1/verifycode

**Description**: Verifies the OTP sent for password reset.
**Request**:

```json
{
  "email": "jane.doe@example.com",
  "code": "123456"
}
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Code verified sucessfully"
}
```

**Errors**:

- `404 Not Found`: User not found
- `400 Bad Request`: Invalid or expired code
- `400 Bad Request`: Validation errors (e.g., `code Required`)

#### PUT /auth/v1/resetpassword

**Description**: Resets the user's password after OTP verification.
**Request**:

```json
{
  "email": "jane.doe@example.com",
  "code": "123456",
  "newPassword": "NewStrongPassword123",
  "confirmNewpassword": "NewStrongPassword123"
}
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Password reset successful"
}
```

**Errors**:

- `400 Bad Request`: Passwords do not match
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid or expired code
- `400 Bad Request`: Validation errors

#### GET /auth/v1/logout

**Description**: Logs out the user by clearing access and refresh tokens.
**Request**: (Authenticated request, sends cookies)

```
GET /auth/v1/logout
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "User logged out successfully"
}
```

#### Driver/Admin/User Management Routes (`/authenticated/v1`)

#### POST /authenticated/v1/driver-request

**Description**: Allows an authenticated user with `driver` role to submit a driver application. Requires truck images.
**Authentication**: `verifyToken`, `allowRoles("driver")`
**Request**: `multipart/form-data` with fields and `truckImagesDriver` files.

```
Field: licenseNumber (string)
Field: phone (string)
Field: truckType (string)
Field: country (string)
Field: state (string)
Field: town (string)
Field: price (number)
Field: experience (number)
Field: description (string)
File: truckImagesDriver (array of image files, max 5)
```

**Example Payload (form-data):**

```
licenseNumber: AB12345C
phone: 08012345678
truckType: Heavy Duty Truck
country: Nigeria
state: Lagos
town: Ikeja
price: 50000
experience: 5
description: Experienced driver with 5 years in long-haul logistics.
truckImagesDriver: [file1.jpg, file2.png]
```

**Response**:

```json
{
  "success": true,
  "statuscode": 201,
  "message": "Driver application submitted. Waiting for admin approval.",
  "data": {
    "licenseNumber": "AB12345C",
    "phone": "08012345678",
    "truckType": "Heavy Duty Truck",
    "country": "Nigeria",
    "state": "Lagos",
    "isDriverRequest": true,
    "town": "Ikeja",
    "price": 50000,
    "description": "Experienced driver with 5 years in long-haul logistics.",
    "experience": 5,
    "status": "pending"
    // ... other driver fields
  }
}
```

**Errors**:

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not a driver
- `400 Bad Request`: You must be authenticated, You must upload at least one image, Your request is already pending/approved, Validation errors.

#### GET /authenticated/v1/all_users

**Description**: Retrieves all registered users. Admin-only.
**Authentication**: `verifyToken`, `isAdmin`
**Request**:

```
GET /authenticated/v1/all_users
Query Parameter: search (optional, string) - Search by full_name or userId
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Users fetched successfully",
  "data": [
    {
      "_id": "60c72b2f9f1b2c001c8e4d1f",
      "full_name": "Jane Doe",
      "email": "jane.doe@example.com",
      "userName": "janedoe",
      "userId": "FFMTABC123",
      "isVerified": true,
      "isAdmin": false,
      "role": "client"
      // ...
    }
  ]
}
```

**Errors**:

- `401 Unauthorized`: Access token missing
- `403 Forbidden`: Admins only

#### POST /authenticated/v1/accept/:driverid

**Description**: Admin accepts a pending driver application.
**Authentication**: `verifyToken`, `isAdmin`
**Request**: `driverid` as URL parameter.

```
POST /authenticated/v1/accept/60c72b2f9f1b2c001c8e4d1f
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Driver request approved successfully"
}
```

**Errors**:

- `400 Bad Request`: Driver ID is required, Driver has already been approved
- `404 Not Found`: Driver not found, User not found
- `401 Unauthorized`, `403 Forbidden`: Admin access required

#### POST /authenticated/v1/reject/:driverid

**Description**: Admin rejects a pending driver application.
**Authentication**: `verifyToken`, `isAdmin`
**Request**: `driverid` as URL parameter.

```
POST /authenticated/v1/reject/60c72b2f9f1b2c001c8e4d1f
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Driver request rejected successfully"
}
```

**Errors**:

- `400 Bad Request`: Driver ID is required
- `404 Not Found`: Driver not found, User not found
- `401 Unauthorized`, `403 Forbidden`: Admin access required

#### GET /authenticated/v1/requestdetails

**Description**: Retrieves the authenticated driver's application details.
**Authentication**: `verifyToken`, `allowRoles("driver")`
**Request**:

```
GET /authenticated/v1/requestdetails
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "hey [Driver's Full Name] thid your request order",
  "data": [
    {
      "_id": "60c72b2f9f1b2c001c8e4d1f",
      "licenseNumber": "AB12345C",
      "phone": "08012345678",
      "truckType": "Heavy Duty Truck",
      "country": "Nigeria",
      "status": "pending",
      "truckImagesDriver": {
        "_id": "60c72b2f9f1b2c001c8e4d1g",
        "images": [
          {
            "originalName": "truck1.jpg",
            "publicId": "driver_trucks/truck1_public_id",
            "url": "https://res.cloudinary.com/..."
          }
        ]
      }
    }
  ]
}
```

**Errors**:

- `400 Bad Request`: You must be authenticated, User not found or empty user
- `401 Unauthorized`, `403 Forbidden`: Driver access required

#### PUT /authenticated/v1/update

**Description**: Updates authenticated driver's information and truck images.
**Authentication**: `verifyToken`, `allowRoles("driver")`
**Request**: `multipart/form-data`

```
Field: description (string, optional)
Field: town (string, optional)
Field: country (string, optional)
Field: state (string, optional)
Field: phone (string, optional)
Field: price (number, optional)
File: truckImagesDriver (array of new image files, optional)
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Driver info updated successfully",
  "data": {
    "_id": "60c72b2f9f1b2c001c8e4d1f",
    "description": "Updated experience and services.",
    "phone": "08098765432",
    "truckImagesDriver": {
      "images": [
        // ... updated image list
      ]
    }
    // ... other driver fields
  }
}
```

**Errors**:

- `400 Bad Request`: You must be authenticated, Please update at least one field, Maximum 5 images allowed.
- `404 Not Found`: Driver not found
- `401 Unauthorized`, `403 Forbidden`: Driver access required

#### DELETE /authenticated/v1/deleteimg/:imageId

**Description**: Deletes a specific truck image for the authenticated driver.
**Authentication**: `verifyToken`, `allowRoles("driver")`
**Request**: `imageId` as URL parameter.

```
DELETE /authenticated/v1/deleteimg/60c72b2f9f1b2c001c8e4d1h
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Image deleted successfully",
  "data": {
    "_id": "60c72b2f9f1b2c001c8e4d1g",
    "images": [
      // ... remaining image list
    ]
  }
}
```

**Errors**:

- `400 Bad Request`: You must be authenticated
- `404 Not Found`: Driver not found, No truck images found, Image not found
- `401 Unauthorized`, `403 Forbidden`: Driver access required

#### GET /authenticated/v1/requested-driver

**Description**: Retrieves all driver applications with a "pending" status. Admin-only.
**Authentication**: `verifyToken`, `isAdmin`
**Request**:

```
GET /authenticated/v1/requested-driver
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Requested drivers",
  "data": [
    {
      "_id": "60c72b2f9f1b2c001c8e4d1f",
      "state": "Lagos",
      "town": "Ikeja",
      "country": "Nigeria",
      "driverId": "DXLABC123",
      "phone": "08012345678",
      "licenseNumber": "AB12345C",
      "images": [
        {
          "originalName": "truck1.jpg",
          "publicId": "driver_trucks/truck1_public_id",
          "url": "https://res.cloudinary.com/..."
        }
      ]
    }
  ]
}
```

**Errors**:

- `401 Unauthorized`, `403 Forbidden`: Admin access required

#### GET /authenticated/v1/all_driver

**Description**: Retrieves a list of all approved drivers.
**Authentication**: None
**Request**:

```
GET /authenticated/v1/all_driver
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Drivers retrieved successfully",
  "data": [
    {
      "_id": "60c72b2f9f1b2c001c8e4d1f",
      "driverId": "DXLABC123",
      "truckType": "Heavy Duty Truck",
      "country": "Nigeria",
      "price": 50000,
      "authId": {
        "_id": "60c72b2f9f1b2c001c8e4d1e",
        "full_name": "John Driver",
        "email": "john.driver@example.com",
        "phone": "08012345678",
        "image": "https://..."
      }
      // ... other driver details
    }
  ]
}
```

**Errors**:

- `404 Not Found`: No drivers found

#### GET /authenticated/v1/all_driver/:id

**Description**: Retrieves details for a single approved driver by their driver `_id`.
**Authentication**: None
**Request**: `id` as URL parameter.

```
GET /authenticated/v1/all_driver/60c72b2f9f1b2c001c8e4d1f
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Driver retrieved successfully",
  "data": {
    "_id": "60c72b2f9f1b2c001c8e4d1f",
    "driverId": "DXLABC123",
    "licenseNumber": "AB12345C",
    "phone": "08012345678",
    "truckType": "Heavy Duty Truck",
    "country": "Nigeria",
    "state": "Lagos",
    "town": "Ikeja",
    "price": 50000,
    "description": "Experienced driver with 5 years in long-haul logistics.",
    "authId": {
      "_id": "60c72b2f9f1b2c001c8e4d1e",
      "full_name": "John Driver",
      "email": "john.driver@example.com",
      "phone": "08012345678",
      "image": "https://..."
    },
    "truckImagesDriver": {
      "_id": "60c72b2f9f1b2c001c8e4d1g",
      "images": [
        {
          "originalName": "truck1.jpg",
          "publicId": "driver_trucks/truck1_public_id",
          "url": "https://res.cloudinary.com/..."
        }
      ]
    }
  }
}
```

**Errors**:

- `404 Not Found`: Driver not found

#### POST /authenticated/v1/news

**Description**: Creates a new news post by an authenticated driver.
**Authentication**: `verifyToken`, `allowRoles("driver")`
**Request**: `multipart/form-data` with fields and `image` file.

```
Field: newsTitle (string)
Field: newsBody (string)
File: image (single image file)
```

**Response**:

```json
{
  "success": true,
  "statuscode": 201,
  "message": "Driver news created successfully",
  "data": {
    "_id": "60c72b2f9f1b2c001c8e4d1z",
    "driverId": "60c72b2f9f1b2c001c8e4d1e",
    "newsTitle": "New Truck Added to Fleet",
    "newsBody": "Excited to announce the addition of a new high-capacity truck...",
    "authorname": "John Driver",
    "image": {
      "url": "https://res.cloudinary.com/...",
      "public_id": "driver_news/image_public_id"
    },
    "slug": "new-truck-added-to-fleet-60c72b2f9f1b2c001c8e4d1z-DXLABC123",
    "createdAt": "2024-07-15T12:00:00.000Z",
    "updatedAt": "2024-07-15T12:00:00.000Z"
  }
}
```

**Errors**:

- `401 Unauthorized`: User not authenticated
- `404 Not Found`: User not found
- `403 Forbidden`: This news is for drivers only
- `400 Bad Request`: Image file is required, Validation errors (e.g., `newsTitle is required`)

#### GET /authenticated/v1/news/:slug

**Description**: Retrieves a single driver news post by its unique slug.
**Authentication**: `verifyToken`, `allowRoles("driver")` (Note: `allowRoles` makes this driver-only, but usually news would be public. Review if this is intended)
**Request**: `slug` as URL parameter.

```
GET /authenticated/v1/news/new-truck-added-to-fleet-60c72b2f9f1b2c001c8e4d1z-DXLABC123
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Driver news fetched successfully",
  "data": {
    "_id": "60c72b2f9f1b2c001c8e4d1z",
    "driverId": {
      "_id": "60c72b2f9f1b2c001c8e4d1e",
      "full_name": "John Driver",
      "email": "john.driver@example.com"
    },
    "newsTitle": "New Truck Added to Fleet",
    "newsBody": "Excited to announce the addition of a new high-capacity truck...",
    "authorname": "John Driver",
    "image": {
      "url": "https://res.cloudinary.com/...",
      "public_id": "driver_news/image_public_id"
    },
    "slug": "new-truck-added-to-fleet-60c72b2f9f1b2c001c8e4d1z-DXLABC123",
    "createdAt": "2024-07-15T12:00:00.000Z",
    "updatedAt": "2024-07-15T12:00:00.000Z",
    "timeAgo": "1 hour ago"
  }
}
```

**Errors**:

- `404 Not Found`: News not found
- `401 Unauthorized`, `403 Forbidden`: Driver access required

#### GET /authenticated/v1/myblogs

**Description**: Retrieves all news posts created by the authenticated driver.
**Authentication**: `verifyToken`, `allowRoles("driver")`
**Request**:

```
GET /authenticated/v1/myblogs
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Driver news fetched successfully",
  "data": [
    {
      "_id": "60c72b2f9f1b2c001c8e4d1z",
      "driverId": "60c72b2f9f1b2c001c8e4d1e",
      "newsTitle": "New Truck Added to Fleet",
      "newsBody": "Excited to announce the addition of a new high-capacity truck...",
      "authorname": "John Driver",
      "image": {
        "url": "https://res.cloudinary.com/...",
        "public_id": "driver_news/image_public_id"
      },
      "slug": "new-truck-added-to-fleet-60c72b2f9f1b2c001c8e4d1z-DXLABC123",
      "createdAt": "2024-07-15T12:00:00.000Z",
      "updatedAt": "2024-07-15T12:00:00.000Z",
      "timeAgo": "1 hour ago"
    }
  ]
}
```

**Errors**:

- `401 Unauthorized`: User not authenticated
- `404 Not Found`: No news found — make a post for your fellow drivers.
- `403 Forbidden`: Driver access required

#### DELETE /authenticated/v1/myblogs/:id

**Description**: Deletes a specific news post created by the authenticated driver.
**Authentication**: `verifyToken`, `allowRoles("driver")`
**Request**: `id` as URL parameter.

```
DELETE /authenticated/v1/myblogs/60c72b2f9f1b2c001c8e4d1z
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Driver news deleted successfully"
}
```

**Errors**:

- `401 Unauthorized`: User not authenticated
- `404 Not Found`: News not found
- `403 Forbidden`: You are not allowed to delete this post
- `403 Forbidden`: Driver access required

#### GET /authenticated/v1/notification

**Description**: Retrieves the latest notifications for the authenticated user.
**Authentication**: `verifyToken`, `allowRoles("driver")` (Note: Endpoint is `/notification` but `allowRoles` is for `driver` specifically. If clients also get notifications, `allowRoles` should be removed or changed.)
**Request**:

```
GET /authenticated/v1/notification
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "User notifications",
  "data": [
    {
      "_id": "60c72b2f9f1b2c001c8e4d1y",
      "userId": "60c72b2f9f1b2c001c8e4d1e",
      "message": "Your driver request has been approved by admin.",
      "status": "approved",
      "createdAt": "2024-07-15T11:00:00.000Z",
      "updatedAt": "2024-07-15T11:00:00.000Z"
    }
  ]
}
```

**Errors**:

- `400 Bad Request`: User not authenticated
- `401 Unauthorized`, `403 Forbidden`: Driver access required

#### User Profile Routes (`/authenticated/userdetails`)

#### GET /authenticated/userdetails/client

**Description**: Retrieves the profile details for the authenticated client user.
**Authentication**: `verifyToken`
**Request**:

```
GET /authenticated/userdetails/client
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Client profile fetched successfully",
  "data": {
    "userId": "60c72b2f9f1b2c001c8e4d1e",
    "full_name": "jane doe",
    "email": "jane.doe@example.com",
    "userName": "janedoe",
    "isAdmin": false,
    "role": "client",
    "updatedAt": "2024-07-15T12:00:00.000Z",
    "createdAt": "2024-07-15T10:00:00.000Z",
    "image": "http://localhost:3001/images/images (2).png"
  }
}
```

**Errors**:

- `400 Bad Request`: You must be authenticated
- `404 Not Found`: User not found
- `403 Forbidden`: Not a client account
- `401 Unauthorized`: Access token missing

#### GET /authenticated/userdetails/driver

**Description**: Retrieves the profile details for the authenticated driver user.
**Authentication**: `verifyToken`
**Request**:

```
GET /authenticated/userdetails/driver
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Driver profile fetched successfully",
  "data": {
    "userId": "60c72b2f9f1b2c001c8e4d1e",
    "full_name": "john driver",
    "email": "john.driver@example.com",
    "userName": "johndriver",
    "role": "driver",
    "updatedAt": "2024-07-15T12:00:00.000Z",
    "image": "http://localhost:3001/images/vecteezy_driver-vector-icon-design_16425938.jpg",
    "address": "789 Pine Rd",
    "country": "Nigeria"
  }
}
```

**Errors**:

- `400 Bad Request`: You must be authenticated
- `404 Not Found`: User not found
- `403 Forbidden`: Not a driver account
- `401 Unauthorized`: Access token missing

#### DELETE /authenticated/userdetails/delete

**Description**: Deletes the authenticated user's account and associated data.
**Authentication**: `verifyToken`
**Request**:

```
DELETE /authenticated/userdetails/delete
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "All user data successfully deleted"
}
```

**Errors**:

- `400 Bad Request`: User ID is required
- `401 Unauthorized`: Access token missing

#### PUT /authenticated/userdetails/update-dp

**Description**: Updates the authenticated user's profile picture.
**Authentication**: `verifyToken`
**Request**: `multipart/form-data` with `profileImage` file.

```
File: profileImage (single image file)
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Profile updated successfully",
  "data": {
    "_id": "60c72b2f9f1b2c001c8e4d1e",
    "image": "https://res.cloudinary.com/your_cloud/image/upload/v123456789/user_dp/new_profile_pic_public_id.jpg",
    "publicId": "user_dp/new_profile_pic_public_id"
    // ... other user fields
  }
}
```

**Errors**:

- `401 Unauthorized`: Unauthorized
- `404 Not Found`: User not found, image not found
- `500 Internal Server Error`: Cloudinary upload error, etc.

#### Trip Routes (`/usertrips`)

#### POST /usertrips/trips

**Description**: Allows a client to request a trip booking with a specific driver.
**Authentication**: `verifyToken`
**Request**:

```json
{
  "driverId": "DXLABC123",
  "pickup": "123 Main St, City A",
  "destination": "789 Elm St, City B",
  "price": 75000,
  "tripDate": "2024-07-20T10:00:00Z"
}
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "your booking was successfullly created awaiting for trip approval thanks"
}
```

**Errors**:

- `400 Bad Request`: You must be authenticated, Driver ID is required, driver not found, Validation errors (e.g., `pickup is required`, `price must be a number`)
- `401 Unauthorized`: Access token missing

#### GET /usertrips/trips/accept/:tripId

**Description**: Allows a driver to accept a pending trip request.
**Authentication**: `verifyToken`
**Request**: `tripId` as URL parameter.

```
GET /usertrips/trips/accept/60c72b2f9f1b2c001c8e4d1k
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Trip accepted successfully",
  "data": {
    "trackingId": "TrP-2-3-a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
  }
}
```

**Errors**:

- `404 Not Found`: Trip not found
- `400 Bad Request`: Trip already processed, User applying not defined, driver not found
- `401 Unauthorized`: Access token missing (driver authentication implicit)

#### GET /usertrips/all_request

**Description**: Retrieves all pending trip requests for the authenticated driver.
**Authentication**: `verifyToken`
**Request**:

```
GET /usertrips/all_request
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Pending trips fetched successfully",
  "data": [
    {
      "_id": "60c72b2f9f1b2c001c8e4d1k",
      "userId": "60c72b2f9f1b2c001c8e4d1e",
      "driverId": "DXLABC123",
      "pickup": "123 Main St, City A",
      "destination": "789 Elm St, City B",
      "price": 75000,
      "tripDate": "2024-07-20T10:00:00.000Z",
      "status": "pending",
      "createdAt": "2024-07-15T12:30:00.000Z",
      "updatedAt": "2024-07-15T12:30:00.000Z"
    }
  ]
}
```

**Errors**:

- `401 Unauthorized`: Unauthorized
- `400 Bad Request`: This user is not registered as a driver

#### GET /usertrips/trips/reject/:tripId

**Description**: Allows a driver to reject a pending trip request.
**Authentication**: `verifyToken`
**Request**: `tripId` as URL parameter.

```
GET /usertrips/trips/reject/60c72b2f9f1b2c001c8e4d1k
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Trip rejected successfully",
  "data": {
    "_id": "60c72b2f9f1b2c001c8e4d1k",
    "status": "rejected"
    // ... other trip details
  }
}
```

**Errors**:

- `404 Not Found`: Trip not found
- `400 Bad Request`: Trip already processed, User applying not defined, Driver not found
- `401 Unauthorized`: Access token missing (driver authentication implicit)

#### GET /usertrips/all_trip/driver

**Description**: Retrieves the complete trip history for the authenticated driver.
**Authentication**: `verifyToken`, `allowRoles("driver")`
**Request**:

```
GET /usertrips/all_trip/driver
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Trip history fetched successfully",
  "data": [
    {
      "_id": "60c72b2f9f1b2c001c8e4d1m",
      "userId": "60c72b2f9f1b2c001c8e4d1e",
      "driverId": "DXLABC123",
      "pickup": "123 Main St, City A",
      "destination": "789 Elm St, City B",
      "price": 75000,
      "tripDate": "2024-07-20T10:00:00.000Z",
      "status": "completed",
      "trackingId": "TrP-2-3-a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
      "createdAt": "2024-07-15T12:30:00.000Z",
      "updatedAt": "2024-07-15T13:00:00.000Z"
    }
  ]
}
```

**Errors**:

- `400 Bad Request`: You must be authenticated, Driver not found
- `401 Unauthorized`, `403 Forbidden`: Driver access required

#### PUT /usertrips/trip/location

**Description**: Updates the authenticated driver's current geographic location.
**Authentication**: `verifyToken`, `allowRoles("driver")`
**Request**:

```json
{
  "lat": 6.5244,
  "lng": 3.3792
}
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Driver location updated"
}
```

**Errors**:

- `400 Bad Request`: Latitude and Longitude are required
- `401 Unauthorized`, `403 Forbidden`: Driver access required

#### POST /usertrips/trip/track

**Description**: Allows a client to retrieve a driver's live location using a trip tracking ID.
**Authentication**: `verifyToken`, `allowRoles("client")`
**Request**:

```json
{
  "trackingId": "TrP-2-3-a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
}
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Driver location fetched",
  "data": {
    "driverName": "John Driver",
    "phoneNumber": "08012345678",
    "truckType": "Heavy Duty Truck",
    "village": "Lekki",
    "coordinates": {
      "lat": 6.5244,
      "lng": 3.3792
    },
    "address": {
      "city": "Lagos",
      "state": "Lagos State",
      "country": "Nigeria"
    },
    "phonenumber": "08012345678"
  }
}
```

**Errors**:

- `400 Bad Request`: Tracking ID is required, Driver location not available
- `404 Not Found`: No trip found for this tracking ID
- `401 Unauthorized`, `403 Forbidden`: Client access required

#### POST /usertrips/trip/done

**Description**: Allows a client to mark an accepted trip as completed. Resets driver's status.
**Authentication**: `verifyToken`, `allowRoles("client")`
**Request**:

```json
{
  "trackingId": "TrP-2-3-a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
}
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Trip marked as completed and driver info reset"
}
```

**Errors**:

- `400 Bad Request`: Tracking ID is required
- `404 Not Found`: Trip not found, Driver not found for this trip
- `401 Unauthorized`, `403 Forbidden`: Client access required

#### GET /usertrips/all_trip/client

**Description**: Retrieves the complete trip history for the authenticated client user.
**Authentication**: `verifyToken`, `allowRoles("client")`
**Request**:

```
GET /usertrips/all_trip/client
```

**Response**:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Trip history fetched successfully",
  "data": [
    {
      "_id": "60c72b2f9f1b2c001c8e4d1n",
      "userId": "60c72b2f9f1b2c001c8e4d1e",
      "driverId": "DXLABC123",
      "pickup": "456 Oak Ave, City C",
      "destination": "101 Pine Ln, City D",
      "price": 60000,
      "tripDate": "2024-07-22T09:00:00.000Z",
      "status": "pending",
      "trackingId": null,
      "createdAt": "2024-07-15T14:00:00.000Z",
      "updatedAt": "2024-07-15T14:00:00.000Z"
    }
  ]
}
```

**Errors**:

- `400 Bad Request`: You must be authenticated
- `401 Unauthorized`, `403 Forbidden`: Client access required

## Technologies Used

| Technology          | Description                                            | Link                                                            |
| :------------------ | :----------------------------------------------------- | :-------------------------------------------------------------- |
| **TypeScript**      | Superset of JavaScript for type-safe development.      | [TypeScript](https://www.typescriptlang.org/)                   |
| **Node.js**         | JavaScript runtime for server-side execution.          | [Node.js](https://nodejs.org/en)                                |
| **Express.js**      | Fast, unopinionated web framework for Node.js.         | [Express.js](https://expressjs.com/)                            |
| **MongoDB**         | NoSQL database for flexible data storage.              | [MongoDB](https://www.mongodb.com/)                             |
| **Mongoose**        | MongoDB object data modeling (ODM) for Node.js.        | [Mongoose](https://mongoosejs.com/)                             |
| **Argon2**          | Password hashing function for secure authentication.   | [Argon2](https://github.com/P-H-C/phc-argon2)                   |
| **JSON Web Tokens** | Standard for securely transmitting information.        | [JWT](https://jwt.io/)                                          |
| **Redis**           | In-memory data store for caching and sessions.         | [Redis](https://redis.io/)                                      |
| **Socket.io**       | Real-time bidirectional event-based communication.     | [Socket.io](https://socket.io/)                                 |
| **Cloudinary**      | Cloud-based image and video management service.        | [Cloudinary](https://cloudinary.com/)                           |
| **Multer**          | Node.js middleware for handling `multipart/form-data`. | [Multer](https://github.com/expressjs/multer)                   |
| **Nodemailer**      | Module for sending emails from Node.js applications.   | [Nodemailer](https://nodemailer.com/about/)                     |
| **Joi**             | Powerful schema description and data validation.       | [Joi](https://joi.dev/)                                         |
| **CORS**            | Middleware to enable Cross-Origin Resource Sharing.    | [CORS](https://expressjs.com/en/resources/middleware/cors.html) |
| **Cookie-parser**   | Parse Cookie header and populate `req.cookies`.        | [Cookie-parser](https://www.npmjs.com/package/cookie-parser)    |

## License

This project is licensed under the ISC License.

## Author Info

**[Your Name Here]**

---

<p align="center">
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  </a>
  <a href="https://www.mongodb.com/">
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  </a>
  <a href="https://mongoosejs.com/">
    <img src="https://img.shields.io/badge/Mongoose-800000?style=for-the-badge&logo=mongoose&logoColor=white" alt="Mongoose">
  </a>
  <a href="https://redis.io/">
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
  </a>
  <a href="https://socket.io/">
    <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io">
  </a>
  <a href="https://cloudinary.com/">
    <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary">
  </a>
  <a href="https://jwt.io/">
    <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white" alt="JWT">
  </a>
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge" alt="Build Status">
</p>

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)

mvp target

TRANSPORT
Freight & Logistics Inefficiency
“My goods are stuck in Lagos”

Problem in simple terms:
Moving goods (like farm produce, products, or equipment) from one city to another is extremely frustrating in many developing countries. There’s no reliable way to find a truck, negotiate a fair price, or track the delivery. Many businesses lose customers because of delays or spoilage.

Testimony:
Emeka owns a small furniture factory in Aba. He got a big order from Abuja worth ₦2 million. The problem? He couldn’t find a trustworthy truck driver quickly. When he finally did, the driver overcharged and delayed the shipment by two weeks. His customer canceled the order, and Emeka lost the deal and also his reputation.

Solution:
Build a A freight marketplace platform would let Emeka log in, enter shipment details (e.g., size, destination), and instantly see available truck drivers, prices, ratings, and tracking options, just like how Bolt or Uber works for people.

Advantage: His goods would move faster, cheaper, and safer and his business would grow.






TRANSPORT
Freight & Logistics
“My goods are stuck in Lagos”

Problem in simple terms:
Moving goods (like farm produce, products, or equipment) from one city to another is extremely frustrating in many developing countries. There’s no reliable way to find a truck, negotiate a fair price, or track the delivery. Many businesses lose customers because of delays or spoilage.

Testimony:
Emeka owns a small furniture factory in Aba. He got a big order from Abuja worth ₦2 million. The problem? He couldn’t find a trustworthy truck driver quickly. When he finally did, the driver overcharged and delayed the shipment by two weeks. His customer canceled the order, and Emeka lost the deal and also his reputation.

Solution:
Build a A freight marketplace platform would let Emeka log in, enter shipment details (e.g., size, destination), and instantly see available truck drivers, prices, ratings, and tracking options, just like how Bolt or Uber works for people.

Advantage: His goods would move faster, cheaper, and safer and his business would grow.


frontend ==>next js
token ==> redis 
backend ==> express typescript
state manegment context api












