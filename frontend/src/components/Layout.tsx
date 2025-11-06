import React, { type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';
import PixelGift from './PixelGift';
import PixelIcon from './PixelIcon';

interface LayoutProps {
  children: ReactNode;
}

// Generate consistent variant number from user ID
const getVariantFromId = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Hide "Create Group" button in header when on dashboard (Dashboard page has its own conditional button)
  const isDashboard = location.pathname === '/';
  const showCreateGroupInHeader = !isDashboard;

  return (
    <div className="min-h-screen" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(220, 38, 38, 0.02) 10px, rgba(220, 38, 38, 0.02) 20px)' }}>
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <PixelGift size={40} />
              <div>
                <span className="text-2xl font-bold text-primary-600 pixel-text" style={{ fontSize: '18px' }}>
                  SECRET SANTA
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <PixelIcon name="snowflake" size={8} color="#16a34a" />
                  <PixelIcon name="star" size={8} color="#ffd700" />
                  <PixelIcon name="snowflake" size={8} color="#dc2626" />
                </div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-900 hover:text-primary-600 px-4 py-2 text-sm font-medium border-2 border-transparent hover:border-primary-600 transition-all"
                style={{ boxShadow: '0px 0px 0px 0px' }}
              >
                Dashboard
              </Link>
              {showCreateGroupInHeader && (
                <Link
                  to="/create-group"
                  className="text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 text-sm font-medium border-2 border-primary-800 transition-all"
                  style={{ boxShadow: '4px 4px 0px 0px rgb(127 29 29)' }}
                >
                  Create Group
                </Link>
              )}

              {/* User menu */}
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l-2 border-gray-300">
                <div className="flex items-center space-x-2">
                  {user?.id && (
                    <PixelIcon 
                      name="person" 
                      size={32} 
                      color="#dc2626" 
                      variant={getVariantFromId(user.id)} 
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-900 hover:text-primary-600 px-3 py-2 text-sm font-medium border-2 border-gray-300 hover:border-primary-600 transition-all"
                  style={{ boxShadow: '2px 2px 0px 0px rgb(156 163 175)' }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Decorative snowflakes */}
      <div className="fixed top-20 right-10 opacity-10 pointer-events-none">
        <PixelIcon name="snowflake" size={60} color="#dc2626" />
      </div>
      <div className="fixed bottom-20 left-10 opacity-10 pointer-events-none">
        <PixelIcon name="snowflake" size={40} color="#16a34a" />
      </div>
    </div>
  );
};

export default Layout;
