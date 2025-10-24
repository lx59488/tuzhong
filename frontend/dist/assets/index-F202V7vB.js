(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function n(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=n(i);fetch(i.href,o)}})();const B={USER:"user",VALIDATION:"validation",SYSTEM:"system",IO:"io",NETWORK:"network"},l={FILE_NOT_FOUND:"FILE_NOT_FOUND",FILE_PERMISSION:"FILE_PERMISSION",FILE_CORRUPTED:"FILE_CORRUPTED",FILE_TOO_LARGE:"FILE_TOO_LARGE",INVALID_FORMAT:"INVALID_FORMAT",INVALID_PATH:"INVALID_PATH",IMAGE_INVALID:"IMAGE_INVALID",IMAGE_UNSUPPORTED:"IMAGE_UNSUPPORTED",IMAGE_CORRUPTED:"IMAGE_CORRUPTED",ZIP_INVALID:"ZIP_INVALID",ZIP_CORRUPTED:"ZIP_CORRUPTED",ZIP_TOO_LARGE:"ZIP_TOO_LARGE",ZIP_EXTRACT_FAILED:"ZIP_EXTRACT_FAILED",MEMORY_EXHAUSTED:"MEMORY_EXHAUSTED",DISK_FULL:"DISK_FULL",TIMEOUT:"TIMEOUT",CANCELLED:"CANCELLED",INVALID_INPUT:"INVALID_INPUT",OPERATION_FAILED:"OPERATION_FAILED",UNSUPPORTED_OPERATION:"UNSUPPORTED_OPERATION"},E={INFO:"info",WARNING:"warning",ERROR:"error",CRITICAL:"critical"};class q extends Error{constructor(e,n,s=B.USER,i=null){super(n),this.name="AppError",this.code=e,this.type=s,this.details=i,this.timestamp=Date.now(),this.context={},this.level=this.determineLevel()}withContext(e,n){return this.context[e]=n,this}withDetails(e){return this.details=e,this}determineLevel(){return this.type===B.SYSTEM?E.CRITICAL:this.type===B.IO?E.ERROR:this.type===B.VALIDATION?E.WARNING:E.INFO}toJSON(){return{code:this.code,message:this.message,type:this.type,level:this.level,details:this.details,timestamp:this.timestamp,context:this.context,stack:this.stack}}getUserFriendlyMessage(){return De[this.code]||this.message}}const De={[l.FILE_NOT_FOUND]:"找不到指定的文件",[l.FILE_PERMISSION]:"没有文件访问权限",[l.FILE_CORRUPTED]:"文件已损坏",[l.FILE_TOO_LARGE]:"文件太大",[l.INVALID_FORMAT]:"文件格式不支持",[l.INVALID_PATH]:"文件路径无效",[l.IMAGE_INVALID]:"无效的图片文件",[l.IMAGE_UNSUPPORTED]:"不支持的图片格式",[l.IMAGE_CORRUPTED]:"图片文件已损坏",[l.ZIP_INVALID]:"无效的压缩文件",[l.ZIP_CORRUPTED]:"压缩文件已损坏",[l.ZIP_TOO_LARGE]:"压缩文件太大",[l.ZIP_EXTRACT_FAILED]:"解压文件失败",[l.MEMORY_EXHAUSTED]:"内存不足",[l.DISK_FULL]:"磁盘空间不足",[l.TIMEOUT]:"操作超时",[l.CANCELLED]:"操作已取消",[l.INVALID_INPUT]:"输入无效",[l.OPERATION_FAILED]:"操作失败",[l.UNSUPPORTED_OPERATION]:"不支持的操作"};class Ue{constructor(e=50){this.errors=[],this.maxEntries=e,this.listeners=[]}logError(e,n={}){const s={error:e instanceof q?e.toJSON():{message:e.message,stack:e.stack,timestamp:Date.now()},context:{url:window.location.href,userAgent:navigator.userAgent,timestamp:Date.now(),...n}};this.errors.push(s),this.errors.length>this.maxEntries&&this.errors.shift(),this.saveToLocalStorage(),this.notifyListeners(s)}getRecentErrors(e=10){return this.errors.slice(-e)}clearErrors(){this.errors=[],this.saveToLocalStorage()}addListener(e){this.listeners.push(e)}removeListener(e){const n=this.listeners.indexOf(e);n>-1&&this.listeners.splice(n,1)}notifyListeners(e){this.listeners.forEach(n=>{try{n(e)}catch(s){console.error("Error in error listener:",s)}})}saveToLocalStorage(){try{localStorage.setItem("errorLogs",JSON.stringify(this.errors))}catch(e){console.warn("Failed to save error logs to localStorage:",e)}}loadFromLocalStorage(){try{const e=localStorage.getItem("errorLogs");e&&(this.errors=JSON.parse(e))}catch(e){console.warn("Failed to load error logs from localStorage:",e),this.errors=[]}}exportErrors(){return JSON.stringify(this.errors,null,2)}}class _e{constructor(){this.container=null,this.currentToasts=[],this.maxToasts=5,this.defaultDuration=5e3,this.init()}init(){this.container=document.createElement("div"),this.container.id="error-toast-container",this.container.className="error-toast-container",this.container.style.cssText=`
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `,document.body.appendChild(this.container),this.addStyles()}addStyles(){const e=document.createElement("style");e.textContent=`
            .error-toast {
                background: #fff;
                border-left: 4px solid #e74c3c;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                padding: 16px;
                animation: slideInRight 0.3s ease-out;
                position: relative;
                max-width: 100%;
                word-wrap: break-word;
            }
            
            .error-toast.warning {
                border-left-color: #f39c12;
            }
            
            .error-toast.info {
                border-left-color: #3498db;
            }
            
            .error-toast.critical {
                border-left-color: #8e44ad;
                background: #fdebf7;
            }
            
            .error-toast-header {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .error-toast-message {
                font-size: 13px;
                color: #666;
                line-height: 1.4;
            }
            
            .error-toast-details {
                font-size: 12px;
                color: #999;
                margin-top: 8px;
                font-family: monospace;
                background: #f8f8f8;
                padding: 8px;
                border-radius: 3px;
                max-height: 100px;
                overflow-y: auto;
            }
            
            .error-toast-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
                padding: 0;
                margin-left: 10px;
            }
            
            .error-toast-close:hover {
                color: #666;
            }
            
            .error-toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: #e74c3c;
                transition: width linear;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `,document.head.appendChild(e)}showError(e,n={}){const{duration:s=this.defaultDuration,showDetails:i=!1,persistent:o=!1}=n;this.currentToasts.length>=this.maxToasts&&this.removeToast(this.currentToasts[0]);const r=this.createToast(e,{duration:s,showDetails:i,persistent:o});return this.container.appendChild(r),this.currentToasts.push(r),!o&&s>0&&setTimeout(()=>{this.removeToast(r)},s),r}createToast(e,n){const s=document.createElement("div");s.className=`error-toast ${e.level||"error"}`;const i=document.createElement("div");i.className="error-toast-header",i.innerHTML=`
            <span>${e.code||"ERROR"}</span>
            <button class="error-toast-close">&times;</button>
        `;const o=document.createElement("div");if(o.className="error-toast-message",o.textContent=e.getUserFriendlyMessage?e.getUserFriendlyMessage():e.message,s.appendChild(i),s.appendChild(o),n.showDetails&&e.details){const a=document.createElement("div");a.className="error-toast-details",a.textContent=e.details,s.appendChild(a)}if(!n.persistent&&n.duration>0){const a=document.createElement("div");a.className="error-toast-progress",a.style.width="100%",s.appendChild(a),setTimeout(()=>{a.style.transition=`width ${n.duration}ms linear`,a.style.width="0%"},10)}return i.querySelector(".error-toast-close").addEventListener("click",()=>{this.removeToast(s)}),s}removeToast(e){!e||!e.parentNode||(e.style.animation="slideOutRight 0.3s ease-in",setTimeout(()=>{e.parentNode&&e.parentNode.removeChild(e);const n=this.currentToasts.indexOf(e);n>-1&&this.currentToasts.splice(n,1)},300))}clearAll(){this.currentToasts.forEach(e=>{this.removeToast(e)})}}class qe{constructor(){this.logger=new Ue,this.displayer=new _e,this.handlers=new Map,this.globalHandler=null,this.init()}init(){this.logger.loadFromLocalStorage(),this.setupGlobalErrorHandling(),this.setupBackendErrorHandling()}setupGlobalErrorHandling(){window.addEventListener("error",e=>{console.error("JavaScript error:",e.message,"at",e.filename+":"+e.lineno),console.trace("Error trace:"),e.preventDefault()}),window.addEventListener("unhandledrejection",e=>{console.error("Unhandled promise rejection:",e.reason),console.trace("Promise rejection trace:"),e.preventDefault()})}setupBackendErrorHandling(){window.runtime&&window.runtime.EventsOn&&window.runtime.EventsOn("error",e=>{const n=new q(e.code,e.message,e.type);e.details&&n.withDetails(e.details),e.context&&Object.keys(e.context).forEach(s=>{n.withContext(s,e.context[s])}),this.handleError(n,{fromBackend:!0})})}handleError(e,n={}){this.logger.logError(e,n);const s=this.handlers.get(e.code);if(s)try{s(e,n);return}catch(i){console.error("Error in custom error handler:",i)}if(this.globalHandler)try{this.globalHandler(e,n);return}catch(i){console.error("Error in global error handler:",i)}this.displayer.showError(e,{showDetails:!1,duration:this.getDisplayDuration(e)})}getDisplayDuration(e){switch(e.level){case E.CRITICAL:return 0;case E.ERROR:return 8e3;case E.WARNING:return 5e3;default:return 3e3}}registerHandler(e,n){this.handlers.set(e,n)}unregisterHandler(e){this.handlers.delete(e)}setGlobalHandler(e){this.globalHandler=e}createError(e,n,s=B.USER){return new q(e,n,s)}getErrorStats(){const e=this.logger.getRecentErrors(100),n={total:e.length,byType:{},byCode:{},recent:e.slice(-10)};return e.forEach(s=>{const i=s.error;n.byType[i.type]=(n.byType[i.type]||0)+1,n.byCode[i.code]=(n.byCode[i.code]||0)+1}),n}}const ae=new qe;window.ErrorManager=ae;window.AppError=q;window.ErrorCodes=l;window.ErrorTypes=B;window.ErrorLevels=E;window.handleError=(t,e)=>ae.handleError(t,e);window.createError=(t,e,n)=>ae.createError(t,e,n);class Ie{constructor(){this.debounceTimers=new Map,this.throttleTimers=new Map,this.memoryMonitor=null,this.performanceMetrics={startTime:performance.now(),operations:[],memoryUsage:[]},this.initMemoryMonitoring()}debounce(e,n,s="default"){return(...i)=>{this.debounceTimers.has(s)&&clearTimeout(this.debounceTimers.get(s));const o=setTimeout(()=>{e.apply(this,i),this.debounceTimers.delete(s)},n);this.debounceTimers.set(s,o)}}throttle(e,n,s="default"){return(...i)=>{this.throttleTimers.has(s)||(e.apply(this,i),this.throttleTimers.set(s,!0),setTimeout(()=>{this.throttleTimers.delete(s)},n))}}initMemoryMonitoring(){"memory"in performance&&(this.memoryMonitor=setInterval(()=>{const e={used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit,timestamp:Date.now()};this.performanceMetrics.memoryUsage.push(e),this.performanceMetrics.memoryUsage.length>100&&this.performanceMetrics.memoryUsage.shift();const n=e.used/e.total;n>.8&&(console.warn("内存使用率过高:",(n*100).toFixed(2)+"%"),this.emitMemoryWarning(e))},5e3))}emitMemoryWarning(e){const n=new CustomEvent("memoryWarning",{detail:{usage:e,recommendations:this.getMemoryOptimizationTips()}});window.dispatchEvent(n)}getMemoryOptimizationTips(){return["关闭不需要的预览窗口","清理临时文件缓存","减少同时处理的文件数量","刷新页面释放内存"]}startOperation(e){const n={name:e,startTime:performance.now(),endTime:null,duration:null};return this.performanceMetrics.operations.push(n),this.performanceMetrics.operations.length-1}endOperation(e){if(e>=0&&e<this.performanceMetrics.operations.length){const n=this.performanceMetrics.operations[e];return n.endTime=performance.now(),n.duration=n.endTime-n.startTime,console.log(`操作 ${n.name} 耗时: ${n.duration.toFixed(2)}ms`),n.duration>1e3&&console.warn(`慢操作检测: ${n.name} 耗时 ${n.duration.toFixed(2)}ms`),n}}getPerformanceReport(){const e=performance.now()-this.performanceMetrics.startTime,n=this.performanceMetrics.operations.filter(r=>r.duration!==null),s=n.length>0?n.reduce((r,a)=>r+a.duration,0)/n.length:0,i=n.filter(r=>r.duration>1e3),o=this.getCurrentMemoryUsage();return{sessionDuration:e,totalOperations:n.length,averageOperationTime:s,slowOperations:i,currentMemory:o,memoryHistory:this.performanceMetrics.memoryUsage.slice(-10)}}getCurrentMemoryUsage(){return"memory"in performance?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit,usagePercentage:(performance.memory.usedJSHeapSize/performance.memory.totalJSHeapSize*100).toFixed(2)}:null}createVirtualList(e,n,s,i,o=5){return new He(e,n,s,i,o)}createRequestQueue(e=3){return new Ge(e)}cleanup(){this.debounceTimers.forEach(e=>clearTimeout(e)),this.debounceTimers.clear(),this.throttleTimers.clear(),this.memoryMonitor&&(clearInterval(this.memoryMonitor),this.memoryMonitor=null),console.log("性能工具已清理")}}class He{constructor(e,n,s,i,o=5){this.container=e,this.items=n,this.itemHeight=s,this.renderItem=i,this.bufferSize=o,this.scrollTop=0,this.containerHeight=e.clientHeight,this.visibleStart=0,this.visibleEnd=0,this.init()}init(){this.scrollContainer=document.createElement("div"),this.scrollContainer.style.height=`${this.items.length*this.itemHeight}px`,this.scrollContainer.style.position="relative",this.visibleContainer=document.createElement("div"),this.visibleContainer.style.position="absolute",this.visibleContainer.style.top="0",this.visibleContainer.style.width="100%",this.scrollContainer.appendChild(this.visibleContainer),this.container.appendChild(this.scrollContainer),this.container.addEventListener("scroll",this.handleScroll.bind(this)),this.updateVisibleItems()}handleScroll(){this.scrollTop=this.container.scrollTop,this.updateVisibleItems()}updateVisibleItems(){const e=this.container.clientHeight;this.visibleStart=Math.max(0,Math.floor(this.scrollTop/this.itemHeight)-this.bufferSize),this.visibleEnd=Math.min(this.items.length-1,Math.ceil((this.scrollTop+e)/this.itemHeight)+this.bufferSize),this.visibleContainer.innerHTML="";for(let n=this.visibleStart;n<=this.visibleEnd;n++){const s=this.items[n],i=this.renderItem(s,n);i.style.position="absolute",i.style.top=`${n*this.itemHeight}px`,i.style.height=`${this.itemHeight}px`,this.visibleContainer.appendChild(i)}}updateItems(e){this.items=e,this.scrollContainer.style.height=`${this.items.length*this.itemHeight}px`,this.updateVisibleItems()}}class Ge{constructor(e=3){this.maxConcurrent=e,this.currentRequests=0,this.queue=[]}add(e,n=0){return new Promise((s,i)=>{const o={fn:e,resolve:s,reject:i,priority:n,timestamp:Date.now()},r=this.queue.findIndex(a=>a.priority<n);r===-1?this.queue.push(o):this.queue.splice(r,0,o),this.processNext()})}async processNext(){if(console.log(`请求队列状态: 当前请求=${this.currentRequests}, 最大并发=${this.maxConcurrent}, 队列长度=${this.queue.length}`),this.currentRequests>=this.maxConcurrent||this.queue.length===0){console.log("跳过处理: 达到最大并发或队列为空");return}const e=this.queue.shift();this.currentRequests++,console.log(`开始处理请求, 优先级=${e.priority}, 当前活跃请求=${this.currentRequests}`);try{const n=await e.fn();console.log("请求执行成功"),e.resolve(n)}catch(n){console.error("请求执行失败:",n),e.reject(n)}finally{this.currentRequests--,console.log(`请求完成，当前活跃请求=${this.currentRequests}`),this.processNext()}}clear(){this.queue.forEach(e=>{e.reject(new Error("Request queue cleared"))}),this.queue=[]}getStatus(){return{queueSize:this.queue.length,currentRequests:this.currentRequests,maxConcurrent:this.maxConcurrent}}}window.PerformanceUtils=Ie;window.performanceUtils=new Ie;window.addEventListener("beforeunload",()=>{window.performanceUtils&&window.performanceUtils.cleanup()});const Ve="/assets/logo-universal-Dm-wv4TN.png";function $e(t){return window.go.main.App.AnalyzeTuzhong(t)}function Te(){return window.go.main.App.DisableFileSizeCheck()}function je(t,e){return window.go.main.App.ExtractFromTuzhong(t,e)}function We(t,e,n){return window.go.main.App.ExtractFromTuzhongWithInfo(t,e,n)}function Le(){return window.go.main.App.GetConfig()}function Ze(t){return window.go.main.App.GetImageBase64(t)}function Je(t,e,n){return window.go.main.App.MergeFiles(t,e,n)}function Xe(t){return window.go.main.App.OpenFileLocation(t)}function Ke(){return window.go.main.App.RemoveAllSizeLimits()}function Ye(t){return window.go.main.App.SelectExtractLocation(t)}function Qe(){return window.go.main.App.SelectFile()}function et(){return window.go.main.App.SelectFolder()}function tt(){return window.go.main.App.SelectImageFile()}function nt(t){return window.go.main.App.SelectSaveLocation(t)}function st(){return window.go.main.App.SelectTuzhongFile()}function it(){return window.go.main.App.SetImageSizeLimit1GB()}function ot(){return window.go.main.App.SetImageSizeLimit2GB()}function J(t){return window.go.main.App.UpdateFileSizeLimits(t)}function rt(t,e,n){return window.runtime.EventsOnMultiple(t,e,n)}function Be(t,e){return rt(t,e,-1)}function ge(){window.runtime.WindowSetLightTheme()}function he(){window.runtime.WindowSetDarkTheme()}function fe(t,e){return window.runtime.OnFileDrop(t,e)}window.fixImageSizeLimit=async()=>{try{return console.log("正在禁用文件大小检查..."),await Te(),console.log("✅ 文件大小检查已禁用，现在可以处理任意大小的图片"),"文件大小检查已禁用"}catch(t){return console.error("❌ 禁用文件大小检查失败:",t),"禁用失败: "+t}};window.setImageLimit1GB=async()=>{try{return await it(),console.log("✅ 图片大小限制已设置为1GB"),"图片大小限制已设置为1GB"}catch(t){return console.error("❌ 设置失败:",t),"设置失败: "+t}};window.setImageLimit2GB=async()=>{try{return await ot(),console.log("✅ 图片大小限制已设置为2GB"),"图片大小限制已设置为2GB"}catch(t){return console.error("❌ 设置失败:",t),"设置失败: "+t}};window.checkCurrentConfig=async()=>{try{const t=await Le();return console.log("当前配置:",t),console.log(`图片大小限制: ${t.fileSizeLimits.maxImageSize/(1024*1024)} MB`),console.log(`大小检查启用: ${t.fileSizeLimits.enableSizeCheck}`),t}catch(t){return console.error("❌ 获取配置失败:",t),null}};window.addEventListener("DOMContentLoaded",()=>{window.ErrorManager&&(window.ErrorManager.registerHandler(window.ErrorCodes.FILE_NOT_FOUND,t=>{window.ErrorManager.displayer.showError(t,{duration:5e3,showDetails:!1})}),window.ErrorManager.registerHandler(window.ErrorCodes.FILE_TOO_LARGE,t=>{window.ErrorManager.displayer.showError(t,{duration:8e3,showDetails:!0})}),window.ErrorManager.registerHandler(window.ErrorCodes.ZIP_INVALID,t=>{window.ErrorManager.displayer.showError(t,{duration:6e3,showDetails:!0})}))});document.querySelector("#app").innerHTML=`
    <div class="background-animation"></div>
    <div class="container">
        <div class="header">
            <div class="header-main">
                <div class="logo-container">
                    <img id="logo" class="logo" />
                    <div class="logo-glow"></div>
                </div>
                <h1 class="title">
                    <span class="title-text">图种生成器</span>
                    <span class="title-subtitle">Image Seed Generator</span>
                </h1>
            </div>
            <button id="themeToggle" class="theme-toggle-btn" aria-label="切换主题">
                <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z"/>
                </svg>
                <span class="theme-toggle-text">浅色模式</span>
            </button>
        </div>
        
        <div class="main-content">
            <!-- 标签页导航 -->
            <div class="tab-navigation">
                <button id="createTab" class="tab-btn active">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <span>生成图种</span>
                </button>
                <button id="extractTab" class="tab-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17,8 12,3 7,8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>解析图种</span>
                </button>
                <button id="settingsTab" class="tab-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>设置</span>
                </button>
            </div>

            <!-- 生成图种面板 -->
            <div id="createPanel" class="tab-panel active">
            <div class="upload-section">
                <div class="form-group">
                    <div class="input-label">
                        <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        <span>封面图片</span>
                    </div>
                    <div class="file-input-container drop-target" data-drop-target="image">
                        <button id="selectImageBtn" class="file-btn">
                            <div class="btn-content">
                                <div class="btn-left">
                                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7,10 12,15 17,10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    <span>选择图片文件</span>
                                </div>
                                <div class="btn-preview">
                                    <div id="miniPreviewContainer" class="mini-preview-container hidden">
                                        <img id="miniPreviewImage" class="mini-preview-image" src="" alt="预览"/>
                                        <div class="mini-preview-loading">
                                            <div class="mini-loading-spinner"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                        <div id="imageResult" class="file-result">
                            <span class="file-name"></span>
                            <button class="clear-btn" onclick="clearImageSelection()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="input-label">
                        <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <span>要隐藏的文件/文件夹</span>
                    </div>
                    <div class="file-input-container drop-target" data-drop-target="target">
                        <div class="button-group">
                            <button id="selectFileBtn" class="file-btn half-width">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                </svg>
                                <span>选择文件</span>
                            </button>
                            <button id="selectFolderBtn" class="file-btn half-width">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                </svg>
                                <span>选择文件夹</span>
                            </button>
                        </div>
                        <div id="targetResult" class="file-result">
                            <span class="file-name"></span>
                            <button class="clear-btn" onclick="clearTargetSelection()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="input-label">
                        <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                        <span>输出文件名</span>
                    </div>
                    <div class="input-container">
                        <input type="text" id="outputName" placeholder="请输入输出文件名，例如: my_image.jpg" />
                        <div class="input-border"></div>
                    </div>
                </div>
            </div>
            
            <div class="action-section">
                <button id="generateBtn" class="generate-btn">
                    <span class="btn-text">生成图种</span>
                    <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12,5 19,12 12,19"/>
                    </svg>
                    <div class="btn-loading">
                        <div class="spinner"></div>
                    </div>
                </button>
            </div>
            
            <div id="result" class="result"></div>
            </div>
            
            <!-- 解析图种面板 -->
            <div id="extractPanel" class="tab-panel">
                <div class="upload-section">
                    <div class="form-group">
                        <div class="input-label">
                            <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                            </svg>
                            <span>选择图种文件</span>
                        </div>
                        <div class="file-input-container drop-target" data-drop-target="tuzhong">
                            <button id="selectTuzhongBtn" class="file-btn">
                                <div class="btn-content">
                                    <div class="btn-left">
                                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="7,10 12,15 17,10"/>
                                            <line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                        <span>选择图种文件</span>
                                    </div>
                                </div>
                            </button>
                            <div id="tuzhongResult" class="file-result">
                                <span class="file-name"></span>
                                <button class="clear-btn" onclick="clearTuzhongSelection()">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 图种信息显示 -->
                    <div id="tuzhongInfo" class="tuzhong-info hidden">
                        <div class="info-header">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                            </svg>
                            <span>图种信息</span>
                        </div>
                        <div class="info-content">
                            <div class="info-item">
                                <span class="info-label">文件大小:</span>
                                <span id="totalSizeInfo">--</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">图片大小:</span>
                                <span id="imageSizeInfo">--</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">隐藏数据:</span>
                                <span id="hiddenSizeInfo">--</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">图片格式:</span>
                                <span id="imageFormatInfo">--</span>
                            </div>
                            <div class="info-item files-list">
                                <span class="info-label">隐藏文件:</span>
                                <div id="hiddenFilesList" class="files-container">--</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="action-section">
                    <button id="analyzeBtn" class="generate-btn">
                        <span class="btn-text">分析图种</span>
                        <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6M12 17v6"/>
                        </svg>
                        <div class="btn-loading">
                            <div class="spinner"></div>
                        </div>
                    </button>
                    
                    <button id="extractBtn" class="generate-btn secondary" disabled>
                        <span class="btn-text">提取文件</span>
                        <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17,8 12,3 7,8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <div class="btn-loading">
                            <div class="spinner"></div>
                        </div>
                    </button>
                </div>
                
                <div id="extractResult" class="result"></div>
            </div>
            
            <!-- 设置面板 -->
            <div id="settingsPanel" class="tab-panel">
                <div class="settings-section">
                    <h2 class="settings-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        文件大小限制设置
                    </h2>
                    
                    <div class="settings-form">
                        <!-- 启用/禁用文件大小检查 -->
                        <div class="form-group">
                            <div class="setting-item">
                                <div class="setting-label">
                                    <label for="enableSizeCheck">启用文件大小检查</label>
                                    <p class="setting-description">禁用后将不限制文件大小（谨慎使用）</p>
                                </div>
                                <div class="setting-control">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="enableSizeCheck" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 图片文件大小限制 -->
                        <div class="form-group" id="imageSizeGroup">
                            <div class="setting-item">
                                <div class="setting-label">
                                    <label for="maxImageSize">最大图片文件大小</label>
                                    <p class="setting-description">单个图片文件的最大允许大小</p>
                                </div>
                                <div class="setting-control">
                                    <div class="size-input-group">
                                        <input type="number" id="maxImageSize" value="200" min="1" max="10240">
                                        <select id="imageSizeUnit">
                                            <option value="MB" selected>MB</option>
                                            <option value="GB">GB</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- ZIP文件大小限制 -->
                        <div class="form-group" id="zipSizeGroup">
                            <div class="setting-item">
                                <div class="setting-label">
                                    <label for="maxZipSize">最大ZIP文件大小</label>
                                    <p class="setting-description">压缩文件的最大允许大小</p>
                                </div>
                                <div class="setting-control">
                                    <div class="size-input-group">
                                        <input type="number" id="maxZipSize" value="2" min="1" max="100">
                                        <select id="zipSizeUnit">
                                            <option value="GB" selected>GB</option>
                                            <option value="MB">MB</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 一般文件大小限制 -->
                        <div class="form-group" id="generalFileSizeGroup">
                            <div class="setting-item">
                                <div class="setting-label">
                                    <label for="maxGeneralFileSize">最大一般文件大小</label>
                                    <p class="setting-description">其他文件的最大允许大小</p>
                                </div>
                                <div class="setting-control">
                                    <div class="size-input-group">
                                        <input type="number" id="maxGeneralFileSize" value="10" min="1" max="100">
                                        <select id="generalFileSizeUnit">
                                            <option value="GB" selected>GB</option>
                                            <option value="MB">MB</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 快速设置按钮 -->
                        <div class="form-group">
                            <div class="quick-settings">
                                <h4>快速设置</h4>
                                <div class="quick-buttons">
                                    <button id="removeAllLimitsBtn" class="quick-btn danger">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                        </svg>
                                        移除所有限制
                                    </button>
                                    <button id="setConservativeLimitsBtn" class="quick-btn">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M9 12l2 2 4-4"/>
                                            <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                            <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                        </svg>
                                        保守设置
                                    </button>
                                    <button id="setLiberalLimitsBtn" class="quick-btn">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                                        </svg>
                                        宽松设置
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 性能监控部分 -->
                        <div class="form-group">
                            <div class="settings-section">
                                <h4>性能监控</h4>
                                <div id="performanceMonitor" class="performance-monitor">
                                    <div class="performance-stats">
                                        <div class="stat-item">
                                            <label>内存使用率:</label>
                                            <span id="memoryUsage" class="stat-value">--</span>
                                        </div>
                                        <div class="stat-item">
                                            <label>会话时长:</label>
                                            <span id="sessionDuration" class="stat-value">--</span>
                                        </div>
                                        <div class="stat-item">
                                            <label>操作数量:</label>
                                            <span id="operationCount" class="stat-value">--</span>
                                        </div>
                                        <div class="stat-item">
                                            <label>平均操作时间:</label>
                                            <span id="avgOperationTime" class="stat-value">--</span>
                                        </div>
                                    </div>
                                    <div class="performance-actions">
                                        <button id="refreshPerformanceBtn" class="quick-btn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <polyline points="1,4 1,10 7,10"/>
                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                                            </svg>
                                            刷新数据
                                        </button>
                                        <button id="clearPerformanceBtn" class="quick-btn danger">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <polyline points="3,6 5,6 21,6"/>
                                                <path d="M19,6v14a2,2 0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                                            </svg>
                                            清除数据
                                        </button>
                                        <button id="exportPerformanceBtn" class="quick-btn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                <polyline points="7,10 12,15 17,10"/>
                                                <line x1="12" y1="15" x2="12" y2="3"/>
                                            </svg>
                                            导出报告
                                        </button>
                                    </div>
                                    <div id="memoryWarning" class="memory-warning hidden">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                            <line x1="12" y1="9" x2="12" y2="13"/>
                                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                                        </svg>
                                        <span>内存使用率过高，建议优化</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 保存按钮 -->
                        <div class="form-group">
                            <div class="action-section">
                                <button id="saveSettingsBtn" class="generate-btn">
                                    <span class="btn-text">保存设置</span>
                                    <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                    </svg>
                                    <div class="btn-loading">
                                        <div class="spinner"></div>
                                    </div>
                                </button>
                                <button id="resetSettingsBtn" class="generate-btn secondary">
                                    <span class="btn-text">重置为默认</span>
                                    <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <polyline points="1,4 1,10 7,10"/>
                                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                                    </svg>
                                    <div class="btn-loading">
                                        <div class="spinner"></div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 进度条模态框 -->
    <div id="progressModal" class="modal hidden">
        <div class="modal-content">
            <div class="progress-header">
                <h3>生成图种</h3>
            </div>
            <div class="progress-body">
                <div class="progress-stage" id="progressStage">准备开始...</div>
                <div class="progress-steps" id="progressStepsCreate">
                    <div class="progress-step active" data-step="start">
                        <div class="step-circle">1</div>
                        <span class="step-label">准备</span>
                    </div>
                    <div class="progress-step" data-step="compress">
                        <div class="step-circle">2</div>
                        <span class="step-label">压缩</span>
                    </div>
                    <div class="progress-step" data-step="merge">
                        <div class="step-circle">3</div>
                        <span class="step-label">合并</span>
                    </div>
                    <div class="progress-step" data-step="complete">
                        <div class="step-circle">4</div>
                        <span class="step-label">完成</span>
                    </div>
                </div>
                <div class="progress-steps hidden" id="progressStepsExtract">
                    <div class="progress-step active" data-step="start">
                        <div class="step-circle">1</div>
                        <span class="step-label">准备</span>
                    </div>
                    <div class="progress-step" data-step="analyze">
                        <div class="step-circle">2</div>
                        <span class="step-label">解析</span>
                    </div>
                    <div class="progress-step" data-step="extract">
                        <div class="step-circle">3</div>
                        <span class="step-label">提取</span>
                    </div>
                    <div class="progress-step" data-step="complete">
                        <div class="step-circle">4</div>
                        <span class="step-label">完成</span>
                    </div>
                </div>
                <div class="progress-detail" id="progressDetail"></div>
                <div class="progress-info">
                    <div class="progress-info-item">
                        <span class="info-label">文件大小:</span>
                        <span class="info-value" id="fileSize">计算中...</span>
                    </div>
                    <div class="progress-info-item">
                        <span class="info-label">处理速度:</span>
                        <span class="info-value" id="processSpeed">--</span>
                    </div>
                    <div class="progress-info-item">
                        <span class="info-label">剩余时间:</span>
                        <span class="info-value" id="remainingTime">计算中...</span>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar">
                        <div class="progress-bar-glow"></div>
                    </div>
                    <div class="progress-percentage" id="progressPercentage">0%</div>
                </div>
            </div>
            <div class="progress-footer">
                <button id="cancelProgressBtn" class="cancel-btn">取消</button>
            </div>
        </div>
    </div>
    
    <!-- 成功模态框 -->
    <div id="successModal" class="modal hidden">
        <div class="modal-content">
            <div class="success-header">
                <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 11l3 3L22 4"/>
                </svg>
                <h3>生成成功</h3>
            </div>
            <div class="success-body">
                <p id="successMessage">图种文件已成功保存！</p>
                <p class="success-path" id="successPath"></p>
            </div>
            <div class="success-footer">
                <button id="openLocationBtn" class="primary-btn">打开位置</button>
                <button id="closeSuccessBtn" class="secondary-btn">关闭</button>
            </div>
        </div>
    </div>
`;document.getElementById("logo").src=Ve;let at=document.getElementById("selectImageBtn"),lt=document.getElementById("selectFileBtn"),ct=document.getElementById("selectFolderBtn"),dt=document.getElementById("outputName"),ut=document.getElementById("generateBtn"),u=document.getElementById("result"),H=document.getElementById("imageResult"),G=document.getElementById("targetResult"),V=document.getElementById("miniPreviewContainer"),w=document.getElementById("miniPreviewImage"),O=document.querySelector(".mini-preview-loading"),g=document.getElementById("themeToggle"),mt=document.getElementById("selectTuzhongBtn"),A=document.getElementById("analyzeBtn"),h=document.getElementById("extractBtn"),$=document.getElementById("tuzhongResult"),x=document.getElementById("tuzhongInfo"),m=document.getElementById("extractResult"),Me=document.getElementById("createTab"),Ce=document.getElementById("extractTab"),pt=document.getElementById("createPanel"),gt=document.getElementById("extractPanel"),S=document.getElementById("progressModal"),ve=document.getElementById("progressStage"),F=document.getElementById("progressDetail"),ye=document.getElementById("progressBar"),ht=document.getElementById("progressPercentage"),ft=document.getElementById("cancelProgressBtn"),vt=document.getElementById("progressStepsCreate"),yt=document.getElementById("progressStepsExtract"),we=S?S.querySelector(".progress-header h3"):null,I=document.getElementById("successModal"),wt=document.getElementById("successMessage"),Q=document.getElementById("successPath"),k=document.getElementById("openLocationBtn"),Et=document.getElementById("closeSuccessBtn"),Ee=I?I.querySelector(".success-header h3"):null,j="",W="",y="",C="",v=null;const ie="tuzhong-theme";let oe="theme-dark";const bt=[".png",".jpg",".jpeg",".gif",".bmp",".webp"],le={create:["start","compress","merge","complete"],extract:["start","analyze","extract","complete"]},R={start:"准备开始...",compress:"正在压缩文件...",merge:"正在生成图种...",analyze:"正在解析图种结构...",extract:"正在提取隐藏文件...",complete:"操作完成！"};let p="create";const ce={create:vt,extract:yt};Me.addEventListener("click",function(){de("create")});Ce.addEventListener("click",function(){de("extract")});document.getElementById("settingsTab").addEventListener("click",function(){de("settings")});function de(t){document.querySelectorAll(".tab-btn").forEach(e=>e.classList.remove("active")),document.querySelectorAll(".tab-panel").forEach(e=>e.classList.remove("active")),t==="create"?(Me.classList.add("active"),pt.classList.add("active")):t==="extract"?(Ce.classList.add("active"),gt.classList.add("active")):t==="settings"&&(document.getElementById("settingsTab").classList.add("active"),document.getElementById("settingsPanel").classList.add("active"),P()),d("",""),c("","")}at.addEventListener("click",function(){tt().then(t=>{t&&(console.log("选择的图片路径:",t),ze(t))}).catch(t=>{console.error("选择图片失败:",t),d("选择图片失败: "+t,"error")})});lt.addEventListener("click",function(){Qe().then(t=>{t&&ue(t,"file")}).catch(t=>{console.error("选择文件失败:",t)})});ct.addEventListener("click",function(){et().then(t=>{t&&ue(t,"folder")}).catch(t=>{console.error("选择文件夹失败:",t)})});mt.addEventListener("click",function(){st().then(t=>{t&&(console.log("选择的图种文件路径:",t),Oe(t))}).catch(t=>{console.error("选择图种文件失败:",t),c("选择图种文件失败: "+t,"error")})});A.addEventListener("click",function(){if(!y){c("请先选择图种文件","error");return}z(),ee(!0),c("","");try{X.add(()=>$e(y),1).then(t=>{v=t,t&&t.isValid?(Nt(t),x.classList.remove("hidden"),h.disabled=!1,h.classList.remove("secondary")):(c(t.errorMessage||"解析失败：这不是一个有效的图种文件。","error"),x.classList.add("hidden"),h.disabled=!0,h.classList.add("secondary"))}).catch(t=>{console.error("图种分析错误:",t);const e=t.message||t.toString()||"未知错误";c("分析失败: "+e,"error"),x.classList.add("hidden"),h.disabled=!0,h.classList.add("secondary")}).finally(()=>{ee(!1)})}catch(t){console.error("分析操作同步错误:",t),c("分析失败: "+(t.message||t),"error"),ee(!1)}});h.addEventListener("click",function(){if(!y||!v||!v.isValid){c("请先分析图种文件","error");return}const t=y.split("\\").pop().split("/").pop(),n=(t.substring(0,t.lastIndexOf("."))||t)+"_extracted";Ye(n).then(s=>s?(Ne("extract"),console.log("开始提取操作，文件路径:",y,"输出路径:",s),console.log("使用已分析的图种信息:",v),X.add(()=>(console.log("请求队列：开始执行ExtractFromTuzhongWithInfo"),v&&v.imageSize?We(y,s,v.imageSize):(console.warn("警告：没有找到分析信息，使用原版本可能较慢"),je(y,s))),2).then(()=>{console.log("ExtractFromTuzhongWithInfo执行完成"),C=s}).catch(i=>{throw console.error("ExtractFromTuzhongWithInfo执行失败:",i),i})):(c("已取消提取","info"),Promise.reject("用户取消"))).catch(s=>{s!=="用户取消"&&(z(),c(`提取失败: ${s}`,"error"))})});ut.addEventListener("click",function(){const t=dt.value.trim();try{if(!j)throw window.createError(window.ErrorCodes.INVALID_INPUT,"请选择封面图片",window.ErrorTypes.VALIDATION);if(!W)throw window.createError(window.ErrorCodes.INVALID_INPUT,"请选择要隐藏的文件或文件夹",window.ErrorTypes.VALIDATION);if(!t)throw window.createError(window.ErrorCodes.INVALID_INPUT,"请输入输出文件名",window.ErrorTypes.VALIDATION);nt().then(e=>{if(e)return C=e,Ne("create"),X.add(()=>Je(j,W,e),2);{const n=window.createError(window.ErrorCodes.CANCELLED,"已取消保存",window.ErrorTypes.USER);return window.handleError(n),Promise.reject("用户取消")}}).then(e=>{}).catch(e=>{e!=="用户取消"&&(console.error("生成操作失败:",e),setTimeout(()=>{z(),d(`生成失败: ${e.message||e}`,"error")},100))})}catch(e){console.error("生成操作同步错误:",e),d("生成失败: "+(e.message||e),"error")}});function ze(t){if(t)try{if(!Ae(t))throw window.createError(window.ErrorCodes.IMAGE_UNSUPPORTED,"请选择有效的图片文件（支持 PNG/JPG/GIF/BMP/WEBP）",window.ErrorTypes.VALIDATION).withContext("filePath",t);Tt(t)}catch(e){window.handleError(e)}}const xt=window.performanceUtils.debounce(Lt,300,"imageSelection"),St=window.performanceUtils.debounce(Ct,300,"targetSelection"),It=window.performanceUtils.debounce(Mt,300,"tuzhongSelection"),X=window.performanceUtils.createRequestQueue(2);function Tt(t){xt(t)}function Lt(t){const e=window.performanceUtils.startOperation("setImageSelection");j=t;const n=H.querySelector(".file-name");n.textContent=`已选择: ${me(t)}`,H.className="file-result success",At(t),d("",""),window.performanceUtils.endOperation(e)}function Oe(t){if(t){if(!Ae(t)){c("请选择有效的图片文件","error");return}Bt(t)}}function Bt(t){It(t)}function Mt(t){const e=window.performanceUtils.startOperation("setTuzhongSelection");y=t;const n=$.querySelector(".file-name");n.textContent=`已选择: ${me(t)}`,$.className="file-result success",v=null,hideTuzhongMiniPreview(),x.classList.add("hidden"),h.disabled=!0,h.classList.add("secondary"),c("",""),window.performanceUtils.endOperation(e)}function ue(t,e="auto"){St(t,e)}function Ct(t,e="auto"){if(!t)return;const n=window.performanceUtils.startOperation("setTargetSelection");W=t;const s=G.querySelector(".file-name"),i=me(t);let o="已选择:";e==="file"?o="已选择文件:":e==="folder"&&(o="已选择文件夹:"),s.textContent=`${o} ${i}`,G.className="file-result success",d("",""),window.performanceUtils.endOperation(n)}function me(t){return t.replace(/\\/g,"/").split("/").pop()||t}function Ae(t){const e=t.toLowerCase();return bt.some(n=>e.endsWith(n))}function d(t,e){u.textContent=t,u.className=`result ${e}`,e==="error"&&t?(u.style.cursor="pointer",u.title="点击清除错误信息",u.onclick=function(){d("",""),u.onclick=null,u.style.cursor="default",u.title=""},setTimeout(()=>{u.className.includes("error")&&(d("",""),u.onclick=null,u.style.cursor="default",u.title="")},5e3)):(u.style.cursor="default",u.title="",u.onclick=null)}function zt(){j="";const t=H.querySelector(".file-name");t.textContent="",H.className="file-result",ke(),d("","")}function Ot(){W="";const t=G.querySelector(".file-name");t.textContent="",G.className="file-result",d("","")}function At(t){console.log("开始加载图片预览:",t),d("",""),V.classList.remove("hidden"),O.style.display="block",w.style.display="none",w.onload=null,w.onerror=null,X.add(()=>Ze(t),3).then(e=>{console.log("成功获取图片base64数据，长度:",e.length),w.onload=function(){console.log("图片加载成功"),O.style.display="none",w.style.display="block",d("","")},w.onerror=function(){console.error("图片渲染失败，可能的原因：base64格式错误或浏览器不支持该格式"),O.style.display="none",be("图片显示失败")},w.src=e}).catch(e=>{console.error("获取图片预览失败:",e),O.style.display="none",be("预览失败: "+e)})}function be(t){V.innerHTML=`
        <div class="preview-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
        </div>
    `,console.warn("预览错误:",t),setTimeout(()=>{ke()},3e3)}function ke(){V.classList.add("hidden"),V.innerHTML=`
        <img id="miniPreviewImage" class="mini-preview-image" src="" alt="预览"/>
        <div class="mini-preview-loading">
            <div class="mini-loading-spinner"></div>
        </div>
    `,w=document.getElementById("miniPreviewImage"),O=document.querySelector(".mini-preview-loading"),d("","")}window.clearImageSelection=zt;window.clearTargetSelection=Ot;window.clearTuzhongSelection=kt;function kt(){y="",v=null;const t=$.querySelector(".file-name");t.textContent="",$.className="file-result",x.classList.add("hidden"),h.disabled=!0,h.classList.add("secondary"),c("","")}function Nt(t){if(!t.isValid){x.classList.add("hidden");return}document.getElementById("totalSizeInfo").textContent=M(t.totalSize),document.getElementById("imageSizeInfo").textContent=M(t.imageSize),document.getElementById("hiddenSizeInfo").textContent=M(t.hiddenSize),document.getElementById("imageFormatInfo").textContent=t.imageFormat;const e=document.getElementById("hiddenFilesList");if(t.hiddenFiles&&t.hiddenFiles.length>0){const n=document.createDocumentFragment();e.innerHTML="",t.hiddenFiles.forEach(s=>{const i=document.createElement("div");i.className="file-item",i.innerHTML=`
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>${s}</span>
            `,n.appendChild(i)}),e.appendChild(n)}else e.innerHTML='<span class="no-files">没有找到文件</span>';x.classList.remove("hidden")}function M(t){if(t===0)return"0 B";const e=1024,n=["B","KB","MB","GB"],s=Math.floor(Math.log(t)/Math.log(e));return parseFloat((t/Math.pow(e,s)).toFixed(2))+" "+n[s]}function ee(t){t?(A.classList.add("loading"),A.disabled=!0):(A.classList.remove("loading"),A.disabled=!1)}function c(t,e){m.textContent=t,m.className=`result ${e}`,e==="error"&&t?(m.style.cursor="pointer",m.title="点击清除错误信息",m.onclick=function(){c("",""),m.onclick=null,m.style.cursor="default",m.title=""},setTimeout(()=>{m.className.includes("error")&&(c("",""),m.onclick=null,m.style.cursor="default",m.title="")},5e3)):(m.style.cursor="default",m.title="",m.onclick=null)}let re=0,Ft=80;Be("progress",function(t){const e=Date.now();if(t.step==="complete"||e-re>=Ft){const n={totalSize:t.totalSize||null,currentSize:t.currentSize||null,speed:t.speed||null};Fe(t.percent,t.message,t.step,n),re=e}t.step==="complete"&&setTimeout(()=>{z();const n=C||"（未知路径）",s=p==="create"?`图种生成完成！文件已保存到: ${n}`:`提取完成！文件已保存到: ${n}`;p==="create"?d(s,"success"):c(s,"success"),Kt(C,p)},500)});Be("operationError",function(t){console.error("操作失败:",t),z();const e=t.message||t.error||"操作失败";p==="create"?d(`生成失败: ${e}`,"error"):c(`提取失败: ${e}`,"error")});function Ne(t="create"){p=le[t]?t:"create",_t(),we&&(we.textContent=p==="create"?"生成图种":"提取文件"),Object.entries(ce).forEach(([e,n])=>{n&&(e===p?n.classList.remove("hidden"):n.classList.add("hidden"))}),qt(),requestAnimationFrame(()=>{S.style.display="flex",requestAnimationFrame(()=>{S.classList.remove("hidden")})}),Fe(0,R.start,"start"),re=0}function z(){S.classList.add("hidden"),setTimeout(()=>{S.classList.contains("hidden")&&(S.style.display="none")},300)}let D=0,N=0,L=0,U=0,_=0;const Pt=window.performanceUtils.throttle(Rt,16,"progress");function Fe(t,e,n,s={}){const i=window.performanceUtils.startOperation(`updateProgress-${n}`);Pt(t,e,n,s,i)}function Rt(t,e,n,s,i){requestAnimationFrame(()=>{const o=Date.now();if(ve){const a=R[n]||e||R.start;ve.textContent=a}if(F){const a=R[n];e&&e!==a?F.textContent=e:F.textContent=""}const r=parseFloat(ye.style.width)||0;Math.abs(t-r)>.1&&(ye.style.width=t+"%"),ht.textContent=Math.round(t)+"%",Dt(t,s,o),Ht(n),i!==void 0&&window.performanceUtils.endOperation(i)})}function Dt(t,e,n){const s=document.getElementById("fileSize"),i=document.getElementById("processSpeed"),o=document.getElementById("remainingTime");if(!s||!i||!o)return;e.totalSize?(L=e.totalSize,s.textContent=M(L)):e.currentSize&&(s.textContent=M(e.currentSize)),D===0&&(D=n,U=n,_=0);const r=(n-D)/1e3,a=(n-U)/1e3;if(L>0&&r>.5){if(N=Math.floor(t/100*L),a>=1){const K=(N-_)/a;if(K>0){i.textContent=M(K)+"/s";const Y=(L-N)/K;Y>0&&Y<3600?o.textContent=Ut(Y):o.textContent="--"}U=n,_=N}}else t>=99&&(i.textContent="完成",o.textContent="00:00")}function Ut(t){const e=Math.floor(t/60),n=Math.floor(t%60);return`${e.toString().padStart(2,"0")}:${n.toString().padStart(2,"0")}`}function _t(){D=0,N=0,L=0,U=0,_=0;const t=document.getElementById("fileSize"),e=document.getElementById("processSpeed"),n=document.getElementById("remainingTime");t&&(t.textContent="计算中..."),e&&(e.textContent="--"),n&&(n.textContent="计算中...")}function qt(){document.querySelectorAll(".progress-step").forEach(n=>{n.classList.remove("active","completed")});const t=ce[p],e=le[p]||[];if(t&&e.length>0){const n=t.querySelector(`.progress-step[data-step="${e[0]}"]`);n&&n.classList.add("active")}F&&(F.textContent="")}function Ht(t){const e=ce[p];if(!e)return;const n=le[p]||[];if(!t||n.indexOf(t)===-1)return;const s=n.indexOf(t);n.forEach((i,o)=>{const r=e.querySelector(`.progress-step[data-step="${i}"]`);r&&(o<s?(r.classList.add("completed"),r.classList.remove("active")):o===s?(r.classList.add("active"),r.classList.remove("completed")):r.classList.remove("active","completed"))})}function Gt(){const t=window.matchMedia("(prefers-color-scheme: dark)"),e=localStorage.getItem(ie);let n;e?n=e:n=t.matches?"theme-dark":"theme-light",te(n,{persist:!1}),t.addListener(s=>{if(!localStorage.getItem(ie)){const i=s.matches?"theme-dark":"theme-light";te(i,{persist:!1})}}),g&&(g.addEventListener("click",()=>{g.style.transform="scale(0.95)",setTimeout(()=>{g.style.transform=""},150),te(oe==="theme-dark"?"theme-light":"theme-dark")}),g.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),g.click())}))}function te(t,e={}){const n=t==="theme-light"?"theme-light":"theme-dark";if(oe!==n){document.body.classList.add("theme-transitioning"),oe=n,document.body.classList.remove("theme-dark","theme-light"),document.body.classList.add(n),Vt(n),e.persist!==!1&&localStorage.setItem(ie,n);try{n==="theme-dark"&&typeof he=="function"?he():n==="theme-light"&&typeof ge=="function"&&ge()}catch(s){console.warn("同步系统主题失败:",s)}setTimeout(()=>{document.body.classList.remove("theme-transitioning")},300),window.dispatchEvent(new CustomEvent("themeChanged",{detail:{theme:n}}))}}function Vt(t){if(!g)return;g.setAttribute("data-theme",t),g.setAttribute("aria-pressed",t==="theme-light"?"true":"false");const e=g.querySelector(".theme-toggle-text");if(e){const s=t==="theme-dark"?"浅色模式":"深色模式";e.style.opacity="0",setTimeout(()=>{e.textContent=s,e.style.opacity="1"},150)}g.querySelectorAll(".theme-icon").forEach(s=>{s.style.transform="rotate(180deg)",setTimeout(()=>{s.style.transform=""},300)})}function $t(){if(document.querySelectorAll("[data-drop-target]").forEach(e=>{e.style.setProperty("--wails-drop-target","drop"),jt(e)}),typeof fe!="function"){console.warn("当前环境未启用文件拖放功能");return}try{fe((e,n,s)=>{if(Xt(),!s||s.length===0){f("没有检测到有效文件","error");return}const i=document.elementFromPoint(e,n);if(!i)return;const o=i.closest("[data-drop-target]");if(!o){f("请将文件拖放到正确的区域","warning");return}const r=o.getAttribute("data-drop-target");s.length>1&&r!=="target"&&f(`检测到${s.length}个文件，将处理第一个文件`,"info");const a=s[0];if(r==="image")Wt(a)?(ze(a),f("图片文件添加成功","success")):f("请拖放有效的图片文件 (jpg, jpeg, png, gif, bmp, webp)","error");else if(r==="target"){ue(a);const pe=a.split("\\").pop()||a.split("/").pop();f(`文件 "${pe}" 添加成功`,"success")}else r==="tuzhong"&&(Zt(a)?(Oe(a),f("图种文件添加成功","success")):f("请拖放有效的图种文件","error"))},!0)}catch(e){console.error("初始化拖放事件失败:",e),f("文件拖放功能初始化失败","error")}}function jt(t){let e=0;t.addEventListener("dragenter",n=>{n.preventDefault(),e++,t.classList.add("drag-over");const s=t.getAttribute("data-drop-target");Jt(s)}),t.addEventListener("dragleave",n=>{n.preventDefault(),e--,e===0&&(t.classList.remove("drag-over"),xe())}),t.addEventListener("dragover",n=>{n.preventDefault(),n.dataTransfer.dropEffect="copy"}),t.addEventListener("drop",n=>{n.preventDefault(),e=0,t.classList.remove("drag-over"),xe()})}function Wt(t){return/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(t)}function Zt(t){return/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(t)}function Jt(t){const n={image:"拖放图片文件作为封面",target:"拖放要隐藏的文件或文件夹",tuzhong:"拖放图种文件进行解析"}[t]||"拖放文件到此区域";f(n,"info",!0)}function xe(){const t=document.querySelector(".drop-message.persistent");t&&t.remove()}function f(t,e="info",n=!1){const s=document.querySelector(".drop-message");s&&s.remove();const i=document.createElement("div");i.className=`drop-message drop-message-${e} ${n?"persistent":""}`,i.textContent=t,Object.assign(i.style,{position:"fixed",top:"20px",right:"20px",padding:"12px 20px",borderRadius:"8px",color:"white",fontWeight:"500",fontSize:"14px",zIndex:"10000",maxWidth:"300px",wordWrap:"break-word",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.15)",transform:"translateX(100%)",transition:"transform 0.3s ease",backdropFilter:"blur(10px)"});const o={success:"rgba(34, 197, 94, 0.9)",error:"rgba(239, 68, 68, 0.9)",warning:"rgba(245, 158, 11, 0.9)",info:"rgba(59, 130, 246, 0.9)"};i.style.background=o[e]||o.info,document.body.appendChild(i),requestAnimationFrame(()=>{i.style.transform="translateX(0)"}),n||setTimeout(()=>{i.parentNode&&(i.style.transform="translateX(100%)",setTimeout(()=>{i.parentNode&&i.remove()},300))},3e3)}function Xt(){document.querySelectorAll("[data-drop-target]").forEach(e=>{e.classList.remove("drag-over","wails-drop-target-active")})}function Kt(t,e="create"){const n=t||"",s=e==="create",i=!!n,o=s?"生成成功":"提取完成",r=s?"图种文件已成功保存！":"隐藏文件已成功提取！";wt.textContent=r,Q&&(Q.textContent=i?n:"路径不可用",Q.classList.toggle("hidden",!i)),Ee&&(Ee.textContent=o),k&&(k.textContent=s?"打开位置":"打开提取文件夹",k.disabled=!i,k.classList.toggle("disabled",!i)),requestAnimationFrame(()=>{I.style.display="flex",requestAnimationFrame(()=>{I.classList.remove("hidden")})})}function Pe(){I.classList.add("hidden"),setTimeout(()=>{I.classList.contains("hidden")&&(I.style.display="none")},300)}ft.addEventListener("click",function(){z(),p==="create"?d("用户取消了操作","info"):c("用户取消了操作","info")});Et.addEventListener("click",function(){Pe()});k.addEventListener("click",function(){if(C)Xe(C).catch(t=>{console.error("打开文件位置失败:",t)});else return;Pe()});Gt();$t();async function P(){try{const e=(await Le()).fileSizeLimits;document.getElementById("enableSizeCheck").checked=e.enableSizeCheck,ne("maxImageSize","imageSizeUnit",e.maxImageSize),ne("maxZipSize","zipSizeUnit",e.maxZipSize),ne("maxGeneralFileSize","generalFileSizeUnit",e.maxGeneralFile),Re(e.enableSizeCheck)}catch(t){console.error("加载设置失败:",t),b("加载设置失败: "+t.message)}}function ne(t,e,n){const s=document.getElementById(t),i=document.getElementById(e);if(n===0){s.value=0,i.value="MB";return}const o=n/(1024*1024),r=n/(1024*1024*1024);r>=1?(s.value=Math.round(r*100)/100,i.value="GB"):(s.value=Math.round(o*100)/100,i.value="MB")}function se(t,e){const n=parseFloat(document.getElementById(t).value),s=document.getElementById(e).value;return isNaN(n)||n<=0?0:Math.round(s==="GB"?n*1024*1024*1024:n*1024*1024)}function Re(t){["imageSizeGroup","zipSizeGroup","generalFileSizeGroup"].forEach(n=>{const s=document.getElementById(n);s.querySelectorAll("input, select").forEach(o=>{o.disabled=!t}),t?s.classList.remove("disabled"):s.classList.add("disabled")})}document.getElementById("enableSizeCheck").addEventListener("change",function(){Re(this.checked)});document.getElementById("saveSettingsBtn").addEventListener("click",async function(){const t=this,e=t.querySelector(".btn-text"),n=t.querySelector(".btn-loading");try{if(t.disabled=!0,e.style.opacity="0",n.style.display="flex",document.getElementById("enableSizeCheck").checked){const i={maxImageSize:se("maxImageSize","imageSizeUnit"),maxZipSize:se("maxZipSize","zipSizeUnit"),maxGeneralFile:se("maxGeneralFileSize","generalFileSizeUnit"),enableSizeCheck:!0};await J(i)}else await Te();T("设置已保存")}catch(s){console.error("保存设置失败:",s),b("保存设置失败: "+s.message)}finally{t.disabled=!1,e.style.opacity="1",n.style.display="none"}});document.getElementById("resetSettingsBtn").addEventListener("click",async function(){const t=this,e=t.querySelector(".btn-text"),n=t.querySelector(".btn-loading");try{t.disabled=!0,e.style.opacity="0",n.style.display="flex";const s={maxImageSize:200*1024*1024,maxZipSize:2*1024*1024*1024,maxGeneralFile:10*1024*1024*1024,enableSizeCheck:!0};await J(s),await P(),T("设置已重置为默认值")}catch(s){console.error("重置设置失败:",s),b("重置设置失败: "+s.message)}finally{t.disabled=!1,e.style.opacity="1",n.style.display="none"}});document.getElementById("removeAllLimitsBtn").addEventListener("click",async function(){if(confirm("确定要移除所有文件大小限制吗？这将允许处理任意大小的文件，可能会影响性能。"))try{await Ke(),await P(),T("已移除所有文件大小限制")}catch(t){console.error("移除限制失败:",t),b("移除限制失败: "+t.message)}});document.getElementById("setConservativeLimitsBtn").addEventListener("click",async function(){const t={maxImageSize:20971520,maxZipSize:524288e3,maxGeneralFile:1073741824,enableSizeCheck:!0};try{await J(t),await P(),T("已应用保守设置")}catch(e){console.error("应用保守设置失败:",e),b("应用保守设置失败: "+e.message)}});document.getElementById("setLiberalLimitsBtn").addEventListener("click",async function(){const t={maxImageSize:1073741824,maxZipSize:21474836480,maxGeneralFile:53687091200,enableSizeCheck:!0};try{await J(t),await P(),T("已应用宽松设置")}catch(e){console.error("应用宽松设置失败:",e),b("应用宽松设置失败: "+e.message)}});function T(t){showMessage(t,"success")}function b(t){showMessage(t,"error")}function Se(){setInterval(Z,2e3),window.addEventListener("memoryWarning",en),tn(),Z()}function Z(){if(!window.performanceUtils)return;const t=window.performanceUtils.getPerformanceReport(),e=document.getElementById("memoryUsage"),n=document.getElementById("sessionDuration"),s=document.getElementById("operationCount"),i=document.getElementById("avgOperationTime");if(e&&t.currentMemory&&(e.textContent=`${t.currentMemory.usagePercentage}%`,e.style.color=Yt(parseFloat(t.currentMemory.usagePercentage))),n){const o=Math.floor(t.sessionDuration/6e4),r=Math.floor(t.sessionDuration%6e4/1e3);n.textContent=`${o}分${r}秒`}s&&(s.textContent=t.totalOperations.toString()),i&&(i.textContent=`${t.averageOperationTime.toFixed(1)}ms`,i.style.color=Qt(t.averageOperationTime))}function Yt(t){return t<50?"#10b981":t<80?"#f59e0b":"#ef4444"}function Qt(t){return t<100?"#10b981":t<500?"#f59e0b":"#ef4444"}function en(t){const e=document.getElementById("memoryWarning");e&&(e.classList.remove("hidden"),setTimeout(()=>{e.classList.add("hidden")},5e3)),console.warn("内存使用率过高:",t.detail),b("内存使用率过高，建议关闭不需要的预览或刷新页面")}function tn(){const t=document.getElementById("refreshPerformanceBtn");t&&t.addEventListener("click",Z);const e=document.getElementById("clearPerformanceBtn");e&&e.addEventListener("click",()=>{window.performanceUtils&&(window.performanceUtils.performanceMetrics.operations=[],window.performanceUtils.performanceMetrics.memoryUsage=[],Z(),T("性能数据已清除"))});const n=document.getElementById("exportPerformanceBtn");n&&n.addEventListener("click",nn)}function nn(){if(!window.performanceUtils){b("性能工具未初始化");return}const t=window.performanceUtils.getPerformanceReport(),e={timestamp:new Date().toISOString(),sessionDuration:t.sessionDuration,totalOperations:t.totalOperations,averageOperationTime:t.averageOperationTime,slowOperations:t.slowOperations,currentMemory:t.currentMemory,memoryHistory:t.memoryHistory},n=JSON.stringify(e,null,2),s=new Blob([n],{type:"application/json"}),i=URL.createObjectURL(s),o=document.createElement("a");o.href=i,o.download=`performance-report-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i),T("性能报告已导出")}document.addEventListener("DOMContentLoaded",()=>{window.performanceUtils?Se():setTimeout(()=>{window.performanceUtils&&Se()},500)});
