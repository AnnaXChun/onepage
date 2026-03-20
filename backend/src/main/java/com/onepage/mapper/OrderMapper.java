package com.onepage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.onepage.model.Order;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface OrderMapper extends BaseMapper<Order> {

    @Select("SELECT * FROM orders WHERE order_no = #{orderNo}")
    Order findByOrderNo(@Param("orderNo") String orderNo);

    @Select("SELECT * FROM orders WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<Order> findByUserId(@Param("userId") Long userId);

    @Select("SELECT * FROM orders WHERE user_id = #{userId} AND status = 0 AND expire_time > #{now} LIMIT 1")
    Order findPendingOrder(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Select("SELECT * FROM orders WHERE status = 0 AND expire_time <= #{now}")
    List<Order> findExpiredOrders(@Param("now") LocalDateTime now);

    @Select("SELECT COUNT(*) FROM orders WHERE user_id = #{userId} AND status = 2")
    int countPaidOrders(@Param("userId") Long userId);
}
