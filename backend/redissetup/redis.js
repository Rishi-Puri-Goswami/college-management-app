import redis from "ioredis";

const clint = new redis({db:2});
export const RETRY_LIST_ATTENDANCE = 'attendance:retry';
export const RETRY_LIST_GIVE_ATTENDANCE = 'giveattendance:retry';
export const RETRY_LIST_PUSHSTUDENT = 'student:retry';
export const RETRY_LIST_TEACHERLIST = 'teacher:retry';

export default clint ;












