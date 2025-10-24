export namespace backend {
	
	export class LoggingConfig {
	    level: string;
	    enableColors: boolean;
	    enableFile: boolean;
	    enableConsole: boolean;
	    logDir: string;
	    maxFileSize: number;
	    maxFiles: number;
	
	    static createFrom(source: any = {}) {
	        return new LoggingConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.level = source["level"];
	        this.enableColors = source["enableColors"];
	        this.enableFile = source["enableFile"];
	        this.enableConsole = source["enableConsole"];
	        this.logDir = source["logDir"];
	        this.maxFileSize = source["maxFileSize"];
	        this.maxFiles = source["maxFiles"];
	    }
	}
	export class SecurityConfig {
	    validateFilePaths: boolean;
	    allowedExtensions: string[];
	    blockUnsafePaths: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SecurityConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.validateFilePaths = source["validateFilePaths"];
	        this.allowedExtensions = source["allowedExtensions"];
	        this.blockUnsafePaths = source["blockUnsafePaths"];
	    }
	}
	export class PerformanceConfig {
	    chunkSize: number;
	    maxWorkers: number;
	    bufferPoolSize: number;
	    progressInterval: number;
	
	    static createFrom(source: any = {}) {
	        return new PerformanceConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chunkSize = source["chunkSize"];
	        this.maxWorkers = source["maxWorkers"];
	        this.bufferPoolSize = source["bufferPoolSize"];
	        this.progressInterval = source["progressInterval"];
	    }
	}
	export class FileSizeLimits {
	    maxImageSize: number;
	    maxZipSize: number;
	    maxGeneralFile: number;
	    enableSizeCheck: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileSizeLimits(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.maxImageSize = source["maxImageSize"];
	        this.maxZipSize = source["maxZipSize"];
	        this.maxGeneralFile = source["maxGeneralFile"];
	        this.enableSizeCheck = source["enableSizeCheck"];
	    }
	}
	export class AppConfig {
	    fileSizeLimits: FileSizeLimits;
	    performance: PerformanceConfig;
	    security: SecurityConfig;
	    logging: LoggingConfig;
	
	    static createFrom(source: any = {}) {
	        return new AppConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fileSizeLimits = this.convertValues(source["fileSizeLimits"], FileSizeLimits);
	        this.performance = this.convertValues(source["performance"], PerformanceConfig);
	        this.security = this.convertValues(source["security"], SecurityConfig);
	        this.logging = this.convertValues(source["logging"], LoggingConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
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

