# 🏨 Blue Pair Hotel

### Premium Hotel Management & Guest Experience Platform

**Uromi, Edo State, Nigeria**

Blue Pair Hotel is a modern, full-stack hotel website and management platform designed to provide a premium digital experience for guests while giving hotel staff and management the tools they need to operate the property efficiently.

The platform combines a **public hotel website, online booking system, guest dashboard, hotel operations dashboards, restaurant and bar management, events, short-lets, advertising, reporting, staff management, and SEO infrastructure** into one unified system.

Built with **Next.js 14, React, TypeScript, Tailwind CSS, Supabase, and modern web technologies**, the platform is designed to be responsive, scalable, and ready to evolve from a prototype into a production hotel management system.

---

# ✨ Platform Overview

Blue Pair is more than a hotel website.

It is designed as a complete digital ecosystem connecting:

* 👤 Guests
* 🏨 Hotel management
* 🛎️ Reception
* 🧹 Housekeeping
* 🔧 Maintenance
* 🍽️ Restaurant
* 🍹 Bar
* 🎉 Events
* 🏠 Short-let accommodation
* 📢 Advertising / billboards
* 👨‍💼 Staff
* 📊 Management reports

The goal is to allow a guest to discover the hotel, make a reservation, manage their stay, request services, receive updates, interact with the hotel, and continue using the platform even after booking.

At the same time, hotel staff can manage the operational side of the property from dedicated dashboards.

---

# 🌐 Public Hotel Website

The public-facing website is designed to function as the hotel's primary digital presence.

### Main sections include:

* Home
* About
* Rooms
* Room details
* Amenities
* Gallery
* Dining
* Restaurant
* Bar
* Gym
* Swimming pool
* Club
* VIP lounge
* Events
* Short-lets
* Offers
* Billboard / advertising
* Contact
* Booking

The website is responsive and designed to provide a premium experience across:

* Desktop
* Laptop
* Tablet
* Mobile

---

# 🛏️ Rooms & Accommodation

Guests can explore available accommodation with detailed information including:

* Room type
* Images
* Pricing
* Capacity
* Bed configuration
* Amenities
* Room features
* Availability
* Check-in/check-out information

Each room can have its own dedicated page with SEO-friendly metadata and structured data.

The system is designed so that room information can eventually be connected directly to a live database instead of static mock data.

---

# 📅 Online Booking System

Guests can book rooms directly through the website.

The booking flow is designed around:

1. Selecting accommodation
2. Choosing check-in date
3. Choosing check-out date
4. Selecting number of guests
5. Reviewing room information
6. Reviewing pricing
7. Entering guest information
8. Confirming reservation
9. Proceeding to payment
10. Receiving booking confirmation

The architecture is designed to support real availability and payment processing when connected to the production backend.

---

# 👤 Guest Account & Dashboard

One of the most important parts of the platform is the **Guest Dashboard**.

After signing in, guests can manage their relationship with Blue Pair from one place.

### Guest dashboard features include:

* Personal profile
* Upcoming reservations
* Previous stays
* Booking details
* Booking status
* Digital receipts
* Payment information
* Room information
* Check-in/check-out details
* Hotel announcements
* Available offers
* Events
* Dining information
* Hotel services
* Service requests
* Notifications
* Support/contact hotel
* Saved preferences

The dashboard is intended to become the guest's personal digital hub throughout their stay.

---

# 🔔 Guest Updates & Notifications

The platform can keep guests informed without requiring them to contact reception for every update.

Guests can receive information about:

* Booking confirmations
* Reservation changes
* Check-in reminders
* Check-out reminders
* Hotel announcements
* New offers
* Events
* Restaurant promotions
* Club events
* Special packages
* Maintenance notices
* Important hotel information

The notification system can eventually support:

* In-app notifications
* Email
* Push notifications
* WhatsApp integration
* SMS where required

---

# 🤖 AI Guest Assistant

The platform is designed to support an AI-powered hotel assistant.

The AI can be restricted to **approved hotel information and database data**, rather than being given unrestricted access to the entire system.

For example, the assistant could help guests with:

* "What time is breakfast?"
* "What rooms are available?"
* "What events are happening tonight?"
* "What are today's restaurant specials?"
* "Where is the gym?"
* "What time does the pool close?"
* "Show me my booking."
* "What services are available?"
* "Do you have any current offers?"
* "How do I contact reception?"

The AI can be given controlled read-only access to selected database information.

### Important security principle

The AI should **not** automatically receive unrestricted access to the entire Supabase database.

Instead, access should be controlled through specific server-side functions/API endpoints exposing only approved information.

