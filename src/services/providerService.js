require("dotenv").config();
const logger = require("../logger");
const axios = require("axios");
const { providerConfig } = require("../config");
const { ApiError } = require("../middleware/errorHandler");

/**
 * Provider service for interacting with provider APIs
 */
class ProviderService {
  constructor() {
    this.providers = providerConfig.providers;
  }

  /**
   * Get quotes from all providers
   * @param {Object} request - Quote request data
   * @returns {Promise<Object>} - Quotes from all providers
   */
  async getQuotesFromAllProviders(request) {
    const providerPromises = {};
    const results = {};

    // Determine which providers to call based on requested products
    const { products } = request.options;
    const eligibleProviders = this.getEligibleProviders(products);

    // Call each eligible provider
    for (const providerId of eligibleProviders) {
      const provider = this.providers[providerId];
      providerPromises[providerId] = this.getQuotesFromProvider(
        providerId,
        request
      ).catch((error) => {
        console.error(
          `Error getting quotes from provider ${providerId}:`,
          error
        );
        return null; // Return null for failed providers
      });
    }

    // Wait for all provider requests to complete
    const providerResults = await Promise.all(Object.values(providerPromises));

    // Map results to provider IDs
    Object.keys(providerPromises).forEach((providerId, index) => {
      results[providerId] = providerResults[index];
    });

    return results;
  }

  /**
   * Get eligible providers for requested products
   * @param {Array<string>} products - Requested product types
   * @returns {Array<string>} - Array of eligible provider IDs
   */
  getEligibleProviders(products) {
    const eligibleProviders = [];

    Object.keys(this.providers).forEach((providerId) => {
      const provider = this.providers[providerId];

      // Check if provider supports any of the requested products
      const hasMatchingProducts = products.some((product) =>
        provider.products.includes(product)
      );

      if (hasMatchingProducts) {
        eligibleProviders.push(providerId);
      }
    });

    // Sort by priority
    return eligibleProviders.sort(
      (a, b) => this.providers[a].priority - this.providers[b].priority
    );
  }

  /**
   * Get quotes from a specific provider
   * @param {string} providerId - Provider ID
   * @param {Object} request - Quote request data
   * @returns {Promise<Object>} - Provider quotes
   */
  async getQuotesFromProvider(providerId, request) {
    const provider = this.providers[providerId];

    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // In a real implementation, this would call the actual provider API
    // For this MVP, we'll simulate the provider response
    return this.simulateProviderResponse(providerId, request);
  }

  /**
   * Simulate provider API response (for MVP)
   * @param {string} providerId - Provider ID
   * @param {Object} request - Quote request data
   * @returns {Promise<Object>} - Simulated provider response
   */
  async simulateProviderResponse(providerId, request) {
    const provider = this.providers[providerId];
    const { vehicle, customer, options } = request;

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Base response structure
    const response = {
      quotes: [],
    };

    // Generate quotes based on provider and requested products
    options.products.forEach((productType) => {
      // Skip if provider doesn't offer this product
      if (!provider.products.includes(productType)) {
        return;
      }

      // Generate quotes based on product type
      switch (productType) {
        case "vsc":
          response.quotes.push(
            ...this.generateVscQuotes(providerId, vehicle, customer)
          );
          break;
        case "gap":
          response.quotes.push(
            ...this.generateGapQuotes(providerId, vehicle, customer, options)
          );
          break;
        case "tire":
          response.quotes.push(
            ...this.generateTireQuotes(providerId, vehicle, customer)
          );
          break;
        case "dent":
          response.quotes.push(
            ...this.generateDentQuotes(providerId, vehicle, customer)
          );
          break;
      }
    });

    return {
      quotes: response.quotes,
      meta: {
        vehicle_eligibility: "eligible",
        coverage_disclaimer:
          "Coverage is subject to terms and conditions of the service contract.",
      },
    };
  }

