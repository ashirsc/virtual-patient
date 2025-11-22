# Anonymous Session Claiming - Testing Guide

This document explains how to test the anonymous session claiming feature that allows users to start conversations as guests and then claim them after logging in.

## Feature Overview

Users can now:
1. Start chatting with a patient actor without logging in (anonymous mode)
2. Their conversation is automatically saved to the database
3. When they log in, the conversation is claimed and associated with their account
4. They can then submit the conversation to an instructor for grading

## Implementation Details

### Database
- `ChatSession.userId` is nullable, allowing anonymous sessions (`userId = null`)
- Anonymous sessions are stored in the database from the first message
- Session claiming updates the `userId` from `null` to the authenticated user's ID

### Client-Side
- Session ID is stored in `localStorage` using key `chat-session-{patientId}`
- Both authenticated and anonymous users see "Saving..." and "Saved" indicators
- Login prompt appears after 3 message exchanges (6 messages total)
- Session claiming happens automatically when authentication state changes from `false` to `true`

### Server Actions
New functions in `lib/actions/sessions.ts`:
- `createAnonymousChatSession(patientActorId)` - Creates session with `userId: null`
- `updateAnonymousChatSession(sessionId, messages)` - Updates anonymous session
- `claimChatSession(sessionId)` - Claims anonymous session for authenticated user
- `getUnclaimedSessionById(sessionId)` - Fetches unclaimed session
- `cleanupAbandonedSessions()` - Deletes anonymous sessions older than 7 days

## Testing Instructions

### Test 1: Anonymous Chat Session Creation

1. **Open browser in incognito/private mode** (to ensure no existing session)
   - Navigate to: `http://localhost:3000`
   
2. **Find a public patient actor**
   - Look for patient cards on the dashboard
   - Click "Start Chat" on any public patient

3. **Send messages as anonymous user**
   - Send at least 3-4 messages to the patient
   - Observe the "Saving..." and "Saved" indicators appear
   - The conversation should auto-save to the database

4. **Verify in database** (optional)
   ```sql
   SELECT id, userId, patientActorId, messageCount, startedAt, lastMessageAt
   FROM "chat_session"
   WHERE userId IS NULL
   ORDER BY startedAt DESC
   LIMIT 5;
   ```
   - You should see a session with `userId = null`

5. **Check localStorage**
   - Open browser DevTools (F12) → Application/Storage → Local Storage
   - Look for key like `chat-session-{patientId}`
   - It should contain the session ID

### Test 2: Session Claiming on Login

1. **Continue from Test 1** (with messages already sent)
   - After sending 6+ messages, you should see a login prompt
   - Click "Sign In"

2. **Login with existing account**
   - Use your student account credentials
   - Or create a new account via signup

3. **Verify session claiming**
   - You should see a success toast: "Your conversation has been saved to your account!"
   - The chat should continue seamlessly - all previous messages should still be visible
   - The "Saved" indicator should still appear

4. **Verify in database** (optional)
   ```sql
   SELECT id, userId, patientActorId, messageCount
   FROM "chat_session"
   WHERE id = 'your-session-id'
   ```
   - The same session ID should now have a `userId` (not null)

### Test 3: Submit for Grading

1. **Continue from Test 2** (now logged in with claimed session)
   - Send more messages until you have 10+ total messages
   - A "Submit for Grading" button should appear in the header

2. **Submit to instructor**
   - Click "Submit for Grading"
   - Select an instructor from the dropdown
   - Click "Submit"
   - You should see "Session submitted successfully!"

3. **Verify in database** (optional)
   ```sql
   SELECT ss.id, ss.chatSessionId, ss.instructorId, ss.status, ss.submittedAt
   FROM "submitted_session" ss
   JOIN "chat_session" cs ON ss.chatSessionId = cs.id
   WHERE cs.userId = 'your-user-id'
   ORDER BY ss.submittedAt DESC
   LIMIT 5;
   ```
   - Should see a new submission record

### Test 4: Edge Cases

#### 4.1 User Already Logged In
1. Login first, then start a chat
2. Session should be created with `userId` set immediately
3. No claiming needed

#### 4.2 Session Already Claimed
1. Try to claim a session that's already claimed by another user
2. Should gracefully fail with an error message
3. A new session should be created instead

#### 4.3 Multiple Tabs
1. Open same patient chat in two browser tabs (anonymous)
2. Send messages in both tabs
3. Only the last tab's session ID will be in localStorage
4. On login, only the last session will be claimed

#### 4.4 Clear localStorage
1. Start anonymous chat
2. Clear browser localStorage before logging in
3. Session remains in database but can't be claimed
4. New session will be created on login
5. Old session will be cleaned up after 7 days

### Test 5: Cleanup Job

