"use client";

import React, { useState, useMemo } from "react";
interface Booking {
  id: number;
  hostName: string;
  propertyName: string;
  date: string;
  location: string;
  status: "pending" | "rejected" | "checkedin" | "checkedout" | "canceled" | "checkin";
  price: number; // per day
  duration: number; // in days
  imageUrl: string;
}
const statusColors: Record<Booking["status"], string> = {
  pending: "bg-[#F20C8F]/20 text-[#F20C8F]",
  rejected: "bg-pink-100 text-pink-700",
  checkedin: "bg-[#083A85]/20 text-[#083A85]",
  checkedout: "bg-green-100 text-green-700",
  canceled: "bg-gray-200 text-gray-700",
  checkin: "bg-[#F20C8F]/20 text-[#F20C8F]",
};
const sampleBookings: Booking[] = [
  { id: 1, hostName: "mubeni pacific", propertyName: "Luxury Villa", date: "2025-08-15", location: "Kigali", status: "pending", price: 250, duration: 5, imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80" },
  { id: 2, hostName: "cole palmer", propertyName: "Beach Resort", date: "2025-08-20", location: "Gisenyi", status: "checkedin", price: 400, duration: 3, imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" },
  { id: 3, hostName: "mugwiza jackson", propertyName: "City Apartment", date: "2025-09-05", location: "Kigali", status: "checkedout", price: 300, duration: 2, imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" },
  { id: 4, hostName: "joseph bootman", propertyName: "Mountain Cabin", date: "2025-09-12", location: "Musanze", status: "canceled", price: 180, duration: 4, imageUrl: "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=800&q=80" },
  { id: 5, hostName: "code", propertyName: "Downtown Flat", date: "2025-09-18", location: "Kigali", status: "checkin", price: 220, duration: 1, imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" },
  { id: 6, hostName: "Lucy White", propertyName: "Cozy Bungalow", date: "2025-08-25", location: "Huye", status: "pending", price: 150, duration: 2, imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80" },
  { id: 7, hostName: "Tom Hanks", propertyName: "Lake House", date: "2025-09-02", location: "Kibuye", status: "rejected", price: 320, duration: 3, imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80" },
  { id: 8, hostName: "Emma Stone", propertyName: "Urban Loft", date: "2025-09-08", location: "Kigali", status: "checkedin", price: 280, duration: 2, imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80" },
  { id: 9, hostName: "Daniel Craig", propertyName: "Seaside Cottage", date: "2025-09-14", location: "Rubavu", status: "checkedout", price: 350, duration: 4, imageUrl: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80" },
  { id: 10, hostName: "Sophia Turner", propertyName: "Forest Retreat", date: "2025-09-20", location: "Nyungwe", status: "canceled", price: 200, duration: 3, imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80" },
  { id: 11, hostName: "Chris Evans", propertyName: "Modern Flat", date: "2025-09-22", location: "Kigali", status: "checkin", price: 260, duration: 1, imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" },
  { id: 12, hostName: "Natalie Portman", propertyName: "Beach Villa", date: "2025-09-28", location: "Gisenyi", status: "pending", price: 420, duration: 5, imageUrl: "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=800&q=80" },
];
export default function UserMyBookings() {
  const [bookings, setBookings] = useState<Booking[]>(sampleBookings);
  const [searchHost, setSearchHost] = useState("");
  const [searchProperty, setSearchProperty] = useState("");
  const [filterStatus, setFilterStatus] = useState<Booking["status"] | "all">("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalType, setModalType] = useState<"view" | "delete" | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Grid default
  const filtepinkBookings = useMemo(() => {
    return bookings.filter((b) => {
      const hostMatch = b.hostName.toLowerCase().includes(searchHost.toLowerCase());
      const propertyMatch = b.propertyName.toLowerCase().includes(searchProperty.toLowerCase());
      const statusMatch = filterStatus === "all" ? true : b.status === filterStatus;
      return hostMatch && propertyMatch && statusMatch;
    });
  }, [bookings, searchHost, searchProperty, filterStatus]);
  const openModal = (booking: Booking, type: "view" | "delete") => {
    setSelectedBooking(booking);
    setModalType(type);
  };
  const closeModal = () => {
    setSelectedBooking(null);
    setModalType(null);
  };
  const handleDelete = (id: number) => setBookings(prev => prev.filter(b => b.id !== id));

  // Summary counts
  const summary = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    checkedin: bookings.filter(b => b.status === "checkedin").length,
    checkedout: bookings.filter(b => b.status === "checkedout").length,
    canceled: bookings.filter(b => b.status === "canceled").length,
    rejected: bookings.filter(b => b.status === "rejected").length,
    checkin: bookings.filter(b => b.status === "checkin").length,
  };
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 mt-10">
  <h1 className="text-xl font-bold">My Bookings</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: summary.total, color: "bg-[#083A85]/20 text-[#083A85]" },
          { label: "Pending", value: summary.pending, color: "bg-[#F20C8F]/20 text-[#F20C8F]" },
          { label: "Checkedin", value: summary.checkedin, color: "bg-[#083A85]/20 text-[#083A85]" },
          { label: "Checkedout", value: summary.checkedout, color: "bg-green-100 text-green-700" },
          { label: "Canceled", value: summary.canceled, color: "bg-gray-200 text-gray-700" },
          { label: "Rejected", value: summary.rejected, color: "bg-pink-100 text-pink-700" },
          { label: "Checkin", value: summary.checkin, color: "bg-[#F20C8F]/20 text-[#F20C8F]" },
        ].map((card) => (
          <div key={card.label} className={`p-4 rounded-lg shadow hover:scale-105 transition-transform cursor-pointer ${card.color} text-center`}>
            <p className="text-sm font-medium">{card.label}</p>
            <p className="text-xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Toggle */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search Host..."
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-[#083A85] transition text-sm"
            value={searchHost}
            onChange={(e) => setSearchHost(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search Property..."
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-[#083A85] transition text-sm"
            value={searchProperty}
            onChange={(e) => setSearchProperty(e.target.value)}
          />
          <select
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-[#083A85] transition text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Booking["status"] | "all")}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="checkedin">Checkedin</option>
            <option value="checkedout">Checkedout</option>
            <option value="canceled">Canceled</option>
            <option value="checkin">Checkin</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded ${viewMode === "grid" ? "bg-[#083A85] text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </button>
          <button
            className={`px-3 py-1 rounded ${viewMode === "table" ? "bg-[#083A85] text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setViewMode("table")}
          >
            Table
          </button>
        </div>
      </div>

      {/* Bookings Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtepinkBookings.map(b => (
            <div key={b.id} className="border rounded p-3 shadow hover:scale-105 transition relative">
              <img src={b.imageUrl} alt={b.propertyName} className="w-full h-32 object-cover rounded mb-2"/>
              <h3 className="font-bold text-sm">{b.propertyName}</h3>
              <p className="text-xs">Host: {b.hostName}</p>
              <p className="text-xs">Date: {b.date}</p>
              <p className="text-xs">Location: {b.location}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[b.status]}`}>
                {b.status}
              </span>
              <p className="text-xs mt-1">Price/day: ${b.price.toFixed(2)}</p>
              <p className="text-xs">Duration: {b.duration} day(s)</p>
              <div className="flex gap-1 mt-2">
                <button
                  className="px-2 py-1 bg-[#083A85] text-white rounded text-xs hover:bg-[#062d65]"
                  onClick={() => openModal(b, "view")}
                >
                  View
                </button>
                <button
                  className="px-2 py-1 bg-pink-500 text-white rounded text-xs hover:bg-pink-600"
                  onClick={() => openModal(b, "delete")}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border rounded shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-xs">
              <tr>
                <th className="p-2 text-left">Host</th>
                <th className="p-2 text-left">Property</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Location</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Price/day</th>
                <th className="p-2 text-left">Duration</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtepinkBookings.map((b) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{b.hostName}</td>
                  <td className="p-2">{b.propertyName}</td>
                  <td className="p-2">{b.date}</td>
                  <td className="p-2">{b.location}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-2">${b.price.toFixed(2)}</td>
                  <td className="p-2">{b.duration}</td>
                  <td className="p-2 flex gap-1">
                    <button
                      className="px-2 py-1 bg-[#083A85] text-white rounded text-xs hover:bg-[#062d65]"
                      onClick={() => openModal(b, "view")}
                    >
                      View
                    </button>
                    <button
                      className="px-2 py-1 bg-pink-500 text-white rounded text-xs hover:bg-pink-600"
                      onClick={() => openModal(b, "delete")}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selectedBooking && modalType && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {modalType === "view" && (
              <>
                <h2 className="text-xl font-bold mb-4">{selectedBooking.propertyName}</h2>
                <img src={selectedBooking.imageUrl} alt={selectedBooking.propertyName} className="w-full h-40 object-cover rounded mb-2"/>
                <p>Host: {selectedBooking.hostName}</p>
                <p>Date: {selectedBooking.date}</p>
                <p>Location: {selectedBooking.location}</p>
                <p>Status: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[selectedBooking.status]}`}>{selectedBooking.status}</span></p>
                <p>Price/day: ${selectedBooking.price.toFixed(2)}</p>
                <p>Duration: {selectedBooking.duration} day(s)</p>
                <p className="font-semibold mt-2">Total to be paid: ${(selectedBooking.price * selectedBooking.duration).toFixed(2)}</p>
              </>
            )}
            {modalType === "delete" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-pink-600">Confirm Deletion</h2>
                <p>Are you sure you want to delete booking for {selectedBooking.hostName}?</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400" onClick={closeModal}>Cancel</button>
                  <button className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700" onClick={() => { handleDelete(selectedBooking.id); closeModal(); }}>Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
