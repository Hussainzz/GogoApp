const mongoose = require('mongoose');
const db = process.env.DB_URI;

const connectDB = async (callback) => {
    try {
       await mongoose.connect(db,{
            useNewUrlParser:true,
            useUnifiedTopology:true,
            useCreateIndex:true,
            useFindAndModify:false
        })
        console.log('DB Connected');
        return callback();
    } catch (error) {
        
    }
}

module.exports = connectDB;