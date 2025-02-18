import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class Logger {
    private log_path: string;
    private log_file: string;

    constructor(){
        const folders = vscode.workspace.workspaceFolders;
        if(!folders) {
            this.log(new Error('No workspace folder is open'));
            throw new Error('No workspace folder is open');
        }
        
        this.log_path = path.join(folders[0].uri.fsPath, 'logs');
        this.log_file = path.join(this.log_path, 'error.log');

        if(!fs.existsSync(this.log_path)){
            fs.mkdirSync(this.log_path);
        }
    }

    public log(error: any, additional_info: string = ''){
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

    private check_log_size(){
        try {
            const stats = fs.statSync(this.log_file);
            if (stats.size > 1024 * 1024){
                fs.writeFileSync(this.log_file, '');
                this.log(new Error('Log file was cleared due to size limit'));
            }
        } catch (err){
            this.log(new Error(`Error checking log file size: ${err}`));
        }
    }


}