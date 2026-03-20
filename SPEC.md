# 单页建站平台 - 项目规格说明书

## 1. 项目概述

### 1.1 项目名称和目标
- **项目名称**: 单页建站平台 (OnePage)
- **项目目标**: 帮助不会代码的用户，通过上传一张图片即可自动生成个人博客网站，并支持生成分享链接

### 1.2 核心价值定位
- **零代码**: 用户无需任何编程知识即可创建个人博客
- **AI驱动**: 智能图片美化与网站内容生成
- **快速部署**: 上传图片后即时生成可访问的博客网站
- **社交分享**: 生成专属链接，方便在社交媒体分享

### 1.3 目标用户群体
- 个人博主、内容创作者
- 不想学习代码但希望拥有个人网站的用户
- 设计师、摄影师等视觉工作者展示作品集
- 轻度用户希望快速搭建临时展示页面

---

## 2. 技术架构

### 2.1 整体技术栈
```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (React + TypeScript)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                    后端 (SpringBoot3 + Java17)               │
│                         API Gateway                          │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │   MySQL     │   │   Redis     │   │  RabbitMQ   │
    │  (主数据库)  │   │   (缓存)    │   │   (队列)    │
    └─────────────┘   └─────────────┘   └─────────────┘
            │                                 │
            ▼                                 ▼
    ┌─────────────────────────────────────────────────┐
    │              第三方服务                         │
    │    - AI生图API (图片美化/内容生成)              │
    │    - 支付网关 (微信/支付宝)                     │
    └─────────────────────────────────────────────────┘
```

### 2.2 前端技术选型
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| React Router | 6.x | 路由管理 |
| Zustand | 4.x | 状态管理 |
| Axios | 1.x | HTTP请求 |
| TailwindCSS | 3.x | 样式框架 |

### 2.3 后端技术选型
| 技术 | 版本 | 用途 |
|------|------|------|
| Spring Boot | 3.2.x | 框架 |
| Java | 17 | 语言 |
| MyBatis-Plus | 3.5.x | ORM |
| Lombok | 1.18.x | 简化代码 |
| JWT | 0.12.x | 认证 |
| Spring Security | 6.x | 安全 |

### 2.4 中间件选型
| 中间件 | 版本 | 用途 |
|--------|------|------|
| MySQL | 8.0 | 主数据库 |
| Redis | 7.x | 缓存/会话 |
| RabbitMQ | 3.12 | 消息队列 |

---

## 3. 功能模块

### 3.1 用户模块

#### 3.1.1 注册
- 邮箱注册（必填）
- 密码要求：8-20位，包含字母和数字
- 注册成功后自动登录

#### 3.1.2 登录
- 邮箱+密码登录
- JWT Token有效期7天
- 刷新Token机制

#### 3.1.3 忘记密码
- 通过邮箱验证重置密码
- 发送重置链接到用户邮箱

### 3.2 图片上传模块

#### 3.2.1 支持格式
- JPG/JPEG
- PNG
- WebP
- GIF (静态)

#### 3.2.2 大小限制
- 最大文件大小: 10MB
- 最小文件大小: 100KB

#### 3.2.3 上传流程
1. 前端选择图片文件
2. 前端进行图片预览和基本验证
3. 调用后端上传接口
4. 后端保存到本地存储/OSS
5. 返回图片URL

### 3.3 AI图片美化模块

#### 3.3.1 功能
- 智能图片增强（亮度、对比度、色彩优化）
- 自动裁剪为网站适配比例 (16:9, 4:3, 1:1)
- 图片风格迁移（可选）

#### 3.3.2 处理流程
1. 用户上传原图
2. 选择是否AI美化
3. 调用AI API进行处理
4. 返回美化后的图片URL
5. 用户确认或重新生成

### 3.4 模板选择模块

#### 3.4.1 模板类型
- **免费模板**: 基础博客样式
- **付费模板**: 高级设计样式（需购买）

