import { Router } from "express";
import { attendance } from "../controler/attendance.js";

const attendancerouter = Router();

attendancerouter.route("/attendance").post(attendance);

export default attendancerouter;
