import React, {
  useState,
  useEffect,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import API, { getShopLocation } from "../api";

// ============================
// FIX LEAFLET DEFAULT ICON & DEFINE SHOP ICON
// ============================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const shopIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map click event listener
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
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

const CreateOrder = () => {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [shopPosition, setShopPosition] = useState(null);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  // Load Admin's Shop Location
  useEffect(() => {
    const fetchShopLocation = async () => {
      try {
        const response = await getShopLocation();
        if (response.data?.success && response.data?.shop) {
          const { latitude, longitude } = response.data.shop;
          if (latitude && longitude) {
            setShopPosition({ lat: latitude, lng: longitude });
            // Pre-fill and center map at shop location as default dispatcher
            setSelectedPosition({ lat: latitude, lng: longitude });
            handleReverseGeocode(latitude, longitude);
          }
        }
      } catch (err) {
        console.error("Failed to load shop location:", err);
      }
    };
    fetchShopLocation();
  }, []);

  const handleReverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
      );
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        
        // Construct area locality
        const areaParts = [];
        if (addr.suburb) areaParts.push(addr.suburb);
        if (addr.neighbourhood) areaParts.push(addr.neighbourhood);
        if (addr.road) areaParts.push(addr.road);
        const areaStr = areaParts.join(", ") || addr.amenity || "";

        setFormData((prev) => ({
          ...prev,
          pincode: addr.postcode || prev.pincode || "",
          city: addr.city || addr.town || addr.village || prev.city || "",
          state: addr.state || prev.state || "",
          area: areaStr || prev.area || "",
          building: addr.house_number || addr.building || prev.building || "",
        }));
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  const handleSearchMapLocation = async () => {
    if (!mapSearchQuery) return;
    setIsSearchingMap(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&accept-language=en`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        setSelectedPosition({ lat, lng });
        handleReverseGeocode(lat, lng);
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error(err);
      alert("Search failed.");
    } finally {
      setIsSearchingMap(false);
    }
  };

  const [formData, setFormData] = useState({

    customerName: "",
  
    phone: "",
  
    pincode: "",
  
    city: "",
  
    state: "",
  
    area: "",
  
    building: "",
  
    landmark: "",
  
    addressType: "Home",
  
    orderDetails: "",
  
  });

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]:
        e.target.value,

    });

  };


  // =========================
  // HANDLE SUBMIT
  // =========================
  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        // CONVERT ADDRESS TO COORDINATES
        if (!selectedPosition) {

          alert("Please select delivery location on map");
        
          return;
        
        }
        
        const latitude = selectedPosition.lat;
        
        const longitude = selectedPosition.lng;
        


        // CREATE ORDER
        await API.post(

          "/api/admin/create-order",

          {

            customerName:
              formData.customerName,

            phone:
              formData.phone,

            address: {

  pincode:
    formData.pincode,

  city:
    formData.city,

  state:
    formData.state,

  area:
    formData.area,

  building:
    formData.building,

  landmark:
    formData.landmark,

  addressType:
    formData.addressType,

},

            // NEW
           
            orderDetails:
              formData.orderDetails,


            // DELIVERY LOCATION
            latitude,

            longitude,

          }

        );


        alert(
          "Order sent to nearby riders"
        );


        // RESET FORM
        setFormData({

          customerName: "",
        
          phone: "",
        
          pincode: "",
        
          city: "",
        
          state: "",
        
          area: "",
        
          building: "",
        
          landmark: "",
        
          addressType: "Home",
        
          orderDetails: "",
        
        });
        setSelectedPosition(null);

      }

      catch (error) {

        console.log(error);

        alert(

          error.response?.data?.message ||

          "Something went wrong"

        );

      }

    };


  return (

    <div className="p-6">

      {/* HEADING */}
      <div className="mb-8">

        <h1
          className="
          text-4xl
          font-bold
          text-blue-600
          "
        >

          Create Order

        </h1>

        <p
          className="
          text-gray-600
          mt-2
          "
        >

          Create delivery orders
          for nearby riders.

        </p>

      </div>


      {/* FORM */}
      <div
        className="
        bg-white
        shadow-xl
        rounded-2xl
        p-8
        max-w-3xl
        "
      >

        <form
          onSubmit={handleSubmit}
          className="
          flex
          flex-col
          gap-6
          "
        >

          {/* CUSTOMER NAME */}
          <div>

            <label
              className="
              block
              mb-2
              font-semibold
              "
            >

              Customer Name

            </label>

            <input
              type="text"
              name="customerName"
              placeholder="
              Enter Customer Name
              "
              value={
                formData.customerName
              }
              onChange={handleChange}
              className="
              w-full
              border
              p-3
              rounded-lg
              outline-none
              "
              required
            />

          </div>


          {/* PHONE */}
          <div>

            <label
              className="
              block
              mb-2
              font-semibold
              "
            >

              Phone Number

            </label>

            <input
              type="tel"
              name="phone"
              placeholder="
              Enter Phone Number
              "
              value={
                formData.phone
              }
              onChange={handleChange}
              className="
              w-full
              border
              p-3
              rounded-lg
              outline-none
              "
              required
            />

          </div>


          {/* ADDRESS INFO */}
<div className="border rounded-2xl p-6 bg-gray-50">

<h2 className="text-2xl font-bold mb-6">
  Address Info
</h2>

<div className="grid md:grid-cols-2 gap-5">

  {/* PINCODE */}
  <div>
    <label className="block mb-2 font-semibold">
      Pincode
    </label>

    <input
      type="text"
      name="pincode"
      value={formData.pincode}
      onChange={handleChange}
      placeholder="500081"
      className="w-full border p-3 rounded-xl"
      required
    />
  </div>

  {/* CITY */}
  <div>
    <label className="block mb-2 font-semibold">
      City
    </label>

    <input
      type="text"
      name="city"
      value={formData.city}
      onChange={handleChange}
      placeholder="Hyderabad"
      className="w-full border p-3 rounded-xl"
      required
    />
  </div>

  {/* STATE */}
  <div className="md:col-span-2">
    <label className="block mb-2 font-semibold">
      State
    </label>

    <input
      type="text"
      name="state"
      value={formData.state}
      onChange={handleChange}
      placeholder="Telangana"
      className="w-full border p-3 rounded-xl"
      required
    />
  </div>

  {/* AREA */}
  <div className="md:col-span-2">
    <label className="block mb-2 font-semibold">
      Locality / Area / Street
    </label>

    <textarea
      name="area"
      value={formData.area}
      onChange={handleChange}
      placeholder="Pocharam, Srinivas Colony"
      className="w-full border p-3 rounded-xl h-24"
      required
    />
  </div>

  {/* BUILDING */}
  <div className="md:col-span-2">
    <label className="block mb-2 font-semibold">
      Flat no / Building Name
    </label>

    <input
      type="text"
      name="building"
      value={formData.building}
      onChange={handleChange}
      placeholder="Plot No 32"
      className="w-full border p-3 rounded-xl"
      required
    />
  </div>

  {/* LANDMARK */}
  <div className="md:col-span-2">
    <label className="block mb-2 font-semibold">
      Landmark (Optional)
    </label>

    <input
      type="text"
      name="landmark"
      value={formData.landmark}
      onChange={handleChange}
      placeholder="Opposite 90s Cafe"
      className="w-full border p-3 rounded-xl"
    />
  </div>

</div>

</div>

          {/* ORDER DETAILS */}
          <div>

            <label
              className="
              block
              mb-2
              font-semibold
              "
            >

              Order Details

            </label>

            <textarea
              name="orderDetails"
              placeholder="
              Enter Order Details
              "
              value={
                formData.orderDetails
              }
              onChange={handleChange}
              className="
              w-full
              border
              p-3
              rounded-lg
              outline-none
              h-28
              "
              required
            />

          </div>

          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">
              Select Delivery Location
            </h2>

            {/* Address / Landmark Map Search */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search location/address or landmark on map..."
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchMapLocation();
                  }
                }}
                className="w-full border p-3 rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={handleSearchMapLocation}
                disabled={isSearchingMap}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl text-xs disabled:bg-blue-400 shrink-0"
              >
                {isSearchingMap ? "Searching..." : "Search Map"}
              </button>
            </div>

            {/* Interactive Leaflet Map */}
            <div className="border rounded-2xl overflow-hidden h-[350px] relative z-10">
              <MapContainer
                center={selectedPosition ? [selectedPosition.lat, selectedPosition.lng] : (shopPosition ? [shopPosition.lat, shopPosition.lng] : [17.4483, 78.3915])}
                zoom={14}
                scrollWheelZoom={true}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Shop Location Marker */}
                {shopPosition && (
                  <Marker
                    position={[shopPosition.lat, shopPosition.lng]}
                    icon={shopIcon}
                  >
                    <Popup>
                      <div className="p-1 text-center">
                        <p className="font-extrabold text-red-600 text-xs tracking-wider uppercase">🏪 Admin Shop</p>
                        <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Local Dispatch Point</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {selectedPosition && (
                  <Marker
                    position={[selectedPosition.lat, selectedPosition.lng]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        setSelectedPosition({ lat: position.lat, lng: position.lng });
                        handleReverseGeocode(position.lat, position.lng);
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-1 text-center">
                        <p className="font-extrabold text-blue-600 text-xs tracking-wider uppercase">📍 Customer Location</p>
                        <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Drag to reposition delivery pin</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                <MapClickHandler onMapClick={([lat, lng]) => {
                  setSelectedPosition({ lat, lng });
                  handleReverseGeocode(lat, lng);
                }} />
                <ChangeMapCenter center={selectedPosition ? [selectedPosition.lat, selectedPosition.lng] : null} />
              </MapContainer>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setSelectedPosition({ lat, lng });
                    handleReverseGeocode(lat, lng);
                  },
                  (error) => {
                    console.error("GPS error:", error);
                  },
                  { enableHighAccuracy: true }
                );
              }}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs"
            >
              📍 Locate Me & Auto-Fill Address
            </button>
          </div>


          {/* SUBMIT */}
          <button
            type="submit"
            className="
            bg-blue-600
            text-white
            py-3
            rounded-xl
            hover:bg-blue-700
            "
          >

            Create Order

          </button>

        </form>

      </div>

    </div>

  );

};

export default CreateOrder;