import * as vscode from 'vscode';
import { Logger } from './logger/logger';
import { File_service } from './services/file_service';
import { Problem_service} from './services/get_problem_service';
import { Notion_service } from './services/notion/notion';

export function activate(context: vscode.ExtensionContext) {
    const logger = new Logger();
    const file_service = new File_service(logger);
    const problem_service = new Problem_service(logger);
    const notion_service = new Notion_service(logger);
    
    let create_baekjoon_cpp = vscode.commands.registerCommand('extension.createBaekjoonTemplate.cpp', async () =>{
        await create_file(problem_service, file_service, 'cpp');

    });

    let create_baekjoon_py = vscode.commands.registerCommand('extension.createBaekjoonTemplate.py', async () =>{
        await create_file(problem_service, file_service, 'py');
    });

    let create_baek_notion_page = vscode.commands.registerCommand('extension.BaekjoonTemplate', async () =>{
        await notion_service.make_notion_page();
    });

    context.subscriptions.push(create_baekjoon_cpp, create_baekjoon_py, create_baek_notion_page);
}

async function create_file(problem_service: Problem_service, file_service: File_service, type: string){
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("작업 폴더를 먼저 열어주세요.");
        return;
    }
        
    const problemNumber = await vscode.window.showInputBox({ prompt: "백준 문제 번호를 입력하세요" });
    
    if(!problemNumber){
        return;
    }
        
    if (isNaN(parseInt(problemNumber)) === true || parseInt(problemNumber) < 0 ) {
        vscode.window.showErrorMessage("숫자를 입력 해주세요.");
        return;
    }

    const problem_info = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "백준 문제 정보 가져오는 중...",
        cancellable: false
    }, () => problem_service.fetch_problem_data(problemNumber));

    if (!problem_info) {
        vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    file_service.create_problem_file(rootPath, problem_info, type);

}

export function deactivate() {}