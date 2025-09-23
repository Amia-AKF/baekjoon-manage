const { set_baek_properties, make_rich_text } = require("./page");
import { Logger } from '../../logger/logger';
import { Client } from '@notionhq/client';

export class Notion_service {

    private notion!: Client;
    private token!: string;
    private database_id!: string;

    /**
    * 생성자로 Logger 클래스를 받는다.
    * @param logger 
    */
    constructor(private logger: Logger) 
    {
    }

    public set_client(token: string){
        
        if (this.token === token && this.notion) {
        // 똑같은 토큰이면 새로 만들 필요 없음
        return;
        }
        this.token = token;
        this.notion = new Client({ auth: this.token });
    }

    public set_database_id(id: string){
        this.database_id = id;
    }

    public async make_notion_page(num: number, title_ko: string, off: string, sub: string, tag: string[], answer:string) {
        try {
            const response = await this.notion.pages.create({
                parent: { database_id: this.database_id }, 
                properties: set_baek_properties({
                        number: num,
                        title: title_ko,
                        official_level: off,
                        sub_level: sub,
                        tags: tag,
                }),
                children: [
                    make_rich_text("heading_3" , 
`문제 번호 : ${num}
문제 제목 : ${title_ko}
난이도 : ${off} , ${sub}
유형 : ${tag.join(", ")}`),
                    make_rich_text("heading_2", "해결 아이디어"),
                    make_rich_text("paragraph", ""),
                    make_rich_text("heading_2", "풀이 코드 "),
                    make_rich_text("code", answer, {languages: 'python'}),
                ]
            });
            return true;
        } catch (error) {
            this.logger.log(error, "노션 페이지 생성 오류(토큰, 페이지 id 등등)"); 
            return false;
        }
    } 
};
