export async function getWeather(
    latitude : number,
    longitude : number,
){
  try{
    const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m`
  )
  return response.json();
  }
  catch(err){
    console.log("Error",err);
  }
}