"use client";
import React, { useState, useMemo } from "react";

interface Booking {
  id: string;
  hostName: string;
  propertyName: string;
  date: string; // yyyy-mm-dd
  location: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  price: number; // price per month
  duration: number; // duration in months
}

const sampleBookings: Booking[] = [
  {
    id: "1",
    hostName: "Cole Palmer",
    propertyName: "Great Hotel Kiyovu",
    date: "2025-08-15",
    location: "Kigali",
    status: "confirmed",
    price: 450,
    duration: 3,
  },
  {
    id: "2",
    hostName: "william estavio",
    propertyName: "Pacific Hotel",
    date: "2025-09-01",
    location: "Musanze",
    status: "pending",
    price: 500,
    duration: 1,
  },
  {
    id: "3",
    hostName: "liam Delap",
    propertyName: "Grand legacy Hotel",
    date: "2025-07-25",
    location: "Kigali",
    status: "cancelled",
    price: 660,
    duration: 2,
  },
  {
    id: "4",
    hostName: "Enzo fernandes",
    propertyName: "Blue Radissong",
    date: "2025-10-12",
    location: "Rubavu",
    status: "completed",
    price: 550,
    duration: 6,
  },
  {
    id: "5",
    hostName: "Cole Palmer",
    propertyName: "Great Hotel Kiyovu",
    date: "2025-09-10",
    location: "Kigali",
    status: "confirmed",
    price: 630,
    duration: 4,
  },
];

const statusColors: Record<Booking["status"], string> = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

const formatMonthlyDuration = (months: number): string =>
  months === 1 ? "1 month" : `${months} months`;

export default function UserBookingDashboard() {
  const [bookings, setBookings] = useState<Booking[]>(sampleBookings);

  const [searchHost, setSearchHost] = useState("");
  const [searchProperty, setSearchProperty] = useState("");
  const [filterStatus, setFilterStatus] = useState<Booking["status"] | "all">("all");

  const [modalBooking, setModalBooking] = useState<Booking | null>(null);
  const [modalType, setModalType] = useState<"view" | "delete" | null>(null);

  // Filter bookings by host, property, and status
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const hostMatch = b.hostName.toLowerCase().includes(searchHost.toLowerCase());
      const propMatch = b.propertyName.toLowerCase().includes(searchProperty.toLowerCase());
      const statusMatch = filterStatus === "all" ? true : b.status === filterStatus;
      return hostMatch && propMatch && statusMatch;
    });
  }, [bookings, searchHost, searchProperty, filterStatus]);

  const openModal = (booking: Booking, type: "view" | "delete") => {
    setModalBooking(booking);
    setModalType(type);
  };
  const closeModal = () => {
    setModalBooking(null);
    setModalType(null);
  };

  const confirmDelete = () => {
    if (modalBooking) {
      setBookings((prev) => prev.filter((b) => b.id !== modalBooking.id));
      closeModal();
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 p-4 rounded-lg shadow text-center">
          <p className="text-indigo-700 font-semibold">Total Bookings</p>
          <p className="text-indigo-900 font-bold text-3xl">{bookings.length}</p>
        </div>
        <div className="bg-teal-50 p-4 rounded-lg shadow text-center">
          <p className="text-teal-700 font-semibold">Confirmed</p>
          <p className="text-teal-900 font-bold text-3xl">
            {bookings.filter((b) => b.status === "confirmed").length}
          </p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg shadow text-center">
          <p className="text-amber-700 font-semibold">Pending</p>
          <p className="text-amber-900 font-bold text-3xl">
            {bookings.filter((b) => b.status === "pending").length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow text-center">
          <p className="text-red-700 font-semibold">Cancelled</p>
          <p className="text-red-900 font-bold text-3xl">
            {bookings.filter((b) => b.status === "cancelled").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search Host Name..."
          className="border rounded px-3 py-2 flex-1 min-w-[150px]"
          value={searchHost}
          onChange={(e) => setSearchHost(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search Property..."
          className="border rounded px-3 py-2 flex-1 min-w-[150px]"
          value={searchProperty}
          onChange={(e) => setSearchProperty(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Booking["status"] | "all")}
        >
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        {filteredBookings.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No bookings found.</p>
        ) : (
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">
              <tr>
                <th className="p-3">Host Name</th>
                <th className="p-3">Property</th>
                <th className="p-3">Date</th>
                <th className="p-3">Location</th>
                <th className="p-3">Status</th>
                <th className="p-3">Price (per month)</th>
                <th className="p-3">Duration</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3">{b.hostName}</td>
                  <td className="p-3">{b.propertyName}</td>
                  <td className="p-3">{b.date}</td>
                  <td className="p-3">{b.location}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        statusColors[b.status]
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3">${b.price.toFixed(2)}</td>
                  <td className="p-3">{formatMonthlyDuration(b.duration)}</td>
                  <td className="p-3 text-right space-x-2">
                    {/* View */}
                    <button
                      onClick={() => openModal(b, "view")}
                      aria-label="View booking"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      View
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => openModal(b, "delete")}
                      aria-label="Delete booking"
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7L5 21M5 7l14 14"
                        />
                      </svg>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalBooking && modalType && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {modalType === "view" && (
              <>
                <h2 className="text-xl font-bold mb-4">Booking Details</h2>
                <p>
                  <strong>Host Name:</strong> {modalBooking.hostName}
                </p>
                <p>
                  <strong>Property:</strong> {modalBooking.propertyName}
                </p>
                <p>
                  <strong>Date:</strong> {modalBooking.date}
                </p>
                <p>
                  <strong>Location:</strong> {modalBooking.location}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      statusColors[modalBooking.status]
                    }`}
                  >
                    {modalBooking.status}
                  </span>
                </p>
                <p>
                  <strong>Price per month:</strong> ${modalBooking.price.toFixed(2)}
                </p>
                <p>
                  <strong>Duration:</strong> {formatMonthlyDuration(modalBooking.duration)}
                </p>
                <p className="mt-2 font-semibold">
                  Total Paid: $
                  {(modalBooking.price * modalBooking.duration).toFixed(2)}
                </p>
                <button
                  onClick={closeModal}
                  className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </>
            )}

            {modalType === "delete" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-red-600">
                  Confirm Deletion
                </h2>
                <p>
                  Are you sure you want to delete the booking for{" "}
                  <strong>{modalBooking.hostName}</strong> -{" "}
                  <em>{modalBooking.propertyName}</em>?
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
