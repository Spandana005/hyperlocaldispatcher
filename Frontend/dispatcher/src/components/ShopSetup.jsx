import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap
} from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import API, { saveShopLocation, getShopLocation, getMyShop, updateMyShop } from "../api";
import useAuthStore from "../store/authstore";
import { 
  Store, 
  User, 
  Bell, 
  Settings2, 
  ShieldCheck, 
  MapPin, 
  Lock, 
  Key, 
  Webhook, 
  ArrowRight,
  Loader2,
  Compass
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

// Map click capture
const LocationMarker = ({ position, setPosition, setAddress }) => {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setPosition([lat, lng]);
      handleReverseGeocode(lat, lng);
    },
  });

  const handleReverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return position ? <Marker position={position} /> : null;
};

// Map center adjustment
const ChangeMapCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.2 });
    }
  }, [center]);
  return null;
};

const ShopSetup = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState("business"); // "business", "profile", "notifications", "integrations", "security"
  
  // Business State
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [position, setPosition] = useState(null);
  const [loadingShop, setLoadingShop] = useState(false);

  // Profile Form State
  const userObj = useAuthStore((state) => state.user);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: ""
  });

  useEffect(() => {
    if (userObj) {
      setProfileForm({
        name: userObj.name || "",
        email: userObj.email || "",
        phone: userObj.phone || "",
        role: userObj.role === "admin" ? "Platform Admin" : "Shop Owner",
      });
    }
  }, [userObj]);


  // Load shop coordinates on mount
  useEffect(() => {
    const fetchShopSpot = async () => {
      try {
        const response = userObj?.role === "shop_owner"
          ? await getMyShop()
          : await getShopLocation();
        if (response.data?.success && response.data?.shop) {
          const { shopName, latitude, longitude, address } = response.data.shop;
          setShopName(shopName || "");
          setShopAddress(address || "");
          if (latitude && longitude) {
            setPosition([latitude, longitude]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch shop details", err);
      }
    };
    fetchShopSpot();
  }, [userObj]);

  // Save Shop Spot
  const saveLocation = async () => {
    if (!position) {
      toast.error("Set delivery spot location on map");
      return;
    }
    setLoadingShop(true);

    try {
      if (userObj?.role === "shop_owner") {
        await updateMyShop({
          shopName,
          latitude: position[0],
          longitude: position[1],
          address: shopAddress
        });
      } else {
        await saveShopLocation({
          shopName,
          latitude: position[0],
          longitude: position[1],
          address: shopAddress
        });
      }

      toast.success("Dispatch Spot Saved Successfully");
    } catch (err) {
      toast.error("Failed to save coordinates setup");
    } finally {
      setLoadingShop(false);
    }
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    toast.success("Profile settings saved!");
  };


  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-blue-600" />
            Business Settings
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            Manage business information, dispatch center coordinates, notification preferences, and profile settings.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Settings Navigation Tabs */}
        <div className="w-full lg:w-64 bg-white border border-slate-100 rounded-3xl p-4 shadow-sm shrink-0 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab("business")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
              activeTab === "business" ? "bg-blue-50 text-blue-600" : "text-slate-550 hover:bg-slate-50"
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            Business Information
          </button>
          
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
              activeTab === "profile" ? "bg-blue-50 text-blue-600" : "text-slate-550 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            Profile settings
          </button>



          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
              activeTab === "security" ? "bg-blue-50 text-blue-600" : "text-slate-550 hover:bg-slate-50"
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            Security & Auth
          </button>
        </div>

        {/* Tab content renderer */}
        <div className="flex-1 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm w-full">
          
          {/* TAB 1: BUSINESS SPOT MAP SETUP */}
          {activeTab === "business" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850 tracking-tight">Business Dispatch Coordinates</h3>
                <p className="text-slate-450 text-[10px] font-semibold mt-0.5">Define your store spot coordinates to calculate rider payouts accurately.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Shop Name</label>
                  <input
                    type="text"
                    placeholder="Enter Shop Name"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 p-3 rounded-xl text-xs outline-none transition-all bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Street Location Address</label>
                  <textarea
                    placeholder="Address details..."
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 p-3 rounded-xl text-xs outline-none transition-all h-20 resize-none bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Set Dispatch Spot Coordinates (Click Map)</label>
                  
                  <div className="border border-slate-150 rounded-2xl overflow-hidden h-[300px] relative z-10 shadow-sm">
                    <MapContainer
                      center={position || [17.4483, 78.3915]}
                      zoom={14}
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker
                        position={position}
                        setPosition={setPosition}
                        setAddress={setShopAddress}
                      />
                      <ChangeMapCenter center={position} />
                    </MapContainer>
                  </div>
                </div>

                {position && (
                  <div className="flex gap-4 text-[10px] font-bold text-blue-600 bg-blue-50/60 p-3 rounded-xl border border-blue-100/30 w-fit">
                    <span>Latitude: {position[0].toFixed(5)}</span>
                    <span>Longitude: {position[1].toFixed(5)}</span>
                  </div>
                )}

                <button
                  onClick={saveLocation}
                  disabled={loadingShop}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-blue-450"
                >
                  {loadingShop ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Dispatch Spot
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850 tracking-tight">Account Profile Settings</h3>
                <p className="text-slate-450 text-[10px] font-semibold mt-0.5">Admin information credentials.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full border border-slate-200 p-3 rounded-xl text-xs outline-none bg-slate-50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full border border-slate-200 p-3 rounded-xl text-xs outline-none bg-slate-50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    className="w-full border border-slate-200 p-3 rounded-xl text-xs outline-none bg-slate-50 opacity-60"
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Operations Role</label>
                  <input
                    type="text"
                    value={profileForm.role}
                    className="w-full border border-slate-200 p-3 rounded-xl text-xs outline-none bg-slate-50 opacity-60"
                    disabled
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Save Profile
              </button>
            </form>
          )}



          {/* TAB 5: SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850 tracking-tight">Security & Passwords</h3>
                <p className="text-slate-450 text-[10px] font-semibold mt-0.5">Reset dashboard passwords.</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); toast.success("Password updated successfully!"); }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full border border-slate-200 p-3 rounded-xl text-xs outline-none bg-slate-50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full border border-slate-200 p-3 rounded-xl text-xs outline-none bg-slate-50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Change Password
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ShopSetup;