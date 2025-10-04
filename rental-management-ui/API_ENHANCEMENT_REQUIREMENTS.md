# API Enhancement Requirements - Display Names Instead of IDs

**Document Version:** 1.0
**Date:** 2025-01-04
**For:** Backend Development Team
**From:** Frontend Team

---

## 📋 Executive Summary

Currently, the application displays entity IDs (tenantId, roomId, propertyId, mappingId) in user-facing pages instead of user-friendly names. This document specifies the exact API enhancements needed to resolve this issue.

**Impact:** Affects 4 major pages across the application
**Estimated Backend Effort:** 4-6 hours
**Priority:** High - Impacts user experience significantly

---

## 🎯 Overview of Required Changes

### APIs Requiring Enhancement:
1. ✅ **RoomTenantMapping API** - Add 6 joined fields
2. ✅ **TenantRentSetting API** - Add 8 joined fields

### Current vs. Desired Display:

| Location | Current Display | Desired Display |
|----------|----------------|-----------------|
| Board Tenant List | "Tenant ID: 5" | "John Doe" |
| Board Tenant List | "Room ID: 3" | "Room #101 - Sunset Apartments" |
| Rent Settings List | "Mapping ID: 10" | "John Doe - Room #101" |
| Rent Settings Detail | Property ID in cards | Property Name |
| Board Tenant Detail | Fallback shows IDs | Always show names |

---

## 🔴 PRIORITY 1: RoomTenantMapping API Enhancement

### **Affected Endpoints:**
- `POST /api/roomtenantmapping/search`
- `GET /api/roomtenantmapping/{id}`
- `GET /api/roomtenantmapping/room/{roomId}`
- `GET /api/roomtenantmapping/tenant/{tenantId}`
- `GET /api/roomtenantmapping/owner/{ownerId}`

### **Current Response Structure:**
```json
{
  "data": [
    {
      "roomTenantMappingId": 1,
      "roomId": 5,
      "tenantId": 3,
      "isActive": true,
      "boardingDate": "2025-01-01T00:00:00",
      "leavingDate": null,
      "createdBy": 1,
      "lastModifiedBy": 1,
      "creationDate": "2024-12-01T10:00:00",
      "lastModificationDate": "2024-12-15T14:30:00"
    }
  ],
  "totalRecords": 1,
  "pageNumber": 1,
  "pageSize": 10
}
```

### **Enhanced Response Structure (Required):**
```json
{
  "data": [
    {
      "roomTenantMappingId": 1,
      "roomId": 5,
      "tenantId": 3,

      // ✅ ADD THESE FIELDS (Joined from Tenants table)
      "tenantName": "John Doe",
      "tenantMobile": "+91-9876543210",
      "tenantEmail": "john@example.com",

      // ✅ ADD THESE FIELDS (Joined from Rooms table)
      "roomNo": "101",

      // ✅ ADD THESE FIELDS (Joined from Properties table)
      "propertyId": 2,
      "propertyName": "Sunset Apartments",

      // ✅ ADD THIS FIELD (Joined from Owners table) - OPTIONAL
      "ownerName": "Jane Smith",

      // Existing fields (keep as-is)
      "isActive": true,
      "boardingDate": "2025-01-01T00:00:00",
      "leavingDate": null,
      "createdBy": 1,
      "lastModifiedBy": 1,
      "creationDate": "2024-12-01T10:00:00",
      "lastModificationDate": "2024-12-15T14:30:00"
    }
  ],
  "totalRecords": 1,
  "pageNumber": 1,
  "pageSize": 10
}
```

### **SQL Query Example:**
```sql
SELECT
    rtm.roomTenantMappingId,
    rtm.roomId,
    rtm.tenantId,
    rtm.isActive,
    rtm.boardingDate,
    rtm.leavingDate,
    rtm.createdBy,
    rtm.lastModifiedBy,
    rtm.creationDate,
    rtm.lastModificationDate,

    -- Tenant Information
    t.tenantName,
    t.tenantMobile,
    t.tenantEmail,

    -- Room Information
    r.roomNo,

    -- Property Information
    r.propertyId,
    p.propertyName,

    -- Owner Information (Optional)
    o.fullName AS ownerName

FROM RoomTenantMapping rtm
INNER JOIN Tenants t ON rtm.tenantId = t.tenantId
INNER JOIN Rooms r ON rtm.roomId = r.roomId
INNER JOIN Properties p ON r.propertyId = p.propertyId
LEFT JOIN Users o ON p.ownerId = o.userId
WHERE rtm.isActive = 1  -- or whatever your filter condition is
ORDER BY rtm.creationDate DESC;
```

