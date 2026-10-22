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
