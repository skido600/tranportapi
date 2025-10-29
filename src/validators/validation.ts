import Joi from "joi";

export const CreateUserSchema = Joi.object({
  full_name: Joi.string().min(4).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 4 characters",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Invalid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),

  userName: Joi.string().min(4).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 4 characters",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),

  address: Joi.string().min(4).required().messages({
    "string.empty": "Address is required",
    "string.min": "Address must be at least 4 characters",
  }),
  country: Joi.string().required().messages({
    "string.empty": "country is required",
  }),
  role: Joi.string().valid("driver", "client").required().messages({
    "any.only": "Role must be either 'driver' or 'client'",
    "any.required": "Role is required",
  }),
});

export const Loginuser = Joi.object({
  Email_Username: Joi.string().min(4).required().messages({
    "string.empty": "Email or username is required",
    "string.min": "Must be at least 2 characters",
  }),

  password: Joi.string().min(5).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 5 characters",
  }),
});

export const ResetPassword = Joi.object({
  email: Joi.string().min(4).required().messages({
    "string.empty": "Email or username is required",
    "string.min": "Must be at least 4 characters",
  }),
  code: Joi.string().required().messages({ "string.empty": "code Required" }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({ "string.empty": "newPassword is Required" }),
  confirmNewpassword: Joi.string()
    .required()
    .messages({ "string.empty": " confirmNewpassword is Required" }),
});
export const Verifycode = Joi.object({
  email: Joi.string().min(4).required().messages({
    "string.empty": "Email or username is required",
    "string.min": "Must be at least 2 characters",
  }),
  code: Joi.string().required().messages({ "string.empty": "code Required" }),
});
export const verifyPassword = Joi.object({
  email: Joi.string().min(4).required().messages({
    "string.empty": "Email or username is required",
    "string.min": "Must be at least 2 characters",
  }),

  newpassword: Joi.string().min(5).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 5 characters",
  }),
});
export const Firstemailvalidate = Joi.object({
  email: Joi.string().min(4).required().messages({
    "string.empty": "Email or username is required",
    "string.min": "Must be at least 2 characters",
  }),
});
export const Driverdetails = Joi.object({
  licenseNumber: Joi.string().alphanum().required().min(8).max(16).messages({
    "string.empty": "License number is required.",
    "string.alphanum": "License number must contain only letters and numbers.",
    "string.min":
      "Hey user, we don’t think this license is valid — driver licenses are usually more than 8 characters.",
    "string.max": "License number seems too long — please check again.",
  }),

  phone: Joi.number()
    .integer()
    .min(1000000000)
    .max(999999999999999)
    .required()
    .messages({
      "number.base": "Phone number must be a number",
      "number.min": "Phone number must have at least 10 digits",
      "number.max": "Phone number must not exceed 15 digits",
      "any.required": "Phone number is required",
    }),

  truckType: Joi.string().required().messages({
    "string.empty": "Please enter the truck type you want to register.",
  }),

  country: Joi.string().required().messages({
    "string.empty": "Country is required.",
  }),
  state: Joi.string().required().messages({
    "string.empty": "State is required.",
  }),

  town: Joi.string().required().messages({
    "string.empty": "Town is required.",
  }),
  price: Joi.number().required().messages({
    "number.base": "Price must be a number.",
    "any.required": "Price is required.",
  }),
  experience: Joi.number().required().messages({
    "any.required": "Experience is required.",
    "number.base": "Experience must be a number (in years).",
  }),

  description: Joi.string().required().messages({
    "string.empty": "Description is required.",
  }),
});

export const createNewsSchema = Joi.object({
  newsTitle: Joi.string().min(3).max(100).required().messages({
    "string.empty": "News title is required",
    "string.min": "News title must be at least 3 characters",
  }),
  newsBody: Joi.string().min(10).required().messages({
    "string.empty": "News body is required",
    "string.min": "News body must be at least 10 characters",
  }),
});
export const TripsValidate = Joi.object({
  pickup: Joi.string().min(3).required().messages({
    "string.empty": "pickup title is required",
  }),
  destination: Joi.string().min(3).required().messages({
    "string.empty": "destination title is required",
  }),
  price: Joi.number().min(1000).required().messages({
    "number.base": "Price must be a number",
    "number.min": "Minimum price is ₦1000",
    "any.required": "Price is required",
  }),
  tripDate: Joi.any().required().messages({
    "any.required": "Trip date is required",
  }),
});
