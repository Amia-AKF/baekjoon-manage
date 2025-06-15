
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
                    "문제 이름": {
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
                    "알고리즘 유형": {
                        "multi_select": tags.map((tag) => ({name: tag}))
                    },
                };
    return tem;
}

module.exports = {set_baek_properties};