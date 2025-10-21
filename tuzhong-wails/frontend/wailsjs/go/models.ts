export namespace backend {
	
	export class TuzhongInfo {
	    imageSize: number;
	    hiddenSize: number;
	    totalSize: number;
	    imageFormat: string;
	    hiddenFiles: string[];
	    isValid: boolean;
	    errorMessage: string;
	
	    static createFrom(source: any = {}) {
	        return new TuzhongInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.imageSize = source["imageSize"];
	        this.hiddenSize = source["hiddenSize"];
	        this.totalSize = source["totalSize"];
	        this.imageFormat = source["imageFormat"];
	        this.hiddenFiles = source["hiddenFiles"];
	        this.isValid = source["isValid"];
	        this.errorMessage = source["errorMessage"];
	    }
	}

}

