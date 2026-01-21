# Multilingual Support & Annual Leave Management

This document describes the new features added to the Open Attendance system.

## New Features

### 1. Multilingual Support (Korean/English)

The application now supports both Korean and English languages with seamless switching.

#### Implementation Details:
- **i18n Framework**: next-intl
- **Supported Languages**: English (en), Korean (ko)
- **Translation Files**: Located in `/messages/` directory
  - `en.json` - English translations
  - `ko.json` - Korean translations

#### How to Use:
- Language switcher is available in the header (top right, next to user profile)
- Click "EN" or "KO" to switch languages
- Language preference is stored in cookies and persists across sessions

#### Translated Components:
- Navigation menu (Sidebar)
- Dashboard
- Early Leave/Absence page
- Annual Leave page
- All form labels, buttons, and status messages

### 2. Refactored Leave Requests → Early Leave/Absence

The "Leave Requests" feature has been refactored to specifically handle mid-workday departures and absences.

#### Changes:
- **New Name**: "Early Leave/Absence" (조퇴/결근)
- **Purpose**: For employees who need to leave early during work hours or request absence due to:
  - Sick leave (병가)
  - Official leave (공가)
  - Other reasons (기타)
- **Removed**: "ANNUAL" leave type (moved to dedicated Annual Leave feature)

#### Usage:
- Navigate to "Early Leave/Absence" in the sidebar
- Select leave type (SICK, OFFICIAL, or OTHER)
- Choose start and end dates
- Provide a reason
- Submit for approval

### 3. Annual Leave Management

A new comprehensive feature for managing annual leave (연차).

#### Features:
- **Leave Balance Dashboard**:
  - Total annual leave days
  - Used days
  - Remaining days
- **Annual Leave Requests**:
  - Request specific date ranges
  - Automatic calculation of leave days
  - Validation against remaining balance
- **Request History**:
  - View all annual leave requests
  - Track status (PENDING, APPROVED, REJECTED)

#### API Endpoints:
- `GET /api/annual-leave` - Get all annual leave requests
- `POST /api/annual-leave` - Create new annual leave request
- `GET /api/annual-leave/balance` - Get user's leave balance

#### Database Schema:
- Uses existing `LeaveRequest` table with `type: "ANNUAL"`
- Tracks leave balance in `User` table:
  - `totalLeaves`: Total annual leave (default: 15 days)
  - `usedLeaves`: Used annual leave days

#### Navigation:
- Access via sidebar: "Annual Leave" (연차 관리)
- Located at `/dashboard/annual-leave`

## Technical Implementation

### Configuration Files Updated:
1. **next.config.ts** - Added next-intl plugin
2. **app/layout.tsx** - Wrapped with NextIntlClientProvider
3. **lib/i18n.ts** - i18n configuration

### New Files Created:
- `/messages/en.json` - English translations
- `/messages/ko.json` - Korean translations
- `/components/dashboard/language-switcher.tsx` - Language switcher component
- `/app/dashboard/annual-leave/page.tsx` - Annual leave management page
- `/app/api/annual-leave/route.ts` - Annual leave API endpoints
- `/app/api/annual-leave/balance/route.ts` - Leave balance API

### Updated Components:
- `components/dashboard/header.tsx` - Added language switcher
- `components/dashboard/sidebar.tsx` - Updated with translations and new Annual Leave link
- `app/dashboard/page.tsx` - Added translations
- `app/dashboard/leaves/page.tsx` - Refactored for early leave/absence with translations

## Development

### Running the Application:
```bash
npm install
npm run dev
```

### Environment Variables Required:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### Building for Production:
```bash
npm run build
npm start
```

## Future Enhancements

Potential improvements for the annual leave system:
1. Admin approval workflow
2. Email notifications for leave requests
3. Calendar view of team leaves
4. Korean labor law compliance features:
   - Automatic annual leave calculation based on tenure
   - Public holiday management
   - Fiscal year vs. hire date based calculations
5. Leave carry-over policy management
6. Slack integration for leave requests

## Compliance Notes

The system is designed to support Korean labor law requirements:
- Default 15 days annual leave
- Tracks used and remaining leave
- Prevents over-booking of leave days
- Maintains join date for tenure-based calculations

For specific compliance requirements, consult with legal advisors and adjust the leave calculation logic in the codebase accordingly.
