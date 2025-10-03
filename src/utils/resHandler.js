class resHandler{
    constructor(statusCode,data,message="success"){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400; //industry standard
    }
}

export {resHandler};