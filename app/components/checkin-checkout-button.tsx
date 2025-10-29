'use client';

import React, { useState } from 'react';
import CheckInOutModal from './checkin-checkout-modal';

interface CheckInOutButtonProps {
  userType: 'host' | 'tourguide';
}

const CheckInOutButton: React.FC<CheckInOutButtonProps> = ({ userType }) => {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'checkin' | 'checkout'>('checkin');

  const handleOpenModal = (actionType: 'checkin' | 'checkout') => {
    setAction(actionType);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* Dropdown Button */}
      <div className="relative group">
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#083A85] hover:bg-gray-100 rounded-lg transition-colors"
          title={`Confirm ${userType === 'host' ? 'Guest' : 'Tour'} Check-in/Check-out`}
        >
          <i className="bi bi-clipboard-check text-lg" />
          <span className="hidden sm:inline">Confirm</span>
          <i className="bi bi-chevron-down text-xs" />
        </button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
          <div className="py-2">
            <button
              onClick={() => handleOpenModal('checkin')}
              className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="bi bi-door-open text-green-600" />
              </div>
              <span>Confirm Check-in</span>
            </button>
            <button
              onClick={() => handleOpenModal('checkout')}
              className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="bi bi-door-closed text-orange-600" />
              </div>
              <span>Confirm Check-out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Independent Modal using Portal - Modal now handles its own notifications */}
      <CheckInOutModal
        isOpen={showModal}
        onClose={handleCloseModal}
        action={action}
        userType={userType}
      />
    </>
  );
};

export default CheckInOutButton;