### **C# DTO Update Required:**
```csharp
public class RoomTenantMappingDto
{
    public int RoomTenantMappingId { get; set; }
    public int RoomId { get; set; }
    public int TenantId { get; set; }

    // ✅ ADD THESE PROPERTIES
    public string TenantName { get; set; }
    public string TenantMobile { get; set; }
    public string? TenantEmail { get; set; }
    public string RoomNo { get; set; }
    public int PropertyId { get; set; }
    public string PropertyName { get; set; }
    public string? OwnerName { get; set; }  // Optional

    // Existing properties
    public bool IsActive { get; set; }
    public DateTime BoardingDate { get; set; }
    public DateTime? LeavingDate { get; set; }
    public int CreatedBy { get; set; }
    public int LastModifiedBy { get; set; }
    public DateTime CreationDate { get; set; }
    public DateTime? LastModificationDate { get; set; }
}
```

### **Frontend Impact:**
- **Files Affected:**
  - `src/pages/board-tenants/BoardTenantList.tsx` (Lines 252-253)
  - `src/pages/board-tenants/BoardTenantDetail.tsx` (Lines 219, 245)

- **What Will Change:**
  - Card titles will show "John Doe" instead of "Tenant ID: 5"
  - Card subtitles will show "Room #101 - Sunset Apartments" instead of "Room ID: 3"
  - Fallback displays will show names instead of IDs

---

## 🔴 PRIORITY 2: TenantRentSetting API Enhancement

### **Affected Endpoints:**
- `POST /api/tenantRentSetting/search`
- `GET /api/tenantRentSetting/{id}`
- `GET /api/tenantRentSetting/mapping/{mappingId}`

### **Current Response Structure:**
```json
{
  "data": [
    {
      "tenantRentSettingId": 1,
      "roomTenantMappingId": 1,
      "rentRecurringPeriodInDays": 30,
      "rentingCycleStartPeriod": "2025-01-01T00:00:00",
      "lockInPeriod": "6 months",
      "deposited": 50000.00,
      "depositToReturn": 45000.00,
      "presentRentValue": 15000.00,
      "pastRentValue": 14000.00,
      "currencyId": 1,
      "mobileNo": null,
      "email": null,
      "createdBy": 1,
      "lastModifiedBy": 1,
      "creationDate": "2024-12-01T10:00:00",
      "lastModificationDate": "2024-12-15T14:30:00"
    }
  ],
  "totalRecords": 1,
  "pageNumber": 1,
  "pageSize": 10
}
```

### **Enhanced Response Structure (Required):**
```json
{
  "data": [
    {
      "tenantRentSettingId": 1,
      "roomTenantMappingId": 1,

      // ✅ ADD THESE FIELDS (From RoomTenantMapping + Joins)
      "tenantId": 3,
      "tenantName": "John Doe",
      "tenantMobile": "+91-9876543210",
      "roomId": 5,
      "roomNo": "101",
      "propertyId": 2,
      "propertyName": "Sunset Apartments",

      // ✅ ADD THESE FIELDS (From Currency lookup)
      "currencyName": "Indian Rupee",
      "currencySymbol": "₹",

      // Existing fields (keep as-is)
      "rentRecurringPeriodInDays": 30,
      "rentingCycleStartPeriod": "2025-01-01T00:00:00",
      "lockInPeriod": "6 months",
      "deposited": 50000.00,
      "depositToReturn": 45000.00,
      "presentRentValue": 15000.00,
      "pastRentValue": 14000.00,
      "currencyId": 1,
      "mobileNo": null,
      "email": null,
      "createdBy": 1,
      "lastModifiedBy": 1,
      "creationDate": "2024-12-01T10:00:00",
      "lastModificationDate": "2024-12-15T14:30:00"
    }
  ],
  "totalRecords": 1,
  "pageNumber": 1,
  "pageSize": 10
}
```

### **SQL Query Example:**
```sql
SELECT
    trs.tenantRentSettingId,
    trs.roomTenantMappingId,
    trs.rentRecurringPeriodInDays,
    trs.rentingCycleStartPeriod,
    trs.lockInPeriod,
    trs.deposited,
    trs.depositToReturn,
    trs.presentRentValue,
    trs.pastRentValue,
    trs.currencyId,
    trs.mobileNo,
    trs.email,
    trs.createdBy,
    trs.lastModifiedBy,
    trs.creationDate,
    trs.lastModificationDate,

    -- From RoomTenantMapping + Joins
    rtm.tenantId,
    rtm.roomId,
    t.tenantName,
    t.tenantMobile,
    r.roomNo,
    r.propertyId,
    p.propertyName,

    -- Currency Information
    c.currencyName,
    c.currencySymbol

FROM TenantRentSettings trs
INNER JOIN RoomTenantMapping rtm ON trs.roomTenantMappingId = rtm.roomTenantMappingId
INNER JOIN Tenants t ON rtm.tenantId = t.tenantId
INNER JOIN Rooms r ON rtm.roomId = r.roomId
INNER JOIN Properties p ON r.propertyId = p.propertyId
LEFT JOIN Currencies c ON trs.currencyId = c.currencyId
WHERE trs.tenantRentSettingId = @TenantRentSettingId;
```

