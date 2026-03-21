import { createContext, useContext, useState, useEffect } from 'react'

const BlogContext = createContext(null)

export function BlogProvider({ children }) {
  const [currentBlog, setCurrentBlog] = useState(() => {
    try {
      const saved = localStorage.getItem('vibe_current_blog')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (currentBlog) {
      localStorage.setItem('vibe_current_blog', JSON.stringify(currentBlog))
    } else {
      localStorage.removeItem('vibe_current_blog')
    }
  }, [currentBlog])

  const clearBlog = () => {
    setCurrentBlog(null)
    localStorage.removeItem('vibe_current_blog')
  }

  return (
    <BlogContext.Provider value={{ currentBlog, setCurrentBlog, clearBlog }}>
      {children}
    </BlogContext.Provider>
  )
}

export function useBlog() {
  const context = useContext(BlogContext)
  if (!context) {
    throw new Error('useBlog must be used within BlogProvider')
  }
  return context
}
