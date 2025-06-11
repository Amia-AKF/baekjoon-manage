import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Logger 클래스는 VS Code 워크스페이스 내에 로그 파일을 생성하고,
 * 오류 메시지를 기록하며 로그 크기를 관리합니다.
 */
export class Logger {
    private log_path: string;
    private log_file: string;

    /**
     *  생성자
     *  folders = 현재 열고 있는 워크스페이스
     *  log_path = folders/logs
     *  log_file = folders/logs/error.log
     */
    constructor(){
        const folders = vscode.workspace.workspaceFolders;   
        
        if(!folders) {
            const error = new Error('No workspace folder is open');
            this.log(error);
            throw error;
        }
        
        this.log_path = path.join(folders[0].uri.fsPath, 'logs');
        this.log_file = path.join(this.log_path, 'error.log');

        if(!fs.existsSync(this.log_path)){
            fs.mkdirSync(this.log_path);
        }
    }

    /**
     * 오류 로그를 파일에 기록.
     * @param error 오류 객체
     * @param additional_info 추가 정보 문자열 (선택)
     */
    public log(error: any, additional_info: string = ''): void {
        const time_stamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        const error_message = error.message || error.toSring();
        const stack_trace = error.stack || 'No stack trace available';

        const log_entry = `
[${time_stamp}]
Error: ${error_message}
Additional Info: ${additional_info}
Stack Trace: ${stack_trace}        
--------------------------------------
`;
        fs.appendFileSync(this.log_file, log_entry);
        this.check_log_size();
    }
    /**
     *  로그 파일의 크기를 검사하고 1MB를 초과할 경우 초기화합니다.
     */
    private check_log_size(): void{
        try {
            const stats = fs.statSync(this.log_file);

            if (stats.size > 1024 * 1024){ // 1MB
                fs.writeFileSync(this.log_file, '');
                this.log(new Error('Log file was cleared due to size limit'));
            }
        } catch (err){
            this.log(err, 'Error checking log file size');
        }
    }


}