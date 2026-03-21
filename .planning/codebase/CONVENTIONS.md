# Coding Conventions

**Analysis Date:** 2026-03-21

## Project Overview

**Frontend:** React 18 + TypeScript + Vite + TailwindCSS
**Backend:** Spring Boot 3.2 + Java 17 + MyBatis-Plus

---

## Frontend Conventions

### Naming Patterns

**Files:**
- React components: PascalCase (e.g., `Button.tsx`, `Header.tsx`, `ErrorBoundary.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`, `useAuth.ts`)
- Services: camelCase (e.g., `api.ts`)
- Types: camelCase (e.g., `models.d.ts`, `api.d.ts`)
- Config: camelCase (e.g., `env.ts`, `templates.ts`)
- Context: PascalCase (e.g., `AuthContext.tsx`, `BlogContext.jsx`)

**Note:** Mixed use of `.tsx` and `.jsx` extensions - some components use `.jsx` (Login.jsx, Register.jsx, Templates.jsx) while others use `.tsx`. Prefer `.tsx` for consistency when TypeScript is used.

**Functions/Variables:**
- camelCase for variables and functions
- PascalCase for React components and TypeScript types/interfaces

**Types:**
- Interface naming: PascalCase (e.g., `AuthUser`, `ButtonProps`)
- Type naming: PascalCase (e.g., `ApiResponse<T>`)

### Code Style

**Formatting:**
- Tool: Not configured (no ESLint/Prettier)
- TailwindCSS for styling with custom CSS variables
- OKLCH color space with CSS custom properties
- Custom easing: `ease-out-quart` defined in global.css

**Indentation:** 2 spaces (based on tsconfig and code samples)

**Quotes:** Single quotes for JSX attributes, double quotes for string content

**Semicolons:** Used in TypeScript files, not in some JSX files

### Import Organization

1. React/core imports (react, react-router-dom)
2. Third-party libraries (axios, qrcode.react)
3. Internal types (from `@/types/`)
4. Internal services (from `@/services/`)
5. Internal hooks and context (from `@/hooks/`, `@/context/`)
6. Internal components (from `@/components/`)
7. Relative imports for local files

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`)

### Component Patterns

**Default Export:**
```typescript
export default function Button({ variant = 'primary', ... }: ButtonProps) {
  // ...
}
```

**Props Interface:**
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}
```

**Component Structure:**
1. Type imports
2. Interface definitions
3. Component function
4. Helper functions (if any)
5. Default export

### Error Handling

**Frontend API Errors:**
- Axios interceptor handles 401 responses (clears auth, dispatches event)
- API calls use try/catch with specific error handling
- ErrorBoundary class component for component tree errors

**Example (from `Login.jsx`):**
```javascript
try {
  const response = await login(formData)
  if (response.code === 200 && response.data?.accessToken) {
    // success
  } else {
    setError(response.message || t('loginFailed'))
  }
} catch (err) {
  setError(t('usernameOrPasswordError'))
}
```

**ErrorBoundary Pattern:**
```typescript
export default class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  // ...
}
```

### Logging

**Pattern:** `console.error()` for errors, `console.log()` for debugging

**Concern:** Several `console.log()` statements remain in production code:
- `frontend/src/App.tsx` (lines 117, 124, 154, etc.)
- `frontend/src/pages/Auth/Login.jsx` - none in component, but overall inconsistent
- `frontend/src/pages/Home/Home.tsx`

**Recommendation:** Remove debug console.log statements before production or use a proper logging framework.

### State Management

**Context API:**
- AuthContext for authentication state (`src/context/AuthContext.tsx`)
- BlogContext for blog state (`src/context/BlogContext.jsx`)
- LanguageProvider for i18n (`src/i18n/index.jsx`)

**Local State:** useState for component-level state

**Pattern for Auth State:**
```typescript
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);
// Load from localStorage on mount
// Sync across tabs with storage event
// Dispatch custom event on auth changes
```

### Styling Conventions

**TailwindCSS with Custom Variables:**
- CSS variables defined in `global.css` using OKLCH
- Custom animations defined in tailwind.config.js
- No arbitrary values - use consistent spacing/color tokens

**Class Organization:**
```typescript
className={[
  'base classes',
  'conditional classes',
  className,
].join(' ')}
```

---

## Backend Conventions

### Java Code Style