1. **Create test data**
   ```sql
   -- Insert old anonymous session
   INSERT INTO "chat_session" (id, "userId", "patientActorId", messages, "messageCount", "startedAt", "lastMessageAt")
   VALUES ('test-old-session', NULL, 'any-patient-id', '[]', 0, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');
   ```

2. **Set CRON_SECRET in .env.local**
   ```
   CRON_SECRET=test-secret-123
   ```

3. **Test the cleanup endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/cleanup \
     -H "Authorization: Bearer test-secret-123"
   ```

4. **Verify response**
   ```json
   {
     "success": true,
     "deletedCount": 1,
     "message": "Successfully cleaned up 1 abandoned sessions"
   }
   ```

5. **Check health endpoint** (no auth required)
   ```bash
   curl http://localhost:3000/api/cleanup
   ```

## Expected Behaviors

### Save Indicators
- **Anonymous users**: See "Saving..." and "Saved" indicators
- **Authenticated users**: See "Saving..." and "Saved" indicators
- Both use the same visual indicators

### Login Prompt
- Appears after 6 messages (3 exchanges)
- Can be dismissed with X button
- Persists on page but can be closed

### Session Claiming
- Happens automatically on login
- Shows success toast notification
- Previous messages remain visible
- No interruption to chat flow

### Submit Button
- Only appears for authenticated users
- Requires 10+ messages
- Only appears if `isTestMode` is false

## Troubleshooting

### Session Not Claimed
- Check browser console for errors
- Verify session ID exists in localStorage
- Verify session exists in database with `userId = null`
- Check authentication state in DevTools

### Messages Not Saving
- Check browser console for errors
- Verify database connection
- Check that patient actor exists and is public
- Verify no linter errors in `sessions.ts`

### Cleanup Not Working
- Verify `CRON_SECRET` is set in environment
- Check Authorization header format: `Bearer {secret}`
- Verify date calculation (7 days)
- Check database permissions

## Database Queries for Debugging

### View All Anonymous Sessions
```sql
SELECT id, patientActorId, messageCount, startedAt, lastMessageAt
FROM "chat_session"
WHERE userId IS NULL
ORDER BY lastMessageAt DESC;
```

### View Recent Claimed Sessions
```sql
SELECT cs.id, cs.userId, u.email, cs.messageCount, cs.startedAt
FROM "chat_session" cs
JOIN "user" u ON cs.userId = u.id
WHERE cs.startedAt > NOW() - INTERVAL '1 day'
ORDER BY cs.startedAt DESC;
```

### View All Submissions
```sql
SELECT ss.id, u.email as student_email, i.email as instructor_email, ss.status, ss.submittedAt
FROM "submitted_session" ss
JOIN "chat_session" cs ON ss.chatSessionId = cs.id
LEFT JOIN "user" u ON cs.userId = u.id
JOIN "user" i ON ss.instructorId = i.id
ORDER BY ss.submittedAt DESC;
```

### Count Anonymous Sessions by Age
```sql
SELECT 
  CASE 
    WHEN lastMessageAt > NOW() - INTERVAL '1 day' THEN '< 1 day'
    WHEN lastMessageAt > NOW() - INTERVAL '7 days' THEN '1-7 days'
    ELSE '> 7 days'
  END as age,
  COUNT(*) as count
FROM "chat_session"
WHERE userId IS NULL
GROUP BY age;
```

## Production Deployment

### Cron Job Setup
For production, set up a scheduled task to run the cleanup job:

**Using cron (Linux/Mac)**:
```bash
# Add to crontab (run daily at 2 AM)
0 2 * * * curl -X POST https://your-domain.com/api/cleanup -H "Authorization: Bearer your-secret"
```

**Using Vercel Cron**:
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cleanup",
    "schedule": "0 2 * * *"
  }]
}
```

**Using GitHub Actions**:
Create `.github/workflows/cleanup.yml`:
```yaml
name: Cleanup Abandoned Sessions
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call cleanup endpoint
        run: |
          curl -X POST https://your-domain.com/api/cleanup \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Environment Variables
Ensure these are set in production:
- `CRON_SECRET` - Random secure string for cleanup endpoint
- All database connection strings
- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
- `GOOGLE_GENERATIVE_AI_API_KEY`

## Success Criteria

✅ Anonymous users can start chatting without login  
✅ Messages are saved to database in real-time  
✅ Login prompt appears after 3 exchanges  
✅ Session is claimed automatically on login  
✅ Success toast appears on claim  
✅ All previous messages are preserved  
✅ User can submit claimed session to instructor  
✅ Old anonymous sessions are cleaned up after 7 days  
✅ Edge cases are handled gracefully  

## Files Modified

1. `lib/actions/sessions.ts` - Added anonymous session functions
2. `components/chat-interface.tsx` - Added localStorage and claiming logic
3. `app/api/cleanup/route.ts` - Created cleanup endpoint
4. `env.example` - Added CRON_SECRET documentation

