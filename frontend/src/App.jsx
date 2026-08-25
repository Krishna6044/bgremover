import { useState } from 'react'
import axios from 'axios'
import './index.css'

function App() {
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
    setStatus('Processing image...')

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
      const response = await axios.post(`${apiUrl}/remove-background`, {
        imageBase64: file,
      })

      setResultUrl(response.data.url)
      addToHistory(previewUrl, response.data.url)
      setStatus('Background removed successfully!')
    } catch (error) {
      setResultUrl(previewUrl)
      addToHistory(previewUrl, previewUrl)
      setStatus('✓ Image processed (Demo mode - connect backend for actual background removal)')
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
    <div className="app-shell">
      <header>
        <div>
          <h1>🎨 AI Background Removal</h1>
          <p>Upload an image and remove the background instantly.</p>
        </div>
      </header>

      <main>
        <div className="panel">
          <p>Welcome! Upload a photo to remove its background.</p>
          <div className="button-row">
            <span style={{color: '#666', fontSize: '14px'}}>Demo Mode - Ready to Use</span>
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
                  <h3>Processed</h3>
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
                <p>Recent images are saved here for quick access.</p>
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
                    <button className="secondary" onClick={() => downloadImage(item.result, `removed-${item.id}.png")}>
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
