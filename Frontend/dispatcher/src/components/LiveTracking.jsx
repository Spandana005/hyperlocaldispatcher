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
  Store,
  Map as MapIcon,
  X,
  Sidebar as SidebarIcon,
  UserCheck
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
  const colorMap = {
    blue: "#2563EB",
    red: "#EF4444",
    green: "#10B981"
  };
  const themeHex = colorMap[color] || "#2563EB";
  
  return new L.DivIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-[${themeHex}]/30 animate-ping opacity-60"></div>
        <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-xl border-2 border-[${themeHex}] transition-all duration-300 hover:scale-110">
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
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
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
  
  // Collapse toggles for full screen map capability
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

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
      const pendingOCount = ordersRes.data.filter(o => ["pending", "assigned", "accepted", "outfordelivery"].includes(o.status.toLowerCase())).length;
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
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000");

    socket.on("connect", () => {
      console.log("Admin real-time tracker connected to WebSocket");
    });

    // Handle Live GPS updates
    socket.on("rider:location-update", (data) => {
      console.log("Admin receives socket event: rider:location-update", data);
      
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
        toast.success("Spot configured successfully!");
      } else {
        toast.error("Address coordinates not found.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Nominatim request failed.");
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
      toast.error("Provide shop name and set point on map.");
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
        toast.success("Dispatch spot registered!");
        setShop(res.data.shop);
        setIsEditingShop(false);
      } else {
        toast.error("Failed to register shop.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Shop registration failed.");
    }
  };

  // ============================
  // STATUS MANAGEMENT (ORDER)
  // ============================
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await API.put(`/api/orders/status/${orderId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Order set to ${newStatus}`);
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit status");
    }
  };

  // ============================
  // BLOCKED RIDER ACTIONS
  // ============================
  const handleBlockRider = async (riderId) => {
    try {
      const res = await API.put(`/api/admin/block-rider/${riderId}`);
      toast.success("Rider blocked successfully");
      loadDashboardData();
      if (selectedRider && selectedRider._id === riderId) {
        setSelectedRider(prev => ({ ...prev, isActive: false, isBlocked: true }));
      }
    } catch (err) {
      toast.error("Failed to restrict rider");
    }
  };

  const handleUnblockRider = async (riderId) => {
    try {
      const res = await API.put(`/api/admin/unblock-rider/${riderId}`);
      toast.success("Rider unblocked successfully");
      loadDashboardData();
      if (selectedRider && selectedRider._id === riderId) {
        setSelectedRider(prev => ({ ...prev, isActive: true, isBlocked: false }));
      }
    } catch (err) {
      toast.error("Failed to reinstate rider");
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
        map.flyTo(location, 16, { duration: 1.2 });
      }
    }, [location]);
    return null;
  };

  // Map markers collection for fitbounds
  const getMapMarkers = () => {
    const list = [];
    if (shopCoords) list.push(shopCoords);
    orders.forEach(order => {
      if (order.deliveryAddress?.lat !== undefined && order.deliveryAddress?.lng !== undefined && 
          ["pending", "assigned", "accepted", "outfordelivery"].includes(order.status.toLowerCase())) {
        list.push([order.deliveryAddress.lat, order.deliveryAddress.lng]);
      }
    });
    riders.forEach(rider => {
      if (rider.isActive && !rider.isBlocked && rider.location?.coordinates?.[1] !== undefined && rider.location?.coordinates?.[0] !== undefined) {
        list.push([rider.location.coordinates[1], rider.location.coordinates[0]]);
      }
    });
    return list;
  };

  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-140px)] w-full gap-5 overflow-hidden font-sans relative">
      
      {/* LEFT SIDEBAR: CONFIG Spot & Stats */}
      {showLeftSidebar && (
        <div className="w-full xl:w-80 flex flex-col gap-5 shrink-0 overflow-y-auto pr-1 animate-scaleUp">
          {/* Dashboard title header */}
          <div className="flex justify-between items-center bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Activity className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                Logistics Hub
              </h2>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Live Operations Control</p>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>

          {/* Quick stats micro-dashboard */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-xl shrink-0">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase font-bold text-slate-400">Riders</p>
                <p className="text-sm font-black text-slate-800">{stats.activeRiders}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Package className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase font-bold text-slate-400">Orders</p>
                <p className="text-sm font-black text-slate-800">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          {/* Shop Setup spot */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h3 className="text-[10px] font-bold uppercase text-slate-450 tracking-wider flex items-center gap-1">
                <Store className="w-4 h-4 text-blue-600" /> Dispatch Spot
              </h3>
              {shop && !isEditingShop && (
                <button 
                  onClick={() => setIsEditingShop(true)}
                  className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full cursor-pointer"
                >
                  Configure
                </button>
              )}
            </div>

            {!shop || isEditingShop ? (
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[10px] font-bold text-slate-450">
                  Search address or position the map marker spot manually.
                </p>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search address locality..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchLocation()}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-white"
                  />
                  <button
                    onClick={handleSearchLocation}
                    disabled={isSearching}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 disabled:bg-blue-400 cursor-pointer"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Find"}
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Shop Name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-white"
                />

                <textarea
                  placeholder="Street details..."
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl outline-none h-16 focus:border-blue-400 resize-none bg-white"
                />

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveShopLocation}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    Register Spot
                  </button>
                  {shop && (
                    <button
                      onClick={() => setIsEditingShop(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-650 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-xl h-fit shrink-0 shadow">
                  <Store className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-slate-800 text-xs truncate">{shop.shopName}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1 line-clamp-3">
                    {shop.address || "Static coordinates setup."}
                  </p>
                  <div className="flex gap-3 mt-2.5 text-[9px] font-bold text-blue-600 bg-blue-50/60 w-fit px-2 py-0.5 rounded">
                    <span>Lat: {shop.latitude.toFixed(4)}</span>
                    <span>Lng: {shop.longitude.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map legend */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase text-slate-450 tracking-wider mb-3">Map Legend</h3>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-700">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm"></span> Shop</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm"></span> Client</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shadow-sm"></span> Rider</span>
            </div>
          </div>
        </div>
      )}

      {/* CENTER: MAP MODULE */}
      <div 
        ref={mapContainerRef} 
        className={`flex-1 relative rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-white ${
          isFullscreen ? "fixed inset-0 z-[9999] h-screen w-screen" : "h-[400px] xl:h-full"
        }`}
      >
        <MapContainer
          center={shopCoords || [17.4483, 78.3915]}
          zoom={15}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ 
            filter: isDarkMode ? "invert(90%) hue-rotate(185deg) brightness(95%) contrast(90%)" : "none" 
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Shop Marker */}
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
                <div className="p-1 min-w-[120px]">
                  <h4 className="font-extrabold text-xs text-slate-900">🏪 {shopName || "My Store"}</h4>
                  <p className="text-[9px] text-slate-500 font-semibold leading-relaxed mt-0.5">{shopAddress || "Static Dispatch Base"}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Customer marker points (OutForDelivery or Accepted) */}
          {orders
            .filter(order => {
              const status = order.status.toLowerCase();
              return ["accepted", "outfordelivery"].includes(status) && 
                     order.deliveryAddress?.lat !== undefined && order.deliveryAddress?.lng !== undefined;
            })
            .map(order => (
              <Marker
                key={order._id}
                position={[order.deliveryAddress.lat, order.deliveryAddress.lng]}
                icon={createCustomIcon("red", order.customerName.charAt(0).toUpperCase())}
              >
                <Tooltip permanent direction="top" offset={[0, -40]}>
                  <div className="font-bold text-[9px] text-rose-700 bg-white px-2 py-0.5 rounded shadow-sm border border-rose-100 flex items-center gap-1">
                    <span>👤</span>
                    <span>{order.customerName} (#{order._id.slice(-5)})</span>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="p-1 space-y-1 w-44 text-slate-800">
                    <div className="flex justify-between items-center border-b pb-1 border-slate-100">
                      <span className="font-extrabold text-xs">👤 {order.customerName}</span>
                      <span className="text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase">{order.status}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-semibold">{order.deliveryAddress.fullAddress}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Riders coordinates tracking markers */}
          {(() => {
            const activeRiderIds = orders
              .filter(order => order.status.toLowerCase() === "outfordelivery")
              .map(order => {
                const r = order.assignedRider;
                return r?._id || r;
              })
              .filter(Boolean);

            return riders
              .filter(rider => {
                const hasCoordinates = rider.location?.coordinates?.[1] !== undefined && rider.location?.coordinates?.[0] !== undefined;
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
                    <div className="p-1.5 space-y-1.5 w-48 text-slate-800">
                      <div className="flex justify-between items-center border-b pb-1 border-slate-100">
                        <span className="font-extrabold text-xs">🛵 {rider.name}</span>
                        <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">Active</span>
                      </div>
                      <div className="text-[10px] space-y-1 text-slate-500 font-semibold">
                        <p>Velocity: <strong className="text-slate-800 font-bold">{rider.speed || 0} km/h</strong></p>
                        <p>Phone: <strong className="text-slate-800 font-bold">{rider.phone || "-"}</strong></p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ));
          })()}

          <MapClickHandler isEditing={isEditingShop} onMapClick={handleMapClick} />
          <FlyToActive location={focusedLocation} />
          <FitBounds markers={getMapMarkers()} />
        </MapContainer>

        {/* Floating map tools */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-white/85 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-100">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Map Style"
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 bg-white transition-all shadow-sm border border-slate-200 flex items-center justify-center cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-orange-500" /> : <Moon className="w-4 h-4 text-slate-800" />}
          </button>
          
          <button 
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 bg-white transition-all shadow-sm border border-slate-200 flex items-center justify-center cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            title="Toggle Config Drawer"
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 bg-white transition-all shadow-sm border border-slate-200 flex items-center justify-center cursor-pointer"
          >
            <SidebarIcon className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            title="Toggle Orders Drawer"
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 bg-white transition-all shadow-sm border border-slate-200 flex items-center justify-center cursor-pointer"
          >
            <MapIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR: ORDERS & RIDERS MANAGEMENT LISTS */}
      {showRightSidebar && (
        <div className="w-full xl:w-80 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col overflow-hidden shrink-0 animate-scaleUp">
          {/* Toggle buttons */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 shrink-0 mb-4">
            <button
              onClick={() => { setActiveTab("orders"); setSelectedOrder(null); }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "orders" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Package className="w-4 h-4" />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => { setActiveTab("riders"); setSelectedRider(null); }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "riders" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              Riders ({riders.length})
            </button>
          </div>

          {/* List contents */}
          <div className="flex-1 overflow-y-auto min-h-0 relative pr-0.5 space-y-3">
            <AnimatePresence mode="wait">
              
              {/* ORDERS TAB */}
              {activeTab === "orders" && !selectedOrder && (
                <motion.div key="orders-list" className="space-y-3">
                  {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Package className="w-12 h-12 mb-3 text-slate-300 animate-bounce" />
                      <p className="text-xs font-bold">No dispatch orders</p>
                    </div>
                  ) : (
                    orders.map(order => {
                      const isActive = ["pending", "assigned", "accepted", "outfordelivery"].includes(order.status.toLowerCase());
                      return (
                        <div
                          key={order._id}
                          onClick={() => {
                            setSelectedOrder(order);
                            if (order.deliveryAddress?.lat && order.deliveryAddress?.lng) {
                              setFocusedLocation([order.deliveryAddress.lat, order.deliveryAddress.lng]);
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                            isActive 
                              ? "bg-slate-50/50 hover:bg-slate-50 border-slate-100 hover:border-slate-200" 
                              : "bg-slate-50/10 opacity-70 border-slate-100"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1.5">
                            <h4 className="font-extrabold text-xs text-slate-800 truncate">{order.customerName}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0
                              ${order.status.toLowerCase() === "delivered" ? "bg-green-50 text-green-700 border-green-150" : ""}
                              ${order.status.toLowerCase() === "pending" ? "bg-amber-50 text-amber-700 border-amber-150" : ""}
                              ${order.status.toLowerCase() === "outfordelivery" ? "bg-purple-50 text-purple-700 border-purple-150" : ""}
                              ${["assigned", "accepted"].includes(order.status.toLowerCase()) ? "bg-blue-50 text-blue-700 border-blue-150" : ""}
                            `}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 truncate leading-relaxed">
                            {order.deliveryAddress?.fullAddress || `${order.address?.building}, ${order.address?.area}`}
                          </p>
                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100/50 text-[9px] text-slate-400 font-semibold">
                            <span>ID: #{order._id.slice(-5)}</span>
                            <span className="text-blue-600 hover:underline flex items-center gap-0.5 font-bold">
                              Details <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}

              {/* ORDER DETAIL DRAWER */}
              {activeTab === "orders" && selectedOrder && (
                <motion.div key="order-detail" className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Back to List
                  </button>

                  <div className="border-b pb-3 border-slate-100">
                    <div className="flex justify-between items-start gap-1.5">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">{selectedOrder.customerName}</h3>
                      <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold rounded">
                        #{selectedOrder._id.slice(-5)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Assigned: {new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                  </div>

                  <div className="space-y-3.5 text-xs font-semibold">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400">Phone</label>
                      <p className="font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedOrder.phone}
                      </p>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400">Delivery Address</label>
                      <p className="font-medium text-slate-650 leading-relaxed mt-0.5">
                        {selectedOrder.deliveryAddress?.fullAddress || `${selectedOrder.address?.building}, ${selectedOrder.address?.area}, ${selectedOrder.address?.city}`}
                      </p>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400">Details Particulars</label>
                      <p className="font-semibold text-slate-800 bg-white p-3 border border-slate-100 rounded-xl mt-0.5 italic">
                        {selectedOrder.orderDetails}
                      </p>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400">Courier Assigned</label>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {selectedOrder.assignedRider?.name || "Unassigned Operations Pool"}
                      </p>
                    </div>
                  </div>

                  {/* Status operations */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <label className="text-[9px] uppercase font-bold text-slate-400 block">Dispatch Status Control</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["pending", "assigned", "accepted", "outfordelivery", "delivered"].map(st => (
                        <button
                          key={st}
                          onClick={() => handleUpdateOrderStatus(selectedOrder._id, st)}
                          className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border cursor-pointer shadow-sm ${
                            selectedOrder.status === st 
                              ? "bg-slate-900 text-white border-slate-900" 
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
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
                <motion.div key="riders-list" className="space-y-3">
                  {riders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Users className="w-12 h-12 mb-3 text-slate-300 animate-bounce" />
                      <p className="text-xs font-bold">No riders online</p>
                    </div>
                  ) : (
                    riders.map(rider => (
                      <div
                        key={rider._id}
                        onClick={() => {
                          setSelectedRider(rider);
                          if (rider.location?.coordinates?.[1] !== undefined && rider.location?.coordinates?.[0] !== undefined) {
                            setFocusedLocation([rider.location.coordinates[1], rider.location.coordinates[0]]);
                          }
                        }}
                        className="p-3 rounded-2xl border bg-white border-slate-100 hover:border-slate-200 transition-all cursor-pointer hover:shadow-sm flex items-center justify-between gap-3 animate-fadeIn"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-100">
                            {rider.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-800">{rider.name}</h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black mt-1 uppercase border
                              ${rider.isBlocked || !rider.isActive ? "bg-rose-50 text-rose-700 border-rose-100" : rider.isAvailable ? "bg-green-50 text-green-700 border-green-100" : "bg-amber-50 text-amber-700 border-amber-100"}
                            `}>
                              {rider.isBlocked || !rider.isActive ? "Blocked" : rider.isAvailable ? "Online" : "Busy"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {/* RIDER DETAIL DRAWER */}
              {activeTab === "riders" && selectedRider && (
                <motion.div key="rider-detail" className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <button
                    onClick={() => setSelectedRider(null)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Back to List
                  </button>

                  <div className="border-b pb-3 border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 text-sm">
                      {selectedRider.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-slate-900">{selectedRider.name}</h3>
                      <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">RIDER PROFILE</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs font-semibold">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400">Phone</label>
                      <p className="font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedRider.phone || "-"}
                      </p>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400">GPS Status</label>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`h-2 w-2 rounded-full ${selectedRider.isBlocked || !selectedRider.isActive ? "bg-rose-500" : "bg-green-500 animate-pulse"}`}></span>
                        <span className="font-bold text-slate-700">
                          {selectedRider.isBlocked || !selectedRider.isActive ? "Restricted Signal" : "Active Broadcast"}
                        </span>
                      </div>
                    </div>

                    {selectedRider.location?.coordinates && (
                      <div className="bg-white p-3 rounded-2xl border border-slate-100 space-y-1 text-[10px] font-bold text-slate-650">
                        <p className="flex justify-between"><span>Speed</span><strong className="text-slate-800">{selectedRider.speed || 0} km/h</strong></p>
                        <p className="flex justify-between"><span>Lat</span><strong className="text-slate-800">{selectedRider.location.coordinates[1].toFixed(5)}</strong></p>
                        <p className="flex justify-between"><span>Lng</span><strong className="text-slate-800">{selectedRider.location.coordinates[0].toFixed(5)}</strong></p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-150">
                    {selectedRider.isBlocked || !selectedRider.isActive ? (
                      <button
                        onClick={() => handleUnblockRider(selectedRider._id)}
                        className="w-full bg-green-550 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" /> Unblock Rider
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlockRider(selectedRider._id)}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4" /> Block Rider
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;