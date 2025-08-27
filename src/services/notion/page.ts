type baek_properties = {
  number: number;
  title: string;
  official_level: string;
  sub_level: string;
  tags: string[];
};


/**
 * 
 * @param number 문제 번호
 * @param title 문제 제목
 * @param official_level 공식적인 티어
 * @param sub_level 주관적인 티어
 * @param tags 유형
 * @returns 
 */
function set_baek_properties({
    number,
    title,
    official_level,
    sub_level,
    tags
}: baek_properties){
    const tem = {
                    "문제 번호": {
                        "number": number
                    },
                    "문제 제목": {
                        title: [
                            {
                                text: {
                                    content: title,
                                },
                            },
                        ],
                    },
                    "공식 난이도": {
                        "select": {
                            "name": official_level
                        }
                    },
                    "주관 난이도": {
                        "select": {
                            "name": sub_level
                        }
                    },
                    "태그": {
                        "multi_select": tags.map((tag) => ({name: tag}))
                    },
                };
    return tem;
}

/**
 * 
 * @param text_type "paragraph", "bookmark" , "heading_2", "code" , ....
 * @param text_content 내용
 * @param link? link 
 * @param languages? 언어
 * @returns 
 */
function make_rich_text(text_type: string, text_content: string , options?: {link?: string, languages?: string}){
    
    const link = options?.link;
    const languages = options?.languages;
    
    const obj: any = {
            type: "text",
            text: {
                content: text_content
                }
        };

        if(link){
            obj.text.link = {url : link};
        }

        if(languages){
            return {
                type: text_type,
                [text_type]: {
                rich_text: [obj],
                language: languages
                },
            };
        }

        return {
            type: text_type,
            [text_type]: {
                rich_text: [obj],
            },
        };
    }



module.exports = {set_baek_properties, make_rich_text};
