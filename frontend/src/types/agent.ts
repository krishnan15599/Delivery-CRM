export type AgentStatus = 'Active' | 'On Delivery' | 'Off Duty' | 'Inactive';

export type VehicleType = 'Bike' | 'Scooter' | 'Van' | 'Truck';

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  status: AgentStatus;
  hubLocation: string;
  assignedDeliveriesCount: number;
  completedDeliveriesCount: number;
  failedDeliveriesCount: number;
  pendingCashAmount: number;
  settledCashAmount: number;
  rating: number;
  joiningDate: string;
  avatarUrl?: string;
}

/**
 * Raw agent schema returned from backend DB
 */
export interface BackendAgent {
  id: string;
  user_id?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  vehicle_type?: VehicleType;
  vehicle_number?: string;
  status?: AgentStatus;
  hub_location?: string;
  assigned_deliveries_count?: number;
  completed_deliveries_count?: number;
  failed_deliveries_count?: number;
  pending_cash_amount?: number;
  settled_cash_amount?: number;
  rating?: number;
  joining_date?: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAgentInput {
  name: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  hubLocation: string;
  status?: AgentStatus;
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  rating?: number;
}

export interface AgentFilter {
  search?: string;
  status?: AgentStatus | 'all';
  hubLocation?: string;
  vehicleType?: VehicleType | 'all';
  page?: number;
  pageSize?: number;
}
