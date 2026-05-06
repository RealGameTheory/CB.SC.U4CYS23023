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
INSERT INTO notifications (student_id, message)
VALUES ($var1, $var2)
RETURNING *;
```