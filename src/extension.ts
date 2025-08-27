import * as vscode from 'vscode';
import { Logger } from './logger/logger';
import { Problem_manager } from './manager/problem_manager';
import { Notion_manager } from './manager/notion_manger';


export async function activate(context: vscode.ExtensionContext) {
    
    var config = vscode.workspace.getConfiguration('baekjoon-manage');
    const is_notion_active = config.get<boolean>('enableNotionFeature');

    
    const logger = new Logger();
    const problem_manager = new Problem_manager(logger);
    const notion_manager = new Notion_manager(logger, context, config);

    if(is_notion_active){
        notion_manager.init();
    }

    let create_baekjoon_cpp = vscode.commands.registerCommand('extension.createBaekjoonTemplate.cpp', async () =>{
        await problem_manager.create_vsfile('cpp');
    });

    let create_baekjoon_py = vscode.commands.registerCommand('extension.createBaekjoonTemplate.py', async () =>{
        await problem_manager.create_vsfile('py');
    });

    let create_notion_page_from_input = vscode.commands.registerCommand('extension.createNotionFromInput', async () =>{
       await notion_manager.upload_problem_from_input();
    });

    let create_notion_page_from_editor = vscode.commands.registerCommand('extension.createNotionFromEditor', async () =>{
       await notion_manager.upload_problem_from_editor();
    });

    let del_notion_token = vscode.commands.registerCommand('extension.delNotionToken', async () => {
        try{
            await context.secrets.delete('notion_token');
            vscode.window.showInformationMessage(`토큰 삭제 완료`);
        } catch (err){
            logger.log(err, "토큰 삭제 실패");
        }
    });

    let change_notion_token = vscode.commands.registerCommand('extension.changeNotionToken', async () => {
        try{
            await notion_manager.change_notion_token();
        } catch (err){
            vscode.window.showErrorMessage("토큰 변경 실패");
            logger.log(err, "토큰 변경 실패");
        }
    });

    let change_page_id = vscode.commands.registerCommand('extension.changeNotionDatabaseID', async () => {
        try{
            await notion_manager.change_database_id();
        } catch (err){
            vscode.window.showErrorMessage("id 변경 실패");
            logger.log(err, "id 변경 실패");
        }
    });

    vscode.workspace.onDidChangeConfiguration((event) => {

        config = vscode.workspace.getConfiguration('baekjoon-manage');

        if(event.affectsConfiguration('baekjoon-manage.enableNotionFeature')){
            const is_notion_active = config.get<boolean>('enableNotionFeature');

            if(is_notion_active){
                notion_manager.init();
            }
        }

        if(event.affectsConfiguration('baekjoon-manage.manageTags')){
            notion_manager.update_config(config);
        }

        if(event.affectsConfiguration('baekjoon-manage.database_id')){
            const id = config.get<string>('database_id');

            if (id){
                notion_manager.update_config(config);
                notion_manager.update_id(id);
            } else if (id === '') {
                //config.update("enableNotionFeature", false, vscode.ConfigurationTarget.Global)
            }
        }
    });

    context.subscriptions.push(create_baekjoon_cpp, create_baekjoon_py, create_notion_page_from_input, create_notion_page_from_editor, del_notion_token, change_notion_token, change_page_id);
}


export function deactivate() {}