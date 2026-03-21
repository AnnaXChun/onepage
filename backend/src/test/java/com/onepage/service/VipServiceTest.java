package com.onepage.service;

import com.onepage.mapper.UserMapper;
import com.onepage.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VipServiceTest {

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private VipService vipService;

    private User createUser(Long id, boolean vipStatus, LocalDateTime vipExpireTime) {
        User user = new User();
        user.setId(id);
        user.setVipStatus(vipStatus);
        user.setVipExpireTime(vipExpireTime);
        return user;
    }

    @Test
    void testExtendVip() {
        // Given: User with active VIP expiring in 10 days
        User user = createUser(1L, true, LocalDateTime.now().plusDays(10));
        when(userMapper.selectById(1L)).thenReturn(user);

        // When
        vipService.activateVip(1L);

        // Then: VIP should be extended (30 days from now, not reset to 30 from original)
        verify(userMapper).updateById(user);
        assertTrue(user.getVipStatus());
        assertTrue(user.getVipExpireTime().isAfter(LocalDateTime.now().plusDays(30)));
    }

    @Test
    void testNewVip() {
        // Given: User without VIP
        User user = createUser(2L, false, null);
        when(userMapper.selectById(2L)).thenReturn(user);

        // When
        vipService.activateVip(2L);

        // Then: VIP should be activated for 30 days
        verify(userMapper).updateById(user);
        assertTrue(user.getVipStatus());
        assertTrue(user.getVipExpireTime().isAfter(LocalDateTime.now().plusDays(29)));
    }
}
