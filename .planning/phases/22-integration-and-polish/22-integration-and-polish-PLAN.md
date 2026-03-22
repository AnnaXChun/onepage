---
phase: 22-integration-and-polish
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/main/java/com/onepage/model/Blog.java
  - backend/src/main/java/com/onepage/dto/ProfileDTO.java
  - backend/src/main/java/com/onepage/service/BlogService.java
  - backend/src/main/java/com/onepage/mapper/BlogMapper.java
  - backend/src/main/java/com/onepage/controller/BlogController.java
  - backend/src/main/java/com/onepage/controller/UserProfileController.java
autonomous: true
requirements:
  - PROF-11
  - PROF-12

must_haves:
  truths:
    - "Profile API returns total visitor count across all user's published sites"
    - "Profile API returns featured flag on each blog"
    - "User can set featured blog via API endpoint"
    - "Only one blog can be featured at a time per user"
  artifacts:
    - path: "backend/src/main/java/com/onepage/model/Blog.java"
      contains: "private Boolean featured"
    - path: "backend/src/main/java/com/onepage/dto/ProfileDTO.java"
      contains: "totalVisitors"
      exports: "BlogSummary.featured"
    - path: "backend/src/main/java/com/onepage/service/BlogService.java"
      contains: "getTotalVisitorsByUserId"
      contains: "setFeaturedBlog"
    - path: "backend/src/main/java/com/onepage/mapper/BlogMapper.java"
      contains: "selectTotalVisitorsByBlogIds"
    - path: "backend/src/main/java/com/onepage/controller/BlogController.java"
      contains: "PUT.*featured"
  key_links:
    - from: "BlogDailyStats"
      to: "BlogService.getTotalVisitorsByUserId()"
      via: "BlogMapper.selectTotalVisitorsByBlogIds()"
    - from: "Blog.featured"
      to: "ProfileDTO.BlogSummary.featured"
      via: "UserProfileController.getPublicProfile()"
---

<objective>
Add backend infrastructure for total visitor counts and featured site pinning. Profile API will return totalVisitors and featured flag on each blog. BlogController will expose setFeaturedBlog endpoint.
</objective>

<context>
@backend/src/main/java/com/onepage/model/Blog.java
@backend/src/main/java/com/onepage/model/BlogDailyStats.java
@backend/src/main/java/com/onepage/dto/ProfileDTO.java
@backend/src/main/java/com/onepage/service/BlogService.java
@backend/src/main/java/com/onepage/mapper/BlogMapper.java
@backend/src/main/java/com/onepage/controller/BlogController.java
@backend/src/main/java/com/onepage/controller/UserProfileController.java
</context>

<interfaces>
<!-- Key types and contracts the executor needs -->

From backend/src/main/java/com/onepage/model/Blog.java:
```java
// EXISTING fields used:
private Long id;
private Long userId;
private String title;
private String coverImage;
private String shareCode;
private Integer status;  // 1 = published
private LocalDateTime publishTime;
// NEW field to add:
private Boolean featured;
```

From backend/src/main/java/com/onepage/dto/ProfileDTO.java:
```java
// EXISTING:
public static class BlogSummary {
    private Long id;
    private String title;
    private String coverImage;
    private String shareCode;
    private LocalDateTime publishTime;
    // NEW field to add:
    private Boolean featured;
}
// NEW field to add to ProfileDTO:
private Long totalVisitors;
```

