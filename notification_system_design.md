## Stage 1
First we have notifications_app_be folder which uses the GET method to get data from the http://20.207.122.201/evaluation-service/notifications endpoint. Then we use the notification_priority.cpp to ge the top 5 notifications.

Stage 1: 
* Create notification
* Fetch notifications
* Mark as read
* Delete notification
* Real-Time message

REST API Endpoints:
GET `/api/notifications`
POST `/api/notifications`
GET `/api/notifications/:id`
PATCH `/api/notifications/:id/read`
DELETE `/api/notifications/:id`

## Stage 2: 
I would choose PostgreSQL as the database for the notification system as the data is structured and relational. It also has Solid ACID compliance.JSON is supported for flexible metadata and is proven to handle high loads of data.

I would use the following schema for the notifications table:

```sql
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE students (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    message           TEXT NOT NULL,
    notification_type notification_type NOT NULL,
    is_read           BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW()
);
```
A few queries I would implement:
* GET /api/notifications/:id
```SELECT * FROM notifications WHERE id = $var AND student_id = $var;```
* GET /api/notifications
```SELECT * FROM notifications
WHERE student_id = $var
ORDER BY created_at DESC
LIMIT 20;
```
* PATCH /api/notifications/:id/read
```UPDATE notifications SET is_read = TRUE WHERE id = $var AND student_id = $var;```
* DELETE /api/notifications/:id
```DELETE FROM notifications WHERE id = $var AND student_id = $var;```
* POST /api/notifications
```
INSERT INTO notifications (student_id, notification_type, message)
VALUES ($var1, $var2, $var3)
RETURNING *;
```


## Stage 3: 


### Query Analysis

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```
Yes this query is accurate.

This is slow as this does a full database scan to find all notifications for the student, then filters for unread, and finally sorts by createdAt due to which it is really slow.

No, not necessarily as there will be a write overhead for every new notification and it will fill up the space of the database.

### Placement Notifications in Last 7 Days

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```

## Stage 4:
I would mostl use HTTP Caching Headers:

```
Cache-Control: private, max-age=30
ETag: "hash-of-response"
```

Browser gets the response from cache for 30 seconds, reducing latency and server load. If the data changes, the ETag changes, ensuring users see fresh notifications.

* Pros: Zero server load on cache hit and no infrastructure needed .
* Cons: Data can be stale for up to 30 seconds, and cache invalidation can be complex.

## Stage 5:
Problems with the given Queary:
* Again it is scanning the entire table so really slow repsonse time .
* There is no error recovery .

Should DB Save and Email Happen Together?: No as saving to the db is fast and reliable, while sending the mail is slow an not so reliable. Therefore we have to save them seperately.