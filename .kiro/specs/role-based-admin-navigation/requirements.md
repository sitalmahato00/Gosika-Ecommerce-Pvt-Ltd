# Requirements Document

## Introduction

This document specifies requirements for implementing role-based access control for the admin navigation menu and route protection in the Gosika E-commerce platform. The system already has a permission structure defined via Spatie Laravel Permission package with granular permissions (e.g., `orders.view`, `products.manage`, `users.view`). Currently, users with custom admin roles can access the admin portal but see ALL menu items regardless of their assigned permissions. This feature will filter navigation items based on user permissions, block unauthorized route access, and provide appropriate feedback.

## Glossary

- **Admin_Navigation_System**: The frontend React component responsible for rendering navigation menus in the admin portal
- **Permission_Service**: Backend Laravel service using Spatie Permission package that manages user permissions
- **Route_Guard**: React component that validates user access to specific routes before rendering
- **Navigation_Item**: A single menu entry in the admin sidebar or mobile navigation
- **Super_Admin**: User with role `super_admin` who has access to all features
- **Custom_Admin_Role**: Any admin role that is not `super_admin`, `customer`, or `vendor_admin`
- **Permission_Map**: A data structure that associates each navigation item with required permissions
- **Auth_Context**: React context that provides authenticated user data including roles and permissions
- **User_Resource**: Backend API resource that serializes user data for frontend consumption

## Requirements

### Requirement 1: Backend Permissions API

**User Story:** As a system administrator, I want the backend to provide user permissions via the authentication endpoint, so that the frontend can make permission-based decisions.

#### Acceptance Criteria

1. WHEN the `/auth/me` endpoint is called, THE User_Resource SHALL include a `permissions` array containing all permission strings assigned to the authenticated user
2. WHEN the authenticated user has role `super_admin`, THE User_Resource SHALL include all permissions defined in `Permissions::ALL`
3. THE User_Resource SHALL load the user's roles and permissions relationships from the database
4. THE User_Resource SHALL serialize permissions as an array of permission strings (e.g., `["orders.view", "products.manage"]`)
5. FOR ALL authenticated requests, parsing the User_Resource SHALL produce consistent permission data

### Requirement 2: Frontend Permission Context

**User Story:** As a frontend developer, I want to access user permissions through the Auth Context, so that I can implement permission checks throughout the application.

#### Acceptance Criteria

1. THE Auth_Context SHALL expose a `permissions` property containing the array of user permission strings
2. THE Auth_Context SHALL expose a `hasPermission` function that accepts a permission string and returns a boolean
3. THE Auth_Context SHALL expose a `hasAnyPermission` function that accepts an array of permission strings and returns true if the user has at least one
4. THE Auth_Context SHALL expose a `hasAllPermissions` function that accepts an array of permission strings and returns true if the user has all of them
5. WHEN the user is a Super_Admin, THE `hasPermission` function SHALL return true for any permission check
6. WHEN the user is not authenticated, THE permission check functions SHALL return false

### Requirement 3: Navigation Permission Mapping

**User Story:** As a system designer, I want each navigation item mapped to required permissions, so that the system knows which items to display for each user.

#### Acceptance Criteria

1. THE Admin_Navigation_System SHALL define a Permission_Map that associates each Navigation_Item with required permission strings
2. THE Permission_Map SHALL support single permission requirements (e.g., `orders.view` for Orders menu)
3. THE Permission_Map SHALL support multiple alternative permissions (e.g., `["products.view", "products.manage"]` where user needs any one)
4. THE Permission_Map SHALL support wildcard patterns for sections (e.g., all items in "Finance" section require any finance-related permission)
5. WHEN a Navigation_Item has no permission mapping, THE Admin_Navigation_System SHALL display it to all authenticated admin users
6. THE Permission_Map SHALL be defined in a centralized constants file for maintainability

### Requirement 4: Navigation Filtering

**User Story:** As an admin user with limited permissions, I want to see only the menu items I have access to, so that I can focus on my assigned responsibilities.

#### Acceptance Criteria

1. WHEN the Admin_Navigation_System renders, THE system SHALL filter Navigation_Items based on the authenticated user's permissions
2. WHEN a user lacks required permissions for a Navigation_Item, THE Admin_Navigation_System SHALL exclude that item from rendering
3. WHEN a user is Super_Admin, THE Admin_Navigation_System SHALL display all Navigation_Items without filtering
4. WHEN all items in a navigation section are filtered out, THE Admin_Navigation_System SHALL hide the section header
5. THE Admin_Navigation_System SHALL apply the same filtering logic to both desktop sidebar and mobile navigation
6. THE filtering SHALL occur reactively when user permissions change (e.g., after role update and auth refresh)

### Requirement 5: Route Protection

**User Story:** As a system administrator, I want to block unauthorized access to admin pages, so that users cannot bypass navigation restrictions by directly entering URLs.

#### Acceptance Criteria