#### 3.4.2 模板分类
- 极简风格 (Minimal)
- 摄影画廊 (Gallery)
- 文字博客 (Blog)
- 作品集 (Portfolio)

### 3.5 网站生成模块

#### 3.5.1 生成流程
1. 用户上传图片
2. 选择模板
3. 填写博客标题和简介
4. 系统自动生成网站
5. 实时预览效果

#### 3.5.2 实时预览
- 移动端/平板/桌面端预览
- 模板切换实时更新

### 3.6 分享链接模块

#### 3.6.1 链接生成规则
- 格式: `https://onepage.app/u/{username}/{blog-id}`
- 唯一性: 每个博客对应唯一链接

#### 3.6.2 访问控制
- 公开访问（默认）
- 密码保护（可选）

### 3.7 支付模块

#### 3.7.1 支持方式
- 微信支付
- 支付宝

#### 3.7.2 付费内容
- 高级模板购买 (9.9元/个)
- VIP会员 (29.9元/月)

### 3.8 订单管理模块

#### 3.8.1 功能
- 查看购买记录
- 订单状态查询
- 发票申请

---

## 4. API接口设计

### 4.1 基础路径
```
Base URL: /api/v1
```

### 4.2 用户相关接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /auth/register | 用户注册 | 否 |
| POST | /auth/login | 用户登录 | 否 |
| POST | /auth/logout | 用户登出 | 是 |
| POST | /auth/refresh | 刷新Token | 是 |
| POST | /auth/forgot-password | 忘记密码 | 否 |
| POST | /auth/reset-password | 重置密码 | 否 |
| GET | /user/profile | 获取用户信息 | 是 |
| PUT | /user/profile | 更新用户信息 | 是 |

### 4.3 图片上传接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /upload/image | 上传图片 | 是 |
| DELETE | /upload/image/{id} | 删除图片 | 是 |

### 4.4 博客生成接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /blogs | 创建博客 | 是 |
| GET | /blogs | 获取博客列表 | 是 |
| GET | /blogs/{id} | 获取博客详情 | 是 |
| PUT | /blogs/{id} | 更新博客 | 是 |
| DELETE | /blogs/{id} | 删除博客 | 是 |
| POST | /blogs/{id}/generate | 触发生成 | 是 |
| GET | /blogs/{id}/preview | 预览博客 | 是 |

### 4.5 模板相关接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /templates | 获取模板列表 | 否 |
| GET | /templates/{id} | 获取模板详情 | 否 |
| GET | /templates/{id}/preview | 预览模板 | 否 |

### 4.6 支付相关接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /payment/create-order | 创建订单 | 是 |
| GET | /payment/order/{id} | 查询订单 | 是 |
| POST | /payment/callback | 支付回调 | 否 |
| GET | /orders | 订单列表 | 是 |

### 4.7 公共接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /public/blog/{shareCode} | 访问公开博客 | 否 |

---

## 5. 数据库设计

### 5.1 用户表 (users)

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    status TINYINT DEFAULT 1 COMMENT '1:正常 0:禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);
```

### 5.2 博客表 (blogs)

```sql
CREATE TABLE blogs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(500),
    template_id BIGINT NOT NULL,
    content JSON,
    share_code VARCHAR(32) NOT NULL UNIQUE,
    is_public TINYINT DEFAULT 1 COMMENT '1:公开 0:私有',
    password_protected TINYINT DEFAULT 0,
    password VARCHAR(100),
    status TINYINT DEFAULT 0 COMMENT '0:草稿 1:已发布',
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_share_code (share_code),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 5.3 模板表 (templates)

```sql
CREATE TABLE templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    thumbnail_url VARCHAR(500),
    preview_urls JSON,
    category VARCHAR(50),
    is_premium TINYINT DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0.00,
    config JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_is_premium (is_premium)
);
```

### 5.4 订单表 (orders)

