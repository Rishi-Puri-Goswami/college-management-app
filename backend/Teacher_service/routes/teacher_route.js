import express, { Router } from "express";
import { deleatenotes, give_lab_attendance, giveattendancesub, loginTeacher, registerteacher, show_perticular_class, uploadnotes } from "../teacher_Controler/teacher_control.js";
import { verifyteacher } from "../middlewares/teacher_middleware.js";
import imageauth from "../utils/imagekit.js";

const teacherroutes = Router();

teacherroutes.route('/register').post(registerteacher);
teacherroutes.route('/login').post(loginTeacher);
teacherroutes.route('/show_perticular_class').get(verifyteacher ,show_perticular_class);
teacherroutes.route('/giveattendancesub').post(verifyteacher ,giveattendancesub);
teacherroutes.route("/give_lab_attendance").post( verifyteacher , give_lab_attendance);
teacherroutes.route("/imageauth").get( verifyteacher , imageauth);
teacherroutes.route("/uploadnotes/:classid").post( verifyteacher , uploadnotes);
teacherroutes.route("/deleatenotes/:classid/:notesid").get( verifyteacher , deleatenotes);

export default teacherroutes;







