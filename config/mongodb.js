import mongoose from "mongoose"

const connectDatabase = async () => {

    mongoose.connection.on('connected', () => {
        try {
            console.log('Database connected!');
        } catch (error) {
            console.log(error);
        }
    })

    await mongoose.connect(process.env.MONGODB_URL, {
        dbName: "hotel_booking",
        readPreference: "primary"   // truyền qua option, không phải URL
    });

}

export default connectDatabase;