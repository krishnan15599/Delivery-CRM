import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCustomerContext } from "../../context/CustomerContext"

const Customers = () => {
  const { customers, deleteCustomer } = useCustomerContext()
  const [search, setSearch] = useState("")

  const filterCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.toLowerCase().includes(search.toLowerCase()) ||
    customer.address.toLowerCase().includes(search.toLowerCase())
  )

  const navigate = useNavigate()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Customers</h2>
        <p className="text-base text-gray-500">Manage your customer relationships and data.</p>
      </div>

      {/* search bar and add customer button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400 text-gray-900"
          />
        </div>
        <button 
          onClick={() => navigate("/customers/add")}
          className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/20 active:scale-[0.98] transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* customers table */}
      <div className="w-full overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                <th className="p-4 px-6">Name</th>
                <th className="p-4 px-6">Email</th>
                <th className="p-4 px-6">Phone</th>
                <th className="p-4 px-6">Address</th>
                <th className="p-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filterCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-4 px-6 font-medium text-gray-900">{customer.name}</td>
                  <td className="p-4 px-6 text-gray-500">{customer.email}</td>
                  <td className="p-4 px-6 text-gray-500">{customer.phone}</td>
                  <td className="p-4 px-6 text-gray-500 truncate max-w-[200px]">{customer.address}</td>
                  <td className="p-4 px-6 flex items-center justify-end gap-2">
                    <button 
                      onClick={() => navigate(`/customers/edit/${customer.id}`)}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteCustomer(customer.id)}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 shadow-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Customers
