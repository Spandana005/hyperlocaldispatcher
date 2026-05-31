import React, { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-hot-toast";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    customerName: "",
    phone: "",
    orderDetails: "",
    pincode: "",
    city: "",
    state: "",
    area: "",
    building: "",
    landmark: "",
    addressType: "Home",
  });

  const [assignRiderId, setAssignRiderId] = useState("");

  useEffect(() => {
    fetchOrders();
    fetchRiders();
    const interval = setInterval(() => {
      fetchOrders();
      fetchRiders();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/api/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchRiders = async () => {
    try {
      const res = await API.get("/api/admin/riders");
      // Filter for active riders to display in assignment dropdowns
      setRiders(res.data.filter(r => r.isActive));
    } catch (err) {
      console.error("Error fetching riders:", err);
    }
  };

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setEditForm({
      customerName: order.customerName || "",
      phone: order.phone || "",
      orderDetails: order.orderDetails || "",
      pincode: order.address?.pincode || "",
      city: order.address?.city || "",
      state: order.address?.state || "",
      area: order.address?.area || "",
      building: order.address?.building || "",
      landmark: order.address?.landmark || "",
      addressType: order.address?.addressType || "Home",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/api/orders/${selectedOrder._id}`, {
        customerName: editForm.customerName,
        phone: editForm.phone,
        orderDetails: editForm.orderDetails,
        address: {
          pincode: editForm.pincode,
          city: editForm.city,
          state: editForm.state,
          area: editForm.area,
          building: editForm.building,
          landmark: editForm.landmark,
          addressType: editForm.addressType,
        }
      });
      toast.success("Order updated successfully!");
      setIsEditModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order");
    }
  };

  const handleAssignClick = (order) => {
    setSelectedOrder(order);
    setAssignRiderId(order.assignedRider?._id || "");
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignRiderId) {
      toast.error("Please select a rider");
      return;
    }
    try {
      await API.put(`/api/orders/assign/${selectedOrder._id}`, {
        riderId: assignRiderId
      });
      toast.success("Rider assigned successfully!");
      setIsAssignModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign rider");
    }
  };

  const handleDeleteClick = (order) => {
    setSelectedOrder(order);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await API.delete(`/api/orders/${selectedOrder._id}`);
      toast.success("Order deleted successfully!");
      setIsDeleteConfirmOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete order");
    }
  };

  // Filter orders by search term and status tab
  const filteredOrders = orders.filter((order) => {
    // Delivered orders are removed from this active panel automatically
    if (order.status === "delivered") return false;

    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.assignedRider?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.address?.area || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* HEADING */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Order Dispatch Panel
          </h1>
          <p className="text-gray-500 mt-2">
            Create, assign, track, and modify store delivery orders.
          </p>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by ID, customer, rider, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "assigned", "accepted", "dispatched"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
                ${statusFilter === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-4">ID</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Delivery Locality</th>
                <th className="p-4">Assigned Rider</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-20 text-gray-400">
                    <div className="flex flex-col items-center">
                      <span className="text-6xl mb-4">📦</span>
                      <p className="text-lg font-medium text-gray-500">No matching orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* ID */}
                    <td className="p-4 font-mono text-gray-400">
                      #{order._id.slice(-5)}
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.phone}</p>
                      <p className="text-xs text-gray-400 mt-1 italic">{order.orderDetails}</p>
                    </td>

                    {/* Area */}
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold mr-2 uppercase">
                        {order.address?.addressType || "Home"}
                      </span>
                      <span className="text-gray-600">
                        {order.address?.building}, {order.address?.area}, {order.address?.city}
                      </span>
                    </td>

                    {/* Rider */}
                    <td className="p-4">
                      {order.assignedRider ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                            {order.assignedRider.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{order.assignedRider.name}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAssignClick(order)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-bold uppercase tracking-wider hover:underline"
                        >
                          + Assign Rider
                        </button>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
                        ${order.status === "pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : ""}
                        ${order.status === "dispatched" ? "bg-purple-50 text-purple-700 border border-purple-200" : ""}
                        ${order.status === "delivered" ? "bg-green-50 text-green-700 border border-green-200" : ""}
                        ${order.status === "assigned" || order.status === "accepted" ? "bg-blue-50 text-blue-700 border border-blue-200" : ""}
                      `}>
                        {order.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleAssignClick(order)}
                          className="bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          title="Assign Rider"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleEditClick(order)}
                          className="bg-gray-100 hover:bg-yellow-50 hover:text-yellow-700 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          title="Edit Details"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(order)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          title="Delete Order"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSIGN RIDER MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleUp">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assign Rider</h2>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Select Rider</label>
                <select
                  value={assignRiderId}
                  onChange={(e) => setAssignRiderId(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none"
                  required
                >
                  <option value="">-- Choose Rider --</option>
                  {riders.map((rider) => (
                    <option key={rider._id} value={rider._id}>
                      {rider.name} ({rider.isAvailable ? "Available" : "Busy"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md"
                >
                  Assign Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Order Details</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Address Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Building/Flat No.</label>
                    <input
                      type="text"
                      value={editForm.building}
                      onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Locality/Area/Street</label>
                    <input
                      type="text"
                      value={editForm.area}
                      onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editForm.pincode}
                      onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">State</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={editForm.landmark}
                      onChange={(e) => setEditForm({ ...editForm, landmark: e.target.value })}
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Address Type</label>
                <div className="flex gap-4">
                  {["Home", "Office", "Other"].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="editAddressType"
                        value={type}
                        checked={editForm.addressType === type}
                        onChange={(e) => setEditForm({ ...editForm, addressType: e.target.value })}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Order Details</label>
                <textarea
                  value={editForm.orderDetails}
                  onChange={(e) => setEditForm({ ...editForm, orderDetails: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm h-20"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleUp">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Order?</h2>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete the order for <strong className="text-gray-800">{selectedOrder?.customerName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;