  /**
   * Generate VSC quotes
   * @param {string} providerId - Provider ID
   * @param {Object} vehicle - Vehicle data
   * @param {Object} customer - Customer data
   * @returns {Array<Object>} - Generated quotes
   */
  generateVscQuotes(providerId, vehicle, customer) {
    const provider = this.providers[providerId];
    const quotes = [];

    // Base price calculation based on vehicle age and mileage
    const vehicleYear = parseInt(vehicle.year);
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicleYear;
    const mileage = parseInt(vehicle.mileage);

    // Skip if vehicle is too old or has too many miles
    if (vehicleAge > 12 || mileage > 150000) {
      return [];
    }

    // Calculate base price factors
    const ageFactor = 1 + vehicleAge * 0.1;
    const mileageFactor = 1 + (mileage / 20000) * 0.15;

    // Premium coverage
    if (vehicleAge <= 7 && mileage <= 85000) {
      const basePrice = 800 * ageFactor * mileageFactor;
      quotes.push({
        product_type: "vsc",
        product_id: `${providerId}_vsc_premium_36_36`,
        provider: {
          id: providerId,
          name: provider.name,
          logo_url: `https://example.com/logos/${providerId}.png`,
        },
        name: "Premium Coverage",
        description: "Comprehensive coverage for your vehicle",
        term: {
          months: 36,
          miles: 36000,
        },
        deductible: 100,
        retail_price: Math.round(basePrice),
        dealer_cost: Math.round(basePrice * 0.6),
        coverage: {
          engine: true,
          transmission: true,
          drivetrain: true,
          electrical: true,
          steering: true,
          suspension: true,
          brakes: true,
          air_conditioning: true,
          fuel_system: true,
          high_tech: true,
        },
        exclusions: [
          "Normal wear and tear",
          "Maintenance items",
          "Pre-existing conditions",
        ],
        sample_contract_url: `https://example.com/contracts/${providerId}_premium_36_36.pdf`,
      });
    }

    // Standard coverage
    if (vehicleAge <= 10 && mileage <= 100000) {
      const basePrice = 700 * ageFactor * mileageFactor;
      quotes.push({
        product_type: "vsc",
        product_id: `${providerId}_vsc_standard_48_48`,
        provider: {
          id: providerId,
          name: provider.name,
          logo_url: `https://example.com/logos/${providerId}.png`,
        },
        name: "Standard Coverage",
        description: "Essential coverage for your vehicle",
        term: {
          months: 48,
          miles: 48000,
        },
        deductible: 100,
        retail_price: Math.round(basePrice),
        dealer_cost: Math.round(basePrice * 0.6),
        coverage: {
          engine: true,
          transmission: true,
          drivetrain: true,
          electrical: true,
          steering: true,
          suspension: true,
          brakes: true,
          air_conditioning: true,
          fuel_system: false,
          high_tech: false,
        },
        exclusions: [
          "Normal wear and tear",
          "Maintenance items",
          "Pre-existing conditions",
          "High-tech components",
        ],
        sample_contract_url: `https://example.com/contracts/${providerId}_standard_48_48.pdf`,
      });
    }

    // Basic coverage
    if (vehicleAge <= 12 && mileage <= 120000) {
      const basePrice = 500 * ageFactor * mileageFactor;
      quotes.push({
        product_type: "vsc",
        product_id: `${providerId}_vsc_basic_60_60`,
        provider: {
          id: providerId,
          name: provider.name,
          logo_url: `https://example.com/logos/${providerId}.png`,
        },
        name: "Basic Coverage",
        description: "Basic powertrain coverage for your vehicle",
        term: {
          months: 60,
          miles: 60000,
        },
        deductible: 250,
        retail_price: Math.round(basePrice),
        dealer_cost: Math.round(basePrice * 0.6),
        coverage: {
          engine: true,
          transmission: true,
          drivetrain: true,
          electrical: false,
          steering: true,
          suspension: false,
          brakes: true,
          air_conditioning: false,
          fuel_system: false,
          high_tech: false,
        },
        exclusions: [
          "Normal wear and tear",
          "Maintenance items",
          "Pre-existing conditions",
          "Electrical components",
          "High-tech components",
          "Suspension components",
        ],
        sample_contract_url: `https://example.com/contracts/${providerId}_basic_60_60.pdf`,
      });
    }

    return quotes;
  }

