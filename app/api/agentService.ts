// agentService.ts - Agent Property Management API Service
import api, { APIResponse, BackendResponse } from "./apiService";

// ============ AGENT TYPES ============

export interface AgentDashboard {
  totalClients: number;
  activeClients: number;
  totalProperties: number;
  activeProperties: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  totalCommission: number;
  averageCommissionRate: number;
  monthlyStats?: any;
  recentActivity?: any[];
}

export interface AgentProperty {
  id: number;
  name: string;
  location: string;
  type: string;
  category: string;
  pricePerNight: number;
  pricePerTwoNights?: number;
  beds: number;
  baths: number;
  maxGuests: number;
  status: string;
  averageRating: number;
  totalBookings: number;
  hostId: number;
  hostName: string;
  hostEmail: string;
  totalRevenue: number;
  commissionRate: number;
  agentCommission: number;
}

export interface AgentPropertiesResponse {
  properties: AgentProperty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AllAgentPropertiesResponse {
  ownProperties: AgentProperty[];
  managedProperties: AgentProperty[];
  totalOwned: number;
  totalManaged: number;
  totalProperties: number;
}

export interface AgentPropertyFilters {
  page?: number;
  limit?: number;
  clientId?: number;
  status?: "active" | "inactive" | "pending";
  search?: string;
  sortBy?: "name" | "location" | "price" | "rating" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface AgentBooking {
  id: string;
  propertyId: number;
  propertyName: string;
  guestId: number;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  agentCommission: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface AgentEarnings {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  currentMonthEarnings: number;
  earningsByProperty: any[];
  transactions: any[];
}

export interface PropertyPerformance {
  timeRange: string;
  properties: Array<{
    propertyId: number;
    propertyName: string;
    bookings: number;
    revenue: number;
    occupancyRate: number;
    agentCommission: number;
    averageRating: number;
  }>;
  summary: {
    totalBookings: number;
    totalRevenue: number;
    totalCommission: number;
    averageOccupancy: number;
  };
}

export interface TransactionMonitoring {
  transactionBreakdown?: {
    escrowTransactions: any[];
    paymentTransactions: any[];
  };
  summary?: any;
}

// ============ AGENT API SERVICE CLASS ============

class AgentAPIService {
  // ============ DASHBOARD & OVERVIEW ============

  /**
   * Get Agent Dashboard
   * GET /properties/agent/dashboard
   */
  async getDashboard(): Promise<APIResponse<BackendResponse<AgentDashboard>>> {
    return api.get<BackendResponse<AgentDashboard>>(
      "/properties/agent/dashboard"
    );
  }

  /**
   * Get Enhanced Agent Dashboard
   * GET /properties/agent/dashboard
   */
  async getEnhancedDashboard(): Promise<
    APIResponse<BackendResponse<AgentDashboard>>
  > {
    return api.get<BackendResponse<AgentDashboard>>(
      "/properties/agent/dashboard"
    );
  }

  // ============ PROPERTY MANAGEMENT ============

  /**
   * List Agent's Managed Properties
   * GET /properties/agent/properties
   */
  async getProperties(
    filters?: AgentPropertyFilters
  ): Promise<APIResponse<BackendResponse<AgentPropertiesResponse>>> {
    const params: Record<string, any> = {};

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });
    }

    return api.get<BackendResponse<AgentPropertiesResponse>>(
      "/properties/agent/properties",
      { params }
    );
  }

