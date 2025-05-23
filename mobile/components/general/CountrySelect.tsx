import React, {
  Dispatch,
  FC,
  SetStateAction,
  useState,
} from "react";
import {
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
  Text,
} from "react-native";

import { Colors, countries as allCountries } from "@/constants";
import { Country } from "@/interface";
import { phoneNumberInputStyles as styles } from "@/styles";
import { Icon } from "react-native-paper";
import CountryList from "./CountryList";

interface Props {
  containerStyle?: StyleProp<ViewStyle>;
  textContainerStyles?: StyleProp<ViewStyle>;
  setCountry: Dispatch<SetStateAction<Country>>;
  country: Country;
  countries?: Country[] | undefined;
}

const CountrySelect: FC<Props> = ({
  setCountry,
  containerStyle,
  countries = allCountries,
  country,
}) => {
  const [showCountries, setShowCountries] = useState(false);

  return (
    <View style={containerStyle} testID="country-select-component">
      <View style={styles.mainContainer}>
        <TouchableOpacity onPress={() => setShowCountries(true)}>
          <View style={styles.countryContainer}>
            <View style={styles.flexContainer}>
              <Text style={styles.countryCodeText}>{country?.emoji}</Text>
              <Text style={styles.countryCodeText}>{country?.name}</Text>
            </View>

            <Icon color={Colors.dark[0]} size={20} source={"chevron-down"} />
          </View>
        </TouchableOpacity>
      </View>
      <CountryList
        visible={showCountries}
        setVisible={setShowCountries}
        setCountry={setCountry}
        countries={countries}
      />
    </View>
  );
};

export default CountrySelect;
