import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import {
  Keyboard,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
  Text,
} from "react-native";

import PhoneNumber, { CountryCode } from "libphonenumber-js";

import {
  Colors,
  GABON,
  RWANDA,
  TANZANIA,
  countries as allCountries,
} from "@/constants";
import i18n from "@/i18n";
import { Country } from "@/interface";
import { phoneNumberInputStyles as styles } from "@/styles";
import { Icon, TextInput } from "react-native-paper";
import { CountryList } from "./CountryList";

interface Props {
  containerStyle?: StyleProp<ViewStyle>;
  textContainerStyles?: StyleProp<ViewStyle>;
  setCountryCode: Dispatch<SetStateAction<string>>;
  setPhoneNumber: Dispatch<SetStateAction<string>>;
  countryCode: string | null | undefined;
  phoneNumber: string | null | undefined;
  countries?: Country[] | undefined;
  label?: string;
}

export const CAMEROON = allCountries.find(
  (country) => country.name === "Cameroon"
) as Country;

export const validatePhoneNumber = (
  phoneNumber: string | null,
  countryCode: string | null
) => {
  try {
    const code = allCountries.find(
      (country) => country.dial_code === countryCode
    )?.code;
    const number = PhoneNumber(
      phoneNumber as string,
      code as string as CountryCode
    );
    if (number?.isValid()) {
      return true; // Phone number is valid.
    } else {
      return false; // Phone number is not valid.
    }
  } catch (e) {
    console.error("error validating phone number: ", e);
    // Handle parsing errors, such as an invalid phone number.
    return false;
  }
};

const PhoneNumberInput: FC<Props> = ({
  setCountryCode,
  countryCode,
  phoneNumber,
  setPhoneNumber,
  containerStyle,
  countries,
  label,
}) => {
  const resolvedLabel = label ?? i18n.t("components.PhoneNumberInput.mobileNumber");
  const [showCountries, setShowCountries] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [country, setCountry] = useState<Country>(CAMEROON);
  const [isValidPhoneNumber, setIsValidPhoneNumber] = useState(false);

  const handlePhoneNumber = (input: string) => {
    const isValid = validatePhoneNumber(countryCode + input, country!.code);
    setIsValidPhoneNumber(isValid);

    setPhoneNumber(input);

    // if (isValid && !!phoneNumber) {
    //   Keyboard.dismiss();
    // }
  };

  useEffect(() => {
    if (countries?.length) {
      const defaultCountry = countries.find(
        (country) => country?.name === "Cameroon"
      ) as Country;
      setCountry(defaultCountry ?? countries[0]);
    }
  }, [countries]);

  useEffect(() => {
    const isValid = validatePhoneNumber(
      (countryCode ?? "") + (phoneNumber ?? ""),
      (allCountries.find((country) => country.dial_code === countryCode)
        ?.code ?? "US") as CountryCode
    );
    setIsValidPhoneNumber(isValid);
  }, [phoneNumber, countryCode]);

  useEffect(() => {
    if (country?.dial_code) setCountryCode(country.dial_code);
  }, [country]);

  useEffect(() => {
    if (!countryCode) return;
    const matched =
      [CAMEROON, GABON, RWANDA, TANZANIA].find((c) => c.dial_code === countryCode) ??
      allCountries.find((c) => c.dial_code === countryCode);
    if (matched) {
      setCountry((prev) =>
        prev.dial_code === matched.dial_code ? prev : matched,
      );
    }
  }, [countryCode]);

  return (
    <View style={containerStyle} testID="phone-number-component">
      <View style={styles.mainContainer}>
        <TouchableOpacity onPress={() => setShowCountries(true)}>
          <View style={styles.countryCodeContainer}>
            <Text style={styles.countryCodeText}>{country?.emoji}</Text>
            <Text style={styles.countryCodeText}>{country?.dial_code}</Text>

            <Icon color={Colors.dark[0]} size={20} source={"chevron-down"} />
          </View>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          outlineStyle={[
            styles.outlineInput,
            !(!phoneNumber || (isValidPhoneNumber && !!phoneNumber)) &&
              styles.errorInput,
            isFocused
              ? !(!phoneNumber || (isValidPhoneNumber && !!phoneNumber))
                ? styles.errorInput
                : styles.focusedMode
              : null,
          ]}
          mode="outlined"
          label={resolvedLabel}
          testID="text-input-container"
          onChangeText={handlePhoneNumber}
          value={phoneNumber ?? ""}
          inputMode="numeric"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          error={!(!phoneNumber || (isValidPhoneNumber && !!phoneNumber))}
          theme={{
            colors: {
              primary: Colors.primary[500],
              background: Colors.grey["fa"],
              error: Colors.error,
            },
            roundness: 10,
          }}
        />
      </View>
      <CountryList
        visible={showCountries}
        setVisible={setShowCountries}
        setCountry={setCountry}
        countries={[CAMEROON, GABON, RWANDA, TANZANIA]}
      />
    </View>
  );
};

export default PhoneNumberInput;
