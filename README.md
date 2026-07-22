# BulkPing 🚀 - WhatsApp Bulk Marketing & Group Lead Extractor Tool

A powerful, full-stack **WhatsApp CRM, Bulk Marketing & Group Contact Extraction System** built with **Next.js 16**, **Express.js**, **Puppeteer / WhatsApp Web.js**, **Prisma ORM**, **MySQL**, and **Razorpay Payment Gateway**.

---

## ✨ Features

### 📲 1. WhatsApp Group Contact Extractor
- **1-Click Extraction**: Extract active contact phone numbers from any WhatsApp group you are a member of.
- **Auto Formatting**: Cleanly formats numbers with international country code (`+91...`).
- **Group Tagging**: Automatically tags extracted contacts with their **exact original WhatsApp group name** for easy targeting.
- **Export to CSV**: Download contacts directly or save them to your internal CRM contact database.

### 🚀 2. Bulk Marketing Campaigns
- **Personalized Messaging**: Use dynamic variables like `{{name}}` to personalize messages for each recipient.
- **Media Attachments**: Send images, banners, and video attachments alongside text.
- **Targeted Sending**: Filter contacts by group tags or broadcast to all saved contacts.
- **Smart Delay & Anti-Ban Rate Limiting**: Random delay intervals between messages to mimic human behavior.

### 💳 3. Freemium & Paid Pro Model (Razorpay Integrated)
- **Free Trial Tier**: Free users can send up to **5 bulk messages** to test the system.
- **PRO Plan (₹99 Lifetime)**: Instant 1-Click Razorpay payment integration unlocks **Unlimited Messaging**, media attachments, and high-priority delivery.
- **Live Razorpay Gateway**: Seamless UPI, Netbanking, Cards & QR Code checkout powered by Razorpay API.

### 🛠 4. Dashboard & WhatsApp Session Engine
- **QR Code Pairing & Persistence**: Scan QR code to connect your WhatsApp account with state persistence.
- **Fail-Safe Web Store Evaluation**: Built-in fallback accessing `WAWebCollections` directly in Puppeteer for 100% reliable group fetching.
- **Live Session Control**: Reset & Regenerate QR code anytime from the Settings panel.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js, TypeScript |
| **Automation Engine** | Puppeteer & WhatsApp-Web.js |
| **Database & ORM** | MySQL Database & Prisma ORM |
| **Payment Gateway** | Razorpay Node SDK & Checkout JS |
| **Authentication** | JWT (JSON Web Tokens) & Bcrypt password hashing |

---

## 🚀 Quick Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm / yarn / pnpm
- MySQL Database instance

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure Environment Variables
# Create a .env file inside backend/ directory:
```

Create `backend/.env`:
```env
PORT=3001
DATABASE_URL="mysql://username:password@host:3306/database_name"
JWT_SECRET="your_custom_jwt_secret_key"

# Razorpay Payment Credentials
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

```bash
# Push Database Schema to MySQL
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Start Backend Server
npm run dev
```
Backend will start on `http://localhost:3001`.

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Frontend Development Server
npm run dev
```
Frontend will start on `http://localhost:3000`.

---

## 📱 How to Use

1. **Register & Login**: Open `http://localhost:3000` and create a new account or sign in.
2. **Connect WhatsApp**: Go to **Settings** or **Group Extractor**, scan the WhatsApp QR Code with your phone.
3. **Extract Leads**: Click **Group Extractor**, pick a group, and click **Extract Contacts**. All extracted numbers will be formatted and tagged with the group name.
4. **Create & Run Campaign**: Go to **Campaigns**, click **Create Campaign**, compose your message (add media if needed), select target group, and click **Run**.
5. **Upgrade to PRO**: Click **Upgrade ₹99** in the navbar to pay via Razorpay and unlock unlimited bulk messaging!

---

## 📄 License
This project is open-source under the MIT License.
