import { Externalized, LoginData } from "./user.type";

export class UserSingleton implements LoginData {

  public roles:string[] = [];
  public enabled:boolean = false;
  public mustChangePassword:boolean = false;
  public _id:string = "";
  public email:string = "";
  public civilite:string = "";
  public nom:string = "";
  public prenom:string = "";
  public externalized:Externalized = {
    idNir: ""
  };
  public updatedAt:string = "";
  public token:string = "";
  public refreshToken:string ="";
  
  private static instance: UserSingleton;
  private responseData: any | null = null;

  private constructor(data:LoginData) {
    // Initialize the instance with user data from the response
    Object.assign(this, data);
  }

  static getInstance(data:LoginData|undefined =undefined): UserSingleton {
    if (!UserSingleton.instance||!!data ) {
      UserSingleton.instance = new UserSingleton(data as LoginData );
    }
    return UserSingleton.instance;
  }



  // Getter method to retrieve the entire response data
  getResponseData(): any | null {
    return this.responseData;
  }
}

export default UserSingleton;
