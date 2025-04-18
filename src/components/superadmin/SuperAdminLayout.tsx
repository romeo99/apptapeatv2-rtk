import { Menu as MenuIcon } from 'lucide-react';
import { ReactNode, useState } from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:sticky top-0 h-screen bg-white shadow-lg transition-all duration-300 ease-in-out z-50 w-64 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        <SuperAdminSidebar onClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm sticky top-0 z-30">
          <div className="h-16 flex items-center justify-between px-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <img
              src="https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"
              alt="TapEat"
              className="h-8"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-x-auto">
          {children}
        </div>
      </div>
    </div>
  );
}