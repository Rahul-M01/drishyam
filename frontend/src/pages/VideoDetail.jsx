import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, BookOpen, ExternalLink, Pencil, Check, X } from 'lucide-react'
import { api } from '../api'

export default function VideoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [video, setVideo] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const v = await api.getVideo(id)
        setVideo(v)
        const allRecipes = await api.getRecipes()
        setRecipes(allRecipes.filter(r => r.video?.id === Number(id)))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDelete = async () => {
    if (confirm('Delete this video?')) {
      await api.deleteVideo(id)
      navigate('/videos')
    }
  }

  const saveTitle = async () => {
    if (!editTitle.trim()) return
    try {
      const updated = await api.updateVideo(id, { title: editTitle.trim() })
      setVideo(updated)
      setEditing(false)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="pt-8 max-w-4xl mx-auto">
        <div className="aspect-video bg-neutral-800 rounded-xl animate-pulse-slow mb-6" />
        <div className="h-8 bg-neutral-800 rounded w-1/2 animate-pulse-slow" />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="pt-8 text-center">
        <p className="text-neutral-400">Video not found</p>
        <Link to="/videos" className="text-purple-400 text-sm mt-2 inline-block">Go back</Link>
      </div>
    )
  }

  return (
    <div className="pt-8 max-w-4xl mx-auto animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Video Player */}
      <div className="rounded-xl overflow-hidden bg-black mb-6">
        <video
          controls
          className="w-full max-h-[70vh]"
          src={api.videoStreamUrl(video.fileName)}
          poster={video.thumbnailPath ? api.thumbnailUrl(video.thumbnailPath) : undefined}
        />
      </div>

      {/* Video Info */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle()
                  if (e.key === 'Escape') setEditing(false)
                }}
                className="flex-1 text-2xl font-bold bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-purple-500/50"
                autoFocus
              />
              <button onClick={saveTitle} className="p-2 rounded-lg hover:bg-green-500/10 text-green-400">
                <Check size={18} />
              </button>
              <button onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-white/10 text-neutral-400">
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{video.title || 'Untitled Video'}</h1>
              <button
                onClick={() => { setEditTitle(video.title || ''); setEditing(true) }}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
          {video.sourceUrl && (
            <a
              href={video.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1 no-underline"
            >
              Original source <ExternalLink size={12} />
            </a>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm flex items-center gap-2 transition-colors"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Caption */}
      {video.caption && (
        <div className="glass rounded-xl p-5 mb-6">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">Caption</h3>
          <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {video.caption}
          </p>
        </div>
      )}

      {/* Linked Recipes */}
      {recipes.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
            <BookOpen size={14} /> Extracted Recipes
          </h3>
          <div className="space-y-3">
            {recipes.map(recipe => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors no-underline"
              >
                <p className="text-sm font-medium text-white">{recipe.title}</p>
                {recipe.description && (
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{recipe.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
