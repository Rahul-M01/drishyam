import { Link } from 'react-router-dom'
import { Trash2, Clock, ChefHat, Users, Globe } from 'lucide-react'
import { api } from '../api'

export default function RecipeCard({ recipe, onDelete }) {
  const handleDelete = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Delete this recipe?')) {
      await api.deleteRecipe(recipe.id)
      onDelete?.(recipe.id)
    }
  }

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group block rounded-xl overflow-hidden glass hover:border-purple-500/30 transition-all duration-300 no-underline animate-fade-in"
    >
      {/* Image */}
      <div className="relative h-44 bg-neutral-900 overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-900/20 to-neutral-900">
            <ChefHat size={40} className="text-neutral-600" />
          </div>
        )}
        {recipe.source && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-medium text-white flex items-center gap-1">
            <Globe size={10} />
            {recipe.source}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">
          {recipe.title || 'Untitled Recipe'}
        </h3>
        {recipe.description && (
          <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">
            {recipe.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          {recipe.cookTime && (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <Clock size={12} />
              {recipe.cookTime}
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <Users size={12} />
              {recipe.servings}
            </span>
          )}
          <button
            onClick={handleDelete}
            className="ml-auto p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Link>
  )
}
