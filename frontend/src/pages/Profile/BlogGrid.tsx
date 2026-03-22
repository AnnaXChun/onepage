import type { BlogSummary } from '@/services/profileApi';

interface BlogGridProps {
  blogs: BlogSummary[];
}

export default function BlogGrid({ blogs }: BlogGridProps) {
  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">No published sites yet.</p>
      </div>
    );
  }

  // Sort: featured first, then by publishTime descending
  const sortedBlogs = [...blogs].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime();
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedBlogs.map((blog) => (
        <a
          key={blog.id}
          href={`/blog/${blog.shareCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md hover:border-primary/30 transition-all duration-200"
        >
          {/* Cover Image */}
          <div className="aspect-[16/9] overflow-hidden bg-surface relative">
            {blog.featured && (
              <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 z-10">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                Featured
              </div>
            )}
            {blog.coverImage ? (
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-2">
              {blog.title}
            </h3>
            {blog.publishTime && (
              <p className="text-sm text-text-muted mt-2">
                {new Date(blog.publishTime).toLocaleDateString()}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}