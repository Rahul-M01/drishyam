import { useState, useEffect } from 'react'
import { Plus, Film } from 'lucide-react'
import { api } from '../api'
import VideoCard from '../components/VideoCard'
import AddVideoModal from '../components/AddVideoModal'

export default function Videos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    try {
      setVideos(await api.getVideos())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = (id) => setVideos(videos.filter(v => v.id !== id))

  return (
    <div className="pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Film size={22} className="text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Videos</h1>
          <span className="text-sm text-neutral-500">({videos.length})</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl accent-gradient text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Download Video
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl glass overflow-hidden">
              <div className="aspect-video bg-neutral-800 animate-pulse-slow" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-800 rounded animate-pulse-slow" />
                <div className="h-3 bg-neutral-800 rounded w-2/3 animate-pulse-slow" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20">
          <Film size={48} className="text-neutral-700 mx-auto mb-4" />
          <h3 className="text-lg text-white mb-2">No videos yet</h3>
          <p className="text-neutral-500 text-sm">Download an Instagram video to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map(v => (
            <VideoCard key={v.id} video={v} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AddVideoModal open={showModal} onClose={() => setShowModal(false)} onAdded={() => load()} />
    </div>
  )
}
