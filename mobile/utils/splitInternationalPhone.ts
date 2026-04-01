import parsePhoneNumberFromString, { CountryCode } from 'libphonenumber-js';
import { CAMEROON } from '@/constants';

/** Splits a stored phone (often E.164) into dial code and national digits for PhoneNumberInput. */
export function splitInternationalPhone(
  raw: string | null | undefined,
): { dialCode: string; nationalNumber: string } {
  const trimmed = (raw ?? '').trim().replace(/\s/g, '');
  if (!trimmed) {
    return { dialCode: CAMEROON.dial_code, nationalNumber: '' };
  }

  let parsed = parsePhoneNumberFromString(trimmed);
  if (parsed) {
    return {
      dialCode: `+${parsed.countryCallingCode}`,
      nationalNumber: parsed.nationalNumber,
    };
  }

  parsed = parsePhoneNumberFromString(
    trimmed,
    CAMEROON.code as CountryCode,
  );
  if (parsed) {
    return {
      dialCode: `+${parsed.countryCallingCode}`,
      nationalNumber: parsed.nationalNumber,
    };
  }

  return {
    dialCode: CAMEROON.dial_code,
    nationalNumber: trimmed.replace(/^\+/, ''),
  };
}

/** Combines selected dial code and national digits for API payloads (E.164 when parse succeeds). */
export function buildE164FromParts(
  dialCode: string | null | undefined,
  nationalDigits: string | null | undefined,
): string {
  const national = (nationalDigits ?? '').replace(/\D/g, '');
  const dial = (dialCode ?? CAMEROON.dial_code).trim();
  if (!national) {
    return dial;
  }
  const composed = `${dial}${national}`;
  const parsed = parsePhoneNumberFromString(composed);
  return parsed?.format('E.164') ?? composed;
}
