const { supabase } = require("../config/supabase")


const getCustomers = async (_req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({
                success: false,
                message: 'Database not initialized. Please check .env credentials.'
            });
        }
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(200).json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Server Error: ' + err.message
        });
    }
}
const createCustomer = async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({
                success: false,
                message: 'Database not initialized.'
            })
        }
        const { name, email, phone, address, city, state, pincode, status } = req.body;
        // 2. Validation: Mandatory fields iruka nu check panrom
        if (!name || !phone || !address) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, and address are required fields.'
            });
        }
        // 3. Supabase-la row insert panrom
        const { data, error } = await supabase
            .from('customers')
            .insert([
                {
                    name,
                    email,
                    phone,
                    address,
                    city: city || 'Chennai',
                    state: state || 'Tamil Nadu',
                    pincode,
                    status: status || 'Active'
                }
            ])
            .select();
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Customer created sucessfully',
            data: data[0]
        })

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Server Error: ' + err.message
        });
    }
}
module.exports = {
    getCustomers,
    createCustomer
}