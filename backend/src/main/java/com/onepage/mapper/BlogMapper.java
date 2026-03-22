package com.onepage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.onepage.model.Blog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface BlogMapper extends BaseMapper<Blog> {

    /**
     * Sum total page views across multiple blogs from blog_daily_stats table.
     * Used for calculating total visitors on a user's profile.
     * PROF-11
     */
    @Select("<script>" +
            "SELECT COALESCE(SUM(bds.page_views), 0) " +
            "FROM blog_daily_stats bds " +
            "WHERE bds.blog_id IN " +
            "<foreach collection='blogIds' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "</script>")
    Long selectTotalVisitorsByBlogIds(@Param("blogIds") List<Long> blogIds);
}
