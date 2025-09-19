import { useState } from 'react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">SB</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">
                SwitchBot Dashboard
              </h1>
              <p className="text-xs text-gray-400 -mt-1">スマートホーム制御</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-white">Dashboard</h1>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#dashboard" 
              className="text-primary-400 hover:text-primary-300 transition-colors font-medium border-b-2 border-primary-400 pb-1"
            >
              ダッシュボード
            </a>
            <a 
              href="#devices" 
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              デバイス
            </a>
            <a 
              href="#settings" 
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              設定
            </a>
            <div className="flex items-center space-x-2 ml-4">
              <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">オンライン</span>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="メニューを開く"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <nav className="flex flex-col space-y-4">
              <a 
                href="#dashboard" 
                className="text-primary-400 font-medium px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ダッシュボード
              </a>
              <a 
                href="#devices" 
                className="text-gray-300 hover:text-white transition-colors px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                デバイス
              </a>
              <a 
                href="#settings" 
                className="text-gray-300 hover:text-white transition-colors px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                設定
              </a>
              <div className="flex items-center space-x-2 px-2 py-1">
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">システム状態: オンライン</span>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;