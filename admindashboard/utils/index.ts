function getCurrencySymbol(isoCode: string): [string | null, boolean] {
  // Define a map for ISO codes to symbols (all symbols are before the amount)
  const currencyData: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  // Check if the ISO code exists in the map
  if (currencyData[isoCode]) {
    return [currencyData[isoCode], true];
  } else {
    return [null, false];
  }
}

// Example usage
export function formatCurrency(
  amount: number | string,
  isoCode: string
): string {
  const [symbol, hasSymbol] = getCurrencySymbol(isoCode);
  if (hasSymbol) {
    return `${symbol}${formatAmount(amount, { decimalPlaces: 2 })}`;
  } else {
    return `${formatAmount(amount)} ${isoCode}`; // If no symbol, show the ISO code
  }
}

/**
 * Formats a number with custom thousands separator, digit grouping, and decimal places.
 *
 * @param value - The number (or string representation of a number) to format.
 * @param options - Optional configuration for formatting.
 * @param options.separator - The thousands separator (default: `,`).
 * @param options.groupSize - Number of digits per group (default: `3`).
 * @param options.decimalPlaces - Number of decimal places to round to (default: `0`).
 * @returns A formatted number string or an error message if input is invalid.
 */
export const formatAmount = (
  value: string | number,
  options: {
    separator?: string;
    groupSize?: number;
    decimalPlaces?: number;
  } = {}
): string => {
  // Default formatting options
  const defaultOptions = {
    separator: ",", // Default separator is a comma
    groupSize: 3, // Default grouping is 3 digits
    decimalPlaces: 0, // Default rounding to 0 decimal places
  };

  // Merge user-provided options with defaults
  const { separator, groupSize, decimalPlaces } = {
    ...defaultOptions,
    ...options,
  };

  // Ensure value is a valid number
  const number = parseFloat(value as string);
  if (isNaN(number)) return "Invalid number";

  // Round to the specified decimal places
  const roundedNumber = number.toFixed(decimalPlaces);

  // Split number into integer and decimal parts
  let integerPart = roundedNumber.split(".")[0];
  const decimalPart = roundedNumber.split(".")[1];

  // Regular expression for digit grouping based on groupSize
  const regex = new RegExp(`\\B(?=(\\d{${groupSize}})+(?!\\d))`, "g");
  integerPart = integerPart.replace(regex, separator);

  // Return formatted number, including decimal part if applicable
  return decimalPlaces > 0 ? `${integerPart}.${decimalPart}` : integerPart;
};

export * from "./utils";
export * from "./auth";
export * from "./interceptor";
