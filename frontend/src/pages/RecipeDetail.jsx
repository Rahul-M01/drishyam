import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, Clock, Users, Globe, ExternalLink, Film, ChefHat } from 'lucide-react'
import { api } from '../api'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setRecipe(await api.getRecipe(id))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDelete = async () => {
    if (confirm('Delete this recipe?')) {
      await api.deleteRecipe(id)
      navigate('/recipes')
    }
  }

  if (loading) {
    return (
      <div className="pt-8 max-w-3xl mx-auto">
        <div className="h-64 bg-neutral-800 rounded-xl animate-pulse-slow mb-6" />
        <div className="h-8 bg-neutral-800 rounded w-1/2 animate-pulse-slow" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="pt-8 text-center">
        <p className="text-neutral-400">Recipe not found</p>
        <Link to="/recipes" className="text-purple-400 text-sm mt-2 inline-block">Go back</Link>
      </div>
    )
  }

  const ingredientsList = recipe.ingredients?.split('\n').filter(Boolean) || []
  const instructionsList = recipe.instructions?.split('\n').filter(Boolean) || []

  return (
    <div className="pt-8 max-w-3xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero Image */}
      {recipe.imageUrl && (
        <div className="relative h-72 rounded-xl overflow-hidden mb-6">
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{recipe.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            {recipe.source && (
              <span className="text-sm text-neutral-400 flex items-center gap-1">
                <Globe size={12} /> {recipe.source}
              </span>
            )}
            {recipe.cuisine && (
              <span className="text-sm text-neutral-400 flex items-center gap-1">
                <ChefHat size={12} /> {recipe.cuisine}
              </span>
            )}
            {recipe.cookTime && (
              <span className="text-sm text-neutral-400 flex items-center gap-1">
                <Clock size={12} /> {recipe.cookTime}
              </span>
            )}
            {recipe.servings && (
              <span className="text-sm text-neutral-400 flex items-center gap-1">
                <Users size={12} /> {recipe.servings} servings
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm flex items-center gap-2 transition-colors shrink-0"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Source link */}
      {recipe.sourceUrl && (
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 mb-6 no-underline"
        >
          View original <ExternalLink size={12} />
        </a>
      )}

      {/* Video link */}
      {recipe.video && (
        <Link
          to={`/videos/${recipe.video.id}`}
          className="flex items-center gap-2 p-3 rounded-lg glass mb-6 text-sm text-neutral-300 hover:text-white no-underline transition-colors"
        >
          <Film size={14} className="text-purple-400" />
          Watch linked video
        </Link>
      )}

      {/* Description */}
      {recipe.description && (
        <div className="glass rounded-xl p-5 mb-4">
          <p className="text-sm text-neutral-300 leading-relaxed">{recipe.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ingredients */}
        {ingredientsList.length > 0 && (
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {ingredientsList.map((item, i) => (
                <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  {item.replace(/^[-•*]\s*/, '')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        {instructionsList.length > 0 && (
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Instructions</h3>
            <ol className="space-y-3">
              {instructionsList.map((step, i) => (
                <li key={i} className="text-sm text-neutral-300 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs text-neutral-500 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step.replace(/^\d+[.)]\s*/, '')}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