```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_no VARCHAR(64) NOT NULL UNIQUE,
    template_id BIGINT,
    product_type TINYINT NOT NULL COMMENT '1:模板 2:VIP',
    product_name VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TINYINT COMMENT '1:微信 2:支付宝',
    trade_no VARCHAR(100),
    status TINYINT DEFAULT 0 COMMENT '0:待支付 1:已支付 2:已取消 3:已退款',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL
);
```

---

## 6. 消息队列设计

### 6.1 RabbitMQ队列设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Exchange: onepage.direct                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ image.process │   │ blog.generate │   │ notify.user   │
│  (图片处理)    │   │   (博客生成)   │   │    (通知)      │
└───────────────┘   └───────────────┘   └───────────────┘
```

### 6.2 队列说明

| 队列名 | 交换机 | 路由键 | 用途 |
|--------|--------|--------|------|
| image.process | onepage.direct | image.process | 图片AI美化处理 |
| blog.generate | onepage.direct | blog.generate | 博客生成任务 |
| notify.user | onepage.direct | notify.user | 站内通知推送 |

### 6.3 用户排队生成流程

```
用户上传图片 → 请求入队(image.process) → AI服务处理 →
生成完成 → 入队(blog.generate) → 生成网页 →
完成 → 通知用户(notify.user)
```

### 6.4 消息格式

```json
// image.process 消息
{
    "taskId": "uuid",
    "userId": 12345,
    "imageUrl": "https://...",
    "operation": "enhance|crop|style",
    "options": {
        "aspectRatio": "16:9",
        "style": "minimal"
    }
}

// blog.generate 消息
{
    "taskId": "uuid",
    "blogId": 67890,
    "templateId": 1,
    "coverImageUrl": "https://...",
    "content": {
        "title": "我的博客",
        "description": "..."
    }
}
```

---

## 7. 缓存设计

### 7.1 Redis缓存热点博客模板

```
┌─────────────────────────────────────────────────────────────┐
│                      Redis Keys                             │
├─────────────────────────────────────────────────────────────┤
│ template:list:active         - 所有启用的模板列表            │
│ template:hot:{category}     - 热门模板(按分类)              │
│ template:{id}               - 单个模板详情                   │
│ blog:preview:{id}           - 博客预览HTML缓存               │
│ user:session:{token}        - 用户会话信息                   │
│ user:vip:{userId}           - 用户VIP状态                    │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 缓存策略

| Key类型 | 过期时间 | 策略 |
|---------|----------|------|
| template:list:active | 1小时 | LRU淘汰 |
| template:hot:{category} | 30分钟 | LRU淘汰 |
| template:{id} | 24小时 | LRU淘汰 |
| blog:preview:{id} | 10分钟 | LRU淘汰 |
| user:session:{token} | 7天 | 定时过期 |
| user:vip:{userId} | 1小时 | 定时过期 |

### 7.3 缓存更新策略

- **模板列表**: 管理员修改模板后主动刷新
- **博客预览**: 博客内容更新后删除缓存
- **用户会话**: 登出时主动删除

---

## 8. AI图片美化方案

### 8.1 集成方案

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   用户上传   │ ──▶ │  我们的API   │ ──▶ │  AI生图API  │
│   原图       │     │  代理服务    │     │  (第三方)    │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  处理结果    │
                   │  返回前端    │
                   └─────────────┘
```

### 8.2 API接口设计

```
POST /api/v1/ai/image/enhance
请求:
{
    "imageUrl": "https://...",
    "operation": "enhance",
    "options": {
        "aspectRatio": "16:9",
        "brightness": 1.1,
        "contrast": 1.05,
        "saturation": 1.0
    }
}

响应:
{
    "code": 0,
    "data": {
        "taskId": "uuid",
        "status": "processing|completed|failed"
    }
}

GET /api/v1/ai/image/result/{taskId}

