"use client";
import React from 'react'
import { useState,useEffect } from 'react';

function page() {
  const [cities,setCities] = useState([]);
  useEffect(()=>{
    const getCities = async()=>{
      const response = await fetch("/api/cities");
      const data = await response.json();
      setCities(data);
    }
    getCities();
  },[]);
  return (
    <div>
      {cities.map((city:any)=>(
        <div key={city._id}>
          <h1>{city.name}</h1>
          <p>{city.score}</p>
        </div>
      ))}
    </div>
  )
}

export default page
