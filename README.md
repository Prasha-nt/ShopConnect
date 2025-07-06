
# 🛍️ ShopConnect — Digital Platform for Local Shops  
**Empowering Small Businesses with QR-Based Online Storefronts**

---

## 📌 Overview

**ShopConnect** is a full-stack platform that enables local shopkeepers to digitize their physical stores with online profiles, product catalogs, and customer interaction tools — all accessible via QR codes. Built with modern web technologies, it ensures a smooth, app-like experience for shopkeepers, customers, and admins.

---

## 🚀 Key Features

### 🧑‍💼 Admin Panel
- ✅ Approve/reject shopkeeper registrations  
- 🔐 Grant or revoke shop creation access  
- 📊 Monitor platform analytics (visits, sales, shop activity)

### 🛠 Shopkeeper Dashboard
- 📝 Create/Edit Shop Profile: name, description, category, image, address  
- 🛒 Manage Products: title, image, price, stock, category  
- 📸 Upload art gallery/product images  
- 📈 View analytics (total visits, sales, orders)  
- 📱 Get a unique QR code for public shop URL

### 🛍 Customer Side
- 🔍 Scan QR to access shop (no login needed)  
- 📁 Browse products by category  
- 📸 View images, price, and product details  
- 🛒 Add to Cart functionality  
- 📨 Optional contact form for inquiries  

---

## 🔁 System Workflow

1. 🧑‍💼 Shopkeeper registers → 🛂 Admin reviews and approves  
2. 🧱 Shopkeeper creates digital shop + uploads products  
3. 🧾 System generates unique QR → displays in physical shop  
4. 📲 Customer scans QR → browses → adds to cart → places order  

---

## 💻 Tech Stack

| Layer         | Technology                         |
|---------------|-------------------------------------|
| **Frontend**  | React 18 + Vite + TypeScript        |
| **Styling**   | Tailwind CSS + Framer Motion        |
| **Backend**   | Supabase (PostgreSQL, Auth, Storage)|
| **State Mgmt**| Zustand                             |
| **Auth**      | Supabase Auth                       |
| **QR Code**   | `qrcode.react` / `qrcode` npm pkg   |
| **Forms**     | React Hook Form                     |
| **Toasts**    | React Hot Toast                     |

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── auth/         # Auth components (Login/Register)
│   ├── admin/        # Admin dashboard
│   ├── shopkeeper/   # Shopkeeper panel
│   ├── customer/     # Public-facing shop UI
│   ├── layout/       # Header, Sidebar, Footer etc.
│   └── ui/           # Buttons, Modals, Cards
├── lib/              # Supabase client, utils
├── stores/           # Zustand stores (Cart, Auth)
├── types/            # TypeScript types
└── App.tsx           # Main entry component
```

---

## 🔐 User Roles

### 🧑‍⚖️ Admin
- Email: `admin@example.com`
- Platform control: shop approvals, user management

### 🧑‍🔧 Shopkeeper
- Manage profile, products, gallery, and view stats  
- Receive shop-specific QR for customers

### 🧑 Customer
- Scan QR code, browse products  
- Add items to cart and place order  
- No registration required

---

## 🧪 Development

### 🔧 Setup & Run Locally

```bash
# 1. Clone repo and install
git clone https://github.com/yourusername/shopconnect.git
cd shopconnect
npm install

# 2. Setup .env
cp .env.example .env
# Add your Supabase credentials

# 3. Run dev server
npm run dev
```

### ⚙️ Scripts

```bash
npm run build       # Build for production
npm run lint        # Lint the codebase
npm run preview     # Preview production build
```

---

## 🧾 Database Schema (Supabase)

**Tables:**
- `users` – Registered users with role (admin/shopkeeper)
- `shops` – Shop profile details  
- `products` – Shop product catalog  
- `orders` – Order summary  
- `order_items` – Line items per order  
- `cart_items` – Items added by customer (session-based)

---

## 📱 UI Design & UX

- 🎨 Google-level design quality with **Tailwind CSS**
- 💫 Smooth transitions via **Framer Motion**
- 🧩 Fully responsive across all devices
- 🔍 SEO optimized and PWA-ready (optional)
- ♿ Accessible & user-friendly components

---

## 🌟 Bonus Features (Optional)

- 🛒 Cart persistence via localStorage or Supabase  
- 🔁 Order history for each shopkeeper  
- ⭐ Feedback/rating system  
- 🔔 Notifications on new order/inquiry  
- 📊 Dashboard analytics for shopkeeper/admin

---

## 🤝 Contributing

```bash
# Steps
1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Push and submit a PR
```



---

## 📬 Contact

Built with ❤️ by [Prashant Gupta](mailto:prashantg29ta@gmail.com)  
Connect on [LinkedIn](https://www.linkedin.com/in/prashant-gupta-cell/) • GitHub: [@Prasha-nt](https://github.com/prasha-nt/)
