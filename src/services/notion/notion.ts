import * as path from 'path';

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env')  });

const { Client } = require("@notionhq/client");
const { set_baek_properties, make_rich_text } = require("./page");
import { Logger } from '../../logger/logger';
import { languages } from 'vscode';

export class Notion_service {

    /**
    * 생성자로 Logger 클래스를 받는다.
    * @param logger 
    */
    constructor(private logger: Logger) { }

    private notion = new Client({
        auth: process.env.NOTION_TOKEN
    });


    
    public async make_notion_page(num: number, title_ko: string, off: string, sub: string, tag: string[]) {
        try {
            const response = await this.notion.pages.create({
                parent: { database_id: "20f93ee51b77808fb77ce52aa529ed27" },
                properties: set_baek_properties({
                        number: num,
                        title: title_ko,
                        official_level: off,
                        sub_level: sub,
                        tags: tag,
                }),
                children: [
                    make_rich_text({text_type: "heading_2" ,  text_content:`문제 개요`}),
                    make_rich_text({text_type: "heading_3" ,  text_content:
`문제 번호 : ${num}
문제 제목 : ${title_ko}
난이도 : ${off} , ${sub}
유형 : ${tag}
`}),
                    make_rich_text({text_type: "heading_2", text_content: "🧠 해결 아이디어"}),
                    make_rich_text({text_type: "paragraph", text_content: ""}),
                    make_rich_text({text_type: "heading_2", text_content: "💻 풀이 코드 "}),
                    make_rich_text({text_type: "paragraph", text_content: ""}),
                    make_rich_text({text_type: "code", text_content: "여기에 코드 작성", languages: "python"}),
                    make_rich_text({text_type: "heading_2", text_content:"📌 메모 / 실수한 점"})
                ]
            });
        } catch (error) {
            this.logger.log(error); 
        }
    } 
};
