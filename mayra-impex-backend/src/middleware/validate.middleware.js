const Joi = require("joi");

// Validate request body against schema
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    req.body = value;
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required().messages({
      "string.email": "Please enter a valid email",
    }),
    password: Joi.string().min(6).max(50).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please enter a valid email",
    }),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().min(20),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email().messages({
      "string.email": "Please enter a valid email",
    }),
  }).min(1),

  createProduct: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    serial_number: Joi.string().max(100).allow(""),
    description: Joi.string().max(1000).allow(""),
    price: Joi.number().positive().required(),
    category_id: Joi.string().uuid().required(),
    image_url: Joi.string().uri().allow(""),
    is_active: Joi.boolean().default(true),
  }),

  updateProduct: Joi.object({
    name: Joi.string().min(2).max(200),
    serial_number: Joi.string().max(100).allow(""),
    description: Joi.string().max(1000).allow(""),
    price: Joi.number().positive(),
    category_id: Joi.string().uuid(),
    image_url: Joi.string().uri().allow(""),
    is_active: Joi.boolean(),
  }).min(1),

  createCategory: Joi.object({
    name: Joi.string().min(2).max(100).required(),
  }),

  placeOrder: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          product_id: Joi.string().uuid().required(),
          quantity: Joi.number().integer().min(1).required(),
        }),
      )
      .min(1)
      .required(),
    delivery_name: Joi.string().min(2).max(100).required(),
    delivery_phone: Joi.string()
      .pattern(/^\d{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone number must be 10 digits",
      }),
    shop_name: Joi.string().min(2).max(100).required(),
    delivery_address: Joi.string().min(5).max(500).required(),
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid("pending", "approved", "rejected").required(),
  }),

  verifyAdminPin: Joi.object({
    pin: Joi.string()
      .pattern(/^\d{4,6}$/)
      .required()
      .messages({
        "string.pattern.base": "PIN must be 4-6 digits",
      }),
  }),

  requestRecoveryOTP: Joi.object({
    // Body is empty - uses authenticated user
  }),

  verifyRecoveryOTP: Joi.object({
    otp: Joi.string()
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        "string.pattern.base": "OTP must be 6 digits",
      }),
  }),

  addPhoneNumber: Joi.object({
    phoneNumber: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid phone number format",
      }),
  }),

  requestAccountDeletion: Joi.object({
    password: Joi.string().required(),
  }),

  confirmAccountDeletion: Joi.object({
    otp: Joi.string()
      .pattern(/^\d{6}$/)
      .required(),
  }),
};

module.exports = { validate, schemas };
