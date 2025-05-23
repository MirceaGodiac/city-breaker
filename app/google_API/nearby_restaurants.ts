import { Client, PlaceType1 } from "@googlemaps/google-maps-services-js";

const GOOGLE_MAPS_API_KEY = 'AIzaSyA9p8_jce6LBPwXB_BoHOMosBaLo85yeF8';
const client = new Client({});

interface NearbyPlace {
  name: string;
  rating?: number;
  address: string;
  placeId: string;
  types: string[];
  openNow?: boolean;
}

export async function findNearbyPlaces(locationName: string): Promise<NearbyPlace[]> {
  try {
    // First, geocode the location name to get coordinates
    const geocodeResponse = await client.geocode({
      params: {
        address: locationName,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (!geocodeResponse.data.results[0]) {
      throw new Error('Location not found');
    }

    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;

    // Then search for nearby places
    const placesResponse = await client.placesNearby({
      params: {
        location: { lat, lng },
        radius: 1000, // 1km radius
        type: PlaceType1.restaurant,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    return placesResponse.data.results.map(place => ({
      name: place.name || 'Unknown',
      rating: place.rating,
      address: place.vicinity || 'No address available',
      placeId: place.place_id || '',
      types: place.types || [],
      openNow: place.opening_hours?.open_now
    }));

  } catch (error) {
    console.error('Error finding nearby places:', error);
    throw error;
  }
}
8                                                                                                                                            