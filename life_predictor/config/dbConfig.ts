import mongoose from "mongoose";

export async function connectDB() {
    try{
        if(mongoose.connection.readyState >= 1){
            return ;
        }
        if(!process.env.MONGODB_URI){
            throw new Error("No env for mongodb");
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");
    }catch(err){
        console.log("ERROR LOL :",err);
        throw err;
    }
}