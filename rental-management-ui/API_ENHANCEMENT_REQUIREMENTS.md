# API Enhancement Requirements - Dashboard Monthly Summary

**Document Version:** 1.0
**Date:** 2025-01-04
**For:** Backend Development Team
**From:** Frontend Team

---

## =Ë Executive Summary

This document specifies the API requirement for an enhanced dashboard that provides simple, actionable financial and occupancy metrics for property managers. The focus is on keeping the application simple and utility-focused for everyday users.

**Impact:** Dashboard page enhancement
**Estimated Backend Effort:** 2-3 hours
**Priority:** High - Core utility feature for property managers

---

## <¯ Dashboard Enhancement Goals

### **Design Philosophy:**
- Keep it **simple** - this is a utility tool for regular people
- Show **what matters** - money collected, rooms occupied, action items
- Be **actionable** - highlight what needs attention

### **What Users Need to See:**
1. **Money Overview** - How much rent expected vs. collected this month
2. **Room Status** - How many rooms are occupied vs. available
3. **Action Items** - What needs immediate attention (overdue payments, expiring leases)

---

## =4 Dashboard Monthly Summary API

### **New Endpoint Required:**
```http
GET /api/v1/dashboard/monthly-summary
```

### **Query Parameters (Optional):**
- `month` (string, optional): Format "YYYY-MM" (e.g., "2025-01"). Defaults to current month.
- `ownerId` (int, optional): Filter by owner (for role-based access). Admin sees all.

### **Response Structure:**
```json
{
  "status": true,
  "responseCode": 200,
  "message": "Dashboard summary retrieved successfully",
  "errors": null,
  "data": {
    "currentMonth": "2025-01",
    "monthName": "January 2025",

    // Financial Summary
    "totalExpectedRent": 45000.00,
    "totalCollectedRent": 30000.00,
    "totalPendingRent": 15000.00,
    "collectionPercentage": 66.67,
    "currencyId": 1,
    "currencySymbol": "¹",

    // Room Occupancy Summary
    "totalRooms": 20,
    "occupiedRooms": 15,
    "availableRooms": 5,
    "occupancyPercentage": 75.0,

    // Alerts/Action Items
    "overduePaymentsCount": 3,
    "expiringLeasesCount": 2
  }
}
```

---

## =Ð Business Logic & Calculations

### **Financial Calculations:**

```sql
-- 1. Total Expected Rent for the month
SELECT SUM(expectedRentValue)
FROM RentTrack
WHERE MONTH(rentPeriodStartDate) = @Month
  AND YEAR(rentPeriodStartDate) = @Year
  AND (@OwnerId IS NULL OR ownerId = @OwnerId);

-- 2. Total Collected Rent for the month
SELECT SUM(receivedRentValue)
FROM RentTrack
WHERE MONTH(rentPeriodStartDate) = @Month
  AND YEAR(rentPeriodStartDate) = @Year
  AND statusId = @PaidStatusId  -- Status: "Paid"
  AND (@OwnerId IS NULL OR ownerId = @OwnerId);

-- 3. Total Pending Rent
SELECT SUM(pendingAmount)
FROM RentTrack
WHERE MONTH(rentPeriodStartDate) = @Month
  AND YEAR(rentPeriodStartDate) = @Year
  AND statusId IN (@PendingStatusId, @PartialPaidStatusId)
  AND (@OwnerId IS NULL OR ownerId = @OwnerId);

-- 4. Collection Percentage
collectionPercentage = (totalCollectedRent / totalExpectedRent) * 100
-- If totalExpectedRent = 0, return 0 (avoid division by zero)
```

### **Room Occupancy Calculations:**

```sql
-- 1. Total Rooms
SELECT COUNT(*)
FROM Rooms
WHERE (@OwnerId IS NULL OR ownerId = @OwnerId);

-- 2. Occupied Rooms (rooms with active tenants)
SELECT COUNT(DISTINCT roomId)
FROM RoomTenantMapping
WHERE isActive = 1
  AND (leavingDate IS NULL OR leavingDate > GETDATE())
  AND (@OwnerId IS NULL OR EXISTS (
    SELECT 1 FROM Rooms r
    WHERE r.roomId = RoomTenantMapping.roomId
      AND r.ownerId = @OwnerId
  ));

-- 3. Available Rooms
availableRooms = totalRooms - occupiedRooms

-- 4. Occupancy Percentage
occupancyPercentage = (occupiedRooms / totalRooms) * 100
-- If totalRooms = 0, return 0
```

### **Alert Counts:**

