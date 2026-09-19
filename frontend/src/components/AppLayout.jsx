import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import UploadDocumentModal from './UploadDocumentModal';

export default function AppLayout({ children }) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onQuickIntake={() => setShowUploadModal(true)} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Quick Intake Modal */}
      {showUploadModal && (
        <UploadDocumentModal 
          isOpen={showUploadModal} 
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