From backend/src/main/java/com/onepage/service/BlogService.java:
```java
// EXISTING method used by profile:
public List<Blog> getPublishedBlogsByUserId(Long userId)
// NEW methods to add:
public Long getTotalVisitorsByUserId(Long userId)
public void setFeaturedBlog(Long blogId, Long userId)  // sets featured=true, clears others
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add featured field to Blog model</name>
  <files>backend/src/main/java/com/onepage/model/Blog.java</files>
  <action>
    Add `private Boolean featured = false;` field to Blog.java model after the publishTime field.
    This field tracks whether a blog is pinned as the user's featured site.
  </action>
  <verify>
    <automated>grep -n "private Boolean featured" backend/src/main/java/com/onepage/model/Blog.java</automated>
  </verify>
  <done>Blog.java has Boolean featured field with default false</done>
</task>

<task type="auto">
  <name>Task 2: Update ProfileDTO with totalVisitors and featured flag</name>
  <files>backend/src/main/java/com/onepage/dto/ProfileDTO.java</files>
  <action>
    1. Add `private Long totalVisitors;` field to ProfileDTO class
    2. Add `private Boolean featured = false;` field to BlogSummary nested class

    ProfileDTO should look like:
    ```java
    @Data
    public class ProfileDTO {
        private String username;
        private String avatar;
        // ... existing fields ...
        private List<BlogSummary> blogs;
        private Long totalVisitors;  // ADD THIS

        @Data
        public static class BlogSummary {
            // ... existing fields ...
            private Boolean featured = false;  // ADD THIS
        }
    }
    ```
  </action>
  <verify>
    <automated>grep -n "totalVisitors" backend/src/main/java/com/onepage/dto/ProfileDTO.java && grep -n "featured" backend/src/main/java/com/onepage/dto/ProfileDTO.java</automated>
  </verify>
  <done>ProfileDTO has totalVisitors and BlogSummary.featured fields</done>
</task>

<task type="auto">
  <name>Task 3: Add selectTotalVisitorsByBlogIds to BlogMapper</name>
  <files>backend/src/main/java/com/onepage/mapper/BlogMapper.java</files>
  <action>
    Read the file first, then add a custom method to BlogMapper to sum pageViews from blog_daily_stats table for a list of blog IDs:

    ```java
    @Select("<script>" +
            "SELECT COALESCE(SUM(bds.page_views), 0) " +
            "FROM blog_daily_stats bds " +
            "WHERE bds.blog_id IN " +
            "<foreach collection='blogIds' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "</script>")
    Long selectTotalVisitorsByBlogIds(@Param("blogIds") List<Long> blogIds);
    ```
  </action>
  <read_first>backend/src/main/java/com/onepage/mapper/BlogMapper.java</read_first>
  <verify>
    <automated>grep -n "selectTotalVisitorsByBlogIds" backend/src/main/java/com/onepage/mapper/BlogMapper.java</automated>
  </verify>
  <done>BlogMapper has selectTotalVisitorsByBlogIds method</done>
</task>

<task type="auto">
  <name>Task 4: Add getTotalVisitorsByUserId and setFeaturedBlog to BlogService</name>
  <files>backend/src/main/java/com/onepage/service/BlogService.java</files>
  <action>
    Read the file first, then add two methods to BlogService:

    1. `getTotalVisitorsByUserId(Long userId)`: Sum pageViews from BlogDailyStats for all published blogs belonging to userId.

    2. `setFeaturedBlog(Long blogId, Long userId)`: First clear featured flag on all user's published blogs (set featured=false), then set featured=true on the specified blogId.

    Implementation:
    ```java
    public Long getTotalVisitorsByUserId(Long userId) {
        List<Blog> userBlogs = getPublishedBlogsByUserId(userId);
        if (userBlogs.isEmpty()) {
            return 0L;
        }
        List<Long> blogIds = userBlogs.stream().map(Blog::getId).collect(Collectors.toList());
        Long total = baseMapper.selectTotalVisitorsByBlogIds(blogIds);
        return total != null ? total : 0L;
    }

    @Transactional
    public void setFeaturedBlog(Long blogId, Long userId) {
        // Clear existing featured for all user's published blogs
        this.lambdaUpdate()
            .eq(Blog::getUserId, userId)
            .eq(Blog::getStatus, 1)  // only published blogs
            .set(Blog::getFeatured, false)
            .update();
        // Set new featured
        this.lambdaUpdate()
            .eq(Blog::getId, blogId)
            .eq(Blog::getUserId, userId)
            .set(Blog::getFeatured, true)
            .update();
    }
    ```
  </action>
  <read_first>backend/src/main/java/com/onepage/service/BlogService.java</read_first>
  <verify>
    <automated>grep -n "getTotalVisitorsByUserId\|setFeaturedBlog" backend/src/main/java/com/onepage/service/BlogService.java</automated>
  </verify>
  <done>BlogService has getTotalVisitorsByUserId and setFeaturedBlog methods</done>
</task>

<task type="auto">
  <name>Task 5: Update UserProfileController to include totalVisitors and featured</name>
  <files>backend/src/main/java/com/onepage/controller/UserProfileController.java</files>
  <action>
    Read the file first, then modify getPublicProfile method to:
    1. Set totalVisitors on the profile DTO after building blog summaries
    2. Set featured flag on each BlogSummary from the blog.getFeatured()

    After `profile.setBlogs(blogSummaries);` add:
    `profile.setTotalVisitors(blogService.getTotalVisitorsByUserId(user.getId()));`

    In the BlogSummary building loop, after `summary.setPublishTime(blog.getPublishTime());` add:
    `summary.setFeatured(blog.getFeatured());`
  </action>
  <read_first>backend/src/main/java/com/onepage/controller/UserProfileController.java</read_first>
  <verify>
    <automated>grep -n "setTotalVisitors\|setFeatured" backend/src/main/java/com/onepage/controller/UserProfileController.java</automated>
  </verify>
  <done>UserProfileController populates totalVisitors and featured flag on BlogSummary</done>
</task>

<task type="auto">
  <name>Task 6: Add PUT /api/blog/{id}/featured endpoint</name>
  <files>backend/src/main/java/com/onepage/controller/BlogController.java</files>
  <action>
    Read the file first, then add a new endpoint to BlogController:

    ```java
    @PutMapping("/{id}/featured")
    public Result<Void> setFeaturedBlog(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        blogService.setFeaturedBlog(id, principal.getUserId());
        return Result.success();
    }
    ```
  </action>
  <read_first>backend/src/main/java/com/onepage/controller/BlogController.java</read_first>
  <verify>
    <automated>grep -n "featured" backend/src/main/java/com/onepage/controller/BlogController.java</automated>
  </verify>
  <done>BlogController has PUT /{id}/featured endpoint requiring authentication</done>
</task>

</tasks>

<verification>
- Maven compile passes: `cd backend && mvn compile -q`
- Blog.java has Boolean featured field
- ProfileDTO.java has totalVisitors and BlogSummary.featured
- BlogMapper.java has selectTotalVisitorsByBlogIds
- BlogService.java has getTotalVisitorsByUserId and setFeaturedBlog
- UserProfileController populates totalVisitors and featured
- BlogController has PUT /{id}/featured endpoint
</verification>

<success_criteria>
- GET /api/user/profile/{username} returns totalVisitors in response
- GET /api/user/profile/{username} returns featured flag on each blog in blogs array
- PUT /api/blog/{id}/featured returns 200 and sets featured blog for authenticated user
- Only one blog can be featured at a time per user (previous featured is cleared)
</success_criteria>

<output>
After completion, create `.planning/phases/22-integration-and-polish/22-integration-and-polish-01-SUMMARY.md`
</output>
