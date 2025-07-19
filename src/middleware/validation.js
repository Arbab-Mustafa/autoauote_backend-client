require('dotenv').config();
const logger = require('../logger');
const Joi = require('joi');
const { ApiError } = require('./errorHandler');

/**
 * Validate quote request body
 */
const validateQuoteRequest = (req, res, next) => {
  const schema = Joi.object({
    vin: Joi.string().length(17).required(),
    zip: Joi.string().pattern(/^\d{5}$/).required(),
    mileage: Joi.number().integer().min(0).required(),
    price: Joi.number().min(0).required(),
    products: Joi.array().items(Joi.string().valid('vsc', 'gap', 'tire', 'dent')).default(['vsc']),
    dealer_id: Joi.string().allow(null, '')
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return next(ApiError.badRequest('Invalid request data', error.details));
  }
  
  // Replace request body with validated value
  req.body = value;
  next();
};

module.exports = {
  validateQuoteRequest
};
