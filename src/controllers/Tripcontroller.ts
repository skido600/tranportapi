import type { Request, Response, NextFunction } from "express";

import { HandleResponse } from "../utils/Response.ts";
import { v4 as uuidv4 } from "uuid";
import { TripsValidate } from "../validators/validation.ts";
import { config } from "dotenv";
import BookingHistorysave from "../models/BookinHistoryschema.ts";
import Driver from "../models/DriverModel.ts";
import { MailService } from "../utils/sendEmails.ts";
import Trips from "../models/Trips";
import Auth from "../models/usermodel.ts";
const mailService = new MailService();
config();
export async function TripsLogic(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return HandleResponse(res, false, 400, "You must be authenticated");
    }
    const { driverId, pickup, destination, price, tripDate } = req.body;
    const { error } = TripsValidate.validate({
      pickup,
      destination,
      price,
      tripDate,
    });
    if (!driverId) {
      return HandleResponse(
        res,
        false,
        400,
        "opps driver id is required how did you get here no stress me abeg"
      );
    }
    if (error) {
      return HandleResponse(
        res,
        false,
        400,
        error.details[0]?.message as string
      );
    }

    await Trips.create({
      userId: authId,
      driverId,
      pickup,
      destination,
      price,
      tripDate,
      status: "pending",
    });

    await BookingHistorysave.create({
      userId: authId,
      driverId,
      pickup,
      destination,
      price,
      tripDate,
      status: "pending",
    });

    const driver = await Driver.findOne({ driverId: driverId }).populate(
      "authId",
      "email full_name"
    );
    await Driver.updateMany(
      { location: { $exists: false } },
      { $set: { location: { type: "Point", coordinates: [0, 0] } } }
    );

    if (!driver) {
      return HandleResponse(res, false, 400, "driver not found hmm");
    }

    const driverEmail = (driver.authId as any)?.email;
    const driverName = (driver.authId as any)?.full_name;
    if (driverEmail) {
      await mailService.sendBookingNotification({
        driverName: driverName,
        driverEmail: driverEmail,
        userPickup: pickup,
        userDestination: destination,
        tripDate,
        price,
        userbookname: req.user.full_name,
      });
    }
    HandleResponse(
      res,
      true,
      200,
      "your booking was successfullly created awaiting for trip approval thanks"
    );
  } catch (error) {
    next(error);
  }
}

// DRIVER ACCEPT TRIP
export async function DriverAcceptTrip(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const driverId = req.user?._id;
    const { tripId } = req.params;

    const trip = await Trips.findById(tripId);
    if (!trip) return HandleResponse(res, false, 404, "Trip not found");
    if (trip.status !== "pending") {
      return HandleResponse(res, false, 400, "Trip already processed");
    }
    const userapplying = await Auth.findOne({ _id: trip.userId }).lean();
    if (!userapplying) {
      return HandleResponse(
        res,
        false,
        400,
        "use applying is not defined cehck well "
      );
    }

    trip.trackingId = `TrP-2-3-${uuidv4()}`;
    trip.status = "accepted";
    await trip.save();

    // send email to user
    const userEmail = userapplying?.email;

    const driver = await Driver.findOne({ authId: driverId })
      .populate("authId", "full_name")
      .lean();
    if (!driver) return HandleResponse(res, false, 400, "error ");

    const driverName = (driver.authId as any)?.full_name;
    if (userEmail) {
      await mailService.sendTripAcceptedMail({
        userEmail,
        driverName: driverName,
        pickup: trip.pickup,
        destination: trip.destination,
        tripDate: trip.tripDate,
        drivernumber: driver.phone,
      });
    }

    await BookingHistorysave.findOneAndUpdate(
      {
        userId: trip.userId,
        driverId: trip.driverId,
        pickup: trip.pickup,
        destination: trip.destination,
      },
      {
        $set: {
          trackingId: trip.trackingId,
          status: "accepted",
          tripDate: trip.tripDate,
          price: trip.price,
        },
      },
      { new: true }
    );
    HandleResponse(res, true, 200, "Trip accepted successfully", {
      trackingId: trip.trackingId,
    });
  } catch (error) {
    next(error);
  }
}
export async function GetPendingTripsForDriver(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const driverId = req.user?._id;

    if (!driverId) {
      return HandleResponse(res, false, 401, "Unauthorized");
    }

    const userdriver = await Auth.findOne({ _id: driverId }).populate("driver");

    if (!userdriver?.driver || !userdriver.driver.driverId) {
      return HandleResponse(
        res,
        false,
        400,
        "This user is not registered as a driver"
      );
    }
    // Find trips pending for this driver
    const pendingTrips = await Trips.find({
      status: "pending",
      driverId: userdriver?.driver.driverId,
    })
      .sort({ createdAt: -1 })
      .lean();

    HandleResponse(
      res,
      true,
      200,
      "Pending trips fetched successfully",
      pendingTrips
    );
  } catch (error) {
    next(error);
  }
}

