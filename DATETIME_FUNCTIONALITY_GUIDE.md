# Competition DateTime Functionality Guide

## Overview

The competition creation and editing system now supports precise date and time selection with automatic conversion to Oman Standard Time (GMT+4). This ensures all competition deadlines are consistent and properly handled across different user timezones.

## Features

### 1. **Separate Date and Time Inputs**
- **Date Fields**: Standard date picker (YYYY-MM-DD format)
- **Time Fields**: 24-hour time picker (HH:MM format)
- **Timezone**: All times are automatically converted to Oman Standard Time (GMT+4)

### 2. **Competition Dates & Times**
- **Start Date & Time**: When the competition begins
- **Submission End Date & Time**: Deadline for photo submissions
- **Voting End Date & Time**: Deadline for voting

### 3. **Default Behavior**
- If no time is specified, it defaults to **midnight (00:00)** in Oman timezone
- All existing competitions will continue to work with their current end times
- New competitions can specify exact times for better control

## Pages Updated

### 1. **Create Competition** (`/admin/competitions/create`)
- Added time input fields for all three dates
- Updated form validation to handle date/time combinations
- Automatic timezone conversion to Oman time

### 2. **Edit Competition** (`/admin/competitions/[id]/edit`)
- Added time input fields for all three dates
- Extracts existing time from stored dates
- Preserves existing functionality while adding time precision

## Technical Implementation

### Date/Time Handling Functions

#### `combineDateTimeOman(dateString, timeString)`
- Combines separate date and time inputs
- Converts to Oman timezone (GMT+4)
- Returns ISO string for database storage

#### `extractTimeFromISO(dateString)`
- Extracts time component from existing ISO date strings
- Used when loading existing competitions for editing
- Returns time in HH:MM format

### Timezone Conversion
```javascript
// Oman is GMT+4
const omanOffset = 4 * 60; // 240 minutes
const localOffset = localDate.getTimezoneOffset();
const offsetDifference = omanOffset + localOffset;
const omanDate = new Date(localDate.getTime() - (offsetDifference * 60 * 1000));
```

## User Interface

### Form Layout
- **Date fields**: 2 columns width
- **Time fields**: 1 column width  
- **Labels**: Clear indication of Oman timezone
- **Help text**: Explains default midnight behavior

### Example Layout:
```
[Start Date        ] [Time]
[Submission End    ] [Time]  
[Voting End        ] [Time]
```

## Email Reminders Integration

The competition reminder system has been updated to ensure all competitions show **midnight (12:00 AM)** as the end time in emails, maintaining consistency with the new datetime functionality.

### Updated Behavior:
- Test emails now show proper midnight times
- Real competition emails use corrected midnight times
- All times displayed in Oman timezone in email templates

## Database Storage

- Dates are stored as ISO strings in UTC
- Conversion happens at the application layer
- Existing competitions remain compatible
- New competitions store precise datetime information

## Benefits

1. **Precision**: Exact control over competition timing
2. **Consistency**: All times in Oman timezone
3. **Flexibility**: Can set competitions to start/end at any time
4. **User-Friendly**: Clear separation of date and time inputs
5. **Backward Compatible**: Existing competitions continue to work

## Usage Examples

### Setting a Competition to End at 6 PM Oman Time:
- **Date**: 2025-02-15
- **Time**: 18:00
- **Result**: Competition ends at 6:00 PM Oman time on February 15, 2025

### Default Midnight Behavior:
- **Date**: 2025-02-15
- **Time**: (empty)
- **Result**: Competition ends at 12:00 AM (midnight) Oman time on February 15, 2025

## Testing

The functionality has been tested with:
- ✅ Competition creation with custom times
- ✅ Competition editing with time extraction
- ✅ Email reminders showing correct times
- ✅ Timezone conversion accuracy
- ✅ Default midnight behavior

## Future Enhancements

Potential improvements for future versions:
- Visual timezone indicator
- Time zone selection dropdown
- Preset time options (e.g., "End of Day", "6 PM", etc.)
- Calendar view for competition scheduling 