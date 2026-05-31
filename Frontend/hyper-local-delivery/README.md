# Frontend Client - Hyper-Local Delivery Dispatcher

This is the Vite-based React client for the **Hyper-Local Delivery Dispatcher** management tool.

## 🚀 Tech Stack

- **React.js (v19)**: Component-driven view layer
- **Zustand**: Clean state management for authentication
- **React Router (v7)**: SPA client-side routing
- **Tailwind CSS (v4)**: Rapid design and styling utility framework
- **Leaflet & React-Leaflet**: Renders maps with custom markers showing store location, rider coordinates, and customer delivery points
- **Axios**: HTTP requests with an automated request interceptor attaching the JWT token
- **Socket.IO Client**: Listens to live location updates and status synchronization broadcasts

---

## 📁 Key File Structure

```
src/
├── components/
│   ├── Login.jsx               # Login form with user role redirection
│   ├── Register.jsx            # Account sign-up for Admins and Riders
│   ├── AdminDashboard.jsx      # Store owner statistics, recent orders, and rider lists
│   ├── RiderDashboard.jsx      # Rider tasks, actions, and GPS tracking toggles
│   ├── Orders.jsx              # Order CRUD, status sorting tabs, search, and rider assignment
│   ├── MyOrders.jsx            # Rider active tasks list & accept/reject panel
│   ├── LiveTracking.jsx        # Admin map view with live WebSocket updates
│   ├── Earnings.jsx            # Rider financial dashboard & completed orders logs
│   ├── ProtectedRoute.jsx      # Prevents unauthorized access based on user role
│   ├── RootLayout.jsx          # Header, Sidebar navigation, and content wrapper layout
│   └── Header.jsx / Sidebar.jsx# Custom premium navigation components
├── store/
│   └── authstore.js            # Zustand store calling backend APIs and syncing state
├── api.js                      # Axios instance configured with baseURL and JWT interceptor
├── App.jsx                     # Route definitions using createBrowserRouter
└── main.jsx                    # Application entry point
```

---

## 🛠️ Installation & Setup

1. **Install Dependencies**:
   Ensure you are in the `Frontend/hyper-local-delivery` directory:
   ```bash
   npm install
   ```

2. **Configure Host**:
   Axios is configured by default to target `http://localhost:4000`. You can change this baseURL inside [api.js](file:///Users/dhanvishah/Downloads/Hyper-Local-Delivery/Frontend/hyper-local-delivery/src/api.js) if your backend port differs.

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open the browser at `http://localhost:5173`.

4. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## 🛵 Live Location Tracking Logic
The Rider Dashboard tracks geolocation using `navigator.geolocation.getCurrentPosition`. 
- When the rider toggles **"Start Location Sharing"**, a 5-second interval timer fires.
- The browser fetches coordinates and makes a `POST` request to `/api/location/update`.
- The backend stores this and broadcasts it via Socket.IO.
- The Admin's `LiveTracking.jsx` catches the event and transitions the rider marker coordinate in real-time.
