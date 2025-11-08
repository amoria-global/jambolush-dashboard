'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { parseViewDetailsParams } from '@/app/utils/encoder';
import { Suspense, useEffect } from 'react';
import TransactionDetail from '@/app/components/details/transaction-detail';
import BookingDetail from '@/app/components/details/booking-detail';
import PropertyDetail from '@/app/components/details/property-detail';
import UserDetail from '@/app/components/details/user-detail';

function ViewDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const params = parseViewDetailsParams(searchParams);

  // Set page title based on detail type
  useEffect(() => {
    if (params) {
      const { type } = params;
      const titles: Record<string, string> = {
        'transaction': 'Transaction Details',
        'booking': 'Booking Details',
        'property-booking': 'Property Booking Details',
        'tour-booking': 'Tour Booking Details',
        'property': 'Property Details',
        'tour': 'Tour Details',
        'user': 'User Details'
      };
      document.title = titles[type] || 'View Details';
    } else {
      document.title = 'Invalid Link';
    }
  }, [params]);

  if (!params) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-4">
              <i className="bi bi-exclamation-triangle text-4xl text-red-500"></i>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Invalid Link</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            The link you followed is invalid or has expired. Please check the URL and try again.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center px-6 py-3 bg-[#083A85] text-white rounded-lg font-medium hover:bg-[#062d65] transition-all shadow-sm hover:shadow-md"
          >
            <i className="bi bi-house-door mr-2"></i>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const { id, type } = params;

  return (
    <div className="min-h-screen bg-white pt-5">

      {/* Detail Component Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {type === 'transaction' && <TransactionDetail id={id} />}

        {/* Booking types */}
        {type === 'booking' && <BookingDetail id={id} />}
        {type === 'property-booking' && <BookingDetail id={id} bookingType="property" />}
        {type === 'tour-booking' && <BookingDetail id={id} bookingType="tour" />}

        {(type === 'property' || type === 'tour') && (
          <PropertyDetail id={id} type={type as 'property' | 'tour'} />
        )}
        {type === 'user' && <UserDetail id={id} />}

        {/* Fallback for unknown types */}
        {!['transaction', 'booking', 'property-booking', 'tour-booking', 'property', 'tour', 'user'].includes(type) && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <i className="bi bi-exclamation-triangle text-2xl text-amber-600"></i>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-amber-900 mb-2">
                    Unknown Detail Type
                  </h2>
                  <p className="text-amber-800 mb-3">
                    The detail type "{type}" is not supported.
                  </p>
                  <p className="text-sm text-amber-700">
                    Supported types: transaction, booking, property-booking, tour-booking, property, tour, user
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ViewDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#083A85] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-lg mt-4 font-medium">Loading details...</p>
        </div>
      </div>
    }>
      <ViewDetailsContent />
    </Suspense>
  );
}