**Package Structure:**
```
com.onepage/
├── config/          # Configuration classes
├── controller/       # REST controllers
├── service/          # Business logic
├── mapper/          # MyBatis mappers
├── model/           # Entity classes
├── dto/             # Data transfer objects
├── exception/        # Exception handling
├── util/            # Utility classes
└── validation/      # Custom validators
```

**Naming:**
- Classes: PascalCase (e.g., `UserController`, `UserService`)
- Methods: camelCase (e.g., `getUserInfo`, `createBlog`)
- Variables: camelCase (e.g., `userId`, `accessToken`)
- Constants: UPPER_SNAKE_CASE (e.g., `BLOG_CACHE_PREFIX`)

### Spring Boot Patterns

**Controller:**
```java
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping("/register")
    public Result<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        // ...
        return Result.success(tokens);
    }
}
```

**Service:**
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService extends ServiceImpl<UserMapper, User> {
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, Object> redisTemplate;

    public Map<String, String> login(LoginRequest request) {
        // ...
    }
}
```

### Error Handling

**ErrorCode Enum (from `exception/ErrorCode.java`):**
```java
@Getter
@AllArgsConstructor
public enum ErrorCode {
    // Auth errors (1xxx)
    UNAUTHORIZED(1001, "Not logged in"),
    INVALID_CREDENTIALS(1002, "Invalid username or password"),
    // ...

    private final int code;
    private final String message;
}
```

**BusinessException Factory Methods (from `exception/BusinessException.java`):**
```java
public static BusinessException unauthorized(String message) {
    return new BusinessException(ErrorCode.UNAUTHORIZED.getCode(), message);
}

public static BusinessException invalidCredentials() {
    return new BusinessException(ErrorCode.INVALID_CREDENTIALS);
}
```

**GlobalExceptionHandler (from `exception/GlobalExceptionHandler.java`):**
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusinessException(BusinessException e) {
        log.warn("Business exception: code={}, message={}", e.getCode(), e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<?> handleGenericException(Exception e, HttpServletRequest request) {
        log.error("Unexpected error at {} {}: {}",
                request.getMethod(),
                request.getRequestURI(),
                e.getMessage(),
                e);
        return Result.error(9999, "System error, please try again later");
    }
}
```

### Validation Patterns

**Request DTOs:**
```java
@Data
public class LoginRequest {
    @NotBlank(message = "Username cannot be empty")
    @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
    @Pattern(regexp = "^[A-Za-z0-9_]+$", message = "Username can only contain letters, numbers and underscores")
    private String username;

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 8, max = 20, message = "Password must be 8-20 characters")
    private String password;
}
```

**Controller Validation:**
```java
@PostMapping("/login")
public Result<Map<String, String>> login(@Valid @RequestBody LoginRequest request) {
    // Spring validation automatically triggers before method execution
}
```

### Logging

**Pattern:** Lombok `@Slf4j` with parameterized logging

```java
log.info("createBlog called - coverImage length: {}", coverImage != null ? coverImage.length() : "null");
log.warn("Business exception: code={}, message={}", e.getCode(), e.getMessage());
log.error("Unexpected error at {} {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage(), e);
```

### DTO Pattern

**Result Wrapper (from `dto/Result.java`):**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }

    public static <T> Result<T> error(int code, String message) {
        return new Result<>(code, message);
    }
}
```

### Model Pattern

**MyBatis-Plus Entity:**
```java
@Data
@TableName("users")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;
    private String password;

    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
```

---

## Cross-Cutting Concerns

### Security

**JWT Authentication:**
- Stateless session management
- BCrypt password encoding
- Token stored in Redis with 7-day expiration
- CORS configured for specific origins

**Input Sanitization:**
- Content sanitization in BlogService (strips script/iframe tags)
- URL sanitization (only allows http/https/relative/data URLs)
- Template ID regex validation: `^[A-Za-z0-9_-]+$`

### API Response Format

**Unified Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "code": 1002,
  "message": "Invalid username or password",
  "data": null
}
```

---

## Missing Conventions

1. **No ESLint/Prettier configuration** - Code formatting not enforced
2. **Mixed .tsx/.jsx extensions** - Inconsistent file extension usage
3. **No test framework configured** - No testing patterns established
4. **Debug console.log statements in production code**

---

*Convention analysis: 2026-03-21*
