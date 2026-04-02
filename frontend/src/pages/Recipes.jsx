import { useState, useEffect } from 'react'
import { Plus, BookOpen, Search } from 'lucide-react'
import { api } from '../api'
import RecipeCard from '../components/RecipeCard'
import AddRecipeModal from '../components/AddRecipeModal'

export default function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      setRecipes(await api.getRecipes())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = (id) => setRecipes(recipes.filter(r => r.id !== id))

  const handleSearch = async (q) => {
    setSearch(q)
    if (q.trim()) {
      try {
        setRecipes(await api.searchRecipes(q))
      } catch { load() }
    } else {
      load()
    }
  }

  return (
    <div className="pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen size={22} className="text-orange-400" />
          <h1 className="text-2xl font-bold text-white">Recipes</h1>
          <span className="text-sm text-neutral-500">({recipes.length})</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl accent-gradient text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Recipe
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search recipes..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl glass overflow-hidden">
              <div className="h-44 bg-neutral-800 animate-pulse-slow" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-800 rounded animate-pulse-slow" />
                <div className="h-3 bg-neutral-800 rounded w-2/3 animate-pulse-slow" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={48} className="text-neutral-700 mx-auto mb-4" />
          <h3 className="text-lg text-white mb-2">
            {search ? 'No recipes found' : 'No recipes yet'}
          </h3>
          <p className="text-neutral-500 text-sm">
            {search ? 'Try a different search term' : 'Scrape a recipe from a website or add one manually'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recipes.map(r => (
            <RecipeCard key={r.id} recipe={r} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AddRecipeModal open={showModal} onClose={() => setShowModal(false)} onAdded={() => load()} />
    </div>
  )
}
