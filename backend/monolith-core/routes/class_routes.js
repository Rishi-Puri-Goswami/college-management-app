import express from "express";
import { createclass } from "../controler/class_controler.js";


const classroute = express.Router();

classroute.route("/createclass").post(createclass)

export {classroute};
