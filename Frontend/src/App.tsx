import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import API_BASE_URL from './config.js'
import './App.css'

interface Document {
  _id?: string;
  referenceId: string;
  title: string;
  content: string;
  pdfFile?: { contentType: string };
  createdAt: string;
}

function SearchPage() {
  const apiUrl = API_BASE_URL;
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
      console.log('Searching with API:', apiUrl);
      const response = await fetch(`${apiUrl}/api/search/${referenceId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setDocument(data.document);
      } else {
        setError(data.message || 'Document not found');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(`Failed to fetch document: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
          {document.pdfFile && (
            <p><a href={`${apiUrl}/api/documents/${document._id}/pdf`} target="_blank" rel="noopener noreferrer">View PDF</a></p>
          )}
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const apiUrl = API_BASE_URL;
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
      console.log('Fetching documents from:', apiUrl);
      const response = await fetch(`${apiUrl}/api/documents`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
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

    if (!formData.referenceId || !formData.title || !formData.content) {
      setMessage('Please fill in all required fields (Reference ID, Title, Content)');
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('referenceId', formData.referenceId);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    if (pdfFile) {
      formDataToSend.append('pdf', pdfFile);
    }

    try {
      console.log('Sending to API:', apiUrl, formData);
      const response = await fetch(`${apiUrl}/api/documents`, {
        method: 'POST',
        body: formDataToSend
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const data = await response.json();
          if (data.message) errorMessage = data.message;
        } catch (e) {
          // Response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Response:', data);

      if (data.success) {
        setMessage('Document added successfully!');
        setFormData({ referenceId: '', title: '', content: '' });
        setPdfFile(null);
        fetchDocuments();
      } else {
        setMessage(data.message || 'Failed to add document');
      }
    } catch (error) {
      console.error('Full error object:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage === 'Failed to fetch') {
        setMessage(`Failed to connect to API. Please ensure the backend is running at ${apiUrl}`);
      } else {
        setMessage(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`${apiUrl}/api/documents/${id}`, {
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
    console.log('AdminPanel mounted with API URL:', apiUrl);
    fetchDocuments();
  }, [apiUrl]);

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