### **C# DTO Update Required:**
```csharp
public class TenantRentSettingDto
{
    public int TenantRentSettingId { get; set; }
    public int RoomTenantMappingId { get; set; }

    // ✅ ADD THESE PROPERTIES (From joins)
    public int TenantId { get; set; }
    public string TenantName { get; set; }
    public string TenantMobile { get; set; }
    public int RoomId { get; set; }
    public string RoomNo { get; set; }
    public int PropertyId { get; set; }
    public string PropertyName { get; set; }
    public string? CurrencyName { get; set; }
    public string? CurrencySymbol { get; set; }

    // Existing properties
    public int? RentRecurringPeriodInDays { get; set; }
    public DateTime? RentingCycleStartPeriod { get; set; }
    public string? LockInPeriod { get; set; }
    public decimal Deposited { get; set; }
    public decimal DepositToReturn { get; set; }
    public decimal? PresentRentValue { get; set; }
    public decimal? PastRentValue { get; set; }
    public int? CurrencyId { get; set; }
    public string? MobileNo { get; set; }
    public string? Email { get; set; }
    public int CreatedBy { get; set; }
    public int LastModifiedBy { get; set; }
    public DateTime CreationDate { get; set; }
    public DateTime? LastModificationDate { get; set; }
}
```

### **Frontend Impact:**
- **Files Affected:**
  - `src/pages/rent-settings/TenantRentSettingsList.tsx` (Lines 236-237)
  - `src/pages/rent-settings/TenantRentSettingsDetail.tsx` (Property name display)

- **What Will Change:**
  - Card titles will show "John Doe - Room #101" instead of "Mapping ID: 1"
  - Card subtitles will show rent amount with currency symbol instead of "Rent Setting #1"
  - Property names will display instead of Property IDs

---

## 📊 Performance Considerations

### **Database Indexes Required:**
Ensure these indexes exist for optimal performance:

```sql
-- For RoomTenantMapping queries
CREATE INDEX IX_RoomTenantMapping_RoomId ON RoomTenantMapping(roomId);
CREATE INDEX IX_RoomTenantMapping_TenantId ON RoomTenantMapping(tenantId);

-- For TenantRentSettings queries
CREATE INDEX IX_TenantRentSettings_RoomTenantMappingId
    ON TenantRentSettings(roomTenantMappingId);

-- For Room queries (if not already exists)
CREATE INDEX IX_Rooms_PropertyId ON Rooms(propertyId);

-- For Property queries (if not already exists)
CREATE INDEX IX_Properties_OwnerId ON Properties(ownerId);
```

### **Expected Performance Impact:**
- **Query Time:** +5-10ms per query (minimal with proper indexes)
- **Response Size:** +200-300 bytes per record (negligible)
- **No pagination impact:** Filters and sorting remain efficient

---

## ✅ Testing Requirements

### **Backend Testing Checklist:**
- [ ] All search endpoints return joined fields correctly
- [ ] GetById endpoints return joined fields correctly
- [ ] Null handling for optional fields (email, ownerName, currency)
- [ ] Verify no N+1 query issues
- [ ] Test with large datasets (1000+ records)
- [ ] Verify pagination still works correctly
- [ ] Test filtering with joined fields

### **Sample Test Cases:**

**Test Case 1: RoomTenantMapping Search**
```
Endpoint: POST /api/roomtenantmapping/search
Request: { "pageNumber": 1, "pageSize": 10, "isActive": true }
Expected: Response includes tenantName, roomNo, propertyName for all records
```

**Test Case 2: TenantRentSetting GetById**
```
Endpoint: GET /api/tenantRentSetting/5
Expected: Response includes all 8 new joined fields
```

**Test Case 3: Null Currency Handling**
```
Endpoint: GET /api/tenantRentSetting/10
Scenario: Record has currencyId = null
Expected: currencyName and currencySymbol should be null (not throw error)
```

---

## 🚀 Implementation Priority

### **Phase 1 (High Priority - User Facing):**
✅ RoomTenantMapping API enhancement
✅ TenantRentSetting API enhancement

### **Phase 2 (Nice to Have):**
- Add ownerEmail to RoomTenantMapping response
- Add roomTypeName to RoomTenantMapping response

---

## 📞 Questions & Contact

If you have any questions about these requirements, please contact:

**Frontend Team Lead:** [Your Name]
**Slack Channel:** #frontend-backend-sync
**Email:** frontend-team@company.com

### **Common Questions:**

**Q: Should we update Create/Update DTOs too?**
A: No, only Read/Search responses need enhancement. Create/Update DTOs remain unchanged.

**Q: What about backward compatibility?**
A: Adding fields is backward compatible. Old clients will ignore new fields.

**Q: Should we create separate ViewModels?**
A: Recommended approach - keep domain models unchanged, create new DTOs for API responses.

**Q: Performance concerns with JOINs?**
A: Minimal impact with proper indexes. Current queries already have similar complexity.

---

## 📝 Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-01-04 | Initial document | Frontend Team |

---

## ✅ Sign-off

**Frontend Team:** _________________ Date: _________
**Backend Team:** _________________ Date: _________
**Product Owner:** _________________ Date: _________

---

**END OF DOCUMENT**
