# Backend API Server - Hyper-Local Delivery Dispatcher

This is the Node.js Express server backend for the **Hyper-Local Delivery Dispatcher** management application. It communicates with MongoDB using Mongoose and establishes real-time event broadcasting using Socket.IO.

## 🛠️ Tech Stack & Dependencies

- **Node.js & Express**: API engine
- **MongoDB & Mongoose**: Database modeling
- **Socket.IO**: Real-time WebSocket connection engine
- **JWT (jsonwebtoken) & Bcryptjs**: Token verification and secure password hashing
- **Cookie-Parser & Cors**: Header and cookie authorization security

---

## 📁 Key File Structure

```
Backend/
├── APIs/
│   ├── authAPI.js          # Authentication router (/register, /login, /logout, /me)
│   ├── orderAPI.js         # Order CRUD & status dispatcher (/api/orders)
│   ├── locationAPI.js      # Coordinates updates listener (/api/location)
│   ├── earningsAPI.js      # Payout ledger endpoints (/api/earnings)
│   ├── adminAPI.js         # Admin legacy actions (stats, block riders)
│   └── riderAPI.js         # Rider legacy actions (available orders)
├── Models/
│   ├── UserModel.js        # User model with role configurations & location indexes
│   ├── OrderModel.js       # Order customer information and coordinates
│   ├── RiderLocationModel.js# Live tracking rider lookup table
│   └── EarningsModel.js    # Rider transaction history ledger
├── Middleware/
│   ├── VerifyToken.js      # Protect routes and decode JWT
│   └── CheckAdmin.js       # Assert role is Admin
└── server.js               # Express application and Socket.IO initialization
```

---

## 🔒 API Specifications Reference

### 🔐 Authentication Router (`/api/auth`)
- `POST /register`: Registers a new user. Body: `{ name, email, password, role, phone }`.
- `POST /login`: Log in user. Sets HTTP-Only cookies `accessToken` and `refreshToken` and returns payload `{ success, user, token }`.
- `POST /logout`: Clears tokens cookies.
- `GET /me`: Returns the current user profile (requires valid JWT).

### 📋 Orders Router (`/api/orders`)
- `POST /`: Creates a delivery order, finds nearby riders, and sets status to `pending` (Admin).
- `GET /`: Retrieve all orders. Accepts query filters: `?status=delivered&search=locality` (Admin/Rider).
- `PUT /:id`: Edit order customer name, address, or details (Admin).
- `DELETE /:id`: Cancel/delete order, resets assigned rider availability (Admin).
- `PUT /assign/:id`: Manually assign a specific rider. Body: `{ riderId }` (Admin).
- `PUT /status/:id`: Update order status. Body: `{ status }`. (If status becomes `delivered`, rewards the rider ₹50 and logs it in the Earnings schema).

### 📍 Location Router (`/api/location`)
- `POST /update`: Expects coordinate body: `{ latitude, longitude }`. Saves coordinates and emits socket broadcast `rider:location-update` (Rider).
- `GET /:riderId`: Retrieve the last cached coordinates for a specific rider.

### 💰 Earnings Router (`/api/earnings`)
- `GET /:riderId`: Computes completed deliveries, overall payout, today's accumulated payout, and logs transaction history tables (Admin/Rider).

---

## ⚡ WebSocket Protocols (Socket.IO)

The server listens and emits events to synchronise client states:

1. **`rider:location-update`**: Emitted by backend when a rider uploads location. Broadcasts `{ riderId, latitude, longitude, updatedAt }` globally to update Leaflet trackers.
2. **`order:status-changed`**: Emitted by backend when order status is modified, forcing Admin order tables to refresh.
3. **`order:new-assigned`**: Emitted when admin creates or dispatches an order to notify nearby riders.

---

## 🛠️ Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file at the root of the `Backend/` directory:
   ```env
   PORT=4000
   DB_URL=mongodb://localhost:27017/hyperdelivery
   SECRET_KEY=your_secure_jwt_secret_key_here
   ```

3. **Start Database Server**:
   Make sure a local instance of MongoDB is running on port 27017.

4. **Start Server**:
   ```bash
   node server.js
   ```
   The console will output:
   `DB connection success`
   `Server started on port 4000`
