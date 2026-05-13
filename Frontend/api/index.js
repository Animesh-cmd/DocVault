import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with pooling for serverless
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI in environment');
  }

  const db = await mongoose.connect(mongoUri);
  cachedDb = db;
  return db;
}

// Document Schema
const documentSchema = new mongoose.Schema({
  referenceId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  pdfFile: {
    data: Buffer,
    contentType: String
  },
  createdAt: { type: Date, default: Date.now }
});

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit (Vercel has a 4.5MB limit on free tier anyway)
});

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Routes
app.get('/api/search/:referenceId', async (req, res) => {
  try {
    const { referenceId } = req.params;
    const document = await Document.findOne({ referenceId }, { 'pdfFile.data': 0 });

    if (document) {
      res.json({ success: true, document });
    } else {
      res.json({ success: false, message: 'Document does not exist' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const documents = await Document.find({}, { 'pdfFile.data': 0 }).sort({ createdAt: -1 });
    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/documents', upload.single('pdf'), async (req, res) => {
  try {
    const { referenceId, title, content } = req.body;
    
    if (!referenceId || !title || !content) {
      return res.status(400).json({ success: false, message: 'Reference ID, title, and content are required' });
    }
    
    const pdfFile = req.file ? {
      data: req.file.buffer,
      contentType: req.file.mimetype
    } : undefined;

    const newDocument = new Document({ referenceId, title, content, pdfFile });
    await newDocument.save();
    res.json({ success: true, message: 'Document added successfully' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Reference ID already exists' });
    } else {
      res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Document.findByIdAndDelete(id);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/documents/:id/pdf', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || !document.pdfFile || !document.pdfFile.data) {
      return res.status(404).send('PDF not found');
    }
    res.set('Content-Type', document.pdfFile.contentType);
    res.send(document.pdfFile.data);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  res.status(500).json({ success: false, message: `Internal server error: ${err.message}` });
});

export default app;
