import { createContext, useContext, useState } from "react";
import type { Delivery } from "../types/delivery";
import { mockStorage } from "../services/mockStorage";

export interface DeliveryContextType{
    deliveries: Delivery[],
}

export const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export const DeliveryProvider = ({ children }: { children: React.ReactNode }) => {
    const [deliveries] = useState<Delivery[]>(() => mockStorage.getDeliveries());

    return (
        <DeliveryContext.Provider value={{ deliveries }}>
            {children}
        </DeliveryContext.Provider>
    );
}

export const useDeliveryContext = () => {
    const context = useContext(DeliveryContext);
    if (!context) {
        throw new Error("useDeliveryContext must be used within a DeliveryProvider");
    }
    return context;
};
