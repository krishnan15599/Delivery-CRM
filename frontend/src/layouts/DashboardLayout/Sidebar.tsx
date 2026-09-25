import { NavLink } from "react-router-dom";
import { Truck, Home, Users, Package, User, BarChart2, Settings, LogOut } from "lucide-react";

const Sidebar = () => {
  const navItems = [
    { name: "Dashboard", icon: Home, path: "/dashboard" },
    { name: "Customers", icon: Users, path: "/customers" },
    { name: "Deliveries", icon: Package, path: "/deliveries" },
    { name: "Agents", icon: User, path: "/agents" },
    { name: "Reports", icon: BarChart2, path: "/reports" },
  ];

  return (
    <div className="w-64 bg-[#263141] text-[#aebbd0] flex flex-col h-full font-sans">
      <div className="p-6 flex items-center space-x-3 text-white">
        <Truck className="w-6 h-6 text-[#5b89e8]" />
        <span className="text-xl font-semibold tracking-wide">Delivery CRM</span>
      </div>
      
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                isActive
                  ? "bg-[#2c5fbf] text-white"
                  : "hover:bg-[#2e3b4e] hover:text-white"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-6 space-y-1">
        <div className="border-t border-[#374558] my-4 mx-4"></div>
        <button className="flex items-center space-x-3 px-4 py-3 w-full rounded-md hover:bg-[#2e3b4e] hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm">Settings</span>
        </button>
        <button className="flex items-center space-x-3 px-4 py-3 w-full rounded-md hover:bg-[#2e3b4e] hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;