响应:
{
    "code": 0,
    "data": {
        "imageUrl": "https://...",
        "width": 1920,
        "height": 1080
    }
}
```

### 8.3 AI处理能力

| 功能 | 描述 | 处理时间 |
|------|------|----------|
| 图片增强 | 智能调整亮度/对比度/色彩 | 3-5秒 |
| 智能裁剪 | 自动裁剪为指定比例 | 2-3秒 |
| 风格迁移 | 应用艺术风格 | 5-10秒 |
| 超分放大 | 2x放大提升清晰度 | 8-12秒 |

---

## 9. 支付模块设计

### 9.1 支付流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  用户选择    │ ──▶ │  创建订单   │ ──▶ │  发起支付   │
│  付费模板    │     │  (我们的服务器)│     │  (支付网关) │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  更新订单状态 │ ◀── │  支付回调   │
                    │  开通VIP/权限 │     │  (异步通知) │
                    └─────────────┘     └─────────────┘
```

### 9.2 回调处理

```
POST /api/v1/payment/callback
微信支付:
{
    "orderNo": "ORDER_xxx",
    "tradeNo": "xxx",
    "tradeStatus": "SUCCESS",
    "totalFee": 999,
    "sign": "xxx"
}

处理流程:
1. 验签(Signature verification)
2. 更新订单状态
3. 开通对应权限
4. 发送通知给用户
5. 返回成功响应给支付网关
```

### 9.3 支付状态

| 状态码 | 描述 |
|--------|------|
| 0 | 待支付 |
| 1 | 已支付 |
| 2 | 已取消 |
| 3 | 已退款 |
| 4 | 支付失败 |

---

## 10. 模板系统设计

### 10.1 模板结构

```json
{
    "id": 1,
    "name": "极简博客",
    "slug": "minimal-blog",
    "thumbnail": "https://...",
    "config": {
        "layout": "single-column",
        "colorScheme": {
            "primary": "#333333",
            "background": "#ffffff",
            "text": "#666666"
        },
        "fonts": {
            "heading": "Inter",
            "body": "Inter"
        },
        "sections": [
            {
                "type": "hero",
                "props": {
                    "height": "60vh",
                    "overlay": true
                }
            },
            {
                "type": "content",
                "props": {
                    "maxWidth": "800px"
                }
            },
            {
                "type": "gallery",
                "props": {
                    "columns": 3,
                    "gap": "16px"
                }
            }
        ]
    }
}
```

### 10.2 模板类型

| 类型 | 布局 | 适用场景 |
|------|------|----------|
| Minimal | 单栏 | 文字博客 |
| Gallery | 网格 | 摄影作品 |
| Portfolio | 侧边栏+网格 | 个人作品集 |
| Magazine | 多栏 | 杂志风内容 |

### 10.3 组件库

| 组件 | 用途 |
|------|------|
| Hero | 首屏大图/标题区 |
| Navigation | 导航菜单 |
| Content | 文字内容区 |
| Gallery | 图片画廊 |
| Contact | 联系方式表单 |
| SocialLinks | 社交媒体链接 |
| Footer | 页脚信息 |

---

## 附录

### 错误码规范

| 错误码区间 | 模块 |
|------------|------|
| 1000-1999 | 认证模块 |
| 2000-2999 | 用户模块 |
| 3000-3999 | 博客模块 |
| 4000-4999 | 模板模块 |
| 5000-5999 | 支付模块 |
| 6000-6999 | AI模块 |
| 9000-9999 | 系统错误 |

### 安全要求

- 所有密码使用BCrypt加密存储
- 接口请求需携带有效JWT Token
- 图片上传需进行内容安全检测
- 敏感操作需二次验证
- API接口需进行Rate Limiting限制

### 性能目标

- 首页加载时间 < 2秒
- 图片上传到处理完成 < 10秒
- API接口平均响应时间 < 200ms
- 支持10000+并发用户
