# Robust User Authentication & Profile API 🔐

## Overview

This User Service API is a robust backend solution built with **Fastify**, **TypeScript**, and **Prisma ORM**, designed to manage user authentication, registration, and profile settings. It provides a secure and efficient foundation for user-centric applications, leveraging **PostgreSQL** for data persistence.

## Features

- **User Authentication**: Secure user registration and login mechanisms using JWT.
- **User Profile Management**: Endpoints to retrieve and update authenticated user details and preferences.
- **Data Persistence**: Efficient data storage and retrieval via **PostgreSQL** managed by **Prisma ORM**.
- **API Documentation**: Self-documenting API with integrated **Swagger/OpenAPI** for easy exploration and testing.
- **Containerization**: Includes a **Dockerfile** for seamless deployment and consistent environments using Docker.
- **Password Security**: Passwords are securely hashed using `bcryptjs` before storage.

## Getting Started

To get this service up and running on your local machine, follow these steps.

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/lexizuchenna/group-11-microservice.git
    cd group-11-microservice/user-service
    ```
2.  **Install Dependencies**:
    This project uses `pnpm` as its package manager.
    ```bash
    pnpm install
    ```
3.  **Set up Prisma**:
    Generate the Prisma client based on your schema.
    ```bash
    pnpm prisma generate
    ```
    If you have database migrations, you might run them (though this project seems to define schema directly).
    ```bash
    pnpm prisma migrate dev --name init
    ```
4.  **Build the Project**:
    Compile the TypeScript code into JavaScript.
    ```bash
    pnpm build
    ```

### Environment Variables

Create a `.env` file in the root of the project with the following variables:

```
PORT=3000
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your_jwt_secret_key_here"
```

- `PORT`: The port on which the Fastify server will listen (e.g., `3000`).
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: A strong secret key used for signing and verifying JWT tokens.

### Running the Project

- **Development Mode (with hot-reloading)**:
  ```bash
  pnpm dev
  ```
- **Production Mode**:
  `bash
    pnpm start
    `
  The API documentation will be available at `http://localhost:3000/docs` once the server is running.

## API Documentation

The API follows a RESTful design, providing endpoints for user authentication and profile management.

### Base URL

`http://localhost:3000/api/v1`

### Endpoints

#### POST /auth/register

Registers a new user account.

**Request**:

