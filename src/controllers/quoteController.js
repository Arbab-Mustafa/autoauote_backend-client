require("dotenv").config();
const logger = require("../logger");
const { providerConfig, stateRestrictions } = require("../config");
const { cacheService } = require("../services/cacheService");
const ProviderService = require("../services/providerService");
const VehicleService = require("../services/vehicleService");
const { ApiError } = require("../middleware/errorHandler");

class QuoteController {
  /**
   * Get quotes for a vehicle
   */
  static async getQuotes(req, res, next) {
    try {
      const { vin, zip, mileage, price, products, dealer_id } = req.body;

      if (!vin || !zip || !Array.isArray(products)) {
        return next(
          ApiError.badRequest("VIN, ZIP, and product list are required.")
        );
      }

      // Check cache first
      const cacheKey = `quotes:${vin}:${zip}:${mileage}:${price}:${products.join(
        ","
      )}:${dealer_id || "none"}`;
      const cachedQuotes = await cacheService.get(cacheKey);

      if (cachedQuotes) {
        return res.status(200).json(JSON.parse(cachedQuotes));
      }

      // Get vehicle details from VIN
      const vehicleDetails = await VehicleService.getVehicleDetails(vin);

      if (!vehicleDetails) {
        throw ApiError.badRequest("Invalid VIN or vehicle details not found");
      }

      // Get state from ZIP code
      const state = await VehicleService.getStateFromZip(zip);

      // Check state restrictions
      const stateRestrictedProducts = [];
      products.forEach((product) => {
        if (
          stateRestrictions[product] &&
          stateRestrictions[product].includes(state)
        ) {
          stateRestrictedProducts.push(product);
        }
      });

      // Filter out restricted products
      const availableProducts = products.filter(
        (product) => !stateRestrictedProducts.includes(product)
      );

      if (availableProducts.length === 0) {
        return res.status(200).json({
          meta: {
            vehicle_eligibility: "ineligible",
            coverage_disclaimer: "No products available in your state.",
            state_restrictions: {
              restricted_products: stateRestrictedProducts,
              state,
            },
          },
        });
      }

      // Prepare request for providers
      const providerRequest = {
        vehicle: {
          vin,
          year: vehicleDetails.year,
          make: vehicleDetails.make,
          model: vehicleDetails.model,
          trim: vehicleDetails.trim,
          mileage,
        },
        customer: {
          zip,
          state,
        },
        dealer: {
          id: dealer_id || "direct",
          name: dealer_id ? "Dealer Partner" : "Direct Consumer",
        },
        options: {
          price,
          products: availableProducts,
        },
      };

      // Get quotes from all providers
      const providerService = new ProviderService();
      const providerQuotes = await providerService.getQuotesFromAllProviders(
        providerRequest
      );

      // Normalize and aggregate quotes
      const aggregatedQuotes = {};
      availableProducts.forEach((product) => {
        aggregatedQuotes[product] = [];
      });

      // Process quotes from each provider
      Object.keys(providerQuotes).forEach((providerId) => {
        const provider = providerConfig.providers[providerId];
        const quotes = providerQuotes[providerId];

        if (!quotes || !quotes.quotes) return;

        quotes.quotes.forEach((quote) => {
          if (availableProducts.includes(quote.product_type)) {
            // Apply markup
            const retailPrice = quote.retail_price * (provider.markup || 1);

            // Add to aggregated quotes
            aggregatedQuotes[quote.product_type].push({
              id: quote.product_id,
              provider: quote.provider.name,
              name: quote.name,
              term: quote.term.months,
              mileage: quote.term.miles,
              deductible: quote.deductible,
              price: Math.round(retailPrice * 100) / 100,
              coverage: quote.coverage,
              tags: [], // Tags will be added later
            });
          }
        });
      });

      // Add tags based on business rules
      Object.keys(aggregatedQuotes).forEach((product) => {
        const quotes = aggregatedQuotes[product];

        if (quotes.length === 0) return;

        // Sort by price
        quotes.sort((a, b) => a.price - b.price);

        // Add "Best Value" tag to lowest price
        if (quotes[0]) {
          quotes[0].tags.push("Best Value");
        }

        // Add "Most Popular" tag based on coverage and price
        const popularIndex = Math.min(1, quotes.length - 1);
        if (quotes[popularIndex]) {
          quotes[popularIndex].tags.push("Most Popular");
        }

        // Add "Dealer Recommended" tag if dealer_id is provided
        if (dealer_id && quotes.length > 2) {
          quotes[2].tags.push("Dealer Recommended");
        }
      });

      // Prepare response
      const response = {
        ...aggregatedQuotes,
        meta: {
          vehicle_eligibility: "eligible",
          coverage_disclaimer:
            "Coverage is subject to terms and conditions of the service contract.",
          state_restrictions:
            stateRestrictedProducts.length > 0
              ? {
                  restricted_products: stateRestrictedProducts,
                  state,
                }
              : {},
        },
      };

      // Cache the response
      await cacheService.set(cacheKey, JSON.stringify(response), 600); // 10 minutes TTL

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get vehicle details from VIN
   */
  static async getVehicleDetails(req, res, next) {
    try {
      const { vin } = req.params;

      // Add logging to debug the issue
      logger.info(`Vehicle details request for VIN: ${vin}`);

      if (!vin) {
        logger.error("No VIN provided in request");
        throw ApiError.badRequest("VIN is required");
      }

      if (vin === ":vin") {
        logger.error('Received literal ":vin" instead of actual VIN');
        throw ApiError.badRequest(
          "Invalid VIN format - received placeholder instead of actual VIN"
        );
      }

      if (vin.length !== 17) {
        logger.error(`Invalid VIN length: ${vin.length} (expected 17)`);
        throw ApiError.badRequest(
          `Invalid VIN length: ${vin.length} (expected 17)`
        );
      }

      const vehicleDetails = await VehicleService.getVehicleDetails(vin);

      if (!vehicleDetails) {
        logger.error(`Vehicle details not found for VIN: ${vin}`);
        throw ApiError.notFound("Vehicle details not found");
      }

      logger.info(`Vehicle details found for VIN: ${vin}`, vehicleDetails);
      res.status(200).json(vehicleDetails);
    } catch (error) {
      logger.error("Error in getVehicleDetails:", error);
      next(error);
    }
  }

  /**
   * Get available product types
   */
  static async getAvailableProducts(req, res) {
    const products = [
      {
        id: "vsc",
        name: "Vehicle Service Contract",
        description:
          "Covers mechanical breakdowns and repairs after the manufacturer's warranty expires.",
      },
      {
        id: "gap",
        name: "GAP Insurance",
        description:
          "Covers the difference between what you owe on your vehicle and what it's worth if it's totaled.",
      },
      {
        id: "tire",
        name: "Tire & Wheel Protection",
        description: "Covers damage to tires and wheels from road hazards.",
      },
      {
        id: "dent",
        name: "Dent & Ding Protection",
        description: "Covers minor dents and dings on your vehicle.",
      },
    ];

    res.status(200).json(products);
  }
}

module.exports = QuoteController;
