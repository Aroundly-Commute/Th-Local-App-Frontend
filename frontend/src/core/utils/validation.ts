/**
 * Validates phone numbers.
 * Supports standard Indian mobile numbers (with optional +91, 91, or 0 prefix)
 * and international E.164 format.
 */
export function validatePhoneNumber(phone: string): boolean {
  // Strip all whitespace, hyphens, and parenthesis
  const clean = phone.trim().replace(/[\s\-()]/g, '');
  
  // Standard Indian mobile number regex:
  // Optionally starts with +91, 91, or 0, followed by a 10-digit number starting with 6-9
  const indianMobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  
  // Broad E.164 international format regex:
  // Starts with + followed by 1 to 15 digits (min 10 for safety)
  const internationalRegex = /^\+[1-9]\d{9,14}$/;

  return indianMobileRegex.test(clean) || internationalRegex.test(clean);
}

/**
 * Validates Indian vehicle license plate numbers.
 * Supports standard RTO format (e.g. DL3CAY9876, MH12AB1234)
 * and BH Series format (e.g. 22BH5015A).
 */
export function validateVehicleNumber(vehicleNum: string): boolean {
  // Strip spaces, hyphens, and punctuation, convert to uppercase
  const clean = vehicleNum.trim().replace(/[\s\-]/g, '').toUpperCase();
  
  // Standard Indian vehicle plate number formats:
  // State code (2 letters) + RTO/district (1-2 digits) + optional series (0-3 letters) + unique number (4 digits)
  // E.g., DL3CAY9876, MH12AB1234, KA011234
  const standardRtoRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
  
  // BH (Bharat) series: Year of registration (2 digits) + BH + unique number (4 digits) + series (1-2 letters)
  // E.g., 22BH5015A
  const bhSeriesRegex = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
  
  return standardRtoRegex.test(clean) || bhSeriesRegex.test(clean);
}
