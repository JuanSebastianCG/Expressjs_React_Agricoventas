# Agricoventas

A full-stack application for agricultural management and sales tracking.

## Project Structure

The project is organized into two main parts:

- **Backend**: Node.js with Express and TypeScript, using MongoDB as the database
- **Frontend**: React with TypeScript, built with Vite

## Development Setup

### Prerequisites

- Node.js (v18 or newer)
- MongoDB (local or remote)
- Docker and Docker Compose (optional)

### Environment Setup

1. Clone the repository
2. Setup backend environment:
   ```bash
   cd backend
   npm install
   ```
3. Setup frontend environment:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

#### Using npm scripts

**Backend**:
```bash
cd backend
npm run dev
```

**Frontend**:
```bash
cd frontend
npm run dev
```

#### Using Docker

```bash
docker-compose up
```

## Project Configuration

### Backend

- TypeScript configuration in `tsconfig.json`
- ESLint and Prettier for code quality
- MongoDB connection via Mongoose
- Authentication using JWT
- API routes with Express

### Frontend

- React with TypeScript
- Vite for fast development and optimized builds
- ESLint and Prettier for code quality
- React Router for navigation
- Path aliases for clean imports

## API Endpoints

- `POST /api/users/register`: Register a new user
- `POST /api/users/login`: Login user
- `GET /api/users/profile`: Get user profile (protected)

## Docker Configuration

The project includes Docker configuration for development and production environments:

- `docker-compose.yml`: Defines services for backend, frontend, and MongoDB
- `backend/Dockerfile`: Configuration for the Node.js backend
- `frontend/Dockerfile`: Configuration for the React frontend

## License

ISC 