1. WHEN a user navigates to a protected admin route, THE Route_Guard SHALL validate the user has required permissions before rendering the page
2. WHEN a user lacks required permissions, THE Route_Guard SHALL redirect to an unauthorized error page with HTTP 403 semantics
3. WHEN a user is Super_Admin, THE Route_Guard SHALL allow access to all admin routes
4. THE Route_Guard SHALL define permission requirements for each protected route using the Permission_Map
5. THE Route_Guard SHALL check permissions synchronously without additional API calls (using cached Auth_Context data)
6. WHEN a route has no explicit permission requirements, THE Route_Guard SHALL allow access to any authenticated admin user

### Requirement 6: Unauthorized Access Feedback

**User Story:** As an admin user, I want clear feedback when I attempt to access a restricted page, so that I understand why access is denied.

#### Acceptance Criteria

1. WHEN a user is redirected due to insufficient permissions, THE system SHALL display an error page with a 403 Unauthorized message
2. THE error page SHALL display the message "You don't have permission to access this page"
3. THE error page SHALL include a button to return to the admin dashboard
4. THE error page SHALL include a button to contact support or request access
5. THE error page SHALL NOT expose which specific permission is missing (security consideration)
6. WHEN a user attempts to access a route that doesn't exist, THE system SHALL display a 404 error instead of a 403

### Requirement 7: Permission Mapping Maintenance

**User Story:** As a developer, I want to easily maintain permission-to-route mappings, so that adding new features with permission requirements is straightforward.

#### Acceptance Criteria

1. THE Permission_Map SHALL be defined in a centralized constants file alongside ADMIN_NAV
2. THE Permission_Map SHALL use the same navigation item identifiers (route paths) as ADMIN_NAV for consistency
3. WHEN a developer adds a new Navigation_Item, THE system SHALL provide a clear pattern for adding corresponding permission requirements
4. THE Permission_Map SHALL reference permission constants from `Permissions.php` to maintain consistency with backend
5. THE system SHALL provide JSDoc comments or TypeScript types documenting the Permission_Map structure

### Requirement 8: Super Admin Bypass

**User Story:** As a super administrator, I want unrestricted access to all admin features, so that I can perform any administrative task without permission configuration.

#### Acceptance Criteria

1. WHEN a user has role `super_admin`, THE system SHALL grant access to all Navigation_Items regardless of Permission_Map
2. WHEN a user has role `super_admin`, THE Route_Guard SHALL allow access to all admin routes
3. WHEN a user has role `super_admin`, THE hasPermission function SHALL return true for any permission string
4. THE super admin bypass logic SHALL be checked before evaluating specific permissions (performance optimization)
5. THE system SHALL log super admin access for audit purposes (backend responsibility, not frontend)

### Requirement 9: Mobile Navigation Consistency

**User Story:** As an admin user accessing the portal from a mobile device, I want the same permission-based filtering on mobile navigation, so that the experience is consistent across devices.

#### Acceptance Criteria

1. THE Admin_Navigation_System SHALL apply identical filtering logic to `ADMIN_MOBILE_NAV` and `ADMIN_NAV`
2. WHEN rendering mobile bottom navigation, THE system SHALL filter items based on user permissions
3. WHEN all mobile navigation items are filtered out (edge case), THE system SHALL display at least the dashboard link
4. THE mobile navigation SHALL use the same Permission_Map as desktop navigation
5. THE mobile navigation filtering SHALL occur reactively in sync with desktop navigation updates

### Requirement 10: Performance Optimization

**User Story:** As a system user, I want navigation filtering to be instantaneous, so that there is no perceived delay when loading the admin portal.

#### Acceptance Criteria

1. THE navigation filtering logic SHALL execute synchronously using cached permission data from Auth_Context
2. THE system SHALL NOT make additional API calls during navigation rendering
3. WHEN the user's permissions change (e.g., role update), THE Auth_Context SHALL refresh via existing `/auth/me` call
4. THE permission check functions SHALL use Set or Map data structures for O(1) lookup performance
5. THE navigation filtering SHALL complete within 50ms on standard hardware (measured via performance profiling)

### Requirement 11: Edge Case Handling

**User Story:** As a system designer, I want proper handling of edge cases, so that the system behaves predictably in unusual scenarios.

#### Acceptance Criteria

1. WHEN a user has no permissions assigned, THE Admin_Navigation_System SHALL display only the dashboard link
2. WHEN the permissions API returns an empty array, THE system SHALL treat it as having no permissions (not an error)
3. WHEN a user's role is changed while they are logged in, THE system SHALL continue using cached permissions until next refresh
4. WHEN a Navigation_Item is mapped to a permission that doesn't exist in the backend, THE system SHALL hide that item (fail-safe behavior)
5. WHEN the Auth_Context is still loading, THE navigation SHALL show a loading skeleton or empty state instead of rendering then hiding items
6. WHEN a user navigates to a route that becomes unauthorized mid-session (role revoked), THE system SHALL detect on next navigation and redirect appropriately

