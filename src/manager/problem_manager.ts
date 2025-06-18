import * as vscode from 'vscode';
import { Problem_service } from '../services/get_problem_service';
import { File_service } from '../services/file_service';
import { Notion_service } from '../services/notion/notion';


export class Problem_manager{
    
    
    constructor(private problem_service: Problem_service, private file_service: File_service){
    }

    /**
     * 
     * @param problem_service 문제 정보 가져오기
     * @returns problem_info
     */
    public async get_problem_info(){
        const problemNumber = await vscode.window.showInputBox({ prompt: "백준 문제 번호를 입력하세요" , placeHolder: "1000"},);
        
        if(!problemNumber){
            return;
        }
            
        const problem_info = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "백준 문제 정보 가져오는 중...",
            cancellable: false
        }, () => this.problem_service.fetch_problem_data(problemNumber));

        return problem_info;
    }
    
    public async create_vsfile(type: string){
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("작업 폴더를 먼저 열어주세요.");
            return;
        }
        
        const problem_info = await this.get_problem_info();
        
        if (!problem_info) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        this.file_service.create_problem_file(rootPath, problem_info, type);
    }

    public async create_notion_file(notion_service: Notion_service){
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("작업 폴더를 먼저 열어주세요.");
            return;
        }
        
        const problem_info = await this.get_problem_info();
        
        if (!problem_info) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        const items: vscode.QuickPickItem[] = [
    { label: "⭐", description: "쉬움" },
    { label: "⭐⭐", description: "보통" },
    { label: "⭐⭐⭐", description: "어려움" }
];

        let sub_lev = await vscode.window.showQuickPick(
            items, 
            {
                placeHolder: "주관적인 난이도를 선택하세요"
            }
        );
        let tags = await vscode.window.showQuickPick(
            ["DFS", "BFS", "이진 탐색","기타(직접 입력)"], 
            {
                canPickMany:true, 
                placeHolder: "알고리즘 유형을 선택하거나 직접 입력하세요",
                
            }
        );
        
        if(!sub_lev || !tags){
            return;
        }

        let final_tags = tags;

        if (tags.includes("기타(직접 입력)")){
            tags.pop();
            const input = await vscode.window.showInputBox({ 
                prompt: "직접 알고리즘 유형을 입력하세요", 
                placeHolder: "DFS",
                validateInput: text => text.trim() === "" ? "입력은 필수입니다." : null
            },);

            if(!input){
                return;
            }

            final_tags.push(input);
        }

        const tier = this.file_service.get_tier(problem_info.level);
        const tier_num = this.file_service.get_tier_num(problem_info.level);


        await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "노션에다 내용 쓰는 중",
                    cancellable: false
                }, () => notion_service.make_notion_page(problem_info.problem_num, problem_info.title_ko, tier + tier_num , "sub_lev", tags));
        }
    
    
}