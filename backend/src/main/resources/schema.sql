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
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `vip_status` TINYINT DEFAULT 0 COMMENT '1:VIP active 0:inactive',
    `vip_expire_time` DATETIME DEFAULT NULL COMMENT 'VIP subscription expiration',
    `robots_txt` TEXT DEFAULT NULL COMMENT 'Custom robots.txt content',
    `email_verified` TINYINT DEFAULT 0 COMMENT '1:verified 0:unverified',
    `verification_token` VARCHAR(64) DEFAULT NULL COMMENT 'UUID token for email verification',
    `verification_expires_at` DATETIME DEFAULT NULL COMMENT 'Token expiry time',
    `verification_resend_count` INT DEFAULT 0 COMMENT 'Resend count (max 3 per 24hrs)',
    `verification_resend_reset_at` DATETIME DEFAULT NULL COMMENT 'When resend count resets'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blogs table
CREATE TABLE IF NOT EXISTS `blogs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT,
    `cover_image` MEDIUMTEXT,
    `template_id` VARCHAR(50),
    `share_code` VARCHAR(20) UNIQUE,
    `status` TINYINT DEFAULT 1 COMMENT '1:已发布 0:草稿',
    `blocks` MEDIUMTEXT COMMENT 'Block editor JSON data',
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

-- User credits table
CREATE TABLE IF NOT EXISTS `user_credits` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL UNIQUE,
    `balance` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Current credits balance',
    `total_spent` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total credits spent',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PDF jobs table for tracking PDF generation
CREATE TABLE IF NOT EXISTS `pdf_jobs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `job_id` VARCHAR(50) NOT NULL UNIQUE,
    `user_id` BIGINT NOT NULL,
    `blog_id` BIGINT NOT NULL,
    `job_type` TINYINT NOT NULL COMMENT '1:preview 2:export',
    `status` TINYINT DEFAULT 0 COMMENT '0:pending 1:completed 2:failed',
    `file_path` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME,
    `expires_at` DATETIME,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_job_id` (`job_id`),
    INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Page views raw data
CREATE TABLE IF NOT EXISTS `page_views` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `blog_id` BIGINT NOT NULL,
    `visitor_fingerprint` VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash of IP + User-Agent',
    `visited_at` DATETIME NOT NULL,
    `referer` VARCHAR(500),
    `user_agent` VARCHAR(500),
    PRIMARY KEY (`id`),
    INDEX `idx_blog_visited` (`blog_id`, `visited_at`),
    INDEX `idx_visitor_fingerprint` (`visitor_fingerprint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daily aggregation table
CREATE TABLE IF NOT EXISTS `blog_daily_stats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `blog_id` BIGINT NOT NULL,
    `stat_date` DATE NOT NULL,
    `page_views` INT DEFAULT 0,
    `unique_visitors` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_blog_date` (`blog_id`, `stat_date`),
    INDEX `idx_blog_id` (`blog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SEO fields for blogs table
ALTER TABLE `blogs` ADD COLUMN `meta_title` VARCHAR(255) DEFAULT NULL COMMENT 'Custom SEO title' AFTER `content`;
ALTER TABLE `blogs` ADD COLUMN `meta_description` TEXT DEFAULT NULL COMMENT 'Custom SEO description' AFTER `meta_title`;

-- Add referer_source column to page_views for source categorization
ALTER TABLE `page_views`
ADD COLUMN `referer_source` VARCHAR(20) DEFAULT NULL
COMMENT 'DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER'
AFTER `referer`;

-- Add index for aggregation queries on source
CREATE INDEX `idx_blog_visited_source` ON `page_views` (`blog_id`, `visited_at`, `referer_source`);

-- Daily source aggregation table for pre-computed source stats
CREATE TABLE IF NOT EXISTS `blog_daily_source_stats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `blog_id` BIGINT NOT NULL,
    `stat_date` DATE NOT NULL,
    `source` VARCHAR(20) NOT NULL COMMENT 'DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER',
    `page_views` INT DEFAULT 0,
    `unique_visitors` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_blog_date_source` (`blog_id`, `stat_date`, `source`),
    INDEX `idx_blog_id` (`blog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default templates
INSERT INTO `templates` (`name`, `description`, `category`, `status`, `price`) VALUES
('简约博客', '简洁大方的个人博客模板', 1, 1, 9.90),
('技术文章', '适合技术文档和代码展示的模板', 2, 1, 19.90),
('作品集', '展示个人作品和项目的模板', 3, 1, 29.90);
