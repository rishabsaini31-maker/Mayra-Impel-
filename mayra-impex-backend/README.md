# Mayra Impex Backend API

Production-ready backend for Mayra Impex B2B Wholesale Ordering System.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage
- **Authentication:** JWT

* **Email:** Nodemailer (Gmail SMTP)

- **WhatsApp:** Twilio API
- **PDF Generation:** PDFKit

## 📁 Project Structure

```
mayra-impex-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── supabase.js   # Supabase client
│   │   ├── email.js      # Email transporter
│   │   └── twilio.js     # Twilio client
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.js
│   │   └── validate.middleware.js
│   ├── controllers/      # Route controllers
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   ├── product.controller.js
│   │   └── order.controller.js
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   ├── category.routes.js
│   │   ├── product.routes.js
│   │   └── order.routes.js
│   ├── services/        # Business logic
│   │   ├── pdf.service.js
│   │   ├── email.service.js
│   │   └── whatsapp.service.js
│   └── utils/           # Utility functions
├── temp/                # Temporary PDF storage
├── server.js            # Application entry point
├── package.json
├── .env.example
└── database-schema.sql  # Supabase database schema
```

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd mayra-impex-backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_app_specific_password
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
ADMIN_WHATSAPP_NUMBER=whatsapp:+919876543210
FRONTEND_URL=http://localhost:19000
```

### 3. Setup Supabase Database

1. Create a new Supabase project
2. Run the SQL in `database-schema.sql` in Supabase SQL Editor
3. Create storage buckets:
   - `product-images` (Public)
   - `order-pdfs` (Public)

### 4. Configure Email (Gmail)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the app password in `EMAIL_PASS` environment variable

### 5. Configure Twilio WhatsApp

1. Sign up for Twilio: [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Get WhatsApp sandbox number or request production access
3. Add your credentials to `.env`

## 🚀 Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login (admin/customer)
- `GET /api/auth/profile` - Get user profile (Protected)

### Categories

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Products

- `GET /api/products` - Get all products (with pagination)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/upload-image` - Upload product image (Admin)

### Orders

- `POST /api/orders` - Place order (Customer)
- `GET /api/orders/my-orders` - Get customer's orders (Customer)
- `GET /api/orders/all` - Get all orders (Admin)
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status (Admin)
- `GET /api/orders/dashboard-stats` - Get dashboard statistics (Admin)

## 🔒 Security Features

- JWT authentication
- Bcrypt password hashing
- Helmet.js for HTTP headers security
- CORS configuration
- Redis-backed distributed rate limiting
- Replay attack protection (nonce + timestamp)
- Admin token revocation checks
- Input validation using Joi
- Row Level Security (RLS) in Supabase
- Environment-based configuration

### Edge Security (Nginx + Cloudflare)

- Hardened Nginx policy file: `deploy/nginx/mayra-impex-api.conf`
- Cloudflare WAF checklist: `deploy/cloudflare-security-checklist.md`
- Enforce TLS 1.2+, HSTS, strict auth/admin route rate limits at edge

## 📦 Order Flow

When a customer places an order:

1. ✅ Validate JWT token
2. ✅ Create order in database
3. ✅ Insert order items
4. ✅ Fetch product details
5. ✅ Generate PDF using PDFKit
6. ✅ Upload PDF to Supabase Storage
7. ✅ Send email with PDF attachment
8. ✅ Send WhatsApp message with order summary + PDF link
9. ✅ Clean up temporary files
10. ✅ Return success response

## 🚢 Deployment

### Deploy to Render

1. Create account on [Render](https://render.com)
2. Create new Web Service
3. Connect your Git repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables from `.env`
6. Deploy

### Deploy to Railway

1. Create account on [Railway](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Add environment variables
5. Deploy automatically

### Deploy to AWS

Use AWS Elastic Beanstalk or EC2 with PM2 process manager.

## 🧪 Testing

Test the API health:

```bash
curl http://localhost:5000/health
```

Create admin user (run SQL in Supabase):

```sql
INSERT INTO users (name, phone, password_hash, role) VALUES
('Admin', '9999999999', '$2b$10$rGHvxzqF5Kg0vd3F3Q6xqe5g5eMqGZ6mF4K1y7C3z4D5e6F7g8H9i', 'admin');
-- Password: admin123
```

## 📝 Sample API Requests

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","phone":"9876543210","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","password":"password123"}'
```

### Place Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"items":[{"product_id":"uuid","quantity":5}]}'
```

## 🐛 Troubleshooting

### Email not sending

- Verify Gmail app password is correct
- Check if 2FA is enabled
- Ensure `EMAIL_USER` and `EMAIL_PASS` are set

### WhatsApp not sending

- Verify Twilio credentials
- Check WhatsApp sandbox setup
- Ensure phone numbers are in correct format

### Database connection issues

- Verify Supabase URL and keys
- Check if database schema is created
- Ensure RLS policies don't block service role

## 📄 License

ISC

## 👨‍💻 Support

For issues and support, contact the development team.
