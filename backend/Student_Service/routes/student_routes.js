import { Router } from "express";
import { calculateattendance, login, registerstudent } from "../student_controler/student_controler.js";
import { verifystudent } from "../middleware/authstudent.js";

const studentroutes = Router()

studentroutes.route("/registerstudent").post(registerstudent);
studentroutes.route("/login").post(login);

studentroutes.route("/calculateattendance").post( verifystudent , calculateattendance);

export default studentroutes ;
