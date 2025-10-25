'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface AddressComponent {
  street?: string;
  neighborhood?: string;
  city?: string;
  district?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  addressComponents: AddressComponent;
}

interface PropertyMapSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (locationData: LocationData) => void;
  initialLocation?: {
    lat: number;
    lng: number;
  };
}

// Get Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const containerStyle = {
  width: '100%',
  height: '500px'
};

// Default center (Rwanda - Kigali)
const defaultCenter = {
  lat: -1.9403,
  lng: 29.8739
};

const PropertyMapSelector: React.FC<PropertyMapSelectorProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation
}) => {
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(initialLocation || defaultCenter);
  const [address, setAddress] = useState<string>('');
  const [addressComponents, setAddressComponents] = useState<AddressComponent>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Get user's current location on mount
  useEffect(() => {
    if (isOpen && !initialLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setMapCenter(userLocation);
          },
          (error) => {
            console.error('Error getting user location:', error);
            // Fallback to default location (Kigali, Rwanda)
          }
        );
      }
    }
  }, [isOpen, initialLocation]);

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError('');

    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng }
      });

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const formattedAddress = result.formatted_address;

        // Parse address components
        const components: AddressComponent = {};
        result.address_components.forEach((component) => {
          const types = component.types;

          if (types.includes('street_number') || types.includes('route')) {
            components.street = components.street
              ? `${component.long_name} ${components.street}`
              : component.long_name;
          }
          if (types.includes('sublocality') || types.includes('neighborhood')) {
            components.neighborhood = component.long_name;
          }
          if (types.includes('locality')) {
            components.city = component.long_name;
          }
          if (types.includes('administrative_area_level_2')) {
            components.district = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            components.region = component.long_name;
          }
          if (types.includes('country')) {
            components.country = component.long_name;
          }
          if (types.includes('postal_code')) {
            components.postalCode = component.long_name;
          }
        });

        setAddress(formattedAddress);
        setAddressComponents(components);
      } else {
        setError('Unable to find address for this location');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('Failed to fetch address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle map click
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setSelectedPosition({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, [reverseGeocode]);

  // Handle confirm location
  const handleConfirmLocation = () => {
    if (selectedPosition) {
      const locationData: LocationData = {
        latitude: selectedPosition.lat,
        longitude: selectedPosition.lng,
        address: address,
        addressComponents: addressComponents
      };

      onLocationSelect(locationData);
      onClose();
    }
  };

  // Handle map load
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select Property Location</h2>
              <p className="text-sm text-gray-600 mt-1">
                Click or tap on the map to select the exact property location
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Map Container */}
          <div className="p-6">
            <div className="rounded-xl overflow-hidden border-2 border-gray-200">
              {GOOGLE_MAPS_API_KEY ? (
                <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={mapCenter}
                    zoom={15}
                    onClick={onMapClick}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: true,
                      fullscreenControl: false,
                      zoomControl: true,
                      gestureHandling: 'greedy',
                    }}
                  >
                    {selectedPosition && (
                      <Marker
                        position={selectedPosition}
                        animation={google.maps.Animation.DROP}
                      />
                    )}
                  </GoogleMap>
                </LoadScript>
              ) : (
                <div className="flex items-center justify-center h-[500px] bg-gray-100">
                  <div className="text-center px-4 max-w-md">
                    <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Maps API Key Required</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      To use Google Maps, you need to add your API key to the environment variables.
                    </p>
                    <div className="bg-white border border-gray-300 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Steps to get your FREE API key:</p>
                      <ol className="text-xs text-left text-gray-600 space-y-1">
                        <li>1. Go to <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" className="text-blue-600 underline">Google Cloud Console</a></li>
                        <li>2. Create a project or select existing one</li>
                        <li>3. Enable "Maps JavaScript API" & "Geocoding API"</li>
                        <li>4. Create credentials → API Key</li>
                        <li>5. Copy the key</li>
                      </ol>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-left">
                      <p className="text-xs text-gray-400 mb-1">Add to .env.local:</p>
                      <code className="text-xs text-green-400 font-mono">
                        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 italic">
                      Google offers $200 free credit/month (enough for ~28,000 map loads)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Location Info */}
            {selectedPosition && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Selected Location</h4>

                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">Fetching address from Google Maps...</span>
                      </div>
                    ) : error ? (
                      <p className="text-sm text-red-600">{error}</p>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500">Address:</span>
                            <p className="text-sm text-gray-900">{address || 'Loading...'}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium text-gray-500">Latitude:</span>
                              <p className="text-gray-900">{selectedPosition.lat.toFixed(6)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Longitude:</span>
                              <p className="text-gray-900">{selectedPosition.lng.toFixed(6)}</p>
                            </div>
                          </div>

                          {Object.keys(addressComponents).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <span className="text-xs font-medium text-gray-500 block mb-2">Address Details:</span>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {addressComponents.street && (
                                  <div>
                                    <span className="font-medium text-gray-500">Street:</span>
                                    <p className="text-gray-900">{addressComponents.street}</p>
                                  </div>
                                )}
                                {addressComponents.neighborhood && (
                                  <div>
                                    <span className="font-medium text-gray-500">Neighborhood:</span>
                                    <p className="text-gray-900">{addressComponents.neighborhood}</p>
                                  </div>
                                )}
                                {addressComponents.city && (
                                  <div>
                                    <span className="font-medium text-gray-500">City:</span>
                                    <p className="text-gray-900">{addressComponents.city}</p>
                                  </div>
                                )}
                                {addressComponents.district && (
                                  <div>
                                    <span className="font-medium text-gray-500">District:</span>
                                    <p className="text-gray-900">{addressComponents.district}</p>
                                  </div>
                                )}
                                {addressComponents.region && (
                                  <div>
                                    <span className="font-medium text-gray-500">Region:</span>
                                    <p className="text-gray-900">{addressComponents.region}</p>
                                  </div>
                                )}
                                {addressComponents.country && (
                                  <div>
                                    <span className="font-medium text-gray-500">Country:</span>
                                    <p className="text-gray-900">{addressComponents.country}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instruction */}
            {!selectedPosition && GOOGLE_MAPS_API_KEY && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Click or tap anywhere on the map to mark the exact location of your property.
                    Google Maps will automatically detect the coordinates and address.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmLocation}
              disabled={!selectedPosition || isLoading || !GOOGLE_MAPS_API_KEY}
              className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${
                selectedPosition && !isLoading && GOOGLE_MAPS_API_KEY
                  ? 'bg-[#083A85] hover:bg-[#0a4499]'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMapSelector;
