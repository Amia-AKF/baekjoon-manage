import * as path from 'path';

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env')  });

const { Client } = require("@notionhq/client");
const { set_baek_properties } = require("./page");
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
            });
        } catch (error) {
            this.logger.log(error); 
        }
    }

    private make_rich_text(text_type:string, text_content:string){
        return {
            type: text_type,
            [text_type]: {
                rich_text: [
                    {   
                        type: "text",
                        text: {
                            content: text_content
                        },},],
            },
        };
    }
            

};
