'use client';

import React from 'react';
import Link from 'next/link';
import { createViewDetailsUrl } from '@/app/utils/encoder';

/**
 * Example Component: View Details Link Examples
 *
 * This component demonstrates how to use the createViewDetailsUrl utility
 * to create links to the unified view details page for different entity types.
 *
 * Usage: Import this component in any page where you want to see examples
 * or use these patterns as reference for your own implementations.
 */

const ViewDetailsLinkExamples: React.FC = () => {
  // Example data
  const exampleTransaction = { id: 'txn_12345', description: 'Payment received', amount: 150.00 };
  const exampleBooking = { id: 'bk_67890', confirmationCode: 'ABC123', propertyName: 'Luxury Villa' };
  const exampleProperty = { id: 123, name: 'Modern Apartment', location: 'Downtown' };
  const exampleUser = { id: 456, name: 'John Doe', email: 'john@example.com' };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">View Details Link Examples</h1>
        <p className="text-gray-600 mb-6">
          This page demonstrates how to create links to the unified view details page for different entity types.
        </p>
      </div>

      {/* Transaction Example */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="bi bi-receipt text-[#083A85]" />
          Transaction Details Link
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Transaction ID:</strong> {exampleTransaction.id}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Description:</strong> {exampleTransaction.description}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Amount:</strong> ${exampleTransaction.amount.toFixed(2)}
          </p>
        </div>
        <Link
          href={createViewDetailsUrl(exampleTransaction.id, 'transaction')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors"
        >
          <i className="bi bi-eye" />
          View Transaction Details
        </Link>
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-800 font-mono">
            URL: {createViewDetailsUrl(exampleTransaction.id, 'transaction')}
          </p>
        </div>
      </div>

      {/* Booking Example */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="bi bi-calendar-check text-[#083A85]" />
          Booking Details Link
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Booking ID:</strong> {exampleBooking.id}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Confirmation Code:</strong> {exampleBooking.confirmationCode}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Property:</strong> {exampleBooking.propertyName}
          </p>
        </div>
        <Link
          href={createViewDetailsUrl(exampleBooking.id, 'booking')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors"
        >
          <i className="bi bi-eye" />
          View Booking Details
        </Link>
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-800 font-mono">
            URL: {createViewDetailsUrl(exampleBooking.id, 'booking')}
          </p>
        </div>
      </div>

      {/* Property Example */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="bi bi-house text-[#083A85]" />
          Property Details Link
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Property ID:</strong> {exampleProperty.id}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Name:</strong> {exampleProperty.name}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Location:</strong> {exampleProperty.location}
          </p>
        </div>
        <Link
          href={createViewDetailsUrl(exampleProperty.id, 'property')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors"
        >
          <i className="bi bi-eye" />
          View Property Details
        </Link>
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-800 font-mono">
            URL: {createViewDetailsUrl(exampleProperty.id, 'property')}
          </p>
        </div>
      </div>

      {/* Tour Example */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="bi bi-compass text-[#083A85]" />
          Tour Details Link
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Tour ID:</strong> {exampleProperty.id}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Name:</strong> {exampleProperty.name}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Location:</strong> {exampleProperty.location}
          </p>
        </div>
        <Link
          href={createViewDetailsUrl(exampleProperty.id, 'tour')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors"
        >
          <i className="bi bi-eye" />
          View Tour Details
        </Link>
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-800 font-mono">
            URL: {createViewDetailsUrl(exampleProperty.id, 'tour')}
          </p>
        </div>
      </div>

      {/* User Example */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="bi bi-person text-[#083A85]" />
          User Profile Link
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>User ID:</strong> {exampleUser.id}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Name:</strong> {exampleUser.name}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Email:</strong> {exampleUser.email}
          </p>
        </div>
        <Link
          href={createViewDetailsUrl(exampleUser.id, 'user')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors"
        >
          <i className="bi bi-eye" />
          View User Profile
        </Link>
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-800 font-mono">
            URL: {createViewDetailsUrl(exampleUser.id, 'user')}
          </p>
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="bi bi-code-square text-[#083A85]" />
          Code Examples
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Import the utility:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <code>{`import { createViewDetailsUrl } from '@/app/utils/encoder';`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Create a transaction link:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <code>{`const url = createViewDetailsUrl(transactionId, 'transaction');
<Link href={url}>View Details</Link>`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Create a booking link:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <code>{`const url = createViewDetailsUrl(bookingId, 'booking');
<Link href={url}>View Booking</Link>`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Create a property link:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <code>{`const url = createViewDetailsUrl(propertyId, 'property');
<Link href={url}>View Property</Link>`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Programmatic navigation:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <code>{`import { useRouter } from 'next/navigation';

const router = useRouter();
const url = createViewDetailsUrl(id, 'user');
router.push(url);`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Features Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="bi bi-lightbulb text-[#083A85]" />
          Key Features
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <i className="bi bi-check-circle-fill text-green-600 text-xl mt-0.5" />
            <div>
              <strong className="text-gray-900">Unified Endpoint:</strong>
              <p className="text-gray-600 text-sm">One page handles all entity types with query parameters</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <i className="bi bi-check-circle-fill text-green-600 text-xl mt-0.5" />
            <div>
              <strong className="text-gray-900">Secure Encoding:</strong>
              <p className="text-gray-600 text-sm">IDs are base64-encoded for URL safety and security</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <i className="bi bi-check-circle-fill text-green-600 text-xl mt-0.5" />
            <div>
              <strong className="text-gray-900">Type Safety:</strong>
              <p className="text-gray-600 text-sm">TypeScript support with proper type checking</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <i className="bi bi-check-circle-fill text-green-600 text-xl mt-0.5" />
            <div>
              <strong className="text-gray-900">Error Handling:</strong>
              <p className="text-gray-600 text-sm">Graceful error messages for invalid URLs or missing data</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <i className="bi bi-check-circle-fill text-green-600 text-xl mt-0.5" />
            <div>
              <strong className="text-gray-900">Responsive Design:</strong>
              <p className="text-gray-600 text-sm">Mobile-friendly detail pages with Tailwind CSS</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ViewDetailsLinkExamples;