// DRIVER REJECT TRIP
export async function DriverRejectTrip(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const driverId = req.user?._id;
    const { tripId } = req.params;

    const trip = await Trips.findById(tripId);
    if (!trip) return HandleResponse(res, false, 404, "Trip not found");
    if (trip.status !== "pending") {
      return HandleResponse(res, false, 400, "Trip already processed");
    }

    const userapplying = await Auth.findOne({ _id: trip.userId }).lean();
    if (!userapplying) {
      return HandleResponse(
        res,
        false,
        400,
        "User applying is not defined, check well"
      );
    }

    await BookingHistorysave.findOneAndUpdate(
      {
        userId: trip.userId,
        driverId: trip.driverId,
      },
      {
        $set: {
          status: "rejected",
        },
      },
      { new: true }
    );

    trip.status = "rejected";
    await trip.save();

    const driver = await Driver.findOne({ authId: driverId })
      .populate("authId", "full_name")
      .lean();
    if (!driver) return HandleResponse(res, false, 400, "Driver not found");

    const driverName = (driver.authId as any)?.full_name;

    // send rejection email
    const userEmail = userapplying.email;
    if (userEmail) {
      await mailService.sendTripRejectedMail({
        userEmail,
        driverName,
        pickup: trip.pickup,
        destination: trip.destination,
        tripDate: trip.tripDate,
      });
    }

    HandleResponse(res, true, 200, "Trip rejected successfully", trip);
  } catch (error) {
    next(error);
  }
}
export async function GetallTripDriver(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return HandleResponse(res, false, 400, "You must be authenticated");
    }

    const userdriver = await Auth.findById(userId).populate("driver");

    if (!userdriver?.driver || !userdriver.driver.driverId) {
      return HandleResponse(res, false, 400, "Driver not found");
    }

    const trips = await BookingHistorysave.find({
      driverId: userdriver.driver.driverId,
    })
      .sort({ createdAt: -1 })
      .lean();

    HandleResponse(res, true, 200, "Trip history fetched successfully", trips);
  } catch (error) {
    next(error);
  }
}

export async function GetallTripClient(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return HandleResponse(res, false, 400, "You must be authenticated");
    }
    const trips = await BookingHistorysave.find({ userId }).sort({
      createdAt: -1,
    });
    HandleResponse(res, true, 200, "Trip history fetched successfully", trips);
  } catch (error) {
    next(error);
  }
}

export async function GetDriverLocationByTracking(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { trackingId } = req.body;
    if (!trackingId)
      return HandleResponse(res, false, 400, "Tracking ID is required");

    const trip = await Trips.findOne({ trackingId }).populate("driverId");
    const authGet = await Driver.findOne({ driverId: trip?.driverId });
    if (!trip || !authGet)
      return HandleResponse(
        res,
        false,
        404,
        "No trip found for this tracking ID"
      );

    const driver = trip.driverId as any;

    const location = authGet.location?.coordinates;
    if (!location || location.length < 2) {
      return HandleResponse(res, false, 400, "Driver location not available");
    }
    const [lng, lat] = authGet.location.coordinates;

    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await geoRes.json();

    const city = data?.display_name || "Unknown City";
    const state = data?.address?.state || "Unknown State";
    const village = data?.address?.village;
    const country = data?.country || "Unknown Country";

    //  Send only driver info (no reports)
    return HandleResponse(res, true, 200, "Driver location fetched", {
      driverName: driver.full_name,
      phoneNumber: driver.phoneNumber,
      truckType: driver.truckType,
      village: village,
      coordinates: { lat, lng },
      address: { city, state, country },
      phonenumber: authGet?.phone,
    });
  } catch (error) {
    next(error);
  }
}

export async function UpdateDriverLocation(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const driverId = req.user._id;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return HandleResponse(
        res,
        false,
        400,
        "Latitude and Longitude are required"
      );
    }

    await Driver.findOneAndUpdate(
      { authId: driverId },
      { location: { type: "Point", coordinates: [lng, lat] } },
      { new: true }
    );

    HandleResponse(res, true, 200, "Driver location updated");
  } catch (error) {
    next(error);
  }
}

export async function MarkTripDone(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { trackingId } = req.body;
    if (!trackingId) {
      return HandleResponse(res, false, 400, "Tracking ID is required");
    }

    // Find the trip and populate driver
    const trip = await Trips.findOne({ trackingId }).populate("driverId");
    if (!trip) {
      return HandleResponse(res, false, 404, "Trip not found");
    }

    const driver = trip.driverId as any;
    const authGet = await Driver.findOne({ driverId: driver });

    if (!driver) {
      return HandleResponse(res, false, 404, "Driver not found for this trip");
    }

    // Mark trip as completed
    trip.status = "completed";
    await trip.save();
    await BookingHistorysave.findOneAndUpdate(
      {
        userId: trip.userId,
        driverId: trip.driverId,
        pickup: trip.pickup,
        destination: trip.destination,
      },
      {
        $set: {
          trackingId: trip.trackingId,
          status: "completed",
          tripDate: trip.tripDate,
          price: trip.price,
        },
      },
      { new: true }
    );

    await Driver.findOneAndUpdate(
      { driverId: authGet?.driverId },
      {
        location: { type: "Point", coordinates: [] },
        trips: null,
        truckType: null,
        status: "none", // reset driver status
        isDriverRequest: false, // reset request flag
        verified: false, // optional: reset verification if needed
        // any other fields you want reset can go here
      }
    );

    return HandleResponse(
      res,
      true,
      200,
      "Trip marked as completed and driver info reset"
    );
  } catch (error) {
    next(error);
  }
}
