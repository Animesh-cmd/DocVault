import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import './App.css'

interface Document {
  _id?: string;
  referenceId: string;
  title: string;
  content: string;
  pdfPath?: string;
  createdAt: string;
}

function SearchPage() {
  const [referenceId, setReferenceId] = useState<string>('');
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    if (!referenceId.trim()) {
      setError('Please enter a reference ID');
      return;
    }

    setLoading(true);
    setError('');
    setDocument(null);

    try {
      const response = await fetch(`http://localhost:3000/api/search/${referenceId}`);
      const data = await response.json();

      if (data.success) {
        setDocument(data.document);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <h1>Document Search</h1>
        <Link to="/admin" className="admin-link">Admin Panel</Link>
      </nav>
      <div className="search-container">
        <input
          type="text"
          placeholder="Enter Reference ID (e.g., DOC001)"
          value={referenceId}
          onChange={(e) => setReferenceId(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} disabled={loading} className="search-button">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {document && (
        <div className="document">
          <h2>{document.title}</h2>
          <p><strong>Reference ID:</strong> {document.referenceId}</p>
          <p><strong>Created At:</strong> {document.createdAt}</p>
          <p><strong>Content:</strong></p>
          <p>{document.content}</p>
          {document.pdfPath && (
            <p><a href={`http://localhost:3000${document.pdfPath}`} target="_blank" rel="noopener noreferrer">View PDF</a></p>
          )}
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [formData, setFormData] = useState({
    referenceId: '',
    title: '',
    content: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/documents');
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formDataToSend = new FormData();
    formDataToSend.append('referenceId', formData.referenceId);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    if (pdfFile) {
      formDataToSend.append('pdf', pdfFile);
    }

    try {
      const response = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formDataToSend
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Document added successfully!');
        setFormData({ referenceId: '', title: '', content: '' });
        setPdfFile(null);
        fetchDocuments();
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('Failed to add document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/documents/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Document deleted successfully!');
        fetchDocuments();
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('Failed to delete document');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="back-link">← Back to Search</Link>
        <h1>Admin Panel</h1>
      </nav>

      <div className="admin-container">
        <div className="add-document">
          <h2>Add New Document</h2>
          <form onSubmit={handleSubmit} className="document-form">
            <input
              type="text"
              placeholder="Reference ID"
              value={formData.referenceId}
              onChange={(e) => setFormData({...formData, referenceId: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
            <textarea
              placeholder="Content"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
            />
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Document'}
            </button>
          </form>
          {message && <p className={message.includes('success') ? 'success' : 'error'}>{message}</p>}
        </div>

        <div className="documents-list">
          <h2>All Documents</h2>
          {documents.length === 0 ? (
            <p>No documents found.</p>
          ) : (
            documents.map((doc) => (
              <div key={doc._id} className="document-item">
                <h3>{doc.title}</h3>
                <p><strong>ID:</strong> {doc.referenceId}</p>
                <p><strong>Created:</strong> {doc.createdAt}</p>
                <button onClick={() => handleDelete(doc._id!)} className="delete-btn">Delete</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}

export default App
