import {AuthService} from "./auth.service.js";
import {EnvConfig} from "../../config/env.js";
class AuthController {
constructor(authService) {
   this.authService = new AuthService();

}

async GoogleCallBack(req,res){
const {user}=await this.authService.createUser(req.body)
res.cookie("accessToken",user.accessToken,{
httpOnly:true,
secure:EnvConfig.get("NODE_ENV")==="production",
sameSite:"strict",
maxAge:24*60*60*1000
})
res.cookie("refreshToken",user.refreshToken,{
httpOnly:true,
secure:EnvConfig.get("NODE_ENV")==="production",
sameSite:"strict",
maxAge:7*24*60*60*1000
})
res.redirect(`${EnvConfig.get("FRONTEND_URL")}/auth/success?accessToken=${user.accessToken}&refreshToken=${user.refreshToken}`)
}
}


export { AuthController };
export default AuthController;
