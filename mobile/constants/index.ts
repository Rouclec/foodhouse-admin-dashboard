import { Country } from "@/interface";
import Colors from "./Colors";
import countries from "./countries.json";

countries.sort((a, b) => a.name.localeCompare(b.name));

const CAMEROON = countries.find(
  (country) => country.name === "Cameroon"
) as Country;
const GHANA = countries.find((country) => country.name === "Ghana") as Country;
const UNITED_STATES = countries.find(
  (country) => country.name === "United States"
) as Country;

const TANZANIA = countries.find(
  (country) => country.name === "Tanzania"
) as Country;

const RWANDA = countries.find(
  (country) => country.name === "Rwanda"
) as Country;

const GABON = countries.find((country) => country.name === "Gabon") as Country;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export {
  CAMEROON,
  Colors,
  countries,
  GHANA,
  UNITED_STATES,
  TANZANIA,
  RWANDA,
  GABON,
  emailRegex,
};
