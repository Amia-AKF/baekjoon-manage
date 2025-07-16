import * as vscode from 'vscode';
import { Problem_service } from '../services/get_problem_service';
import { File_service } from '../services/file_service';
import { Logger } from '../logger/logger';


export class Problem_manager{
    
    private problem_service: Problem_service;
    private file_service: File_service;

    constructor(private logger: Logger){
        this.problem_service = new Problem_service(logger);
        this.file_service = new File_service(logger);
    }

    /**
     * 문제 정보 가져오기
     * @returns problem_info
     */
    private async get_problem_info(problemNumber: string){

        if (!this.isValidProblemNumber(problemNumber)) {
            vscode.window.showErrorMessage("1000 이상인 숫자를 입력 해주세요.");
            return;
        }

        const problem_info = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "백준 문제 정보 가져오는 중...",
            cancellable: false
        }, () => this.problem_service.fetch_problem_data(problemNumber));

        return problem_info;
    }
    
    /**
     * vs code 폴더 및 파일 생성
     * @param type 확장자
     * @returns 
     */
    public async create_vsfile(type: string){
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("작업 폴더를 먼저 열어주세요.");
            return;
        }
        
        const problemNumber = await vscode.window.showInputBox({ prompt: "백준 문제 번호를 입력하세요" , placeHolder: "1000"},);
        
        if(!problemNumber){
            return;
        }

        const problem_info = await this.get_problem_info(problemNumber);
        
        if (!problem_info) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        this.file_service.create_problem_file(rootPath, problem_info, type);
    }

    private isValidProblemNumber(str:string) {
        return /^\d+$/.test(str) && parseInt(str, 10) >= 1000;
    }
}