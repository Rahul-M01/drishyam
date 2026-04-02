import { useState } from 'react'
import { X, Globe, PenLine, Loader2 } from 'lucide-react'
import { api } from '../api'

export default function AddRecipeModal({ open, onClose, onAdded }) {
  const [mode, setMode] = useState('scrape') // 'scrape' or 'manual'
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [manual, setManual] = useState({
    title: '', description: '', ingredients: '', instructions: '',
    cuisine: '', cookTime: '', servings: '', source: '', imageUrl: ''
  })

  if (!open) return null

  const handleScrape = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const recipe = await api.scrapeRecipe(url)
      onAdded?.(recipe)
      setUrl('')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleManual = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const recipe = await api.createRecipe({ ...manual, source: manual.source || 'Manual' })
      onAdded?.(recipe)
      setManual({ title: '', description: '', ingredients: '', instructions: '', cuisine: '', cookTime: '', servings: '', source: '', imageUrl: '' })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Add Recipe</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-neutral-400">
            <X size={18} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl bg-white/5">
          <button
            onClick={() => setMode('scrape')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'scrape' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe size={14} /> From Website
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'manual' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <PenLine size={14} /> Manual
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {mode === 'scrape' ? (
          <form onSubmit={handleScrape}>
            <div className="mb-5">
              <label className="block text-sm text-neutral-400 mb-2">Recipe URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.allrecipes.com/recipe/..."
                className={inputClass}
                required
                disabled={loading}
              />
              <p className="text-xs text-neutral-600 mt-2">
                Works best with recipe sites that use structured data (AllRecipes, Food Network, etc.)
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl accent-gradient text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Scraping...</> : <><Globe size={16} /> Scrape Recipe</>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleManual}>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Title *</label>
                <input value={manual.title} onChange={(e) => setManual({...manual, title: e.target.value})} className={inputClass} required placeholder="Recipe name" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Description</label>
                <textarea value={manual.description} onChange={(e) => setManual({...manual, description: e.target.value})} className={inputClass + " resize-none h-20"} placeholder="Short description" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Cuisine</label>
                  <input value={manual.cuisine} onChange={(e) => setManual({...manual, cuisine: e.target.value})} className={inputClass} placeholder="Indian" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Cook Time</label>
                  <input value={manual.cookTime} onChange={(e) => setManual({...manual, cookTime: e.target.value})} className={inputClass} placeholder="30 min" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Servings</label>
                  <input value={manual.servings} onChange={(e) => setManual({...manual, servings: e.target.value})} className={inputClass} placeholder="4" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Ingredients</label>
                <textarea value={manual.ingredients} onChange={(e) => setManual({...manual, ingredients: e.target.value})} className={inputClass + " resize-none h-24"} placeholder="One ingredient per line" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Instructions</label>
                <textarea value={manual.instructions} onChange={(e) => setManual({...manual, instructions: e.target.value})} className={inputClass + " resize-none h-24"} placeholder="Step by step instructions" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Image URL</label>
                <input value={manual.imageUrl} onChange={(e) => setManual({...manual, imageUrl: e.target.value})} className={inputClass} placeholder="https://..." />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 py-3 rounded-xl accent-gradient text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><PenLine size={16} /> Save Recipe</>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
