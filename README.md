# Excel Analytics Platform

A MERN stack application for analyzing Excel data with user authentication and dashboard visualization.

## Project Structure

```
Excel Analytics Platform/
├── backend/                # Node.js and Express.js server
│   ├── middleware/         # Authentication middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── .env                # Environment variables
│   ├── package.json        # Backend dependencies
│   └── server.js           # Express server setup
├── frontend/               # React.js client
│   ├── public/             # Static files
│   ├── src/                # React source code
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   ├── utils/          # Utility functions
│   │   ├── App.js          # Main App component
│   │   └── index.js        # React entry point
│   └── package.json        # Frontend dependencies
└── README.md               # Project documentation
```

## Features

- User Authentication (Register, Login, JWT)
- Role-based Authorization (User, Admin)
- Dashboard with Analytics
- Excel File Upload and Processing
- Data Visualization

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository

2. Install backend dependencies
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```
   cd frontend
   npm install
   ```

4. Set up environment variables
   - Create a `.env` file in the backend directory
   - Add the following variables:
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/excel_analytics
     JWT_SECRET=your_jwt_secret_key_here
     NODE_ENV=development
     ```

### Running the Application

1. Start the backend server
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend development server
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get token

### Dashboard
- `GET /api/dashboard` - Get user dashboard data
- `GET /api/dashboard/admin` - Get admin dashboard data (admin only)

## License

This project is licensed under the MIT License.