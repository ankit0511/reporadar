import mongoose from "mongoose"

const connectDB = async ()=>{
    try {
        mongoose.connection.on("connected",()=>{
            console.log("✓ Mongoose Connected Successfully")
        })

        mongoose.connection.on("error",(error)=>{
            console.error("✗ MongoDB Error:", error.message)
        })

        mongoose.connection.on("disconnect", ()=>{
            console.warn("⚠ MongoDB Disconnected")
        })

        console.log("Attempting to connect to MongoDB...")
        await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
            dbName: "reporadar",
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
        })
    } catch (error) {
        console.error("✗ MongoDB Connection Failed:", error.message)
        console.error("Connection String:", process.env.MONGO_CONNECTION_STRING?.substring(0, 50) + "...")
        process.exit(1)
    }
}

export default connectDB


