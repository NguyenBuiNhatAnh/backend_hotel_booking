import mongoose from "mongoose"

const connectDatabase = async () => {

    mongoose.connection.on('connected', () => {
        try {
            console.log('Database connected!');
        } catch (error) {
            console.log(error);
        }
    })

    await mongoose.connect(`${process.env.MONGODB_URL}/hotel_booking`);

}

export default connectDatabase;