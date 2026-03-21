package com.onepage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.onepage.model.UserCredits;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserCreditsMapper extends BaseMapper<UserCredits> {

    @Select("SELECT * FROM user_credits WHERE user_id = #{userId}")
    UserCredits selectByUserId(Long userId);
}
