import { createContext, useContext, useState, type ReactNode } from "react";
import type { Customer } from "../types/customer";

export interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => void;
  updateCustomer: (id: string, customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
}

const initialCustomers: Customer[] = [
  {
    id: "1",
    name: "Krishnan",
    email: "krishnan@gmail.com",
    phone: "1234567890",
    address: "123 Main St",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Adil",
    email: "adil@gmail.com",
    phone: "1234567890",
    address: "123 Main St",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Venkatesh",
    email: "venka@gmail.com",
    phone: "1234567890",
    address: "123 Main St",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Azhagar",
    email: "azhagar@gmail.com",
    phone: "1234567890",
    address: "123 Main St",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    name: "Elango",
    email: "ela@gmail.com",
    phone: "1234567890",
    address: "123 Main St",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  const addCustomer = (customerData: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Prepend new customer so it appears at top of the list
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const updateCustomer = (id: string, updatedData: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id
          ? { ...customer, ...updatedData, updatedAt: new Date() }
          : customer
      )
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((customer) => customer.id !== id));
  };

  const getCustomerById = (id: string) => {
    return customers.find((customer) => customer.id === id);
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomerContext must be used within a CustomerProvider");
  }
  return context;
};
