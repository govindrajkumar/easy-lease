import React, { useEffect, useRef } from 'react';

export default function AddressAutocomplete({ value, onChange, onSelect }) {
  const inputRef = useRef(null);
  // Keep a mutable ref to the latest onSelect to avoid re-initialising
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let autocomplete;
    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !inputRef.current) return;
      // Google Places Autocomplete requires explicitly specifying the fields
      // you want returned when using `getPlace`. Without this, `place.address_components`
      // will be undefined in recent versions of the API, which breaks our logic
      // for extracting the street/city/province information.
      autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        // Request the address components so we can parse the selected place.
        fields: ['address_components'],
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;
        const get = (type) => {
          const comp = place.address_components.find((c) => c.types.includes(type));
          return comp ? comp.long_name : '';
        };
        const line1 = [get('street_number'), get('route')].filter(Boolean).join(' ');
        const city = get('locality');
        const province = get('administrative_area_level_1');
        const zip = get('postal_code');
        onSelectRef.current({
          address_line1: line1,
          city,
          province,
          zip_code: zip,
        });
      });
    };

    if (!window.google || !window.google.maps) {
      const existing = document.getElementById('google-maps-script');
      if (!existing) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.onload = initAutocomplete;
        document.body.appendChild(script);
      } else {
        existing.addEventListener('load', initAutocomplete);
      }
    } else {
      initAutocomplete();
    }

    return () => {
      if (autocomplete) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
    />
  );
}
