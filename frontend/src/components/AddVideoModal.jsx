import { useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import { api } from '../api'

export default function AddVideoModal({ open, onClose, onAdded }) {
  const [url, setUrl] = useState('')
  const [extractRecipe, setExtractRecipe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const video = await api.downloadVideo(url, extractRecipe)
      onAdded?.(video)
      setUrl('')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Download Video</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-neutral-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-neutral-400 mb-2">Instagram / Video URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              required
              disabled={loading}
            />
          </div>

          <label className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => setExtractRecipe(!extractRecipe)}>
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              extractRecipe ? 'bg-purple-600 border-purple-600' : 'border-neutral-600'
            }`}>
              {extractRecipe && <span className="text-white text-xs">✓</span>}
            </div>
            <span className="text-sm text-neutral-300">Extract recipe from caption</span>
          </label>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl accent-gradient text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} />
                Download
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
