(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function n(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=n(i);fetch(i.href,o)}})();const z={USER:"user",VALIDATION:"validation",SYSTEM:"system",IO:"io",NETWORK:"network"},l={FILE_NOT_FOUND:"FILE_NOT_FOUND",FILE_PERMISSION:"FILE_PERMISSION",FILE_CORRUPTED:"FILE_CORRUPTED",FILE_TOO_LARGE:"FILE_TOO_LARGE",INVALID_FORMAT:"INVALID_FORMAT",INVALID_PATH:"INVALID_PATH",IMAGE_INVALID:"IMAGE_INVALID",IMAGE_UNSUPPORTED:"IMAGE_UNSUPPORTED",IMAGE_CORRUPTED:"IMAGE_CORRUPTED",ZIP_INVALID:"ZIP_INVALID",ZIP_CORRUPTED:"ZIP_CORRUPTED",ZIP_TOO_LARGE:"ZIP_TOO_LARGE",ZIP_EXTRACT_FAILED:"ZIP_EXTRACT_FAILED",MEMORY_EXHAUSTED:"MEMORY_EXHAUSTED",DISK_FULL:"DISK_FULL",TIMEOUT:"TIMEOUT",CANCELLED:"CANCELLED",INVALID_INPUT:"INVALID_INPUT",OPERATION_FAILED:"OPERATION_FAILED",UNSUPPORTED_OPERATION:"UNSUPPORTED_OPERATION"},b={INFO:"info",WARNING:"warning",ERROR:"error",CRITICAL:"critical"};class W extends Error{constructor(t,n,s=z.USER,i=null){super(n),this.name="AppError",this.code=t,this.type=s,this.details=i,this.timestamp=Date.now(),this.context={},this.level=this.determineLevel()}withContext(t,n){return this.context[t]=n,this}withDetails(t){return this.details=t,this}determineLevel(){return this.type===z.SYSTEM?b.CRITICAL:this.type===z.IO?b.ERROR:this.type===z.VALIDATION?b.WARNING:b.INFO}toJSON(){return{code:this.code,message:this.message,type:this.type,level:this.level,details:this.details,timestamp:this.timestamp,context:this.context,stack:this.stack}}getUserFriendlyMessage(){return Ve[this.code]||this.message}}const Ve={[l.FILE_NOT_FOUND]:"找不到指定的文件",[l.FILE_PERMISSION]:"没有文件访问权限",[l.FILE_CORRUPTED]:"文件已损坏",[l.FILE_TOO_LARGE]:"文件太大",[l.INVALID_FORMAT]:"文件格式不支持",[l.INVALID_PATH]:"文件路径无效",[l.IMAGE_INVALID]:"无效的图片文件",[l.IMAGE_UNSUPPORTED]:"不支持的图片格式",[l.IMAGE_CORRUPTED]:"图片文件已损坏",[l.ZIP_INVALID]:"无效的压缩文件",[l.ZIP_CORRUPTED]:"压缩文件已损坏",[l.ZIP_TOO_LARGE]:"压缩文件太大",[l.ZIP_EXTRACT_FAILED]:"解压文件失败",[l.MEMORY_EXHAUSTED]:"内存不足",[l.DISK_FULL]:"磁盘空间不足",[l.TIMEOUT]:"操作超时",[l.CANCELLED]:"操作已取消",[l.INVALID_INPUT]:"输入无效",[l.OPERATION_FAILED]:"操作失败",[l.UNSUPPORTED_OPERATION]:"不支持的操作"};class $e{constructor(t=50){this.errors=[],this.maxEntries=t,this.listeners=[]}logError(t,n={}){const s={error:t instanceof W?t.toJSON():{message:t.message,stack:t.stack,timestamp:Date.now()},context:{url:window.location.href,userAgent:navigator.userAgent,timestamp:Date.now(),...n}};this.errors.push(s),this.errors.length>this.maxEntries&&this.errors.shift(),this.saveToLocalStorage(),this.notifyListeners(s)}getRecentErrors(t=10){return this.errors.slice(-t)}clearErrors(){this.errors=[],this.saveToLocalStorage()}addListener(t){this.listeners.push(t)}removeListener(t){const n=this.listeners.indexOf(t);n>-1&&this.listeners.splice(n,1)}notifyListeners(t){this.listeners.forEach(n=>{try{n(t)}catch(s){console.error("Error in error listener:",s)}})}saveToLocalStorage(){try{localStorage.setItem("errorLogs",JSON.stringify(this.errors))}catch(t){console.warn("Failed to save error logs to localStorage:",t)}}loadFromLocalStorage(){try{const t=localStorage.getItem("errorLogs");t&&(this.errors=JSON.parse(t))}catch(t){console.warn("Failed to load error logs from localStorage:",t),this.errors=[]}}exportErrors(){return JSON.stringify(this.errors,null,2)}}class je{constructor(){this.container=null,this.currentToasts=[],this.maxToasts=5,this.defaultDuration=5e3,this.init()}init(){this.container=document.createElement("div"),this.container.id="error-toast-container",this.container.className="error-toast-container",this.container.style.cssText=`
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `,document.body.appendChild(this.container),this.addStyles()}addStyles(){const t=document.createElement("style");t.textContent=`
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
        `,document.head.appendChild(t)}showError(t,n={}){const{duration:s=this.defaultDuration,showDetails:i=!1,persistent:o=!1}=n;this.currentToasts.length>=this.maxToasts&&this.removeToast(this.currentToasts[0]);const r=this.createToast(t,{duration:s,showDetails:i,persistent:o});return this.container.appendChild(r),this.currentToasts.push(r),!o&&s>0&&setTimeout(()=>{this.removeToast(r)},s),r}createToast(t,n){const s=document.createElement("div");s.className=`error-toast ${t.level||"error"}`;const i=document.createElement("div");i.className="error-toast-header",i.innerHTML=`
            <span>${t.code||"ERROR"}</span>
            <button class="error-toast-close">&times;</button>
        `;const o=document.createElement("div");if(o.className="error-toast-message",o.textContent=t.getUserFriendlyMessage?t.getUserFriendlyMessage():t.message,s.appendChild(i),s.appendChild(o),n.showDetails&&t.details){const a=document.createElement("div");a.className="error-toast-details",a.textContent=t.details,s.appendChild(a)}if(!n.persistent&&n.duration>0){const a=document.createElement("div");a.className="error-toast-progress",a.style.width="100%",s.appendChild(a),setTimeout(()=>{a.style.transition=`width ${n.duration}ms linear`,a.style.width="0%"},10)}return i.querySelector(".error-toast-close").addEventListener("click",()=>{this.removeToast(s)}),s}removeToast(t){!t||!t.parentNode||(t.style.animation="slideOutRight 0.3s ease-in",setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t);const n=this.currentToasts.indexOf(t);n>-1&&this.currentToasts.splice(n,1)},300))}clearAll(){this.currentToasts.forEach(t=>{this.removeToast(t)})}}class We{constructor(){this.logger=new $e,this.displayer=new je,this.handlers=new Map,this.globalHandler=null,this.init()}init(){this.logger.loadFromLocalStorage(),this.setupGlobalErrorHandling(),this.setupBackendErrorHandling()}setupGlobalErrorHandling(){window.addEventListener("error",t=>{console.error("JavaScript error:",t.message,"at",t.filename+":"+t.lineno),console.trace("Error trace:"),t.preventDefault()}),window.addEventListener("unhandledrejection",t=>{console.error("Unhandled promise rejection:",t.reason),console.trace("Promise rejection trace:"),t.preventDefault()})}setupBackendErrorHandling(){window.runtime&&window.runtime.EventsOn&&window.runtime.EventsOn("error",t=>{const n=new W(t.code,t.message,t.type);t.details&&n.withDetails(t.details),t.context&&Object.keys(t.context).forEach(s=>{n.withContext(s,t.context[s])}),this.handleError(n,{fromBackend:!0})})}handleError(t,n={}){this.logger.logError(t,n);const s=this.handlers.get(t.code);if(s)try{s(t,n);return}catch(i){console.error("Error in custom error handler:",i)}if(this.globalHandler)try{this.globalHandler(t,n);return}catch(i){console.error("Error in global error handler:",i)}this.displayer.showError(t,{showDetails:!1,duration:this.getDisplayDuration(t)})}getDisplayDuration(t){switch(t.level){case b.CRITICAL:return 0;case b.ERROR:return 8e3;case b.WARNING:return 5e3;default:return 3e3}}registerHandler(t,n){this.handlers.set(t,n)}unregisterHandler(t){this.handlers.delete(t)}setGlobalHandler(t){this.globalHandler=t}createError(t,n,s=z.USER){return new W(t,n,s)}getErrorStats(){const t=this.logger.getRecentErrors(100),n={total:t.length,byType:{},byCode:{},recent:t.slice(-10)};return t.forEach(s=>{const i=s.error;n.byType[i.type]=(n.byType[i.type]||0)+1,n.byCode[i.code]=(n.byCode[i.code]||0)+1}),n}}const pe=new We;window.ErrorManager=pe;window.AppError=W;window.ErrorCodes=l;window.ErrorTypes=z;window.ErrorLevels=b;window.handleError=(e,t)=>pe.handleError(e,t);window.createError=(e,t,n)=>pe.createError(e,t,n);class Ce{constructor(){this.debounceTimers=new Map,this.throttleTimers=new Map,this.memoryMonitor=null,this.performanceMetrics={startTime:performance.now(),operations:[],memoryUsage:[]},this.initMemoryMonitoring()}debounce(t,n,s="default"){return(...i)=>{this.debounceTimers.has(s)&&clearTimeout(this.debounceTimers.get(s));const o=setTimeout(()=>{t.apply(this,i),this.debounceTimers.delete(s)},n);this.debounceTimers.set(s,o)}}throttle(t,n,s="default"){return(...i)=>{this.throttleTimers.has(s)||(t.apply(this,i),this.throttleTimers.set(s,!0),setTimeout(()=>{this.throttleTimers.delete(s)},n))}}initMemoryMonitoring(){"memory"in performance&&(this.memoryMonitor=setInterval(()=>{const t={used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit,timestamp:Date.now()};this.performanceMetrics.memoryUsage.push(t),this.performanceMetrics.memoryUsage.length>100&&this.performanceMetrics.memoryUsage.shift();const n=t.used/t.total;n>.8&&(console.warn("内存使用率过高:",(n*100).toFixed(2)+"%"),this.emitMemoryWarning(t))},5e3))}emitMemoryWarning(t){const n=new CustomEvent("memoryWarning",{detail:{usage:t,recommendations:this.getMemoryOptimizationTips()}});window.dispatchEvent(n)}getMemoryOptimizationTips(){return["关闭不需要的预览窗口","清理临时文件缓存","减少同时处理的文件数量","刷新页面释放内存"]}startOperation(t){const n={name:t,startTime:performance.now(),endTime:null,duration:null};return this.performanceMetrics.operations.push(n),this.performanceMetrics.operations.length-1}endOperation(t){if(t>=0&&t<this.performanceMetrics.operations.length){const n=this.performanceMetrics.operations[t];return n.endTime=performance.now(),n.duration=n.endTime-n.startTime,console.log(`操作 ${n.name} 耗时: ${n.duration.toFixed(2)}ms`),n.duration>1e3&&console.warn(`慢操作检测: ${n.name} 耗时 ${n.duration.toFixed(2)}ms`),n}}getPerformanceReport(){const t=performance.now()-this.performanceMetrics.startTime,n=this.performanceMetrics.operations.filter(r=>r.duration!==null),s=n.length>0?n.reduce((r,a)=>r+a.duration,0)/n.length:0,i=n.filter(r=>r.duration>1e3),o=this.getCurrentMemoryUsage();return{sessionDuration:t,totalOperations:n.length,averageOperationTime:s,slowOperations:i,currentMemory:o,memoryHistory:this.performanceMetrics.memoryUsage.slice(-10)}}getCurrentMemoryUsage(){return"memory"in performance?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit,usagePercentage:(performance.memory.usedJSHeapSize/performance.memory.totalJSHeapSize*100).toFixed(2)}:null}createVirtualList(t,n,s,i,o=5){return new Ze(t,n,s,i,o)}createRequestQueue(t=3){return new Je(t)}cleanup(){this.debounceTimers.forEach(t=>clearTimeout(t)),this.debounceTimers.clear(),this.throttleTimers.clear(),this.memoryMonitor&&(clearInterval(this.memoryMonitor),this.memoryMonitor=null),console.log("性能工具已清理")}}class Ze{constructor(t,n,s,i,o=5){this.container=t,this.items=n,this.itemHeight=s,this.renderItem=i,this.bufferSize=o,this.scrollTop=0,this.containerHeight=t.clientHeight,this.visibleStart=0,this.visibleEnd=0,this.init()}init(){this.scrollContainer=document.createElement("div"),this.scrollContainer.style.height=`${this.items.length*this.itemHeight}px`,this.scrollContainer.style.position="relative",this.visibleContainer=document.createElement("div"),this.visibleContainer.style.position="absolute",this.visibleContainer.style.top="0",this.visibleContainer.style.width="100%",this.scrollContainer.appendChild(this.visibleContainer),this.container.appendChild(this.scrollContainer),this.container.addEventListener("scroll",this.handleScroll.bind(this)),this.updateVisibleItems()}handleScroll(){this.scrollTop=this.container.scrollTop,this.updateVisibleItems()}updateVisibleItems(){const t=this.container.clientHeight;this.visibleStart=Math.max(0,Math.floor(this.scrollTop/this.itemHeight)-this.bufferSize),this.visibleEnd=Math.min(this.items.length-1,Math.ceil((this.scrollTop+t)/this.itemHeight)+this.bufferSize),this.visibleContainer.innerHTML="";for(let n=this.visibleStart;n<=this.visibleEnd;n++){const s=this.items[n],i=this.renderItem(s,n);i.style.position="absolute",i.style.top=`${n*this.itemHeight}px`,i.style.height=`${this.itemHeight}px`,this.visibleContainer.appendChild(i)}}updateItems(t){this.items=t,this.scrollContainer.style.height=`${this.items.length*this.itemHeight}px`,this.updateVisibleItems()}}class Je{constructor(t=3){this.maxConcurrent=t,this.currentRequests=0,this.queue=[]}add(t,n=0){return new Promise((s,i)=>{const o={fn:t,resolve:s,reject:i,priority:n,timestamp:Date.now()},r=this.queue.findIndex(a=>a.priority<n);r===-1?this.queue.push(o):this.queue.splice(r,0,o),this.processNext()})}async processNext(){if(console.log(`请求队列状态: 当前请求=${this.currentRequests}, 最大并发=${this.maxConcurrent}, 队列长度=${this.queue.length}`),this.currentRequests>=this.maxConcurrent||this.queue.length===0){console.log("跳过处理: 达到最大并发或队列为空");return}const t=this.queue.shift();this.currentRequests++,console.log(`开始处理请求, 优先级=${t.priority}, 当前活跃请求=${this.currentRequests}`);try{const n=await t.fn();console.log("请求执行成功"),t.resolve(n)}catch(n){console.error("请求执行失败:",n),t.reject(n)}finally{this.currentRequests--,console.log(`请求完成，当前活跃请求=${this.currentRequests}`),this.processNext()}}clear(){this.queue.forEach(t=>{t.reject(new Error("Request queue cleared"))}),this.queue=[]}getStatus(){return{queueSize:this.queue.length,currentRequests:this.currentRequests,maxConcurrent:this.maxConcurrent}}}window.PerformanceUtils=Ce;window.performanceUtils=new Ce;window.addEventListener("beforeunload",()=>{window.performanceUtils&&window.performanceUtils.cleanup()});const Xe="/assets/logo-universal-Dm-wv4TN.png";function Ke(e){return window.go.main.App.AnalyzeTuzhong(e)}function ze(){return window.go.main.App.DisableFileSizeCheck()}function Ye(e,t){return window.go.main.App.ExtractFromTuzhong(e,t)}function Qe(e,t,n){return window.go.main.App.ExtractFromTuzhongWithInfo(e,t,n)}function Oe(){return window.go.main.App.GetConfig()}function et(e){return window.go.main.App.GetImageBase64(e)}function tt(e,t,n){return window.go.main.App.MergeFiles(e,t,n)}function nt(e){return window.go.main.App.OpenFileLocation(e)}function st(){return window.go.main.App.RemoveAllSizeLimits()}function it(e){return window.go.main.App.SelectExtractLocation(e)}function ot(){return window.go.main.App.SelectFile()}function rt(){return window.go.main.App.SelectFolder()}function at(){return window.go.main.App.SelectImageFile()}function lt(e){return window.go.main.App.SelectSaveLocation(e)}function ct(){return window.go.main.App.SelectTuzhongFile()}function dt(){return window.go.main.App.SetImageSizeLimit1GB()}function ut(){return window.go.main.App.SetImageSizeLimit2GB()}function te(e){return window.go.main.App.UpdateFileSizeLimits(e)}function mt(e,t,n){return window.runtime.EventsOnMultiple(e,t,n)}function ke(e,t){return mt(e,t,-1)}function we(){window.runtime.WindowSetLightTheme()}function Ee(){window.runtime.WindowSetDarkTheme()}function be(e,t){return window.runtime.OnFileDrop(e,t)}window.fixImageSizeLimit=async()=>{try{return console.log("正在禁用文件大小检查..."),await ze(),console.log("✅ 文件大小检查已禁用，现在可以处理任意大小的图片"),"文件大小检查已禁用"}catch(e){return console.error("❌ 禁用文件大小检查失败:",e),"禁用失败: "+e}};window.setImageLimit1GB=async()=>{try{return await dt(),console.log("✅ 图片大小限制已设置为1GB"),"图片大小限制已设置为1GB"}catch(e){return console.error("❌ 设置失败:",e),"设置失败: "+e}};window.setImageLimit2GB=async()=>{try{return await ut(),console.log("✅ 图片大小限制已设置为2GB"),"图片大小限制已设置为2GB"}catch(e){return console.error("❌ 设置失败:",e),"设置失败: "+e}};window.checkCurrentConfig=async()=>{try{const e=await Oe();return console.log("当前配置:",e),console.log(`图片大小限制: ${e.fileSizeLimits.maxImageSize/(1024*1024)} MB`),console.log(`大小检查启用: ${e.fileSizeLimits.enableSizeCheck}`),e}catch(e){return console.error("❌ 获取配置失败:",e),null}};window.addEventListener("DOMContentLoaded",()=>{window.ErrorManager&&(window.ErrorManager.registerHandler(window.ErrorCodes.FILE_NOT_FOUND,e=>{window.ErrorManager.displayer.showError(e,{duration:5e3,showDetails:!1})}),window.ErrorManager.registerHandler(window.ErrorCodes.FILE_TOO_LARGE,e=>{window.ErrorManager.displayer.showError(e,{duration:8e3,showDetails:!0})}),window.ErrorManager.registerHandler(window.ErrorCodes.ZIP_INVALID,e=>{window.ErrorManager.displayer.showError(e,{duration:6e3,showDetails:!0})}))});document.querySelector("#app").innerHTML=`
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
    
    <!-- 自定义确认对话框 -->
    <div id="confirmDialog" class="modal hidden">
        <div class="modal-content confirm-dialog">
            <div class="confirm-header">
                <svg class="confirm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
                <h3 id="confirmTitle">确认操作</h3>
            </div>
            <div class="confirm-body">
                <p id="confirmMessage">您确定要执行此操作吗？</p>
            </div>
            <div class="confirm-footer">
                <button id="confirmCancelBtn" class="secondary-btn">取消</button>
                <button id="confirmOkBtn" class="danger-btn">确定</button>
            </div>
        </div>
    </div>
`;document.getElementById("logo").src=Xe;let pt=document.getElementById("selectImageBtn"),gt=document.getElementById("selectFileBtn"),ft=document.getElementById("selectFolderBtn"),ht=document.getElementById("outputName"),vt=document.getElementById("generateBtn"),u=document.getElementById("result"),Z=document.getElementById("imageResult"),J=document.getElementById("targetResult"),X=document.getElementById("miniPreviewContainer"),E=document.getElementById("miniPreviewImage"),D=document.querySelector(".mini-preview-loading"),g=document.getElementById("themeToggle"),yt=document.getElementById("selectTuzhongBtn"),N=document.getElementById("analyzeBtn"),f=document.getElementById("extractBtn"),K=document.getElementById("tuzhongResult"),T=document.getElementById("tuzhongInfo"),m=document.getElementById("extractResult"),Ae=document.getElementById("createTab"),Pe=document.getElementById("extractTab"),wt=document.getElementById("createPanel"),Et=document.getElementById("extractPanel"),L=document.getElementById("progressModal"),xe=document.getElementById("progressStage"),_=document.getElementById("progressDetail"),Se=document.getElementById("progressBar"),bt=document.getElementById("progressPercentage"),xt=document.getElementById("cancelProgressBtn"),St=document.getElementById("progressStepsCreate"),It=document.getElementById("progressStepsExtract"),Ie=L?L.querySelector(".progress-header h3"):null,B=document.getElementById("successModal"),Tt=document.getElementById("successMessage"),ie=document.getElementById("successPath"),F=document.getElementById("openLocationBtn"),Lt=document.getElementById("closeSuccessBtn"),Te=B?B.querySelector(".success-header h3"):null,R=document.getElementById("confirmDialog"),Bt=document.getElementById("confirmTitle"),Mt=document.getElementById("confirmMessage"),M=document.getElementById("confirmOkBtn"),I=document.getElementById("confirmCancelBtn"),Y="",Q="",w="",k="",y=null;const de="tuzhong-theme";let ue="theme-dark";const Ct=[".png",".jpg",".jpeg",".gif",".bmp",".webp"],ge={create:["start","compress","merge","complete"],extract:["start","analyze","extract","complete"]},G={start:"准备开始...",compress:"正在压缩文件...",merge:"正在生成图种...",analyze:"正在解析图种结构...",extract:"正在提取隐藏文件...",complete:"操作完成！"};let p="create";const fe={create:St,extract:It};function De(e,t="确认操作",n="确定",s="取消"){return new Promise(i=>{Bt.textContent=t,Mt.textContent=e,M.textContent=n,I.textContent=s;const o=M.cloneNode(!0),r=I.cloneNode(!0);M.parentNode.replaceChild(o,M),I.parentNode.replaceChild(r,I),M=o,I=r,M.addEventListener("click",()=>{q(),i(!0)}),I.addEventListener("click",()=>{q(),i(!1)});const a=S=>{S.key==="Escape"&&(document.removeEventListener("keydown",a),q(),i(!1))};document.addEventListener("keydown",a);const P=S=>{S.target===R&&(R.removeEventListener("click",P),q(),i(!1))};R.addEventListener("click",P),R.classList.remove("hidden"),setTimeout(()=>{I.focus()},100)})}function q(){R.classList.add("hidden")}Ae.addEventListener("click",function(){he("create")});Pe.addEventListener("click",function(){he("extract")});document.getElementById("settingsTab").addEventListener("click",function(){he("settings")});function he(e){document.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active")),document.querySelectorAll(".tab-panel").forEach(t=>t.classList.remove("active")),e==="create"?(Ae.classList.add("active"),wt.classList.add("active")):e==="extract"?(Pe.classList.add("active"),Et.classList.add("active")):e==="settings"&&(document.getElementById("settingsTab").classList.add("active"),document.getElementById("settingsPanel").classList.add("active"),H()),d("",""),c("","")}pt.addEventListener("click",function(){at().then(e=>{e&&(console.log("选择的图片路径:",e),Ne(e))}).catch(e=>{console.error("选择图片失败:",e),d("选择图片失败: "+e,"error")})});gt.addEventListener("click",function(){ot().then(e=>{e&&ve(e,"file")}).catch(e=>{console.error("选择文件失败:",e)})});ft.addEventListener("click",function(){rt().then(e=>{e&&ve(e,"folder")}).catch(e=>{console.error("选择文件夹失败:",e)})});yt.addEventListener("click",function(){ct().then(e=>{e&&(console.log("选择的图种文件路径:",e),Fe(e))}).catch(e=>{console.error("选择图种文件失败:",e),c("选择图种文件失败: "+e,"error")})});N.addEventListener("click",function(){if(!w){c("请先选择图种文件","error");return}A(),oe(!0),c("","");try{ne.add(()=>Ke(w),1).then(e=>{y=e,e&&e.isValid?(qt(e),T.classList.remove("hidden"),f.disabled=!1,f.classList.remove("secondary")):(c(e.errorMessage||"解析失败：这不是一个有效的图种文件。","error"),T.classList.add("hidden"),f.disabled=!0,f.classList.add("secondary"))}).catch(e=>{console.error("图种分析错误:",e);const t=e.message||e.toString()||"未知错误";c("分析失败: "+t,"error"),T.classList.add("hidden"),f.disabled=!0,f.classList.add("secondary")}).finally(()=>{oe(!1)})}catch(e){console.error("分析操作同步错误:",e),c("分析失败: "+(e.message||e),"error"),oe(!1)}});f.addEventListener("click",function(){if(!w||!y||!y.isValid){c("请先分析图种文件","error");return}const e=w.split("\\").pop().split("/").pop(),n=(e.substring(0,e.lastIndexOf("."))||e)+"_extracted";it(n).then(s=>s?(_e("extract"),console.log("开始提取操作，文件路径:",w,"输出路径:",s),console.log("使用已分析的图种信息:",y),ne.add(()=>(console.log("请求队列：开始执行ExtractFromTuzhongWithInfo"),y&&y.imageSize?Qe(w,s,y.imageSize):(console.warn("警告：没有找到分析信息，使用原版本可能较慢"),Ye(w,s))),2).then(()=>{console.log("ExtractFromTuzhongWithInfo执行完成"),k=s}).catch(i=>{throw console.error("ExtractFromTuzhongWithInfo执行失败:",i),i})):(c("已取消提取","info"),Promise.reject("用户取消"))).catch(s=>{s!=="用户取消"&&(A(),c(`提取失败: ${s}`,"error"))})});vt.addEventListener("click",function(){const e=ht.value.trim();try{if(!Y)throw window.createError(window.ErrorCodes.INVALID_INPUT,"请选择封面图片",window.ErrorTypes.VALIDATION);if(!Q)throw window.createError(window.ErrorCodes.INVALID_INPUT,"请选择要隐藏的文件或文件夹",window.ErrorTypes.VALIDATION);if(!e)throw window.createError(window.ErrorCodes.INVALID_INPUT,"请输入输出文件名",window.ErrorTypes.VALIDATION);lt().then(t=>{if(t)return k=t,_e("create"),ne.add(()=>tt(Y,Q,t),2);{const n=window.createError(window.ErrorCodes.CANCELLED,"已取消保存",window.ErrorTypes.USER);return window.handleError(n),Promise.reject("用户取消")}}).then(t=>{}).catch(t=>{t!=="用户取消"&&(console.error("生成操作失败:",t),setTimeout(()=>{A(),d(`生成失败: ${t.message||t}`,"error")},100))})}catch(t){console.error("生成操作同步错误:",t),d("生成失败: "+(t.message||t),"error")}});function Ne(e){if(e)try{if(!Re(e))throw window.createError(window.ErrorCodes.IMAGE_UNSUPPORTED,"请选择有效的图片文件（支持 PNG/JPG/GIF/BMP/WEBP）",window.ErrorTypes.VALIDATION).withContext("filePath",e);At(e)}catch(t){window.handleError(t)}}const zt=window.performanceUtils.debounce(Pt,300,"imageSelection"),Ot=window.performanceUtils.debounce(Ft,300,"targetSelection"),kt=window.performanceUtils.debounce(Nt,300,"tuzhongSelection"),ne=window.performanceUtils.createRequestQueue(2);function At(e){zt(e)}function Pt(e){const t=window.performanceUtils.startOperation("setImageSelection");Y=e;const n=Z.querySelector(".file-name");n.textContent=`已选择: ${ye(e)}`,Z.className="file-result success",_t(e),d("",""),window.performanceUtils.endOperation(t)}function Fe(e){if(e){if(!Re(e)){c("请选择有效的图片文件","error");return}Dt(e)}}function Dt(e){kt(e)}function Nt(e){const t=window.performanceUtils.startOperation("setTuzhongSelection");w=e;const n=K.querySelector(".file-name");n.textContent=`已选择: ${ye(e)}`,K.className="file-result success",y=null,hideTuzhongMiniPreview(),T.classList.add("hidden"),f.disabled=!0,f.classList.add("secondary"),c("",""),window.performanceUtils.endOperation(t)}function ve(e,t="auto"){Ot(e,t)}function Ft(e,t="auto"){if(!e)return;const n=window.performanceUtils.startOperation("setTargetSelection");Q=e;const s=J.querySelector(".file-name"),i=ye(e);let o="已选择:";t==="file"?o="已选择文件:":t==="folder"&&(o="已选择文件夹:"),s.textContent=`${o} ${i}`,J.className="file-result success",d("",""),window.performanceUtils.endOperation(n)}function ye(e){return e.replace(/\\/g,"/").split("/").pop()||e}function Re(e){const t=e.toLowerCase();return Ct.some(n=>t.endsWith(n))}function d(e,t){u.textContent=e,u.className=`result ${t}`,t==="error"&&e?(u.style.cursor="pointer",u.title="点击清除错误信息",u.onclick=function(){d("",""),u.onclick=null,u.style.cursor="default",u.title=""},setTimeout(()=>{u.className.includes("error")&&(d("",""),u.onclick=null,u.style.cursor="default",u.title="")},5e3)):(u.style.cursor="default",u.title="",u.onclick=null)}function Rt(){Y="";const e=Z.querySelector(".file-name");e.textContent="",Z.className="file-result",Ue(),d("","")}function Ut(){Q="";const e=J.querySelector(".file-name");e.textContent="",J.className="file-result",d("","")}function _t(e){console.log("开始加载图片预览:",e),d("",""),X.classList.remove("hidden"),D.style.display="block",E.style.display="none",E.onload=null,E.onerror=null,ne.add(()=>et(e),3).then(t=>{console.log("成功获取图片base64数据，长度:",t.length),E.onload=function(){console.log("图片加载成功"),D.style.display="none",E.style.display="block",d("","")},E.onerror=function(){console.error("图片渲染失败，可能的原因：base64格式错误或浏览器不支持该格式"),D.style.display="none",Le("图片显示失败")},E.src=t}).catch(t=>{console.error("获取图片预览失败:",t),D.style.display="none",Le("预览失败: "+t)})}function Le(e){X.innerHTML=`
        <div class="preview-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
        </div>
    `,console.warn("预览错误:",e),setTimeout(()=>{Ue()},3e3)}function Ue(){X.classList.add("hidden"),X.innerHTML=`
        <img id="miniPreviewImage" class="mini-preview-image" src="" alt="预览"/>
        <div class="mini-preview-loading">
            <div class="mini-loading-spinner"></div>
        </div>
    `,E=document.getElementById("miniPreviewImage"),D=document.querySelector(".mini-preview-loading"),d("","")}window.clearImageSelection=Rt;window.clearTargetSelection=Ut;window.clearTuzhongSelection=Ht;function Ht(){w="",y=null;const e=K.querySelector(".file-name");e.textContent="",K.className="file-result",T.classList.add("hidden"),f.disabled=!0,f.classList.add("secondary"),c("","")}function qt(e){if(!e.isValid){T.classList.add("hidden");return}document.getElementById("totalSizeInfo").textContent=O(e.totalSize),document.getElementById("imageSizeInfo").textContent=O(e.imageSize),document.getElementById("hiddenSizeInfo").textContent=O(e.hiddenSize),document.getElementById("imageFormatInfo").textContent=e.imageFormat;const t=document.getElementById("hiddenFilesList");if(e.hiddenFiles&&e.hiddenFiles.length>0){const n=document.createDocumentFragment();t.innerHTML="",e.hiddenFiles.forEach(s=>{const i=document.createElement("div");i.className="file-item",i.innerHTML=`
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>${s}</span>
            `,n.appendChild(i)}),t.appendChild(n)}else t.innerHTML='<span class="no-files">没有找到文件</span>';T.classList.remove("hidden")}function O(e){if(e===0)return"0 B";const t=1024,n=["B","KB","MB","GB"],s=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,s)).toFixed(2))+" "+n[s]}function oe(e){e?(N.classList.add("loading"),N.disabled=!0):(N.classList.remove("loading"),N.disabled=!1)}function c(e,t){m.textContent=e,m.className=`result ${t}`,t==="error"&&e?(m.style.cursor="pointer",m.title="点击清除错误信息",m.onclick=function(){c("",""),m.onclick=null,m.style.cursor="default",m.title=""},setTimeout(()=>{m.className.includes("error")&&(c("",""),m.onclick=null,m.style.cursor="default",m.title="")},5e3)):(m.style.cursor="default",m.title="",m.onclick=null)}let me=0,Gt=80;ke("progress",function(e){const t=Date.now();if(e.step==="complete"||t-me>=Gt){const n={totalSize:e.totalSize||null,currentSize:e.currentSize||null,speed:e.speed||null};He(e.percent,e.message,e.step,n),me=t}e.step==="complete"&&setTimeout(()=>{A();const n=k||"（未知路径）",s=p==="create"?`图种生成完成！文件已保存到: ${n}`:`提取完成！文件已保存到: ${n}`;p==="create"?d(s,"success"):c(s,"success"),rn(k,p)},500)});ke("operationError",function(e){console.error("操作失败:",e),A();const t=e.message||e.error||"操作失败";p==="create"?d(`生成失败: ${t}`,"error"):c(`提取失败: ${t}`,"error")});function _e(e="create"){p=ge[e]?e:"create",Zt(),Ie&&(Ie.textContent=p==="create"?"生成图种":"提取文件"),Object.entries(fe).forEach(([t,n])=>{n&&(t===p?n.classList.remove("hidden"):n.classList.add("hidden"))}),Jt(),requestAnimationFrame(()=>{L.style.display="flex",requestAnimationFrame(()=>{L.classList.remove("hidden")})}),He(0,G.start,"start"),me=0}function A(){L.classList.add("hidden"),setTimeout(()=>{L.classList.contains("hidden")&&(L.style.display="none")},300)}let V=0,U=0,C=0,$=0,j=0;const Vt=window.performanceUtils.throttle($t,16,"progress");function He(e,t,n,s={}){const i=window.performanceUtils.startOperation(`updateProgress-${n}`);Vt(e,t,n,s,i)}function $t(e,t,n,s,i){requestAnimationFrame(()=>{const o=Date.now();if(xe){const a=G[n]||t||G.start;xe.textContent=a}if(_){const a=G[n];t&&t!==a?_.textContent=t:_.textContent=""}const r=parseFloat(Se.style.width)||0;Math.abs(e-r)>.1&&(Se.style.width=e+"%"),bt.textContent=Math.round(e)+"%",jt(e,s,o),Xt(n),i!==void 0&&window.performanceUtils.endOperation(i)})}function jt(e,t,n){const s=document.getElementById("fileSize"),i=document.getElementById("processSpeed"),o=document.getElementById("remainingTime");if(!s||!i||!o)return;t.totalSize?(C=t.totalSize,s.textContent=O(C)):t.currentSize&&(s.textContent=O(t.currentSize)),V===0&&(V=n,$=n,j=0);const r=(n-V)/1e3,a=(n-$)/1e3;if(C>0&&r>.5){if(U=Math.floor(e/100*C),a>=1){const S=(U-j)/a;if(S>0){i.textContent=O(S)+"/s";const se=(C-U)/S;se>0&&se<3600?o.textContent=Wt(se):o.textContent="--"}$=n,j=U}}else e>=99&&(i.textContent="完成",o.textContent="00:00")}function Wt(e){const t=Math.floor(e/60),n=Math.floor(e%60);return`${t.toString().padStart(2,"0")}:${n.toString().padStart(2,"0")}`}function Zt(){V=0,U=0,C=0,$=0,j=0;const e=document.getElementById("fileSize"),t=document.getElementById("processSpeed"),n=document.getElementById("remainingTime");e&&(e.textContent="计算中..."),t&&(t.textContent="--"),n&&(n.textContent="计算中...")}function Jt(){document.querySelectorAll(".progress-step").forEach(n=>{n.classList.remove("active","completed")});const e=fe[p],t=ge[p]||[];if(e&&t.length>0){const n=e.querySelector(`.progress-step[data-step="${t[0]}"]`);n&&n.classList.add("active")}_&&(_.textContent="")}function Xt(e){const t=fe[p];if(!t)return;const n=ge[p]||[];if(!e||n.indexOf(e)===-1)return;const s=n.indexOf(e);n.forEach((i,o)=>{const r=t.querySelector(`.progress-step[data-step="${i}"]`);r&&(o<s?(r.classList.add("completed"),r.classList.remove("active")):o===s?(r.classList.add("active"),r.classList.remove("completed")):r.classList.remove("active","completed"))})}function Kt(){const e=window.matchMedia("(prefers-color-scheme: dark)"),t=localStorage.getItem(de);let n;t?n=t:n=e.matches?"theme-dark":"theme-light",re(n,{persist:!1}),e.addListener(s=>{if(!localStorage.getItem(de)){const i=s.matches?"theme-dark":"theme-light";re(i,{persist:!1})}}),g&&(g.addEventListener("click",()=>{g.style.transform="scale(0.95)",setTimeout(()=>{g.style.transform=""},150),re(ue==="theme-dark"?"theme-light":"theme-dark")}),g.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),g.click())}))}function re(e,t={}){const n=e==="theme-light"?"theme-light":"theme-dark";if(ue!==n){document.body.classList.add("theme-transitioning"),ue=n,document.body.classList.remove("theme-dark","theme-light"),document.body.classList.add(n),Yt(n),t.persist!==!1&&localStorage.setItem(de,n);try{n==="theme-dark"&&typeof Ee=="function"?Ee():n==="theme-light"&&typeof we=="function"&&we()}catch(s){console.warn("同步系统主题失败:",s)}setTimeout(()=>{document.body.classList.remove("theme-transitioning")},300),window.dispatchEvent(new CustomEvent("themeChanged",{detail:{theme:n}}))}}function Yt(e){if(!g)return;g.setAttribute("data-theme",e),g.setAttribute("aria-pressed",e==="theme-light"?"true":"false");const t=g.querySelector(".theme-toggle-text");if(t){const s=e==="theme-dark"?"浅色模式":"深色模式";t.style.opacity="0",setTimeout(()=>{t.textContent=s,t.style.opacity="1"},150)}g.querySelectorAll(".theme-icon").forEach(s=>{s.style.transform="rotate(180deg)",setTimeout(()=>{s.style.transform=""},300)})}function Qt(){if(document.querySelectorAll("[data-drop-target]").forEach(t=>{t.style.setProperty("--wails-drop-target","drop"),en(t)}),typeof be!="function"){console.warn("当前环境未启用文件拖放功能");return}try{be((t,n,s)=>{if(on(),!s||s.length===0){v("没有检测到有效文件","error");return}const i=document.elementFromPoint(t,n);if(!i)return;const o=i.closest("[data-drop-target]");if(!o){v("请将文件拖放到正确的区域","warning");return}const r=o.getAttribute("data-drop-target");s.length>1&&r!=="target"&&v(`检测到${s.length}个文件，将处理第一个文件`,"info");const a=s[0];if(r==="image")tn(a)?(Ne(a),v("图片文件添加成功","success")):v("请拖放有效的图片文件 (jpg, jpeg, png, gif, bmp, webp)","error");else if(r==="target"){ve(a);const P=a.split("\\").pop()||a.split("/").pop();v(`文件 "${P}" 添加成功`,"success")}else r==="tuzhong"&&(nn(a)?(Fe(a),v("图种文件添加成功","success")):v("请拖放有效的图种文件","error"))},!0)}catch(t){console.error("初始化拖放事件失败:",t),v("文件拖放功能初始化失败","error")}}function en(e){let t=0;e.addEventListener("dragenter",n=>{n.preventDefault(),t++,e.classList.add("drag-over");const s=e.getAttribute("data-drop-target");sn(s)}),e.addEventListener("dragleave",n=>{n.preventDefault(),t--,t===0&&(e.classList.remove("drag-over"),Be())}),e.addEventListener("dragover",n=>{n.preventDefault(),n.dataTransfer.dropEffect="copy"}),e.addEventListener("drop",n=>{n.preventDefault(),t=0,e.classList.remove("drag-over"),Be()})}function tn(e){return/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(e)}function nn(e){return/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(e)}function sn(e){const n={image:"拖放图片文件作为封面",target:"拖放要隐藏的文件或文件夹",tuzhong:"拖放图种文件进行解析"}[e]||"拖放文件到此区域";v(n,"info",!0)}function Be(){const e=document.querySelector(".drop-message.persistent");e&&e.remove()}function v(e,t="info",n=!1){const s=document.querySelector(".drop-message");s&&s.remove();const i=document.createElement("div");i.className=`drop-message drop-message-${t} ${n?"persistent":""}`,i.textContent=e,Object.assign(i.style,{position:"fixed",top:"20px",right:"20px",padding:"12px 20px",borderRadius:"8px",color:"white",fontWeight:"500",fontSize:"14px",zIndex:"10000",maxWidth:"300px",wordWrap:"break-word",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.15)",transform:"translateX(100%)",transition:"transform 0.3s ease",backdropFilter:"blur(10px)"});const o={success:"rgba(34, 197, 94, 0.9)",error:"rgba(239, 68, 68, 0.9)",warning:"rgba(245, 158, 11, 0.9)",info:"rgba(59, 130, 246, 0.9)"};i.style.background=o[t]||o.info,document.body.appendChild(i),requestAnimationFrame(()=>{i.style.transform="translateX(0)"}),n||setTimeout(()=>{i.parentNode&&(i.style.transform="translateX(100%)",setTimeout(()=>{i.parentNode&&i.remove()},300))},3e3)}function on(){document.querySelectorAll("[data-drop-target]").forEach(t=>{t.classList.remove("drag-over","wails-drop-target-active")})}function rn(e,t="create"){const n=e||"",s=t==="create",i=!!n,o=s?"生成成功":"提取完成",r=s?"图种文件已成功保存！":"隐藏文件已成功提取！";Tt.textContent=r,ie&&(ie.textContent=i?n:"路径不可用",ie.classList.toggle("hidden",!i)),Te&&(Te.textContent=o),F&&(F.textContent=s?"打开位置":"打开提取文件夹",F.disabled=!i,F.classList.toggle("disabled",!i)),requestAnimationFrame(()=>{B.style.display="flex",requestAnimationFrame(()=>{B.classList.remove("hidden")})})}function qe(){B.classList.add("hidden"),setTimeout(()=>{B.classList.contains("hidden")&&(B.style.display="none")},300)}xt.addEventListener("click",function(){A(),p==="create"?d("用户取消了操作","info"):c("用户取消了操作","info")});Lt.addEventListener("click",function(){qe()});F.addEventListener("click",function(){if(k)nt(k).catch(e=>{console.error("打开文件位置失败:",e)});else return;qe()});Kt();Qt();async function H(){try{const t=(await Oe()).fileSizeLimits;document.getElementById("enableSizeCheck").checked=t.enableSizeCheck,ae("maxImageSize","imageSizeUnit",t.maxImageSize),ae("maxZipSize","zipSizeUnit",t.maxZipSize),ae("maxGeneralFileSize","generalFileSizeUnit",t.maxGeneralFile),Ge(t.enableSizeCheck)}catch(e){console.error("加载设置失败:",e),h("加载设置失败: "+e.message)}}function ae(e,t,n){const s=document.getElementById(e),i=document.getElementById(t);if(n===0){s.value=0,i.value="MB";return}const o=n/(1024*1024),r=n/(1024*1024*1024);r>=1?(s.value=Math.round(r*100)/100,i.value="GB"):(s.value=Math.round(o*100)/100,i.value="MB")}function le(e,t){const n=parseFloat(document.getElementById(e).value),s=document.getElementById(t).value;return isNaN(n)||n<=0?0:Math.round(s==="GB"?n*1024*1024*1024:n*1024*1024)}function Ge(e){["imageSizeGroup","zipSizeGroup","generalFileSizeGroup"].forEach(n=>{const s=document.getElementById(n);s.querySelectorAll("input, select").forEach(o=>{o.disabled=!e}),e?s.classList.remove("disabled"):s.classList.add("disabled")})}document.getElementById("enableSizeCheck").addEventListener("change",function(){Ge(this.checked)});document.getElementById("saveSettingsBtn").addEventListener("click",async function(){const e=this,t=e.querySelector(".btn-text"),n=e.querySelector(".btn-loading");try{if(e.disabled=!0,t.style.opacity="0",n.style.display="flex",document.getElementById("enableSizeCheck").checked){const i={maxImageSize:le("maxImageSize","imageSizeUnit"),maxZipSize:le("maxZipSize","zipSizeUnit"),maxGeneralFile:le("maxGeneralFileSize","generalFileSizeUnit"),enableSizeCheck:!0};await te(i)}else await ze();x("设置已保存")}catch(s){console.error("保存设置失败:",s),h("保存设置失败: "+s.message)}finally{e.disabled=!1,t.style.opacity="1",n.style.display="none"}});document.getElementById("resetSettingsBtn").addEventListener("click",async function(){const e=this,t=e.querySelector(".btn-text"),n=e.querySelector(".btn-loading");try{e.disabled=!0,t.style.opacity="0",n.style.display="flex";const s={maxImageSize:200*1024*1024,maxZipSize:2*1024*1024*1024,maxGeneralFile:10*1024*1024*1024,enableSizeCheck:!0};await te(s),await H(),x("设置已重置为默认值")}catch(s){console.error("重置设置失败:",s),h("重置设置失败: "+s.message)}finally{e.disabled=!1,t.style.opacity="1",n.style.display="none"}});document.getElementById("removeAllLimitsBtn").addEventListener("click",async function(){if(await De("确定要移除所有文件大小限制吗？这将允许处理任意大小的文件，可能会影响性能。","移除文件大小限制","移除限制","取消"))try{await st(),await H(),x("已移除所有文件大小限制")}catch(t){console.error("移除限制失败:",t),h("移除限制失败: "+t.message)}});document.getElementById("setConservativeLimitsBtn").addEventListener("click",async function(){const e={maxImageSize:20971520,maxZipSize:524288e3,maxGeneralFile:1073741824,enableSizeCheck:!0};try{await te(e),await H(),x("已应用保守设置")}catch(t){console.error("应用保守设置失败:",t),h("应用保守设置失败: "+t.message)}});document.getElementById("setLiberalLimitsBtn").addEventListener("click",async function(){const e={maxImageSize:1073741824,maxZipSize:21474836480,maxGeneralFile:53687091200,enableSizeCheck:!0};try{await te(e),await H(),x("已应用宽松设置")}catch(t){console.error("应用宽松设置失败:",t),h("应用宽松设置失败: "+t.message)}});function x(e){showMessage(e,"success")}function h(e){showMessage(e,"error")}function Me(){setInterval(ee,2e3),window.addEventListener("memoryWarning",cn),dn(),ee()}function ee(){if(!window.performanceUtils)return;const e=window.performanceUtils.getPerformanceReport(),t=document.getElementById("memoryUsage"),n=document.getElementById("sessionDuration"),s=document.getElementById("operationCount"),i=document.getElementById("avgOperationTime");if(t&&e.currentMemory&&(t.textContent=`${e.currentMemory.usagePercentage}%`,t.style.color=an(parseFloat(e.currentMemory.usagePercentage))),n){const o=Math.floor(e.sessionDuration/6e4),r=Math.floor(e.sessionDuration%6e4/1e3);n.textContent=`${o}分${r}秒`}s&&(s.textContent=e.totalOperations.toString()),i&&(i.textContent=`${e.averageOperationTime.toFixed(1)}ms`,i.style.color=ln(e.averageOperationTime))}function an(e){return e<50?"#10b981":e<80?"#f59e0b":"#ef4444"}function ln(e){return e<100?"#10b981":e<500?"#f59e0b":"#ef4444"}function cn(e){const t=document.getElementById("memoryWarning");t&&(t.classList.remove("hidden"),setTimeout(()=>{t.classList.add("hidden")},5e3)),console.warn("内存使用率过高:",e.detail),h("内存使用率过高，建议关闭不需要的预览或刷新页面")}function dn(){console.log("Setting up performance buttons...");const e=document.getElementById("refreshPerformanceBtn");e?(console.log("Found refresh button, adding event listener"),e.addEventListener("click",s=>{console.log("Refresh button clicked"),s.preventDefault(),e.disabled=!0,e.textContent="刷新中...";try{ee(),x("性能数据已刷新"),console.log("Performance data refreshed successfully")}catch(i){console.error("Error refreshing performance data:",i),h("刷新性能数据失败: "+i.message)}finally{setTimeout(()=>{e.disabled=!1,e.innerHTML=`
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                            <path d="M21 3v5h-5"/>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                            <path d="M3 21v-5h5"/>
                        </svg>
                        刷新数据
                    `},500)}})):console.warn("Refresh button not found in DOM");const t=document.getElementById("clearPerformanceBtn");t?(console.log("Found clear button, adding event listener"),t.addEventListener("click",async s=>{if(console.log("Clear button clicked"),s.preventDefault(),!!await De("确定要清除所有性能数据吗？此操作不可撤销。","清除性能数据","清除数据","取消")){t.disabled=!0,t.textContent="清除中...";try{if(window.performanceUtils)window.performanceUtils.performanceMetrics.operations=[],window.performanceUtils.performanceMetrics.memoryUsage=[],window.performanceUtils.performanceMetrics.sessionStart=Date.now(),ee(),x("性能数据已清除"),console.log("Performance data cleared successfully");else throw new Error("性能工具未初始化")}catch(o){console.error("Error clearing performance data:",o),h("清除性能数据失败: "+o.message)}finally{setTimeout(()=>{t.disabled=!1,t.innerHTML=`
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                        清除数据
                    `},500)}}})):console.warn("Clear button not found in DOM");const n=document.getElementById("exportPerformanceBtn");n?(console.log("Found export button, adding event listener"),n.addEventListener("click",s=>{console.log("Export button clicked"),s.preventDefault(),n.disabled=!0,n.textContent="导出中...";try{un(),console.log("Performance report exported successfully")}catch(i){console.error("Error exporting performance report:",i),h("导出性能报告失败: "+i.message)}finally{setTimeout(()=>{n.disabled=!1,n.innerHTML=`
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        导出报告
                    `},500)}})):console.warn("Export button not found in DOM")}function un(){if(!window.performanceUtils){h("性能工具未初始化");return}const e=window.performanceUtils.getPerformanceReport(),t={timestamp:new Date().toISOString(),sessionDuration:e.sessionDuration,totalOperations:e.totalOperations,averageOperationTime:e.averageOperationTime,slowOperations:e.slowOperations,currentMemory:e.currentMemory,memoryHistory:e.memoryHistory},n=JSON.stringify(t,null,2),s=new Blob([n],{type:"application/json"}),i=URL.createObjectURL(s),o=document.createElement("a");o.href=i,o.download=`performance-report-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i),x("性能报告已导出")}document.addEventListener("DOMContentLoaded",()=>{console.log("DOM loaded, initializing performance monitoring..."),setTimeout(()=>{window.performanceUtils?(console.log("Performance utils found, initializing monitoring"),Me()):(console.log("Performance utils not found, retrying in 1 second..."),setTimeout(()=>{window.performanceUtils?(console.log("Performance utils found on retry, initializing monitoring"),Me()):console.error("Performance utils still not available after retry")},1e3));try{mn()}catch(e){console.warn("Enhanced performance monitor failed to load:",e)}},100)});let ce=null;function mn(){const e=document.createElement("script");e.src="./enhanced-performance.js",e.onload=()=>{console.log("✅ 增强性能监控模块已加载"),pn()},e.onerror=t=>{console.warn("⚠️ 增强性能监控模块加载失败，使用基础监控功能",t)},document.head.appendChild(e)}function pn(){if(window.EnhancedPerformanceMonitor&&!ce){const e=document.getElementById("performance-monitor");e?(ce=new window.EnhancedPerformanceMonitor(e),ce.start(),console.log("✅ 增强性能监控已启动")):console.warn("⚠️ 未找到性能监控容器")}}
