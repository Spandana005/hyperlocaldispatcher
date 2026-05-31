import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  Tooltip,
} from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import API, { getShopLocation, saveShopLocation } from "../api";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Navigation, 
  Users, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Sun, 
  Moon, 
  Maximize2, 
  Minimize2, 
  Activity,
  Phone,
  Clock,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Sliders,
  Store,
  Map as MapIcon,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";

// ============================
// FIX LEAFLET DEFAULT ICON
// ============================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ============================
// CUSTOM MARKER CREATION (SVG PINS)
// ============================
const createCustomIcon = (color, text = "📍") => {
  return new L.DivIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-${color}-500/30 animate-ping"></div>
        <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border-2 border-${color}-500 transition-all duration-300 hover:scale-110">
          <span style="font-size: 16px;">${text}</span>
        </div>
        <div class="absolute -bottom-2 w-0 h-0 border-t-[8px] border-t-white border-x-[6px] border-x-transparent shadow-md"></div>
      </div>
    `,
    className: "custom-leaflet-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

const shopIcon = createCustomIcon("blue", "🏪");
const customerIcon = createCustomIcon("red", "👤");
const riderIcon = createCustomIcon("green", "🛵");

// ============================
// COMPONENT: AUTO FIT BOUNDS
// ============================
const FitBounds = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 0) {
      const validCoords = markers.filter(m => m && m[0] && m[1]);
      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [markers]);
  return null;
};

// ============================
// COMPONENT: CLICK HANDLER FOR MAP SHOP SETUP
// ============================
const MapClickHandler = ({ isEditing, onMapClick }) => {
  useMapEvents({
    click(e) {
      if (isEditing) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
};

// ============================
// MAIN COMPONENT
// ============================
const LiveTracking = () => {
  // Database States
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [stats, setStats] = useState({
    activeRiders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    blockedRiders: 0
  });

  // Shop Setup/Edit States
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopCoords, setShopCoords] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Focus Map State
  const [focusedLocation, setFocusedLocation] = useState(null);

  // Side Panel Toggle/Views
  const [activeTab, setActiveTab] = useState("orders"); // "orders", "riders", "shop"
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRider, setSelectedRider] = useState(null);

  // Live Socket/Tracking States
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mapContainerRef = useRef(null);

  // ============================
  // LOAD DATA & STATS
  // ============================
  const loadDashboardData = async () => {
    try {
      // 1. Shop Location
      const shopRes = await getShopLocation();
      if (shopRes.data.success && shopRes.data.shop) {
        setShop(shopRes.data.shop);
        setShopCoords([shopRes.data.shop.latitude, shopRes.data.shop.longitude]);
        setShopName(shopRes.data.shop.shopName);
        setShopAddress(shopRes.data.shop.address || "");
      } else {
        setShop(null);
        setShopCoords(null);
      }

      // 2. Orders
      const ordersRes = await API.get("/api/orders");
      setOrders(ordersRes.data);

      // 3. Riders
      const ridersRes = await API.get("/api/admin/riders");
      setRiders(ridersRes.data);

      // 4. Calculate Stats
      const activeRCount = ridersRes.data.filter(r => r.isActive && !r.isBlocked).length;
      const pendingOCount = ordersRes.data.filter(o => ["pending", "assigned", "accepted", "dispatched"].includes(o.status.toLowerCase())).length;
      const deliveredOCount = ordersRes.data.filter(o => o.status.toLowerCase() === "delivered").length;
      const blockedRCount = ridersRes.data.filter(r => !r.isActive || r.isBlocked).length;

      setStats({
        activeRiders: activeRCount,
        pendingOrders: pendingOCount,
        deliveredOrders: deliveredOCount,
        blockedRiders: blockedRCount
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading tracking stats:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  // ============================
  // SOCKET CONNECTION
  // ============================
  useEffect(() => {
    const socket = io("http://localhost:4000");

    socket.on("connect", () => {
      console.log("Admin real-time tracker connected to WebSocket");
    });

    // Handle Live GPS updates
    socket.on("rider:location-update", (data) => {
      console.log("WebSocket live rider coordinate update:", data);
      
      // Instantly update the coordinates of the rider in state
      setRiders(prevRiders => 
        prevRiders.map(rider => {
          if (rider._id === data.riderId) {
            return {
              ...rider,
              location: {
                type: "Point",
                coordinates: [data.longitude, data.latitude]
              },
              speed: data.speed || Math.floor(Math.random() * 20) + 15,
              updatedAt: new Date()
            };
          }
          return rider;
        })
      );

      // Also update any orders assigned to this rider
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.assignedRider && (order.assignedRider._id === data.riderId || order.assignedRider === data.riderId)) {
            return {
              ...order,
              riderLocation: {
                lat: data.latitude,
                lng: data.longitude
              }
            };
          }
          return order;
        })
      );
    });

    // Handle live order additions or status modifications
    socket.on("order:status-changed", (updatedOrder) => {
      console.log("WebSocket order updated:", updatedOrder);
      setOrders(prevOrders => {
        const index = prevOrders.findIndex(o => o._id === updatedOrder._id);
        if (index > -1) {
          const updated = [...prevOrders];
          updated[index] = { ...updated[index], ...updatedOrder };
          return updated;
        } else {
          return [updatedOrder, ...prevOrders];
        }
      });
      loadDashboardData();
    });

    socket.on("order:new-assigned", (newOrder) => {
      console.log("WebSocket new order assigned:", newOrder);
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      loadDashboardData();
    });

    socket.on("admin:rider-blocked-delivery-unassigned", (data) => {
      toast.error(data.message, { duration: 6000 });
      loadDashboardData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ============================
  // NOMINATIM GEOCODING (FREE AUTOCOMPLETE)
  // ============================
  const handleSearchLocation = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        setShopCoords([lat, lon]);
        setShopAddress(first.display_name);
        setFocusedLocation([lat, lon]);
        toast.success("Found matching location!");
      } else {
        toast.error("Location not found.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setShopAddress(data.display_name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMapClick = (coords) => {
    setShopCoords(coords);
    handleReverseGeocode(coords[0], coords[1]);
  };

  // ============================
  // SAVE SHOP ACTION
  // ============================
  const handleSaveShopLocation = async () => {
    if (!shopName || !shopCoords) {
      toast.error("Please enter shop name and select a location on the map.");
      return;
    }

    try {
      const res = await saveShopLocation({
        shopName,
        latitude: shopCoords[0],
        longitude: shopCoords[1],
        address: shopAddress,
      });

      if (res.data.success) {
        toast.success("Shop location updated successfully!");
        setShop(res.data.shop);
        setIsEditingShop(false);
      } else {
        toast.error("Failed to save shop location.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update shop location.");
    }
  };

  // ============================
  // STATUS MANAGEMENT (ORDER)
  // ============================
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await API.put(`/api/orders/status/${orderId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order status");
    }
  };

  // ============================
  // BLOCKED RIDER ACTIONS
  // ============================
  const handleBlockRider = async (riderId) => {
    try {
      const res = await API.put(`/api/admin/block-rider/${riderId}`);
      toast.success(res.data.message || "Rider blocked successfully");
      loadDashboardData();
      if (selectedRider && selectedRider._id === riderId) {
        setSelectedRider(prev => ({ ...prev, isActive: false, isBlocked: true }));
      }
    } catch (err) {
      toast.error("Failed to block rider");
    }
  };

  const handleUnblockRider = async (riderId) => {
    try {
      const res = await API.put(`/api/admin/unblock-rider/${riderId}`);
      toast.success(res.data.message || "Rider unblocked successfully");
      loadDashboardData();
      if (selectedRider && selectedRider._id === riderId) {
        setSelectedRider(prev => ({ ...prev, isActive: true, isBlocked: false }));
      }
    } catch (err) {
      toast.error("Failed to unblock rider");
    }
  };

  // ============================
  // FULLSCREEN TOGGLE
  // ============================
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (mapContainerRef.current.requestFullscreen) {
        mapContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // ============================
  // MAP ZOOM & FLY TO FUNCTION
  // ============================
  const FlyToActive = ({ location }) => {
    const map = useMap();
    useEffect(() => {
      if (location) {
        map.flyTo(location, 17, { duration: 1.5 });
      }
    }, [location]);
    return null;
  };

  // Map markers collection for fitbounds
  const getMapMarkers = () => {
    const list = [];
    if (shopCoords) list.push(shopCoords);
    orders.forEach(order => {
      if (order.deliveryAddress?.lat && order.deliveryAddress?.lng && 
          ["pending", "assigned", "accepted", "dispatched"].includes(order.status.toLowerCase())) {
        list.push([order.deliveryAddress.lat, order.deliveryAddress.lng]);
      }
    });
    riders.forEach(rider => {
      if (rider.isActive && !rider.isBlocked && rider.location?.coordinates?.[1] && rider.location?.coordinates?.[0]) {
        list.push([rider.location.coordinates[1], rider.location.coordinates[0]]);
      }
    });
    return list;
  };

  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-140px)] w-full gap-5 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR: ANALYTICS CARDS & SHOP MANAGEMENT */}
      <div className="w-full xl:w-96 flex flex-col gap-5 shrink-0 overflow-y-auto pr-1">
        {/* Page title */}
        <div className="flex justify-between items-center bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
              Live Dispatch Tracker
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Real-time GPS Delivery Ops</p>
          </div>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>

        {/* Analytics Card grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Shop Config</p>
              <p className="text-sm font-extrabold text-gray-800">{shop ? "Active" : "Not Set"}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Active Riders</p>
              <p className="text-lg font-black text-gray-800">{stats.activeRiders}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Active Orders</p>
              <p className="text-lg font-black text-gray-800">{stats.pendingOrders}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Blocked Riders</p>
              <p className="text-lg font-black text-gray-800">{stats.blockedRiders}</p>
            </div>
          </div>
        </div>

        {/* Shop Settings Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4 text-blue-500" />
              Shop Permanent Spot
            </h2>
            {shop && !isEditingShop && (
              <button 
                onClick={() => setIsEditingShop(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-all"
              >
                Change Shop
              </button>
            )}
          </div>

          {!shop || isEditingShop ? (
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-200">
              <p className="text-xs font-bold text-gray-500">
                Setup your shop. Drag the blue pin or search address below.
              </p>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchLocation()}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-blue-400"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
                <button
                  onClick={handleSearchLocation}
                  disabled={isSearching}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 disabled:bg-blue-400 transition-all"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Find"}
                </button>
              </div>

              <input
                type="text"
                placeholder="Shop Name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-2 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-blue-400"
              />

              <textarea
                placeholder="Shop Location Address details"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full p-2 py-2 text-xs border border-gray-200 rounded-xl outline-none h-16 focus:border-blue-400 resize-none"
              />

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveShopLocation}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Save Spot
                </button>
                {shop && (
                  <button
                    onClick={() => setIsEditingShop(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/20 p-4 rounded-2xl border border-blue-50 flex gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-xl h-fit shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-gray-800 text-sm truncate">{shop.shopName}</h4>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-1 line-clamp-3">
                  {shop.address || "No address details available."}
                </p>
                <div className="flex gap-4 mt-2 text-[10px] font-bold text-blue-600">
                  <span>Lat: {shop.latitude.toFixed(4)}</span>
                  <span>Lng: {shop.longitude.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend panel */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-3">Map Legend</h3>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-700">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm inline-block"></span>
              Blue → Shop
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm inline-block"></span>
              Red → Customer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm inline-block"></span>
              Green → Rider
            </span>
          </div>
        </div>
      </div>

      {/* CENTER: MAP MODULE */}
      <div 
        ref={mapContainerRef} 
        className={`flex-1 relative rounded-3xl overflow-hidden shadow-xl border border-gray-200/50 bg-white ${
          isFullscreen ? "fixed inset-0 z-[9999] h-screen w-screen" : "h-[400px] xl:h-full"
        }`}
      >
        <MapContainer
          center={shopCoords || [17.4483, 78.3915]}
          zoom={15}
          scrollWheelZoom={true}
          className={`h-full w-full ${isDarkMode ? "map-dark-theme" : ""}`}
          style={{ 
            filter: isDarkMode ? "invert(90%) hue-rotate(185deg) brightness(95%) contrast(90%)" : "none" 
          }}
        >
          {/* Hybrid tiles overlay */}
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Draggable shop marker or permanent shop marker */}
          {shopCoords && (
            <Marker
              position={shopCoords}
              icon={shopIcon}
              draggable={isEditingShop}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  setShopCoords([position.lat, position.lng]);
                  handleReverseGeocode(position.lat, position.lng);
                },
              }}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-extrabold text-sm text-gray-900">🏪 {shopName || "My Store"}</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">{shopAddress || "Static Headquarters"}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Customers markers: Show when accepted by rider, and remove once delivered */}
          {orders
            .filter(order => {
              const status = order.status.toLowerCase();
              return ["accepted", "dispatched"].includes(status) && 
                     order.deliveryAddress?.lat && order.deliveryAddress?.lng;
            })
            .map(order => (
              <Marker
                key={order._id}
                position={[order.deliveryAddress.lat, order.deliveryAddress.lng]}
                icon={createCustomIcon("red", order.customerName.charAt(0).toUpperCase())}
              >
                <Tooltip permanent direction="top" offset={[0, -40]}>
                  <div className="font-extrabold text-xs text-red-600 bg-white px-2 py-1 rounded shadow-sm border border-red-100 flex items-center gap-1">
                    <span>👤</span>
                    <span>{order.customerName} (#{order._id.slice(-5)})</span>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="p-1 space-y-1.5 w-48 text-gray-800">
                    <div className="flex justify-between items-center border-b pb-1 border-gray-150">
                      <span className="font-extrabold text-xs">👤 {order.customerName}</span>
                      <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">{order.deliveryAddress.fullAddress}</p>
                    <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                      ID: #{order._id.slice(-5)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Riders live markers */}
          {(() => {
            const activeRiderIds = orders
              .filter(order => order.status === "dispatched")
              .map(order => {
                const r = order.assignedRider;
                return r?._id || r;
              })
              .filter(Boolean);

            return riders
              .filter(rider => {
                const hasCoordinates = rider.location?.coordinates?.[1] && rider.location?.coordinates?.[0];
                const isActiveDelivery = activeRiderIds.includes(rider._id);
                return rider.isActive && !rider.isBlocked && hasCoordinates && isActiveDelivery;
              })
              .map(rider => (
                <Marker
                  key={rider._id}
                  position={[rider.location.coordinates[1], rider.location.coordinates[0]]}
                  icon={riderIcon}
                >
                  <Popup>
                    <div className="p-1.5 space-y-1 w-48 text-gray-800">
                      <div className="flex justify-between items-center border-b pb-1 border-gray-100">
                        <span className="font-extrabold text-xs">🛵 {rider.name}</span>
                        <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">
                          {rider.isAvailable ? "Available" : "Busy"}
                        </span>
                      </div>
                      <div className="text-[10px] space-y-1 text-gray-500">
                        <p>Speed: <strong className="text-gray-800 font-bold">{rider.speed || 0} km/h</strong></p>
                        <p>Phone: <strong className="text-gray-800 font-semibold">{rider.phone || "-"}</strong></p>
                        {(() => {
                          const activeOrder = orders.find(
                            o => o.status === "dispatched" && 
                            (o.assignedRider?._id === rider._id || o.assignedRider === rider._id)
                          );
                          return activeOrder ? (
                            <p>Active Order: <strong className="text-blue-600 font-bold">#{activeOrder._id?.slice(-5)}</strong></p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ));
          })()}

          {/* Map click listener for shop setups */}
          <MapClickHandler isEditing={isEditingShop} onMapClick={handleMapClick} />

          {/* Fly to active / selection focus */}
          <FlyToActive location={focusedLocation} />

          {/* Fit map bounds dynamically to show all active spots */}
          <FitBounds markers={getMapMarkers()} />
        </MapContainer>

        {/* Floating Custom Controls overlay */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-gray-150">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Map Style"
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 bg-white transition-all shadow-sm border border-gray-250 flex items-center justify-center"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-orange-500" /> : <Moon className="w-4 h-4 text-slate-800" />}
          </button>
          
          <button 
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 bg-white transition-all shadow-sm border border-gray-250 flex items-center justify-center"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR: ORDERS & RIDERS MANAGEMENT LISTS */}
      <div className="w-full xl:w-96 shrink-0 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        
        {/* Toggle buttons */}
        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1 shrink-0 mb-4">
          <button
            onClick={() => { setActiveTab("orders"); setSelectedOrder(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "orders" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Package className="w-4 h-4" />
            Orders ({orders.length})
          </button>
          <button
            onClick={() => { setActiveTab("riders"); setSelectedRider(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "riders" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Riders ({riders.length})
          </button>
        </div>

        {/* Tabs contents with slide transitions */}
        <div className="flex-1 overflow-y-auto min-h-0 relative pr-0.5">
          <AnimatePresence mode="wait">
            
            {/* ORDERS TAB */}
            {activeTab === "orders" && !selectedOrder && (
              <motion.div
                key="orders-list"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Package className="w-12 h-12 mb-3 text-gray-300 animate-bounce" />
                    <p className="text-sm font-semibold">No Orders Found</p>
                  </div>
                ) : (
                  orders.map(order => {
                    const isActive = ["pending", "assigned", "accepted", "dispatched"].includes(order.status.toLowerCase());
                    return (
                      <div
                        key={order._id}
                        onClick={() => {
                          setSelectedOrder(order);
                          if (order.deliveryAddress?.lat && order.deliveryAddress?.lng) {
                            setFocusedLocation([order.deliveryAddress.lat, order.deliveryAddress.lng]);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                          isActive 
                            ? "bg-gradient-to-r from-white to-gray-50/50 hover:bg-gray-50 border-gray-100 hover:border-gray-200" 
                            : "bg-gray-50/30 opacity-70 border-gray-100"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-extrabold text-sm text-gray-800 truncate">{order.customerName}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0
                            ${order.status.toLowerCase() === "delivered" ? "bg-green-50 text-green-700 border border-green-200" : ""}
                            ${order.status.toLowerCase() === "pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : ""}
                            ${order.status.toLowerCase() === "dispatched" ? "bg-purple-50 text-purple-700 border border-purple-200" : ""}
                            ${["assigned", "accepted"].includes(order.status.toLowerCase()) ? "bg-blue-50 text-blue-700 border border-blue-200" : ""}
                          `}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1.5 truncate leading-relaxed">
                          {order.deliveryAddress?.fullAddress || `${order.address?.building}, ${order.address?.area}`}
                        </p>
                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-50 text-[10px] text-gray-400 font-semibold">
                          <span>ID: #{order._id.slice(-5)}</span>
                          <span className="text-blue-600 hover:underline flex items-center gap-0.5">
                            Manage Order
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* ORDER DETAIL SIDE PANEL */}
            {activeTab === "orders" && selectedOrder && (
              <motion.div
                key="order-detail"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 bg-gray-50/20 p-4 rounded-2xl border border-gray-100"
              >
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Back to List
                </button>

                <div className="border-b pb-3 border-gray-100">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-black text-base text-gray-900">{selectedOrder.customerName}</h3>
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold rounded">
                      ID #{selectedOrder._id.slice(-5)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-1">Assigned: {new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Phone</label>
                    <p className="font-extrabold text-gray-800 mt-0.5 flex items-center gap-1 text-sm">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {selectedOrder.phone}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Delivery Address</label>
                    <p className="font-medium text-gray-700 leading-relaxed mt-0.5">
                      {selectedOrder.deliveryAddress?.fullAddress || `${selectedOrder.address?.building}, ${selectedOrder.address?.area}, ${selectedOrder.address?.city}`}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Order Particulars</label>
                    <p className="font-semibold text-gray-800 bg-white p-3 border border-gray-100 rounded-xl mt-0.5">
                      {selectedOrder.orderDetails}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Courier Assigned</label>
                    <p className="font-bold text-gray-800 mt-0.5">
                      {selectedOrder.assignedRider?.name || "Unassigned Dispatch Pool"}
                    </p>
                  </div>
                </div>

                {/* Delivery Status Management (Feature 2) */}
                <div className="pt-2 border-t border-gray-100 space-y-2.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block">Change Delivery Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["pending", "assigned", "accepted", "dispatched", "delivered"].map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateOrderStatus(selectedOrder._id, st)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm ${
                          selectedOrder.status === st 
                            ? "bg-blue-600 text-white border border-blue-600" 
                            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* RIDERS TAB */}
            {activeTab === "riders" && !selectedRider && (
              <motion.div
                key="riders-list"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                {riders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Users className="w-12 h-12 mb-3 text-gray-300 animate-bounce" />
                    <p className="text-sm font-semibold">No Riders Registered</p>
                  </div>
                ) : (
                  riders.map(rider => (
                    <div
                      key={rider._id}
                      onClick={() => {
                        setSelectedRider(rider);
                        if (rider.location?.coordinates?.[1] && rider.location?.coordinates?.[0]) {
                          setFocusedLocation([rider.location.coordinates[1], rider.location.coordinates[0]]);
                        }
                      }}
                      className="p-4 rounded-2xl border bg-white border-gray-100 hover:border-gray-200 transition-all cursor-pointer hover:shadow-md flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-sm">
                          {rider.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-800">{rider.name}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold mt-1
                            ${rider.isBlocked || !rider.isActive ? "bg-red-50 text-red-700 border border-red-150" : ""}
                            ${rider.isActive && !rider.isBlocked && rider.isAvailable ? "bg-green-50 text-green-700 border border-green-150" : ""}
                            ${rider.isActive && !rider.isBlocked && !rider.isAvailable ? "bg-yellow-50 text-yellow-700 border border-yellow-150" : ""}
                          `}>
                            {rider.isBlocked || !rider.isActive ? "Blocked" : rider.isAvailable ? "Online (Available)" : "Busy (On Trip)"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* RIDER DETAIL SIDE PANEL */}
            {activeTab === "riders" && selectedRider && (
              <motion.div
                key="rider-detail"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 bg-gray-50/20 p-4 rounded-2xl border border-gray-100"
              >
                <button
                  onClick={() => setSelectedRider(null)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Back to List
                </button>

                <div className="border-b pb-3 border-gray-100 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-black text-blue-600 text-lg">
                    {selectedRider.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-gray-900">{selectedRider.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">RIDER PROFILE</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Phone Connection</label>
                    <p className="font-extrabold text-gray-800 mt-0.5 flex items-center gap-1 text-sm">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {selectedRider.phone || "-"}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">GPS Stream Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        selectedRider.isBlocked || !selectedRider.isActive ? "bg-red-500" : "bg-green-500 animate-pulse"
                      }`}></span>
                      <span className="font-bold text-gray-700">
                        {selectedRider.isBlocked || !selectedRider.isActive ? "GPS Signal Blocked" : "Active Location Broadcast"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block">Trip Activity</label>
                    <span className={`inline-block px-2.5 py-0.5 rounded font-bold uppercase text-[9px] mt-0.5 ${
                      selectedRider.isAvailable ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {selectedRider.isAvailable ? "Available for orders" : "Currently delivering"}
                    </span>
                  </div>

                  {selectedRider.location?.coordinates && (
                    <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-1 text-[11px]">
                      <p className="flex justify-between">
                        <span className="text-gray-400 font-semibold">Speed</span>
                        <strong className="text-gray-800 font-extrabold">{selectedRider.speed || 0} km/h</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-400 font-semibold">Latitude</span>
                        <strong className="text-gray-800">{selectedRider.location.coordinates[1].toFixed(5)}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-400 font-semibold">Longitude</span>
                        <strong className="text-gray-800">{selectedRider.location.coordinates[0].toFixed(5)}</strong>
                      </p>
                      {selectedRider.updatedAt && (
                        <p className="flex justify-between pt-1 border-t border-gray-50 text-[9px] text-gray-400">
                          <span>Last updated</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(selectedRider.updatedAt).toLocaleTimeString()}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Blocked Rider Restriction Control (Feature 5) */}
                <div className="pt-4 border-t border-gray-150">
                  {selectedRider.isBlocked || !selectedRider.isActive ? (
                    <button
                      onClick={() => handleUnblockRider(selectedRider._id)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
                    >
                      <Activity className="w-4 h-4" />
                      Unblock Rider Access
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlockRider(selectedRider._id)}
                      className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Instantly Block Rider
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;