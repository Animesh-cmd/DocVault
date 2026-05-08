# Document Management System

A full-stack application for managing and searching documents with PDF support.

## Features

- **Document Search**: Search documents by reference ID
- **Admin Panel**: Add, view, and delete documents
- **PDF Upload**: Upload and view PDF files
- **MongoDB Integration**: Persistent data storage
- **TypeScript**: Full TypeScript support
- **Responsive UI**: Modern React interface

## Tech Stack

### Frontend
- React 19
- TypeScript
- React Router
- Vite
- CSS3

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Multer (file uploads)
- CORS enabled

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### MongoDB Setup

#### Option 1: Local MongoDB
1. Install MongoDB on your system
2. Start MongoDB service:
   ```bash
   sudo systemctl start mongod  # Linux
   # or
   brew services start mongodb/brew/mongodb-community  # macOS
   ```

#### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get your connection string
3. Update the connection string in `Backend/src/server.js`:
   ```javascript
   mongoose.connect('your-mongodb-atlas-connection-string')
   ```

### Backend Setup

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make sure MongoDB is running locally on default port (27017), or update the connection string in `src/server.js`

4. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## Usage

### Document Search
- Visit the home page
- Enter a reference ID (e.g., DOC001)
- Click "Search" to find the document

### Admin Panel
- Click "Admin Panel" from the navigation
- Add new documents with title, content, and optional PDF
- View all existing documents
- Delete documents as needed

## API Endpoints

### Search
- `GET /api/search/:referenceId` - Search for a document by reference ID

### Admin Operations
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Add a new document (supports file upload)
- `PUT /api/documents/:id` - Update a document
- `DELETE /api/documents/:id` - Delete a document

## File Upload

PDF files are stored in the `Backend/uploads/` directory and served statically at `/uploads/` path.

## Development

### Building for Production

Frontend:
```bash
cd Frontend
npm run build
```

Backend is ready for production as-is (consider using PM2 for process management).

### TypeScript Compilation

```bash
cd Frontend
tsc -b
```

## Database

The application uses MongoDB with a `Document` schema containing:
- `referenceId` (unique string)
- `title` (string)
- `content` (string)
- `pdfPath` (optional string)
- `createdAt` (date)

## CORS

CORS is enabled on the backend to allow frontend requests from `http://localhost:5173`.