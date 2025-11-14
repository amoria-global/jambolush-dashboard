'use client';

import React, { useEffect, useState } from 'react';
import api from '@/app/api/apiService';
import { encodeId } from '@/app/utils/encoder';

interface TransactionDetailProps {
  id: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  bookingId?: string;
  propertyName?: string;
  paymentMethod?: string;
  transactionFee?: number;
  netAmount?: number;
  reference?: string;
}

export default function TransactionDetail({ id }: TransactionDetailProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch transaction using the actual backend endpoint
        // Based on your backend structure: GET /transactions/:id
        // Note: id is already decoded by parseViewDetailsParams
        const response = await api.get<any>(`/transactions/${id}`);

        if (response.ok && response.data.success) {
          setTransaction(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load transaction details');
        }
      } catch (err: any) {
        console.error('Error fetching transaction:', err);
        setError(err.message || 'An error occurred while loading transaction details');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'success') return 'bg-green-100 text-green-800';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'failed' || statusLower === 'error') return 'bg-red-100 text-red-800';
    if (statusLower === 'refunded') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transaction details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <i className="bi bi-exclamation-triangle text-3xl text-red-600"></i>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Error Loading Transaction
                </h3>
                <p className="text-red-800">{error || 'Transaction not found'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transaction Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            <i className="bi bi-receipt mr-2"></i>
            Transaction Details
          </h2>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>

        {/* Main Transaction Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Transaction ID</label>
            <p className="text-base font-mono text-gray-900">{transaction.id}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Type</label>
            <p className="text-base font-medium text-gray-900 capitalize">{transaction.type}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Amount</label>
            <p className="text-2xl font-bold text-gray-900">
              {formatAmount(transaction.amount, transaction.currency)}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Date</label>
            <p className="text-base text-gray-900">{formatDate(transaction.createdAt)}</p>
          </div>

          {transaction.reference && (
            <div>
              <label className="text-sm text-gray-600 block mb-1">Reference</label>
              <p className="text-base font-mono text-gray-900">{transaction.reference}</p>
            </div>
          )}

          {transaction.paymentMethod && (
            <div>
              <label className="text-sm text-gray-600 block mb-1">Payment Method</label>
              <p className="text-base text-gray-900 capitalize">{transaction.paymentMethod}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {transaction.description && (
          <div className="mb-6">
            <label className="text-sm text-gray-600 block mb-1">Description</label>
            <p className="text-base text-gray-900">{transaction.description}</p>
          </div>
        )}

        {/* Amount Breakdown */}
        {(transaction.transactionFee || transaction.netAmount) && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatAmount(transaction.amount, transaction.currency)}
                </span>
              </div>
              {transaction.transactionFee && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Fee</span>
                  <span className="font-medium text-gray-900">
                    {formatAmount(transaction.transactionFee, transaction.currency)}
                  </span>
                </div>
              )}
              {transaction.netAmount && (
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-900 font-semibold">Net Amount</span>
                  <span className="font-bold text-gray-900">
                    {formatAmount(transaction.netAmount, transaction.currency)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related Booking */}
        {transaction.bookingId && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-medium">Related Booking</p>
                <p className="text-sm text-blue-700">
                  Booking ID: {transaction.bookingId}
                  {transaction.propertyName && ` - ${transaction.propertyName}`}
                </p>
              </div>
              <a
                href={`/view-details?ref=${encodeId(transaction.bookingId)}&type=booking`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                View Booking
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
