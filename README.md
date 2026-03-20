# Vibe Onepage

> Create your stunning single-page website in seconds. Upload an image, choose a template, and share your unique link with the world.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Spring%20Boot-3-6DB33F?style=for-the-badge&logo=spring" alt="Spring Boot">
</p>

---

## ✨ Features

### 🎨 AI-Powered Design
- **Smart Image Analysis** - Upload any image and our AI extracts colors, style, and mood
- **Auto Template Matching** - We find the perfect template for your content
- **One-Click Generation** - No coding required, just upload and go

### 🎯 Beautiful Templates
- **6+ Handcrafted Templates** - Professionally designed for every style
- **Free & Premium Options** - Start free, upgrade for advanced features
- **Fully Customizable** - Edit content, colors, and layout

### 🚀 Modern Tech Stack
- **Lightning Fast** - Built with React 18 and Vite
- **Real-time Preview** - See your changes instantly
- **Responsive Design** - Perfect on any device

### 💳 Secure Payments
- **Multiple Payment Methods** - WeChat Pay, Alipay, and more
- **Order Tracking** - Full order management system
- **Secure Transactions** - Encrypted payment processing

### 🔗 Share Anywhere
- **Unique Share Links** - Every page gets its own link
- **Social Media Ready** - Share to Weibo, Twitter, Facebook
- **QR Code Generation** - Easy mobile access

---

## 🎨 Templates

| Template | Style | Price |
|----------|-------|-------|
| Minimal | Clean, single-column layout | Free |
| Gallery | Image-focused grid | Free |
| Vintage | Warm retro aesthetic | $9.9 |
| Ultra | Maximum whitespace | $9.9 |
| Creative | Card-based creative | $19.9 |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation

### Backend
- **Spring Boot 3** - Java framework
- **MyBatis-Plus** - ORM
- **JWT** - Authentication

### Infrastructure
- **MySQL 8** - Primary database
- **Redis** - Caching
- **RabbitMQ** - Message queue

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Java 17+
- MySQL 8+
- Redis
- RabbitMQ

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/AnnaXChun/onepage.git
cd onepage

# Install frontend dependencies
cd frontend
npm install

# Build frontend
npm run build
```

### Backend Setup

```bash
cd backend

# Configure database connection
# Edit src/main/resources/application.yml

# Build and run
mvn clean package
mvn spring-boot:run
```

### Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080

---

## 📱 Screenshots

### Landing Page
Modern dark theme with gradient effects and smooth animations.

### Template Selection
Browse beautifully crafted templates with live previews.

### Payment Flow
Clean checkout with QR code scanning support.

---

## 🌐 API Endpoints

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/register` | Register new user |
| POST | `/api/user/login` | User login |
| GET | `/api/user/info` | Get user info |

### Blog
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/blog/create` | Create blog |
| GET | `/api/blog/share/{code}` | Get by share code |
| GET | `/api/blog/list` | List user blogs |

### Payment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create` | Create order |
| POST | `/api/payment/qrcode` | Get payment QR code |
| GET | `/api/payment/status/{orderNo}` | Query status |

---

## 🔐 Order Status Flow

```
PENDING → PAYING → PAID → REFUNDING → REFUNDED
   ↓        ↓
CANCELLED  FAILED
```

---

## 📄 License

MIT License - feel free to use for personal and commercial projects.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📬 Contact

- **GitHub Issues** - Bug reports and feature requests
- **Email** - contact@vibepage.com

---

<p align="center">
  <strong>Made with ❤️ by Vibe Team</strong>
  <br>
  <sub>© 2024 Vibe Onepage. All rights reserved.</sub>
</p>
