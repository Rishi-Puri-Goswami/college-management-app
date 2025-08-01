import mongoose, {Schema } from "mongoose"
const ExamSchema = new Schema({

    studentid : {
type : mongoose.Schema.Types.ObjectId,
ref : "Student",
required : true
    }
    ,
    teacherid :{
        type : mongoose.Schema.Types.ObjectId,
ref : "Teacher"

    },
    pdfurl :{
        type : String
    },
    message : [{
        subjectname : String ,
        marks : Number,
        text :String
    }],
}, {timestamps:true})

export const Exam = mongoose.model("Exam" , ExamSchema);





