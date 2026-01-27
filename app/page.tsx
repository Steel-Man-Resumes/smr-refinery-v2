'use client';

import { useState, useEffect } from 'react';
import { useRefinery } from '@/store/refineryStore';
import Button from '@/components/ui/Button';
import ReceptionStage from '@/components/refinery/ReceptionStage';
import ConfirmProfileStage from '@/components/refinery/ConfirmProfileStage';
import Screening1Stage from '@/components/refinery/Screening1Stage';
import Screening2Stage from '@/components/refinery/Screening2Stage';
import Screening3Stage from '@/components/refinery/Screening3Stage';
import PortfolioStage from '@/components/refinery/PortfolioStage';
import PaymentStage from '@/components/refinery/PaymentStage';
import GenerationStage from '@/components/refinery/GenerationStage';
import DownloadStage from '@/components/refinery/DownloadStage';

function DestroyDataButton() {
  const { resetAll } = useRefinery();
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Start countdown when modal opens
  useEffect(() => {
    if (showConfirm && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showConfirm, countdown]);

  const handleDeleteClick = () => {
    setShowConfirm(true);
    setCountdown(3);
  };

  const handleConfirmDelete = () => {
    if (countdown === 0) {
      resetAll();
      window.location.reload();
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setCountdown(3);
  };

  return (
    <>
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <button className="destroy-data-btn" onClick={handleDeleteClick}>
          🗑️ Delete all my data
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              ⚠️ Permanent Data Deletion
            </h3>
            <p className="text-gray-700 mb-6">
              This will permanently delete ALL your information and cannot be undone.
              Are you absolutely sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={countdown > 0}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  countdown > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {countdown > 0 ? `Delete in ${countdown}...` : 'Delete Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function RefineryPage() {
  const { state } = useRefinery();

  // Scroll to top whenever stage changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.currentStage]);

  // Render based on current stage
  // Flow: reception → confirm-profile → screening(1-3) → portfolio → payment → generation → download
  const renderStage = () => {
    switch (state.currentStage) {
      case 'reception':
        return <ReceptionStage />;

      case 'confirm-profile':
        return <ConfirmProfileStage />;

      case 'screening-1':
        return <Screening1Stage />;

      case 'screening-2':
        return <Screening2Stage />;

      case 'screening-3':
        return <Screening3Stage />;

      case 'portfolio':
        return <PortfolioStage />;

      case 'payment':
        return <PaymentStage />;

      case 'generation':
        return <GenerationStage />;

      case 'download':
        return <DownloadStage />;

      default:
        return <ReceptionStage />;
    }
  };

  return (
    <div className="pb-24">
      {renderStage()}
      <DestroyDataButton />
    </div>
  );
}
