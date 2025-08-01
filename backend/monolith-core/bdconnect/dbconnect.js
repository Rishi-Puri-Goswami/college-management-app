import mongoose from "mongoose"

const dbconnect = async ()=>{
    try {
        console.log(process.env.MONGODB_URI);
        const connectdb = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`MongoDB connectedsuccesfully:-  ${connectdb.connection.host}`);
    } catch (error) {
        console.log(`Error is:::-> ` ,error);
        process.exit(1)
    }
}

export default dbconnect;









