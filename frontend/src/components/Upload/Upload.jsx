import { useState, useRef } from 'react'

function Upload({ onUpload, onBack }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file) => {
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (preview) {
      onUpload(preview)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Upload Image</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-lg">
          <div
            className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {preview ? (
              <div className="space-y-6">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-72 mx-auto rounded-2xl object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-sm text-white/80">Click to change</span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Your image is ready</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-medium text-white mb-2">
                    Drop your image here
                  </p>
                  <p className="text-gray-500 text-sm">
                    or click to browse • JPG, PNG, WebP supported
                  </p>
                </div>
              </div>
            )}
          </div>

          {preview && (
            <div className="mt-8 text-center">
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="px-10 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {uploading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Upload
