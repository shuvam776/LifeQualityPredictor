/**
 * City seed list — used for initial DB population and to patch missing state/country.
 * All cities use the state/country names exactly as required by the IQAir API.
 */
export const cities = [
  { city: "Kolkata",      state: "West Bengal",       country: "India", latitude: 22.5726,  longitude: 88.3639  },
  { city: "Delhi",        state: "Delhi",              country: "India", latitude: 28.6139,  longitude: 77.2090  },
  { city: "Mumbai",       state: "Maharashtra",        country: "India", latitude: 19.0760,  longitude: 72.8777  },
  { city: "Bangalore",    state: "Karnataka",          country: "India", latitude: 12.9716,  longitude: 77.5946  },
  { city: "Chennai",      state: "Tamil Nadu",         country: "India", latitude: 13.0827,  longitude: 80.2707  },
  { city: "Hyderabad",    state: "Telangana",          country: "India", latitude: 17.3850,  longitude: 78.4867  },
  { city: "Pune",         state: "Maharashtra",        country: "India", latitude: 18.5204,  longitude: 73.8567  },
  { city: "Ahmedabad",    state: "Gujarat",            country: "India", latitude: 23.0225,  longitude: 72.5714  },
  { city: "Jaipur",       state: "Rajasthan",          country: "India", latitude: 26.9124,  longitude: 75.7873  },
  { city: "Lucknow",      state: "Uttar Pradesh",      country: "India", latitude: 26.8467,  longitude: 80.9462  },
  { city: "Bhopal",       state: "Madhya Pradesh",     country: "India", latitude: 23.2599,  longitude: 77.4126  },
  { city: "Indore",       state: "Madhya Pradesh",     country: "India", latitude: 22.7196,  longitude: 75.8577  },
  { city: "Patna",        state: "Bihar",              country: "India", latitude: 25.5941,  longitude: 85.1376  },
  { city: "Chandigarh",   state: "Chandigarh",         country: "India", latitude: 30.7333,  longitude: 76.7794  },
  { city: "Kochi",        state: "Kerala",             country: "India", latitude: 9.9312,   longitude: 76.2673  },
  { city: "Visakhapatnam",state: "Andhra Pradesh",     country: "India", latitude: 17.6868,  longitude: 83.2185  },
  { city: "Surat",        state: "Gujarat",            country: "India", latitude: 21.1702,  longitude: 72.8311  },
  { city: "Nagpur",       state: "Maharashtra",        country: "India", latitude: 21.1458,  longitude: 79.0882  },
  { city: "Bhubaneswar",  state: "Odisha",             country: "India", latitude: 20.2961,  longitude: 85.8245  },
  { city: "Bengaluru",    state: "Karnataka",          country: "India", latitude: 12.9716,  longitude: 77.5946  },
];

/** Lookup map: city name → seed data */
export const citySeedMap = new Map(cities.map((c) => [c.city.toLowerCase(), c]));