For example:

```text
AI
 ↓
Approved server function
 ↓
Allowed hotel data
 ↓
Guest response
```

This keeps sensitive information such as passwords, payment data, internal staff information, and administrative records outside the AI's access.

---

# 🍽️ Restaurant & Dining

The dining section provides guests with information about the hotel's food and beverage services.

Possible functionality includes:

* Restaurant menu
* Food categories
* Meals
* Prices
* Special offers
* Restaurant opening hours
* Dining reservations
* In-room dining
* Food orders
* Order status
* Restaurant promotions

The restaurant can eventually have its own operational dashboard for staff.

---

# 🍹 Bar

The bar section can provide:

* Drinks
* Menu
* Pricing
* Promotions
* Opening hours
* Events
* VIP offerings

The bar can also be integrated with hotel events and promotional campaigns.

---

# 🏊 Hotel Amenities

Blue Pair's amenities are presented as dedicated sections/pages rather than being hidden inside a generic amenities list.

Current planned amenities include:

* 🏊 Indoor swimming pool
* 🏋️ Gym
* 🎮 Games
* 🎵 Club
* 🛋️ VIP lounge
* 🍽️ Restaurant
* 🍹 Outdoor bar/eatery
* 🚗 Parking
* 🛗 Elevator
* 🚬 Smoking area
* 📢 Billboard advertising

Each amenity can have its own landing page, content, SEO metadata, and structured data where appropriate.

---

# 🎉 Events

The events system allows Blue Pair to promote and manage events hosted at the property.

Examples include:

* Parties
* Weddings
* Birthdays
* Corporate events
* Club nights
* Special dinners
* Live entertainment
* Holiday events

Event pages can contain:

* Event name
* Date
* Time
* Location
* Description
* Images
* Ticket/booking information
* Available packages

Events are also represented using structured `Event` data where applicable.

---

# 🏠 Short-Let Accommodation

Blue Pair can provide short-let properties in addition to traditional hotel rooms.

Short-let listings can include:

* Property images
* Description
* Pricing
* Amenities
* Location
* Availability
* Capacity
* Booking information

Each short-let can have its own dedicated page and SEO metadata.

---

# 📢 Billboard & Advertising

The platform includes a digital advertising section for available billboard/advertising spaces.

Potential customers can:

* View available advertising spaces
* See billboard locations
* View dimensions
* Check pricing
* Select dates
* Submit reservations
* Provide campaign information
* Track advertising requests

This creates another revenue stream for the hotel beyond rooms and hospitality services.

---

# 🛎️ Reception Dashboard

Reception staff have a dedicated operational dashboard.

Reception can eventually manage:

* Arrivals
* Departures
* Reservations
* Guest information
* Room assignments
* Check-ins
* Check-outs
* Booking status
* Guest requests
* Payments
* Room status
* Guest communication

The reception dashboard is designed to reduce the need for manual coordination between departments.

---

# 🧹 Housekeeping Dashboard

Housekeeping can monitor room status in real time.

Possible states include:

```text
Available
Occupied
Dirty
Cleaning
Clean
Inspected
Maintenance
Out of Service
```

Housekeeping staff can receive cleaning tasks after guests check out.

For example:

```text
Guest checks out
       ↓
Room becomes "Dirty"
       ↓
Housekeeping receives task
       ↓
Room cleaned
       ↓
Supervisor inspection
       ↓
Room becomes "Available"
```

This allows room availability to reflect actual operational status.

---

# 🔧 Maintenance Dashboard

Maintenance staff can manage issues reported throughout the hotel.

Examples:

* Air conditioning problems
* Plumbing
* Electrical issues
* Television problems
* Internet problems
* Lighting
* Furniture
* Appliances
* Pool equipment

Staff can create and track maintenance tickets including:

* Issue
* Location
* Priority
* Assigned staff
* Status
* Notes
* Completion time

---

# 🍽️ Restaurant Operations

The restaurant can have its own internal dashboard for managing:

* Orders
* Menu
* Food availability
* Tables
* Reservations
* Kitchen status
* Order progress

Example order flow:

```text
Guest places order
       ↓
Restaurant receives order
       ↓
Kitchen accepts order
       ↓
Preparing
       ↓
Ready
       ↓
Delivered
       ↓
Completed
```

---

# 📊 Management Dashboard

Hotel management receives a high-level overview of the property.

Possible metrics include:

* Total bookings
* Occupancy
* Revenue
* Room performance
* Restaurant revenue
* Bar revenue
* Event revenue
* Short-let revenue
* Advertising revenue
* Guest activity
* Staff activity
* Maintenance issues
* Housekeeping performance

Management can use these statistics to understand how the hotel is performing without manually combining information from multiple departments.

---

# 📈 Reports & Analytics

The system is designed to eventually provide detailed reports such as:

### Revenue

* Daily revenue
* Weekly revenue
* Monthly revenue
* Revenue by room
* Revenue by department

### Occupancy

* Current occupancy
* Occupancy percentage
* Available rooms
* Occupied rooms
* Upcoming arrivals
* Upcoming departures

### Guest analytics

* New guests
* Returning guests
* Booking frequency
* Popular room types
* Popular services

### Operational analytics

* Average room cleaning time
* Maintenance response time
* Outstanding issues
* Staff activity

---

# 👨‍💼 Staff Management

Management can maintain staff accounts and permissions.

The system can support role-based access such as:

```text
Super Admin
Management
Reception
Housekeeping
Maintenance
Restaurant
Bar
Events
Content Manager
```

Each role receives only the permissions required for its responsibilities.

This is especially important when the platform is connected to a real production database.

---

# 🔐 Authentication & Security

Authentication is designed around secure user accounts.

The system separates:

### Guests

Access to:

* Their profile
* Their bookings
* Their payments
* Their notifications
* Their requests

### Staff

Access to their department dashboard.

### Administrators

Access to management and system-level functionality.

Sensitive areas such as:

```text
/admin
/reception
/housekeeping
/maintenance
```

are protected from search engine indexing and should also be protected through authentication and authorization at the application/database level.

---

# 🔎 SEO & Local Search

SEO is a major part of the platform.

The site is specifically structured to target searches around:

* Hotel in Uromi
* Hotels in Edo State
* Hotel near Uromi
* Hotel near Ekpoma
* Hotel near Ubiaja
* Hotel with swimming pool in Uromi
* Hotel with gym in Uromi
* Restaurant in Uromi
* Nightclub in Uromi
* Event venue in Uromi
* Short-let in Uromi

The strategy combines:

**Service + Location**

rather than relying only on the hotel's brand name.

---

# 🚀 Server-Side Rendering

The project uses **Next.js App Router** and Server Components.

Public content is rendered on the server so that search engines and link-preview systems can receive meaningful HTML without needing to execute JavaScript first.

This improves:

* SEO
* Initial page rendering
* Link previews
* Accessibility
* Crawlability
* Performance

Interactive features still use Client Components where required.

---

# 🧠 Structured Data

The website uses JSON-LD structured data including:

### Hotel

Contains information such as:

* Hotel name
* Address
* Phone
* Coordinates
* Amenities
* Service areas

### Product

Used for:

* Rooms
* Short-lets
* Pricing
* Availability

### Event

Used for published events.

### Restaurant

Used for dining information.

### BreadcrumbList

Used where breadcrumb navigation exists.

---

# 🗺️ Sitemap & Robots

The project includes native Next.js routes for:

```text
/sitemap.xml
/robots.txt
```

The sitemap is generated from the site's data rather than maintained manually.

Private portals are excluded from search engines.

Examples:

```text
/account
/admin
/reception
/housekeeping
/maintenance
```

These areas should never be treated as public SEO pages.

---

# 📍 Google Business Profile

The website should be connected to the hotel's Google Business Profile.

The following should remain consistent across the website and Google:

* Business name
* Address
* Phone number
* Website
* Category
* Business description

Real hotel photography should replace placeholder/stock images before launch.

The Google Business Profile should also contain:

* Exterior photos
* Rooms
* Pool
* Restaurant
* Bar
* Amenities
* Events
* Logo
* Updated business information

Guest reviews should be encouraged after genuine stays.

---

# 📱 Progressive Web App

The platform can also be configured as a Progressive Web App.

This allows guests to add Blue Pair to their device and access the platform more like a native application.

Potential PWA features include:

* Install to home screen
* App-like navigation
* Push notifications
* Cached pages
* Faster repeat visits

---

# 💳 Payments

The architecture is designed to support online payments.

Potential payment flows include:

* Room bookings
* Short-let bookings
* Restaurant orders
* Events
* Advertising
* Other hotel services

A production payment provider can be connected without redesigning the main user experience.

---

# 🔑 Digital Hotel Key — Future Integration

The platform can eventually support digital room keys through supported hotel access-control providers.

Potential guest flow:

```text
Booking confirmed
       ↓
Guest checks in
       ↓
Digital key activated
       ↓
Guest uses phone to access room
       ↓
Check-out
       ↓
Digital key expires
```

Actual implementation depends on the hotel's door-lock hardware and the provider's API/support for mobile credentials.

---

# 🔔 Future Smart Guest Features

The architecture leaves room for additional guest-focused functionality such as:

* Digital check-in
* Digital check-out
* Room-service requests
* Housekeeping requests
* Maintenance requests
* Late checkout requests
* Extra towel requests
* Airport pickup requests
* Wake-up calls
* Restaurant reservations
* Event reservations
* Personalized offers
* Loyalty/rewards
* Guest feedback
* Digital hotel guide
* Push notifications
* Digital receipts
* WhatsApp communication
* AI concierge

The objective is to make the guest dashboard useful throughout the entire stay rather than only during booking.

---

# 🏗️ Technology Stack

### Frontend

* Next.js 14
* React
* TypeScript
* Tailwind CSS
* App Router
* Server Components
* Client Components

### Backend / Data

* Supabase
* PostgreSQL
* Supabase Authentication
* Row Level Security
* Server-side APIs/functions

### State Management

* Zustand

### Deployment

* Vercel

### SEO

* Next.js Metadata API
* JSON-LD
* Dynamic sitemap
* Robots configuration
* Canonical URLs
* Open Graph
* Twitter metadata

---

# 📁 Important Project Structure

```text
app/
├── (public)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── rooms/
│   ├── dining/
│   ├── events/
│   ├── gallery/
│   ├── contact/
│   └── ...
│
├── account/
├── admin/
├── reception/
├── housekeeping/
└── maintenance/

components/
lib/
├── siteConfig.ts
└── buildMetadata.ts

data/
└── mock.ts

store/
└── useStore.ts

public/
```

---

# ⚙️ Configuration

The primary hotel information should be maintained in:

```text
lib/siteConfig.ts
```

This should contain the production values for:

* Hotel name
* Address
* Phone
* Email
* Coordinates
* Website URL
* Social links
* Service areas

Before launch, confirm all business information.

---

# 🚀 Getting Started

Clone the project and install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

For a production build:

```bash
npm run build
npm run start
```

---

# 🧪 Production Checklist

Before launching the hotel website:

* [ ] Replace all placeholder images
* [ ] Confirm hotel address
* [ ] Confirm phone numbers
* [ ] Confirm email addresses
* [ ] Configure production domain
* [ ] Configure Supabase production project
* [ ] Configure authentication
* [ ] Configure Row Level Security
* [ ] Connect payment provider
* [ ] Connect real room availability
* [ ] Connect booking database
* [ ] Configure email notifications
* [ ] Configure push notifications if required
* [ ] Verify Google Business Profile
* [ ] Verify Google Search Console
* [ ] Submit sitemap
* [ ] Test mobile responsiveness
* [ ] Test booking flow
* [ ] Test authentication
* [ ] Test staff permissions
* [ ] Test admin permissions
* [ ] Test database security
* [ ] Replace mock data
* [ ] Test production deployment

---

# 🔄 From Prototype to Production

The current project is structured so that the UI does not need to be rebuilt when moving from prototype data to a real backend.

The current prototype uses:

```text
data/mock.ts
```

and:

```text
store/useStore.ts
```

The production architecture can replace these with Supabase-backed services while keeping the existing UI and user experience.

Conceptually:

```text
CURRENT

Next.js
   ↓
Mock Data
   ↓
UI


PRODUCTION

Next.js
   ↓
Server Actions / API
   ↓
Supabase
   ↓
PostgreSQL
   ↓
Real Hotel Data
```

This allows the project to evolve incrementally instead of requiring a complete rewrite.

---

# 🎯 Project Vision

Blue Pair is intended to become more than an online hotel brochure.

The long-term goal is a **digital hotel platform** where:

> A guest can discover Blue Pair, book a room, manage their reservation, communicate with the hotel, request services, discover events and offers, order food, receive notifications, and manage their entire stay from one account.

At the same time:

> Hotel staff can manage reservations, rooms, housekeeping, maintenance, restaurant operations, events, advertising, guests, staff, and reports from one centralized platform.

The result is a connected hotel ecosystem rather than a collection of separate systems.

---

## 📌 Current Status

**Platform:** Blue Pair Hotel
**Location:** Uromi, Edo State, Nigeria
**Framework:** Next.js 14
**Architecture:** App Router + Server Components
**Database:** Supabase / PostgreSQL
**Deployment:** Vercel
**Status:** Prototype / Production-ready architecture in progress

---

## 📄 License

Private/proprietary project developed for Blue Pair Hotel.

Unauthorized redistribution, commercial reuse, or deployment is not permitted without permission from the project owner.