```sql
-- 1. Overdue Payments Count
SELECT COUNT(*)
FROM RentTrack
WHERE statusId = @OverdueStatusId
  AND (@OwnerId IS NULL OR ownerId = @OwnerId);

-- 2. Expiring Leases Count (next 30 days)
SELECT COUNT(*)
FROM RoomTenantMapping
WHERE isActive = 1
  AND leavingDate BETWEEN GETDATE() AND DATEADD(DAY, 30, GETDATE())
  AND (@OwnerId IS NULL OR EXISTS (
    SELECT 1 FROM Rooms r
    WHERE r.roomId = RoomTenantMapping.roomId
      AND r.ownerId = @OwnerId
  ));
```

---

## =» C# Implementation Example

### **DTO:**
```csharp
public class DashboardMonthlySummaryDto
{
    // Period Information
    public string CurrentMonth { get; set; }  // "2025-01"
    public string MonthName { get; set; }     // "January 2025"

    // Financial Summary
    public decimal TotalExpectedRent { get; set; }
    public decimal TotalCollectedRent { get; set; }
    public decimal TotalPendingRent { get; set; }
    public decimal CollectionPercentage { get; set; }
    public int? CurrencyId { get; set; }
    public string? CurrencySymbol { get; set; }

    // Room Occupancy Summary
    public int TotalRooms { get; set; }
    public int OccupiedRooms { get; set; }
    public int AvailableRooms { get; set; }
    public decimal OccupancyPercentage { get; set; }

    // Alerts
    public int OverduePaymentsCount { get; set; }
    public int ExpiringLeasesCount { get; set; }
}
```

### **Controller Example:**
```csharp
[HttpGet("monthly-summary")]
[Authorize(Roles = "Admin,Owner")]
public async Task<ActionResult<ApiResponse<DashboardMonthlySummaryDto>>> GetMonthlySummary(
    [FromQuery] string? month = null,
    [FromQuery] int? ownerId = null)
{
    // If month not provided, use current month
    var targetMonth = string.IsNullOrEmpty(month)
        ? DateTime.Now.ToString("yyyy-MM")
        : month;

    // For non-admin users, enforce their own ownerId
    if (!User.IsInRole("Admin"))
    {
        var userOwnerId = GetCurrentUserOwnerId();
        ownerId = userOwnerId;
    }

    var summary = await _dashboardService.GetMonthlySummaryAsync(targetMonth, ownerId);
    return Ok(new ApiResponse<DashboardMonthlySummaryDto>
    {
        Status = true,
        ResponseCode = 200,
        Message = "Dashboard summary retrieved successfully",
        Data = summary
    });
}
```

---

## = Role-Based Access Control

