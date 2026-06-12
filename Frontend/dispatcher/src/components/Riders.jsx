import React, { useEffect, useState } from "react";
import API from "../api";
import { 
  Search, 
  MapPin, 
  Phone, 
  ShieldAlert, 
  Activity, 
  UserCheck, 
  Users,
  ChevronRight,
  TrendingUp,
  X,
  Clock,
  Compass,
  AlertTriangle,
  ChevronLeft
} from "lucide-react";
import { toast } from "react-hot-toast";

const Riders = () => {
  const [riders, setRiders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRider, setSelectedRider] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchRiders();
    const interval = setInterval(fetchRiders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRiders = async () => {
    try {
      const res = await API.get("/api/admin/riders");
      setRiders(res.data.riders || []);
    } catch (err) {
      console.error("Error fetching riders:", err);
    }
  };

  const handleBlockRider = async (riderId) => {
    try {
      const res = await API.put(`/api/admin/block-rider/${riderId}`);
      toast.success(res.data.message || "Rider blocked successfully");
      fetchRiders();
      if (selectedRider && selectedRider._id === riderId) {
        setSelectedRider(prev => ({ ...prev, isActive: false }));
      }
    } catch (err) {
      toast.error("Failed to block rider");
    }
  };

  const handleUnblockRider = async (riderId) => {
    try {
      const res = await API.put(`/api/admin/unblock-rider/${riderId}`);
      toast.success(res.data.message || "Rider unblocked successfully");
      fetchRiders();
      if (selectedRider && selectedRider._id === riderId) {
        setSelectedRider(prev => ({ ...prev, isActive: true }));
      }
    } catch (err) {
      toast.error("Failed to unblock rider");
    }
  };

  // Filter riders
  const getFilteredRiders = () => {
    return riders.filter((rider) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        rider.name.toLowerCase().includes(query) ||
        (rider.phone || "").includes(query) ||
        (rider.email || "").toLowerCase().includes(query) ||
        (rider.currentOrder?.customerName || "").toLowerCase().includes(query);

      const status = !rider.isActive ? "blocked" : rider.isAvailable ? "available" : "busy";
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filteredRiders = getFilteredRiders();
  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage) || 1;
  const paginatedRiders = filteredRiders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6 animate-fadeIn">
      {/* Main Roster Panel */}
      <div className="flex-1 space-y-6">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Riders Directory
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              Monitor active couriers, signal coordinates, and block operations.
            </p>
          </div>
          
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-150">
              <Users className="w-3.5 h-3.5" /> Total: {riders.length}
            </span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search riders by name, phone contact, client..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-transparent focus:border-blue-500 outline-none rounded-xl transition-all"
            />
          </div>

          {/* Status filter buttons */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {["all", "available", "busy", "blocked"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer
                  ${statusFilter === tab
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Riders Table */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 pl-6">Rider Profile</th>
                  <th className="p-4">Phone Connection</th>
                  <th className="p-4">Current Client</th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Status Indicator</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                {paginatedRiders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center">
                        <span className="text-6xl mb-3">🛵</span>
                        <h3 className="font-bold text-slate-700 text-sm">No Riders Listed</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Try matching criteria or adjusting layout status filter tabs.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRiders.map((rider) => (
                    <tr
                      key={rider._id}
                      onClick={() => setSelectedRider(rider)}
                      className={`hover:bg-slate-50/40 transition-colors cursor-pointer ${
                        selectedRider?._id === rider._id ? "bg-slate-50" : ""
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                            {rider.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-850">{rider.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{rider.email || "No email cached"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-4 font-semibold text-slate-650">
                        {rider.phone || "-"}
                      </td>

                      {/* Customer Client */}
                      <td className="p-4 font-semibold text-slate-800">
                        {rider.currentOrder?.customerName || "-"}
                      </td>

                      {/* Order ID */}
                      <td className="p-4 font-mono text-[11px] text-slate-450">
                        {rider.currentOrder?._id ? `#${rider.currentOrder._id.slice(-5)}` : "-"}
                      </td>

                      {/* Status badge */}
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border
                          ${!rider.isActive 
                            ? "bg-rose-50 text-rose-700 border-rose-100" 
                            : rider.isAvailable 
                              ? "bg-green-50 text-green-700 border-green-100" 
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }
                        `}>
                          {!rider.isActive ? "Blocked" : rider.isAvailable ? "Available" : "Delivering"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center items-center">
                          {rider.isActive ? (
                            <button
                              onClick={() => handleBlockRider(rider._id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm cursor-pointer"
                            >
                              Block
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnblockRider(rider._id)}
                              className="bg-green-550 hover:bg-green-600 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm cursor-pointer"
                            >
                              Unblock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filteredRiders.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 select-none">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRiders.length)} of {filteredRiders.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3.5 py-1.5 bg-slate-100 rounded-lg font-bold text-slate-800">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out details drawer (Rider Profile Card) */}
      {selectedRider && (
        <div className="w-full xl:w-80 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-6 h-fit shrink-0 animate-scaleUp">
          <div className="flex justify-between items-start border-b border-slate-50 pb-4">
            <h3 className="font-black text-slate-900 text-sm">Rider Details Profile</h3>
            <button
              onClick={() => setSelectedRider(null)}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center border border-blue-100 shrink-0">
              {selectedRider.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-slate-850 text-sm truncate">{selectedRider.name}</h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">Rider ID: #{selectedRider._id.slice(-5)}</p>
            </div>
          </div>

          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Contact Connection</p>
              <p className="flex items-center gap-1 text-slate-850 font-extrabold">
                <Phone className="w-4 h-4 text-slate-400" /> {selectedRider.phone || "-"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Signal broadcast</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2 w-2 rounded-full ${selectedRider.isActive ? "bg-green-500 animate-pulse" : "bg-rose-500"}`}></span>
                <span className="text-slate-700">
                  {selectedRider.isActive ? "Active GPS Coordinate sync" : "GPS Signal offline"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold block">Current Task Status</p>
              <span className={`inline-block px-2.5 py-0.5 rounded font-extrabold uppercase text-[9px] mt-1 ${
                selectedRider.isAvailable ? "bg-green-50 text-green-700 border border-green-100" : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}>
                {selectedRider.isAvailable ? "Available for orders" : "Delivering order task"}
              </span>
            </div>

            {selectedRider.location?.coordinates && (
              <div className="bg-slate-50/50 p-3.5 border border-slate-100 rounded-2xl space-y-1.5 text-[11px] font-semibold text-slate-600">
                <p className="flex justify-between">
                  <span className="text-slate-400 font-bold">Speed</span>
                  <strong className="text-slate-800 font-black">{selectedRider.speed || 0} km/h</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400 font-bold">Latitude</span>
                  <strong className="text-slate-800">{selectedRider.location.coordinates[1].toFixed(5)}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400 font-bold">Longitude</span>
                  <strong className="text-slate-800">{selectedRider.location.coordinates[0].toFixed(5)}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            {selectedRider.isActive ? (
              <button
                onClick={() => handleBlockRider(selectedRider._id)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" /> Block Rider Access
              </button>
            ) : (
              <button
                onClick={() => handleUnblockRider(selectedRider._id)}
                className="w-full bg-green-550 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" /> Unblock Rider Access
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Riders;