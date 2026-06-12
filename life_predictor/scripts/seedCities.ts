import mongoose from "mongoose";
import City from "@/models/City";
import "@/config/envConfig"
async function seedCities() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const now = new Date();

  const cities = [
    { name: "Kolkata", latitude: 22.5726, longitude: 88.3639, district: "Kolkata" },
    { name: "Delhi", latitude: 28.6139, longitude: 77.2090, district: "New Delhi" },
    { name: "Mumbai", latitude: 19.0760, longitude: 72.8777, district: "Mumbai" },
    { name: "Bengaluru", latitude: 12.9716, longitude: 77.5946, district: "Bangalore Urban" },
    { name: "Hyderabad", latitude: 17.3850, longitude: 78.4867, district: "Hyderabad" },
    { name: "Chennai", latitude: 13.0827, longitude: 80.2707, district: "Chennai" },
    { name: "Pune", latitude: 18.5204, longitude: 73.8567, district: "Pune" },
    { name: "Ahmedabad", latitude: 23.0225, longitude: 72.5714, district: "Ahmedabad" },
    { name: "Jaipur", latitude: 26.9124, longitude: 75.7873, district: "Jaipur" },
    { name: "Lucknow", latitude: 26.8467, longitude: 80.9462, district: "Lucknow" },
    { name: "Bhopal", latitude: 23.2599, longitude: 77.4126, district: "Bhopal" },
    { name: "Indore", latitude: 22.7196, longitude: 75.8577, district: "Indore" },
    { name: "Patna", latitude: 25.5941, longitude: 85.1376, district: "Patna" },
    { name: "Chandigarh", latitude: 30.7333, longitude: 76.7794, district: "Chandigarh" },
    { name: "Kochi", latitude: 9.9312, longitude: 76.2673, district: "Ernakulam" },
    { name: "Visakhapatnam", latitude: 17.6868, longitude: 83.2185, district: "Visakhapatnam" },
    { name: "Surat", latitude: 21.1702, longitude: 72.8311, district: "Surat" },
    { name: "Nagpur", latitude: 21.1458, longitude: 79.0882, district: "Nagpur" },
    { name: "Mysuru", latitude: 12.2958, longitude: 76.6394, district: "Mysore" },
    { name: "Bhubaneswar", latitude: 20.2961, longitude: 85.8245, district: "Khordha" }
  ].map((city) => ({ ...city, createdAt: now, updatedAt: now }));

  await City.deleteMany({});

  await City.insertMany(cities);

  console.log("20 cities seeded");

  process.exit();
}

seedCities();