```json
{
  "name": "Alexander",
  "email": "mail@example.com",
  "password": "StrongPassword123",
  "push_token": "optional_push_notification_token"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "user_id": "cd672647-5924-4b7b-8e1e-57f5b624426c",
    "name": "Alexander",
    "email": "mail@example.com",
    "push_token": null,
    "preferences": {
      "push": false,
      "email": true
    },
    "created_at": "2025-11-11T18:45:42.261Z"
  },
  "message": "User successfully created",
  "meta": {
    "total": 1,
    "limit": 0,
    "page": 0,
    "total_pages": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

**Errors**:

- `401 Bad Request`:
  - `Missing fields`: "Name, Email and Password fields are required"
  - `Invalid Email`: "The email address entered is not valid"
  - `Duplicate data`: "User already exists with the provided email"
- `500 Internal Server Error`: "Something went wrong in the server"

#### POST /auth/login

Authenticates a user and returns a JWT token for subsequent requests.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "user_id": "bc8815d2-66e7-4054-850e-2464dfd447d8",
    "name": "Alexander",
    "email": "lexizuchenna@gmail.com",
    "push_token": "zzzzzz",
    "preferences": {
      "push": true,
      "email": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYmM4ODE1ZDItNjZlNy00MDU0LTg1MGUtMjQ2NGRmQTVkNCIsImlhdCI6MTYzNjQ2NDk2MCwiZXhwIjoxNjM3MDY5NzYwfQ.somehash"
  },
  "message": "User successfully logged in",
  "meta": {
    "total": 1,
    "limit": 0,
    "page": 0,
    "total_pages": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

**Errors**:

- `401 Unauthorized`:
  - `Missing fields`: "Email and Password fields are required"
  - `Invalid Email`: "The email address entered is not valid"
  - `Invalid user`: "No user with specified email found"
  - `Invalid password`: "Password does not match, try again"
- `500 Internal Server Error`: "Something went wrong in the server"

#### GET /user/me

Retrieves the details of the authenticated user. This endpoint requires a Bearer token.

**Request**:
_No body required._
_Header:_ `Authorization: Bearer <JWT_TOKEN>`

**Response**:

```json
{
  "success": true,
  "data": {
    "user_id": "bc8815d2-66e7-4054-850e-2464dfd447d8",
    "name": "Alexander",
    "email": "lexizuchenna@gmail.com",
    "push_token": "zzzzzz",
    "preferences": {
      "push": true,
      "email": true
    },
    "created_at": "2025-11-11T06:26:48.860Z"
  },
  "message": "User successfully retrieved",
  "meta": {
    "total": 1,
    "limit": 0,
    "page": 0,
    "total_pages": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

**Errors**:

- `401 Unauthorized`:
  - `Invalid Token`: "Authentication token not found"
  - `Invalid Token`: "Invalid authentication token"
  - `Token Expired`: "Authentication token has expired"
  - `Unauthorized`: "Authentication failed"
- `500 Internal Server Error`: "Something went wrong in the server"

#### POST /user/update_preference

Updates the notification preferences for the authenticated user. This endpoint requires a Bearer token.

**Request**:
_Header:_ `Authorization: Bearer <JWT_TOKEN>`

```json
{
  "preferences": {
    "email": true,
    "push": false
  },
  "push_token": "new_or_updated_push_token"
}
```

_Note: `push_token` is required if `preferences.push` is set to `true`._

**Response**:

```json
{
  "success": true,
  "data": {
    "preferences": {
      "email": true,
      "push": true
    },
    "push_token": "zzzzzz"
  },
  "message": "User preference successfully updated",
  "meta": {
    "total": 1,
    "limit": 0,
    "page": 0,
    "total_pages": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

**Errors**:

- `400 Bad Request`:
  - `Bad request`: "Cannot update user without the preference object"
  - `Bad request`: "Cannot update set push notifications without a push token"
- `401 Unauthorized`:
  - `Invalid Token`: "Authentication token not found"
  - `Invalid Token`: "Invalid authentication token"
  - `Token Expired`: "Authentication token has expired"
  - `Unauthorized`: "Authentication failed"
- `500 Internal Server Error`: "Something went wrong in the server"

## Technologies Used

This project leverages a modern stack for building scalable and efficient backend services.

| Technology         | Description                                                               | Link                                                                                 |
| :----------------- | :------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- |
| Node.js            | JavaScript runtime environment                                            | [nodejs.org](https://nodejs.org/)                                                    |
| Fastify            | Fast and low-overhead web framework for Node.js                           | [fastify.dev](https://www.fastify.dev/)                                              |
| TypeScript         | Superset of JavaScript with static typing                                 | [typescriptlang.org](https://www.typescriptlang.org/)                                |
| Prisma ORM         | Next-generation ORM for Node.js and TypeScript                            | [prisma.io](https://www.prisma.io/)                                                  |
| PostgreSQL         | Powerful, open-source relational database                                 | [postgresql.org](https://www.postgresql.org/)                                        |
| `@fastify/jwt`     | JWT plugin for Fastify                                                    | [npmjs.com/package/@fastify/jwt](https://www.npmjs.com/package/@fastify/jwt)         |
| `@fastify/swagger` | OpenAPI/Swagger integration for Fastify                                   | [npmjs.com/package/@fastify/swagger](https://www.npmjs.com/package/@fastify/swagger) |
| `bcryptjs`         | Library for hashing passwords                                             | [npmjs.com/package/bcryptjs](https://www.npmjs.com/package/bcryptjs)                 |
| Docker             | Platform for developing, shipping, and running applications in containers | [docker.com](https://www.docker.com/)                                                |
| pnpm               | Fast, disk space efficient package manager                                | [pnpm.io](https://pnpm.io/)                                                          |

## Contributing

We welcome contributions to enhance this project! If you're interested in improving the User Service API, please follow these guidelines:

✨ **Fork the Repository**: Start by forking the project to your GitHub account.

🌿 **Create a New Branch**: For each new feature or bug fix, create a dedicated branch. Use descriptive names like `feat/add-user-preferences` or `fix/jwt-expiration-handling`.

💻 **Develop and Test**: Implement your changes and ensure all existing tests pass, and new tests are added for your specific feature or fix.

💬 **Commit Your Changes**: Write clear, concise commit messages that explain your changes.

⬆️ **Push and Pull Request**: Push your branch to your forked repository and open a pull request against the `main` branch of the original repository. Provide a detailed description of your changes in the PR.

🤝 **Code Review**: Be open to feedback and suggestions during the code review process.

## License

This project is licensed under the MIT License.

## Author Info

**Your Name Here**

- LinkedIn: [Your LinkedIn Profile](https://linkedin.com/in/yourusername)
- Twitter: [Your Twitter Handle](https://twitter.com/yourusername)
- Portfolio: [Your Portfolio Website](https://yourportfolio.com)

---

[![Fastify](https://img.shields.io/badge/Framework-Fastify-blue?style=flat-square&logo=fastify)](https://www.fastify.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-darkblue?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Containerization-Docker-blue?style=flat-square&logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)
