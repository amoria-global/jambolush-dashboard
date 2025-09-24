"use client";

import React, { useState, FC } from 'react';

interface Account {
  method: string;
  details: { [key: string]: string };
}

const WithdrawalPage: FC = () => {
  const [balance, setBalance] = useState<number>(5325.50);
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [userAccounts, setUserAccounts] = useState<Account[]>([
    { method: 'Bank Transfer', details: { bankName: 'First National Bank', accountNumber: '****1234' } },
  ]);

  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [showAccountSetupModal, setShowAccountSetupModal] = useState<boolean>(false);
  const [newAccountDetails, setNewAccountDetails] = useState<{ [key: string]: string }>({});

  const primaryColor = '#083A85';
  const secondaryColor = '#F20C8F';

  const withdrawalMethods = [
    { name: 'Bank Transfer', fields: ['bankName', 'accountHolder', 'accountNumber', 'routingNumber'], color: primaryColor, imageUrl: '/profile/banktransfer.jpg' },
    { name: 'PayPal', fields: ['paypalEmail'], color: primaryColor, imageUrl: '/profile/paypal.jpg' },
    { name: 'Wise', fields: ['wiseEmail', 'currency'], color: primaryColor, imageUrl: '/profile/wise.jpg' },
    { name: 'MoMo', fields: ['phoneNumber', 'networkProvider'], color: primaryColor, imageUrl: '/profile/Momo.jpg' },
    { name: 'Mpesa', fields: ['phoneNumber', 'accountName'], color: primaryColor, imageUrl: '/profile/mpesa.jpg' }
  ];

  const handleMethodSelect = (methodName: string) => {
    setSelectedMethod(methodName);
    const hasAccount = userAccounts.some(acc => acc.method === methodName);
    if (!hasAccount) {
      setShowAccountSetupModal(true);
      setNewAccountDetails({});
    }
  };

  const handleAccountSetup = () => {
    const newAccount: Account = { method: selectedMethod, details: newAccountDetails };
    setUserAccounts([...userAccounts, newAccount]);
    setShowAccountSetupModal(false);
  };

  const handleWithdrawal = () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount > 0 && numericAmount <= balance && selectedMethod) {
      setShowConfirmationModal(true);
    }
  };

  const handleConfirmWithdrawal = () => {
    const numericAmount = parseFloat(amount);
    setBalance(prev => parseFloat((prev - numericAmount).toFixed(2)));
    setAmount('');
    setShowConfirmationModal(false);
  };

  const currentAccountDetails = userAccounts.find(acc => acc.method === selectedMethod)?.details;

  const renderAccountFields = () => {
    const method = withdrawalMethods.find(m => m.name === selectedMethod);
    if (!method) return null;

    return method.fields.map(field => (
      <div key={field} className="mb-2">
        <label className="block text-xs font-semibold text-gray-700 mb-1 capitalize">
          {field.replace(/([A-Z])/g, ' $1')}
        </label>
        <input
          type={field.includes('email') ? 'email' : 'text'}
          required
          value={newAccountDetails[field] || ''}
          onChange={(e) => setNewAccountDetails({ ...newAccountDetails, [field]: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
        />
      </div>
    ));
  };

  const numericAmount = parseFloat(amount || '0');
  const isWithdrawEnabled = selectedMethod && numericAmount > 0 && numericAmount <= balance;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-2">
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4">

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-[#083A85] text-white rounded-xl flex items-center justify-center shadow">
            💵
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Withdraw Funds</h1>
            <p className="text-gray-500 text-sm">Securely transfer your money</p>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-[#083A85] rounded-xl p-4 mb-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/80 mb-1">Available Balance</p>
              <p className="text-2xl font-bold">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="text-4xl opacity-20">💰</div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Withdrawal Amount</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm font-semibold">$</span>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-6 pr-3 py-2 text-sm font-semibold border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
          </div>
        </div>

        {/* Withdrawal Methods */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Choose Withdrawal Method</p>
          <div className="grid grid-cols-3 gap-2">
            {withdrawalMethods.map(method => (
              <button
                key={method.name}
                onClick={() => handleMethodSelect(method.name)}
                className={`relative overflow-hidden rounded-xl p-2 transition-all duration-200 shadow transform hover:scale-105 border-2 ${
                  selectedMethod === method.name ? 'text-white border-2' : 'border-gray-200 bg-white text-gray-800'
                }`}
                style={{ backgroundColor: selectedMethod === method.name ? method.color : 'white' }}
              >
                <div className="flex flex-col items-center space-y-1 text-center">
                  <div className="w-10 h-10 rounded-lg overflow-hidden">
                    <img src={method.imageUrl} alt={method.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="font-bold text-xs">{method.name}</div>
                  {selectedMethod === method.name && <div className="text-[10px] text-white">Selected</div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Account Details */}
        {selectedMethod && currentAccountDetails && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-800">{selectedMethod} Account</h3>
              <button
                onClick={() => setShowAccountSetupModal(true)}
                className="px-2 py-1 text-xs font-semibold bg-white rounded shadow text-[#083A85] hover:text-white hover:bg-[#083A85] transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(currentAccountDetails).map(([key, value]) => (
                <div key={key} className="bg-white rounded-lg p-2 shadow-sm">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </p>
                  <p className="text-sm font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Withdraw Button */}
        <button
          onClick={handleWithdrawal}
          className={`w-full py-2 px-4 rounded-xl font-bold text-sm shadow-lg transition-all duration-200 transform ${
            isWithdrawEnabled ? 'text-white hover:shadow-xl hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          style={{ backgroundColor: isWithdrawEnabled ? primaryColor : undefined }}
          disabled={!isWithdrawEnabled}
        >
          {isWithdrawEnabled ? `Withdraw $${numericAmount.toFixed(2)}` : 'Select Method & Amount'}
        </button>

        {/* Account Setup Modal */}
        {showAccountSetupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-sm max-h-[85vh] overflow-y-auto">
              <div className="flex items-center space-x-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: withdrawalMethods.find(m => m.name === selectedMethod)?.color }}
                >
                  <img
                    src={withdrawalMethods.find(m => m.name === selectedMethod)?.imageUrl}
                    alt={selectedMethod}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-sm font-bold text-gray-800">Setup {selectedMethod}</h2>
              </div>
              {renderAccountFields()}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowAccountSetupModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccountSetup}
                  className="flex-1 font-bold py-2 px-3 rounded-lg text-xs transition-all duration-200 cursor-pointer"
                  style={{ backgroundColor: primaryColor, color: 'white' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-sm">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-[#F20C8F] rounded-xl flex items-center justify-center mx-auto mb-2 text-xl">
                  <span className="text-white">💸</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Confirm Withdrawal</h3>
                <p className="text-gray-600 text-xs">
                  Withdraw <strong>${numericAmount.toFixed(2)}</strong> using <strong>{selectedMethod}</strong>?
                </p>
              </div>
              <div className="flex justify-between gap-2">
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmWithdrawal}
                  className="flex-1 py-2 rounded-lg bg-[#F20C8F] text-white font-bold hover:shadow-lg transition-all duration-200 text-xs"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WithdrawalPage;
