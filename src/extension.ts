import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

    
/**
 * solved.ac api를 이용해 문제 정보 가져오기
 * @param problemNumber 문제번호
 * @returns data (data.level , data.level)
 */
async function fetchProblemData(problemNumber: string) {
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
        console.error('문제 정보를 가져오는데 실패했습니다:', error);
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
    let disposable = vscode.commands.registerCommand('extension.createBaekjoonTemplate', async () =>{
        const problemNumber = await vscode.window.showInputBox({ prompt: "백준 문제 번호를 입력하세요" });
        if (!problemNumber) {return;}
    
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("작업 폴더를 먼저 열어주세요.");
            return;
        }


        const problem_data = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "백준 문제 정보 가져오는 중...",
            cancellable: false
        }, () => fetchProblemData(problemNumber));

        if (!problem_data) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const elo_path = create_level_floder(rootPath, problem_data.level);
        const problem_path =  path.join(elo_path, `백준_${problemNumber}번`);

        if(fs.existsSync(problem_path)){
            vscode.window.showErrorMessage(`${problemNumber}번 문제파일이 이미 존재 하고 있습니다.`);
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
        vscode.window.showInformationMessage(`백준 ${problemNumber}번 폴더 및 파일 생성 완료!`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}