import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../logger/logger';
import { Problem_info } from '../types/problem';

export class File_service {
    constructor(private logger: Logger){}

    create_level_floder(rootPath: string , level: number){
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
    
    async get_problem_file(rootPath:string, problem_info: Problem_info){
        const elo_path = this.create_level_floder(rootPath, problem_info.level);
        const problem_path =  path.join(elo_path, `backjoon_${problem_info.problem_num}`);
        const files = fs.readdirSync(problem_path);
        var file_path;

        try{
            for(const file of files){
                if(file === "main.cpp" || file ==="main.py"){
                    file_path = path.join(problem_path, file);
                }
            }
        }  catch (err) {
            this.logger.log(err, `cant find file: main.cpp of main.py`);
        }
        
        if(!file_path){
            return;
        }

        try{
            const document = await vscode.workspace.openTextDocument(file_path);
            await vscode.window.showTextDocument(document);
        }catch(err){
            vscode.window.showErrorMessage(`파일을 여는 데 실패했습니다: ${err}`);
            this.logger.log(err, `cant read file : ${problem_path}`);
        }

    }


    async create_problem_file(rootPath: string, problem_info: Problem_info, arg: string){
        const elo_path = this.create_level_floder(rootPath, problem_info.level);
        const problem_path =  path.join(elo_path, `backjoon_${problem_info.problem_num}`);

        if(fs.existsSync(problem_path)){
                    vscode.window.showWarningMessage(`${problem_info.problem_num}번 문제파일이 이미 존재 하고 있습니다.`,
                        {
                            title: "열기",
                            isCloseAffordance: false,
                        },
                        {
                            title: "취소",
                            isCloseAffordance: true,
                        }
                    ).then(selection => {
                        if(selection?.title === "열기"){
                            this.get_problem_file(rootPath,  problem_info);
                            return;
                        }
                    });
                    return;
            }

        fs.mkdirSync(problem_path);
        var main_content;
        if(arg === `cpp`){
            main_content = `/* 
* 백준 ${problem_info.problem_num}번 : ${problem_info.title_ko}
*
* 문제 주소 : https://www.acmicpc.net/problem/${problem_info.problem_num}
*/
        
#include <iostream>
using namespace std;
        
int main() {
    
            
    return 0;
}`;
        } else if(arg === `py`){
            main_content = `#
# 백준 ${problem_info.problem_num}번 : ${problem_info.title_ko}
#
# 문제 주소 : https://www.acmicpc.net/problem/${problem_info.problem_num}
#

`;      
        } else {
            this.logger.log(new Error(`expected arg : cpp or py , but arg is ${arg}`));
            return;
        }
        
            const main_file = `main.${arg}`;
            fs.writeFileSync(path.join(problem_path, `${main_file}`), main_content);
            fs.writeFileSync(path.join(problem_path, 'solution process.txt'), '');
            vscode.window.showInformationMessage(`백준 ${problem_info.problem_num}번 폴더 및 파일 생성 완료!`);
            const problem = path.join(problem_path, `${main_file}`);
            const document = await vscode.workspace.openTextDocument(problem);
            await vscode.window.showTextDocument(document);
        };
}
