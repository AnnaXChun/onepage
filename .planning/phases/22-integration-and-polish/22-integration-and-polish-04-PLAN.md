---
phase: 22-integration-and-polish
plan: 04
type: execute
wave: 1
gap_closure: true
files_modified:
  - frontend/src/components/AccountSettings/AccountSettings.tsx
  - frontend/src/services/profileApi.ts
autonomous: true
requirements:
  - PROF-12
---

<objective>
Add pin/unpin featured blog UI to Account Settings page.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Add fetchMyBlogs API function</name>
  <files>frontend/src/services/profileApi.ts</files>
  <action>
    Read the file first, then add a function to fetch user's own blogs for the featured toggle.

    Add at the end of the file:
    ```typescript
    export const fetchMyBlogs = async (): Promise<ApiResponse<BlogSummary[]>> => {
      const response = await api.get('/blog/list');
      return response.data;
    };
    ```
  </action>
  <read_first>frontend/src/services/profileApi.ts</read_first>
  <verify>
    <automated>grep -n "fetchMyBlogs" frontend/src/services/profileApi.ts</automated>
  </verify>
  <done>profileApi.ts exports fetchMyBlogs function</done>
</task>

<task type="auto">
  <name>Task 2: Add "Manage Featured Blog" section to AccountSettings</name>
  <files>frontend/src/components/AccountSettings/AccountSettings.tsx</files>
  <action>
    Read the file first, then add a "Featured Blog" section to AccountSettings.tsx.

    Add imports at top:
    ```typescript
    import { fetchMyBlogs, setFeaturedBlog } from '../../services/profileApi';
    ```

    Add state for user's blogs:
    ```typescript
    const [userBlogs, setUserBlogs] = useState<any[]>([]);
    const [loadingBlogs, setLoadingBlogs] = useState(false);
    ```

    Add useEffect to load blogs:
    ```typescript
    useEffect(() => {
      if (isAuthenticated) {
        setLoadingBlogs(true);
        fetchMyBlogs()
          .then(res => {
            if (res.code === 200 && res.data) {
              setUserBlogs(res.data.filter((b: any) => b.status === 1)); // Only published
            }
          })
          .finally(() => setLoadingBlogs(false));
      }
    }, [isAuthenticated]);
    ```

    Add toggle function:
    ```typescript
    const handleToggleFeatured = async (blogId: number, currentFeatured: boolean) => {
      try {
        await setFeaturedBlog(blogId, !currentFeatured);
        // Refresh blogs
        const res = await fetchMyBlogs();
        if (res.code === 200 && res.data) {
          setUserBlogs(res.data.filter((b: any) => b.status === 1));
        }
      } catch (err) {
        console.error('Failed to toggle featured:', err);
      }
    };
    ```

    Add UI section after the profile editing section (before the closing div):
    ```tsx
    {/* Featured Blog Section */}
    <div className="border-t border-border pt-6 mt-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        {t('featuredBlog') || 'Featured Blog'}
      </h3>
      <p className="text-sm text-secondary mb-4">
        {t('featuredBlogDesc') || 'Pin one of your blogs to appear first on your public profile.'}
      </p>

      {loadingBlogs ? (
        <div className="text-secondary">{t('loading') || 'Loading...'}</div>
      ) : userBlogs.length === 0 ? (
        <div className="text-secondary">{t('noPublishedBlogs') || 'No published blogs yet.'}</div>
      ) : (
        <div className="space-y-3">
          {userBlogs.map((blog) => (
            <div
              key={blog.id}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                blog.featured
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface hover:border-borderLight'
              }`}
            >
              <div className="flex items-center gap-3">
                {blog.coverImage && (
                  <img src={blog.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium text-text-primary">{blog.title}</p>
                  <p className="text-sm text-secondary">
                    {new Date(blog.publishTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleFeatured(blog.id, blog.featured)}
                className={`p-2 rounded-lg transition-colors ${
                  blog.featured
                    ? 'bg-primary text-white'
                    : 'bg-surface hover:bg-background text-muted'
                }`}
                title={blog.featured ? 'Unpin from profile' : 'Pin to profile'}
              >
                <svg className="w-5 h-5" fill={blog.featured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    ```

    Note: Adjust based on actual data structure from fetchMyBlogs response.
  </action>
  <read_first>frontend/src/components/AccountSettings/AccountSettings.tsx</read_first>
  <verify>
    <automated>grep -n "featured\|Featured" frontend/src/components/AccountSettings/AccountSettings.tsx</automated>
  </verify>
  <done>AccountSettings has "Manage Featured Blog" section with pin/unpin UI</done>
</task>

</tasks>

<verification>
- Vite build passes
- AccountSettings has "Manage Featured Blog" section
- User can pin/unpin blogs from Account Settings
</verification>

<success_criteria>
- Account Settings page shows list of user's published blogs
- Each blog has a star button to pin/unpin
- Pinning a blog marks it as featured (featured=true)
- Only one blog can be featured at a time
</success_criteria>
