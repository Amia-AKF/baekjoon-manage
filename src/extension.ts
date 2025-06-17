import * as vscode from 'vscode';
import { Logger } from './logger/logger';
import { File_service } from './services/file_service';
import { Problem_service} from './services/get_problem_service';
import { Notion_service } from './services/notion/notion';
import { Problem_manager } from './manager/problem_manager';


export function activate(context: vscode.ExtensionContext) {
    const logger = new Logger();
    const file_service = new File_service(logger);
    const problem_service = new Problem_service(logger);
    const notion_service = new Notion_service(logger);
    const problem_manager = new Problem_manager();


    let create_baekjoon_cpp = vscode.commands.registerCommand('extension.createBaekjoonTemplate.cpp', async () =>{
        await problem_manager.create_vsfile(problem_service, file_service, 'cpp');

    });

    let create_baekjoon_py = vscode.commands.registerCommand('extension.createBaekjoonTemplate.py', async () =>{
        await problem_manager.create_vsfile(problem_service, file_service, 'py');
    });

    let create_baek_notion_page = vscode.commands.registerCommand('extension.BaekjoonTemplate', async () =>{
       await problem_manager.create_notion_file(problem_service, notion_service, file_service)
    });

    context.subscriptions.push(create_baekjoon_cpp, create_baekjoon_py, create_baek_notion_page);
}


export function deactivate() {}