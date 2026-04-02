import { Link } from 'react-router-dom'
import { Play, Trash2, Clock } from 'lucide-react'
import { api } from '../api'

export default function VideoCard({ video, onDelete }) {
  const handleDelete = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Delete this video?')) {
      await api.deleteVideo(video.id)
      onDelete?.(video.id)
    }
  }

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <Link
      to={`/videos/${video.id}`}
      className="group block rounded-xl overflow-hidden glass hover:border-purple-500/30 transition-all duration-300 no-underline animate-fade-in"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-neutral-900 overflow-hidden">
        {video.thumbnailPath ? (
          <img
            src={api.thumbnailUrl(video.thumbnailPath)}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-neutral-900">
            <Play size={40} className="text-neutral-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={20} className="text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">
          {video.title || 'Untitled Video'}
        </h3>
        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            <Clock size={12} />
            {video.createdAt ? timeAgo(video.createdAt) : ''}
          </span>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Link>
  )
}
