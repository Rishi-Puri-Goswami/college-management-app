import Imagekit from "imagekit";
import dotenv from "dotenv";

dotenv.config({
    path : "../.env"
});
console.log(process.env.IMAGEKIT_PUBLIC_KEY , "image kit");
const imagekit = new Imagekit({

    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGE_KIT_URL_ENDPOINT

})


const imageauth = (req , res)=>{
    try {
        const result = imagekit.getAuthenticationParameters()
return res.status(200).josn({message : "valid user" , result});
    } catch (error) {
        console.log("error on imagekit auth" , error);
    }
}

export default imageauth;



