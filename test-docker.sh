#!/bin/bash

# Exit on error
set -e

echo "Testing Docker setup for Agricoventas..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
else
    echo "✅ Docker is installed."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
else
    echo "✅ Docker Compose is installed."
fi

# Check if Docker is running
docker info > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
else
    echo "✅ Docker is running."
fi

# Check if containers are running
echo "Checking if containers are running..."
FRONTEND_RUNNING=$(docker ps --filter "name=agricoventas-frontend" --format "{{.Names}}" | grep "agricoventas-frontend" || true)
BACKEND_RUNNING=$(docker ps --filter "name=agricoventas-backend" --format "{{.Names}}" | grep "agricoventas-backend" || true)
MONGODB_RUNNING=$(docker ps --filter "name=agricoventas-mongodb" --format "{{.Names}}" | grep "agricoventas-mongodb" || true)

if [ -z "$FRONTEND_RUNNING" ]; then
    echo "❌ Frontend container is not running."
else
    echo "✅ Frontend container is running."
fi

if [ -z "$BACKEND_RUNNING" ]; then
    echo "❌ Backend container is not running."
else
    echo "✅ Backend container is running."
fi

if [ -z "$MONGODB_RUNNING" ]; then
    echo "❌ MongoDB container is not running."
else
    echo "✅ MongoDB container is running."
fi

# Test frontend connectivity
echo "Testing frontend connectivity..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ] || [ "$FRONTEND_RESPONSE" = "304" ]; then
    echo "✅ Frontend is accessible at http://localhost"
else
    echo "❌ Frontend is not accessible. HTTP response code: $FRONTEND_RESPONSE"
fi

# Test backend connectivity
echo "Testing backend connectivity..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$BACKEND_RESPONSE" = "200" ] || [ "$BACKEND_RESPONSE" = "304" ]; then
    echo "✅ Backend API is accessible at http://localhost:3000"
else
    echo "❌ Backend API is not accessible. HTTP response code: $BACKEND_RESPONSE"
fi

# Test database connectivity (indirectly through backend)
echo "Testing database connectivity through backend..."
BACKEND_DB_RESPONSE=$(curl -s http://localhost:3000 || echo "{}")
if [[ "$BACKEND_DB_RESPONSE" == *"Agricoventas"* ]]; then
    echo "✅ Backend can communicate with the database."
else
    echo "❌ Backend may not be able to communicate with the database."
fi

echo "Docker setup test completed." 