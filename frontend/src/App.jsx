import { useState } from 'react'
import axios from 'axios'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from '@clerk/clerk-react'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const isClerkKeyPlaceholder = !clerkPubKey || clerkPubKey.includes('your_clerk_publishable_key')

function SignedInApp() {
  const { user } = useUser()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(true)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileChange = (event) => {
    setResultUrl('')
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    const reader = new FileReader()
    reader.onload = () => {
      setFile(reader.result)
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(selectedFile)
  }

  const addToHistory = (original, result) => {
    setHistory((prevHistory) => [
      {
        id: Date.now(),
        original,
        result,
        createdAt: new Date().toLocaleString(),
      },
      ...prevHistory.slice(0, 8),
    ])
  }

  const clearHistory = () => {
    setHistory([])
  }

  const removeBackground = async () => {
    if (!file) {
      setStatus('Please choose an image first.')
      return
    }

    setLoading(true)
    setStatus('Removing background...')

    try {
      const response = await axios.post(`${apiUrl}/remove-background`, {
        imageBase64: file,
        email: user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress,
      })

      setResultUrl(response.data.url)
      addToHistory(previewUrl, response.data.url)
      setStatus('Background removed successfully!')
    } catch (error) {
      setStatus(error.response?.data?.error || error.message)
    }

    setLoading(false)
  }

  const downloadImage = async (url, filename = 'removed-background.png') => {
    if (!url) return

    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Download failed:', error)
      setStatus('Download failed. Please try again.')
    }
  }

  const downloadResult = () => downloadImage(resultUrl)

  const clearSelection = () => {
    setFile(null)
    setPreviewUrl('')
    setResultUrl('')
    setStatus('')
  }

  return (
    <div>
      <div className="panel">
        <h2>Welcome, {user.firstName || user.fullName || 'Creator'}</h2>
        <p>Upload a photo, remove its background, and save the result.</p>
        <div className="button-row">
          <UserButton />
        </div>
      </div>

      <div className="panel">
        <label className="file-label">
          Choose an image to remove the background
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>

        {previewUrl && (
          <div className="image-grid">
            <div>
              <h3>Original</h3>
              <img src={previewUrl} alt="Original preview" />
            </div>
            {resultUrl && (
              <div>
                <h3>Background removed</h3>
                <img src={resultUrl} alt="Processed result" />
                <div className="result-footer">
                  <button className="secondary" onClick={downloadResult}>
                    Download Result
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="button-row">
          <button onClick={removeBackground} disabled={loading || !file}>
            {loading ? 'Processing…' : 'Remove Background'}
          </button>
          {previewUrl && (
            <button className="secondary" onClick={clearSelection}>
              Clear Image
            </button>
          )}
        </div>
        {history.length > 0 && (
          <div className="button-row">
            <button className="secondary" onClick={() => setShowHistory((prev) => !prev)}>
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>
        )}
        <p className="status">{status}</p>
      </div>

      {history.length > 0 && showHistory && (
        <div className="panel history-panel">
          <div className="history-header">
            <div>
              <h2>History</h2>
              <p>Recent background removals are saved here for quick access.</p>
            </div>
            <button className="secondary" onClick={clearHistory}>
              Clear History
            </button>
          </div>
          <div className="history-grid">
            {history.map((item) => (
              <div className="history-card" key={item.id}>
                <div className="history-image-row">
                  <div>
                    <h4>Original</h4>
                    <img src={item.original} alt="History original" />
                  </div>
                  <div>
                    <h4>Result</h4>
                    <img src={item.result} alt="History result" />
                  </div>
                </div>
                <div className="history-meta">
                  <span>{item.createdAt}</span>
                  <button className="secondary" onClick={() => downloadImage(item.result, `removed-${item.id}.png`)}>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  if (isClerkKeyPlaceholder) {
    return (
      <div className="app-shell">
        <div className="panel">
          <h1>AI Background Removal SaaS</h1>
          <p>
            Clerk is not configured yet. Open <code>frontend/.env</code> and set
            <code>VITE_CLERK_PUBLISHABLE_KEY</code> to your Clerk publishable key.
          </p>
          <p>
            Then restart the frontend with <code>npm run dev</code>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <div className="app-shell">
        <header>
          <div>
            <h1>AI Background Removal SaaS</h1>
            <p>Sign in, upload an image, and remove the background instantly.</p>
          </div>
        </header>

        <main>
          <SignedIn>
            <SignedInApp />
          </SignedIn>

          <SignedOut>
            <div className="panel">
              <h2>Get started</h2>
              <p>Create an account to launch the background removal workflow.</p>
              <div className="button-row">
                <SignInButton>
                  <button>Sign In</button>
                </SignInButton>
                <SignUpButton>
                  <button>Sign Up</button>
                </SignUpButton>
              </div>
            </div>
          </SignedOut>
        </main>
      </div>
    </ClerkProvider>
  )
}

export default App
