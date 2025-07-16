import * as vscode from 'vscode';
import { Notion_service } from '../services/notion/notion';
import { File_service } from '../services/file_service';
import { Logger } from '../logger/logger';
import { Problem_service } from '../services/get_problem_service';
import { Problem_info } from '../types/problem';
import path from 'path';

export class Notion_manager {

    private problem_service: Problem_service;
    private file_service: File_service;
    private notion_service: Notion_service;

    private raw_tags: string;
    private tags: string[];

    constructor(private logger: Logger, private context: vscode.ExtensionContext, private config: vscode.WorkspaceConfiguration) {
        this.problem_service = new Problem_service(logger);
        this.file_service = new File_service(logger);
        this.notion_service = new Notion_service(logger);

        this.raw_tags = this.config.get<string>('manageTags') ?? '';
        this.tags = this.raw_tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }

    public update_config(config: vscode.WorkspaceConfiguration) {
        this.config = config;
    }
    
    public update_id(id: string){
        this.notion_service.set_database_id(id);
    }

    private isValidProblemNumber(str:string) {
        return /^\d+$/.test(str) && parseInt(str, 10) >= 1000;
    }

    private async check_enable_notion(){
        const token = await this.context.secrets.get("notion_token");
        const database_id = this.config.get<string>("database_id");

        if(!token || !database_id){
            const missing = [
                !token ? "Notion 토큰" : null,
                !database_id ? "페이지 ID" : null,
            ].filter(Boolean).join("와 ");

            vscode.window.showErrorMessage(`${missing}이(가) 설정되어 있지 않습니다.`);
            return true;
        }

        return false
    }

