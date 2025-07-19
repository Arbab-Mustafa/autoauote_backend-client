/**
 * Vehicle service for getting vehicle details and location information
 */
class VehicleService {
  /**
   * Get vehicle details from VIN
   * @param {string} vin - Vehicle Identification Number
   * @returns {Promise<Object|null>} - Vehicle details or null if not found
   */
  static async getVehicleDetails(vin) {
    // In a real implementation, this would call a VIN decoder API
    // For this MVP, we'll simulate the response
    
    // Validate VIN format
    if (!vin || vin.length !== 17) {
      return null;
    }
    
    // Extract basic info from VIN
    // This is a simplified implementation for demo purposes
    const year = this.decodeModelYear(vin.charAt(9));
    const make = this.decodeMake(vin.charAt(1));
    const model = this.decodeModel(vin.substring(3, 6));
    
    return {
      vin,
      year,
      make,
      model,
      trim: 'XLT', // Hardcoded for demo
      body_style: 'Sedan',
      engine: '2.0L I4',
      transmission: 'Automatic'
    };
  }
  
  /**
   * Get state from ZIP code
   * @param {string} zip - 5-digit ZIP code
   * @returns {Promise<string>} - 2-letter state code
   */
  static async getStateFromZip(zip) {
    // In a real implementation, this would call a ZIP code API
    // For this MVP, we'll use a simple mapping for common ZIP codes
    const zipPrefixes = {
      '0': 'CT', // Connecticut
      '1': 'NY', // New York
      '2': 'DC', // Washington DC / MD / VA
      '3': 'FL', // Florida
      '4': 'MI', // Michigan
      '5': 'LA', // Louisiana
      '6': 'TX', // Texas
      '7': 'TX', // Texas
      '8': 'CO', // Colorado
      '9': 'CA'  // California
    };
    
    const prefix = zip.charAt(0);
    return zipPrefixes[prefix] || 'CA'; // Default to CA
  }
  
  /**
   * Decode model year from VIN
   * @param {string} yearCode - Year code from VIN
   * @returns {number} - Model year
   */
  static decodeModelYear(yearCode) {
    // Simplified year decoding for demo
    const yearCodes = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024
    };
    
    return yearCodes[yearCode] || 2018; // Default to 2018
  }
  
  /**
   * Decode make from VIN
   * @param {string} makeCode - Make code from VIN
   * @returns {string} - Vehicle make
   */
  static decodeMake(makeCode) {
    // Simplified make decoding for demo
    const makeCodes = {
      'A': 'Audi', 'B': 'BMW', 'C': 'Chevrolet', 'D': 'Dodge',
      'F': 'Ford', 'G': 'GMC', 'H': 'Honda', 'J': 'Jeep',
      'K': 'Kia', 'L': 'Lincoln', 'M': 'Mercedes', 'N': 'Nissan',
      'T': 'Toyota', 'V': 'Volkswagen'
    };
    
    return makeCodes[makeCode] || 'Ford'; // Default to Ford
  }
  
  /**
   * Decode model from VIN
   * @param {string} modelCode - Model code from VIN
   * @returns {string} - Vehicle model
   */
  static decodeModel(modelCode) {
    // Simplified model decoding for demo
    // In reality, this would be much more complex and depend on make
    const modelMap = {
      'F15': 'F-150',
      'CRV': 'CR-V',
      'CIV': 'Civic',
      'ACC': 'Accord',
      'CAM': 'Camry',
      'RAV': 'RAV4',
      'SIL': 'Silverado',
      'EQU': 'Equinox',
      'ESC': 'Escape',
      'EXP': 'Explorer'
    };
    
    return modelMap[modelCode] || 'F-150'; // Default to F-150
  }
}

module.exports = VehicleService;
