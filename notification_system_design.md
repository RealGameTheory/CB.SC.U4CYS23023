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