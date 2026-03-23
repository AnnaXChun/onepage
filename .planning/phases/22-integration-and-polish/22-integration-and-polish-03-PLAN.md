---
phase: 22-integration-and-polish
plan: 03
type: execute
wave: 1
gap_closure: true
files_modified:
  - frontend/src/components/Header/AuthButtons.tsx
  - frontend/src/pages/Orders/Orders.jsx
  - frontend/src/services/api.ts
autonomous: true
requirements:
  - PROF-09
  - PROF-12
---

<objective>
Fix z-index issue in AuthButtons dropdown and add pin/unpin featured blog UI to Orders page.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Fix z-index for AuthButtons dropdown</name>
  <files>frontend/src/components/Header/AuthButtons.tsx</files>
  <action>
    Read the file first, then increase the dropdown z-index from z-20 to z-50 so it appears above MobileMenu (z-40).

    Change line 57:
    OLD: className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-20"
    NEW: className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50"

    Also change line 53 backdrop z-10 to z-40 to match:
    OLD: className="fixed inset-0 z-10"
    NEW: className="fixed inset-0 z-40"
  </action>
  <read_first>frontend/src/components/Header/AuthButtons.tsx</read_first>
  <verify>
    <automated>grep -n "z-50" frontend/src/components/Header/AuthButtons.tsx</automated>
  </verify>
  <done>AuthButtons dropdown z-index increased to z-50, appears above MobileMenu</done>
</task>

<task type="auto">
  <name>Task 2: Add setFeatured API to backend service</name>
  <files>backend/src/main/java/com/onepage/service/BlogService.java</files>
  <action>
    Read the file first, then add a method to set a blog as featured. The backend already has setFeaturedBlog method from plan 01 - verify it exists and has the proper signature.

    Check if BlogService has:
    - setFeaturedBlog(Long blogId, Long userId, boolean featured) method

    If it exists, no changes needed. If not, add it.
  </action>
  <read_first>backend/src/main/java/com/onepage/service/BlogService.java</read_first>
  <verify>
    <automated>grep -n "setFeatured" backend/src/main/java/com/onepage/service/BlogService.java</automated>
  </verify>
  <done>BlogService has setFeaturedBlog method</done>
</task>

<task type="auto">
  <name>Task 3: Add setFeatured API call to frontend api.ts</name>
  <files>frontend/src/services/api.ts</files>
  <action>
    Read the file first, then add a function to set a blog as featured:

    Add after existing blog-related functions:
    ```typescript
    export const setFeaturedBlog = async (blogId: number, featured: boolean): Promise<ApiResponse<null>> => {
      const response = await api.put(`/blog/${blogId}/featured`, { featured });
      return response.data;
    };
    ```
  </action>
  <read_first>frontend/src/services/api.ts</read_first>
  <verify>
    <automated>grep -n "setFeaturedBlog" frontend/src/services/api.ts</automated>
  </verify>
  <done>api.ts exports setFeaturedBlog function</done>
</task>

<task type="auto">
  <name>Task 4: Add pin/unpin button to Orders page</name>
  <files>frontend/src/pages/Orders/Orders.jsx</files>
  <action>
    Read the file first, then add a pin/unpin button to each blog card in the orders list.

    Add a function to toggle featured status:
    ```javascript
    const handleToggleFeatured = async (orderNo, currentFeatured) => {
      try {
        // Find the blog ID from the order
        // Call setFeaturedBlog(blogId, !currentFeatured)
        // Refresh orders after success
        await setFeaturedBlog(blogId, !currentFeatured);
        loadOrders();
      } catch (err) {
        console.error('Failed to toggle featured:', err);
      }
    };
    ```

    Add a star button to each blog card (before the existing click handler):
    ```jsx
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleToggleFeatured(order.blogId, order.featured);
      }}
      className={`p-2 rounded-lg transition-colors ${
        order.featured
          ? 'bg-primary/20 text-primary'
          : 'bg-surface hover:bg-background text-muted'
      }`}
      title={order.featured ? 'Unpin from profile' : 'Pin to profile'}
    >
      <svg className="w-4 h-4" fill={order.featured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </button>
    ```

    Note: You may need to adjust based on the actual order data structure. The order may have `blogId` or you may need to fetch it differently.
  </action>
  <read_first>frontend/src/pages/Orders/Orders.jsx</read_first>
  <verify>
    <automated>grep -n "featured\|setFeatured" frontend/src/pages/Orders/Orders.jsx</automated>
  </verify>
  <done>Orders page has pin/unpin button for each blog</done>
</task>

</tasks>

<verification>
- Vite build passes: `cd frontend && npm run build`
- AuthButtons dropdown z-index is z-50
- Orders page has pin/unpin functionality
</verification>

<success_criteria>
- Dropdown menu appears above MobileMenu when opened
- User can pin a blog as featured from orders page
- User can unpin a blog from orders page
- Profile shows pinned blog first with badge
</success_criteria>
