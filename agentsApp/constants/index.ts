import { Country } from '@/interface';
import Colors from './Colors';
import countries from './countries.json';

countries.sort((a, b) => a.name.localeCompare(b.name));

const CAMEROON = countries.find(
  country => country.name === 'Cameroon',
) as Country;
const GHANA = countries.find(country => country.name === 'Ghana') as Country;
const UNITED_STATES = countries.find(
  country => country.name === 'United States',
) as Country;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export { CAMEROON, Colors, countries, GHANA, UNITED_STATES, emailRegex };
