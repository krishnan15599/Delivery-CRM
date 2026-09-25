import { Users, Package, Clock, IndianRupee, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    {
      title: "Customers",
      value: "1,248",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Deliveries",
      value: "856",
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Pending",
      value: "124",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Revenue",
      value: "₹45,680",
      icon: IndianRupee,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  const deliveryStatuses = [
    { label: "Delivered", percentage: 68, color: "bg-emerald-500" },
    { label: "Pending", percentage: 18, color: "bg-amber-500" },
    { label: "Failed", percentage: 8, color: "bg-rose-500" },
    { label: "Cancelled", percentage: 6, color: "bg-gray-400" },
  ];

  const recentDeliveries = [
    {
      id: 1,
      customer: "Hari",
      agent: "Ramesh",
      amount: "₹1,500",
      status: "Delivered",
      statusBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      date: "Today",
    },
    {
      id: 2,
      customer: "Kumar",
      agent: "Arun",
      amount: "₹850",
      status: "Pending",
      statusBg: "bg-amber-50 text-amber-700 border-amber-200",
      date: "Today",
    },
    {
      id: 3,
      customer: "Ravi",
      agent: "Kumar",
      amount: "₹2,000",
      status: "In Progress",
      statusBg: "bg-blue-50 text-blue-700 border-blue-200",
      date: "Today",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Chart & Delivery Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Overview Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Delivery Overview</h2>
              <p className="text-xs text-gray-500">Weekly delivery performance trend</p>
            </div>
            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> +14.2%
            </span>
          </div>

          {/* Bar Chart representation */}
          <div className="h-56 w-full flex flex-col justify-end pt-4">
            <div className="flex-1 flex items-end justify-between gap-3 px-2">
              {[
                { day: "Mon", count: 65, height: "45%" },
                { day: "Tue", count: 95, height: "65%" },
                { day: "Wed", count: 140, height: "90%" },
                { day: "Thu", count: 110, height: "75%" },
                { day: "Fri", count: 125, height: "82%" },
                { day: "Sat", count: 85, height: "58%" },
                { day: "Sun", count: 70, height: "48%" },
              ].map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] py-1 px-2 rounded shadow pointer-events-none z-10 whitespace-nowrap">
                    {item.count} Deliveries
                  </div>
                  <div className="w-full max-w-[42px] bg-blue-50 rounded-t-lg relative overflow-hidden flex items-end h-40">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:from-blue-500 group-hover:to-indigo-400"
                      style={{ height: item.height }}
                    ></div>
                  </div>
                  <span className="mt-2 text-xs text-gray-500 font-medium">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Status Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Delivery Status</h2>
            <p className="text-xs text-gray-500 mb-6">Current delivery status distribution</p>

            <div className="space-y-4">
              {deliveryStatuses.map((status, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${status.color}`}></span>
                      <span className="font-medium text-gray-700">{status.label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{status.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${status.color} transition-all duration-500`}
                      style={{ width: `${status.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500">Total processed this month: <strong className="text-gray-900">1,192</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Deliveries Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Deliveries</h2>
            <p className="text-xs text-gray-500">Latest active delivery transactions</p>
          </div>
          <Link
            to="/deliveries"
            className="flex items-center text-xs font-semibold text-[#1a65ec] hover:text-blue-700 transition-colors gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-semibold uppercase text-gray-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Agent</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{delivery.customer}</td>
                  <td className="py-4 px-6 text-gray-600">{delivery.agent}</td>
                  <td className="py-4 px-6 font-semibold text-gray-900">{delivery.amount}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-md border ${delivery.statusBg}`}>
                      {delivery.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-xs">{delivery.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