| Role | Access | Behavior |
|------|--------|----------|
| **Admin** | Full access | Can see all properties (ownerId = null) or filter by specific owner |
| **Owner** | Own data only | Can only see their properties (ownerId = current user's ownerId) |
| **Tenant** | No access | Return 403 Forbidden |

---

##   Edge Cases & Error Handling

### **Scenario 1: No Rent Records for Month**
```json
{
  "totalExpectedRent": 0.00,
  "totalCollectedRent": 0.00,
  "totalPendingRent": 0.00,
  "collectionPercentage": 0.00
}
```

### **Scenario 2: No Rooms in System**
```json
{
  "totalRooms": 0,
  "occupiedRooms": 0,
  "availableRooms": 0,
  "occupancyPercentage": 0.00
}
```

### **Scenario 3: Division by Zero**
- If `totalExpectedRent = 0`, set `collectionPercentage = 0`
- If `totalRooms = 0`, set `occupancyPercentage = 0`

### **Scenario 4: Future Months**
- Allow querying future months
- Will show expected rent if pre-scheduled, but 0 collections

### **Scenario 5: Invalid Month Format**
- Return 400 Bad Request
- Message: "Invalid month format. Use YYYY-MM (e.g., 2025-01)"

---

## =€ Performance Considerations

### **Database Indexes Required:**
```sql
-- For faster RentTrack aggregations
CREATE INDEX IX_RentTrack_StatusId ON RentTrack(statusId);
CREATE INDEX IX_RentTrack_OwnerId ON RentTrack(ownerId);
CREATE INDEX IX_RentTrack_RentPeriodStartDate ON RentTrack(rentPeriodStartDate);

-- For faster Room queries
CREATE INDEX IX_Rooms_OwnerId ON Rooms(ownerId);

-- For faster RoomTenantMapping queries
CREATE INDEX IX_RoomTenantMapping_IsActive ON RoomTenantMapping(isActive);
CREATE INDEX IX_RoomTenantMapping_LeavingDate ON RoomTenantMapping(leavingDate);
```

### **Performance Metrics:**
- **Expected Query Time:** 50-100ms (with proper indexes)
- **Response Size:** ~500 bytes (very lightweight)
- **Recommended Caching:** 5-10 minutes (data doesn't change frequently)

### **Optimization Tips:**
1. Use a single stored procedure to fetch all metrics in one database round-trip
2. Cache response per user role and month
3. Consider pre-calculating metrics nightly for historical months

---

## <¨ Frontend Impact

### **Files to Update:**

1. **`src/types/index.ts`** - Add new type:
```typescript
export interface DashboardMonthlySummary {
  currentMonth: string;
  monthName: string;
  totalExpectedRent: number;
  totalCollectedRent: number;
  totalPendingRent: number;
  collectionPercentage: number;
  currencyId?: number;
  currencySymbol?: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyPercentage: number;
  overduePaymentsCount: number;
  expiringLeasesCount: number;
}
```

2. **`src/services/api.ts`** - Add new method:
```typescript
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  },
  getMonthlySummary: async (month?: string): Promise<DashboardMonthlySummary> => {
    const params = month ? { month } : {};
    const response = await api.get<ApiResponse<DashboardMonthlySummary>>(
      '/dashboard/monthly-summary',
      { params }
    );
    return response.data.data;
  }
};
```

3. **`src/pages/Dashboard.tsx`** - Add new sections:
   - Money Overview Card
   - Room Occupancy Card
   - Action Items Alert Panel

---

##  Testing Requirements

### **Backend Testing Checklist:**
- [ ] Endpoint returns correct data for current month (no params)
- [ ] Endpoint returns correct data for specific month (with month param)
- [ ] Admin can see all properties data
- [ ] Owner sees only their properties data
- [ ] Tenant receives 403 Forbidden
- [ ] Correct handling of zero values (no rents, no rooms)
- [ ] Division by zero protection works
- [ ] Invalid month format returns 400
- [ ] Future months return valid response
- [ ] Performance is under 100ms with proper indexes

### **Sample Test Cases:**

**Test 1: Current Month Summary (Admin)**
```http
GET /api/v1/dashboard/monthly-summary
Authorization: Bearer {admin_token}

Expected: 200 OK with all metrics for current month
```

**Test 2: Specific Month Summary (Owner)**
```http
GET /api/v1/dashboard/monthly-summary?month=2024-12
Authorization: Bearer {owner_token}

Expected: 200 OK with owner's properties only
```

**Test 3: Tenant Access Denied**
```http
GET /api/v1/dashboard/monthly-summary
Authorization: Bearer {tenant_token}

Expected: 403 Forbidden
```

**Test 4: No Data Scenario**
```http
GET /api/v1/dashboard/monthly-summary?month=2030-01
Authorization: Bearer {admin_token}

Expected: 200 OK with all zeros
```

---

## =Ý Implementation Checklist

### **Backend Tasks:**
- [ ] Create `DashboardMonthlySummaryDto` class
- [ ] Create database queries for financial metrics
- [ ] Create database queries for occupancy metrics
- [ ] Create database queries for alert counts
- [ ] Implement controller endpoint with role-based access
- [ ] Add proper error handling for edge cases
- [ ] Create database indexes
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test with real data
- [ ] Add API documentation (Swagger)

### **Frontend Tasks:**
- [ ] Add `DashboardMonthlySummary` type to `types/index.ts`
- [ ] Add `getMonthlySummary()` method to `api.ts`
- [ ] Create Money Overview card component
- [ ] Create Room Occupancy card component
- [ ] Create Action Items alert panel
- [ ] Add React Query hook for fetching summary
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Add unit tests
- [ ] Test with mock data

---

## =Þ Questions & Support

### **Common Questions:**

**Q: What status IDs represent "Paid", "Pending", "Overdue"?**
A: Please check your `RentStatus` lookup table. Typical values:
- 1 = Pending
- 2 = Paid
- 3 = Overdue
- 4 = Partial Paid

**Q: Should we calculate metrics in real-time or pre-calculate?**
A: Real-time calculation is fine for current month. For historical months, consider pre-calculating nightly.

**Q: What currency should be used if properties have different currencies?**
A: Use the most common currency in the system, or the admin's default currency. Document this limitation.

**Q: How do we handle partial payments?**
A: Include partial payments in `totalCollectedRent` (use `receivedRentValue` field), and track remaining in `totalPendingRent`.

**Q: Should we cache this endpoint?**
A: Yes, recommended 5-10 minute cache. Financial data doesn't change every second.

---

## =Ú References

### **Related Database Tables:**
- `RentTrack` - Rent payment records
- `Rooms` - Room inventory
- `RoomTenantMapping` - Tenant-Room assignments
- `Properties` - Property information
- `Lookups` - Currency and status lookups

### **Related Endpoints:**
- `GET /api/v1/dashboard/stats` - Basic count statistics (existing)

---

## =Ý Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-01-04 | Initial document - Dashboard Monthly Summary API | Frontend Team |

---

##  Sign-off

**Frontend Team:** _________________ Date: _________

**Backend Team:** _________________ Date: _________

**Product Owner:** _________________ Date: _________

---

**END OF DOCUMENT**
