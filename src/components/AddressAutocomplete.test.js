import { render } from '@testing-library/react';
import AddressAutocomplete from './AddressAutocomplete';

afterEach(() => {
  delete global.window.google;
});

test('initializes Google Autocomplete with address fields', () => {
  const addListener = jest.fn();
  const AutocompleteMock = jest.fn(() => ({ addListener }));
  const clearInstanceListeners = jest.fn();
  global.window.google = {
    maps: {
      places: { Autocomplete: AutocompleteMock },
      event: { clearInstanceListeners },
    },
  };

  render(
    <AddressAutocomplete value="" onChange={() => {}} onSelect={() => {}} />
  );

  expect(AutocompleteMock).toHaveBeenCalledWith(
    expect.any(HTMLElement),
    expect.objectContaining({
      types: ['address'],
      fields: ['address_components'],
    })
  );
});
