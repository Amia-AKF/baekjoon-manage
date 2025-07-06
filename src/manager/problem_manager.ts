import * as vscode from 'vscode';
import { Problem_service } from '../services/get_problem_service';
import { File_service } from '../services/file_service';
import { Notion_service } from '../services/notion/notion';


export class Problem_manager{

    private config = vscode.workspace.getConfiguration('baekjoon-manage');
    private raw_tags = this.config.get<string>('manageTags') ?? '';
    private tags = this.raw_tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
        
    
    
    constructor(private problem_service: Problem_service, private file_service: File_service){
    }

    /**
     * 문제 정보 가져오기
     * @returns problem_info
     */
    private async get_problem_info(){
        const problemNumber = await vscode.window.showInputBox({ prompt: "백준 문제 번호를 입력하세요" , placeHolder: "1000"},);
        
        if(!problemNumber){
            return;
        }
            
        if (isNaN(parseInt(problemNumber)) === true || parseInt(problemNumber) < 1000 ) {
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
            { label: "⭐",     description: "쉬움" },
            { label: "⭐⭐",   description: "보통" },
            { label: "⭐⭐⭐", description: "어려움" }
        ];

        let sub_lev = await vscode.window.showQuickPick(
            items, 
            {
                placeHolder: "주관적인 난이도를 선택하세요"
            }
        );

        let tag = await vscode.window.showQuickPick(
            this.tags, 
            {
                canPickMany:true, 
                placeHolder: "알고리즘 유형을 선택하거나 직접 입력 하려면 기타를 클릭 해주세요 (space)",
                
            }
        );
        
        if(!sub_lev || !tag){
            return;
        }


        if (tag.includes("기타(직접 입력)")){
            tag.pop();
            const input = await vscode.window.showInputBox({ 
                prompt: "알고리즘 유형을 입력하세요", 
                validateInput: text => text.trim() === "" ? "입력은 필수입니다." : null
            },);

            if(!input){
                return;
            }

            if (!this.tags.includes(input)){
                this.tags.splice(this.tags.length - 1, 0, input);
            }
             
            tag.push(input);
            await this.config.update("manageTags", this.tags, vscode.ConfigurationTarget.Workspace);
        }

        const tier = this.file_service.get_tier(problem_info.level);
        const tier_num = this.file_service.get_tier_num(problem_info.level);

        const editer = vscode.window.activeTextEditor;
        
        if(!editer){
            return;
        }

        const document = editer.document;
        const answer = document.getText();

        await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "노션에다 내용 쓰는 중",
                    cancellable: false
                }, () => notion_service.make_notion_page(problem_info.problem_num, problem_info.title_ko, tier + tier_num , sub_lev.label, tag, answer));
            
        vscode.window.showInformationMessage(`문제 ${problem_info.problem_num}번 노션 파일 생성 완료!`);
    }
    

    
}