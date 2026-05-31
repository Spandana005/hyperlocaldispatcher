import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents
  } from "react-leaflet";
  
  import { useState } from "react";
  
  import {
    saveShopLocation
  } from "../api";
  
  
  const LocationMarker = ({
    position,
    setPosition
  }) => {
  
    useMapEvents({
  
      click(e) {
  
        const lat = e.latlng.lat;
  
        const lng = e.latlng.lng;
  
        setPosition([lat, lng]);
  
      },
  
    });
  
    return position
      ? <Marker position={position} />
      : null;
  
  };
  
  
  const ShopSetup = () => {
  
    const [shopName, setShopName] =
      useState("");
  
    const [position, setPosition] =
      useState(null);
  
  
    const saveLocation = async () => {
  
      if (!position) {
  
        alert("Choose Shop Location");
  
        return;
  
      }
  
      await saveShopLocation({
  
        shopName,
  
        latitude: position[0],
  
        longitude: position[1],
  
      });
  
      alert("Shop Location Saved");
  
      window.location.href =
        "/admin/tracking";
  
    };
  
  
    return (
  
      <div className="h-screen w-full relative">
  
        {/* TOP BOX */}
  
        <div className="absolute z-[1000] top-5 left-5 bg-white p-4 rounded shadow w-[300px]">
  
          <h1 className="text-2xl font-bold mb-3">
            Setup Shop
          </h1>
  
          <input
            type="text"
            placeholder="Shop Name"
            value={shopName}
            onChange={(e) =>
              setShopName(e.target.value)
            }
            className="border p-2 w-full mb-3"
          />
  
          <button
            onClick={saveLocation}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Save Shop Location
          </button>
  
        </div>
  
  
        {/* MAP */}
  
        <MapContainer
          center={[17.4483, 78.3915]}
          zoom={15}
          className="h-full w-full"
        >
  
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
  
          <LocationMarker
            position={position}
            setPosition={setPosition}
          />
  
        </MapContainer>
  
      </div>
    );
  
  };
  
  export default ShopSetup;