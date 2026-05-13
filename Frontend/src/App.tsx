import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import API_BASE_URL from './config.js'
import './App.css'

const ApiContext = createContext<{ apiUrl: string; setApiUrl: (url: string) => void }>({
  apiUrl: API_BASE_URL,
  setApiUrl: () => {}
});

function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { apiUrl, setApiUrl } = useContext(ApiContext);
  const [tempUrl, setTempUrl] = useState(apiUrl);
  const [testStatus, setTestStatus] = useState<string>('');

  const handleTest = async () => {
    try {
      setTestStatus('Testing...');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${tempUrl}/api/documents`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (response.ok) {
        setTestStatus('✅ Connection successful!');
      } else {
        setTestStatus(`❌ Server error (${response.status})`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setTestStatus('❌ Connection timeout - check if backend is running');
      } else {
        setTestStatus('❌ Cannot connect to server');
      }
    }
  };

  const handleSave = () => {
    if (tempUrl.trim()) {
      setApiUrl(tempUrl);
      localStorage.setItem('apiUrl', tempUrl);
      console.log('API URL saved:', tempUrl);
      onClose();
    }
  };

  const handleReset = () => {
    localStorage.removeItem('apiUrl');
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>API Settings</h2>
        <p className="info-text">Current API URL: <code>{apiUrl}</code></p>
        <p>Backend is automatically detected. Change only if needed:</p>
        <input
          type="text"
          placeholder="http://localhost:3000 or http://your-ip:3000"
          value={tempUrl}
          onChange={(e) => setTempUrl(e.target.value)}
          className="settings-input"
        />
        <div className="modal-buttons">
          <button onClick={handleTest} className="test-btn">Test Connection</button>
          <button onClick={handleSave} className="save-btn">Save</button>
          <button onClick={handleReset} className="reset-btn">Reset to Default</button>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
        </div>
        {testStatus && <p className={testStatus.includes('✅') ? 'success' : 'error'}>{testStatus}</p>}
      </div>
    </div>
  );
}

function useApi() {
  return useContext(ApiContext);
}
interface Document {
  _id?: string;
  referenceId: string;
  title: string;
  content: string;
  pdfFile?: { contentType: string };
  createdAt: string;
}

function SearchPage() {
  const { apiUrl } = useApi();
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
      setError(`Failed to fetch document: ${err instanceof Error ? err.message : 'Unknown error'}. Check API settings (⚙️)`);
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
  const { apiUrl } = useApi();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [formData, setFormData] = useState({
    referenceId: '',
    title: '',
    content: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);

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
        setMessage(`Failed to connect to API. Please check your network and API URL (⚙️). Currently using: ${apiUrl}`);
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
        <button onClick={() => setShowSettings(true)} className="settings-btn" title="Configure API">⚙️</button>
      </nav>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

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

function AppWrapper() {
  const [apiUrl, setApiUrl] = useState<string>(() => {
    const savedUrl = localStorage.getItem('apiUrl');
    
    // Check if saved URL is an IP address while we are on localhost
    // This often happens when switching networks
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSavedUrlIP = savedUrl && /http:\/\/\d+\.\d+\.\d+\.\d+/.test(savedUrl);
    
    if (isLocal && isSavedUrlIP && !savedUrl.includes('localhost') && !savedUrl.includes('127.0.0.1')) {
      console.warn('Removing potentially stale IP API URL from localStorage:', savedUrl);
      localStorage.removeItem('apiUrl');
      return API_BASE_URL;
    }
    
    const url = savedUrl || API_BASE_URL;
    return url;
  });

  return (
    <ApiContext.Provider value={{ apiUrl, setApiUrl }}>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </ApiContext.Provider>
  );
}

export default AppWrapper
