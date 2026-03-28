import mongoose from "mongoose"

const connectDB = async ()=>{
    try {
        mongoose.connection.on("connected",()=>{
            console.log("Mongoose Connected Successfully")
        })
        mongoose.connection.on("error",()=>{
            console.log("Error connecting to the Db")
        })

        mongoose.connection.on("disconnect", ()=>{
            console.log("disconnected ")
        })
        await mongoose.connect(process.env.MONGO_CONNECTION_STRING,{dbName : "reporadar",})
    } catch (error) {
        console.log("Error Connecting to the db ", error )
        process.exit(1)
    }
}

export default connectDB


