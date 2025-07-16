import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../logger/logger';
import { Problem_info } from '../types/problem';


export class File_service {

    /**
     * 생성자로 Logger 클래스를 받는다.
     * @param logger 
     */
    constructor(private logger: Logger){}

    // 폴더가 있는지 확인하고 없으면 생성
    private create_folder_ifnot_exists(folder_path: string): void{
        if(!fs.existsSync(folder_path)){
            fs.mkdirSync(folder_path);
        }
    }

    /**
     * 
     * @param level 백준 api 레벨을 인자로 받음
     * @returns Bronze | Silver | Gold | Platinum | Diamond | Ruby
     */
    public get_tier(level: number){
        const tier_map: {[key: string]: number[]} ={
            'Bronze': [1, 2, 3, 4, 5],
            'Silver': [6, 7, 8, 9, 10],
            'Gold': [11, 12, 13, 14, 15],
            'Platinum': [16, 17, 18, 19, 20],
            'Diamond': [21, 22, 23, 24, 25],
            'Ruby': [26, 27, 28, 29, 30],
        };
        
        // 레벨 범위에 따라 상위 폴더 결정
        let tier = 'Unrated';
        for (const [name, range] of Object.entries(tier_map)){
            if (range.includes(level)){
                tier = name;
                break;
            }
        }

        return tier;
    }

    public get_tier_num(level:number){
        const elo = [
            '1', // 가장 쉬움
            '5', // 가장 어려움
            '4', 
            '3', 
            '2'
        ];

        return elo[level % 5];
    }


    /**
     * 레벨에 따라 폴더를생성, 그 경로를 반환 ex) Bronze\3
     * @param root_path 폴더 주소
     * @param level 백준 문제 레벨
     * @returns 문제 레벨 폴더 주소
     */
    public create_level_folder(root_path: string , level: number){
        
        var tier = this.get_tier(level);

        // 티어 폴더 없으면 생성
        var elo_path = path.join(root_path, tier);
        this.create_folder_ifnot_exists(elo_path);
        
        // Unrated는 하위 숫자 폴더 없음
        if(!(level === 0)){
            // 레벨 내부 숫자 (1~5 범위로 처리)
            var elo_path = path.join(elo_path, this.get_tier_num(level));
            if(!fs.existsSync(elo_path)){
                fs.mkdirSync(elo_path);
            } 
        }
    
        return elo_path;
    }

    /**
     * 문제 파일의 document(주소)를 얻는 함수
     * @param root_path 문제 레벨 폴더 주소
     * @param problem_info 문제 정보
     * @returns document
     */
    public async get_problem_file(root_path:string, problem_info: Problem_info){
        
        const elo_path = this.create_level_folder(root_path, problem_info.level);
        const problem_path =  path.join(elo_path, `baekjoon_${problem_info.problem_num}`);
        
        try {
            var files = fs.readdirSync(problem_path);
        } catch (err) {
            this.logger.log(err, `can't find folder: baekjoon_${problem_info.problem_num}`);
            return;
        }
        
        var file_path;

        try{
            for(const file of files){
                if(file === "main.cpp" || file ==="main.py"){
                    file_path = path.join(problem_path, file);
                }
            }
        }  catch (err) {
            this.logger.log(err, `can't find file: main.cpp or main.py`);
            return;
        }

        if(!file_path){
            return;
        }

        try{
            const document = await vscode.workspace.openTextDocument(file_path);
            return document;
        }catch(err){
            vscode.window.showErrorMessage(`파일을 여는 데 실패했습니다: ${err}`);
            this.logger.log(err, `cant read file : ${problem_path}`);
        }
    }


    /**
     * 문제 파일을 보여주는 함수
     * @param root_path 문제 레벨 폴더 주소
     * @param problem_info 문제 정보
     * @returns 
     */
    public async show_problem_file(root_path:string, problem_info: Problem_info){
        
        const document = await this.get_problem_file(root_path, problem_info);

        if(!document){
            return;
        }

        await vscode.window.showTextDocument(document);
    }

    /**
     * 문제 파일을 만듬
     * @param rootPath 현재 워크 스페이스 주소
     * @param problem_info 문제 정보
     * @param arg 문제 확장자
     * @returns 
     */
    public async create_problem_file(rootPath: string, problem_info: Problem_info, arg: string){
        const elo_path = this.create_level_folder(rootPath, problem_info.level);
        const problem_path =  path.join(elo_path, `baekjoon_${problem_info.problem_num}`);


        // 파일이 이미 있으면 
        if(fs.existsSync(problem_path)){
                    vscode.window.showWarningMessage(`${problem_info.problem_num}번 문제파일이 이미 존재 하고 있습니다.`,
                        {title: "열기", isCloseAffordance: false,},
                        {title: "취소", isCloseAffordance: true, }
                    ).then(selection => {
                        if(selection?.title === "열기"){
                            this.show_problem_file(rootPath,  problem_info);
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
            vscode.window.showInformationMessage(`백준 ${problem_info.problem_num}번 폴더 및 파일 생성 완료!`);
            const problem = path.join(problem_path, `${main_file}`);
            
            const document = await vscode.workspace.openTextDocument(problem);
            await vscode.window.showTextDocument(document);
        };
}