  /**
   * Get All Agent Properties (Unified - owned and managed)
   * GET /properties/agent/all-properties
   */
  async getAllProperties(
    filters?: AgentPropertyFilters
  ): Promise<APIResponse<BackendResponse<AllAgentPropertiesResponse>>> {
    const params: Record<string, any> = {};

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });
    }

    return api.get<BackendResponse<AllAgentPropertiesResponse>>(
      "/properties/agent/all-properties",
      { params }
    );
  }

  /**
   * Get Specific Property Details
   * GET /properties/agent/properties/:id
   */
  async getProperty(
    propertyId: number
  ): Promise<APIResponse<BackendResponse<AgentProperty>>> {
    return api.get<BackendResponse<AgentProperty>>(
      `/properties/agent/properties/${propertyId}`
    );
  }

  /**
   * Get Property Performance
   * GET /properties/agent/properties/performance
   */
  async getPropertyPerformance(
    timeRange?: "week" | "month" | "quarter" | "year"
  ): Promise<APIResponse<BackendResponse<PropertyPerformance>>> {
    const params: Record<string, any> = {};
    if (timeRange) params.timeRange = timeRange;

    return api.get<BackendResponse<PropertyPerformance>>(
      "/properties/agent/properties/performance",
      { params }
    );
  }

  /**
   * Update Property (Limited Fields)
   * PATCH /properties/agent/properties/:id/edit
   */
  async updateProperty(
    propertyId: number,
    updateData: {
      description?: string;
      features?: string[];
      pricePerNight?: number;
      pricePerTwoNights?: number;
      availabilityDates?: {
        start: string;
        end: string;
      };
      minStay?: number;
      maxStay?: number;
    }
  ): Promise<APIResponse<BackendResponse<AgentProperty>>> {
    return api.patch<BackendResponse<AgentProperty>>(
      `/properties/agent/properties/${propertyId}/edit`,
      updateData
    );
  }

  // ============ CLIENT MANAGEMENT ============

  /**
   * Get Client's Properties
   * GET /properties/agent/clients/:clientId/properties
   */
  async getClientProperties(
    clientId: number
  ): Promise<APIResponse<BackendResponse<AgentProperty[]>>> {
    return api.get<BackendResponse<AgentProperty[]>>(
      `/properties/agent/clients/${clientId}/properties`
    );
  }

  /**
   * Create Property for Client
   * POST /properties/agent/clients/:clientId/properties
   */
  async createPropertyForClient(
    clientId: number,
    propertyData: {
      name: string;
      location: {
        type: "address" | "upi";
        address?: string;
        upi?: string;
      };
      type: string;
      category: string;
      description: string;
      pricePerNight: number;
      pricePerTwoNights?: number;
      beds: number;
      baths: number;
      maxGuests: number;
      features: string[];
      images: {
        exterior?: string[];
        interior?: string[];
        amenities?: string[];
      };
      video3D?: string;
      availabilityDates?: {
        start: string;
        end: string;
      };
      minStay?: number;
      maxStay?: number;
    }
  ): Promise<APIResponse<BackendResponse<AgentProperty>>> {
    return api.post<BackendResponse<AgentProperty>>(
      `/properties/agent/clients/${clientId}/properties`,
      propertyData
    );
  }

  // ============ BOOKING MANAGEMENT ============

  /**
   * Get Agent Bookings
   * GET /properties/agent/bookings
   */
  async getBookings(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    propertyId?: number;
  }): Promise<
    APIResponse<
      BackendResponse<{
        bookings: AgentBooking[];
        total: number;
        page: number;
        limit: number;
      }>
    >
  > {
    const params: Record<string, any> = {};

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });
    }

    return api.get<BackendResponse<any>>("/properties/agent/bookings", {
      params,
    });
  }

  /**
   * Get Property Bookings
   * GET /properties/agent/properties/:id/bookings
   */
  async getPropertyBookings(
    propertyId: number
  ): Promise<APIResponse<BackendResponse<AgentBooking[]>>> {
    return api.get<BackendResponse<AgentBooking[]>>(
      `/properties/agent/properties/${propertyId}/bookings`
    );
  }

  /**
   * Get Property Bookings (Alternative route for owned properties)
   * GET /properties/agent/own/properties/:id/bookings
   */
  async getOwnPropertyBookings(
    propertyId: number
  ): Promise<APIResponse<BackendResponse<AgentBooking[]>>> {
    return api.get<BackendResponse<AgentBooking[]>>(
      `/properties/agent/own/properties/${propertyId}/bookings`
    );
  }

  /**
   * Create Booking for Client
   * POST /properties/agent/properties/:id/bookings
   */
  async createBooking(
    propertyId: number,
    bookingData: {
      clientId: number;
      checkIn: string;
      checkOut: string;
      guests: number;
      totalPrice: number;
      message?: string;
      specialRequests?: string;
    }
  ): Promise<APIResponse<BackendResponse<AgentBooking>>> {
    return api.post<BackendResponse<AgentBooking>>(
      `/properties/agent/properties/${propertyId}/bookings`,
      bookingData
    );
  }

  /**
   * Update Agent Booking
   * PUT /properties/agent/bookings/:bookingId
   */
  async updateBooking(
    bookingId: string,
    updateData: {
      status?: string;
      notes?: string;
      checkInInstructions?: string;
    }
  ): Promise<APIResponse<BackendResponse<AgentBooking>>> {
    return api.put<BackendResponse<AgentBooking>>(
      `/properties/agent/bookings/${bookingId.toLowerCase()}`,
      updateData
    );
  }

  /**
   * Update Property Booking
   * PUT /properties/agent/properties/:propertyId/bookings/:bookingId
   */
  async updatePropertyBooking(
    propertyId: number,
    bookingId: string,
    updateData: {
      message?: string;
      status?: string;
    }
  ): Promise<APIResponse<BackendResponse<AgentBooking>>> {
    return api.put<BackendResponse<AgentBooking>>(
      `/properties/agent/properties/${propertyId}/bookings/${bookingId.toLowerCase()}`,
      updateData
    );
  }

  /**
   * Get Booking Calendar
   * GET /properties/agent/bookings/calendar
   */
  async getBookingCalendar(
    month?: number,
    year?: number
  ): Promise<
    APIResponse<
      BackendResponse<{
        bookings: any[];
      }>
    >
  > {
    const params: Record<string, any> = {};
    if (month) params.month = month;
    if (year) params.year = year;

    return api.get<BackendResponse<any>>(
      "/properties/agent/bookings/calendar",
      { params }
    );
  }

  /**
   * Get Booking Transaction Data
   * GET /properties/agent/bookings/:bookingId/transactions
   */
  async getBookingTransactions(
    bookingId: string
  ): Promise<APIResponse<BackendResponse<any>>> {
    return api.get<BackendResponse<any>>(
      `/properties/agent/bookings/${bookingId.toLowerCase()}/transactions`
    );
  }

  // ============ MEDIA MANAGEMENT ============

  /**
   * Upload Property Images
   * POST /properties/agent/properties/:id/images
   */
  async uploadPropertyImages(
    propertyId: number,
    data: {
      category: "exterior" | "interior" | "amenities";
      imageUrls: string[];
    }
  ): Promise<APIResponse<BackendResponse<AgentProperty>>> {
    return api.post<BackendResponse<AgentProperty>>(
      `/properties/agent/properties/${propertyId}/images`,
      data
    );
  }

  // ============ GUEST MANAGEMENT ============

  /**
   * Get Agent Guests
   * GET /properties/agent/guests
   */
  async getGuests(): Promise<
    APIResponse<
      BackendResponse<
        Array<{
          id: number;
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
          totalBookings: number;
          totalSpent: number;
          averageRating: number;
          lastBooking: string;
        }>
      >
    >
  > {
    return api.get<BackendResponse<any>>("/properties/agent/guests");
  }

  /**
   * Get Client Guests
   * GET /properties/agent/clients/:clientId/guests
   */
  async getClientGuests(
    clientId: number
  ): Promise<APIResponse<BackendResponse<any[]>>> {
    return api.get<BackendResponse<any[]>>(
      `/properties/agent/clients/${clientId}/guests`
    );
  }

  // ============ ANALYTICS & PERFORMANCE ============

  /**
   * Get Property Analytics
   * GET /properties/agent/properties/:id/analytics
   */
  async getPropertyAnalytics(
    propertyId: number,
    timeRange?: string
  ): Promise<
    APIResponse<
      BackendResponse<{
        totalRevenue: number;
        totalBookings: number;
        occupancyRate: number;
        averageRating: number;
        monthlyRevenue: number;
        agentCommission: {
          rate: number;
          totalEarned: number;
          monthlyProjection: number;
        };
      }>
    >
  > {
    const params: Record<string, any> = {};
    if (timeRange) params.timeRange = timeRange;

    return api.get<BackendResponse<any>>(
      `/properties/agent/properties/${propertyId}/analytics`,
      { params }
    );
  }

  /**
   * Get Properties Analytics Summary
   * GET /properties/agent/properties/analytics/summary
   */
  async getPropertiesAnalyticsSummary(timeRange?: string): Promise<
    APIResponse<
      BackendResponse<{
        timeRange: string;
        properties: any[];
        totals: {
          totalRevenue: number;
          totalCommission: number;
          totalBookings: number;
          averageOccupancy: number;
        };
      }>
    >
  > {
    const params: Record<string, any> = {};
    if (timeRange) params.timeRange = timeRange;

    return api.get<BackendResponse<any>>(
      "/properties/agent/properties/analytics/summary",
      { params }
    );
  }

  // ============ REVIEW MANAGEMENT ============

  /**
   * Get Property Reviews
   * GET /properties/agent/properties/:id/reviews
   */
  async getPropertyReviews(
    propertyId: number,
    page?: number,
    limit?: number
  ): Promise<
    APIResponse<
      BackendResponse<{
        reviews: Array<{
          id: string;
          userId: number;
          userName: string;
          rating: number;
          comment: string;
          images: string[];
          createdAt: string;
        }>;
        total: number;
        page: number;
        limit: number;
      }>
    >
  > {
    const params: Record<string, any> = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;

    return api.get<BackendResponse<any>>(
      `/properties/agent/properties/${propertyId}/reviews`,
      { params }
    );
  }

  /**
   * Get Reviews Summary
   * GET /properties/agent/reviews/summary
   */
  async getReviewsSummary(): Promise<
    APIResponse<
      BackendResponse<{
        totalReviews: number;
        averageRating: number;
        ratingDistribution: Record<number, number>;
        recentReviews: any[];
      }>
    >
  > {
    return api.get<BackendResponse<any>>("/properties/agent/reviews/summary");
  }

  // ============ EARNINGS & COMMISSIONS ============

  /**
   * Get Agent Earnings
   * GET /properties/agent/earnings
   */
  async getEarnings(
    timeRange?: string
  ): Promise<APIResponse<BackendResponse<AgentEarnings>>> {
    const params: Record<string, any> = {};
    if (timeRange) params.timeRange = timeRange;

    return api.get<BackendResponse<AgentEarnings>>(
      "/properties/agent/earnings",
      { params }
    );
  }

  /**
   * Get Earnings Breakdown
   * GET /properties/agent/earnings/breakdown
   */
  async getEarningsBreakdown(): Promise<APIResponse<BackendResponse<any>>> {
    return api.get<BackendResponse<any>>(
      "/properties/agent/earnings/breakdown"
    );
  }

  /**
   * Get Commission States
   * GET /properties/agent/commissions/states
   */
  async getCommissionStates(): Promise<
    APIResponse<
      BackendResponse<{
        pending: number;
        earned: number;
        paid: number;
        cancelled: number;
      }>
    >
  > {
    return api.get<BackendResponse<any>>(
      "/properties/agent/commissions/states"
    );
  }

  /**
   * Get Monthly Commissions
   * GET /properties/agent/commissions/monthly
   */
  async getMonthlyCommissions(): Promise<APIResponse<BackendResponse<any>>> {
    return api.get<BackendResponse<any>>(
      "/properties/agent/commissions/monthly"
    );
  }

  /**
   * Get Withdrawal Requests
   * GET /properties/agent/withdrawals
   */
  async getWithdrawalRequests(): Promise<
    APIResponse<
      BackendResponse<
        Array<{
          id: string;
          amount: number;
          currency: string;
          status: string;
          method: string;
          createdAt: string;
        }>
      >
    >
  > {
    return api.get<BackendResponse<any>>("/properties/agent/withdrawals");
  }

  // ============ ADVANCED ANALYTICS & KPIs ============

  /**
   * Get Enhanced Agent KPIs
   * GET /properties/agent/kpis/additional
   */
  async getAdditionalKPIs(): Promise<APIResponse<BackendResponse<any>>> {
    return api.get<BackendResponse<any>>("/properties/agent/kpis/additional");
  }

  /**
   * Get Performance Trends
   * GET /properties/agent/performance/trends
   */
  async getPerformanceTrends(): Promise<APIResponse<BackendResponse<any>>> {
    return api.get<BackendResponse<any>>(
      "/properties/agent/performance/trends"
    );
  }

  /**
   * Get Competitive Metrics
   * GET /properties/agent/competitive/metrics
   */
  async getCompetitiveMetrics(): Promise<APIResponse<BackendResponse<any>>> {
    return api.get<BackendResponse<any>>(
      "/properties/agent/competitive/metrics"
    );
  }

  /**
   * Get Client Segmentation
   * GET /properties/agent/clients/segmentation
   */
  async getClientSegmentation(): Promise<
    APIResponse<
      BackendResponse<{
        newClients: number;
        repeatClients: number;
        vipClients: number;
        inactiveClients: number;
      }>
    >
  > {
    return api.get<BackendResponse<any>>(
      "/properties/agent/clients/segmentation"
    );
  }

  /**
   * Get Individual KPI
   * GET /properties/agent/kpis/individual/:kpi
   */
  async getIndividualKPI(
    kpi: string
  ): Promise<APIResponse<BackendResponse<any>>> {
    return api.get<BackendResponse<any>>(
      `/properties/agent/kpis/individual/${kpi}`
    );
  }

  // ============ TRANSACTION MONITORING ============

  /**
   * Get Transaction Monitoring Dashboard
   * GET /properties/agent/transactions/monitoring
   */
  async getTransactionMonitoring(): Promise<
    APIResponse<BackendResponse<TransactionMonitoring>>
  > {
    return api.get<BackendResponse<TransactionMonitoring>>(
      "/properties/agent/transactions/monitoring"
    );
  }

  /**
   * Get Escrow Transactions
   * GET /properties/agent/transactions/escrow
   */
  async getEscrowTransactions(): Promise<APIResponse<BackendResponse<any[]>>> {
    return api.get<BackendResponse<any[]>>(
      "/properties/agent/transactions/escrow"
    );
  }

  /**
   * Get Payment Transactions
   * GET /properties/agent/transactions/payment
   */
  async getPaymentTransactions(): Promise<APIResponse<BackendResponse<any[]>>> {
    return api.get<BackendResponse<any[]>>(
      "/properties/agent/transactions/payment"
    );
  }

  /**
   * Get Transaction Summary
   * GET /properties/agent/transactions/summary
   */
  async getTransactionSummary(): Promise<APIResponse<BackendResponse<any>>> {
    return api.get<BackendResponse<any>>(
      "/properties/agent/transactions/summary"
    );
  }

  /**
   * Get Transaction Analytics
   * GET /properties/agent/transactions/analytics
   */
  async getTransactionAnalytics(): Promise<APIResponse<BackendResponse<any>>> {
    return api.get<BackendResponse<any>>(
      "/properties/agent/transactions/analytics"
    );
  }

  /**
   * Get Transaction Status
   * GET /properties/agent/transactions/status/:transactionId
   */
  async getTransactionStatus(
    transactionId: string
  ): Promise<APIResponse<BackendResponse<any>>> {
    return api.get<BackendResponse<any>>(
      `/properties/agent/transactions/status/${transactionId}`
    );
  }

  /**
   * Get Real-time Transaction Status
   * GET /properties/agent/transactions/realtime/status
   */
  async getRealtimeTransactionStatus(): Promise<
    APIResponse<BackendResponse<any>>
  > {
    return api.get<BackendResponse<any>>(
      "/properties/agent/transactions/realtime/status"
    );
  }

  /**
   * Export Transactions
   * GET /properties/agent/transactions/export
   */
  async exportTransactions(
    format: "csv" | "excel" | "pdf",
    startDate?: string,
    endDate?: string
  ): Promise<APIResponse<Blob>> {
    const params: Record<string, any> = { format };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return api.get<Blob>("/properties/agent/transactions/export", { params });
  }
}

// Export singleton instance
const agentAPI = new AgentAPIService();
export default agentAPI;
