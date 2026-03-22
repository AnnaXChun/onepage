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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <a
          key={blog.id}
          href={`/blog/${blog.shareCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md hover:border-primary/30 transition-all duration-200"
        >
          {/* Cover Image */}
          <div className="aspect-[16/9] overflow-hidden bg-surface">
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