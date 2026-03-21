# Testing Patterns

**Analysis Date:** 2026-03-21

## Test Framework Status

**No test framework is currently configured for this project.**

### Frontend
- No Jest or Vitest configuration found
- No test files (*.test.ts, *.spec.ts, *.test.tsx, *.spec.tsx) in `frontend/src/`
- No testing libraries in `package.json` devDependencies

### Backend
- No test directory: `backend/src/test/` does not exist
- Spring Boot Starter Test dependency is present in `pom.xml` but not used
- No test classes (*.java) in the project

---

## Backend Testing Dependencies

The `pom.xml` includes the test dependency but no test framework is actively used:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

This provides:
- JUnit 5 (JUnit Jupiter)
- Mockito
- Spring Test
- AssertJ

---

## Recommended Testing Patterns

Based on the codebase architecture, here are the recommended patterns to adopt:

### Backend - Unit Testing with JUnit 5 + Mockito

**Test Location:** `backend/src/test/java/com/onepage/`

**Service Test Pattern:**
```java
package com.onepage.service;

import com.onepage.exception.BusinessException;
import com.onepage.model.User;
import com.onepage.util.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void login_WithValidCredentials_ReturnsTokens() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPassword("$2a$10$encodedPassword");
        user.setStatus(1);

        when(userMapper.selectOne(any())).thenReturn(user);
        when(passwordEncoder.matches("password123", user.getPassword())).thenReturn(true);
        when(jwtTokenProvider.generateTokenPair(1L, "testuser"))
            .thenReturn(Map.of("accessToken", "token", "refreshToken", "refresh"));

        // When
        Map<String, String> result = userService.login(request);

        // Then
        assertNotNull(result);
        assertEquals("token", result.get("accessToken"));
    }

    @Test
    void login_WithInvalidPassword_ThrowsException() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("wrongpassword");

        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPassword("$2a$10$encodedPassword");
        user.setStatus(1);

        when(userMapper.selectOne(any())).thenReturn(user);
        when(passwordEncoder.matches("wrongpassword", user.getPassword())).thenReturn(false);

        // When/Then
        assertThrows(BusinessException.class, () -> userService.login(request));
    }
}
```

**Controller Test Pattern (Spring MockMvc):**
```java
package com.onepage.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onepage.dto.LoginRequest;
import com.onepage.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void register_WithValidRequest_ReturnsTokens() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setPassword("password123");
        request.setEmail("new@example.com");

        when(userService.register(any(), any(), any()))
            .thenReturn(Map.of("accessToken", "token", "refreshToken", "refresh"));

        // When/Then
        mockMvc.perform(post("/api/user/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.accessToken").value("token"));
    }
}
```

**Repository Test Pattern (MyBatis-Plus):**
```java
package com.onepage.mapper;

import com.onepage.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.mybatis.MybatisTest;

import static org.junit.jupiter.api.Assertions.*;

@MybatisTest
class UserMapperTest {

    @Autowired
    private UserMapper userMapper;

    @Test
    void selectByUsername_ReturnsUser() {
        // This would require a test database or embedded database
        User user = userMapper.selectOne(null);
        assertNotNull(user);
    }
}
```

---

### Frontend - Testing with Vitest + React Testing Library

**Test Location:** `frontend/src/**/*.test.ts` or `frontend/src/**/*.spec.ts`

**Package.json additions:**
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^24.0.0"
  }
}
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

**Component Test Pattern:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Button from '@/components/common/Button'

// Wrapper for React Router
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>, {
      wrapper: Wrapper,
    })
    expect(container.firstChild).toHaveClass('bg-surface')
  })

  it('shows loading spinner when loading prop is true', () => {
    render(<Button loading>Submit</Button>, { wrapper: Wrapper })
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

**Hook Test Pattern:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

// Mock the AuthContext
const mockLogin = vi.fn()
const mockLogout = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useAuth: () => ({
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    login: mockLogin,
    logout: mockLogout,
  }),
}))

describe('useAuth Hook', () => {
  it('returns initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('calls login when credentials are valid', async () => {
    const { result } = renderHook(() => useAuth())
    const testUser = { id: 1, username: 'testuser' }

    await act(async () => {
      result.current.login(testUser, 'test-token')
    })

    expect(mockLogin).toHaveBeenCalledWith(testUser, 'test-token')
  })
})
```

**API Service Test Pattern:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import api from '@/services/api'

// Setup MSW server
export const server = setupServer(
  http.post('/api/user/login', () => {
    return HttpResponse.json({
      code: 200,
      message: 'success',
      data: { accessToken: 'test-token', refreshToken: 'refresh-token' },
    })
  })
)

beforeEach(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('API Service', () => {
  describe('login', () => {
    it('returns tokens on successful login', async () => {
      const response = await api.post('/user/login', {
        username: 'testuser',
        password: 'password123',
      })

      expect(response.data.code).toBe(200)
      expect(response.data.data.accessToken).toBe('test-token')
    })
  })
})
```

---

## Test Coverage Targets

**Recommended Coverage Goals:**
- Backend Services: 70%+ line coverage
- Backend Controllers: 60%+ line coverage
- Frontend Components: 50%+ line coverage
- Frontend Hooks: 70%+ line coverage

**Critical Areas to Test:**
1. User registration and login flow
2. JWT token generation and validation
3. Payment order creation and status updates
4. Blog CRUD operations with authorization
5. Error handling paths (GlobalExceptionHandler)

---

## Mocking Guidelines

**Backend:**
- Mock external services (Redis, JWT provider)
- Use `@MockBean` for Spring components in controller tests
- Use `@Mock` with `@InjectMocks` for pure unit tests

**Frontend:**
- Mock API responses with MSW (Mock Service Worker)
- Mock React Router navigation
- Mock localStorage/sessionStorage
- Mock custom events

---

*Testing analysis: 2026-03-21*
