# Attendees Card View - Frontend Flow with Backend Integration

## Overview
The card view displays attendees in a Tinder-style swipeable stack. Users can swipe left (skip) or right (connect) through attendees.

## Frontend Flow Architecture

### 1. **Data Loading Strategy**

#### Initial Load
```
User opens Attendees Screen
  ↓
Fetch first batch from backend (e.g., 20-30 attendees)
  ↓
Store in state: `allAttendees` array
  ↓
Filter for "Recommended" tab (backend provides or frontend filters)
  ↓
Display first 5 cards in stack
```

#### Pagination / Infinite Scroll
```
User swipes through cards
  ↓
When currentCardIndex reaches ~70% of loaded data
  ↓
Trigger: Fetch next batch from backend
  ↓
Append to existing `allAttendees` array
  ↓
Continue showing cards seamlessly
```

### 2. **State Management**

```typescript
// Main state variables needed:
const [allAttendees, setAllAttendees] = useState<Attendee[]>([]);
const [recommendedAttendees, setRecommendedAttendees] = useState<Attendee[]>([]);
const [currentCardIndex, setCurrentCardIndex] = useState(0);
const [isLoading, setIsLoading] = useState(false);
const [hasMore, setHasMore] = useState(true);
const [swipedAttendees, setSwipedAttendees] = useState<Set<string>>(new Set());
```

### 3. **Card Display Logic**

**Key Point:** Only 5 cards are rendered at a time, but the data array can contain hundreds/thousands of attendees.

```typescript
// Current implementation shows:
displayedAttendees.slice(currentCardIndex, currentCardIndex + 5)

// This means:
// - Card 0: displayedAttendees[0] (top card, fully visible)
// - Card 1: displayedAttendees[1] (behind, slightly smaller)
// - Card 2: displayedAttendees[2] (behind, smaller)
// - Card 3: displayedAttendees[3] (behind, smaller)
// - Card 4: displayedAttendees[4] (behind, smallest)
```

**When user swipes:**
- Card 0 animates off-screen
- `currentCardIndex` increments: `0 → 1`
- Card 1 becomes the new top card
- Card 5 (displayedAttendees[5]) appears at the back
- If no more cards, fetch next batch

### 4. **Backend API Integration Flow**

#### Recommended Tab Flow
```
1. On screen mount / tab switch:
   GET /api/attendees/recommended?page=1&limit=20
   
2. Response:
   {
     attendees: [...],
     hasMore: true,
     nextPage: 2
   }
   
3. Store in state:
   setRecommendedAttendees(response.attendees)
   setAllAttendees(response.attendees) // or separate
```

#### All Attendees Tab Flow
```
1. On tab switch:
   GET /api/attendees?page=1&limit=20&filters={...}
   
2. Response: Same structure
   
3. Store in state:
   setAllAttendees(response.attendees)
```

### 5. **Swipe Action Flow**

#### Swipe Right (Connect/Accept)
```
User swipes card right
  ↓
handleAccept() called
  ↓
POST /api/attendees/{attendeeId}/connect
  {
    action: "connect",
    attendeeId: "123"
  }
  ↓
Backend:
  - Creates connection request
  - Marks attendee as "connected" for this user
  - Returns success
  ↓
Frontend:
  - Add to swipedAttendees Set
  - Increment currentCardIndex
  - Show next card
  - Optionally: Show success toast
```

#### Swipe Left (Skip/Reject)
```
User swipes card left
  ↓
handleReject() called
  ↓
POST /api/attendees/{attendeeId}/skip
  {
    action: "skip",
    attendeeId: "123"
  }
  ↓
Backend:
  - Marks attendee as "skipped" for this user
  - Won't show again in recommendations
  - Returns success
  ↓
Frontend:
  - Add to swipedAttendees Set
  - Increment currentCardIndex
  - Show next card
```

### 6. **Data Filtering & Exclusions**

**Important:** Backend should exclude:
- Already connected attendees
- Already skipped attendees (for Recommended tab)
- Current user's own profile
- Blocked users

**Frontend can also filter:**
```typescript
const filteredAttendees = allAttendees.filter(
  attendee => !swipedAttendees.has(attendee.id)
);
```

### 7. **Pagination Trigger**

```typescript
useEffect(() => {
  // When user is 70% through loaded cards, fetch more
  const threshold = Math.floor(allAttendees.length * 0.7);
  
  if (currentCardIndex >= threshold && hasMore && !isLoading) {
    fetchNextBatch();
  }
}, [currentCardIndex, allAttendees.length]);

const fetchNextBatch = async () => {
  setIsLoading(true);
  const nextPage = Math.floor(allAttendees.length / 20) + 1;
  
  const response = await fetch(`/api/attendees?page=${nextPage}&limit=20`);
  const data = await response.json();
  
  setAllAttendees(prev => [...prev, ...data.attendees]);
  setHasMore(data.hasMore);
  setIsLoading(false);
};
```

### 8. **Complete User Journey**

```
1. User opens Attendees Screen
   → Shows "Recommended" tab by default
   → Fetches first 20 recommended attendees
   → Displays first 5 in stack

2. User swipes through cards
   → Swipes right on 3 cards (connects)
   → Swipes left on 2 cards (skips)
   → currentCardIndex = 5
   → Shows cards 5-9 in stack

3. User continues swiping
   → Reaches card 14 (70% of 20)
   → Triggers fetch for next batch
   → Loads 20 more attendees
   → Total: 40 attendees in array
   → User continues seamlessly

4. User switches to "All attendees" tab
   → Resets currentCardIndex to 0
   → Fetches all attendees (paginated)
   → Shows first 5 cards

5. User swipes through all attendees
   → Eventually reaches end
   → Shows "No more attendees" message
   → Option to refresh or change filters
```

## Key Implementation Points

### ✅ What's Already Working
- Card stack rendering (5 cards visible)
- Swipe gestures (left/right)
- Card animations and overlays
- Index tracking (`currentCardIndex`)
- Tab switching (Recommended/All)

### 🔄 What Needs Backend Integration
1. **Replace mock data** with API calls
2. **Add pagination** logic (fetch more when near end)
3. **Implement swipe actions** (POST to backend)
4. **Handle loading states** (show spinner while fetching)
5. **Track swiped attendees** (prevent showing again)
6. **Error handling** (network errors, API failures)

### 📊 Data Structure

```typescript
interface Attendee {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  tags?: string[];
  bio?: string;
  interests?: string[];
  // Backend might add:
  isConnected?: boolean;
  connectionStatus?: "pending" | "accepted" | "none";
}
```

## Summary

**Answer to your question:**
- **Only 5 cards are rendered at a time** (for performance)
- **But ALL attendees from backend are stored in state** (as user swipes, more are loaded)
- **User sees the entire attendee list** (just 5 at a time in the stack)
- **Backend handles filtering** (excludes already connected/skipped)
- **Frontend handles pagination** (loads more as user progresses)

This approach ensures:
- ✅ Smooth performance (only 5 DOM elements)
- ✅ Infinite scrolling experience
- ✅ All attendees accessible
- ✅ Efficient memory usage
- ✅ Seamless user experience

