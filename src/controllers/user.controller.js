import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async(req,res)=>{
    const {fullName,email,userName,password} = req.body

    if([fullName,email,userName,password].some((field)=>{
        field?.trim() === ""
    })){
      throw new ApiError(400,"All fields are required")  
    }

  const existedUser = await User.findOne({
        $or:[{ userName },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }

  const avatarLocalPath =   req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.length > 0 ? req.files?.coverImage[0].path:null;

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
  }

    const avatar =  await uploadOnCloudinary(avatarLocalPath) 
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

  const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        userName:userName.toLowerCase()
    })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )
   if(!createdUser){
    throw new ApiError(500,"Something went wrong while register")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User  registered successfully ")
   )
})


export {registerUser}



