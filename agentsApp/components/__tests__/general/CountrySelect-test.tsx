/* eslint-disable no-undef */
import CountrySelect from '@/components/general/CountrySelect';
import { countries, UNITED_STATES } from '@/constants';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

describe('CountrySelect', () => {
  let setCountryMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    setCountryMock = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
  });

  test('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <CountrySelect setCountry={setCountryMock} country={UNITED_STATES} />,
    );

    expect(getByTestId('country-select-component')).toBeTruthy();
    expect(getByText(UNITED_STATES!.emoji)).toBeTruthy();
    expect(getByText(UNITED_STATES!.name)).toBeTruthy();
  });

  test('US country will still be rendered even when no country is passed', () => {
    const { getByText, getByTestId } = render(
      <CountrySelect setCountry={setCountryMock} country={UNITED_STATES} />,
    );

    expect(getByTestId('country-select-component')).toBeTruthy();
    expect(getByText(UNITED_STATES!.emoji)).toBeTruthy();
    expect(getByText(UNITED_STATES!.name)).toBeTruthy();

    const countryCodeContainer = getByText(UNITED_STATES!.name);

    fireEvent.press(countryCodeContainer);

    // Expect modal to be visible
    expect(getByTestId('countryModal')).toBeTruthy();
  });

  test('shows countries modal on country code click', async () => {
    const { getByText, getByTestId } = render(
      <CountrySelect setCountry={setCountryMock} country={UNITED_STATES} />,
    );

    const countryCodeContainer = getByText(UNITED_STATES!.name);

    fireEvent.press(countryCodeContainer);

    // Expect modal to be visible
    expect(getByTestId('countryModal')).toBeTruthy();
  });
});
