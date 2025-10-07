import multer from "multer";

//we are using disk storage not memory storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp") //the will be kept in this folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)  //saving with original name
  }
})

export const upload = multer({storage})