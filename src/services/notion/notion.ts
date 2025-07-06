import * as path from 'path';

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env')  });

const { Client } = require("@notionhq/client");
const { set_baek_properties, make_rich_text } = require("./page");
import { Logger } from '../../logger/logger';

export class Notion_service {

    /**
    * 생성자로 Logger 클래스를 받는다.
    * @param logger 
    */
    constructor(private logger: Logger) { }

    private notion = new Client({
        auth: process.env.NOTION_TOKEN
    });


    
    public async make_notion_page(num: number, title_ko: string, off: string, sub: string, tag: string[], answer:string) {
        try {
            const response = await this.notion.pages.create({
                parent: { database_id: "21eabd467cac80caa72adfe267d95248" },
                properties: set_baek_properties({
                        number: num,
                        title: title_ko,
                        official_level: off,
                        sub_level: sub,
                        tags: tag,
                }),
                children: [
                    make_rich_text("heading_2" , `문제 개요`),
                    make_rich_text("heading_3" , 
`문제 번호 : ${num}
문제 제목 : ${title_ko}
난이도 : ${off} , ${sub}
유형 : ${tag}
`),
                    make_rich_text("heading_2", "🧠 해결 아이디어"),
                    make_rich_text("paragraph", ""),
                    make_rich_text("heading_2", "💻 풀이 코드 "),
                    make_rich_text("paragraph", ""),
                    make_rich_text("code", answer, {languages: "python"}),
                    make_rich_text("heading_2", "📌 메모 / 실수한 점")
                ]
            });
        } catch (error) {
            this.logger.log(error); 
        }
    } 
};
