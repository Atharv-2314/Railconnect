SET session_replication_role = 'replica';

TRUNCATE TABLE 
seat_allocation,
ticket_passenger,
payment,
cancellation,
carbon_log,
waitlist_queue,
ticket,
seat,
schedule,
route_station,
route,
train,
station,
passenger,
app_user
RESTART IDENTITY CASCADE;

SET session_replication_role = 'origin';
