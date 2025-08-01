import mongoose, { Schema } from "mongoose";

const StudentSchema = new Schema({

    name: {
        type: String,
        require: true
    },
    phoneno: {
        type: String,
        require: true
    },
    pass: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    fatherno: {
        type: String,
        require: true
    },
    motherno: {
        type: String,
        require: true
    },
    registration: {
        type: String,
        require: true
    },
    hosteller: {
        type: String,
        require: true
    },
    hostelno: {
        type: String,
    }
    ,

    roomno: {
        type: String
    }

    ,

    batchname: {
        type: String,
        require: true
    },
    section: {
        type: String,
        require: true
    }
    ,
    sem: {
        type: String,
        require: true
    },

    addentance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AttendanceHistory"
    },
    
    classid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class"
    }

}, { timestamps: true })

export const Student = mongoose.model("Student", StudentSchema);


