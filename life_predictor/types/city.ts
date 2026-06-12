export interface city {
    id? : string,
    city : string,
    aqi : number,
    crime_rate : number,
    hospital_density : number,
    school_density : number,
    internet_score : number,
    employment_rate : number,
    green_cover : number,
    cost_of_living : number,
    population_density : number,
    livability_score : number,
    createdAt?:Date,
    updatedAt?: Date
}