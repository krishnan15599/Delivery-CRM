import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useCustomerContext } from "../../context/CustomerContext"

const EditCustomer = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { getCustomerById, updateCustomer } = useCustomerContext()

    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        phone: string;
        address: string;
    }>({
        name: "",
        email: "",
        phone: "",
        address: "",
    })

    const [isNotFound, setIsNotFound] = useState(false)

    useEffect(() => {
        if (id) {
            const customer = getCustomerById(id)
            if (customer) {
                setFormData({
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address,
                })
            } else {
                setIsNotFound(true)
            }
        }
    }, [id, getCustomerById])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (id) {
            updateCustomer(id, formData)
            navigate("/customers")
        }
    }

    if (isNotFound) {
        return (
            <div className="max-w-md mx-auto text-center py-16 space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Customer Not Found</h2>
                <p className="text-gray-500">The customer you are trying to edit does not exist or was removed.</p>
                <button
                    onClick={() => navigate("/customers")}
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                >
                    Back to Customers
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto py-4">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate("/customers")}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Customer</h2>
                    <p className="text-sm text-gray-500 mt-1">Update customer details and profile.</p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Full Name</label>
                            <input 
                                type="text" 
                                name="name" 
                                placeholder="e.g. John Doe"
                                value={formData.name} 
                                onChange={handleChange} 
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Email Address</label>
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="e.g. john@example.com"
                                value={formData.email} 
                                onChange={handleChange} 
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                            <input 
                                type="tel" 
                                name="phone" 
                                placeholder="e.g. +1 234 567 8900"
                                value={formData.phone} 
                                onChange={handleChange} 
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Address</label>
                            <input 
                                type="text" 
                                name="address" 
                                placeholder="e.g. 123 Main St, City"
                                value={formData.address} 
                                onChange={handleChange} 
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100">
                        <button 
                            type="button" 
                            onClick={() => navigate("/customers")}
                            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all focus:outline-none focus:ring-4 focus:ring-gray-200"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm hover:shadow-md hover:shadow-blue-500/20 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                        >
                            Update Customer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditCustomer
