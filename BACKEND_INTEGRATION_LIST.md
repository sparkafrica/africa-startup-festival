# Backend Integration Requirements - Spark Event Platform

This document itemizes all areas in the Spark app that require backend integration, API calls, real-time state management, and replacement of mock data.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Home Screen](#home-screen)
3. [Attendees Screen](#attendees-screen)
4. [Schedule Screen](#schedule-screen)
5. [Meetings Screen](#meetings-screen)
6. [Profile Screens](#profile-screens)
7. [QR/Tickets Screen](#qrtickets-screen)
8. [Notifications Screen](#notifications-screen)
9. [Connections Screen](#connections-screen)
10. [Modals & Components](#modals--components)
11. [Context & State Management](#context--state-management)
12. [Navigation](#navigation)
13. [Additional Screens](#additional-screens)
14. [API Service Setup](#api-service-setup)

---

## Authentication Flow

### LoginScreen.tsx

- **Location**: `src/screens/LoginScreen.tsx`
- **TODO Comments Added**: Lines 66-73
- **Integration Points**:
  - Email validation (client-side done, backend validation needed)
  - "Get Ticket" button - Navigate to ticket purchase (external link or deep link)
  - "Contact Us" button - Navigate to contact/support page
  - Analytics tracking for ticket purchase clicks and support requests

### VerificationCodeScreen.tsx

- **Location**: `src/screens/VerificationCodeScreen.tsx`
- **TODO Comments Added**: Lines 91-115, 117-135
- **Integration Points**:
  - Code verification API call (handled in AuthContext)
  - Resend code API call (handled in AuthContext)
  - Rate limiting for code attempts
  - Expired code handling
  - Specific error messages based on error type
  - Clear code inputs on error

### WelcomeScreen.tsx

- **Location**: `src/screens/WelcomeScreen.tsx`
- **TODO Comments Added**: Lines 715-736, handleTransfer function, handleComplete/handleSkip
- **Integration Points**:
  - **Fetch User Tickets**: GET `/api/user/tickets`
    - Replace `mockTickets` array (line 716)
    - Handle loading and error states
    - Cache tickets in state management
  - **Transfer Tickets**: POST `/api/tickets/transfer`
    - Request body: `{ ticketIds: string[], recipient: { fullName, email, phoneNumber, countryCode } }`
    - Handle validation errors, insufficient tickets, duplicate transfers
    - Update local ticket state after successful transfer
    - Refresh ticket list after transfer
  - **Real-time Updates**: WebSocket for ticket updates (transfers, assignments)
  - **Analytics**: Track skip action

### AuthContext.tsx

- **Location**: `src/context/AuthContext.tsx`
- **TODO Comments Added**: Lines 90-99, 168-185, 188-221, 223-247, 267-276
- **Integration Points**:
  - **Request Verification Code**: POST `/api/auth/request-verification-code`
    - Request body: `{ email: string }`
    - Handle rate limiting, retry logic with exponential backoff
    - Store request timestamp to prevent duplicate requests
  - **Verify Code**: POST `/api/auth/verify-code`
    - Request body: `{ email: string, code: string }`
    - Response: `{ user: User, token: string, refreshToken?: string }`
    - Handle invalid code, expired code, too many attempts
    - Store refreshToken for token renewal
    - Implement code attempt tracking (prevent brute force)
  - **Token Validation**: GET `/api/auth/validate-token` or validate on each request
    - Validate stored token before restoring session
    - Handle token expiration and refresh logic
  - **Logout**: POST `/api/auth/logout`
    - Invalidate token on server
    - Clear refreshToken
    - Cancel pending API requests
  - **Complete Profile**: This should be called after profile data is successfully saved to backend
    - Backend should return updated user object with profile completion status

---

## Home Screen

### HomeScreen.tsx

- **Location**: `src/screens/HomeScreen.tsx`
- **TODO Comments Added**: Lines 49-51
- **Integration Points**:
  - **Unread Notifications Count**: GET `/api/notifications/unread-count`
    - Response: `{ count: number, hasUnread: boolean }`
    - Subscribe to notification updates (WebSocket/polling)
    - Update count when notifications are read
  - **Exhibitors Data**: GET `/api/exhibitors` or `/api/companies?type=exhibitor`
    - Replace hardcoded exhibitor cards (lines 230-289)
    - Filter by featured/popular exhibitors for home screen
  - **Partners Data**: GET `/api/partners` or `/api/companies?type=partner`
    - Replace hardcoded partner cards
  - **Banner Data**: GET `/api/banners` or `/api/events/featured`
    - Replace hardcoded banner content
    - Dynamic banner images and text
  - **Checklist Status**: Already handled by ChecklistContext, but needs backend sync

---

## Attendees Screen

### AttendeesScreen.tsx

- **Location**: `src/screens/AttendeesScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Attendees**: GET `/api/attendees`
    - Query params: `?tab=recommended|all&search={query}&filters={filters}&page={page}&limit={limit}`
    - Replace mock attendee data
    - Handle pagination/infinite scroll
    - Cache attendees in state management
  - **Search Attendees**: GET `/api/attendees/search?q={query}`
    - Real-time search with debouncing
    - Search by name, company, title, interests
  - **Filter Attendees**: GET `/api/attendees?filters={encodedFilters}`
    - Filter by industry, interests, job title, country, etc.
    - Apply filters on backend for better performance
  - **Swipe Actions**:
    - **Swipe Right (Connect)**: POST `/api/connections/request`
      - Request body: `{ attendeeId: string }`
      - Handle duplicate connection requests
      - Real-time status updates
    - **Swipe Left (Pass)**: POST `/api/attendees/pass` (optional analytics)
  - **Request Meeting**: Handled by RequestMeetingModal (see Modals section)
  - **Mark Checklist Complete**: Called after successful connect action
    - `markConnectAttendeesComplete()` should be called after API success

---

## Schedule Screen

### ScheduleScreen.tsx

- **Location**: `src/screens/ScheduleScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Events**: GET `/api/events`
    - Query params: `?stage={stage}&day={day}&time={time}&page={page}`
    - Replace mock events array (line 158)
    - Handle filtering by stage, day, time
    - Cache events in state management
  - **Filter Events**: GET `/api/events?filters={encodedFilters}`
    - Apply time and day filters on backend
  - **Add Event to Schedule**: POST `/api/user/schedule/events`
    - Request body: `{ eventId: string }`
    - Mark checklist item complete: `markAddSessionsComplete()`
  - **Remove Event from Schedule**: DELETE `/api/user/schedule/events/{eventId}`
  - **Leave Feedback**: POST `/api/events/{eventId}/feedback`
    - Request body: `{ feedback: string }`
    - Handled by LeaveFeedbackModal
  - **Fetch Event Details**: GET `/api/events/{eventId}`
    - Includes speakers, description, sponsors
  - **Real-time Updates**: WebSocket for event changes (time, location, cancellations)

---

## Meetings Screen

### MeetingsScreen.tsx

- **Location**: `src/screens/MeetingsScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Inbound Meetings**: GET `/api/meetings/inbound`
    - Query params: `?status=pending|scheduled|cancelled&page={page}`
    - Replace mock `inboundMeetings` array (line 120)
    - Handle pagination
  - **Fetch Outbound Meetings**: GET `/api/meetings/outbound`
    - Query params: `?status=pending|scheduled|cancelled&page={page}`
    - Replace mock `outboundMeetings` array (line 161)
  - **Fetch Scheduled Meetings**: GET `/api/meetings/scheduled`
    - Query params: `?direction=inbound|outbound&page={page}`
    - Replace mock `scheduledInboundMeetings` and `scheduledOutboundMeetings` arrays
  - **Fetch Cancelled Meetings**: GET `/api/meetings/cancelled`
    - Replace mock `cancelledMeetings` array
  - **Approve Meeting Request**: POST `/api/meetings/{meetingId}/approve`
    - Request body: `{ message?: string }`
  - **Decline Meeting Request**: POST `/api/meetings/{meetingId}/decline`
    - Request body: `{ reason: string }`
  - **Cancel Meeting**: POST `/api/meetings/{meetingId}/cancel`
    - Request body: `{ reason: string }`
  - **Reschedule Meeting**: PUT `/api/meetings/{meetingId}/reschedule`
    - Request body: `{ date: string, time: string, reason?: string }`
  - **Edit Meeting**: PUT `/api/meetings/{meetingId}`
    - Request body: `{ title, description, date, time, location, meetingLink }`
  - **Real-time Updates**: WebSocket for meeting status changes, new requests, time changes

---

## Profile Screens

### CompleteProfileScreen.tsx

- **Location**: `src/screens/CompleteProfileScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Submit Personal Profile**: POST `/api/user/profile/personal`
    - Request body: `{ fullName, email, phoneNumber, countryCode, country, industry, jobTitle, company, linkedIn, bio, website, interests, tags }`
    - Validate all required fields on backend
    - Handle duplicate email/phone validation
  - **Submit Attendee Profile**: POST `/api/user/profile/attendee`
    - Request body: `{ interests: string[], tags: string[] }`
  - **Submit Company Profile**: POST `/api/user/profile/company`
    - Request body: `{ companyName, industry, country, website, description, offers: Offer[], socialLinks: SocialLink[], openPositions: Position[], teamMembers: Member[] }`
  - **Fetch Profile Data**: GET `/api/user/profile`
    - Pre-fill form with existing profile data
    - Handle loading and error states
  - **Upload Profile Image**: POST `/api/user/profile/avatar`
    - Multipart form data
    - Handle image compression and validation
  - **Fetch Industry/Sector Options**: GET `/api/metadata/industries`
    - Replace hardcoded `INDUSTRY_OPTIONS` array
  - **Fetch Country Options**: GET `/api/metadata/countries`
    - Replace hardcoded `COUNTRY_OPTIONS` array
  - **Mark Profile Complete**: Called after successful profile submission
    - `completeProfile()` in AuthContext should be called after API success

### ProfileScreen.tsx

- **Location**: `src/screens/ProfileScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch User Profile**: GET `/api/user/profile`
    - Pre-fill all form fields with existing data
  - **Update Personal Profile**: PUT `/api/user/profile/personal`
  - **Update Attendee Profile**: PUT `/api/user/profile/attendee`
  - **Update Company Profile**: PUT `/api/user/profile/company`
  - **Delete Profile**: DELETE `/api/user/profile` (if needed)
  - **Upload Profile Image**: POST `/api/user/profile/avatar`
  - All same endpoints as CompleteProfileScreen but with PUT methods

---

## QR/Tickets Screen

### ScanQRScreen.tsx

- **Location**: `src/screens/ScanQRScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Scan QR Code**: POST `/api/tickets/scan`
    - Request body: `{ qrCode: string }`
    - Response: `{ ticket: Ticket, isValid: boolean, message?: string }`
    - Handle invalid QR codes, already scanned tickets
  - **Fetch User Tickets**: GET `/api/user/tickets`
    - Replace mock ticket data
    - Handle loading and error states
  - **Assign Ticket**: POST `/api/tickets/{ticketId}/assign`
    - Request body: `{ fullName, email, phoneNumber, countryCode }`
    - Handle validation errors
  - **Transfer Ticket**: POST `/api/tickets/{ticketId}/transfer`
    - Request body: `{ recipientEmail: string, recipientName?: string }`
    - Handle insufficient permissions, already transferred tickets
  - **Revoke Ticket**: POST `/api/tickets/{ticketId}/revoke`
    - Handle validation (can't revoke assigned tickets)
  - **Edit Ticket Assignment**: PUT `/api/tickets/{ticketId}/assignment`
    - Request body: `{ fullName, email, phoneNumber, countryCode }`
  - **Manual Ticket Entry**: POST `/api/tickets/manual`
    - Request body: `{ ticketId: string, type: string }`
  - **Download Ticket**: GET `/api/tickets/{ticketId}/download`
    - Generate PDF/image of ticket
  - **Share Ticket**: GET `/api/tickets/{ticketId}/share`
    - Generate shareable link
  - **Real-time Updates**: WebSocket for ticket status changes

---

## Notifications Screen

### NotificationsScreen.tsx

- **Location**: `src/screens/NotificationsScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Notifications**: GET `/api/notifications`
    - Query params: `?page={page}&limit={limit}&unreadOnly={boolean}`
    - Replace mock notifications array (line 18)
    - Handle pagination/infinite scroll
  - **Mark Notification as Read**: PUT `/api/notifications/{notificationId}/read`
    - Update local state optimistically
  - **Mark All as Read**: PUT `/api/notifications/read-all`
  - **Delete Notification**: DELETE `/api/notifications/{notificationId}`
  - **Handle Notification Actions**:
    - Meeting time change: Navigate to Meetings screen with pre-selected tabs
    - Meeting approved: Navigate to Meetings → Scheduled tab
    - Connection: Navigate to Connections screen
    - Reminder: Navigate to Meetings → Scheduled tab
  - **Real-time Updates**: WebSocket for new notifications, status changes
  - **Push Notifications**: Integrate with Expo Notifications for background notifications

---

## Connections Screen

### ConnectionsScreen.tsx

- **Location**: `src/screens/ConnectionsScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Connections**: GET `/api/connections`
    - Query params: `?search={query}&page={page}&limit={limit}`
    - Replace mock connections array (line 165)
    - Handle pagination
  - **Search Connections**: GET `/api/connections/search?q={query}`
    - Real-time search with debouncing
  - **Request Meeting**: Handled by RequestMeetingModal (see Modals section)
  - **Connect on LinkedIn**: Open LinkedIn profile URL (external link)
    - Track analytics for LinkedIn clicks
  - **Real-time Updates**: WebSocket for new connections, connection status changes

---

## Modals & Components

### RequestMeetingModal.tsx

- **Location**: `src/components/RequestMeetingModal.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Available Dates**: GET `/api/meetings/available-dates`
    - Replace hardcoded `availableDates` array (line 257)
    - Filter by attendee availability
  - **Fetch Available Times**: GET `/api/meetings/available-times?date={date}&attendeeId={attendeeId}`
    - Replace hardcoded `availableTimes` array (line 263)
    - Consider attendee's existing meetings
  - **Fetch Available Tables**: GET `/api/meetings/available-tables?date={date}&time={time}`
    - Replace hardcoded `availableTables` array (line 270)
    - Only for physical meetings
  - **Submit Meeting Request**: POST `/api/meetings/request`
    - Request body: `{ attendeeId, title, meetingType, date, time, tableNumber?, meetingLink?, description }`
    - Handle validation errors, conflicts, unavailable slots
    - Mark checklist item complete: `markRequestMeetingComplete()`
  - **Real-time Validation**: Check availability in real-time as user selects date/time

### LeaveFeedbackModal.tsx

- **Location**: `src/components/LeaveFeedbackModal.tsx`
- **Integration Points** (TODO comments to be added):
  - **Submit Feedback**: POST `/api/events/{eventId}/feedback`
    - Request body: `{ feedback: string }`
    - Handle validation (min/max length)
    - Show success message

### EditMeetingModal.tsx

- **Location**: `src/components/EditMeetingModal.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Meeting Details**: GET `/api/meetings/{meetingId}`
    - Pre-fill form with existing meeting data
  - **Update Meeting**: PUT `/api/meetings/{meetingId}`
    - Request body: `{ title, description, date, time, location, meetingLink }`
    - Handle validation, conflicts

### MeetingDeclineModal.tsx

- **Location**: `src/components/MeetingDeclineModal.tsx`
- **Integration Points** (TODO comments to be added):
  - **Decline Meeting**: POST `/api/meetings/{meetingId}/decline`
    - Request body: `{ reason: string }`
    - Handle validation

### MeetingCancelModal.tsx

- **Location**: `src/components/MeetingCancelModal.tsx`
- **Integration Points** (TODO comments to be added):
  - **Cancel Meeting**: POST `/api/meetings/{meetingId}/cancel`
    - Request body: `{ reason: string }`
    - Handle validation

### InboundMeetingModal.tsx & OutboundMeetingModal.tsx

- **Location**: `src/components/InboundMeetingModal.tsx`, `src/components/OutboundMeetingModal.tsx`
- **Integration Points** (TODO comments to be added):
  - **Approve Meeting**: POST `/api/meetings/{meetingId}/approve`
  - **Decline Meeting**: POST `/api/meetings/{meetingId}/decline`
  - **Reschedule Meeting**: PUT `/api/meetings/{meetingId}/reschedule`

### ScheduledMeetingModal.tsx

- **Location**: `src/components/ScheduledMeetingModal.tsx`
- **Integration Points** (TODO comments to be added):
  - **Edit Meeting**: PUT `/api/meetings/{meetingId}`
  - **Cancel Meeting**: POST `/api/meetings/{meetingId}/cancel`
  - **Reschedule Meeting**: PUT `/api/meetings/{meetingId}/reschedule`

### EventViewModal.tsx

- **Location**: `src/components/EventViewModal.tsx`
- **Integration Points** (TODO comments to be added):
  - **Add to Schedule**: POST `/api/user/schedule/events`
    - Request body: `{ eventId: string }`
  - **Remove from Schedule**: DELETE `/api/user/schedule/events/{eventId}`
  - **Fetch Event Details**: GET `/api/events/{eventId}` (if not passed as prop)

### FilterModal.tsx

- **Location**: `src/components/FilterModal.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Filter Options**: GET `/api/metadata/filters`
    - Replace hardcoded filter categories
    - Dynamic filter options based on available data

### CompanyDetailScreen.tsx

- **Location**: `src/screens/CompanyDetailScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Company Details**: GET `/api/companies/{companyId}`
    - Replace mock `companyData` object (line 64)
    - Include offers, social links, positions, team members
  - **Request Meeting**: Handled by RequestMeetingModal
  - **Redeem Offer**: POST `/api/companies/{companyId}/offers/{offerId}/redeem`
  - **View Position**: GET `/api/companies/{companyId}/positions/{positionId}`

### SpeakerDetailScreen.tsx

- **Location**: `src/screens/SpeakerDetailScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Speaker Details**: GET `/api/speakers/{speakerId}`
    - Replace mock `speakerData` object (line 54)
    - Include bio, interests, speaking sessions, LinkedIn URL
  - **Request Meeting**: Handled by RequestMeetingModal
  - **Connect on LinkedIn**: Open LinkedIn profile URL (external link)

### ExhibitorsScreen.tsx & PartnersScreen.tsx

- **Location**: `src/screens/ExhibitorsScreen.tsx`, `src/screens/PartnersScreen.tsx`
- **Integration Points** (TODO comments to be added):
  - **Fetch Exhibitors/Partners**: GET `/api/companies?type={exhibitor|partner}`
    - Query params: `?filters={encodedFilters}&page={page}&limit={limit}`
    - Replace mock arrays (line 94 in ExhibitorsScreen, line 94 in PartnersScreen)
    - Handle filtering and pagination

### ContactScreen.tsx

- **Location**: `src/screens/ContactScreen.tsx`
- **TODO Comments Added**: Lines 95-98, 127-130
- **Integration Points**:
  - **Submit Contact Form**: POST `/api/contact`
    - Request body: `{ name, email, topic?, message }`
    - Handle validation, rate limiting
    - Send confirmation email
  - **Email Support**: Open email client or copy email to clipboard

### SpeakersScreen.tsx

- **Location**: `src/screens/SpeakersScreen.tsx`
- **TODO Comments Added**: Lines 93-99, 80-85
- **Integration Points**:
  - **Fetch Speakers**: GET `/api/speakers`
    - Query params: `?filters={encodedFilters}&page={page}&limit={limit}`
    - Replace mock speakers array (line 94)
    - Handle filtering and pagination
  - **Filter Speakers**: GET `/api/speakers?filters={encodedFilters}`

### ProfileScreen.tsx

- **Location**: `src/screens/ProfileScreen.tsx`
- **TODO Comments Added**: Lines 804-857 (Personal), 1249-1297 (Attendee), 1690-1779 (Company)
- **Integration Points**:
  - **Fetch User Profile**: GET `/api/user/profile`
    - Pre-fill all form fields with existing data
  - **Update Personal Profile**: PUT `/api/user/profile/personal`
  - **Update Attendee Profile**: PUT `/api/user/profile/attendee`
  - **Update Company Profile**: PUT `/api/user/profile/company`
  - All same endpoints as CompleteProfileScreen but with PUT methods

### EventDetailsScreen.tsx

- **Location**: `src/screens/EventDetailsScreen.tsx`
- **TODO Comments Added**: Lines 7-13
- **Integration Points**:
  - **Fetch Event Details**: GET `/api/events/{eventId}`
    - Replace placeholder with full event details
    - Display event information, speakers, description
  - **Add to Schedule**: POST `/api/user/schedule/events`
  - **Leave Feedback**: POST `/api/events/{eventId}/feedback`

### TicketScreen.tsx

- **Location**: `src/screens/TicketScreen.tsx`
- **TODO Comments Added**: Lines 7-13
- **Integration Points**:
  - **Fetch Ticket Details**: GET `/api/tickets/{ticketId}`
    - Replace placeholder with full ticket details
    - Display ticket information, QR code, assignment details
  - **Ticket Actions**: Transfer, assign, revoke, download, share

### SearchScreen.tsx

- **Location**: `src/screens/SearchScreen.tsx`
- **TODO Comments Added**: Lines 4-9
- **Integration Points**:
  - **Global Search**: GET `/api/search?q={query}&type={type}`
    - Search across attendees, events, speakers, companies
    - Display results by category

### FavoritesScreen.tsx

- **Location**: `src/screens/FavoritesScreen.tsx`
- **TODO Comments Added**: Lines 4-9
- **Integration Points**:
  - **Get Favorites**: GET `/api/user/favorites`
  - **Add Favorite**: POST `/api/user/favorites`
  - **Remove Favorite**: DELETE `/api/user/favorites/{favoriteId}`
  - Support favorites for events, speakers, companies, attendees

### Menu.tsx

- **Location**: `src/components/Menu.tsx`
- **TODO Comments Added**: Lines 136-147
- **Integration Points**:
  - **Fetch User Data**: Use `useAuth()` hook to get user data
    - Display user.name instead of hardcoded "John Doe"
    - Display user.email instead of hardcoded email
    - Display user.userType instead of hardcoded "Attendee"

### api.ts (Service File)

- **Location**: `src/services/api.ts`
- **TODO Comments Added**: Complete file
- **Integration Points**:
  - **Create API Client**: Set up axios or fetch wrapper
    - Base URL configuration
    - Request/response interceptors
    - Token management
    - Error handling
    - Retry logic
    - Request cancellation

---

## Context & State Management

### ChecklistContext.tsx

- **Location**: `src/context/ChecklistContext.tsx`
- **TODO Comments Added**: Lines 1-3, 18-30, 24-43
- **Integration Points**:
  - **Persist Checklist State**: Store in AsyncStorage
    - Keys: `@spark:checklist_connect_attendees`, `@spark:checklist_request_meeting`, `@spark:checklist_add_sessions`
  - **Sync with Backend**: PATCH `/api/user/checklist`
    - Request body: `{ connectAttendees?: boolean, requestMeeting?: boolean, addSessions?: boolean }`
    - Optional: Sync completion status with backend
  - **Load from Backend**: GET `/api/user/checklist` on app start
    - Initialize state from backend if available

---

## Navigation

### AppNavigator.tsx

- **Location**: `src/navigation/AppNavigator.tsx`
- **Integration Points** (TODO comments to be added):
  - **Auth State Management**: Already handled by AuthContext
  - **Deep Linking**: Handle deep links for notifications, meetings, events
    - Example: `spark://meetings?primaryTab=scheduled&secondaryTab=outbound`
  - **Navigation Guards**: Protect routes based on authentication and profile completion

---

## General Backend Integration Requirements

### API Client Setup

- **Create API Client**: `src/services/api.ts` or `src/utils/api.ts`
  - Base URL configuration
  - Request/response interceptors
  - Token management (attach to requests, handle refresh)
  - Error handling (network errors, server errors, validation errors)
  - Retry logic for failed requests
  - Request cancellation

### Real-time Updates

- **WebSocket Integration**: For real-time updates
  - Notifications
  - Meeting status changes
  - Ticket updates
  - Event changes
  - Connection requests
- **Polling Fallback**: If WebSocket unavailable, use polling
  - Poll intervals: 30s for notifications, 60s for meetings

### State Management

- **Consider Redux/Context API**: For global state management
  - User profile
  - Notifications
  - Meetings
  - Events/Schedule
  - Connections
  - Tickets

### Error Handling

- **Network Errors**: Show user-friendly messages
- **Validation Errors**: Display field-specific errors
- **Server Errors**: Log and show generic error message
- **Offline Handling**: Cache data, queue requests when offline

### Loading States

- **Skeleton Loaders**: Show while fetching data
- **Optimistic Updates**: Update UI immediately, rollback on error
- **Pagination**: Implement infinite scroll or "Load More" buttons

### Caching Strategy

- **Cache API Responses**: Use React Query or similar
- **Cache Invalidation**: Invalidate on mutations
- **Offline Support**: Cache critical data for offline access

### Analytics

- **Track User Actions**: Screen views, button clicks, form submissions
- **Track Errors**: Log errors to analytics service
- **Track Performance**: API response times, screen load times

---

## Priority Order for Backend Integration

### Phase 1: Critical (Authentication & Core Features)

1. Authentication flow (Login, Verification, Profile Completion)
2. User profile management
3. Attendees list and search
4. Meeting requests and management
5. Notifications

### Phase 2: Important (Event Features)

6. Schedule/Events
7. QR/Tickets
8. Connections
9. Company/Speaker profiles

### Phase 3: Nice to Have (Enhancements)

10. Real-time updates (WebSocket)
11. Advanced filtering
12. Analytics integration
13. Offline support

---

## Notes

- All TODO comments in code files reference this document
- Mock data should be replaced systematically, starting with Phase 1
- Test each integration point thoroughly before moving to next
- Consider API rate limiting and implement appropriate caching
- Implement proper error boundaries and fallback UI
- Add loading states for all async operations
- Implement proper TypeScript types for all API responses
