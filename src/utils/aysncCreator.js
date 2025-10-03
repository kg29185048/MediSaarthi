
const asyncCreator = (fn) => {
    (req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch((err)=>next(err));
    }
};

export default asyncCreator;


// const asyncCreator = async (fn)=>(req,res,next)=>{ // higher order fn
//         try{
//             await fn(req,res,next);
//         }
//         catch(err){
//             res.status(err.code || 400).json({
//                 success: false,
//                 message: err.message,
//             })
//         }
// }
