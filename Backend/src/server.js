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
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Missing MONGODB_URI in environment.');
} else {
  mongoose.connect(mongoUri)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
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

const Document = mongoose.model('Document', documentSchema);

// Multer configuration for file uploads using memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Search endpoint
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

// Get all documents (for admin panel)
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await Document.find({}, { 'pdfFile.data': 0 }).sort({ createdAt: -1 });
    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new document
app.post('/api/documents', upload.single('pdf'), async (req, res) => {
  try {
    const { referenceId, title, content } = req.body;
    
    // Validate required fields
    if (!referenceId || !title || !content) {
      console.log('Missing required fields:', { referenceId, title, content });
      return res.status(400).json({ success: false, message: 'Reference ID, title, and content are required' });
    }
    
    const pdfFile = req.file ? {
      data: req.file.buffer,
      contentType: req.file.mimetype
    } : undefined;

    const newDocument = new Document({
      referenceId,
      title,
      content,
      pdfFile
    });

    await newDocument.save();
    console.log('Document added successfully:', referenceId);
    res.json({ success: true, message: 'Document added successfully' });
  } catch (error) {
    console.error('Error adding document:', error.message);
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Reference ID already exists' });
    } else {
      res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
  }
});

// Update document
app.put('/api/documents/:id', upload.single('pdf'), async (req, res) => {
  try {
    const { id } = req.params;
    const { referenceId, title, content } = req.body;

    const document = await Document.findById(id);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    const updateData = { referenceId, title, content };
    if (req.file) {
      updateData.pdfFile = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

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

// Serve PDF endpoint
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File is too large. Maximum size is 15MB.' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  
  res.status(500).json({ success: false, message: `Internal server error: ${err.message}` });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});