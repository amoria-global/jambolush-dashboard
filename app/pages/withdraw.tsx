import React, { useState, FC } from 'react';

// Define types for better code clarity and type safety
interface Account {
  method: string;
  details: { [key: string]: string };
}

// WithdrawalPage is the main component that manages the withdrawal process.
const WithdrawalPage: FC = () => {
  // State to manage the user's available balance
  const [balance, setBalance] = useState<number>(5325.50);
  // State to store the withdrawal amount entered by the user
  const [amount, setAmount] = useState<string>('');
  // State for the currently selected withdrawal method
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  // State to store pre-configured accounts for different methods
  const [userAccounts, setUserAccounts] = useState<Account[]>([
    { method: 'Bank Transfer', details: { bankName: 'First National Bank', accountNumber: '****1234' } },
  ]);

  // State to control the visibility of the confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  // State to control the visibility of the account setup modal
  const [showAccountSetupModal, setShowAccountSetupModal] = useState<boolean>(false);
  // State for the temporary account details being entered in the setup modal
  const [newAccountDetails, setNewAccountDetails] = useState<{ [key: string]: string }>({});

  // Define the available withdrawal methods with their colors and logos
  const withdrawalMethods = [
    { 
      name: 'Bank Transfer', 
      fields: ['bankName', 'accountHolder', 'accountNumber', 'routingNumber'],
      color: 'from-blue-100 to-blue-200',
      textColor: 'text-blue-600',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 8h20l-2 12H4L2 8zm0 0V6a2 2 0 012-2h16a2 2 0 012 2v2M7 16h.01M17 16h.01" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      name: 'PayPal', 
      fields: ['paypalEmail'],
      color: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-600',
      logo: (
        <div className="w-8 h-8 relative flex items-center justify-center">
          <span className="absolute font-bold text-lg text-blue-900 transform -translate-x-0.5">P</span>
          <span className="absolute font-bold text-lg text-blue-400 transform translate-x-0.5">P</span>
        </div>
      )
    },
    { 
      name: 'Wise', 
      fields: ['wiseEmail', 'currency'],
      color: 'from-green-50 to-green-100',
      textColor: 'text-green-600',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      )
    },
    {
      name: 'MoMo',
      fields: ['phoneNumber', 'networkProvider'],
      color: 'from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-600',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          {/* Simple phone icon */}
          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21 11.36 11.36 0 003.55.57 1 1 0 011 1v3.79a1 1 0 01-1 1A17 17 0 013 6a1 1 0 011-1h3.79a1 1 0 011 1 11.36 11.36 0 00.57 3.55 1 1 0 01-.21 1.11l-2.53 2.53z" />
        </svg>
      )
    },
    {
      name: 'Mpesa',
      fields: ['phoneNumber', 'accountName'],
      color: 'from-green-50 to-green-200',
      textColor: 'text-green-700',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          {/* Simple wallet icon */}
          <path d="M21 7H3a2 2 0 00-2 2v8a2 2 0 002 2h18a2 2 0 002-2v-8a2 2 0 00-2-2zM3 9h18v2H3V9z" />
        </svg>
      )
    }
  ];

  // Handler for when the user clicks a withdrawal method button
  const handleMethodSelect = (methodName: string) => {
    setSelectedMethod(methodName);
    const hasAccount = userAccounts.some(account => account.method === methodName);
    if (!hasAccount) {
      // If no account exists, show the setup modal
      setShowAccountSetupModal(true);
      // Reset new account details for the new method
      setNewAccountDetails({});
    }
  };

  // Handler for submitting the account setup
  const handleAccountSetup = () => {
    // Add the new account to the user's list
    const newAccount: Account = { method: selectedMethod, details: newAccountDetails };
    setUserAccounts([...userAccounts, newAccount]);
    // Close the modal
    setShowAccountSetupModal(false);
  };

  // Handler for initiating the withdrawal (shows the confirmation modal)
  const handleWithdrawal = () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount > 0 && numericAmount <= balance && selectedMethod) {
      setShowConfirmationModal(true);
    }
  };

  // Handler for confirming the withdrawal
  const handleConfirmWithdrawal = () => {
    const numericAmount = parseFloat(amount);
    // In a real application, this is where you would call an API to process the withdrawal.
    console.log(`Withdrawing ${numericAmount} via ${selectedMethod}`);
    setBalance(prevBalance => prevBalance - numericAmount);
    setAmount('');
    setShowConfirmationModal(false);
  };

  // Get the account details for the selected method to display them
  const currentAccountDetails = userAccounts.find(acc => acc.method === selectedMethod)?.details;

  // A helper component to render the appropriate input fields for the account setup modal
  const renderAccountFields = () => {
    const method = withdrawalMethods.find(m => m.name === selectedMethod);
    if (!method) return null;

    return method.fields.map(field => (
      <div key={field} className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
          {field.replace(/([A-Z])/g, ' $1')}
        </label>
        <input
          type={field.includes('email') ? 'email' : 'text'}
          required
          value={newAccountDetails[field] || ''}
          onChange={(e) => setNewAccountDetails({ ...newAccountDetails, [field]: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-all duration-200 bg-gray-50 focus:bg-white"
        />
      </div>
    ));
  };

  // SVG for a money withdrawal icon
  const WithdrawalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#083A85] to-[#0a4ea3] text-white rounded-2xl flex items-center justify-center shadow-lg">
            <WithdrawalIcon />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Withdraw Funds</h1>
            <p className="text-gray-500">Securely transfer your money</p>
          </div>
        </div>
        
        {/* Current Balance */}
        <div className="bg-gradient-to-r from-[#083A85] to-[#0a4ea3] rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100 mb-1">Available Balance</p>
              <p className="text-4xl font-bold">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-6xl opacity-20">💰</div>
          </div>
        </div>

        {/* Withdrawal Amount Input */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Withdrawal Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-500 text-lg font-semibold">$</span>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-4 text-lg font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
          </div>
        </div>

        {/* Withdrawal Method Selection */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-4">Choose Withdrawal Method</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {withdrawalMethods.map((method) => (
              <button
                key={method.name}
                onClick={() => handleMethodSelect(method.name)}
                className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 ${
                  selectedMethod === method.name
                    ? 'border-[#083A85] bg-gradient-to-r from-[#083A85] to-[#0a4ea3] text-white shadow-2xl scale-105'
                    : `border-gray-200 bg-gradient-to-r ${method.color} ${method.textColor} hover:border-gray-300 hover:shadow-lg`
                }`}
              >
                <div className="flex flex-col items-center space-y-2 text-center">
                  <div className={selectedMethod === method.name ? 'text-white' : method.textColor}>
                    {method.logo}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{method.name}</div>
                    {selectedMethod === method.name && (
                      <div className="text-xs text-blue-100">Selected</div>
                    )}
                  </div>
                </div>
                {selectedMethod === method.name && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Display Account Details if available */}
        {selectedMethod && currentAccountDetails && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 mb-8 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {selectedMethod} Account
              </h3>
              <button
                onClick={() => setShowAccountSetupModal(true)}
                className="px-4 py-2 text-sm font-semibold text-[#083A85] hover:text-[#0a4ea3] transition-colors bg-white rounded-lg shadow hover:shadow-md"
              >
                Change Account
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentAccountDetails).map(([key, value]) => (
                <div key={key} className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
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
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 transform ${
            amount && selectedMethod
              ? 'bg-gradient-to-r from-[#083A85] to-[#0a4ea3] text-white hover:shadow-2xl hover:scale-105 active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!amount || !selectedMethod}
        >
          {amount && selectedMethod ? `Withdraw $${parseFloat(amount || '0').toFixed(2)}` : 'Select Method & Amount'}
        </button>

        {/* Account Setup Modal */}
        {showAccountSetupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  selectedMethod === 'Bank Transfer' ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600' :
                  selectedMethod === 'PayPal' ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600' :
                  selectedMethod === 'Wise' ? 'bg-gradient-to-br from-green-50 to-green-100 text-green-600' :
                  selectedMethod === 'MoMo' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600' :
                  selectedMethod === 'Mpesa' ? 'bg-gradient-to-br from-green-50 to-green-200 text-green-700' :
                  'bg-gradient-to-br from-[#083A85] to-[#0a4ea3] text-white'
                }`}>
                  {withdrawalMethods.find(m => m.name === selectedMethod)?.logo}
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Setup {selectedMethod}
                </h2>
              </div>
              <div>
                {renderAccountFields()}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setShowAccountSetupModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAccountSetup}
                    className="flex-1 bg-gradient-to-r from-[#083A85] to-[#0a4ea3] text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    Save Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                  ✅
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Confirm Withdrawal
                </h3>
                <p className="text-gray-600">
                  Withdraw <strong>${parseFloat(amount || '0').toFixed(2)}</strong> using <strong>{selectedMethod}</strong>?
                </p>
              </div>
              <div className="flex justify-between gap-4">
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmWithdrawal}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:shadow-lg transition-all duration-200"
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
