import { Search, Bell, Menu, ChevronDown } from "lucide-react";

const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 font-sans">
      <div className="flex items-center flex-1">
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md mr-4">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-[#f4f6f8] text-sm text-gray-700 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-gray-500 hover:text-gray-700">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 block w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#5b89e8] text-white flex items-center justify-center text-sm font-medium">
            KK
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 leading-none">Krishnan</span>
            <span className="text-xs text-gray-500 mt-1">Admin</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </header>
  );
};

export default Header;