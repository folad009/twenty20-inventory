Project Name
Inventory & Asset Tracking MVP
 
Product Vision
Build a simple, reliable inventory management platform that enables organizations to:
•	Register equipment and assets
•	Generate and scan QR codes
•	Assign equipment to events and staff
•	Track equipment check-out and check-in
•	Report damaged equipment from the field
•	Maintain accountability for every asset
The MVP's primary goal is to answer:
"Who has this equipment, where is it, and when is it expected back?"
 
MVP Scope
The MVP will include only the essential workflows required to manage equipment assignments and returns.
Included Features
✅ User Authentication
✅ Staff Management
✅ Asset Management
✅ QR Code Generation
✅ Event Management
✅ Equipment Assignment
✅ Equipment Check-Out
✅ Equipment Check-In
✅ Damage Reporting
✅ Basic Dashboard
 
User Roles
Administrator
Permissions:
•	Manage users
•	Manage staff
•	Manage assets
•	Create events
•	Assign equipment
•	View all reports
•	View damage reports
 
Staff
Permissions:
•	Login
•	View assigned events
•	View assigned equipment
•	Submit damage reports
 
Core Workflows
Workflow 1: Asset Registration
Inventory officer registers equipment.
Asset Fields
Field	Required
Asset ID	Yes
Asset Name	Yes
Category	Yes
QR Code	Auto Generated
Status	Auto
Notes	Optional
Asset Categories
Initial categories:
•	Cable
•	Extension Cord
•	Monitor
•	Screen
•	Camera
•	Microphone
•	Power Supply
•	Lighting Equipment
•	Other
Asset Statuses
•	Available
•	Assigned
•	Damaged
 
Workflow 2: Staff Registration
Staff Fields
Field	Required
Full Name	Yes
Email	Yes
Phone Number	Yes
Department	Optional
 
Workflow 3: Event Creation
Administrators can create events.
Event Fields
Field	Required
Event Name	Yes
Event Date	Yes
Location	Yes
Description	Optional
 
Workflow 4: Equipment Assignment
Equipment can be assigned to an event and staff member.
Assignment Process
1.	Create Event
2.	Select Staff
3.	Scan or Select Assets
4.	Confirm Assignment
Assignment Record
Store:
•	Event
•	Staff
•	Asset
•	Assigned By
•	Assigned Date
 
Workflow 5: Equipment Check-Out
When equipment leaves storage:
Process
1.	Scan QR Code
2.	Confirm Assignment
3.	Mark Asset as Assigned
Capture
•	Asset
•	Event
•	Staff
•	Checkout Time
•	User
Result
Asset status becomes:
Assigned
 
Workflow 6: Equipment Check-In
When equipment returns:
Process
1.	Scan QR Code
2.	Verify Equipment Condition
3.	Complete Return
Capture
•	Asset
•	Return Time
•	User
•	Condition
Result
Asset status becomes:
Available
or
Damaged
 
Workflow 7: Damage Reporting
Staff can report issues while on site.
Damage Report Fields
Field	Required
Asset	Yes
Description	Yes
Photo	Optional
Event	Optional
Reporter	Auto
Date	Auto
Statuses
•	Reported
•	Reviewed
•	Resolved
 
Dashboard
Provide a high-level overview.
Dashboard Metrics
Assets
•	Total Assets
•	Available Assets
•	Assigned Assets
•	Damaged Assets
Events
•	Upcoming Events
•	Active Events
Staff
•	Total Staff
Damage Reports
•	Open Reports
•	Resolved Reports
 
MVP Database Schema
users
id
name
email
password_hash
role
created_at
updated_at
 
staff
id
full_name
email
phone_number
department
created_at
updated_at
 
asset_categories
id
name
created_at
 
assets
id
asset_code
name
category_id
qr_code
status
notes
created_at
updated_at
 
events
id
name
event_date
location
description
created_at
updated_at
 
event_staff
id
event_id
staff_id
created_at
 
asset_assignments
id
asset_id
event_id
staff_id
assigned_by
assigned_at
returned_at
status
 
asset_movements
id
asset_id
action
performed_by
timestamp
notes
Actions:
•	CHECKOUT
•	CHECKIN
 
damage_reports
id
asset_id
event_id
reported_by
description
photo_url
status
created_at
updated_at
 
API Modules
Authentication
Endpoints:
POST /auth/login
POST /auth/logout
GET /auth/me
 
Staff
GET /staff
POST /staff
PATCH /staff/:id
DELETE /staff/:id
 
Assets
GET /assets
POST /assets
PATCH /assets/:id
DELETE /assets/:id
 
Events
GET /events
POST /events
PATCH /events/:id
DELETE /events/:id
 
Assignments
POST /assignments
GET /assignments
POST /assignments/:id/checkout
POST /assignments/:id/checkin
 
Damage Reports
POST /damage-reports
GET /damage-reports
PATCH /damage-reports/:id
 
Technical Stack
Frontend
•	Next.js 15
•	TypeScript
•	Tailwind CSS
•	Shadcn UI
•	React Query
 
Backend
•	NestJS
•	TypeScript
•	Prisma ORM
 
Database
•	PostgreSQL
 
Authentication
•	JWT Access Tokens
•	Refresh Tokens
 
File Storage
•	AWS S3
•	Cloudflare R2
 
QR Code
Libraries:
•	qrcode
•	html5-qrcode
 

Success Criteria
The MVP is successful if administrators can:
1.	Register equipment.
2.	Generate QR codes.
3.	Register staff.
4.	Create events.
5.	Assign equipment to staff and events.
6.	Check equipment out.
7.	Check equipment back in.
8.	Receive damage reports.
9.	View current asset status.