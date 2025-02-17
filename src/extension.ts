import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

class Logger {
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


/**
 * solved.ac api를 이용해 문제 정보 가져오기
 * @param problemNumber 문제번호
 * @returns data
 */
async function fetchProblemData(problemNumber: string, logger: Logger) {
    const options = {
        method: 'GET',
        url: 'https://solved.ac/api/v3/problem/show',
        params: { problemId: problemNumber },
        headers: { 'x-solvedac-language': 'ko', Accept: 'application/json' }
      };
    
      try {
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        logger.log(error, `Problem number: ${problemNumber}, solved.ac api error`);
        return null;
      }
}

function create_level_floder(rootPath: string , level: number){
    const elo = [
        '1',
        '5', 
        '4', 
        '3', 
        '2'
    ];
    
    var level_path;
    if (level === 0) {
        level_path = 'Unrated';
    } else if (level >= 26 && level <= 30) {
        level_path = 'Ruby';
    } else if (level >= 21 && level <= 25) {
        level_path = 'Diamond';
    } else if (level >= 16 && level <= 20) {
        level_path = 'Platinum';
    } else if (level >= 11 && level <= 15) {
        level_path = 'Gold';
    } else if (level >= 6 && level <= 10) {
        level_path = 'Silver';
    } else if (level >= 1 && level <= 5) {
        level_path = 'Bronze';
    }

    var elo_path = path.join(rootPath, `${level_path}`);

    if(!fs.existsSync(elo_path)){
        fs.mkdirSync(elo_path);
    } 

    if(!(level === 0)){
        var elo_path = path.join(elo_path, elo[level % 5]);
        if(!fs.existsSync(elo_path)){
            fs.mkdirSync(elo_path);
        } 
    }

    return elo_path;
}

export function activate(context: vscode.ExtensionContext) {
    const logger = new Logger();
    
    let disposable = vscode.commands.registerCommand('extension.createBaekjoonTemplate', async () =>{
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("작업 폴더를 먼저 열어주세요.");
            return;
        }
        
        const problemNumber = await vscode.window.showInputBox({ prompt: "백준 문제 번호를 입력하세요" });
        if (!problemNumber || isNaN(parseInt(problemNumber)) === true || parseInt(problemNumber) < 0 ) {
            vscode.window.showErrorMessage("숫자를 입력 해주세요.");
            return;
        }

        const problem_data = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "백준 문제 정보 가져오는 중...",
            cancellable: false
        }, () => fetchProblemData(problemNumber, logger));

        if (!problem_data) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const elo_path = create_level_floder(rootPath, problem_data.level);
        const problem_path =  path.join(elo_path, `백준_${problemNumber}번`);

        if(fs.existsSync(problem_path)){
            vscode.window.showWarningMessage(`${problemNumber}번 문제파일이 이미 존재 하고 있습니다.`);
            return;
        }
        
        fs.mkdirSync(problem_path);

        const main_content = `/* 
* 백준 ${problemNumber}번 : ${problem_data.titleKo}
*
* 문제 주소 : https://www.acmicpc.net/problem/${problemNumber}
*/

#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);
    
    
    return 0;
}`;


        fs.writeFileSync(path.join(problem_path, 'main.cpp'), main_content);
        fs.writeFileSync(path.join(problem_path, 'solution process.txt'), '');
        vscode.window.showInformationMessage(`백준 ${problemNumber}번 폴더 및 파일 생성 완료!`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}