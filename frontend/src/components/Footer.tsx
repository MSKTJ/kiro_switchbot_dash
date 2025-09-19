const Footer = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Copyright and Info */}
          <div className="text-center md:text-left">
            <p className="text-gray-400 text-sm">
              &copy; 2024 SwitchBot Dashboard
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Built with React + TypeScript + Tailwind CSS
            </p>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
              <span className="text-gray-400">フロントエンド</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-warning-400 rounded-full"></div>
              <span className="text-gray-400">バックエンド</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-gray-400">SwitchBot API</span>
            </div>
          </div>

          {/* Version Info */}
          <div className="text-center md:text-right">
            <p className="text-gray-500 text-xs">
              Version 1.0.0
            </p>
            <p className="text-gray-500 text-xs mt-1">
              最終更新: {new Date().toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;