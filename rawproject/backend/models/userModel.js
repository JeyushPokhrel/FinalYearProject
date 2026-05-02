import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },

     password:{
        type:String,
        required:true,
    },
     role:{
        type:String,
        required:true,
    },
    preferences: {
        topics: {
            type: [String],
            default: []
        },
        notifications: {
            type: [String],
            default: []
        },
        language: {
            type: String,
            default: 'en'
        },
        theme: {
            type: String,
            default: 'light'
        }
    },
    freeQuestions: {
        type: Number,
        default: 3
    },
    totalQuestions: {
        type: Number,
        default: 0
    }
});
export default mongoose.model("User", userSchema);