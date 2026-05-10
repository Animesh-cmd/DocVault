import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Missing MONGODB_URI in environment. Check Backend/.env and dotenv path.');
} else {
  mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Document Schema
const documentSchema = new mongoose.Schema({
  referenceId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  pdfPath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Document = mongoose.model('Document', documentSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Search endpoint
app.get('/api/search/:referenceId', async (req, res) => {
  try {
    const { referenceId } = req.params;
    const document = await Document.findOne({ referenceId });

    if (document) {
      res.json({ success: true, document });
    } else {
      res.json({ success: false, message: 'Document does not exist' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all documents (for admin panel)
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new document
app.post('/api/documents', upload.single('pdf'), async (req, res) => {
  try {
    const { referenceId, title, content } = req.body;
    const pdfPath = req.file ? `/uploads/${req.file.filename}` : null;

    const newDocument = new Document({
      referenceId,
      title,
      content,
      pdfPath
    });

    await newDocument.save();
    res.json({ success: true, message: 'Document added successfully' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Reference ID already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
});

// Update document
app.put('/api/documents/:id', upload.single('pdf'), async (req, res) => {
  try {
    const { id } = req.params;
    const { referenceId, title, content } = req.body;
    const pdfPath = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updateData = { referenceId, title, content };
    if (pdfPath) updateData.pdfPath = pdfPath;

    await Document.findByIdAndUpdate(id, updateData);
    res.json({ success: true, message: 'Document updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete document
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Document.findByIdAndDelete(id);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});