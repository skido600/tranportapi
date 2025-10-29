import {
  DriverAcceptTrip,
  DriverRejectTrip,
  TripsLogic,
  GetallTripClient,
  GetallTripDriver,
  GetPendingTripsForDriver,
  UpdateDriverLocation,
  GetDriverLocationByTracking,
  MarkTripDone,
} from "../controllers/Tripcontroller.ts";
import express from "express";
import type { Router } from "express";

import { allowRoles, verifyToken } from "../middlewares/verifyAccessToken.ts";

const tripRoute: Router = express.Router();

tripRoute.post("/trips", verifyToken, TripsLogic);
tripRoute.get("/trips/accept/:tripId", verifyToken, DriverAcceptTrip);
tripRoute.get("/all_request", verifyToken, GetPendingTripsForDriver);
tripRoute.get("/trips/reject/:tripId", verifyToken, DriverRejectTrip);
tripRoute.get(
  "/all_trip/driver",
  verifyToken,
  allowRoles("driver"),
  GetallTripDriver
);
tripRoute.get("/all_trip/driver", verifyToken, allowRoles("driver"));
tripRoute.put(
  "/trip/location",
  verifyToken,
  allowRoles("driver"),
  UpdateDriverLocation
);
tripRoute.post(
  "/trip/track",
  verifyToken,
  allowRoles("client"),
  GetDriverLocationByTracking
);
tripRoute.post("/trip/done", verifyToken, allowRoles("client"), MarkTripDone);
tripRoute.get(
  "/all_trip/client",
  verifyToken,
  allowRoles("client"),

  GetallTripClient
);
export default tripRoute;
