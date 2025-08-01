import mongoose, { Schema } from "mongoose";

const teacherSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    pass: {
        type: String,
        required: true
    },
    phoneno: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },

    teacherid: {
        type: String,
        required: true
    },
    subject: [{
        type: String,
        required: true
    }],
    role: {
        type: String,
        default: "teacher"
    },
    classid: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class"
    }],
    labs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class"
        }
    ]
}, { timestamps: true });


export const Teacher = mongoose.model("Teacher", teacherSchema);
