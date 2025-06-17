import * as vscode from 'vscode';
import { Problem_service } from '../services/get_problem_service';
import { File_service } from '../services/file_service';
import { Notion_service } from '../services/notion/notion';
import { options } from 'axios';


export class Problem_manager{
    constructor(){
    }


    /**
     * 
     * @param problem_service 로 문제 정보 가져오기
     * @returns problem_info
     */
    public async get_problem_info(problem_service: Problem_service){
        const problemNumber = await vscode.window.showInputBox({ prompt: "백준 문제 번호를 입력하세요" });
        
        if(!problemNumber){
            return;
        }
            
        const problem_info = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "백준 문제 정보 가져오는 중...",
            cancellable: false
        }, () => problem_service.fetch_problem_data(problemNumber));

        return problem_info
    }
    
    public async create_vsfile(problem_service: Problem_service, file_service: File_service, type: string){
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("작업 폴더를 먼저 열어주세요.");
            return;
        }
        
        const problem_info = await this.get_problem_info(problem_service)
        
        if (!problem_info) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        file_service.create_problem_file(rootPath, problem_info, type);
    }

    public async create_notion_file(problem_service: Problem_service, notion_service: Notion_service, file_service: File_service){
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("작업 폴더를 먼저 열어주세요.");
            return;
        }
        
        const problem_info = await this.get_problem_info(problem_service)
        
        if (!problem_info) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        let sub_lev = await vscode.window.showQuickPick(["⭐", "⭐⭐", "⭐⭐⭐","⭐⭐⭐⭐","⭐⭐⭐⭐⭐"], {placeHolder: "주관적인 난이도"})
        let tags = await vscode.window.showQuickPick(["a", "b", "c"], {canPickMany:true, placeHolder: "문제 유형"} )
        

        if(!sub_lev || !tags){
            return
        }

        const tier = file_service.get_tier(problem_info.level)
        const tier_num = file_service.get_tier_num(problem_info.level)


        await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "노션에다 내용 쓰는 중",
                    cancellable: false
                }, () => notion_service.make_notion_page(problem_info.problem_num, problem_info.title_ko, tier + tier_num , sub_lev, tags));
        }
    
    
}