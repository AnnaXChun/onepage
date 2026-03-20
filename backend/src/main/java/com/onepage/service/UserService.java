package com.onepage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.dto.LoginRequest;
import com.onepage.mapper.UserMapper;
import com.onepage.model.User;
import com.onepage.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class UserService extends ServiceImpl<UserMapper, User> {

    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, Object> redisTemplate;

    public String register(String username, String password, String email) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User existUser = this.getOne(wrapper);
        if (existUser != null) {
            throw new RuntimeException("用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(md5(password));
        user.setEmail(email);
        user.setStatus(1);
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        this.save(user);

        return jwtUtil.generateToken(user.getId(), username);
    }

    public String login(LoginRequest request) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, request.getUsername());
        User user = this.getOne(wrapper);

        if (user == null || !user.getPassword().equals(md5(request.getPassword()))) {
            throw new RuntimeException("用户名或密码错误");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        redisTemplate.opsForValue().set("user:token:" + user.getId(), token, 24, TimeUnit.HOURS);
        return token;
    }

    public User getUserInfo(Long userId) {
        return this.getById(userId);
    }

    public void logout(Long userId) {
        redisTemplate.delete("user:token:" + userId);
    }

    private String md5(String str) {
        return DigestUtils.md5DigestAsHex(str.getBytes());
    }
}
