import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';
import Agents from './pages/Agents/Agents';
import AddCustomer from './pages/Customers/AddCustomer';
import EditCustomer from './pages/Customers/EditCustomer';
// import CustomerDetails from './pages/CustomerDetails/CustomerDetails';
import Customers from './pages/Customers/Customers';
import Dashboard from './pages/Dashboard/Dashboard';
import Deliveries from './pages/Deliveries/Deliveries';
import Login from './pages/Login/Login';
import Reports from './pages/Reports/Reports';
import { CustomerProvider } from './context/CustomerContext';

function App() {
  return (
    <CustomerProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers">
              <Route index element={<Customers />} />
              <Route path="add" element={<AddCustomer />} />
              <Route path="edit/:id" element={<EditCustomer />} />
              {/* <Route path=":id" element={<CustomerDetails />} /> */}
            </Route>
            <Route path="/deliveries" element={<Deliveries />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CustomerProvider>
  );
}

export default App;
