# Inbox & Notifications System

This document provides details on the new inbox system that displays application status notifications for projects.

## Overview

The inbox page displays notifications for users, particularly focusing on project application status updates (accepted/rejected). It includes:

- A dedicated Inbox page accessible from the navigation bar
- Notification badge showing unread notification count
- Timeline view of all notifications with appropriate icons
- Ability to view associated projects directly from notifications

## Backend Changes

1. **New Models**:
   - `Notification`: Stores user notifications with message, type, and reference to related entities

2. **New API Endpoints**:
   - `/notifications/me`: Get current user's notifications
   - `/notifications/mark-read/{notification_id}`: Mark a notification as read
   - `/notifications/mark-all-read`: Mark all notifications as read

3. **Automatic Notification Creation**:
   - When a project owner accepts an application, a notification is created for the applicant
   - When a project owner rejects an application, a notification is created for the applicant
   - Limit-exceeded auto-rejections also create notifications

## Frontend Changes

1. **New Components**:
   - `InboxPage.jsx`: Displays all notifications for the current user
   - Badge indicator in the navigation bar showing unread notification count

2. **Navigation**:
   - Added Inbox link in the main navigation
   - Clicking on "View" in a notification navigates to the related project

## Testing the Functionality

To test the new inbox functionality:

1. **Run the migration script**:
   ```
   cd connectin-backend
   python migrations/add_notifications_table.py
   ```

2. **Create test notifications**:
   - Create a project with one account
   - Apply to that project with another account
   - Accept or reject the application with the project owner account
   - Check the inbox of the applicant account to see notifications

3. **Test notification marking**:
   - Navigate to the inbox
   - Notifications are initially shown as unread
   - View notification details (implementation pending)
   - Verify notification count badge updates correctly

## Future Enhancements

Potential improvements for the notifications system:

1. Real-time notifications using WebSockets
2. Email notifications for important updates
3. Additional notification types (new messages, invitations, etc.)
4. More detailed notification filtering and sorting
5. Better notification management (bulk actions, etc.) 