    public async create_notion_file(problem_info: Problem_info , document: vscode.TextDocument) {

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

        this.raw_tags = this.config.get<string>('manageTags') ?? '';
        this.tags = this.raw_tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        let tag = await vscode.window.showQuickPick(
            this.tags,
            {
                canPickMany: true,
                placeHolder: "알고리즘 유형을 선택하거나 직접 입력하려면 기타를 클릭 해주세요 (space로 선택)",

            }
        );

        if (!sub_lev || !tag) {
            return;
        }

        if (tag.includes("기타(직접 입력)")) {
            tag.pop();
            const input = await vscode.window.showInputBox({
                prompt: "알고리즘 유형을 입력하세요",
                validateInput: text => text.trim() === "" ? "입력은 필수입니다." : null
            },);

            if (!input) {
                return;
            }

            if (!this.tags.includes(input)) {
                this.tags.splice(this.tags.length - 1, 0, input);
            }

            if(!tag.includes(input)){
                tag.push(input);
            }

            await this.config.update("manageTags", this.tags.join(", "), vscode.ConfigurationTarget.Global);
        }

        const tier = this.file_service.get_tier(problem_info.level);
        const tier_num = this.file_service.get_tier_num(problem_info.level);

        const answer = document.getText();
        

        const notion_service = this.notion_service;

        const result = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "노션에다 내용 쓰는 중",
            cancellable: false
        }, () => notion_service.make_notion_page(problem_info.problem_num, problem_info.title_ko, tier + tier_num, sub_lev.label, tag, answer));

        if (result) {
            vscode.window.showInformationMessage(`문제 ${problem_info.problem_num}번 노션 파일 생성 완료!`);
        } else {
            vscode.window.showErrorMessage(`문제 ${problem_info.problem_num}번 노션 파일 생성 실패 ㅠㅠ`);
        }
    }

    public async upload_problem_from_input() {
        
        if(await this.check_enable_notion()){
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            vscode.window.showErrorMessage("작업 폴더를 먼저 열어주세요.");
            return;
        }

        const problemNumber = await vscode.window.showInputBox({ prompt: "백준 문제 번호를 입력하세요", placeHolder: "1000" },);

        if (!problemNumber) {
            return;
        }

        const problem_info = await this.get_problem_info(problemNumber);

        if (!problem_info) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const document = await this.file_service.get_problem_file(rootPath, problem_info);

        if(!document){
            return
        }

        await this.create_notion_file(problem_info, document)
    }

    public async upload_problem_from_editor(){
        
        if(await this.check_enable_notion()){
            return;
        }
        
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showWarningMessage("현재 열려 있는 에디터가 없습니다.");
            return;
        }

        const document = editor.document;
        const folder_name = path.basename(path.dirname(document.uri.fsPath));

        const match = folder_name.match(/^baekjoon_(\d+)$/);

        if (!match) {
            vscode.window.showWarningMessage("현재 에디터가 백준 문제형식이 아닙니다.");
            return;
        }

        const problemNumber = match[1];

        const problem_info = await this.get_problem_info(problemNumber);

        if (!problem_info) {
            vscode.window.showErrorMessage("문제 정보를 가져오는데 실패했습니다.");
            return;
        }

        await this.create_notion_file(problem_info, document)
    }


    public async init() {
        let token = await this.context.secrets.get("notion_token");
        let database_id = this.config.get<string>("database_id");

        if (token && database_id) {
            this.notion_service.set_client(token);
            this.notion_service.set_database_id(database_id);
            return;
        }

        if (!token) {
            let selected = await vscode.window.showErrorMessage(
                "토큰이 없습니다. 토큰을 입력하겠습니까?"
                , { title: "입력", isCloseAffordance: false }
                , { title: "취소", isCloseAffordance: true }
            );

            if (selected?.title === "입력") {
                await this.get_notion_token();
            } else {
                vscode.window.showErrorMessage("토큰을 입력해야 노션 기능을 이용 가능합니다.");
                //this.config.update("enableNotionFeature", false, vscode.ConfigurationTarget.Global);
                return;
            };
        }

        if (!database_id) {
            let selected = await vscode.window.showErrorMessage(
                "database_id가 없습니다. 입력하겠습니까?"
                , { title: "입력", isCloseAffordance: false }
                , { title: "취소", isCloseAffordance: true }
            );

            if (selected?.title === "입력") {
                await this.get_database_id();
            } else {
                vscode.window.showErrorMessage("database_id을 입력해야 노션 기능을 이용 가능합니다.");
                //this.config.update("enableNotionFeature", false, vscode.ConfigurationTarget.Global);
                return;
            };
        }


    }

    public async change_notion_token() {
        let token = await this.context.secrets.get("notion_token");
        if (token) {
            var selected = await vscode.window.showInformationMessage(
                "토큰이 이미 존재합니다. 변경하시겠습니까?",
                { title: "변경", isCloseAffordance: false },
                { title: "취소", isCloseAffordance: true }
            );

            if (selected?.title === "취소") {
                return;
            }
        }

        this.get_notion_token();
    }

    public async get_notion_token() {
        const token = await vscode.window.showInputBox({
            prompt: "토큰 입력",
            password: true,
            ignoreFocusOut: true,
            placeHolder: "ntn_XXXXX...",
        });

        if (token) {
            vscode.window.showInformationMessage(`토큰이 입력 되었습니다.`);
            await this.context.secrets.store('notion_token', token);
            this.notion_service.set_client(token);
            return;
        }

        this.config.update("enableNotionFeature", false, vscode.ConfigurationTarget.Global);
        return;
    }

    public async change_database_id() {
        let database_id = this.config.get<string>("database_id");
        if (database_id) {
            var selected = await vscode.window.showInformationMessage(
                "id 이미 존재합니다. 변경하시겠습니까?",
                { title: "변경", isCloseAffordance: false },
                { title: "취소", isCloseAffordance: true }
            );

            if (selected?.title === "취소") {
                return;
            }
        }

        this.get_database_id();
    }

    public async get_database_id() {
        const database_id = await vscode.window.showInputBox({
            prompt: "id 입력",
            ignoreFocusOut: true,
        });

        if (database_id) {
            vscode.window.showInformationMessage(`id가 입력 되었습니다.`);
            this.notion_service.set_database_id(database_id);
            this.config.update("database_id", database_id, vscode.ConfigurationTarget.Global);
            return;
        }

        this.config.update("enableNotionFeature", false, vscode.ConfigurationTarget.Global);
        return;

    }

    private async get_problem_info(problemNumber: string) {

        if (!this.isValidProblemNumber(problemNumber)) {
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
}