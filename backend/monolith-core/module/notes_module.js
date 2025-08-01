import mongoose, {Schema } from "mongoose"
const notesSchema = new Schema({

    classid : {
type : mongoose.Schema.Types.ObjectId,
ref : "Class",
required : true
    }
    ,
    teacher:{
        name : String,
        phonoNo : String,
        image :String
    },
    pdfurl :{
        type : String
    },
    message : {
        type : String
    },

    
}, {timestamps:true})

export const Note = mongoose.model("Note" , notesSchema);




