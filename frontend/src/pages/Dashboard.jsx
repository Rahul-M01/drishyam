import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Film, BookOpen, ArrowRight } from 'lucide-react'
import { api } from '../api'
import VideoCard from '../components/VideoCard'
import RecipeCard from '../components/RecipeCard'
import AddVideoModal from '../components/AddVideoModal'
import AddRecipeModal from '../components/AddRecipeModal'

export default function Dashboard() {
  const [videos, setVideos] = useState([])
  const [recipes, setRecipes] = useState([])
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [v, r] = await Promise.all([api.getVideos(), api.getRecipes()])
      setVideos(v)
      setRecipes(r)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleVideoDelete = (id) => setVideos(videos.filter(v => v.id !== id))
  const handleRecipeDelete = (id) => setRecipes(recipes.filter(r => r.id !== id))

  return (
    <div className="pt-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Welcome to <span className="bg-clip-text text-transparent accent-gradient">Drishyam</span>
        </h1>
        <p className="text-neutral-500 mt-3 text-lg">
          Your personal recipe video library
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setShowVideoModal(true)}
            className="px-5 py-2.5 rounded-xl accent-gradient text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Add Video
          </button>
          <button
            onClick={() => setShowRecipeModal(true)}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Plus size={16} /> Add Recipe
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl glass overflow-hidden">
              <div className="aspect-video bg-neutral-800 animate-pulse-slow" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-800 rounded animate-pulse-slow" />
                <div className="h-3 bg-neutral-800 rounded w-2/3 animate-pulse-slow" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Recent Videos */}
          {videos.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Film size={18} className="text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Recent Videos</h2>
                </div>
                {videos.length > 4 && (
                  <Link to="/videos" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 no-underline">
                    View all <ArrowRight size={14} />
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.slice(0, 4).map(v => (
                  <VideoCard key={v.id} video={v} onDelete={handleVideoDelete} />
                ))}
              </div>
            </section>
          )}

          {/* Recent Recipes */}
          {recipes.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-orange-400" />
                  <h2 className="text-lg font-semibold text-white">Recent Recipes</h2>
                </div>
                {recipes.length > 4 && (
                  <Link to="/recipes" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 no-underline">
                    View all <ArrowRight size={14} />
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {recipes.slice(0, 4).map(r => (
                  <RecipeCard key={r.id} recipe={r} onDelete={handleRecipeDelete} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {videos.length === 0 && recipes.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Film size={32} className="text-neutral-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No content yet</h3>
              <p className="text-neutral-500 text-sm mb-6">
                Start by downloading an Instagram video or adding a recipe
              </p>
              <button
                onClick={() => setShowVideoModal(true)}
                className="px-6 py-3 rounded-xl accent-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
              </button>
            </div>
          )}
        </>
      )}

      <AddVideoModal open={showVideoModal} onClose={() => setShowVideoModal(false)} onAdded={() => load()} />
      <AddRecipeModal open={showRecipeModal} onClose={() => setShowRecipeModal(false)} onAdded={() => load()} />
    </div>
  )
}
