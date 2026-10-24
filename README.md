# SHOP.CO --- React E-commerce Store

A modern, responsive e-commerce store built with **React, Vite, Tailwind
CSS, and React Router**.\
The project uses the **DummyJSON Products API** for product data and
implements a complete shopping experience with product browsing,
filtering, product details, cart management, and persistent cart data.

## 🚀 Live Demo

**Vercel:** https://react-ecommerce-store-f2mu.vercel.app

## 📸 Screenshots

### Home Page

![alt text](home.png)

### Products Listing

![alt text](products-list.png)

### Product Details

![alt text](product-details.png)

---

## ✨ Features

- Responsive e-commerce UI
- Hero image slider
- Featured Products section
- New Arrivals section
- Product listing page
- Dynamic product details page
- Product category filtering
- Product price filtering
- Product rating display
- Related products
- Add to Cart functionality
- Prevent duplicate cart products
- Increase/decrease product quantity
- Remove products from cart
- Cart drawer
- Cart item count in header
- Cart total price calculation
- Cart persistence using `localStorage`
- Responsive mobile navigation
- Loading states
- API error handling
- 404 Not Found page
- Responsive design for desktop, tablet, and mobile

---

## 🛠️ Tech Stack

Technology Purpose

---

React UI development
Vite Development and production build
Tailwind CSS Styling and responsive design
React Router Client-side routing
Context API Global cart state
JavaScript Application logic
Lucide React Icons
React Slick Hero slider
DummyJSON API Product data
LocalStorage Cart persistence

---

## 📁 Project Structure

```text
src/
├── assets/
│   └── images/
│
├── components/
│   ├── cart/
│   ├── home/
│   ├── layout/
│   ├── product/
│   └── ui/
│
├── context/
│   ├── CartContext.jsx
│   └── cart.js
│
├── hooks/
│   └── useCart.js
│
├── pages/
│   ├── Home.jsx
│   ├── Products.jsx
│   ├── ProductDetails.jsx
│   ├── About.jsx
│   ├── Cart.jsx
│   └── NotFound.jsx
│
├── services/
│   └── productApi.js
│
├── utils/
│
├── App.jsx
├── index.css
└── main.jsx
```

---

## 🔌 API

Product information is loaded from the DummyJSON Products API.

**API:**

```text
https://dummyjson.com/products
```

The application uses API data for:

- Product listing
- Product images
- Product title
- Product price
- Product rating
- Product category
- Product description
- Product details
- Related product sections

---

## 🛒 Cart Management

The cart is managed using **React Context API**.

### Cart flow

```text
Product
   ↓
Add to Cart
   ↓
CartContext
   ↓
Cart Items
   ↓
Cart Drawer
```

If a product already exists in the cart, another click on **Add to
Cart** does not create a duplicate item.

Products can also be removed completely from the cart.

---

## 💾 Cart Persistence

Cart data is stored in browser `localStorage`.

```text
Add Product
     ↓
Cart Context
     ↓
localStorage
     ↓
Refresh Browser
     ↓
Cart Restored
```

This allows the cart to remain available after refreshing the page.

---

## 🧭 Routes

Route Page

---

`/` Home
`/products` Product Listing
`/products/:id` Product Details
`/cart` Cart
`/about` About
`*` 404 Not Found

---

## ⚙️ Installation

Clone the repository:

```bash
git clone <https://github.com/adilcodeofduty/react-ecommerce-store.git>
```

Go to the project folder:

```bash
cd react-ecommerce-store
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown by Vite.

---

## 📦 Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🧹 Code Quality

Run ESLint:

```bash
npm run lint
```

The project is maintained with ESLint for React and JavaScript
code-quality checks.

---

## 📱 Responsive Design

The application is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile

Responsive areas include:

- Header navigation
- Mobile menu
- Hero slider
- Product grids
- Product details
- Filters
- Cart drawer
- About page
- Footer

---

## 🎯 Project Highlights

This project demonstrates practical React development concepts
including:

- Component-based architecture
- Reusable React components
- React Hooks
- Context API
- Custom Hooks
- React Router
- API integration
- Dynamic routes
- State management
- LocalStorage persistence
- Responsive Tailwind CSS
- Loading and error states
- Reusable product UI
- Production build and deployment

---

## 👨‍💻 Author

**Adil**

Frontend Developer

Built with React, Tailwind CSS, and modern frontend development
practices.

---

## 📄 License

This project is created for learning, practice, and portfolio purposes.
