# Multi-User Role-Based Architecture Plan

## Overview
Transform the single-user PDF form filler into a multi-user, role-based collaboration system for shipment management while preserving the core Create AWB functionality.

## User Roles & Permissions

### Roles:
1. **Shipper** - Initiates shipments, provides shipping details
2. **Issuing Carrier's Agent** - Creates AWBs, manages carrier operations (CURRENT USER)
3. **Consignee** - Receives shipments, approves and pays fees
4. **Customs Broker** - Handles customs documentation and clearance
5. **Courier** - Manages delivery and tracking

### Role-Based Access:
- Each role sees different navigation items
- Each role can input service fees for their services
- Collaboration happens within "Shipment Spaces" (identified by AWB number)

## Proposed File Structure

```
/
├── index.html (or login.html) - Entry point with role selection
├── dashboard.html - Role-based dashboard (shows different content per role)
├── 
├── [PRESERVED - Core AWB Feature]
├── create-awb.html - UNCHANGED (Issuing Carrier's Agent only)
├── app4.js - UNCHANGED (core PDF functionality)
├── AWB1.pdf - UNCHANGED
├── styles.css - Extended (add role-specific styles)
│
├── [NEW - User Management]
├── auth/
│   ├── login.html - Enhanced with role selection
│   ├── register.html - User registration
│   └── auth.js - Authentication logic
│
├── [NEW - Shipment Management]
├── shipments/
│   ├── list.html - List all shipments user has access to
│   ├── view.html - View/edit shipment (role-based)
│   ├── create.html - Create new shipment (redirects to create-awb for Issuing Carrier)
│   └── shipments.js - Shipment management logic
│
├── [NEW - Role-Specific Pages]
├── roles/
│   ├── shipper/
│   │   ├── dashboard.html - Shipper-specific dashboard
│   │   └── tasks.html - Shipper tasks
│   ├── carrier-agent/
│   │   ├── dashboard.html - Carrier agent dashboard
│   │   └── create-awb.html - (links to main create-awb.html)
│   ├── consignee/
│   │   ├── dashboard.html - Consignee dashboard
│   │   ├── approve.html - Approve shipments and fees
│   │   └── payment.html - Payment interface
│   ├── customs-broker/
│   │   ├── dashboard.html - Customs broker dashboard
│   │   └── customs-docs.html - Customs documentation
│   └── courier/
│       ├── dashboard.html - Courier dashboard
│       └── tracking.html - Delivery tracking
│
├── [NEW - Collaboration]
├── collaboration/
│   ├── invite.html - Invite users to shipment
│   └── collaboration.js - Real-time collaboration (future)
│
├── [NEW - Fees & Billing]
├── billing/
│   ├── fees.html - View/add service fees (role-based)
│   ├── invoice.html - Generate invoice for consignee
│   └── billing.js - Fee calculation logic
│
├── [NEW - Shared Components]
├── js/
│   ├── auth.js - Authentication & authorization
│   ├── user.js - User management
│   ├── roles.js - Role-based permissions
│   ├── shipments.js - Shipment data management
│   ├── fees.js - Fee management
│   └── api.js - API layer (for future backend integration)
│
└── [NEW - Data Models]
└── models/
    ├── user.js - User data structure
    ├── shipment.js - Shipment data structure
    ├── fee.js - Fee data structure
    └── invitation.js - Invitation data structure
```

## Data Structure (localStorage initially, ready for backend)

### Users
```javascript
{
  id: "user123",
  email: "user@example.com",
  name: "John Doe",
  role: "issuing-carrier-agent",
  company: "ABC Logistics",
  createdAt: "2024-01-01"
}
```

### Shipments (AWB-based)
```javascript
{
  awbNumber: "123-45678901", // Primary identifier
  createdBy: "user123",
  createdAt: "2024-01-01",
  status: "draft|in-progress|completed",
  participants: [
    { userId: "user123", role: "issuing-carrier-agent", invitedAt: "2024-01-01" },
    { userId: "user456", role: "shipper", invitedAt: "2024-01-02" }
  ],
  formData: { /* All AWB form data from create-awb.html */ },
  fees: [
    { role: "issuing-carrier-agent", amount: 150, description: "AWB processing" },
    { role: "customs-broker", amount: 200, description: "Customs clearance" }
  ],
  totalFees: 350,
  paidBy: null,
  paidAt: null
}
```

### Invitations
```javascript
{
  id: "inv123",
  shipmentAWB: "123-45678901",
  invitedBy: "user123",
  invitedUser: "user456",
  role: "shipper",
  status: "pending|accepted|declined",
  createdAt: "2024-01-01"
}
```

## Navigation Flow

### 1. Login/Registration
- User selects role during registration
- Login validates role
- Redirects to role-specific dashboard

### 2. Dashboard (Role-Based)
- **Issuing Carrier's Agent**: 
  - "Create AWB" button → create-awb.html (PRESERVED)
  - "My Shipments" list
  - "Pending Invitations"
  
- **Shipper**:
  - "My Shipments" list
  - "Create Shipment Request"
  
- **Consignee**:
  - "Incoming Shipments" list
  - "Pending Approvals"
  - "Payment Center"
  
- **Customs Broker**:
  - "Assigned Shipments" list
  - "Customs Documentation"
  
- **Courier**:
  - "Active Deliveries" list
  - "Tracking Management"

### 3. Shipment Collaboration
- Each shipment has a "Shipment Space" identified by AWB number
- Users can invite other role users to collaborate
- Each role sees role-specific tabs/views
- All form data from create-awb.html is stored and shared

### 4. Create AWB Flow (PRESERVED)
- Only accessible to "Issuing Carrier's Agent" role
- create-awb.html remains UNCHANGED
- After AWB creation:
  - Save form data to shipment object
  - Create shipment record
  - Option to invite other roles
  - Generate AWB PDF (existing functionality)

## Implementation Strategy

### Phase 1: Foundation (Preserve Core)
1. ✅ Keep create-awb.html and app4.js completely unchanged
2. Create new auth system (auth.js)
3. Create role-based navigation
4. Create shipment data structure
5. Modify dashboard.html to be role-aware

### Phase 2: User Management
1. Enhanced login with role selection
2. User registration
3. Role-based permissions
4. User profile management

### Phase 3: Shipment Management
1. Shipment list view
2. Shipment detail view (role-based)
3. Link create-awb.html to save to shipment
4. Shipment status tracking

### Phase 4: Collaboration
1. Invitation system
2. Multi-user access to shipments
3. Role-based views within shipment

### Phase 5: Fees & Billing
1. Fee input per role
2. Fee aggregation
3. Payment tracking
4. Invoice generation

## Key Design Principles

1. **Preserve Core Functionality**: create-awb.html and app4.js remain untouched
2. **Modular Architecture**: Each feature in separate files
3. **Role-Based Access Control**: Check role before showing features
4. **Data Layer Abstraction**: localStorage now, easy to swap for backend API
5. **Progressive Enhancement**: Start simple, add features incrementally

## Migration Path

1. **Current State**: Single-user, localStorage auth, create-awb.html works
2. **Phase 1**: Add roles, preserve create-awb.html, add shipment storage
3. **Phase 2**: Add collaboration, invitations
4. **Phase 3**: Add fees, billing
5. **Future**: Replace localStorage with backend API (minimal code changes)

## Benefits

- ✅ Create AWB feature remains completely functional
- ✅ Can be implemented incrementally
- ✅ Ready for backend integration
- ✅ Scalable architecture
- ✅ Role-based security
- ✅ Multi-user collaboration
