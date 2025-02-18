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
    
    create_problem_file(rootPath: string, problem_info: Problem_info){
        const elo_path = this.create_level_floder(rootPath, problem_info.level);
        const problem_path =  path.join(elo_path, `backjoon_${problem_info.problem_num}`);

        if(fs.existsSync(problem_path)){
                    vscode.window.showWarningMessage(`${problem_info.problem_num}번 문제파일이 이미 존재 하고 있습니다.`);
                    return;
            }

        fs.mkdirSync(problem_path);
        
        const main_content = `/* 
* 백준 ${problem_info.problem_num}번 : ${problem_info.title_ko}
*
* 문제 주소 : https://www.acmicpc.net/problem/${problem_info.problem_num}
*/
        
#include <iostream>
using namespace std;
        
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);
            
            
    return 0;
}`;
        
        
            fs.writeFileSync(path.join(problem_path, 'main.cpp'), main_content);
            fs.writeFileSync(path.join(problem_path, 'solution process.txt'), '');
            vscode.window.showInformationMessage(`백준 ${problem_info.problem_num}번 폴더 및 파일 생성 완료!`);
        };
}
