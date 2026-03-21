-- OnePage Database Schema

CREATE DATABASE IF NOT EXISTS onepage DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE onepage;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(128) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `avatar` VARCHAR(255),
    `status` TINYINT DEFAULT 1 COMMENT '1:正常 0:禁用',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blogs table
CREATE TABLE IF NOT EXISTS `blogs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT,
    `cover_image` VARCHAR(255),
    `template_id` VARCHAR(50),
    `share_code` VARCHAR(20) UNIQUE,
    `status` TINYINT DEFAULT 1 COMMENT '1:已发布 0:草稿',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_share_code` (`share_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table (with state machine)
CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `order_no` VARCHAR(50) NOT NULL UNIQUE,
    `user_id` BIGINT NOT NULL,
    `template_id` VARCHAR(50),
    `template_name` VARCHAR(100),
    `payment_method` VARCHAR(20) COMMENT 'wechat:微信 alipay:支付宝',
    `trade_no` VARCHAR(100),
    `transaction_id` VARCHAR(100),
    `amount` DECIMAL(10,2) NOT NULL,
    `status` TINYINT DEFAULT 0 COMMENT '0:PENDING待支付 1:PAYING支付中 2:PAID已支付 3:REFUNDING退款中 4:REFUNDED已退款 5:FAILED失败 6:CANCELLED取消 7:EXPIRED过期',
    `payment_idempotent_key` VARCHAR(64),
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `pay_time` DATETIME,
    `expire_time` DATETIME COMMENT '订单过期时间',
    `remark` VARCHAR(500),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_order_no` (`order_no`),
    INDEX `idx_status` (`status`),
    INDEX `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Templates table
CREATE TABLE IF NOT EXISTS `templates` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500),
    `thumbnail` VARCHAR(255),
    `config` TEXT COMMENT '模板配置JSON',
    `category` TINYINT DEFAULT 1 COMMENT '1:个人博客 2:技术文章 3:作品展示',
    `status` TINYINT DEFAULT 1 COMMENT '1:启用 0:禁用',
    `price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '模板价格',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default templates
INSERT INTO `templates` (`name`, `description`, `category`, `status`, `price`) VALUES
('简约博客', '简洁大方的个人博客模板', 1, 1, 9.90),
('技术文章', '适合技术文档和代码展示的模板', 2, 1, 19.90),
('作品集', '展示个人作品和项目的模板', 3, 1, 29.90);