  /**
   * Generate GAP quotes
   * @param {string} providerId - Provider ID
   * @param {Object} vehicle - Vehicle data
   * @param {Object} customer - Customer data
   * @param {Object} options - Options data
   * @returns {Array<Object>} - Generated quotes
   */
  generateGapQuotes(providerId, vehicle, customer, options) {
    const provider = this.providers[providerId];
    const quotes = [];

    // Skip if no price provided
    if (!options.price) {
      return [];
    }

    const vehiclePrice = options.price;
    const basePrice = vehiclePrice * 0.02; // 2% of vehicle price

    // Premium GAP
    quotes.push({
      product_type: "gap",
      product_id: `${providerId}_gap_premium`,
      provider: {
        id: providerId,
        name: provider.name,
        logo_url: `https://example.com/logos/${providerId}.png`,
      },
      name: "Premium GAP",
      description:
        "Comprehensive GAP coverage with insurance deductible coverage",
      term: {
        months: 36,
        miles: null,
      },
      deductible: 0,
      retail_price: Math.round(basePrice * 1.2),
      dealer_cost: Math.round(basePrice * 0.7),
      coverage: {
        loan_payoff: true,
        insurance_deductible: true,
        max_benefit: 10000,
      },
      exclusions: [
        "Commercial vehicles",
        "Exotic vehicles",
        "Vehicles over $100,000",
      ],
      sample_contract_url: `https://example.com/contracts/${providerId}_gap_premium.pdf`,
    });

    // Standard GAP
    quotes.push({
      product_type: "gap",
      product_id: `${providerId}_gap_standard`,
      provider: {
        id: providerId,
        name: provider.name,
        logo_url: `https://example.com/logos/${providerId}.png`,
      },
      name: "Standard GAP",
      description: "Basic GAP coverage",
      term: {
        months: 36,
        miles: null,
      },
      deductible: 0,
      retail_price: Math.round(basePrice),
      dealer_cost: Math.round(basePrice * 0.6),
      coverage: {
        loan_payoff: true,
        insurance_deductible: false,
        max_benefit: 7500,
      },
      exclusions: [
        "Commercial vehicles",
        "Exotic vehicles",
        "Vehicles over $100,000",
        "Insurance deductible",
      ],
      sample_contract_url: `https://example.com/contracts/${providerId}_gap_standard.pdf`,
    });

    return quotes;
  }

  /**
   * Generate Tire & Wheel quotes
   * @param {string} providerId - Provider ID
   * @param {Object} vehicle - Vehicle data
   * @param {Object} customer - Customer data
   * @returns {Array<Object>} - Generated quotes
   */
  generateTireQuotes(providerId, vehicle, customer) {
    const provider = this.providers[providerId];
    const quotes = [];

    // Premium Tire & Wheel
    quotes.push({
      product_type: "tire",
      product_id: `${providerId}_tire_premium`,
      provider: {
        id: providerId,
        name: provider.name,
        logo_url: `https://example.com/logos/${providerId}.png`,
      },
      name: "Premium Tire & Wheel",
      description:
        "Comprehensive tire and wheel protection with roadside assistance",
      term: {
        months: 36,
        miles: null,
      },
      deductible: 0,
      retail_price: 495,
      dealer_cost: 295,
      coverage: {
        tire_replacement: true,
        wheel_replacement: true,
        roadside_assistance: true,
      },
      exclusions: [
        "Racing or off-road use",
        "Cosmetic damage",
        "Pre-existing damage",
      ],
      sample_contract_url: `https://example.com/contracts/${providerId}_tire_premium.pdf`,
    });

    // Basic Tire & Wheel
    quotes.push({
      product_type: "tire",
      product_id: `${providerId}_tire_basic`,
      provider: {
        id: providerId,
        name: provider.name,
        logo_url: `https://example.com/logos/${providerId}.png`,
      },
      name: "Basic Tire & Wheel",
      description: "Basic tire and wheel protection",
      term: {
        months: 36,
        miles: null,
      },
      deductible: 50,
      retail_price: 395,
      dealer_cost: 235,
      coverage: {
        tire_replacement: true,
        wheel_replacement: false,
        roadside_assistance: false,
      },
      exclusions: [
        "Racing or off-road use",
        "Cosmetic damage",
        "Pre-existing damage",
        "Wheel replacement",
        "Roadside assistance",
      ],
      sample_contract_url: `https://example.com/contracts/${providerId}_tire_basic.pdf`,
    });

    return quotes;
  }

  /**
   * Generate Dent & Ding quotes
   * @param {string} providerId - Provider ID
   * @param {Object} vehicle - Vehicle data
   * @param {Object} customer - Customer data
   * @returns {Array<Object>} - Generated quotes
   */
  generateDentQuotes(providerId, vehicle, customer) {
    const provider = this.providers[providerId];
    const quotes = [];

    // Dent & Ding Protection
    quotes.push({
      product_type: "dent",
      product_id: `${providerId}_dent_repair`,
      provider: {
        id: providerId,
        name: provider.name,
        logo_url: `https://example.com/logos/${providerId}.png`,
      },
      name: "Dent & Ding Protection",
      description: "Paintless dent repair coverage",
      term: {
        months: 36,
        miles: null,
      },
      deductible: 0,
      retail_price: 395,
      dealer_cost: 235,
      coverage: {
        paintless_dent_repair: true,
        unlimited_repairs: true,
      },
      exclusions: [
        "Dents larger than 4 inches",
        "Dents with paint damage",
        "Pre-existing damage",
      ],
      sample_contract_url: `https://example.com/contracts/${providerId}_dent_repair.pdf`,
    });

    return quotes;
  }
}

module.exports = ProviderService;
