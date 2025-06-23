#!/bin/bash

# Install dependencies for the root project
npm install

# Install dependencies and build the backend
cd backend
npm install
cd ..

# Install dependencies and build the frontend
cd frontend
npm install
CI=false npm run build
cd ..

echo "Build process completed successfully!"