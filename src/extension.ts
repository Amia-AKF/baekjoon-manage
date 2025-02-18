import * as vscode from 'vscode';
import { Logger } from './logger/logger';
import { File_service } from './services/file_service';
import { Problem_service} from './services/get_problem_service';

export function activate(context: vscode.ExtensionContext) {
    const logger = new Logger();
    const file_service = new File_service(logger);
    const problem_service = new Problem_service(logger);

    let create_backjoon_command = vscode.commands.registerCommand('extension.createBaekjoonTemplate', async () =>{
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

        const problem_info = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "백준 문제 정보 가져오는 중...",
            cancellable: false
        }, () => problem_service.fetchProblemData(problemNumber));

        if (!problem_info) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        file_service.create_problem_file(rootPath, problem_info);
    });

    let open_backjoon_command = vscode.commands.registerCommand('extension.openBaekjoonFolder', async () => {
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

        const problem_info = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "백준 문제 정보 가져오는 중...",
            cancellable: false
        }, () => problem_service.fetchProblemData(problemNumber));

        if (!problem_info) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        file_service.get_problem_file(rootPath, problem_info);

    });

    context.subscriptions.push(create_backjoon_command);
}

export function deactivate() {}