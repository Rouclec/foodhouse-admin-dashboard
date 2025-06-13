"use client";

import { Autocomplete } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { useGoogleAutocompleteFix } from "@/hooks/use-google-autocomplte-fix";
import { useState, useRef } from "react";

interface AddressAutocompleteInputProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  onPlaceChanged?: () => void;
  onLoad?: (autocompleteInstance: google.maps.places.Autocomplete) => void;
}

export function AddressAutocompleteInput({
  placeholder = "Enter address...",
  className,
  value,
  onChange,
  onPlaceChanged,
  onLoad,
}: AddressAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Apply the fix for dialog interaction
  useGoogleAutocompleteFix();

  return (
    <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={className}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Autocomplete>
  );
}
